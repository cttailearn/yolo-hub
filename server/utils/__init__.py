"""
工具函数
"""
import hashlib
import os
import shutil
from pathlib import Path


def safe_join(*paths) -> Path:
    """安全地拼接路径"""
    base = Path(".").resolve()
    joined = (base / Path(*paths)).resolve()

    if not str(joined).startswith(str(base)):
        raise ValueError("路径遍历攻击检测")

    return joined


def validate_filename(filename: str) -> bool:
    """验证文件名是否安全"""
    if not filename:
        return False

    # 禁止包含路径分隔符
    if "/" in filename or "\\" in filename:
        return False

    # 禁止包含父目录引用
    if ".." in filename:
        return False

    # 禁止包含特殊字符
    forbidden_chars = '<>:"|?*'
    if any(c in filename for c in forbidden_chars):
        return False

    return True


def get_file_hash(file_path: Path) -> str:
    """获取文件MD5哈希"""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def copy_file(src: Path, dst: Path, overwrite: bool = False) -> bool:
    """安全地复制文件"""
    if not src.exists():
        return False

    if dst.exists() and not overwrite:
        return False

    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    return True


def remove_directory(path: Path):
    """安全地删除目录"""
    if path.exists() and path.is_dir():
        shutil.rmtree(path)


def ensure_directory(path: Path):
    """确保目录存在"""
    path.mkdir(parents=True, exist_ok=True)
