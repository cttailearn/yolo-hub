"""
环境检测服务
"""
import logging
import sys
from typing import Optional

logger = logging.getLogger(__name__)


class EnvChecker:
    """环境检测器"""

    @staticmethod
    def check_python_version() -> dict:
        """检测 Python 版本"""
        version = sys.version_info
        return {
            "version": f"{version.major}.{version.minor}.{version.micro}",
            "supported": version.major == 3 and version.minor >= 8,
        }

    @staticmethod
    def check_cuda() -> dict:
        """检测 CUDA"""
        try:
            import torch
            cuda_available = torch.cuda.is_available()
            cudnn_available = torch.backends.cudnn.is_available()

            if cuda_available:
                return {
                    "available": True,
                    "version": torch.version.cuda,
                    "cudnn_version": torch.backends.cudnn.version(),
                    "device_count": torch.cuda.device_count(),
                }
            else:
                return {
                    "available": False,
                    "reason": "CUDA 不可用",
                }
        except ImportError:
            return {
                "available": False,
                "reason": "PyTorch 未安装",
            }

    @staticmethod
    def check_ultralytics() -> dict:
        """检测 Ultralytics"""
        try:
            import ultralytics
            return {
                "available": True,
                "version": ultralytics.__version__,
            }
        except ImportError:
            return {
                "available": False,
                "reason": "Ultralytics 未安装",
            }

    @staticmethod
    def check_all() -> dict:
        """完整环境检测"""
        python = EnvChecker.check_python_version()
        cuda = EnvChecker.check_cuda()
        ultralytics = EnvChecker.check_ultralytics()

        all_supported = (
            python["supported"] and
            cuda["available"] and
            ultralytics["available"]
        )

        return {
            "python": python,
            "cuda": cuda,
            "ultralytics": ultralytics,
            "all_supported": all_supported,
        }
