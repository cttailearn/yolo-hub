'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';
import { Alert } from '@/components/ui/alert';
import { useDatasetStore } from '@/lib/stores/dataset-store';
import { useTrainingStore } from '@/lib/stores/training-store';
import { config } from '@/lib/config';

export default function NewTrainPage() {
  const router = useRouter();
  const { datasets, fetchDatasets } = useDatasetStore();
  const { createTask, loading, error } = useTrainingStore();

  const [formData, setFormData] = React.useState({
    datasetId: '',
    modelName: '',
    yoloVersion: 'YOLO11',
    epochs: 100,
    batchSize: 16,
    imgsz: 640,
    patience: 50,
    augment: true,
  });

  React.useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const selectedDataset = datasets.find((d) => d.id === formData.datasetId);

  const handleSubmit = async () => {
    try {
      const task = await createTask({
        datasetId: formData.datasetId,
        modelName: formData.modelName,
        yoloVersion: formData.yoloVersion,
        config: {
          epochs: formData.epochs,
          batch_size: formData.batchSize,
          imgsz: formData.imgsz,
          patience: formData.patience,
          augment: formData.augment,
          lr0: 0.01,
          lrf: 0.01,
          optimizer: 'SGD',
        },
      });
      router.push(`/train/${task.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const yoloVersionOptions = config.training.yoloVersions.map((v) => ({
    label: v.name,
    value: v.name,
  }));

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold">新建训练任务</h1>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <div className="space-y-6">
          {/* Step 1: 选择数据集 */}
          <Card>
            <h2 className="text-lg font-medium mb-4">1. 选择数据集</h2>
            <Dropdown
              items={datasets.map((d) => ({
                label: `${d.name} (${d.imageCount} 张图像)`,
                value: d.id,
              }))}
              value={formData.datasetId}
              onChange={(value) =>
                setFormData({ ...formData, datasetId: value, modelName: `${value}-model` })
              }
              placeholder="选择数据集"
            />
            {selectedDataset && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm">数据集: {selectedDataset.name}</p>
                <p className="text-sm">图像: {selectedDataset.imageCount} 张</p>
                <p className="text-sm">类别: {selectedDataset.classes.join(', ')}</p>
              </div>
            )}
          </Card>

          {/* Step 2: 模型配置 */}
          <Card>
            <h2 className="text-lg font-medium mb-4">2. 模型配置</h2>
            <div className="space-y-4">
              <Input
                label="模型名称"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder="例如: my-dataset-yolo11"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  YOLO 版本
                </label>
                <Dropdown
                  items={yoloVersionOptions}
                  value={formData.yoloVersion}
                  onChange={(value) => setFormData({ ...formData, yoloVersion: value })}
                />
              </div>
            </div>
          </Card>

          {/* Step 3: 训练参数 */}
          <Card>
            <h2 className="text-lg font-medium mb-4">3. 训练参数</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Epochs"
                type="number"
                value={formData.epochs}
                onChange={(e) =>
                  setFormData({ ...formData, epochs: parseInt(e.target.value) || 100 })
                }
              />
              <Input
                label="Batch Size"
                type="number"
                value={formData.batchSize}
                onChange={(e) =>
                  setFormData({ ...formData, batchSize: parseInt(e.target.value) || 16 })
                }
              />
              <Input
                label="图像尺寸"
                type="number"
                value={formData.imgsz}
                onChange={(e) =>
                  setFormData({ ...formData, imgsz: parseInt(e.target.value) || 640 })
                }
              />
              <Input
                label="早停耐心"
                type="number"
                value={formData.patience}
                onChange={(e) =>
                  setFormData({ ...formData, patience: parseInt(e.target.value) || 50 })
                }
              />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="secondary" onClick={() => router.back()}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.datasetId || !formData.modelName}>
              开始训练
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
