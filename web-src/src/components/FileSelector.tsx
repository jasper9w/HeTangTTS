import { FolderOpen } from 'lucide-react';

interface FileSelectorProps {
  directory: string;
  fileCount: number;
  onSelectDirectory: () => void;
  disabled?: boolean;
}

export function FileSelector({ directory, fileCount, onSelectDirectory, disabled }: FileSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">1. 选择目录</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={onSelectDirectory}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <FolderOpen size={20} />
          选择文件夹
        </button>
        {directory && (
          <div className="flex-1">
            <p className="text-sm text-gray-600 truncate" title={directory}>
              {directory}
            </p>
            <p className="text-sm text-gray-500">
              找到 {fileCount} 个音频文件
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
