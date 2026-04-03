"""
数据库配置和初始化
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from server.config import settings

# 创建数据库引擎
engine = create_engine(
    f"sqlite:///{settings.BASE_DIR / 'yolo-hub.db'}",
    connect_args={"check_same_thread": False},
    echo=False,
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """初始化数据库"""
    from server.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
