import { X, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  type: 'csv' | 'excel';
}

export function FileImportModal({ isOpen, onClose, onImport, type }: FileImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (file) {
      onImport(file);
      setFile(null);
      onClose();
    }
  };

  const acceptTypes = type === 'csv' ? '.csv' : '.xlsx,.xls';
  const title = type === 'csv' ? 'CSV' : 'Excel';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">从 {title} 导入</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">{file.name}</p>
                <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                <button
                  onClick={() => setFile(null)}
                  className="mt-3 text-sm text-red-600 hover:text-red-700"
                >
                  移除文件
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">拖拽文件到此处，或</p>
                <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                  选择文件
                  <input
                    type="file"
                    accept={acceptTypes}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  支持 {title} 格式
                </p>
              </div>
            )}
          </div>

          {/* Format Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">文件格式要求</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p className="font-medium">必需列：</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>角色</strong> - 角色名称</li>
                <li>• <strong>内容</strong> - 配音文本内容</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3">
                提示：第一行应为列标题，从第二行开始为数据
              </p>
            </div>
          </div>

          {/* Example */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">示例</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1 px-2">角色</th>
                  <th className="text-left py-1 px-2">内容</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-200">
                  <td className="py-1 px-2">旁白</td>
                  <td className="py-1 px-2">很久很久以前...</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1 px-2">主角</td>
                  <td className="py-1 px-2">我要拯救世界！</td>
                </tr>
                <tr>
                  <td className="py-1 px-2">反派</td>
                  <td className="py-1 px-2">你休想！</td>
                </tr>
              </tbody>
            </table>
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
            disabled={!file}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
}
