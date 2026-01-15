import { Play, Pause, Filter, CheckSquare, Square, Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { DubbingTask } from '../types';

interface DubbingTableProps {
  tasks: DubbingTask[];
  onGenerate: (index: number) => void;
  onBatchGenerate: (indices: number[]) => void;
  playingAudio: string | null;
  onPlayAudio: (audioPath: string) => void;
}

export function DubbingTable({ tasks, onGenerate, onBatchGenerate, playingAudio, onPlayAudio }: DubbingTableProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const roles = Array.from(new Set(tasks.map(t => t.role)));

  const filteredTasks = tasks.filter(task => {
    if (roleFilter && task.role !== roleFilter) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    return true;
  });

  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const toggleAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.index)));
    }
  };

  const handleBatchGenerate = () => {
    if (selectedTasks.size > 0) {
      onBatchGenerate(Array.from(selectedTasks));
    }
  };

  const getStatusColor = (status: DubbingTask['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'generating':
        return 'bg-blue-100 text-blue-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: DubbingTask['status']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'generating':
        return '生成中';
      case 'error':
        return '失败';
      default:
        return '待生成';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          配音任务 ({filteredTasks.length} 项)
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">全部角色</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">全部状态</option>
              <option value="pending">待生成</option>
              <option value="generating">生成中</option>
              <option value="completed">已完成</option>
              <option value="error">失败</option>
            </select>
          </div>
          <button
            onClick={handleBatchGenerate}
            disabled={selectedTasks.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            批量生成 ({selectedTasks.size})
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          暂无配音任务。请先解析文本内容。
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 w-10">
                  <button onClick={toggleAll} className="p-1">
                    {selectedTasks.size === filteredTasks.length && filteredTasks.length > 0 ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} className="text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 w-12">#</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 w-24">角色</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">内容</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 w-24">状态</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 w-40">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <button onClick={() => toggleTask(task.index)} className="p-1">
                      {selectedTasks.has(task.index) ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} className="text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-gray-400">{task.index + 1}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {task.role}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-700 max-w-md truncate" title={task.content}>
                    {task.content}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {/* 试听按钮 - 固定宽度占位，避免布局跳动 */}
                      <div className="w-8 h-8 flex-shrink-0">
                        {task.status === 'completed' && task.outputFile && (
                          <button
                            onClick={() => onPlayAudio(task.outputFile!)}
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              playingAudio === task.outputFile
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={playingAudio === task.outputFile ? '停止播放' : '试听'}
                          >
                            {playingAudio === task.outputFile ? (
                              <Pause size={16} />
                            ) : (
                              <Volume2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => onGenerate(task.index)}
                        disabled={task.status === 'generating'}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={task.status === 'completed' ? '重新生成' : '生成配音'}
                      >
                        <Play size={14} />
                        {task.status === 'completed' ? '重新生成' : '生成'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
