"""
训练路由
"""
import json
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from server.db import get_db, Dataset, TrainTask, Metric
from server.schemas import (
    TrainingCreate,
    TrainingResponse,
    TrainingStatus,
    MetricResponse,
)
from server.config import settings
from server.websocket import manager
from server.services.train_service import TrainService
from server.services.gpu_manager import GPUMemoryManager

logger = logging.getLogger(__name__)
router = APIRouter()

# 训练服务实例
train_service = TrainService()


@router.post("/train", response_model=TrainingResponse, status_code=201)
async def create_training(data: TrainingCreate, db: Session = Depends(get_db)):
    """创建训练任务"""
    # 检查数据集是否存在
    dataset = db.query(Dataset).filter(Dataset.id == data.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"数据集 {data.dataset_id} 不存在")

    # 检查数据集是否有图像
    if len(dataset.images) == 0:
        raise HTTPException(status_code=400, detail="数据集没有图像")

    # 检查数据集是否已标注
    labeled_count = sum(1 for img in dataset.images if img.labeled)
    if labeled_count == 0:
        raise HTTPException(status_code=400, detail="数据集没有标注")

    # 创建训练任务
    task = TrainTask(
        dataset_id=data.dataset_id,
        model_name=data.model_name,
        yolo_version=data.yolo_version,
        status="pending",
        config=json.dumps(data.config.model_dump()),
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 加入训练队列
    queue_position = train_service.add_to_queue(task.id)
    task.queue_position = queue_position

    # 如果队列中只有一个任务，自动启动
    if queue_position == 1:
        asyncio.create_task(train_service.start_training(task.id, db))

    db.commit()
    logger.info(f"创建训练任务: {task.id}")

    return TrainingResponse(
        id=task.id,
        dataset_id=task.dataset_id,
        model_name=task.model_name,
        yolo_version=task.yolo_version,
        status=task.status,
        config=json.loads(task.config),
        created_at=task.created_at,
        queue_position=queue_position,
    )


@router.get("/train", response_model=list[TrainingResponse])
async def list_trainings(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取训练任务列表"""
    query = db.query(TrainTask).order_by(TrainTask.created_at.desc())

    if status:
        query = query.filter(TrainTask.status == status)

    tasks = query.all()
    return [TrainingResponse(
        id=t.id,
        dataset_id=t.dataset_id,
        model_name=t.model_name,
        yolo_version=t.yolo_version,
        status=t.status,
        config=json.loads(t.config) if t.config else {},
        created_at=t.created_at,
        started_at=t.started_at,
        finished_at=t.finished_at,
        error_message=t.error_message,
    ) for t in tasks]


@router.get("/train/{task_id}", response_model=TrainingResponse)
async def get_training(task_id: str, db: Session = Depends(get_db)):
    """获取训练任务详情"""
    task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"训练任务 {task_id} 不存在")

    return TrainingResponse(
        id=task.id,
        dataset_id=task.dataset_id,
        model_name=task.model_name,
        yolo_version=task.yolo_version,
        status=task.status,
        config=json.loads(task.config) if task.config else {},
        created_at=task.created_at,
        started_at=task.started_at,
        finished_at=task.finished_at,
        error_message=t.error_message if hasattr(t, 'error_message') else None,
    )


@router.post("/train/{task_id}/pause")
async def pause_training(task_id: str, db: Session = Depends(get_db)):
    """暂停训练"""
    task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"训练任务 {task_id} 不存在")

    if task.status != "running":
        raise HTTPException(status_code=400, detail="只有运行中的任务可以暂停")

    success = await train_service.pause_training(task_id)
    if success:
        task.status = "paused"
        db.commit()

        # 广播状态变更
        await manager.send_message(task_id, {
            "type": "status",
            "data": {"old_status": "running", "new_status": "paused"}
        })

    return {"success": success}


@router.post("/train/{task_id}/resume")
async def resume_training(task_id: str, db: Session = Depends(get_db)):
    """恢复训练"""
    task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"训练任务 {task_id} 不存在")

    if task.status != "paused":
        raise HTTPException(status_code=400, detail="只有暂停的任务可以恢复")

    success = await train_service.resume_training(task_id)
    if success:
        task.status = "resuming"
        db.commit()

        await manager.send_message(task_id, {
            "type": "status",
            "data": {"old_status": "paused", "new_status": "resuming"}
        })

    return {"success": success}


@router.post("/train/{task_id}/stop")
async def stop_training(task_id: str, db: Session = Depends(get_db)):
    """停止训练"""
    task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"训练任务 {task_id} 不存在")

    if task.status not in ["running", "paused", "resuming"]:
        raise HTTPException(status_code=400, detail="当前状态无法停止")

    success = await train_service.stop_training(task_id)
    if success:
        task.status = "cancelled"
        task.finished_at = datetime.utcnow()
        db.commit()

        await manager.send_message(task_id, {
            "type": "status",
            "data": {"old_status": task.status, "new_status": "cancelled"}
        })

    return {"success": success}


@router.get("/train/{task_id}/metrics", response_model=list[MetricResponse])
async def get_metrics(task_id: str, db: Session = Depends(get_db)):
    """获取训练指标"""
    task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"训练任务 {task_id} 不存在")

    metrics = db.query(Metric).filter(Metric.task_id == task_id).order_by(Metric.epoch).all()

    return [MetricResponse(
        id=m.id,
        task_id=m.task_id,
        epoch=m.epoch,
        box_loss=m.box_loss,
        cls_loss=m.cls_loss,
        dfl_loss=m.dfl_loss,
        mAP50=m.mAP50,
        mAP50_95=m.mAP50_95,
        precision=m.precision,
        recall=m.recall,
        lr=m.lr,
        gpu_memory_used=m.gpu_memory_used,
        epoch_time=m.epoch_time,
        timestamp=m.timestamp,
    ) for m in metrics]


@router.get("/train/{task_id}/weights")
async def get_weights(task_id: str, db: Session = Depends(get_db)):
    """获取训练权重"""
    task = db.query(TrainTask).filter(TrainTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"训练任务 {task_id} 不存在")

    if task.status != "completed":
        raise HTTPException(status_code=400, detail="只有完成的任务有权重")

    weights_dir = settings.MODEL_PATH / task.dataset_id / task.model_name
    best_weights = weights_dir / "weights" / "best.pt"
    last_weights = weights_dir / "weights" / "last.pt"

    return {
        "best": str(best_weights) if best_weights.exists() else None,
        "last": str(last_weights) if last_weights.exists() else None,
    }


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """WebSocket 连接"""
    await manager.connect(websocket, task_id)
    try:
        # 发送连接成功消息
        await websocket.send_json({
            "type": "connected",
            "task_id": task_id,
            "timestamp": int(asyncio.get_event_loop().time() * 1000)
        })

        while True:
            # 保持连接，接受客户端消息
            data = await websocket.receive_text()
            # 可以处理客户端消息，如心跳响应
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
