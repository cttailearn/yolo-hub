"""
训练服务
"""
import asyncio
import json
import logging
import signal
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from server.db import TrainTask, Metric, Dataset, Model
from server.config import settings
from server.websocket import manager
from server.utils import create_data_yaml, write_classes

logger = logging.getLogger(__name__)


class TrainingProcess:
    """训练进程管理"""

    def __init__(self, task_id: str):
        self.task_id = task_id
        self.process: Optional[subprocess.Popen] = None
        self.is_paused = False
        self._stop_event = asyncio.Event()

    def start(self, command: list, cwd: str):
        """启动训练进程"""
        self.process = subprocess.Popen(
            command,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        logger.info(f"训练进程启动: {self.task_id}, PID: {self.process.pid}")

    def pause(self):
        """暂停训练"""
        if self.process and not self.is_paused:
            self.is_paused = True
            if sys.platform == "win32":
                # Windows: 发送信号暂停进程
                self.process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                # Unix: 发送 SIGSTOP 信号
                self.process.send_signal(signal.SIGSTOP)

    def resume(self):
        """恢复训练"""
        if self.process and self.is_paused:
            if sys.platform == "win32":
                self.process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                self.process.send_signal(signal.SIGCONT)
            self.is_paused = False

    def stop(self):
        """停止训练"""
        self._stop_event.set()
        if self.process:
            if sys.platform == "win32":
                self.process.terminate()
            else:
                self.process.send_signal(signal.SIGTERM)

            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()

        logger.info(f"训练进程已停止: {self.task_id}")


class TrainService:
    """训练服务"""

    def __init__(self):
        self._training_queue: list[str] = []
        self._running_tasks: dict[str, TrainingProcess] = {}
        self._task_locks: dict[str, asyncio.Lock] = {}

    def add_to_queue(self, task_id: str) -> int:
        """添加任务到队列"""
        if task_id not in self._training_queue:
            self._training_queue.append(task_id)
        return len(self._training_queue)

    def get_queue_position(self, task_id: str) -> int:
        """获取任务在队列中的位置"""
        try:
            return self._training_queue.index(task_id) + 1
        except ValueError:
            return 0

    async def start_training(self, task_id: str, db: Session):
        """启动训练"""
        if task_id in self._running_tasks:
            logger.warning(f"任务已在运行: {task_id}")
            return

        task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
        if not task:
            logger.error(f"任务不存在: {task_id}")
            return

        # 获取数据集
        dataset = db.query(Dataset).filter(Dataset.id == task.dataset_id).first()
        if not dataset:
            logger.error(f"数据集不存在: {task.dataset_id}")
            return

        # 更新任务状态
        task.status = "running"
        task.started_at = datetime.utcnow()
        db.commit()

        # 创建训练进程
        process = TrainingProcess(task_id)
        self._running_tasks[task_id] = process

        # 在后台线程中运行训练
        threading.Thread(
            target=self._run_training,
            args=(task_id, dataset, task, db),
            daemon=True,
        ).start()

        logger.info(f"训练任务已启动: {task_id}")

    def _run_training(self, task_id: str, dataset: Dataset, task: TrainTask, db: Session):
        """运行训练（在线程中）"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            loop.run_until_complete(self._training_loop(task_id, dataset, task, db))
        except Exception as e:
            logger.exception(f"训练异常: {task_id}, {e}")
            loop.run_until_complete(self._handle_training_error(task_id, db, str(e)))
        finally:
            loop.close()

    async def _training_loop(self, task_id: str, dataset: Dataset, task: TrainTask, db: Session):
        """训练循环"""
        process = self._running_tasks.get(task_id)
        if not process:
            return

        # 准备训练目录
        train_dir = settings.MODEL_PATH / dataset.id / task.model_name
        train_dir.mkdir(parents=True, exist_ok=True)

        # 生成 data.yaml
        data_yaml = create_data_yaml(
            dataset_path=settings.DATASET_PATH / dataset.id,
            classes=json.loads(dataset.classes),
        )
        with open(train_dir / "data.yaml", "w", encoding="utf-8") as f:
            yaml_content = f"path: {data_yaml['path']}\n"
            yaml_content += f"train: {data_yaml['train']}\n"
            yaml_content += f"val: {data_yaml['val']}\n"
            yaml_content += f"nc: {data_yaml['nc']}\n"
            yaml_content += "names:\n"
            for i, name in enumerate(data_yaml['names'].values()):
                yaml_content += f"  {i}: {name}\n"
            f.write(yaml_content)

        # 构建训练命令
        config = json.loads(task.config)
        cmd = [
            sys.executable, "-m", "ultralytics", "train",
            "--data", str(train_dir / "data.yaml"),
            "--model", f"{task.yolo_version.lower()}n.pt",
            "--epochs", str(config.get("epochs", 100)),
            "--batch-size", str(config.get("batch_size", 16)),
            "--imgsz", str(config.get("imgsz", 640)),
            "--project", str(train_dir),
            "--name", "weights",
            "--exist-ok",
        ]

        if config.get("patience", 50) > 0:
            cmd.extend(["--patience", str(config["patience"])])

        if config.get("augment", True):
            cmd.append("--augment")

        # 启动进程
        process.start(cmd, cwd=str(settings.BASE_DIR))

        # 监控进程输出
        last_metrics_time = time.time()
        last_epoch = 0

        while True:
            if process.process is None:
                break

            line = process.process.stdout.readline()
            if not line and process.process.poll() is not None:
                break

            line = line.strip()
            if not line:
                continue

            # 解析输出
            if "epoch" in line.lower():
                # 提取指标
                metrics = self._parse_metrics(line)
                if metrics:
                    await self._save_metrics(task_id, db, metrics)
                    last_epoch = metrics.get("epoch", last_epoch)

                    # 广播指标
                    await manager.send_message(task_id, {
                        "type": "metrics",
                        "data": metrics,
                    })

            # 检查是否停止
            if process._stop_event.is_set():
                process.stop()
                break

            # 更新状态
            task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
            if task and task.status in ["paused", "cancelled"]:
                if task.status == "paused":
                    process.pause()
                elif task.status == "cancelled":
                    process.stop()
                    break

        # 检查最终状态
        return_code = process.process.poll() if process.process else -1

        task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
        if task:
            if return_code == 0:
                task.status = "completed"
                # 创建模型记录
                self._create_model_record(task, db)
            elif return_code == -1:
                task.status = "cancelled"
            else:
                task.status = "failed"
                task.error_message = f"训练失败，退出码: {return_code}"

            task.finished_at = datetime.utcnow()
            db.commit()

        # 清理
        if task_id in self._running_tasks:
            del self._running_tasks[task_id]

        # 从队列移除
        if task_id in self._training_queue:
            self._training_queue.remove(task_id)

        # 启动下一个任务
        self._start_next_task(db)

        # 广播最终状态
        await manager.send_message(task_id, {
            "type": "status",
            "data": {"new_status": task.status if task else "unknown"}
        })

    def _parse_metrics(self, line: str) -> Optional[dict]:
        """解析训练输出中的指标"""
        import re

        metrics = {}

        # 提取 epoch
        epoch_match = re.search(r"epoch[:\s]+(\d+)", line, re.IGNORECASE)
        if epoch_match:
            metrics["epoch"] = int(epoch_match.group(1))

        # 提取损失
        box_loss_match = re.search(r"box[:\s]+([0-9.]+)", line, re.IGNORECASE)
        cls_loss_match = re.search(r"cls[:\s]+([0-9.]+)", line, re.IGNORECASE)
        dfl_loss_match = re.search(r"dfl[:\s]+([0-9.]+)", line, re.IGNORECASE)

        if box_loss_match:
            metrics["box_loss"] = float(box_loss_match.group(1))
        if cls_loss_match:
            metrics["cls_loss"] = float(cls_loss_match.group(1))
        if dfl_loss_match:
            metrics["dfl_loss"] = float(dfl_loss_match.group(1))

        # 提取 mAP
        map50_match = re.search(r"map50[:\s]+([0-9.]+)", line, re.IGNORECASE)
        map50_95_match = re.search(r"map50-95[:\s]+([0-9.]+)", line, re.IGNORECASE)

        if map50_match:
            metrics["mAP50"] = float(map50_match.group(1))
        if map50_95_match:
            metrics["mAP50_95"] = float(map50_95_match.group(1))

        # 提取 precision/recall
        precision_match = re.search(r"precision[:\s]+([0-9.]+)", line, re.IGNORECASE)
        recall_match = re.search(r"recall[:\s]+([0-9.]+)", line, re.IGNORECASE)

        if precision_match:
            metrics["precision"] = float(precision_match.group(1))
        if recall_match:
            metrics["recall"] = float(recall_match.group(1))

        return metrics if metrics else None

    async def _save_metrics(self, task_id: str, db: Session, metrics: dict):
        """保存指标到数据库"""
        metric = Metric(
            task_id=task_id,
            epoch=metrics.get("epoch", 0),
            box_loss=metrics.get("box_loss", 0.0),
            cls_loss=metrics.get("cls_loss", 0.0),
            dfl_loss=metrics.get("dfl_loss", 0.0),
            mAP50=metrics.get("mAP50", 0.0),
            mAP50_95=metrics.get("mAP50_95", 0.0),
            precision=metrics.get("precision", 0.0),
            recall=metrics.get("recall", 0.0),
            lr=metrics.get("lr", 0.0),
            gpu_memory_used=metrics.get("gpu_memory_used", 0.0),
            epoch_time=metrics.get("epoch_time", 0.0),
        )
        db.add(metric)
        db.commit()

    def _create_model_record(self, task: TrainTask, db: Session):
        """创建模型记录"""
        weights_dir = settings.MODEL_PATH / task.dataset_id / task.model_name / "weights"
        best_weights = weights_dir / "best.pt"
        last_weights = weights_dir / "last.pt"

        if best_weights.exists() or last_weights.exists():
            model = Model(
                name=task.model_name,
                yolo_version=task.yolo_version,
                dataset_id=task.dataset_id,
                train_task_id=task.id,
                status="trained",
                file_path=str(best_weights if best_weights.exists() else last_weights),
            )
            db.add(model)
            db.commit()
            logger.info(f"创建模型记录: {model.id}")

    async def _handle_training_error(self, task_id: str, db: Session, error: str):
        """处理训练错误"""
        task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
        if task:
            task.status = "failed"
            task.error_message = error
            task.finished_at = datetime.utcnow()
            db.commit()

        if task_id in self._running_tasks:
            del self._running_tasks[task_id]

        if task_id in self._training_queue:
            self._training_queue.remove(task_id)

        await manager.send_message(task_id, {
            "type": "status",
            "data": {"new_status": "failed", "error": error}
        })

        self._start_next_task(db)

    def _start_next_task(self, db: Session):
        """启动下一个训练任务"""
        if not self._training_queue:
            return

        next_task_id = self._training_queue[0]
        asyncio.create_task(self.start_training(next_task_id, db))

    async def pause_training(self, task_id: str) -> bool:
        """暂停训练"""
        process = self._running_tasks.get(task_id)
        if not process:
            return False

        process.pause()
        return True

    async def resume_training(self, task_id: str) -> bool:
        """恢复训练"""
        process = self._running_tasks.get(task_id)
        if not process:
            return False

        process.resume()
        return True

    async def stop_training(self, task_id: str) -> bool:
        """停止训练"""
        process = self._running_tasks.get(task_id)
        if not process:
            return False

        process.stop()
        return True
