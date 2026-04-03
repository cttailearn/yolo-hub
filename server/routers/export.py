"""
导出路由
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from server.db import get_db, Model, Export
from server.schemas import ExportCreate, ExportResponse
from server.services.export_service import ExportService

logger = logging.getLogger(__name__)
router = APIRouter()

export_service = ExportService()


@router.post("/export", response_model=ExportResponse, status_code=201)
async def create_export(data: ExportCreate, db: Session = Depends(get_db)):
    """创建导出任务"""
    model = db.query(Model).filter(Model.id == data.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 {data.model_id} 不存在")

    if model.status != "trained":
        raise HTTPException(status_code=400, detail="只有训练完成的模型可以导出")

    export = Export(
        model_id=data.model_id,
        format=data.format,
        status="pending",
    )
    db.add(export)
    db.commit()
    db.refresh(export)

    # 启动导出任务
    await export_service.start_export(export.id, db)

    return ExportResponse(
        id=export.id,
        model_id=export.model_id,
        format=export.format,
        status=export.status,
        output_path=export.output_path,
        created_at=export.created_at,
    )


@router.get("/export/{export_id}", response_model=ExportResponse)
async def get_export(export_id: str, db: Session = Depends(get_db)):
    """获取导出进度"""
    export = db.query(Export).filter(Export.id == export_id).first()
    if not export:
        raise HTTPException(status_code=404, detail=f"导出任务 {export_id} 不存在")

    return ExportResponse(
        id=export.id,
        model_id=export.model_id,
        format=export.format,
        status=export.status,
        output_path=export.output_path,
        created_at=export.created_at,
    )
