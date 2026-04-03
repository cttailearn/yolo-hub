"""
模型路由
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from server.db import get_db, Model, Dataset
from server.schemas import ModelResponse, ModelListResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/models", response_model=ModelListResponse)
async def list_models(db: Session = Depends(get_db)):
    """获取模型列表"""
    models = db.query(Model).order_by(Model.created_at.desc()).all()

    return ModelListResponse(
        models=[ModelResponse(
            id=m.id,
            name=m.name,
            yolo_version=m.yolo_version,
            dataset_id=m.dataset_id,
            train_task_id=m.train_task_id,
            status=m.status,
            metrics=json.loads(m.metrics) if m.metrics else None,
            file_path=m.file_path,
            created_at=m.created_at,
        ) for m in models],
        total=len(models),
    )


@router.get("/models/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str, db: Session = Depends(get_db)):
    """获取模型详情"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")

    return ModelResponse(
        id=model.id,
        name=model.name,
        yolo_version=model.yolo_version,
        dataset_id=model.dataset_id,
        train_task_id=model.train_task_id,
        status=model.status,
        metrics=json.loads(model.metrics) if model.metrics else None,
        file_path=model.file_path,
        created_at=model.created_at,
    )


@router.delete("/models/{model_id}")
async def delete_model(model_id: str, db: Session = Depends(get_db)):
    """删除模型"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")

    # 检查是否有导出任务使用该模型
    if model.exports:
        raise HTTPException(
            status_code=409,
            detail={
                "message": f"该模型已被 {len(model.exports)} 个导出任务使用，无法删除",
                "code": "MODEL_IN_USE",
            }
        )

    # 删除模型文件
    if model.file_path:
        from pathlib import Path
        model_dir = Path(model.file_path).parent
        if model_dir.exists():
            import shutil
            shutil.rmtree(model_dir)

    db.delete(model)
    db.commit()
    return {"success": True}
