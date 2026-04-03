# YOLO Hub

YOLO 模型训练与管理平台 - 基于 Next.js 14 + FastAPI 的全栈应用

## 📋 项目简介

YOLO Hub 是一个用于目标检测、实例分割、分类等任务的全栈 Web 应用。支持从数据集管理、图像标注、模型训练到预测部署的完整流程。

### 技术栈

- **前端**: Next.js 14 (App Router), React, Tailwind CSS, Zustand, Fabric.js, Recharts
- **后端**: FastAPI, SQLAlchemy, Pydantic
- **AI**: Ultralytics YOLO (YOLOv5, YOLOv8, YOLO11, YOLO26)

---

## 🔄 开发阶段记录

### 当前完成阶段: Phase 2 ✅

> **最后更新**: 2026-04-03

### Phase 1: 基础框架搭建 ✅

**完成时间**: 2026-04-03

**内容**:
- [x] 前端基础框架 (Next.js 14)
  - UI 组件库 (Button, Input, Card, Modal, Dropdown, Tabs, Alert, Tooltip)
  - 布局组件 (Header, Sidebar, MainLayout)
  - 状态管理 (Zustand stores)
  - API 客户端
  - WebSocket hooks
- [x] 后端基础框架 (FastAPI)
  - 配置管理系统 (config.yaml)
  - 数据库模型 (SQLAlchemy)
  - API 路由
  - WebSocket 管理器
  - 服务层 (训练、导出、预测)

### Phase 2: 数据集管理完善 ✅

**完成时间**: 2026-04-03

**内容**:
- [x] M11: 数据集 API (错误处理、关联检查)
- [x] M2: 布局与导航
- [x] M3: 数据集管理前端
  - 数据集列表页
  - 数据集详情页
  - 图像上传与管理
- [x] M4: 标注编辑器框架
  - Fabric.js 画布集成
  - 工具栏 (选择、矩形框、多边形、关键点、旋转框)
  - 类别选择
  - 标注保存

### Phase 3: 训练后端 ⬜ (未开始)

**待完成**:
- [ ] M16: 训练任务队列管理
- [ ] M12: YOLO 训练进程管理
- [ ] M17: 训练指标记录与实时推送

### Phase 4: 训练前端 ⬜ (未开始)

**待完成**:
- [ ] M6: 训练任务列表
- [ ] M7: 训练详情页 (实时指标图表)

### Phase 5: 标注编辑器完善 ⬜ (未开始)

**待完成**:
- [ ] M4: AI 辅助标注功能
- [ ] M4: 多边形标注工具
- [ ] M4: 关键点标注工具
- [ ] M4: 旋转框标注工具

### Phase 6: 模型与导出 ⬜ (未开始)

**待完成**:
- [ ] M13: 模型管理
- [ ] M14: 导出功能
- [ ] M8: 格式转换

### Phase 7: 预测与格式转换 ⬜ (未开始)

**待完成**:
- [ ] M15: 预测功能
- [ ] M9: 格式转换
- [ ] M5: 端到端测试

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Python 3.8+
- (可选) CUDA 11.8+ / cuDNN (用于 GPU 训练)

### 安装

```bash
# 克隆项目
git clone <your-repo-url>
cd yolo-hub

# 安装前端依赖
npm install

# 安装后端依赖
cd server
pip install -r requirements.txt
```

### 配置

```bash
# 复制环境变量
cp .env .env.local

# 编辑配置文件
vim config.yaml
```

### 运行

```bash
# 运行前端 (开发模式)
npm run dev

# 运行后端 (新终端)
cd server
uvicorn main:app --reload --port 8000
```

访问 http://localhost:3000

---

## 📁 项目结构

```
yolo-hub/
├── src/                    # 前端源代码
│   ├── app/               # Next.js App Router
│   │   ├── datasets/       # 数据集页面
│   │   ├── train/         # 训练页面
│   │   ├── models/        # 模型页面
│   │   ├── predict/       # 预测页面
│   │   └── formats/       # 格式转换
│   ├── components/        # React 组件
│   │   ├── ui/           # UI 基础组件
│   │   └── layout/       # 布局组件
│   ├── lib/              # 工具库
│   │   ├── api/          # API 客户端
│   │   ├── stores/       # Zustand 状态管理
│   │   └── hooks/        # React hooks
│   └── types/            # TypeScript 类型
├── server/                # 后端源代码
│   ├── routers/          # API 路由
│   ├── services/         # 业务逻辑
│   ├── db/               # 数据库模型
│   ├── schemas/          # Pydantic 模型
│   ├── websocket/        # WebSocket 管理
│   ├── utils/            # 工具函数
│   └── main.py           # FastAPI 入口
├── config.yaml           # 配置文件
└── package.json          # 前端依赖
```

---

## 📝 开发规范

### 前端 (TypeScript)

- 组件使用 `'use client'` 指令
- 使用 Zustand 进行状态管理
- Tailwind CSS 进行样式设计
- 类型定义在 `src/types/`

### 后端 (Python)

- FastAPI 路由在 `server/routers/`
- Pydantic Schema 在 `server/schemas/`
- 数据库模型在 `server/db/models.py`

---

## 📊 数据库模型

- **Dataset**: 数据集
- **Image**: 图像
- **Label**: 标注
- **TrainTask**: 训练任务
- **Metric**: 训练指标
- **Model**: 模型
- **Export**: 导出任务

---

## 🌐 API 端点

### 数据集
- `GET /api/datasets` - 获取数据集列表
- `POST /api/datasets` - 创建数据集
- `GET /api/datasets/{id}` - 获取数据集详情
- `PUT /api/datasets/{id}` - 更新数据集
- `DELETE /api/datasets/{id}` - 删除数据集
- `POST /api/datasets/{id}/images` - 上传图像

### 训练
- `POST /api/train` - 创建训练任务
- `GET /api/train` - 获取训练列表
- `POST /api/train/{id}/pause` - 暂停训练
- `POST /api/train/{id}/resume` - 恢复训练
- `POST /api/train/{id}/stop` - 停止训练

### 模型
- `GET /api/models` - 获取模型列表
- `DELETE /api/models/{id}` - 删除模型

### 其他
- `POST /api/predict` - 预测
- `GET /api/env/check` - 环境检测

---

## 📜 License

MIT License
