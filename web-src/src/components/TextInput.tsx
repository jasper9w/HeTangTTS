import { useState } from 'react';
import { ClipboardPaste, Settings } from 'lucide-react';

interface TextInputProps {
  onParse: (text: string, delimiter: string) => void;
  disabled?: boolean;
}

export function TextInput({ onParse, disabled }: TextInputProps) {
  const [text, setText] = useState('');
  const [delimiter, setDelimiter] = useState('|');
  const [showSettings, setShowSettings] = useState(false);

  const handleParse = () => {
    if (text.trim()) {
      onParse(text, delimiter);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">文本输入</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-500 hover:text-gray-700 rounded"
          title="设置"
        >
          <Settings size={18} />
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <label className="block text-sm text-gray-600 mb-1">分隔符</label>
          <input
            type="text"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value || '|')}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="|"
          />
          <p className="text-xs text-gray-500 mt-1">
            格式：角色{delimiter}内容
          </p>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={`在此粘贴内容，每行一条。\n格式：角色${delimiter}内容\n\n示例：\n旁白${delimiter}很久很久以前...\n主角${delimiter}我要拯救世界！`}
        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-gray-500">
          {text.split('\n').filter(l => l.trim()).length} 行
        </span>
        <button
          onClick={handleParse}
          disabled={disabled || !text.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ClipboardPaste size={18} />
          解析内容
        </button>
      </div>
    </div>
  );
}
