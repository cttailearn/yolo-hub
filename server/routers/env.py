"""
环境检测路由
"""
import logging

from fastapi import APIRouter

from server.services.gpu_manager import GPUMemoryManager
from server.services.env_checker import EnvChecker

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/env/check")
async def check_environment():
    """完整环境检测"""
    checker = EnvChecker()
    report = checker.check_all()
    return report


@router.get("/env/gpu")
async def get_gpu_info():
    """获取 GPU 状态"""
    gpu_info = GPUMemoryManager.get_gpu_info()
    batch_size = GPUMemoryManager.get_recommended_batch_size()
    return {
        "gpu": gpu_info,
        "recommended_batch_size": batch_size,
    }
