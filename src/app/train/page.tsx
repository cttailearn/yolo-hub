'use client';

import * as React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useTrainingStore } from '@/lib/stores/training-store';
import type { TrainingTask } from '@/types';

const statusLabels: Record<TrainingTask['status'], { label: string; color: string }> = {
  pending: { label: '等待中', color: 'bg-gray-100 text-gray-600' },
  running: { label: '运行中', color: 'bg-blue-100 text-blue-600' },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-600' },
  resuming: { label: '恢复中', color: 'bg-blue-100 text-blue-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  failed: { label: '失败', color: 'bg-red-100 text-red-600' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600' },
};

export default function TrainPage() {
  const { tasks, loading, error, fetchTasks } = useTrainingStore();

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const runningTasks = tasks.filter((t) => t.status === 'running' || t.status === 'pending');
  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled'
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">训练</h1>
          <Link href="/train/new">
            <Button>新建训练</Button>
          </Link>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : tasks.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">🎯</div>
            <h3 className="text-lg font-medium mb-2">暂无训练任务</h3>
            <p className="text-gray-500 mb-4">创建一个训练任务开始训练模型</p>
            <Link href="/train/new">
              <Button>新建训练</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {runningTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-3">运行中</h2>
                <div className="space-y-3">
                  {runningTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-3">历史记录</h2>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function TaskCard({ task }: { task: TrainingTask }) {
  const { pauseTask, resumeTask, stopTask } = useTrainingStore();
  const status = statusLabels[task.status];

  const handlePause = async () => {
    try {
      await pauseTask(task.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResume = async () => {
    try {
      await resumeTask(task.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStop = async () => {
    try {
      await stopTask(task.id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-medium">{task.modelName}</h3>
            <p className="text-sm text-gray-500">
              {task.yoloVersion} · {task.datasetId}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {task.status === 'running' && (
            <>
              <Button variant="secondary" size="sm" onClick={handlePause}>
                ⏸️ 暂停
              </Button>
              <Button variant="danger" size="sm" onClick={handleStop}>
                ⏹️ 停止
              </Button>
            </>
          )}
          {task.status === 'paused' && (
            <>
              <Button variant="secondary" size="sm" onClick={handleResume}>
                ▶️ 恢复
              </Button>
              <Button variant="danger" size="sm" onClick={handleStop}>
                ⏹️ 停止
              </Button>
            </>
          )}
          <Link href={`/train/${task.id}`}>
            <Button variant="ghost" size="sm">
              查看详情
            </Button>
          </Link>
        </div>
      </div>

      {task.status === 'running' && (
        <div className="mt-4">
          <div className="flex items-center gap-4 text-sm">
            <span>Epoch: {task.config.epochs}</span>
            <span>Batch: {task.config.batch_size}</span>
            <span>图像尺寸: {task.config.imgsz}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
