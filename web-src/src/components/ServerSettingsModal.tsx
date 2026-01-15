import { X, Server } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
  concurrency: number;
  onSave: (url: string, concurrency: number) => void;
}

export function ServerSettingsModal({ isOpen, onClose, serverUrl, concurrency, onSave }: ServerSettingsModalProps) {
  const [url, setUrl] = useState(serverUrl);
  const [concurrent, setConcurrent] = useState(concurrency);

  useEffect(() => {
    setUrl(serverUrl);
    setConcurrent(concurrency);
  }, [serverUrl, concurrency]);

  const handleSave = () => {
    onSave(url, concurrent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Server size={20} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">服务器设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务器地址
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              请输入配音服务的 API 地址
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              并发数
            </label>
            <input
              type="number"
              value={concurrent}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setConcurrent(Math.min(50, Math.max(1, val)));
              }}
              min={1}
              max={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              批量生成时的最大并发请求数（1-50，默认5）
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
