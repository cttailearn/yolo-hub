"""
预测服务
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class Predictor:
    """预测器"""

    def __init__(self, model_path: str):
        self.model_path = model_path
        self._model = None

    def _load_model(self):
        """加载模型"""
        if self._model is None:
            from ultralytics import YOLO
            self._model = YOLO(self.model_path)

    def predict(self, image_path: str, conf: float = 0.25, iou: float = 0.45) -> dict:
        """预测单张图片"""
        self._load_model()

        results = self._model.predict(
            source=image_path,
            conf=conf,
            iou=iou,
            verbose=False,
        )

        # 解析结果
        result = results[0]
        boxes = []

        if result.boxes is not None:
            for box in result.boxes:
                boxes.append({
                    "class_id": int(box.cls[0]),
                    "class_name": result.names[int(box.cls[0])],
                    "confidence": float(box.conf[0]),
                    "bbox": {
                        "x1": float(box.xyxy[0][0]),
                        "y1": float(box.xyxy[0][1]),
                        "x2": float(box.xyxy[0][2]),
                        "y2": float(box.xyxy[0][3]),
                    }
                })

        return {
            "boxes": boxes,
            "image_path": image_path,
        }

    def predict_batch(self, image_paths: list[str], conf: float = 0.25, iou: float = 0.45) -> list[dict]:
        """批量预测"""
        self._load_model()

        results = self._model.predict(
            source=image_paths,
            conf=conf,
            iou=iou,
            verbose=False,
        )

        predictions = []
        for result in results:
            boxes = []
            if result.boxes is not None:
                for box in result.boxes:
                    boxes.append({
                        "class_id": int(box.cls[0]),
                        "class_name": result.names[int(box.cls[0])],
                        "confidence": float(box.conf[0]),
                        "bbox": {
                            "x1": float(box.xyxy[0][0]),
                            "y1": float(box.xyxy[0][1]),
                            "x2": float(box.xyxy[0][2]),
                            "y2": float(box.xyxy[0][3]),
                        }
                    })

            predictions.append({
                "boxes": boxes,
                "image_path": result.path,
            })

        return predictions
