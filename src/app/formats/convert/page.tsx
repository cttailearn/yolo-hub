'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Alert } from '@/components/ui/alert';

const formatOptions = [
  { label: 'COCO JSON', value: 'coco' },
  { label: 'VOC XML', value: 'voc' },
  { label: 'LabelMe JSON', value: 'labelme' },
  { label: 'DOTA TXT', value: 'dota' },
];

export default function ConvertPage() {
  const [sourceFormat, setSourceFormat] = React.useState('coco');
  const [targetFormat, setTargetFormat] = React.useState('voc');
  const [loading, setLoading] = React.useState(false);

  const handleConvert = async () => {
    setLoading(true);
    // TODO: 实现格式转换
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">格式转换</h1>

        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">源格式</label>
              <Dropdown
                items={formatOptions}
                value={sourceFormat}
                onChange={setSourceFormat}
              />
            </div>

            <div className="flex justify-center">
              <div className="text-4xl text-gray-400">→</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">目标格式</label>
              <Dropdown
                items={formatOptions}
                value={targetFormat}
                onChange={setTargetFormat}
              />
            </div>

            <Alert type="info">
              格式转换功能即将上线，支持 COCO、VOC、LabelMe、DOTA 等常用格式的相互转换。
            </Alert>

            <Button
              className="w-full"
              onClick={handleConvert}
              disabled
            >
              {loading ? '转换中...' : '开始转换'}
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
