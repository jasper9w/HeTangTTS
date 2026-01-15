import { X, ClipboardPaste, Settings } from 'lucide-react';
import { useState } from 'react';

interface TextImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string, delimiter: string) => void;
}

export function TextImportModal({ isOpen, onClose, onImport }: TextImportModalProps) {
  const [text, setText] = useState('');
  const [delimiter, setDelimiter] = useState('|');
  const [showSettings, setShowSettings] = useState(false);

  const handleImport = () => {
    if (text.trim()) {
      onImport(text, delimiter);
      setText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ClipboardPaste size={20} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">粘贴导入配音任务</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="设置"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showSettings && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">分隔符</label>
              <input
                type="text"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value || '|')}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="|"
              />
              <p className="text-xs text-gray-500 mt-2">
                格式：角色{delimiter}内容
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粘贴内容
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`在此粘贴内容，每行一条。\n格式：角色${delimiter}内容\n\n示例：\n旁白${delimiter}很久很久以前...\n主角${delimiter}我要拯救世界！\n反派${delimiter}你休想！`}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              {text.split('\n').filter(l => l.trim()).length} 行
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">格式说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 每行一条配音任务</li>
              <li>• 使用分隔符（默认 | ）分隔角色和内容</li>
              <li>• 格式：角色{delimiter}内容</li>
              <li>• 角色名称会自动提取并创建角色配置</li>
            </ul>
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
            onClick={handleImport}
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
}
