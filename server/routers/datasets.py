"""
数据集路由
"""
import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from server.db import get_db, Dataset, Image, Label
from server.schemas import (
    DatasetCreate,
    DatasetUpdate,
    DatasetResponse,
    ImageUploadResponse,
    ImageResponse,
    LabelUpdate,
    LabelData,
)
from server.config import settings
from server.utils import validate_filename, ensure_directory

logger = logging.getLogger(__name__)
router = APIRouter()


def dataset_to_response(dataset: Dataset) -> DatasetResponse:
    """将 Dataset 模型转换为响应"""
    image_count = len(dataset.images)
    labeled_count = sum(1 for img in dataset.images if img.labeled)

    if image_count == 0:
        status = "empty"
    elif labeled_count == image_count:
        status = "completed"
    else:
        status = "partial"

    return DatasetResponse(
        id=dataset.id,
        name=dataset.name,
        description=dataset.description,
        task_type=dataset.task_type,
        classes=json.loads(dataset.classes) if dataset.classes else [],
        split=json.loads(dataset.split) if dataset.split else {"train": 0.8, "val": 0.1, "test": 0.1},
        image_count=image_count,
        labeled_count=labeled_count,
        status=status,
        created_at=dataset.created_at,
        updated_at=dataset.updated_at,
    )


@router.get("/datasets", response_model=list[DatasetResponse])
async def list_datasets(db: Session = Depends(get_db)):
    """获取数据集列表"""
    datasets = db.query(Dataset).order_by(Dataset.updated_at.desc()).all()
    return [dataset_to_response(d) for d in datasets]


