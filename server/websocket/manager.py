"""
WebSocket 连接管理器
"""
import asyncio
import json
import logging
from typing import Optional

from fastapi import WebSocket

from server.config import settings

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # task_id -> set of websockets
        self.active_connections: dict[str, set[WebSocket]] = {}
        # websocket -> task_id
        self.connection_tasks: dict[WebSocket, str] = {}
        self._heartbeat_tasks: dict[WebSocket, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, task_id: str):
        """建立连接"""
        await websocket.accept()

        if task_id not in self.active_connections:
            self.active_connections[task_id] = set()

        self.active_connections[task_id].add(websocket)
        self.connection_tasks[websocket] = task_id

        # 启动心跳
        self._start_heartbeat(websocket)

        logger.info(f"WebSocket connected: task_id={task_id}")

    def _start_heartbeat(self, websocket: WebSocket):
        """启动心跳检测"""
        async def heartbeat():
            while True:
                try:
                    await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL / 1000)
                    await websocket.send_json({
                        "type": "heartbeat",
                        "timestamp": int(asyncio.get_event_loop().time() * 1000)
                    })
                except Exception:
                    break

        task = asyncio.create_task(heartbeat())
        self._heartbeat_tasks[websocket] = task

    async def disconnect(self, websocket: WebSocket):
        """断开连接"""
        task_id = self.connection_tasks.pop(websocket, None)

        if task_id and task_id in self.active_connections:
            self.active_connections[task_id].discard(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

        # 停止心跳
        if heartbeat_task := self._heartbeat_tasks.pop(websocket, None):
            heartbeat_task.cancel()

        logger.info(f"WebSocket disconnected: task_id={task_id}")

    async def send_message(self, task_id: str, message: dict):
        """发送消息到指定任务的所有连接"""
        if task_id not in self.active_connections:
            return

        dead_connections = set()

        for websocket in self.active_connections[task_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send message: {e}")
                dead_connections.add(websocket)

        # 清理无效连接
        for websocket in dead_connections:
            await self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """广播消息到所有连接"""
        for task_id in list(self.active_connections.keys()):
            await self.send_message(task_id, message)

    def get_connection_count(self, task_id: str) -> int:
        """获取指定任务的连接数"""
        return len(self.active_connections.get(task_id, set()))

    def get_total_connections(self) -> int:
        """获取总连接数"""
        return sum(len(conns) for conns in self.active_connections.values())


# 全局连接管理器实例
manager = ConnectionManager()
