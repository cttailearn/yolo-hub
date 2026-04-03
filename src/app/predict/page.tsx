'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Alert } from '@/components/ui/alert';
import { useModelStore } from '@/lib/stores/model-store';

function PredictContent() {
  const searchParams = useSearchParams();
  const initialModelId = searchParams.get('model') || '';

  const { models, fetchModels } = useModelStore();

  const [selectedModelId, setSelectedModelId] = React.useState(initialModelId);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [results, setResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const trainedModels = models.filter((m) => m.status === 'trained');
  const selectedModel = models.find((m) => m.id === selectedModelId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults(null);
    }
  };

  const handlePredict = async () => {
    if (!selectedModelId || !selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('model_id', selectedModelId);
      formData.append('file', selectedFile);
      formData.append('conf', '0.25');
      formData.append('iou', '0.45');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('预测失败');
      }

      const data = await response.json();
      setResults(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">预测</h1>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Upload */}
          <Card>
            <h2 className="text-lg font-medium mb-4">1. 选择模型</h2>
            <Dropdown
              items={trainedModels.map((m) => ({ label: m.name, value: m.id }))}
              value={selectedModelId}
              onChange={setSelectedModelId}
              placeholder="选择模型"
            />
            {selectedModel && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm">
                  <span className="text-gray-500">版本:</span> {selectedModel.yoloVersion}
                </p>
                {selectedModel.metrics && (
                  <>
                    <p className="text-sm">
                      <span className="text-gray-500">mAP@0.5:</span>{' '}
                      {selectedModel.metrics.mAP50?.toFixed(3)}
                    </p>
                  </>
                )}
              </div>
            )}

            <h2 className="text-lg font-medium mb-4 mt-6">2. 选择图像</h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                {selectedFile ? (
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2 text-gray-300">+</div>
                    <p className="text-sm text-gray-500">点击选择图像</p>
                  </div>
                )}
              </div>
            </label>

            <Button
              className="w-full mt-4"
              onClick={handlePredict}
              disabled={!selectedModelId || !selectedFile || loading}
            >
              {loading ? '预测中...' : '开始预测'}
            </Button>
          </Card>

          {/* Right: Results */}
          <Card>
            <h2 className="text-lg font-medium mb-4">预测结果</h2>
            {results ? (
              <div>
                {selectedFile && (
                  <div className="mb-4">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Result"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {results.data?.boxes?.map((box: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      <span className="font-medium">{box.class_name}</span>
                      <span className="text-sm text-gray-500">
                        {(box.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2 text-gray-300">🔍</div>
                <p>暂无预测结果</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <PredictContent />
    </Suspense>
  );
}
