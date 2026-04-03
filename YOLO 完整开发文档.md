# YOLO Hub - 完整开发文档

> 项目名称：YOLO Hub
> 文档版本：v2.0
> 日期：2026-04-03
> 状态：**全新从头开发**

---

## 一、项目概述

### 1.1 项目背景

YOLO Hub 是一个面向个人研究者/学生的 YOLO 系列模型训练与管理平台，涵盖**数据集管理**、**图像标注**、**模型训练**、**测试验证**、**导出部署**的完整流程。

**重要说明**：本项目为**全新从头开发**，非基于已有项目修改。所有模块均需从零开始实现。

### 1.2 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (Next.js 14+)                       │
│                      Port: 3000                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 数据集管理    │  │ 标注编辑器   │  │ 训练可视化面板       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTP REST / WebSocket
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端 API (FastAPI)                       │
│                      Port: 8000                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 训练管理     │  │ 模型管理     │  │ 导出管理             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    训练引擎 (Ultralytics)                   │
│           支持 YOLOv5 / v8 / v11 / v26 等版本               │
└─────────────────────────────────────────────────────────────┘
```

**前后端完全分离部署**，可独立扩展训练服务。

### 1.3 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| **前端框架** | Next.js | 14.1.0 | 全栈 React 框架，App Router |
| **前端语言** | TypeScript | 5.3.3 | 类型安全 |
| **前端样式** | Tailwind CSS | 3.4.1 | 原子化 CSS |
| **状态管理** | Zustand | 4.5.0 | 轻量级状态管理 |
| **标注画布** | Fabric.js | 5.3.0 | Canvas 操作库 |
| **图表** | Recharts | 2.12.0 | 数据可视化 |
| **后端框架** | FastAPI | - | Python 高性能 API |
| **深度学习** | Ultralytics | - | YOLO 训练与推理 |
| **实时通信** | WebSocket | - | 训练进度推送 |
| **数据库** | SQLite | - | 开发/轻量级存储 |
| **图像处理** | Sharp | 0.33.2 | 服务端图像处理 |
| **任务队列** | Python 原生 | - | 异步训练、任务中断/恢复 |
| **配置管理** | PyYAML | - | 统一配置文件 |

### 1.4 用户体系

单用户工具，无需认证系统。

---

## 二、模块化开发规划

### 2.1 模块划分

本项目分为 **前端模块** 和 **后端模块** 两大类，共 12 个主要模块：

#### 前端模块

| 模块 | 依赖 | 优先级 | 说明 |
|------|------|--------|------|
| M1: 基础框架 | - | P0 | 项目初始化、UI 组件库 |
| M2: 布局与导航 | M1 | P0 | 页面布局、路由、主题 |
| M3: 数据集管理 | M1 | P1 | 数据集 CRUD、图像上传 |
| M4: 标注编辑器 | M1, M3 | P1 | Canvas 标注、5 种任务类型 |
| M5: 格式转换 | M1, M3 | P2 | COCO/VOC/LabelMe/DOTA |
| M6: 训练前端 | M1, M3 | P1 | 训练表单、任务列表 |
| M7: 训练可视化 | M6 | P1 | WebSocket、实时图表 |
| M8: 模型管理前端 | M1 | P2 | 模型列表、详情、删除 |
| M9: 预测前端 | M1, M8 | P2 | 三种预测场景 |

#### 后端模块

| 模块 | 依赖 | 优先级 | 说明 |
|------|------|--------|------|
| M10: 基础后端框架 | - | P0 | FastAPI 架子、数据库、配置 |
| M11: 数据集 API | M10 | P1 | 数据集、图像、标注 CRUD |
| M12: 训练管理后端 | M10 | P1 | 训练任务、队列、中断恢复 |
| M13: 模型管理后端 | M10, M12 | P2 | 模型元数据、删除保护 |
| M14: 导出管理后端 | M10, M13 | P2 | ONNX/TFLite/CoreML 导出 |
| M15: 预测后端 | M10, M13 | P2 | 单张/批量预测 |
| M16: 环境检测 | M10 | P0 | GPU、依赖检测 |
| M17: WebSocket 服务 | M10, M12 | P1 | 实时推送服务 |

### 2.2 开发顺序（避免依赖问题）

```
第一阶段：基础框架（P0）
├── M1:  前端基础框架
└── M10: 后端基础框架

        ↓ 依赖完成

第二阶段：核心 API（P1）
├── M11: 数据集 API
├── M16: 环境检测
└── M12: 训练管理后端

        ↓ 依赖完成

第三阶段：前端核心（P1）
├── M2:  布局与导航
├── M3:  数据集管理前端
└── M6:  训练前端

        ↓ 依赖完成

第四阶段：标注与可视化（P1）
├── M4:  标注编辑器
└── M7:  训练可视化

        ↓ 依赖完成

第五阶段：高级功能（P2）
├── M5:  格式转换
├── M8:  模型管理前端
├── M9:  预测前端
├── M13: 模型管理后端
├── M14: 导出管理后端
└── M15: 预测后端
```

### 2.3 模块依赖图

```
                    ┌─────────────┐
                    │   开始      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ M1 前端框架 │
                    │ M10 后端框架│
                    └──────┬──────┘
                           │
            ┌───────────────┼───────────────┐
            │               │               │
     ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
     │ M11 数据集API │ │ M16 环境检测 │ │ M12 训练后端 │
     └──────┬──────┘ └─────────────┘ └──────┬──────┘
            │                               │
     ┌──────▼──────┐                 ┌──────▼──────┐
     │ M3 数据集前端│                 │ M17 WebSocket│
     └──────┬──────┘                 └──────┬──────┘
            │                               │
     ┌──────▼──────┐                 ┌──────▼──────┐
     │ M2 布局导航  │                 │ M7 可视化前端│
     └──────┬──────┘                 └─────────────┘
            │
     ┌──────▼──────┐
     │ M6 训练前端  │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │ M4 标注编辑器│
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │ M5 格式转换  │
     └─────────────┘

     ─── 依赖关系线 ───

            ┌─────────────┐
            │ M8 模型前端 │
            │ M9 预测前端 │
            │ M13 模型后端│
            │ M14 导出后端│
            │ M15 预测后端│
            └─────────────┘

            ── 可并行开发 ──
```

---

## 三、项目结构

### 3.1 前端目录结构

```
yolo-hub/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 首页（数据集列表）
│   │   ├── globals.css               # 全局样式
│   │   ├── datasets/
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 数据集详情
│   │   │       └── annotate/
│   │   │           └── page.tsx      # 标注编辑器
│   │   ├── formats/
│   │   │   └── convert/
│   │   │       └── page.tsx          # 格式转换
│   │   ├── train/
│   │   │   ├── page.tsx             # 训练列表
│   │   │   ├── [taskId]/
│   │   │   │   └── page.tsx         # 训练详情
│   │   │   └── new/
│   │   │       └── page.tsx         # 新建训练
│   │   ├── models/
│   │   │   ├── page.tsx             # 模型列表
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 模型详情
│   │   ├── predict/
│   │   │   └── page.tsx             # 预测页面
│   │   └── api/                     # API 代理（可选）
│   ├── components/
│   │   ├── ui/                      # M1: 基础 UI 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── alert.tsx
│   │   ├── layout/                  # M2: 布局组件
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── main-layout.tsx
│   │   ├── editor/                  # M4: 标注编辑器
│   │   │   ├── annotation-editor.tsx
│   │   │   ├── toolbar.tsx
│   │   │   ├── class-selector.tsx
│   │   │   ├── properties-panel.tsx
│   │   │   └── image-navigator.tsx
│   │   ├── canvas/                   # M4: Canvas 组件
│   │   │   ├── canvas-wrapper.tsx
│   │   │   └── drawing-tools.ts
│   │   ├── charts/                   # M7: 图表组件
│   │   │   ├── dataset-stats.tsx
│   │   │   └── training-charts.tsx
│   │   └── training/                 # M6: 训练组件
│   │       ├── training-form.tsx
│   │       ├── training-list.tsx
│   │       └── training-status.tsx
│   ├── lib/
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── dataset-store.ts
│   │   │   ├── annotation-store.ts
│   │   │   ├── ui-store.ts
│   │   │   ├── theme-store.ts
│   │   │   ├── training-store.ts
│   │   │   └── model-store.ts
│   │   ├── utils/
│   │   │   ├── cn.ts
│   │   │   ├── file-utils.ts
│   │   │   └── yolo-utils.ts
│   │   ├── yolo/
│   │   │   ├── parser.ts
│   │   │   └── writer.ts
│   │   ├── converters/              # M5: 格式转换
│   │   │   ├── coco.ts
│   │   │   ├── voc.ts
│   │   │   ├── labelme.ts
│   │   │   └── dota.ts
│   │   ├── hooks/                   # React hooks
│   │   │   ├── use-websocket.ts
│   │   │   └── use-api.ts
│   │   └── api/                     # API 客户端
│   │       ├── client.ts
│   │       ├── datasets.ts
│   │       ├── train.ts
│   │       └── models.ts
│   └── types/
│       └── index.ts
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.js
```

### 3.2 后端目录结构

```
server/
├── main.py                          # M10: 应用入口
├── config.py                        # M10: 配置管理
├── requirements.txt
├── routers/                         # M10-M17: 路由模块
│   ├── __init__.py
│   ├── datasets.py                  # M11: 数据集路由
│   ├── train.py                     # M12: 训练路由
│   ├── models.py                    # M13: 模型路由
│   ├── export.py                    # M14: 导出路由
│   ├── predict.py                   # M15: 预测路由
│   └── env.py                       # M16: 环境检测路由
├── services/                        # M10-M17: 业务逻辑
│   ├── __init__.py
│   ├── dataset_service.py           # M11: 数据集服务
│   ├── train_service.py             # M12: 训练服务
│   ├── train_worker.py              # M12: 训练子进程管理
│   ├── model_service.py             # M13: 模型服务
│   ├── export_service.py            # M14: 导出服务
│   ├── predictor.py                 # M15: 预测服务
│   └── gpu_manager.py               # M16: GPU 管理
├── db/                              # M10: 数据库
│   ├── __init__.py
│   ├── database.py
│   ├── models.py
│   └── migrations/
├── websocket/                       # M17: WebSocket
│   ├── __init__.py
│   └── manager.py
├── utils/                           # 工具函数
│   ├── __init__.py
│   ├── file_utils.py
│   └── yolo_utils.py
└── schemas/                         # Pydantic 模型
    ├── __init__.py
    ├── dataset.py
    ├── train.py
    ├── model.py
    └── common.py
