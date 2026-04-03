"""
预测路由
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from server.db import get_db, Model
from server.schemas import BaseResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/predict", response_model=BaseResponse)
async def predict_single(
    model_id: str = Form(...),
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.45),
    db: Session = Depends(get_db)
):
    """单张图片预测"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")

    if model.status != "trained":
        raise HTTPException(status_code=400, detail="只有训练完成的模型可以预测")

    from server.services.predictor import Predictor
    predictor = Predictor(model.file_path)

    # 保存上传的文件
    import tempfile
    from pathlib import Path
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        results = predictor.predict(tmp_path, conf=conf, iou=iou)
        return BaseResponse(
            success=True,
            message="预测完成",
            data=results,
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.post("/predict/batch", response_model=BaseResponse)
async def predict_batch(
    model_id: str = Form(...),
    files: list[UploadFile] = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.45),
    db: Session = Depends(get_db)
):
    """批量预测"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 {model_id} 不存在")

    if model.status != "trained":
        raise HTTPException(status_code=400, detail="只有训练完成的模型可以预测")

    from server.services.predictor import Predictor
    predictor = Predictor(model.file_path)

    import tempfile
    from pathlib import Path
    results = []

    for file in files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = predictor.predict(tmp_path, conf=conf, iou=iou)
            results.append({
                "filename": file.filename,
                "result": result,
            })
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    return BaseResponse(
        success=True,
        message=f"完成 {len(results)} 张图片预测",
        data={"results": results},
    )
