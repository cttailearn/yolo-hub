/**
 * 任务类型
 */
export type TaskType = 'detection' | 'segmentation' | 'classification' | 'pose' | 'obb';

/**
 * 数据集
 */
export interface Dataset {
  id: string;
  name: string;
  description: string;
  taskType: TaskType;
  classes: string[];
  createdAt: string;
  updatedAt: string;
  split: {
    train: number;
    val: number;
    test: number;
  };
  imageCount: number;
  labeledCount: number;
  status: 'empty' | 'partial' | 'completed';
}

/**
 * 图像文件
 */
export interface ImageFile {
  id: string;
  datasetId: string;
  filename: string;
  path: string;
  width: number;
  height: number;
  split: 'train' | 'val' | 'test';
  labeled: boolean;
}

/**
 * 标注数据类型
 */
export interface DetectionData {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SegmentationData {
  polygon: Array<{ x: number; y: number }>;
}

export interface ClassificationData {
  // Classification 只需 classId 和 className
}

export interface PoseData {
  keypoints: Array<{
    x: number;
    y: number;
    visible: 0 | 1 | 2;
  }>;
  skeleton?: Array<[number, number]>;
}

export interface OBBData {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
  };
}

/**
 * 标注
 */
export interface Label {
  id: string;
  imageId: string;
  type: TaskType;
  classId: number;
  className: string;
  data: DetectionData | SegmentationData | ClassificationData | PoseData | OBBData;
}

/**
 * 训练配置
 */
export interface TrainingConfig {
  epochs: number;
  batch_size: number;
  imgsz: number;
  patience: number;
  lr0: number;
  lrf: number;
  augment: boolean;
  optimizer: string;
}

/**
 * 训练任务状态
 */
export type TrainingStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'resuming'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * 训练任务
 */
export interface TrainingTask {
  id: string;
  datasetId: string;
  modelName: string;
  yoloVersion: string;
  status: TrainingStatus;
  config: TrainingConfig;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  queuePosition?: number;
}

/**
 * 训练指标
 */
export interface Metric {
  epoch: number;
  box_loss: number;
  cls_loss: number;
  dfl_loss: number;
  mAP50: number;
  mAP50_95: number;
  precision: number;
  recall: number;
  lr: number;
  gpu_memory_used: number;
  epoch_time: number;
}

/**
 * 模型
 */
export interface Model {
  id: string;
  name: string;
  yoloVersion: string;
  datasetId: string;
  trainTaskId?: string;
  status: 'training' | 'trained' | 'failed';
  metrics?: ModelMetrics;
  filePath: string;
  createdAt: string;
}

/**
 * 模型指标
 */
export interface ModelMetrics {
  mAP50: number;
  mAP50_95: number;
  precision: number;
  recall: number;
}

/**
 * 导出任务
 */
export interface ExportTask {
  id: string;
  modelId: string;
  format: 'onnx' | 'tflite' | 'coreml';
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputPath?: string;
  createdAt: string;
}

/**
 * WebSocket 消息
 */
export interface WSMessage {
  type: 'connected' | 'metrics' | 'status' | 'heartbeat';
  task_id?: string;
  timestamp?: number;
  data?: any;
}

/**
 * 环境信息
 */
export interface EnvInfo {
  python: {
    version: string;
    supported: boolean;
  };
  cuda: {
    available: boolean;
    version?: string;
    device_count?: number;
  };
  ultralytics: {
    available: boolean;
    version?: string;
  };
  all_supported: boolean;
}

/**
 * GPU 信息
 */
export interface GPUInfo {
  available: boolean;
  count: number;
  devices: Array<{
    index: number;
    name: string;
    total_memory: number;
  }>;
}
