"""
GPU 管理服务
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class GPUMemoryManager:
    """GPU 内存管理器"""

    _gpu_info: Optional[dict] = None

    @classmethod
    def get_gpu_info(cls) -> dict:
        """获取 GPU 信息"""
        if cls._gpu_info is not None:
            return cls._gpu_info

        try:
            import torch
            if not torch.cuda.is_available():
                cls._gpu_info = {
                    "available": False,
                    "count": 0,
                    "devices": [],
                }
                return cls._gpu_info

            count = torch.cuda.device_count()
            devices = []

            for i in range(count):
                props = torch.cuda.get_device_properties(i)
                devices.append({
                    "index": i,
                    "name": props.name,
                    "total_memory": props.total_memory,
                    "major": props.major,
                    "minor": props.minor,
                })

            cls._gpu_info = {
                "available": True,
                "count": count,
                "devices": devices,
            }

            return cls._gpu_info

        except ImportError:
            logger.warning("PyTorch 未安装或不支持 CUDA")
            cls._gpu_info = {
                "available": False,
                "count": 0,
                "devices": [],
                "error": "PyTorch CUDA 不可用",
            }
            return cls._gpu_info

    @classmethod
    def get_recommended_batch_size(cls) -> int:
        """根据 GPU 显存推荐 batch size"""
        gpu_info = cls.get_gpu_info()

        if not gpu_info.get("available"):
            return 8  # 默认 batch size

        # 获取最大可用显存
        max_memory = 0
        for device in gpu_info.get("devices", []):
            max_memory = max(max_memory, device.get("total_memory", 0))

        # 计算显存大小（GB）
        memory_gb = max_memory / (1024 ** 3)

        # 根据显存推荐 batch size
        if memory_gb >= 24:
            return 32
        elif memory_gb >= 16:
            return 16
        elif memory_gb >= 12:
            return 8
        elif memory_gb >= 8:
            return 4
        elif memory_gb >= 4:
            return 2
        else:
            return 1

    @classmethod
    def get_current_memory_usage(cls, device_index: int = 0) -> dict:
        """获取当前显存使用情况"""
        try:
            import torch
            if not torch.cuda.is_available():
                return {"used": 0, "total": 0, "free": 0}

            return {
                "used": torch.cuda.memory_allocated(device_index),
                "total": torch.cuda.get_device_properties(device_index).total_memory,
                "free": torch.cuda.get_device_properties(device_index).total_memory - torch.cuda.memory_allocated(device_index),
            }
        except Exception:
            return {"used": 0, "total": 0, "free": 0}

    @classmethod
    def clear_cache(cls):
        """清理 GPU 缓存"""
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.synchronize()
        except Exception as e:
            logger.warning(f"清理 GPU 缓存失败: {e}")
