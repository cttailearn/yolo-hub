"""
YOLO Hub - FastAPI 主入口
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from server.config import settings
from server.db import init_db
from server.routers import datasets, train, models, export, predict, env

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger.info("YOLO Hub 服务启动中...")
    settings.ensure_directories()
    init_db()
    logger.info("数据库初始化完成")
    yield
    # 关闭时
    logger.info("YOLO Hub 服务关闭中...")


# 创建 FastAPI 应用
app = FastAPI(
    title="YOLO Hub API",
    description="YOLO 模型训练与管理平台 API",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 异常处理器
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(f"未处理的异常: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "服务器内部错误", "code": "INTERNAL_ERROR"}
    )


# 注册路由
app.include_router(datasets.router, prefix="/api", tags=["数据集管理"])
app.include_router(train.router, prefix="/api", tags=["训练管理"])
app.include_router(models.router, prefix="/api", tags=["模型管理"])
app.include_router(export.router, prefix="/api", tags=["导出管理"])
app.include_router(predict.router, prefix="/api", tags=["预测管理"])
app.include_router(env.router, prefix="/api", tags=["环境检测"])


@app.get("/")
async def root():
    """根路径"""
    return {"message": "YOLO Hub API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
