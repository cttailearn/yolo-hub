'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Tabs } from '@/components/ui/tabs';
import { useDatasetStore } from '@/lib/stores/dataset-store';
import type { TaskType } from '@/types';

const taskTypeLabels: Record<TaskType, string> = {
  detection: '目标检测',
  segmentation: '实例分割',
  classification: '分类',
  pose: '姿态检测',
  obb: '旋转检测',
};

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;

  const { currentDataset, images, loading, error, fetchDataset, fetchImages, uploadImages, deleteImage } =
    useDatasetStore();

  const [activeTab, setActiveTab] = React.useState('images');
  const [uploading, setUploading] = React.useState(false);
  const [split, setSplit] = React.useState<'train' | 'val' | 'test'>('train');

  React.useEffect(() => {
    fetchDataset(datasetId);
    fetchImages(datasetId);
  }, [datasetId, fetchDataset, fetchImages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      await uploadImages(datasetId, Array.from(files), split);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('确定要删除这张图像吗？')) return;
    try {
      await deleteImage(datasetId, imageId);
      fetchDataset(datasetId);
    } catch (err) {
      console.error(err);
    }
  };

  const trainImages = images.filter((img) => img.split === 'train');
  const valImages = images.filter((img) => img.split === 'val');
  const testImages = images.filter((img) => img.split === 'test');

  if (loading && !currentDataset) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">加载中...</div>
        </div>
      </MainLayout>
    );
  }

  if (!currentDataset) {
    return (
      <MainLayout>
        <Alert type="error">数据集不存在</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
            ← 返回
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{currentDataset.name}</h1>
            <p className="text-sm text-gray-500">
              {taskTypeLabels[currentDataset.taskType]} · {currentDataset.classes.length} 个类别
            </p>
          </div>
          <Link href={`/datasets/${datasetId}/annotate`}>
            <Button>开始标注</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-sm text-gray-500">总图像</div>
            <div className="text-2xl font-bold">{images.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">训练集</div>
            <div className="text-2xl font-bold">{trainImages.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">验证集</div>
            <div className="text-2xl font-bold">{valImages.length}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-500">测试集</div>
            <div className="text-2xl font-bold">{testImages.length}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          items={[
            { label: '图像', value: 'images' },
            { label: '设置', value: 'settings' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          className="mb-4"
        />

        {activeTab === 'images' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <select
                  value={split}
                  onChange={(e) => setSplit(e.target.value as 'train' | 'val' | 'test')}
                  className="h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <option value="train">训练集</option>
                  <option value="val">验证集</option>
                  <option value="test">测试集</option>
                </select>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button disabled={uploading}>{uploading ? '上传中...' : '上传图像'}</Button>
                </label>
              </div>
              <span className="text-sm text-gray-500">
                共 {images.length} 张图像，已标注 {currentDataset.labeledCount} 张
              </span>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2 text-gray-300">📷</div>
                <p>暂无图像，点击上传按钮添加</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={`file://${image.path}`}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                    {image.labeled && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <h3 className="font-medium mb-4">数据集设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名称</label>
                <div className="text-gray-900 dark:text-gray-100">{currentDataset.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <div className="text-gray-900 dark:text-gray-100">
                  {currentDataset.description || '无描述'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">任务类型</label>
                <div className="text-gray-900 dark:text-gray-100">
                  {taskTypeLabels[currentDataset.taskType]}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">类别</label>
                <div className="flex flex-wrap gap-2">
                  {currentDataset.classes.map((cls, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-sm"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