@router.post("/datasets", response_model=DatasetResponse, status_code=201)
async def create_dataset(data: DatasetCreate, db: Session = Depends(get_db)):
    """创建数据集"""
    dataset = Dataset(
        name=data.name,
        description=data.description,
        task_type=data.task_type,
        classes=json.dumps(data.classes),
        split=json.dumps(data.split),
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # 创建数据集目录
    dataset_dir = settings.DATASET_PATH / dataset.id
    for split in ["train", "val", "test"]:
        ensure_directory(dataset_dir / "images" / split)
        ensure_directory(dataset_dir / "labels" / split)

    logger.info(f"创建数据集: {dataset.id}")
    return dataset_to_response(dataset)


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """获取数据集详情"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"数据集 {dataset_id} 不存在")
    return dataset_to_response(dataset)


@router.put("/datasets/{dataset_id}", response_model=DatasetResponse)
async def update_dataset(
    dataset_id: str,
    data: DatasetUpdate,
    db: Session = Depends(get_db)
):
    """更新数据集"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"数据集 {dataset_id} 不存在")

    if data.name is not None:
        dataset.name = data.name
    if data.description is not None:
        dataset.description = data.description
    if data.task_type is not None:
        dataset.task_type = data.task_type
    if data.classes is not None:
        dataset.classes = json.dumps(data.classes)
    if data.split is not None:
        dataset.split = json.dumps(data.split)

    db.commit()
    db.refresh(dataset)
    return dataset_to_response(dataset)


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """删除数据集"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"数据集 {dataset_id} 不存在")

    # 检查是否有训练任务使用该数据集
    if dataset.train_tasks:
        task_count = len(dataset.train_tasks)
        raise HTTPException(
            status_code=409,
            detail={
                "message": f"该数据集已被 {task_count} 个训练任务使用，无法删除",
                "code": "DATASET_IN_USE",
                "related_tasks": [
                    {"id": t.id, "name": t.model_name, "status": t.status}
                    for t in dataset.train_tasks
                ]
            }
        )

    # 删除数据集目录
    dataset_dir = settings.DATASET_PATH / dataset_id
    if dataset_dir.exists():
        import shutil
        shutil.rmtree(dataset_dir)

    db.delete(dataset)
    db.commit()
    return {"success": True}


@router.post("/datasets/{dataset_id}/images", response_model=ImageUploadResponse)
async def upload_images(
    dataset_id: str,
    files: list[UploadFile] = File(...),
    split: str = Query("train", regex="^(train|val|test)$"),
    db: Session = Depends(get_db)
):
    """上传图像"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail=f"数据集 {dataset_id} 不存在")

    # 验证文件
    uploaded_images = []
    for file in files:
        if not file.filename:
            continue

        ext = Path(file.filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            continue

        if file.size and file.size > settings.MAX_UPLOAD_SIZE:
            continue

        # 保存文件
        dataset_dir = settings.DATASET_PATH / dataset_id
        images_dir = dataset_dir / "images" / split
        ensure_directory(images_dir)

        file_path = images_dir / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # 获取图像尺寸
        from PIL import Image as PILImage
        try:
            with PILImage.open(file_path) as img:
                width, height = img.size
        except Exception:
            width, height = 0, 0

        # 创建数据库记录
        image = Image(
            dataset_id=dataset_id,
            filename=file.filename,
            path=str(file_path),
            width=width,
            height=height,
            split=split,
            labeled=False,
        )
        db.add(image)
        uploaded_images.append(image)

    db.commit()

    return ImageUploadResponse(
        success=True,
        uploaded=len(uploaded_images),
        images=[ImageResponse(
            id=img.id,
            dataset_id=img.dataset_id,
            filename=img.filename,
            path=img.path,
            width=img.width,
            height=img.height,
            split=img.split,
            labeled=img.labeled,
        ) for img in uploaded_images]
    )


@router.get("/datasets/{dataset_id}/images", response_model=list[ImageResponse])
async def list_images(
    dataset_id: str,
    split: Optional[str] = Query(None, regex="^(train|val|test)$"),
    labeled: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """获取图像列表"""
    query = db.query(Image).filter(Image.dataset_id == dataset_id)

    if split:
        query = query.filter(Image.split == split)
    if labeled is not None:
        query = query.filter(Image.labeled == labeled)

    images = query.order_by(Image.filename).all()
    return [ImageResponse(
        id=img.id,
        dataset_id=img.dataset_id,
        filename=img.filename,
        path=img.path,
        width=img.width,
        height=img.height,
        split=img.split,
        labeled=img.labeled,
    ) for img in images]


@router.delete("/datasets/{dataset_id}/images/{image_id}")
async def delete_image(dataset_id: str, image_id: str, db: Session = Depends(get_db)):
    """删除图像"""
    image = db.query(Image).filter(
        Image.id == image_id,
        Image.dataset_id == dataset_id
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="图像不存在")

    # 删除文件
    if Path(image.path).exists():
        Path(image.path).unlink()

    # 删除标签文件
    label_path = Path(image.path).parent.parent.parent / "labels" / image.split / Path(image.path).stem + ".txt"
    if label_path.exists():
        label_path.unlink()

    db.delete(image)
    db.commit()
    return {"success": True}


@router.get("/datasets/{dataset_id}/labels/{image_id}")
async def get_labels(dataset_id: str, image_id: str, db: Session = Depends(get_db)):
    """获取图像标注"""
    image = db.query(Image).filter(
        Image.id == image_id,
        Image.dataset_id == dataset_id
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="图像不存在")

    labels = db.query(Label).filter(Label.image_id == image_id).all()

    return {
        "image_id": image_id,
        "labels": [LabelData(
            id=l.id,
            image_id=l.image_id,
            type=l.type,
            class_id=l.class_id,
            class_name=l.class_name,
            data=json.loads(l.data) if l.data else {},
        ) for l in labels]
    }


@router.put("/datasets/{dataset_id}/labels/{image_id}")
async def update_labels(
    dataset_id: str,
    image_id: str,
    data: LabelUpdate,
    db: Session = Depends(get_db)
):
    """保存图像标注"""
    image = db.query(Image).filter(
        Image.id == image_id,
        Image.dataset_id == dataset_id
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="图像不存在")

    # 删除旧标注
    db.query(Label).filter(Label.image_id == image_id).delete()

    # 添加新标注
    for label_data in data.labels:
        label = Label(
            image_id=image_id,
            type=label_data.type,
            class_id=label_data.class_id,
            class_name=label_data.class_name,
            data=json.dumps(label_data.data),
        )
        db.add(label)

    # 更新图像标注状态
    image.labeled = len(data.labels) > 0

    db.commit()
    return {"success": True, "labeled": image.labeled}
