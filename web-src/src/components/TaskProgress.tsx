interface TaskProgressProps {
  isAnalyzing: boolean;
  current: number;
  total: number;
  currentFile: string;
}

export function TaskProgress({ isAnalyzing, current, total, currentFile }: TaskProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (!isAnalyzing && total === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">进度</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{current} / {total} 个文件</span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {currentFile && (
          <p className="text-sm text-gray-500 truncate" title={currentFile}>
            正在处理: {currentFile}
          </p>
        )}
        {!isAnalyzing && current > 0 && current === total && (
          <p className="text-sm text-green-600 font-medium">
            分析完成！
          </p>
        )}
      </div>
    </div>
  );
}
