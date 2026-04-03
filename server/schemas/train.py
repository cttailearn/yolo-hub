"""
训练 Schema
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TrainingConfig(BaseModel):
    """训练配置"""
    epochs: int = Field(default=100, ge=1, le=10000)
    batch_size: int = Field(default=16, ge=1)
    imgsz: int = Field(default=640, ge=32, le=4096)
    patience: int = Field(default=50, ge=0)
    lr0: float = Field(default=0.01, ge=0)
    lrf: float = Field(default=0.01, ge=0)
    augment: bool = True
    optimizer: str = "SGD"


class TrainingCreate(BaseModel):
    """创建训练任务"""
    dataset_id: str
    model_name: str = Field(..., min_length=1, max_length=100)
    yolo_version: str = "YOLO11"
    config: TrainingConfig = TrainingConfig()


class TrainingResponse(BaseModel):
    """训练响应"""
    id: str
    dataset_id: str
    model_name: str
    yolo_version: str
    status: str
    config: dict
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    queue_position: int = 0


class TrainingStatus(BaseModel):
    """训练状态"""
    task_id: str
    status: str
    epoch: int = 0
    total_epochs: int = 0
    metrics: dict = {}


class MetricResponse(BaseModel):
    """指标响应"""
    id: int
    task_id: str
    epoch: int
    box_loss: float
    cls_loss: float
    dfl_loss: float
    mAP50: float
    mAP50_95: float
    precision: float
    recall: float
    lr: float
    gpu_memory_used: float
    epoch_time: float
    timestamp: datetime
