/**
 * 前端配置
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export const config = {
  api: {
    baseUrl: API_URL,
    datasets: `${API_URL}/api/datasets`,
    train: `${API_URL}/api/train`,
    models: `${API_URL}/api/models`,
    export: `${API_URL}/api/export`,
    predict: `${API_URL}/api/predict`,
    env: `${API_URL}/api/env`,
  },
  websocket: {
    url: WS_URL,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  },
  upload: {
    maxSizeMB: 100,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  training: {
    defaultEpochs: 100,
    defaultBatchSize: 16,
    defaultImgsz: 640,
    yoloVersions: [
      { name: 'YOLO26', pretrained: 'yolo26n.pt' },
      { name: 'YOLO11', pretrained: 'yolo11n.pt' },
      { name: 'YOLOv8', pretrained: 'yolov8n.pt' },
      { name: 'YOLOv5', pretrained: 'yolov5n.pt' },
    ],
  },
};