```

---

## 四、数据结构设计

### 4.1 核心类型定义

```typescript
// 任务类型
type TaskType = 'detection' | 'segmentation' | 'classification' | 'pose' | 'obb';

// 数据集
interface Dataset {
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

// 图像
interface ImageFile {
  id: string;
  datasetId: string;
  filename: string;
  path: string;
  width: number;
  height: number;
  split: 'train' | 'val' | 'test';
  labeled: boolean;
}

// 标注
interface Label {
  id: string;
  imageId: string;
  type: TaskType;
  classId: number;
  className: string;
  // 根据 type 不同，data 字段不同
  data: DetectionData | SegmentationData | ClassificationData | PoseData | OBBData;
}

// 训练任务
interface TrainingTask {
  id: string;
  datasetId: string;
  modelName: string;
  yoloVersion: string;
  status: 'pending' | 'running' | 'paused' | 'resuming' | 'completed' | 'failed' | 'cancelled';
  config: TrainingConfig;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
}

// 模型
interface Model {
  id: string;
  name: string;
  yoloVersion: string;
  datasetId: string;
  trainTaskId: string;
  status: 'training' | 'trained' | 'failed';
  metrics?: ModelMetrics;
  filePath: string;
  createdAt: string;
}
```

### 4.2 数据集存储结构

```
/datasets
  /{dataset-id}
    /images
      /train
      /val
      /test
    /labels
      /train
      /val
      /test
    dataset.json
    classes.txt
```

### 4.3 模型存储结构

```
/models
  /{dataset_id}
    /{model_name}
      ├── best.pt
      ├── last.pt
      ├── metrics.json
      └── data.yaml
```

---

## 五、统一配置文件

### 5.1 配置文件位置

```
yolo-hub/
├── config.yaml              # 主配置文件（所有配置）
├── src/
│   └── lib/
│       └── config.ts        # 前端配置读取
└── server/
    └── config.py            # 后端配置加载
```

### 5.2 config.yaml 结构

```yaml
# ===========================================
# YOLO Hub 配置文件
# ===========================================

server:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "http://localhost:3000"

storage:
  model_path: "./models"
  dataset_path: "./datasets"
  export_path: "./exports"
  temp_path: "./temp"

upload:
  max_size_mb: 100
  allowed_extensions:
    - ".jpg"
    - ".jpeg"
    - ".png"
    - ".webp"

training:
  max_concurrent: 1
  queue_limit: 10
  default_epochs: 100
  checkpoint_interval: 10

  gpu_batch_size_map:
    4: 8
    8: 16
    12: 32
    16: 64
    24: 128

