import { Settings } from 'lucide-react';
import { useState } from 'react';

interface ServerSettingsProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
}

export function ServerSettings({ serverUrl, onServerUrlChange }: ServerSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(serverUrl);

  const handleSave = () => {
    onServerUrlChange(tempUrl);
    setIsOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">服务器设置</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded"
          title="设置"
        >
          <Settings size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">服务器地址</label>
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempUrl(serverUrl);
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {!isOpen && serverUrl && (
        <p className="text-xs text-gray-500 mt-2 truncate" title={serverUrl}>
          当前: {serverUrl}
        </p>
      )}
    </div>
  );
}
