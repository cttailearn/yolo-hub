'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useTrainingStore } from '@/lib/stores/training-store';
import { useWebSocket } from '@/lib/hooks/use-websocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '等待中', color: 'bg-gray-100 text-gray-600' },
  running: { label: '运行中', color: 'bg-blue-100 text-blue-600' },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  failed: { label: '失败', color: 'bg-red-100 text-red-600' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
};

export default function TrainDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const { currentTask, metrics, loading, error, fetchTask, pauseTask, resumeTask, stopTask, fetchMetrics } =
    useTrainingStore();

  // WebSocket 连接
  const { isConnected } = useWebSocket(taskId, {
    onMetrics: (data) => {
      fetchMetrics(taskId);
    },
    onStatus: () => {
      fetchTask(taskId);
    },
  });

  React.useEffect(() => {
    fetchTask(taskId);
    fetchMetrics(taskId);
  }, [taskId, fetchTask, fetchMetrics]);

  const handlePause = async () => {
    try {
      await pauseTask(taskId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async () => {
    try {
      await resumeTask(taskId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStop = async () => {
    try {
      await stopTask(taskId);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !currentTask) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">加载中...</div>
        </div>
      </MainLayout>
    );
  }

  if (!currentTask) {
    return (
      <MainLayout>
        <Alert type="error">训练任务不存在</Alert>
      </MainLayout>
    );
  }

  const status = statusLabels[currentTask.status] || statusLabels.pending;

  const chartData = metrics.map((m) => ({
    epoch: m.epoch,
    mAP50: m.mAP50,
    mAP50_95: m.mAP50_95,
    loss: m.box_loss + m.cls_loss + m.dfl_loss,
  }));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/train" className="text-gray-500 hover:text-gray-700">
              ← 返回
            </Link>
            <h1 className="text-2xl font-bold">{currentTask.modelName}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
              {isConnected ? '● 已连接' : '○ 未连接'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentTask.status === 'running' && (
              <>
                <Button variant="secondary" size="sm" onClick={handlePause}>
                  ⏸️ 暂停
                </Button>
                <Button variant="danger" size="sm" onClick={handleStop}>
                  ⏹️ 停止
                </Button>
              </>
            )}
            {currentTask.status === 'paused' && (
              <>
                <Button variant="secondary" size="sm" onClick={handleResume}>
                  ▶️ 恢复
                </Button>
                <Button variant="danger" size="sm" onClick={handleStop}>
                  ⏹️ 停止
                </Button>
              </>
            )}
          </div>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-sm text-gray-500">mAP@0.5</div>
            <div className="text-2xl font-bold">
              {metrics.length > 0 ? metrics[metrics.length - 1].mAP50.toFixed(3) : '-'}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">mAP@0.5:0.95</div>
            <div className="text-2xl font-bold">
              {metrics.length > 0 ? metrics[metrics.length - 1].mAP50_95.toFixed(3) : '-'}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">Precision</div>
            <div className="text-2xl font-bold">
              {metrics.length > 0 ? metrics[metrics.length - 1].precision.toFixed(3) : '-'}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">Recall</div>
            <div className="text-2xl font-bold">
              {metrics.length > 0 ? metrics[metrics.length - 1].recall.toFixed(3) : '-'}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <h3 className="font-medium mb-4">mAP 曲线</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mAP50" stroke="#3B82F6" name="mAP@0.5" />
                  <Line type="monotone" dataKey="mAP50_95" stroke="#10B981" name="mAP@0.5:0.95" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h3 className="font-medium mb-4">损失曲线</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="loss" stroke="#EF4444" name="总损失" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Training Info */}
        <Card>
          <h3 className="font-medium mb-4">训练信息</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">YOLO 版本:</span> {currentTask.yoloVersion}
            </div>
            <div>
              <span className="text-gray-500">Epochs:</span> {currentTask.config.epochs}
            </div>
            <div>
              <span className="text-gray-500">Batch Size:</span> {currentTask.config.batch_size}
            </div>
            <div>
              <span className="text-gray-500">图像尺寸:</span> {currentTask.config.imgsz}
            </div>
            <div>
              <span className="text-gray-500">早停耐心:</span> {currentTask.config.patience}
            </div>
            <div>
              <span className="text-gray-500">创建时间:</span>{' '}
              {new Date(currentTask.createdAt).toLocaleString()}
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