  yolo_versions:
    - name: "YOLO26"
      pretrained: "yolo26n.pt"
    - name: "YOLO11"
      pretrained: "yolo11n.pt"
    - name: "YOLOv8"
      pretrained: "yolov8n.pt"
    - name: "YOLOv5"
      pretrained: "yolov5n.pt"

export:
  default_imgsz: 640
  default_half: false
  onnx_opset: 12
  verify_after_export: true

cleanup:
  enabled: true
  interval_hours: 24
  task_retention_days: 30

logging:
  level: "INFO"
  file: "./logs/yolo-hub.log"

websocket:
  reconnect_interval_ms: 3000
  max_reconnect_attempts: 10
  heartbeat_interval_ms: 30000
```

---

## 六、功能模块详细说明

### 6.1 M1: 前端基础框架

**开发步骤**：

1. 初始化 Next.js 项目
   ```bash
   npx create-next-app@14.1.0 yolo-hub --typescript --tailwind --eslint
   ```

2. 安装依赖
   ```bash
   npm install zustand fabric recharts clsx tailwind-merge
   ```

3. 创建基础 UI 组件（先开发这些，避免其他模块依赖报错）：
   - `Button.tsx` - 按钮组件
   - `Input.tsx` - 输入框
   - `Card.tsx` - 卡片容器
   - `Modal.tsx` - 模态框
   - `Dropdown.tsx` - 下拉菜单
   - `Tabs.tsx` - 标签页
   - `Alert.tsx` - 警告提示
   - `Tooltip.tsx` - 工具提示

4. 创建工具函数
   - `cn.ts` - className 合并
   - 类型定义 `types/index.ts`

**验收标准**：
- UI 组件可独立运行测试
- 无明显样式问题
- TypeScript 编译无错误

---

### 6.2 M10: 后端基础框架

**开发步骤**：

1. 创建项目结构
   ```bash
   mkdir -p server/{routers,services,db,websocket,utils,schemas}
   ```

2. 安装依赖
   ```bash
   pip install fastapi uvicorn[standard] sqlalchemy pydantic pyyaml python-multipart websockets
   ```

3. 配置管理 (`config.py`)
   - 加载 config.yaml
   - 环境变量覆盖
   - 配置验证

4. 数据库设置 (`db/database.py`, `db/models.py`)
   - SQLAlchemy 连接
   - 数据表定义
   - 数据库初始化

5. FastAPI 主入口 (`main.py`)
   - CORS 配置
   - 路由注册
   - 异常处理

6. 基础 schemas (`schemas/common.py`)
   - 分页参数
   - 通用响应

**验收标准**：
- `uvicorn server.main:app --reload` 可启动
- 访问 `/docs` 显示 API 文档
- 数据库自动创建

---

### 6.3 M11: 数据集 API

**开发步骤**：

1. 数据库模型
   - `Dataset` 表
   - `Image` 表
   - `Label` 表

2. Schemas
   - `DatasetCreate`, `DatasetUpdate`, `DatasetResponse`
   - `ImageUpload`, `ImageResponse`

3. 文件服务 (`services/dataset_service.py`)
   - 文件上传（使用 `python-multipart`）
   - 文件存储
   - 图像处理（使用 Pillow 获取尺寸）

4. 路由 (`routers/datasets.py`)
   - `GET /api/datasets` - 列表
   - `POST /api/datasets` - 创建
   - `GET /api/datasets/{id}` - 详情
   - `PUT /api/datasets/{id}` - 更新
   - `DELETE /api/datasets/{id}` - 删除（含关联检查）
   - `POST /api/datasets/{id}/images` - 上传图像
   - `GET /api/datasets/{id}/images` - 图像列表
   - `DELETE /api/datasets/{id}/images/{imageId}` - 删除图像
   - `GET /api/datasets/{id}/labels/{imageId}` - 获取标注
   - `PUT /api/datasets/{id}/labels/{imageId}` - 保存标注

**验收标准**：
- 可创建数据集
- 可上传图像
- 图像保存到正确目录
- 标注保存/加载正常

---

### 6.4 M16: 环境检测

**开发步骤**：

1. GPU 管理服务 (`services/gpu_manager.py`)
   ```python
   class GPUMemoryManager:
       @staticmethod
       def get_gpu_info() -> dict
       @staticmethod
       def get_recommended_batch_size() -> int
   ```

2. 环境检测服务
   ```python
   class EnvChecker:
       def check_python_version() -> bool
       def check_cuda() -> bool
       def check_ultralytics() -> bool
       def check_all() -> EnvReport
   ```

3. 路由 (`routers/env.py`)
   - `GET /api/env/check` - 完整环境检测
   - `GET /api/env/gpu` - GPU 状态

**验收标准**：
- 正确检测 GPU 型号和显存
- 正确给出 batch_size 建议
- 环境异常时给出明确提示

---

### 6.5 M12: 训练管理后端

**开发步骤**：

1. 训练服务 (`services/train_service.py`)
   - 任务队列管理
   - 任务状态机
   - data.yaml 生成

2. 训练 Worker (`services/train_worker.py`)
   - 子进程管理
   - Ultralytics 训练调用
   - 暂停/恢复/停止实现
   - 指标收集

3. WebSocket 管理 (`websocket/manager.py`)
   - 连接管理
   - 消息推送
   - 心跳机制

4. 路由 (`routers/train.py`)
   - `POST /api/train` - 创建任务
   - `GET /api/train` - 任务列表
   - `GET /api/train/{task_id}` - 任务详情
   - `POST /api/train/{task_id}/pause`
   - `POST /api/train/{task_id}/resume`
   - `POST /api/train/{task_id}/stop`
   - `GET /api/train/{task_id}/metrics`
   - `GET /api/train/{task_id}/weights`

**验收标准**：
- 训练任务可创建和启动
- WebSocket 实时推送正常
- 暂停/恢复/停止功能正常
- 任务状态正确更新

---

### 6.6 M2: 前端布局与导航

**开发步骤**：

1. 主题系统 (`lib/stores/theme-store.ts`)
   - 亮/暗模式切换
   - localStorage 持久化

2. 布局组件
   - `MainLayout.tsx` - 主布局
   - `Header.tsx` - 顶部导航
   - `Sidebar.tsx` - 侧边栏

3. 路由配置
   - `app/layout.tsx` - 根布局
   - 配置各页面路由

4. 全局样式
   - CSS 变量定义
   - 主题样式

**验收标准**：
- 页面布局正常显示
- 主题切换正常
- 导航链接正确

---

### 6.7 M3: 数据集管理前端

**开发步骤**：

1. API 客户端 (`lib/api/datasets.ts`)
   - 封装 API 调用

2. Dataset Store (`lib/stores/dataset-store.ts`)
   - 状态管理
   - API 调用封装

3. 页面组件
   - 首页 `page.tsx` - 数据集列表
   - `datasets/[id]/page.tsx` - 数据集详情

**验收标准**：
- 数据集列表显示正常
- 可创建/编辑/删除数据集
- 图像上传功能正常

---

### 6.8 M6: 训练前端

**开发步骤**：

1. Training Store (`lib/stores/training-store.ts`)
   - 任务状态管理
   - WebSocket 连接管理

2. API 客户端 (`lib/api/train.ts`)

3. 页面组件
   - `train/page.tsx` - 训练列表
   - `train/new/page.tsx` - 新建训练
   - `train/[taskId]/page.tsx` - 训练详情

4. 训练表单组件 (`components/training/training-form.tsx`)
   - 数据集选择
   - YOLO 版本选择
   - 参数配置
   - batch_size 自动建议

**验收标准**：
- 可创建训练任务
- 任务列表显示正确
- 训练详情页面正常

---

### 6.9 M7: 训练可视化

**开发步骤**：

1. WebSocket Hook (`lib/hooks/use-websocket.ts`)
   - 连接管理
   - 自动重连
   - 心跳检测

2. 图表组件 (`components/charts/training-charts.tsx`)
   - 损失曲线
   - mAP 曲线
   - Precision/Recall 曲线
   - GPU 显存曲线

3. 实时日志组件
   - 日志流显示

4. 集成到训练详情页

**验收标准**：
- 实时指标图表正常更新
- 日志实时显示
- 断线重连正常

---

### 6.10 M4: 标注编辑器

**开发步骤**：

1. Canvas 封装 (`components/canvas/canvas-wrapper.tsx`)
   - Fabric.js 初始化
   - 缩放/平移
   - 绘制工具

2. 标注工具 (`components/canvas/drawing-tools.ts`)
   - 矩形框绘制
   - 多边形绘制
   - 关键点绘制
   - 旋转框绘制

3. 编辑器组件
   - `AnnotationEditor.tsx` - 主组件
   - `Toolbar.tsx` - 工具栏
   - `ClassSelector.tsx` - 类别选择
   - `PropertiesPanel.tsx` - 属性面板
   - `ImageNavigator.tsx` - 图像导航

4. Annotation Store

**验收标准**：
- 5 种任务类型标注正常
- 快捷键功能正常
- 标注保存/加载正常

---

### 6.11 M5: 格式转换

**开发步骤**：

1. 转换器实现 (`lib/converters/`)
   - `coco.ts` - COCO 格式
   - `voc.ts` - VOC 格式
   - `labelme.ts` - LabelMe 格式
   - `dota.ts` - DOTA 格式

2. 后端路由 (`routers/convert.py`)
   - `POST /api/convert/import`
   - `POST /api/convert/export`

3. 前端页面 (`formats/convert/page.tsx`)

**验收标准**：
- 可导入 COCO/VOC/LabelMe/DOTA
- 可导出为 COCO/VOC 格式
- 转换正确率高

---

### 6.12 M8: 模型管理前端

**开发步骤**：

1. Model Store (`lib/stores/model-store.ts`)

2. API 客户端 (`lib/api/models.ts`)

3. 页面组件
   - `models/page.tsx` - 模型列表
   - `models/[id]/page.tsx` - 模型详情

**验收标准**：
- 模型列表显示正确
- 删除保护提示正常
- 关联数据集可跳转

---

### 6.13 M9: 预测前端

**开发步骤**：

1. 预测 API (`lib/api/predict.ts`)

2. 页面组件 (`predict/page.tsx`)
   - 模型选择
   - 模式切换（快速验证/独立预测/批量预测）
   - 结果展示

**验收标准**：
- 单张预测正常
- 批量预测正常
- 结果可视化正常

---

### 6.14 M13-M15: 模型/导出/预测后端

**开发步骤**：

1. 模型服务 (`services/model_service.py`)
   - 模型元数据管理
   - 删除保护检查

2. 导出服务 (`services/export_service.py`)
   - ONNX 导出
   - 其他格式导出
   - 导出验证

3. 预测服务 (`services/predictor.py`)
   - 单张预测
   - 批量预测

4. 路由
   - `routers/models.py`
   - `routers/export.py`
   - `routers/predict.py`

**验收标准**：
- 模型管理正常
- ONNX 导出正常
- 预测结果正确

---

## 七、API 接口设计

### 7.1 数据集管理

| 方法 | 路径 | 模块 | 说明 |
|------|------|------|------|
| GET | `/api/datasets` | M11 | 获取数据集列表 |
| POST | `/api/datasets` | M11 | 创建数据集 |
| GET | `/api/datasets/{id}` | M11 | 获取数据集详情 |
| PUT | `/api/datasets/{id}` | M11 | 更新数据集 |
| DELETE | `/api/datasets/{id}` | M11 | 删除数据集 |
| POST | `/api/datasets/{id}/images` | M11 | 上传图像 |
| GET | `/api/datasets/{id}/images` | M11 | 获取图像列表 |
| DELETE | `/api/datasets/{id}/images/{imageId}` | M11 | 删除图像 |
| GET | `/api/datasets/{id}/labels/{imageId}` | M11 | 获取标注 |
| PUT | `/api/datasets/{id}/labels/{imageId}` | M11 | 保存标注 |

### 7.2 训练相关

| 方法 | 路径 | 模块 | 说明 |
|------|------|------|------|
| POST | `/api/train` | M12 | 创建训练任务 |
| GET | `/api/train` | M12 | 列出训练任务 |
| GET | `/api/train/{task_id}` | M12 | 获取任务详情 |
| POST | `/api/train/{task_id}/pause` | M12 | 暂停训练 |
| POST | `/api/train/{task_id}/resume` | M12 | 恢复训练 |
| POST | `/api/train/{task_id}/stop` | M12 | 停止训练 |
| GET | `/api/train/{task_id}/metrics` | M12 | 获取训练指标 |
| GET | `/api/train/{task_id}/weights` | M12 | 下载权重 |

### 7.3 模型相关

| 方法 | 路径 | 模块 | 说明 |
|------|------|------|------|
| GET | `/api/models` | M13 | 列出模型 |
| GET | `/api/models/{id}` | M13 | 模型详情 |
| DELETE | `/api/models/{id}` | M13 | 删除模型 |

### 7.4 导出相关

| 方法 | 路径 | 模块 | 说明 |
|------|------|------|------|
| POST | `/api/export` | M14 | 创建导出任务 |
| GET | `/api/export/{id}` | M14 | 导出进度 |
| GET | `/api/export/{id}/download` | M14 | 下载导出文件 |

### 7.5 预测相关

| 方法 | 路径 | 模块 | 说明 |
|------|------|------|------|
| POST | `/api/predict` | M15 | 单张图片预测 |
| POST | `/api/predict/batch` | M15 | 批量预测 |

### 7.6 环境相关

| 方法 | 路径 | 模块 | 说明 |
|------|------|------|------|
| GET | `/api/env/check` | M16 | 环境检测 |
| GET | `/api/env/gpu` | M16 | GPU 状态 |

### 7.7 WebSocket

| 路径 | 说明 |
|------|------|
| `/ws/{task_id}` | 训练实时可视化 |

---

## 八、数据库设计

### 8.1 数据表

#### datasets 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 名称 |
| description | TEXT | 描述 |
| task_type | TEXT | 任务类型 |
| classes | TEXT | JSON 类别列表 |
| split | TEXT | JSON 划分比例 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### images 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| dataset_id | TEXT | 关联数据集 |
| filename | TEXT | 文件名 |
| path | TEXT | 存储路径 |
| width | INTEGER | 宽度 |
| height | INTEGER | 高度 |
| split | TEXT | train/val/test |
| labeled | BOOLEAN | 是否已标注 |

#### train_tasks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| dataset_id | TEXT | 关联数据集 |
| model_name | TEXT | 模型名称 |
| yolo_version | TEXT | YOLO 版本 |
| status | TEXT | 状态 |
| config | TEXT | JSON 配置 |
| created_at | DATETIME | 创建时间 |
| started_at | DATETIME | 开始时间 |
| finished_at | DATETIME | 结束时间 |
| error_message | TEXT | 错误信息 |

#### models 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| name | TEXT | 名称 |
| yolo_version | TEXT | YOLO 版本 |
| dataset_id | TEXT | 关联数据集 |
| train_task_id | TEXT | 关联训练任务 |
| status | TEXT | 状态 |
| metrics | TEXT | JSON 指标 |
| file_path | TEXT | 文件路径 |
| created_at | DATETIME | 创建时间 |

#### exports 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| model_id | TEXT | 关联模型 |
| format | TEXT | 导出格式 |
| status | TEXT | 状态 |
| output_path | TEXT | 输出路径 |
| created_at | DATETIME | 创建时间 |

#### metrics 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| task_id | TEXT | 关联任务 |
| epoch | INTEGER | 轮次 |
| box_loss | REAL | 边界框损失 |
| cls_loss | REAL | 分类损失 |
| mAP50 | REAL | mAP@0.5 |
| mAP50_95 | REAL | mAP@0.5:0.95 |
| precision | REAL | 精确率 |
| recall | REAL | 召回率 |
| timestamp | DATETIME | 时间戳 |

---

## 九、避免开发问题的注意事项

### 9.1 模块依赖问题

| 问题 | 解决方案 |
|------|----------|
| M4 依赖 M1 的组件未完成 | M1 的 UI 组件必须先完成并测试 |
| M7 依赖 M12 的 WebSocket | M12 必须先完成 WebSocket 管理器 |
| M6 依赖 M3 的数据集选择 | M3 的数据集列表必须先完成 |

**原则**：每个模块开发完成后，写一个简单的 Demo 页面测试，确认为可用的基础模块后再开发依赖它的模块。

### 9.2 前后端接口协调

| 问题 | 解决方案 |
|------|----------|
| 前端开发时后端 API 还未完成 | 使用 Mock API 先行开发 |
| 接口字段不一致 | 先定义 Schema，双方遵守 |
| CORS 问题 | 后端 CORS 配置先加上 |

**原则**：后端每完成一个模块的 API，前端及时对接，遇到问题及时沟通。

### 9.3 状态管理问题

| 问题 | 解决方案 |
|------|----------|
| 多组件共享状态混乱 | 使用 Zustand store 统一管理 |
| WebSocket 状态与 store 状态不一致 | WebSocket 只负责推送，store 负责状态更新 |
| 页面刷新状态丢失 | 关键状态 localStorage 持久化 |

### 9.4 性能问题

| 问题 | 解决方案 |
|------|----------|
| 大量图像加载卡顿 | 懒加载 + 分页 |
| Canvas 绘制卡顿 | 合理使用 Fabric.js 缓存 |
| WebSocket 消息堆积 | 只保留最新数据，图表历史有限 |

### 9.5 训练进程问题

| 问题 | 解决方案 |
|------|----------|
| 训练进程僵死 | 设置超时，强制 kill |
| 训练中断后无法恢复 | 每次 epoch 保存 checkpoint |
| 多任务并发冲突 | 任务队列 + 互斥锁 |

---

## 十、实现计划（详细版）

### Phase 1: 基础框架（第 1-2 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 1.1 | M1 | 初始化 Next.js 项目 | 可运行的项目架子 |
| 1.2 | M1 | 开发基础 UI 组件 | 8+ 组件 |
| 1.3 | M1 | 工具函数和类型定义 | cn.ts, types |
| 1.4 | M10 | 初始化 FastAPI 项目 | 可运行的后端架子 |
| 1.5 | M10 | 配置管理系统 | config.yaml + config.py |
| 1.6 | M10 | 数据库设置 | SQLAlchemy 模型 + 初始化 |
| 1.7 | M10 | FastAPI 主入口 | CORS + 路由注册 |

**Phase 1 验收**：前后端架子均可运行，UI 组件正常显示。

### Phase 2: 数据集管理（第 3-4 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 2.1 | M11 | 数据集 CRUD API | 5 个 API 端点 |
| 2.2 | M11 | 图像上传 API | 支持拖拽上传 |
| 2.3 | M11 | 标注保存/加载 API | YOLO 格式读写 |
| 2.4 | M11 | 删除关联检查 | 保护逻辑 |
| 2.5 | M2 | 主题系统 | 亮/暗模式 |
| 2.6 | M2 | 布局组件 | Header, Sidebar, Layout |
| 2.7 | M3 | Dataset Store | 状态管理 |
| 2.8 | M3 | 数据集列表页 | 首页 |
| 2.9 | M3 | 数据集详情页 | 图像上传/管理 |

**Phase 2 验收**：可创建数据集、上传图像、进行基本的数据集管理。

### Phase 3: 训练后端（第 5-6 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 3.1 | M16 | GPU 管理服务 | 显存检测/推荐 |
| 3.2 | M16 | 环境检测 API | /env/check, /env/gpu |
| 3.3 | M12 | 训练服务 | 任务队列/状态机 |
| 3.4 | M12 | 训练 Worker | 子进程管理 |
| 3.5 | M12 | data.yaml 生成 | 自动生成配置 |
| 3.6 | M17 | WebSocket 管理器 | 连接/推送/心跳 |
| 3.7 | M12 | 训练路由 | 完整的训练 API |

**Phase 3 验收**：后端训练功能完整，可启动训练并推送实时指标。

### Phase 4: 训练前端（第 7-8 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 4.1 | M6 | Training Store | 状态管理 |
| 4.2 | M6 | 训练列表页 | /train |
| 4.3 | M6 | 新建训练页 | /train/new |
| 4.4 | M6 | 训练表单 | 参数配置/自动建议 |
| 4.5 | M7 | WebSocket Hook | use-websocket |
| 4.6 | M7 | 图表组件 | 损失/mAP/显存曲线 |
| 4.7 | M7 | 训练详情页 | 实时可视化 |

**Phase 4 验收**：完整的训练流程：创建 → 监控 → 完成。

### Phase 5: 标注编辑器（第 9-10 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|--------|--------|
| 5.1 | M4 | Canvas 封装 | Fabric.js 集成 |
| 5.2 | M4 | 绘制工具 | 矩形/多边形/关键点/旋转框 |
| 5.3 | M4 | Annotation Store | 标注状态管理 |
| 5.4 | M4 | 标注编辑器页面 | /datasets/[id]/annotate |
| 5.5 | M4 | 快捷键支持 | 完整快捷键 |
| 5.6 | M4 | 标注保存/加载 | 与 M11 API 对接 |

**Phase 5 验收**：5 种任务类型的标注功能完整。

### Phase 6: 模型与导出（第 11-12 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 6.1 | M13 | 模型服务 | 元数据/删除保护 |
| 6.2 | M13 | 模型路由 | CRUD API |
| 6.3 | M8 | Model Store | 状态管理 |
| 6.4 | M8 | 模型列表页 | /models |
| 6.5 | M8 | 模型详情页 | 指标/关联展示 |
| 6.6 | M14 | 导出服务 | ONNX/TFLite/CoreML |
| 6.7 | M14 | 导出路由 | 导出 API |

**Phase 6 验收**：模型管理完整，ONNX 导出正常。

### Phase 7: 预测与格式转换（第 13-14 周）

| 步骤 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 7.1 | M15 | 预测服务 | 单张/批量预测 |
| 7.2 | M15 | 预测路由 | /predict API |
| 7.3 | M9 | 预测前端 | 三种场景 |
| 7.4 | M5 | 格式转换器 | COCO/VOC/LabelMe/DOTA |
| 7.5 | M5 | 格式转换页面 | /formats/convert |
| 7.6 | - | 集成测试 | 全流程测试 |
| 7.7 | - | Bug 修复 | 问题修复 |

**Phase 7 验收**：所有功能可用，流程跑通。

### Phase 8: 优化与收尾（第 15-16 周）

| 步骤 | 任务 | 交付物 |
|------|------|--------|
| 8.1 | 性能优化 | 大数据集测试 |
| 8.2 | UI 优化 | 样式/交互优化 |
| 8.3 | 文档完善 | API 文档/使用说明 |
| 8.4 | 清理代码 | 代码审查/重构 |

---

## 十一、前端 UI 设计规范

### 11.1 设计系统

#### 颜色系统

```css
/* 亮色主题 */
:root {
  /* 主色 */
  --color-primary: #3B82F6;        /* 蓝色 - 主要操作 */
  --color-primary-hover: #2563EB;
  --color-primary-light: #DBEAFE;

  /* 成功色 */
  --color-success: #10B981;        /* 绿色 - 成功状态 */
  --color-success-light: #D1FAE5;

  /* 警告色 */
  --color-warning: #F59E0B;        /* 黄色 - 警告 */
  --color-warning-light: #FEF3C7;

  /* 危险色 */
  --color-danger: #EF4444;         /* 红色 - 错误/删除 */
  --color-danger-light: #FEE2E2;

  /* 中性色 */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F3F4F6;
  --color-bg-tertiary: #E5E7EB;
  --color-border: #D1D5DB;
  --color-text: #111827;
  --color-text-secondary: #6B7280;
  --color-text-muted: #9CA3AF;
}

/* 暗色主题 */
.dark {
  --color-bg: #111827;
  --color-bg-secondary: #1F2937;
  --color-bg-tertiary: #374151;
  --color-border: #4B5563;
  --color-text: #F9FAFB;
  --color-text-secondary: #D1D5DB;
  --color-text-muted: #9CA3AF;
}
```

#### 字体系统

```css
/* 字体家族 */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* 字体大小 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* 字重 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### 间距系统

```css
/* 基础间距单位: 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* 圆角 */
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-full: 9999px;
```

#### 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

#### 动画系统

```css
/* 过渡时长 */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

/* 缓动函数 */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

### 11.2 组件设计规范

#### Button 按钮

| 变体 | 使用场景 |
|------|----------|
| `primary` | 主要操作，如"创建"、"保存" |
| `secondary` | 次要操作，如"取消" |
| `ghost` | 低优先级操作，如"返回" |
| `danger` | 危险操作，如"删除" |

```tsx
// 尺寸规格
// small: h-8 px-3 text-sm
// medium: h-10 px-4 text-base (默认)
// large: h-12 px-6 text-lg

// 状态
// default → hover → active → disabled
```

**使用规范**：
- 按钮组中，主要按钮放最后
- 一个区域最多 3 个按钮
- 危险操作需要二次确认

#### Input 输入框

```tsx
// 状态
default → focus → error → disabled

// 规格
height: 40px
padding: 0 12px
border-radius: 6px
border: 1px solid var(--color-border)

// 错误状态
border-color: var(--color-danger)
error message: text-sm, color-danger
```

**使用规范**：
- 必须有 label
- error 状态显示错误信息
- 支持前缀/后缀图标

#### Card 卡片

```tsx
// 规格
padding: 16px 或 24px
border-radius: 12px
background: var(--color-bg)
border: 1px solid var(--color-border)
shadow: var(--shadow-sm)

// 可选 header/footer
header-border-bottom: 1px solid var(--color-border)
```

#### Modal 模态框

```tsx
// 规格
max-width: 480px (小) / 640px (中) / 800px (大)
padding: 24px
border-radius: 16px
backdrop: rgba(0, 0, 0, 0.5)

// 动画
scale: 0.95 → 1
opacity: 0 → 1
duration: var(--duration-normal)
```

**使用规范**：
- 打开时 body 禁止滚动
- 点击 backdrop 或 Escape 关闭
- 必须有 title 和 footer

#### Dropdown 下拉菜单

```tsx
// 规格
min-width: 180px
max-height: 320px (超过滚动)
padding: 4px
border-radius: 8px
shadow: var(--shadow-lg)

// item 规格
padding: 8px 12px
hover-bg: var(--color-bg-secondary)
border-radius: 6px
```

#### Tabs 标签页

```tsx
// 规格
tab-height: 40px
tab-padding: 0 16px
underline-width: 2px
underline-color: var(--color-primary)

// 状态
default → hover → active
active 下方有 underline
```

#### Table 表格

```tsx
// 表头
height: 48px
background: var(--color-bg-secondary)
font-weight: 600
text-align: left
border-bottom: 1px solid var(--color-border)

// 单元格
height: 56px
padding: 0 16px
border-bottom: 1px solid var(--color-border)
hover-bg: var(--color-bg-secondary)
```

#### 空状态

```tsx
// 规格
icon-size: 64px
icon-color: var(--color-text-muted)
title: text-xl, font-semibold
description: text-base, color-text-secondary
spacing: 16px
```

---

### 11.3 页面布局规范

#### 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│                         Header (64px)                         │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  Sidebar   │                  Main Content                  │
│  (240px)   │                                                 │
│            │                                                 │
│            │                                                 │
│            │                                                 │
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

**Header 规范**：
- 高度：64px
- 左侧：Logo
- 中间：页面标题（可选）
- 右侧：主题切换 + 用户信息

**Sidebar 规范**：
- 宽度：240px（可折叠至 64px）
- 导航项高度：40px
- 图标大小：20px
- 支持折叠展开

#### 页面内布局模式

**模式 A：列表页**
```
┌──────────────────────────────────────────────────────────────┐
│  Page Header (标题 + 操作按钮)                                │
├──────────────────────────────────────────────────────────────┤
│  Filter Bar (筛选/搜索)                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Content (卡片列表 / 表格)                                    │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Pagination (分页)                                           │
└──────────────────────────────────────────────────────────────┘
```

**模式 B：详情页**
```
┌──────────────────────────────────────────────────────────────┐
│  Breadcrumb + Page Header                                    │
├─────────────────────────────────┬────────────────────────────┤
│                                 │                            │
│  Main Content (主要信息)         │  Side Panel (侧边信息)     │
│                                 │                            │
│                                 │                            │
│                                 │                            │
├─────────────────────────────────┴────────────────────────────┤
│  Action Bar (操作按钮)                                        │
└──────────────────────────────────────────────────────────────┘
```

**模式 C：编辑器页（如标注页）**
```
┌──────────────────────────────────────────────────────────────┐
│  Toolbar (工具栏)                                             │
├────────────────────────────────────────────┬─────────────────┤
│                                            │                 │
│                                            │  Properties     │
│           Canvas (画布区域)                  │  Panel         │
│                                            │  (240px)       │
│                                            │                 │
├────────────────────────────────────────────┴─────────────────┤
│  Image Navigator (图像导航栏)                                  │
└──────────────────────────────────────────────────────────────┘
```

---

### 11.4 主要页面 UI 设计

#### 首页（数据集列表）

```
┌──────────────────────────────────────────────────────────────┐
│  YOLO Hub                                    [☀️/🌙]          │
├────────────┬─────────────────────────────────────────────────┤
│            │                                                 │
│  📊 数据集  │  ┌─────────────────────────────────────────────┐│
│  🎯 训练    │  │  创建数据集                                   ││
│  📦 模型    │  └─────────────────────────────────────────────┘│
│  🔮 预测    │                                                 │
│  🔄 格式转换│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  ⚙️ 设置    │  │ Dataset 1  │  │ Dataset 2  │  │ Dataset 3  ││
│            │  │ 100 张图像  │  │ 200 张图像  │  │ 50 张图像   ││
│            │  │ ✅ 已完成   │  │ 🔄 进行中   │  │ 📝 部分标注 ││
│            │  └────────────┘  └────────────┘  └────────────┘│
│            │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

**卡片内容**：
- 数据集名称
- 任务类型标签
- 图像数量
- 标注进度
- 创建时间
- 操作按钮（编辑/删除/开始训练）

#### 标注编辑器

```
┌──────────────────────────────────────────────────────────────┐
│ ← 返回  数据集名称                    [保存] [AI标注] [⚙️]    │
├──────────────────────────────────────────────────────────────┤
│ [🖱️选择] [📦矩形框] [⬡多边形] [⭕关键点] [🔄旋转框] [🏷️分类]│
├────────────────────────────────────────────┬─────────────────┤
│                                            │ 类别: [person▼] │
│                                            ├─────────────────┤
│                                            │ 属性            │
│                                            │                 │
│           [图像画布区域]                     │ 类别: person    │
│                                            │ 置信度: --      │
│                                            │ 可见性: --      │
│                                            │                 │
│                                            ├─────────────────┤
│                                            │ 图层            │
│                                            │ ☑ person 1     │
│                                            │ ☑ car 2         │
├────────────────────────────────────────────┴─────────────────┤
│ [◀] [▶]  图像 3/100  [缩放 -] 100% [缩放 +]                  │
└──────────────────────────────────────────────────────────────┘
```

**功能区说明**：

| 区域 | 内容 | 宽度 |
|------|------|------|
| 工具栏 | 选择、绘制工具 | 高度 48px |
| 画布 | 标注区域 | 自适应 |
| 属性面板 | 类别、属性编辑 | 240px |
| 图像导航 | 缩略图、翻页 | 高度 80px |

#### 训练详情页

```
┌──────────────────────────────────────────────────────────────┐
│ ← 返回  训练详情                           [⏸️暂停] [⏹️停止] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  状态: 🔄 运行中           Epoch: 45/100                      │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐│
│  │      mAP50: 0.82        │  │      损失曲线              ││
│  │      mAP50-95: 0.56    │  │      [图表]                ││
│  │      Precision: 0.78   │  │                           ││
│  │      Recall: 0.75      │  │                           ││
│  └─────────────────────────┘  └─────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐│
│  │     GPU 状态            │  │      训练日志               ││
│  │     GPU: RTX 4090      │  │      [实时滚动]             ││
│  │     显存: 10.5/16 GB   │  │      2024-01-01 10:30:45   ││
│  │     使用率: 85%        │  │      Epoch 45 completed    ││
│  └─────────────────────────┘  └─────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 训练新建页

```
┌──────────────────────────────────────────────────────────────┐
│ ← 返回  新建训练任务                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  1. 选择数据集                                           ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │ [选择数据集 ▼]                                      │││
│  │  │                                                     │││
│  │  │ 名称: my-dataset                                    │││
│  │  │ 图像: 100 张  |  标注完成: 100%  |  状态: ✅          │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  2. 模型配置                                             ││
│  │  模型名称: [____________________________] (my-dataset)  ││
│  │  YOLO版本: [YOLO11 ▼]                                  ││
│  │  预训练模型: [yolo11n.pt ▼]                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  3. 训练参数                    [自动推荐]               ││
│  │                                                         ││
│  │  Epochs:      [____100____]  (1-1000)                  ││
│  │  Batch Size:  [____16_____]  GPU建议: 16              ││
│  │  图像尺寸:    [____640____]  (320-4096)                ││
│  │  早停耐心:    [_____50____]  (0-500)                   ││
│  │  学习率:      [____0.01___]                            ││
│  │  数据增强:    [☑️ 启用  ]                               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  4. 环境检查                    [检测环境]              ││
│  │  ✅ Python 3.10                                         ││
│  │  ✅ CUDA 12.1                                          ││
│  │  ✅ GPU: RTX 4090 (24GB)                               ││
│  │  ✅ Ultralytics 8.0.0                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│                        [取消]  [开始训练]                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 11.5 响应式设计

#### 断点定义

```css
/* 移动端优先 */
--breakpoint-sm: 640px;   /* 小平板 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小屏电脑 */
--breakpoint-xl: 1280px;  /* 标准屏 */
--breakpoint-2xl: 1536px; /* 大屏 */
```

#### 响应式布局策略

| 屏幕 | 布局调整 |
|------|----------|
| < 768px (移动端) | Sidebar 隐藏 → 汉堡菜单 |
| 768px - 1024px (平板) | Sidebar 可折叠 |
| > 1024px (桌面) | 完整布局 |

#### 标注编辑器响应式

| 屏幕 | 布局调整 |
|------|----------|
| < 768px | 属性面板移至底部 |
| 768px - 1024px | 属性面板可折叠 |
| > 1024px | 完整三栏布局 |

---

### 11.6 状态设计

#### 全局状态

| 状态 | 存储位置 | 说明 |
|------|----------|------|
| 主题 | localStorage | 亮/暗模式 |
| 用户偏好 | localStorage | 如侧边栏折叠状态 |
| 当前语言 | localStorage | 国际化预留 |

#### 数据状态

| 状态 | UI 表现 |
|------|----------|
| Loading | Skeleton / Spinner |
| Empty | 空状态插图 + 提示 |
| Error | ErrorBoundary + 重试按钮 |
| Success | Toast 提示 |

#### 网络状态

| 状态 | UI 表现 |
|------|----------|
| Loading | 按钮 loading / 页面骨架 |
| Offline | 全局提示条 |
| Error | Toast / ErrorBoundary |

---

### 11.7 标注编辑器交互设计

#### 画布交互

| 操作 | 行为 |
|------|------|
| 鼠标滚轮 | 缩放画布 |
| Space + 鼠标拖拽 | 平移画布 |
| 单击标注 | 选中标注 |
| 双击标注 | 编辑标注属性 |
| 单击空白处 | 取消选中 |
| 拖拽空白处 | 框选多个标注 |

#### 绘制工具交互

**矩形框绘制**：
1. 选择矩形工具
2. 按下鼠标确定起始点
3. 拖动鼠标显示预览框
4. 松开鼠标完成绘制
5. 弹出类别选择器
6. 选择类别完成标注

**多边形绘制**：
1. 选择多边形工具
2. 单击确定第一个顶点
3. 继续单击添加顶点
4. 单击起始点或按 Enter 完成
5. 弹出类别选择器
6. 选择类别完成标注

**关键点绘制（Pose）**：
1. 选择关键点工具
2. 单击图像添加关键点
3. 拖动调整位置
4. 右键切换可见性（0/1/2）
5. 多个关键点自动连接成骨架

**旋转框绘制**：
1. 选择旋转框工具
2. 按下鼠标确定中心点
3. 拖动确定方向和大小
4. 滚轮调整旋转角度
5. 松开鼠标完成
6. 弹出类别选择器

**分类标签**：
1. 选择分类工具
2. 单击图像
3. 弹出类别选择下拉框
4. 选择类别直接完成

#### 标注选中状态

```
未选中: 边框 1px solid #3B82F6 (半透明)
选中:   边框 2px solid #3B82F6
        8个控制点 (8x8px 实心蓝色方块)
        显示类别标签
```

#### 标注操作

| 操作 | 快捷键 | 行为 |
|------|--------|------|
| 移动标注 | 拖拽 | 拖动选中标注 |
| 缩放标注 | 拖拽控制点 | 调整标注大小 |
| 旋转标注 | 滚轮 | 旋转选中标注（OBB） |
| 删除标注 | `Delete` | 删除选中标注 |
| 复制标注 | `Ctrl+C` | 复制到剪贴板 |
| 粘贴标注 | `Ctrl+V` | 粘贴标注 |
| 全选 | `Ctrl+A` | 选择所有标注 |
| 取消选择 | `Escape` | 取消选择 |

#### 标注属性编辑

右侧属性面板显示当前选中标注的属性：

```
┌─────────────────────┐
│ 属性                 │
├─────────────────────┤
│ 类别    [person ▼]  │
│                     │
│ 坐标                │
│ X: 0.512           │
│ Y: 0.483           │
│ W: 0.156           │
│ H: 0.228           │
│                     │
│ 置信度: -- (手动标注) │
│                     │
│ [删除标注]          │
└─────────────────────┘
```

#### 图像导航

```
┌──────────────────────────────────────────────────────────────┐
│ [◀]  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ [▶]  │
│      │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │ │ 6  │ │ 7  │      │
│      │☑️  │ │☑️  │ │⬜  │ │☑️  │ │⬜  │ │☑️  │ │☑️  │      │
│      └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘      │
│                                                              │
│                    图像 3/100  [100%]                       │
└──────────────────────────────────────────────────────────────┘

图例: ☑️ 已标注  ⬜ 未标注  🟡 当前选中
```

**功能**：
- 缩略图网格显示
- 点击切换图像
- 左右箭头切换
- 键盘 ←/→ 切换
- 跳转到指定图像

#### 缩放控制

| 操作 | 行为 |
|------|------|
| 鼠标滚轮 | 以鼠标位置为中心缩放 |
| +/- 按钮 | 以画布中心缩放 |
| 双击画布 | 适应窗口 |
| 双击 + Alt | 原始尺寸 (100%) |
| 快捷键 `0` | 适应窗口 |
| 快捷键 `1` | 原始尺寸 |

**缩放范围**：10% - 400%

#### 自动保存

- 切换图像时自动保存当前标注
- 检测到标注变化后 2 秒自动保存
- 保存时显示保存状态指示器
- 保存失败显示重试按钮

---

### 11.8 交互规范

#### 页面切换
- 使用 `<Link>` 而非 `<a>`
- 页面切换时显示加载指示器
- 保持滚动位置

#### 表单交互
- 实时表单验证（blur 时）
- 错误信息紧跟输入框
- 提交时按钮显示 loading

#### 数据操作
- 删除操作需二次确认
- 成功操作显示 Toast
- 失败操作显示错误详情

#### 快捷键（标注编辑器）

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存标注 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `Delete` | 删除选中标注 |
| `1-9` | 快速切换类别 |
| `←/→` | 上/下一张图像 |
| `+/-` | 放大/缩小 |
| `Space+Drag` | 平移画布 |
| `Escape` | 取消当前绘制 |

---

## 十二、错误处理规范

### 12.1 前端错误处理

#### ErrorBoundary

```tsx
// components/error/error-boundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // 上报错误日志
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Alert type="error" title="页面出错了">
            <p>{this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()}>刷新页面</Button>
          </Alert>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### API 错误处理

```typescript
// lib/api/client.ts
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 统一的错误处理
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.message || '请求失败',
      response.status,
      error.code
    );
  }
  return response.json();
}

