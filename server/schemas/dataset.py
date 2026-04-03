"""
数据集 Schema
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DatasetCreate(BaseModel):
    """创建数据集"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    task_type: str = "detection"
    classes: list[str] = []
    split: dict = {"train": 0.8, "val": 0.1, "test": 0.1}


class DatasetUpdate(BaseModel):
    """更新数据集"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    task_type: Optional[str] = None
    classes: Optional[list[str]] = None
    split: Optional[dict] = None


class DatasetResponse(BaseModel):
    """数据集响应"""
    id: str
    name: str
    description: str
    task_type: str
    classes: list[str]
    split: dict
    image_count: int = 0
    labeled_count: int = 0
    status: str = "empty"
    created_at: datetime
    updated_at: datetime


class ImageResponse(BaseModel):
    """图像响应"""
    id: str
    dataset_id: str
    filename: str
    path: str
    width: int
    height: int
    split: str
    labeled: bool


class ImageUploadResponse(BaseModel):
    """图像上传响应"""
    success: bool = True
    uploaded: int = 0
    images: list[ImageResponse] = []


class LabelData(BaseModel):
    """标注数据"""
    id: str
    image_id: str
    type: str
    class_id: int
    class_name: str
    data: dict


class LabelUpdate(BaseModel):
    """标注更新"""
    labels: list[LabelData]
