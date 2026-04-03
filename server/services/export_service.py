"""
导出服务
"""
import asyncio
import logging
import sys
from pathlib import Path

from sqlalchemy.orm import Session

from server.db import Export, Model
from server.config import settings

logger = logging.getLogger(__name__)


class ExportService:
    """导出服务"""

    async def start_export(self, export_id: str, db: Session):
        """启动导出任务"""
        export = db.query(Export).filter(Export.id == export_id).first()
        if not export:
            logger.error(f"导出任务不存在: {export_id}")
            return

        model = db.query(Model).filter(Model.id == export.model_id).first()
        if not model:
            logger.error(f"模型不存在: {export.model_id}")
            return

        # 更新状态
        export.status = "running"
        db.commit()

        try:
            # 执行导出
            result = await self._export_model(model, export, db)
            if result:
                export.status = "completed"
                export.output_path = result
            else:
                export.status = "failed"
        except Exception as e:
            logger.exception(f"导出失败: {export_id}")
            export.status = "failed"

        db.commit()

    async def _export_model(self, model: Model, export: Export, db: Session) -> str:
        """执行模型导出"""
        # 导出目录
        export_dir = settings.EXPORT_PATH / model.id
        export_dir.mkdir(parents=True, exist_ok=True)

        # 构建导出命令
        format = export.format
        output_name = f"{model.name}.{format}"

        cmd = [
            sys.executable, "-m", "ultralytics", "export",
            "--model", model.file_path,
            "--format", format,
            "--imgsz", "640",
            "--project", str(export_dir),
            "--name", model.name,
            "--exist-ok",
        ]

        # 执行导出
        import subprocess
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        stdout, stderr = process.communicate()

        if process.returncode != 0:
            logger.error(f"导出失败: {stderr}")
            return None

        output_path = export_dir / model.name / output_name
        return str(output_path)