// 使用示例
try {
  const data = await api.getDataset(id);
} catch (e) {
  if (e instanceof APIError) {
    switch (e.statusCode) {
      case 404:
        toast.error('数据集不存在');
        break;
      case 403:
        toast.error('无权访问此数据集');
        break;
      default:
        toast.error(e.message);
    }
  }
}
```

#### Toast 提示规范

| 类型 | 使用场景 |
|------|----------|
| success | 操作成功（保存、删除、创建） |
| error | 操作失败 |
| warning | 警告（环境异常、存储空间不足） |
| info | 普通提示 |

---

### 12.2 后端错误处理

#### 异常类定义

```python
# server/schemas/common.py
from fastapi import HTTPException

class DatasetNotFoundException(HTTPException):
    def __init__(self, dataset_id: str):
        super().__init__(
            status_code=404,
            detail=f"数据集 {dataset_id} 不存在"
        )

class DatasetInUseException(HTTPException):
    def __init__(self, dataset_id: str, task_count: int):
        super().__init__(
            status_code=409,
            detail={
                "message": f"该数据集已被 {task_count} 个训练任务使用，无法删除",
                "code": "DATASET_IN_USE",
                "related_tasks": []  # 关联任务列表
            }
        )

class TrainingException(Exception):
    """训练相关异常"""
    pass

