import { Play, Square, Download } from 'lucide-react';

interface ControlPanelProps {
  isAnalyzing: boolean;
  canStart: boolean;
  hasResults: boolean;
  onStart: () => void;
  onStop: () => void;
  onExport: () => void;
}

export function ControlPanel({
  isAnalyzing,
  canStart,
  hasResults,
  onStart,
  onStop,
  onExport,
}: ControlPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">2. 控制面板</h2>
      <div className="flex items-center gap-4">
        {!isAnalyzing ? (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={20} />
            开始分析
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Square size={20} />
            停止
          </button>
        )}
        <button
          onClick={onExport}
          disabled={!hasResults || isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={20} />
          导出 CSV
        </button>
      </div>
    </div>
  );
}
