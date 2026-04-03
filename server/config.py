"""
YOLO Hub - 配置文件管理
"""
import os
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent


def load_config() -> dict[str, Any]:
    """加载配置文件"""
    config_path = BASE_DIR / "config.yaml"

    if not config_path.exists():
        raise FileNotFoundError(f"配置文件不存在: {config_path}")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    # 环境变量覆盖
    config = _apply_env_overrides(config)

    return config


def _apply_env_overrides(config: dict[str, Any]) -> dict[str, Any]:
    """应用环境变量覆盖"""
    # Server
    if port := os.getenv("YOLOHUB_SERVER_PORT"):
        config["server"]["port"] = int(port)

    if host := os.getenv("YOLOHUB_SERVER_HOST"):
        config["server"]["host"] = host

    # Storage
    if model_path := os.getenv("YOLOHUB_STORAGE_MODEL_PATH"):
        config["storage"]["model_path"] = model_path

    if dataset_path := os.getenv("YOLOHUB_STORAGE_DATASET_PATH"):
        config["storage"]["dataset_path"] = dataset_path

    if export_path := os.getenv("YOLOHUB_STORAGE_EXPORT_PATH"):
        config["storage"]["export_path"] = export_path

    # Training
    if max_concurrent := os.getenv("YOLOHUB_TRAINING_MAX_CONCURRENT"):
        config["training"]["max_concurrent"] = int(max_concurrent)

    return config


# 全局配置实例
config = load_config()


class Settings:
    """配置类"""

    # Server
    HOST = config["server"]["host"]
    PORT = config["server"]["port"]
    CORS_ORIGINS = config["server"]["cors_origins"]

    # Storage
    MODEL_PATH = BASE_DIR / config["storage"]["model_path"]
    DATASET_PATH = BASE_DIR / config["storage"]["dataset_path"]
    EXPORT_PATH = BASE_DIR / config["storage"]["export_path"]
    TEMP_PATH = BASE_DIR / config["storage"]["temp_path"]

    # Upload
    MAX_UPLOAD_SIZE = config["upload"]["max_size_mb"] * 1024 * 1024
    ALLOWED_EXTENSIONS = set(config["upload"]["allowed_extensions"])

    # Training
    MAX_CONCURRENT_TRAINING = config["training"]["max_concurrent"]
    QUEUE_LIMIT = config["training"]["queue_limit"]
    DEFAULT_EPOCHS = config["training"]["default_epochs"]
    CHECKPOINT_INTERVAL = config["training"]["checkpoint_interval"]
    GPU_BATCH_SIZE_MAP = config["training"]["gpu_batch_size_map"]
    YOLO_VERSIONS = config["training"]["yolo_versions"]

    # Export
    DEFAULT_IMGSZ = config["export"]["default_imgsz"]
    DEFAULT_HALF = config["export"]["default_half"]
    ONNX_OPSET = config["export"]["onnx_opset"]
    VERIFY_AFTER_EXPORT = config["export"]["verify_after_export"]

    # Cleanup
    CLEANUP_ENABLED = config["cleanup"]["enabled"]
    CLEANUP_INTERVAL_HOURS = config["cleanup"]["interval_hours"]
    TASK_RETENTION_DAYS = config["cleanup"]["task_retention_days"]

    # Logging
    LOG_LEVEL = config["logging"]["level"]
    LOG_FILE = BASE_DIR / config["logging"]["file"]

    # WebSocket
    WS_RECONNECT_INTERVAL = config["websocket"]["reconnect_interval_ms"]
    WS_MAX_RECONNECT_ATTEMPTS = config["websocket"]["max_reconnect_attempts"]
    WS_HEARTBEAT_INTERVAL = config["websocket"]["heartbeat_interval_ms"]

    @classmethod
    def ensure_directories(cls):
        """确保必要的目录存在"""
        for path in [cls.MODEL_PATH, cls.DATASET_PATH, cls.EXPORT_PATH, cls.TEMP_PATH]:
            path.mkdir(parents=True, exist_ok=True)

        # 日志目录
        cls.LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