class GPUMemoryExceededException(TrainingException):
    """GPU 显存不足"""
    pass
```

#### 全局异常处理

```python
# server/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

@app.exception_handler(DatasetNotFoundException)
async def dataset_not_found_handler(request: Request, exc: DatasetNotFoundException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "code": "NOT_FOUND"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # 记录日志
    logger.exception(f"未处理的异常: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "服务器内部错误",
            "code": "INTERNAL_ERROR"
        }
    )
```

#### 日志格式规范

```python
# 所有日志使用统一格式
{
    "timestamp": "2024-01-01T10:30:45.123Z",
    "level": "INFO",  # DEBUG, INFO, WARNING, ERROR
    "service": "yolo-hub",
    "module": "train_service",
    "message": "训练任务已启动",
    "context": {
        "task_id": "xxx",
        "dataset_id": "yyy"
    },
    "trace_id": "abc123"  # 请求追踪ID
}
```

---

### 12.3 安全性考虑

#### 文件上传安全

```python
# server/services/dataset_service.py

class FileUploadValidator:
    """文件上传验证"""

    # 允许的扩展名
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

    # 最大文件大小 (100MB)
    MAX_FILE_SIZE = 100 * 1024 * 1024

    # 最大图像尺寸 (防止恶意大图)
    MAX_IMAGE_DIMENSION = 4096

    @staticmethod
    def validate_filename(filename: str) -> bool:
        """防止路径遍历攻击"""
        # 禁止包含路径分隔符
        if '/' in filename or '\\' in filename:
            return False
        # 禁止包含 .. (父目录引用)
        if '..' in filename:
            return False
        # 禁止特殊字符
        if any(c in filename for c in ['<', '>', ':', '"', '|', '?', '*']):
            return False
        return True

    @staticmethod
    def validate_file_size(size: int) -> bool:
        return size <= FileUploadValidator.MAX_FILE_SIZE

    @staticmethod
    async def validate_image_content(file_path: str) -> tuple[bool, str]:
        """验证图像内容（不只是扩展名）"""
        try:
            img = Image.open(file_path)
            width, height = img.size
            if width > FileUploadValidator.MAX_IMAGE_DIMENSION or \
               height > FileUploadValidator.MAX_IMAGE_DIMENSION:
                return False, "图像尺寸过大"
            return True, ""
        except Exception:
            return False, "无法读取图像文件"
