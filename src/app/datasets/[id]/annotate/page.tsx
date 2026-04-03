'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useDatasetStore } from '@/lib/stores/dataset-store';
import { useAnnotationStore } from '@/lib/stores/annotation-store';
import { cn } from '@/lib/utils/cn';

const tools = [
  { label: '选择', value: 'select', icon: '🖱️' },
  { label: '矩形框', value: 'bbox', icon: '📦' },
  { label: '多边形', value: 'polygon', icon: '⬡' },
  { label: '关键点', value: 'keypoint', icon: '⭕' },
  { label: '旋转框', value: 'obb', icon: '🔄' },
];

export default function AnnotatePage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;

  const { currentDataset, images, loading, error, fetchDataset, fetchImages, uploadImages, fetchLabels, updateLabels } =
    useDatasetStore();
  const {
    currentTool,
    setCurrentTool,
    currentClassId,
    currentClassName,
    setCurrentClass,
    labels,
    setLabels,
    addLabel,
    deleteLabel,
    clearLabels,
  } = useAnnotationStore();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = React.useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    fetchDataset(datasetId);
    fetchImages(datasetId);
  }, [datasetId, fetchDataset, fetchImages]);

  // Initialize Fabric.js canvas
  React.useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;

    let canvas: any = null;

    const initCanvas = async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fabric = require('fabric');

      canvas = new fabric.Canvas(canvasRef.current, {
        selection: true,
        preserveObjectStacking: true,
      });

      setFabricCanvas(canvas);

      // Handle mouse events for drawing
      canvas.on('mouse:down', (opt: any) => {
        if (currentTool === 'bbox') {
          const pointer = canvas.getPointer(opt.e);
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'rgba(59, 130, 246, 0.3)',
            stroke: '#3B82F6',
            strokeWidth: 2,
            class_id: currentClassId,
            class_name: currentClassName,
          });
          canvas.add(rect);
        }
      });

      canvas.on('mouse:move', (opt: any) => {
        if (currentTool === 'bbox') {
          const pointer = canvas.getPointer(opt.e);
          const activeObj = canvas.getActiveObject();
          if (activeObj && activeObj.type === 'rect') {
            activeObj.set({
              width: pointer.x - activeObj.left,
              height: pointer.y - activeObj.top,
            });
            canvas.renderAll();
          }
        }
      });

      canvas.on('mouse:up', () => {
        if (currentTool === 'bbox') {
          const activeObj = canvas.getActiveObject();
          if (activeObj && activeObj.type === 'rect') {
            const rect = activeObj as any;
            if (rect.width && rect.height) {
              addLabel({
                id: `lbl_${Date.now()}`,
                imageId: images[currentImageIndex]?.id || '',
                type: 'detection',
                classId: currentClassId,
                className: currentClassName,
                data: {
                  bbox: {
                    x: rect.left / (canvasRef.current?.width || 1),
                    y: rect.top / (canvasRef.current?.height || 1),
                    width: rect.width / (canvasRef.current?.width || 1),
                    height: rect.height / (canvasRef.current?.height || 1),
                  },
                },
              });
            }
          }
        }
      });
    };

    initCanvas();

    return () => {
      if (canvas) {
        canvas.dispose();
      }
    };
  }, [images.length, currentTool, currentClassId, currentClassName, currentImageIndex]);

  // Load image onto canvas
  React.useEffect(() => {
    if (!fabricCanvas || !images[currentImageIndex]) return;

    const loadImage = async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fabric = require('fabric');

      fabricCanvas.clear();

      const imgUrl = `file://${images[currentImageIndex].path}`;

      fabric.Image.fromURL(
        imgUrl,
        (img: any) => {
          const canvasWidth = canvasRef.current?.width || 800;
          const canvasHeight = canvasRef.current?.height || 600;

          const scale = Math.min(
            canvasWidth / img.width,
            canvasHeight / img.height
          );

          img.set({
            scaleX: scale,
            scaleY: scale,
            left: (canvasWidth - img.width * scale) / 2,
            top: (canvasHeight - img.height * scale) / 2,
            selectable: false,
            evented: false,
          });

          fabricCanvas.setWidth(canvasWidth);
          fabricCanvas.setHeight(canvasHeight);
          fabricCanvas.add(img);
          fabricCanvas.sendToBack(img);
          fabricCanvas.renderAll();

          // Load existing labels
          loadExistingLabels();
        },
        { crossOrigin: 'anonymous' }
      );
    };

    loadImage();
  }, [fabricCanvas, currentImageIndex, images]);

  const loadExistingLabels = async () => {
    if (!images[currentImageIndex]) return;

    try {
      const existingLabels = await fetchLabels(datasetId, images[currentImageIndex].id);
      setLabels(existingLabels);

      // Draw existing labels on canvas
      if (fabricCanvas && existingLabels.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fabric = require('fabric');

        existingLabels.forEach((label) => {
          if (label.type === 'detection') {
            const data = label.data as { bbox: { x: number; y: number; width: number; height: number } };
            if (data.bbox) {
              const canvasWidth = canvasRef.current?.width || 800;
              const canvasHeight = canvasRef.current?.height || 600;

              const rect = new fabric.Rect({
                left: data.bbox.x * canvasWidth,
                top: data.bbox.y * canvasHeight,
                width: data.bbox.width * canvasWidth,
                height: data.bbox.height * canvasHeight,
                fill: 'rgba(59, 130, 246, 0.3)',
                stroke: '#3B82F6',
                strokeWidth: 2,
                selectable: true,
                class_id: label.classId,
                class_name: label.className,
              });
              fabricCanvas.add(rect);
            }
          }
        });
        fabricCanvas.renderAll();
      }
    } catch (e) {
      console.error('Failed to load labels:', e);
    }
  };

  const handleToolChange = (tool: string) => {
    setCurrentTool(tool as typeof currentTool);
    if (fabricCanvas) {
      fabricCanvas.selection = tool === 'select';
    }
  };

  const handleClassChange = (classId: string) => {
    if (currentDataset?.classes) {
      setCurrentClass(parseInt(classId), currentDataset.classes[parseInt(classId)]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      await uploadImages(datasetId, Array.from(files), 'train');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!images[currentImageIndex]) return;

    setSaving(true);
    try {
      await updateLabels(datasetId, images[currentImageIndex].id, labels);
      alert('保存成功');
    } catch (e) {
      console.error('Failed to save labels:', e);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const currentImage = images[currentImageIndex];

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
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href={`/datasets/${datasetId}`} className="text-gray-500 hover:text-gray-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">{currentDataset.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              AI 标注
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Panel */}
          <div className="w-64 flex flex-col gap-4">
            {/* Tools */}
            <Card className="p-3">
              <h3 className="text-sm font-medium mb-2">工具</h3>
              <div className="flex flex-wrap gap-1">
                {tools.map((tool) => (
                  <button
                    key={tool.value}
                    onClick={() => handleToolChange(tool.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      currentTool === tool.value
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    title={tool.label}
                  >
                    <span className="mr-1">{tool.icon}</span>
                    {tool.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Classes */}
            <Card className="p-3 flex-1">
              <h3 className="text-sm font-medium mb-2">类别</h3>
              <div className="space-y-1">
                {currentDataset.classes.map((cls, i) => (
                  <button
                    key={i}
                    onClick={() => handleClassChange(String(i))}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm text-left transition-colors',
                      currentClassId === i
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </Card>

            {/* Upload */}
            <Card className="p-3">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button className="w-full" disabled={uploading}>
                  {uploading ? '上传中...' : '上传图像'}
                </Button>
              </label>
            </Card>
          </div>

          {/* Canvas Area */}
          <Card className="flex-1 flex flex-col min-h-0">
            {images.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4 text-gray-300">📷</div>
                  <p className="text-gray-500 mb-4">暂无图像</p>
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
              </div>
            ) : (
              <>
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg min-h-0 overflow-hidden relative">
                  <canvas ref={canvasRef} />
                </div>

                {/* Image Navigator */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentImageIndex === 0}
                    onClick={() => {
                      setCurrentImageIndex((i) => i - 1);
                      clearLabels();
                    }}
                  >
                    ◀
                  </Button>
                  <span className="text-sm">
                    图像 {currentImageIndex + 1} / {images.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentImageIndex === images.length - 1}
                    onClick={() => {
                      setCurrentImageIndex((i) => i + 1);
                      clearLabels();
                    }}
                  >
                    ▶
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Right Panel */}
          <Card className="w-64 flex flex-col">
            <h3 className="text-sm font-medium mb-3">属性</h3>
            {currentImage && (
              <div className="text-sm text-gray-500 space-y-2 mb-4">
                <p>文件名: {currentImage.filename}</p>
                <p>
                  尺寸: {currentImage.width} × {currentImage.height}
                </p>
                <p>分割: {currentImage.split}</p>
                <p>标注: {currentImage.labeled ? '✓' : '✗'}</p>
              </div>
            )}

            <div className="flex-1 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-2">标注 ({labels.length})</h4>
              {labels.length === 0 ? (
                <p className="text-sm text-gray-500">暂无标注</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-auto">
                  {labels.map((label, i) => (
                    <div
                      key={label.id}
                      className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                    >
                      <span>{label.className}</span>
                      <button
                        onClick={() => deleteLabel(label.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
