"""
YOLO 相关工具函数
"""
import json
from pathlib import Path


def parse_yolo_label(line: str) -> dict:
    """
    解析 YOLO 格式的标注行
    格式: class_id x_center y_center width height
    所有值都是归一化的 (0-1)
    """
    parts = line.strip().split()
    if len(parts) < 5:
        return None

    try:
        return {
            "class_id": int(parts[0]),
            "bbox": {
                "x": float(parts[1]),
                "y": float(parts[2]),
                "width": float(parts[3]),
                "height": float(parts[4]),
            }
        }
    except ValueError:
        return None


def format_yolo_label(class_id: int, bbox: dict) -> str:
    """
    格式化 YOLO 格式的标注行
    """
    return f"{class_id} {bbox['x']:.6f} {bbox['y']:.6f} {bbox['width']:.6f} {bbox['height']:.6f}\n"


def create_data_yaml(
    dataset_path: Path,
    classes: list[str],
    train_images: str = "images/train",
    val_images: str = "images/val",
    test_images: str = "images/test",
) -> dict:
    """
    创建 YOLO data.yaml 配置
    """
    return {
        "path": str(dataset_path),
        "train": train_images,
        "val": val_images,
        "test": test_images,
        "nc": len(classes),
        "names": {i: name for i, name in enumerate(classes)},
    }


def read_classes(classes_path: Path) -> list[str]:
    """读取类别文件"""
    if not classes_path.exists():
        return []

    with open(classes_path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def write_classes(classes: list[str], classes_path: Path):
    """写入类别文件"""
    classes_path.parent.mkdir(parents=True, exist_ok=True)
    with open(classes_path, "w", encoding="utf-8") as f:
        f.write("\n".join(classes))


def load_dataset_json(dataset_path: Path) -> dict:
    """加载数据集元数据"""
    json_path = dataset_path / "dataset.json"
    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_dataset_json(dataset_path: Path, metadata: dict):
    """保存数据集元数据"""
    json_path = dataset_path / "dataset.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