```

#### SQL 注入防护

```python
# 使用 SQLAlchemy ORM，自动防止 SQL 注入
# 错误示例
query = f"SELECT * FROM datasets WHERE id = '{dataset_id}'"  # 危险！

# 正确示例
result = db.query(Dataset).filter(Dataset.id == dataset_id).first()
```

#### 路径遍历防护

```python
# server/services/dataset_service.py
import os
from pathlib import Path

def safe_join(*paths) -> Path:
    """安全地拼接路径"""
    base = Path(config.DATASET_PATH).resolve()
    joined = (base / Path(*paths)).resolve()

    # 确保最终路径在 base 目录下（防止 .. 逃逸）
    if not str(joined).startswith(str(base)):
        raise ValueError("路径遍历攻击检测")

    return joined
```

---

## 十三、测试方案

### 13.1 测试框架

| 类型 | 前端框架 | 后端框架 |
|------|----------|----------|
| 单元测试 | Vitest | pytest |
| 组件测试 | React Testing Library | - |
| E2E 测试 | Playwright | pytest + httpx |

### 13.2 前端测试

```bash
# 安装测试依赖
npm install -D vitest @testing-library/react @testing-library/user-event @playwright/test

# 单元测试示例
// __tests__/stores/dataset-store.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatasetStore } from '@/lib/stores/dataset-store';

