"""
模型 Schema
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ModelResponse(BaseModel):
    """模型响应"""
    id: str
    name: str
    yolo_version: str
    dataset_id: str
    train_task_id: Optional[str] = None
    status: str
    metrics: Optional[dict] = None
    file_path: Optional[str] = None
    created_at: datetime


class ModelListResponse(BaseModel):
    """模型列表响应"""
    models: list[ModelResponse]
    total: int


class ExportCreate(BaseModel):
    """创建导出任务"""
    model_id: str
    format: str = "onnx"
    imgsz: int = 640
    half: bool = False


class ExportResponse(BaseModel):
    """导出响应"""
    id: str
    model_id: str
    format: str
    status: str
    output_path: Optional[str] = None
    created_at: datetime
