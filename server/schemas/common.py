"""
通用 Pydantic Schema
"""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应"""
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginationParams(BaseModel):
    """分页参数"""
    page: int = 1
    page_size: int = 20


class BaseResponse(BaseModel):
    """通用响应"""
    success: bool = True
    message: str = ""


class ErrorResponse(BaseResponse):
    """错误响应"""
    success: bool = False
    error: str = ""
    code: str = ""
