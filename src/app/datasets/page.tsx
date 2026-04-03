'use client';

import * as React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';
import { Alert } from '@/components/ui/alert';
import { useDatasetStore } from '@/lib/stores/dataset-store';
import type { Dataset, TaskType } from '@/types';

const taskTypeOptions = [
  { label: '目标检测', value: 'detection' },
  { label: '实例分割', value: 'segmentation' },
  { label: '分类', value: 'classification' },
  { label: '姿态检测', value: 'pose' },
  { label: '旋转检测', value: 'obb' },
];

export default function DatasetsPage() {
  const { datasets, loading, error, fetchDatasets, createDataset } = useDatasetStore();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newDataset, setNewDataset] = React.useState({
    name: '',
    description: '',
    taskType: 'detection' as TaskType,
    classes: '',
  });

  React.useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleCreate = async () => {
    try {
      const classes = newDataset.classes
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c);
      await createDataset({
        name: newDataset.name,
        description: newDataset.description,
        taskType: newDataset.taskType,
        classes,
        split: { train: 0.8, val: 0.1, test: 0.1 },
      });
      setShowCreateModal(false);
      setNewDataset({ name: '', description: '', taskType: 'detection', classes: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: Dataset['status']) => {
    const badges = {
      empty: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      partial: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    };
    return badges[status];
  };

  const getTaskTypeLabel = (type: TaskType) => {
    return taskTypeOptions.find((t) => t.value === type)?.label || type;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">数据集</h1>
          <Button onClick={() => setShowCreateModal(true)}>创建数据集</Button>
        </div>

        {error && (
          <Alert type="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : datasets.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">📊</div>
            <h3 className="text-lg font-medium mb-2">暂无数据集</h3>
            <p className="text-gray-500 mb-4">创建一个数据集开始标注和训练</p>
            <Button onClick={() => setShowCreateModal(true)}>创建数据集</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((dataset) => (
              <Card key={dataset.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{dataset.name}</h3>
                    <p className="text-sm text-gray-500">{getTaskTypeLabel(dataset.taskType)}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(dataset.status)}`}
                  >
                    {dataset.status === 'empty'
                      ? '空'
                      : dataset.status === 'partial'
                        ? '部分标注'
                        : '已完成'}
                  </span>
                </div>

                {dataset.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {dataset.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{dataset.imageCount} 张图像</span>
                  <span>{dataset.classes.length} 个类别</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/datasets/${dataset.id}`}
                    className="flex-1 px-3 py-2 text-center text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    查看详情
                  </Link>
                  <Link
                    href={`/datasets/${dataset.id}/annotate`}
                    className="flex-1 px-3 py-2 text-center text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    开始标注
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建数据集">
        <div className="space-y-4">
          <Input
            label="数据集名称"
            value={newDataset.name}
            onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
            placeholder="例如: my-dataset"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={newDataset.description}
              onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
              className="w-full h-20 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              placeholder="数据集描述（可选）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              任务类型
            </label>
            <Dropdown
              items={taskTypeOptions}
              value={newDataset.taskType}
              onChange={(value) => setNewDataset({ ...newDataset, taskType: value as TaskType })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              类别（每行一个）
            </label>
            <textarea
              value={newDataset.classes}
              onChange={(e) => setNewDataset({ ...newDataset, classes: e.target.value })}
              className="w-full h-32 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              placeholder="person&#10;car&#10;dog"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!newDataset.name}>
              创建
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