describe('useDatasetStore', () => {
  it('should fetch datasets', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1', name: 'Test' }])
    });

    const { result } = renderHook(() => useDatasetStore());
    await result.current.fetchDatasets();

    expect(result.current.datasets).toHaveLength(1);
  });
});
```

```typescript
// 组件测试示例
// __tests__/components/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole('button', { name: /click me/i }));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### 13.3 后端测试

```bash
# 安装测试依赖
pip install pytest pytest-asyncio httpx

# 单元测试示例
# tests/test_train_service.py
import pytest
from server.services.train_service import TrainService

class TestTrainService:
    def test_create_training_task(self):
        service = TrainService()
        task = service.create_task(
            dataset_id="test-dataset",
            model_name="test-model",
            config={"epochs": 100}
        )
        assert task.id is not None
        assert task.status == "pending"

    def test_validate_batch_size(self):
        service = TrainService()
        # GPU 显存 8GB，应该返回 16
        batch_size = service.calculate_batch_size(gpu_memory_gb=8)
        assert batch_size == 16
```

```python
# E2E 测试示例
# tests/test_api.py
import pytest
from httpx import AsyncClient
from server.main import app

@pytest.mark.asyncio
async def test_create_dataset():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/datasets",
            json={
                "name": "test-dataset",
                "task_type": "detection",
                "classes": ["person", "car"]
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "test-dataset"
```

### 13.4 测试覆盖率要求

| 模块 | 最低覆盖率 |
|------|------------|
| 工具函数 | 80% |
| Services | 70% |
| 组件 | 50% |
| API Routes | 70% |

---

## 十四、部署方案

### 14.1 开发环境

```bash
# 前端
npm install
npm run dev

# 后端
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 14.2 Docker 部署

#### Dockerfile (前端)

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile (后端)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 安装 PyTorch GPU 版本（根据需要）
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models
      - ./datasets:/app/datasets
      - ./exports:/app/exports
    environment:
      - CUDA_VISIBLE_DEVICES=0  # 指定 GPU
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # 可选：GPU 监控
  nvidia-exporter:
    image: nvidia/cuda:11.8.0-base-ubuntu22.04
    command: nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total --format=csv -l 5
    deployment_mode: replicated
```

#### nginx.conf

