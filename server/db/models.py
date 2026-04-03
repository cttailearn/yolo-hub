"""
数据库模型定义
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship

from server.db.database import Base


def generate_id():
    """生成唯一ID"""
    return f"ds_{uuid.uuid4().hex[:12]}"


def generate_image_id():
    """生成图像ID"""
    return f"img_{uuid.uuid4().hex[:12]}"


def generate_task_id():
    """生成任务ID"""
    return f"task_{uuid.uuid4().hex[:12]}"


def generate_model_id():
    """生成模型ID"""
    return f"model_{uuid.uuid4().hex[:12]}"


def generate_export_id():
    """生成导出ID"""
    return f"exp_{uuid.uuid4().hex[:12]}"


class Dataset(Base):
    """数据集模型"""
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=generate_id)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    task_type = Column(String, nullable=False, default="detection")
    classes = Column(Text, default="[]")  # JSON list
    split = Column(Text, default='{"train": 0.8, "val": 0.1, "test": 0.1}')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    images = relationship("Image", back_populates="dataset", cascade="all, delete-orphan")
    train_tasks = relationship("TrainTask", back_populates="dataset", cascade="all, delete-orphan")
    models = relationship("Model", back_populates="dataset", cascade="all, delete-orphan")


class Image(Base):
    """图像模型"""
    __tablename__ = "images"

    id = Column(String, primary_key=True, default=generate_image_id)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    split = Column(String, default="train")
    labeled = Column(Boolean, default=False)

    # 关系
    dataset = relationship("Dataset", back_populates="images")
    labels = relationship("Label", back_populates="image", cascade="all, delete-orphan")


class Label(Base):
    """标注模型"""
    __tablename__ = "labels"

    id = Column(String, primary_key=True, default=lambda: f"lbl_{uuid.uuid4().hex[:12]}")
    image_id = Column(String, ForeignKey("images.id"), nullable=False)
    type = Column(String, nullable=False)  # detection, segmentation, classification, pose, obb
    class_id = Column(Integer, nullable=False)
    class_name = Column(String, nullable=False)
    data = Column(Text, default="{}")  # JSON data based on type

    # 关系
    image = relationship("Image", back_populates="labels")


class TrainTask(Base):
    """训练任务模型"""
    __tablename__ = "train_tasks"

    id = Column(String, primary_key=True, default=generate_task_id)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    model_name = Column(String, nullable=False)
    yolo_version = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, running, paused, resuming, completed, failed, cancelled
    config = Column(Text, default="{}")  # JSON config
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # 关系
    dataset = relationship("Dataset", back_populates="train_tasks")
    metrics = relationship("Metric", back_populates="task", cascade="all, delete-orphan")


class Model(Base):
    """模型模型"""
    __tablename__ = "models"

    id = Column(String, primary_key=True, default=generate_model_id)
    name = Column(String, nullable=False)
    yolo_version = Column(String, nullable=False)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    train_task_id = Column(String, ForeignKey("train_tasks.id"), nullable=True)
    status = Column(String, default="training")  # training, trained, failed
    metrics = Column(Text, nullable=True)  # JSON metrics
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    dataset = relationship("Dataset", back_populates="models")
    exports = relationship("Export", back_populates="model", cascade="all, delete-orphan")


class Export(Base):
    """导出模型"""
    __tablename__ = "exports"

    id = Column(String, primary_key=True, default=generate_export_id)
    model_id = Column(String, ForeignKey("models.id"), nullable=False)
    format = Column(String, nullable=False)  # onnx, tflite, coreml
    status = Column(String, default="pending")  # pending, running, completed, failed
    output_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    model = relationship("Model", back_populates="exports")


class Metric(Base):
    """训练指标模型"""
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String, ForeignKey("train_tasks.id"), nullable=False)
    epoch = Column(Integer, default=0)
    box_loss = Column(Float, default=0.0)
    cls_loss = Column(Float, default=0.0)
    dfl_loss = Column(Float, default=0.0)
    mAP50 = Column(Float, default=0.0)
    mAP50_95 = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    lr = Column(Float, default=0.0)
    gpu_memory_used = Column(Float, default=0.0)
    epoch_time = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 关系
    task = relationship("TrainTask", back_populates="metrics")
