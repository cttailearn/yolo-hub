'use client';

import * as React from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useModelStore } from '@/lib/stores/model-store';

const statusLabels = {
  training: { label: '训练中', color: 'bg-blue-100 text-blue-600' },
  trained: { label: '已训练', color: 'bg-green-100 text-green-600' },
  failed: { label: '失败', color: 'bg-red-100 text-red-600' },
};

export default function ModelsPage() {
  const { models, loading, error, fetchModels, deleteModel } = useModelStore();

  React.useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模型吗？')) return;
    try {
      await deleteModel(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">模型</h1>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : models.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4 text-gray-300">📦</div>
            <h3 className="text-lg font-medium mb-2">暂无模型</h3>
            <p className="text-gray-500">完成训练后将自动创建模型</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => {
              const status = statusLabels[model.status as keyof typeof statusLabels] || statusLabels.training;
              return (
                <Card key={model.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.yoloVersion}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {model.metrics && (
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">mAP@0.5:</span>{' '}
                        {model.metrics.mAP50?.toFixed(3) || '-'}
                      </div>
                      <div>
                        <span className="text-gray-500">mAP@0.5:0.95:</span>{' '}
                        {model.metrics.mAP50_95?.toFixed(3) || '-'}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/models/${model.id}`}
                      className="flex-1 px-3 py-2 text-center text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      查看详情
                    </Link>
                    <Link
                      href={`/predict?model=${model.id}`}
                      className="flex-1 px-3 py-2 text-center text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      预测
                    </Link>
                    <button
                      onClick={() => handleDelete(model.id)}
                      className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      删除
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