```nginx
server {
    listen 3000;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 14.3 生产环境检查清单

- [ ] 所有敏感配置使用环境变量
- [ ] CORS 白名单配置正确
- [ ] 文件上传大小限制
- [ ] 日志级别设为 INFO 或 WARNING
- [ ] 静态文件 gzip 压缩
- [ ] HTTPS 配置（反向代理层）
- [ ] GPU 驱动和 CUDA 版本匹配
- [ ] 磁盘空间监控

---

## 十五、API 详细格式

### 15.1 数据集管理

#### 创建数据集

**请求**：
```http
POST /api/datasets
Content-Type: application/json

{
  "name": "my-dataset",
  "description": "这是一个测试数据集",
  "task_type": "detection",
  "classes": ["person", "car", "dog"],
  "split": {
    "train": 0.8,
    "val": 0.1,
    "test": 0.1
  }
}
```

**响应** (201 Created)：
```json
{
  "id": "ds_abc123",
  "name": "my-dataset",
  "description": "这是一个测试数据集",
  "task_type": "detection",
  "classes": ["person", "car", "dog"],
  "split": {
    "train": 0.8,
    "val": 0.1,
    "test": 0.1
  },
  "image_count": 0,
  "labeled_count": 0,
  "status": "empty",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

#### 上传图像

**请求**：
```http
POST /api/datasets/{dataset_id}/images
Content-Type: multipart/form-data

files: [image1.jpg, image2.png]
split: "train"
```

**响应** (201 Created)：
```json
{
  "success": true,
  "uploaded": 2,
  "images": [
    {
      "id": "img_001",
      "filename": "image1.jpg",
      "width": 640,
      "height": 480,
      "split": "train",
      "labeled": false
    },
    {
      "id": "img_002",
      "filename": "image2.png",
      "width": 800,
      "height": 600,
      "split": "train",
      "labeled": false
    }
  ]
}
```

#### 删除数据集（含保护检查）

**请求**：
```http
DELETE /api/datasets/{dataset_id}
```

**响应** (200 OK)：
```json
{
  "success": true
}
```

**响应** (409 Conflict - 有关联任务)：
```json
{
  "success": false,
  "error": "该数据集已被 3 个训练任务使用，无法删除",
  "code": "DATASET_IN_USE",
  "related_tasks": [
    {"id": "task_001", "name": "my-dataset-v1", "status": "completed"},
    {"id": "task_002", "name": "my-dataset-v2", "status": "running"},
    {"id": "task_003", "name": "my-dataset-test", "status": "failed"}
  ]
}
```

### 15.2 训练管理

#### 创建训练任务

**请求**：
```http
POST /api/train
Content-Type: application/json

{
  "dataset_id": "ds_abc123",
  "model_name": "my-dataset-yolo11-001",
  "yolo_version": "YOLO11",
  "config": {
    "epochs": 100,
    "batch_size": 16,
    "imgsz": 640,
    "patience": 50,
    "lr0": 0.01,
    "augment": true
  }
}
```

**响应** (201 Created)：
```json
{
  "id": "task_xyz789",
  "dataset_id": "ds_abc123",
  "model_name": "my-dataset-yolo11-001",
  "yolo_version": "YOLO11",
  "status": "pending",
  "config": {
    "epochs": 100,
    "batch_size": 16,
    "imgsz": 640
  },
  "created_at": "2024-01-01T10:00:00Z",
  "queue_position": 1
}
```

#### WebSocket 消息格式

**连接**：
```http
ws://localhost:8000/ws/task_xyz789
```

**服务器 -> 客户端：连接成功**
```json
{
  "type": "connected",
  "task_id": "task_xyz789",
  "timestamp": 1704067200000
}
```

**服务器 -> 客户端：训练指标**
```json
{
  "type": "metrics",
  "task_id": "task_xyz789",
  "timestamp": 1704067200000,
  "data": {
    "epoch": 45,
    "total_epochs": 100,
    "box_loss": 0.35,
    "cls_loss": 0.12,
    "dfl_loss": 0.08,
    "mAP50": 0.82,
    "mAP50-95": 0.56,
    "precision": 0.78,
    "recall": 0.75,
    "lr": 0.001,
    "gpu_memory_used": 10.5,
    "gpu_memory_total": 16.0,
    "epoch_time": 125.5,
    "eta": 6878.0
  }
}
```

**服务器 -> 客户端：状态变更**
```json
{
  "type": "status",
  "task_id": "task_xyz789",
  "timestamp": 1704067200000,
  "data": {
    "old_status": "running",
    "new_status": "completed"
  }
}
```

---

## 十六、其他缺失补充

### 16.1 预训练模型管理

用户可上传自定义预训练模型：

```yaml
# config.yaml
training:
  pretrained_models:
    # 内置模型
    - name: "yolo11n"
      path: "ultralytics/models/yolo11n.pt"
      type: "builtin"
    - name: "yolov8n"
      path: "ultralytics/models/yolov8n.pt"
      type: "builtin"

    # 用户上传的模型（动态添加）
    custom_models_path: "./custom_models"
```

**上传 API**：
```http
POST /api/models/upload-pretrained
Content-Type: multipart/form-data

file: custom_weights.pt
name: "my-pretrained-model"
```

### 16.2 数据结构补充

```typescript
// 标注数据类型
interface DetectionData {
  bbox: {
    x: number;      // x_center (0-1)
    y: number;      // y_center (0-1)
    width: number;
    height: number;
  };
}

interface SegmentationData {
  polygon: Array<{x: number; y: number}>;
}

interface ClassificationData {
  // Classification 只需 classId 和 className
}

interface PoseData {
  keypoints: Array<{
    x: number;
    y: number;
    visible: 0 | 1 | 2;  // 0=不可见, 1=遮挡, 2=可见
  }>;
  skeleton?: Array<[number, number]>;  // 连接索引对
}

interface OBBData {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;  // 弧度
  };
}
```

---

### 17.1 高风险

| 风险 | 影响 | 应对 |
|------|------|------|
| Fabric.js + React 生命周期 | 标注编辑器崩溃 | 仔细管理 Canvas 生命周期 |
| 训练进程管理复杂性 | 暂停/恢复不稳定 | 充分测试，保留 kill 机制 |
| WebSocket 断线重连 | 实时推送丢失 | 心跳 + 自动重连 + 本地缓存 |

### 17.2 中风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 大图像处理 | 上传/标注卡顿 | 限制图像尺寸，懒加载 |
| 标注数据一致性 | YOLO 格式读写出错 | 专门的解析/写入工具 |
| 多任务并发 | 资源竞争 | 任务队列 + 互斥锁 |

### 17.3 低风险

| 风险 | 影响 | 应对 |
|------|------|------|
| 导出格式兼容 | 某些格式导出失败 | 验证机制 + 友好提示 |
| 存储空间不足 | 无法保存模型 | 磁盘空间监控 |

---

## 十八、验收标准

### 12.1 功能验收

- [ ] 数据集创建/编辑/删除/保护
- [ ] 图像上传/标注/保存/加载
- [ ] 5 种 YOLO 任务类型标注
- [ ] 格式导入/导出（COCO/VOC/LabelMe/DOTA）
- [ ] 环境检测（GPU/依赖）
- [ ] 训练任务创建/监控/中断/恢复
- [ ] 实时可视化（图表/日志）
- [ ] 模型管理/删除保护
- [ ] ONNX 导出/验证
- [ ] 预测（单张/批量/快速验证）

### 12.2 性能验收

- [ ] 单张图像标注操作延迟 < 100ms
- [ ] 支持 1000+ 图像规模
- [ ] WebSocket 连接稳定
- [ ] 训练 100 epoch 无内存泄漏

### 12.3 UI/UX 验收

- [ ] 布局清晰，功能分区合理
- [ ] 标注编辑器流畅（60fps）
- [ ] 快捷键完整
- [ ] 主题切换正常

---

## 附录 A：环境变量

```env
# 前端 (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# 后端 (.env) - 可选，环境变量会覆盖 config.yaml
YOLOHUB_SERVER_PORT=8000
YOLOHUB_STORAGE_MODEL_PATH=./models
YOLOHUB_STORAGE_DATASET_PATH=./datasets
YOLOHUB_TRAINING_MAX_CONCURRENT=1
```

---

## 附录 B：依赖清单

### 前端依赖
```json
{
  "next": "14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "5.3.3",
  "tailwindcss": "3.4.1",
  "zustand": "4.5.0",
  "fabric": "5.3.0",
  "recharts": "2.12.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

### 后端依赖
```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
ultralytics>=8.0.0
torch>=2.0.0
python-multipart>=0.0.6
websockets>=11.0.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
pyyaml>=6.0.0
python-dotenv>=1.0.0
pillow>=10.0.0
```

---

_文档版本：v2.2_
_全新从头开发_
_完善错误处理、测试、部署、API格式等_
