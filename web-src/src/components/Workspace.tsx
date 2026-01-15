import { ArrowLeft, Edit2, Save, Settings, ClipboardPaste, FileSpreadsheet, X, Download } from 'lucide-react';
import { useState } from 'react';
import { DubbingTable } from './DubbingTable';
import { RoleSidebar } from './RoleSidebar';
import { ServerSettingsModal } from './ServerSettingsModal';
import { TextImportModal } from './TextImportModal';
import { FileImportModal } from './FileImportModal';
import type { AudioFile, RoleConfig, DubbingTask } from '../types';

interface BatchProgress {
  isRunning: boolean;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  currentTask: string;
}

interface WorkspaceProps {
  projectName: string;
  serverUrl: string;
  concurrency: number;
  roles: string[];
  roleConfigs: Record<string, RoleConfig>;
  tasks: DubbingTask[];
  referenceDirectory: string;
  referenceAudios: AudioFile[];
  favorites: string[];
  recentUsed: string[];
  batchProgress: BatchProgress;
  onBack: () => void;
  onRenameProject: (newName: string) => void;
  onParseText: (text: string, delimiter: string) => void;
  onImportFile: (file: File, type: 'csv' | 'excel') => void;
  onSettingsChange: (url: string, concurrency: number) => void;
  onSelectReferenceDir: () => void;
  onSetRoleAudio: (role: string, audio: AudioFile | null) => void;
  onSetRoleSpeed: (role: string, speed: number) => void;
  onToggleFavorite: (audioPath: string, isFavorite: boolean) => void;
  onSetNote: (audioPath: string, note: string) => void;
  onGenerate: (index: number) => void;
  onBatchGenerate: (indices: number[]) => void;
  onStopGenerate: () => void;
  onExport: () => void;
  canExport: boolean;
  playingAudio: string | null;
  onPlayAudio: (audioPath: string) => void;
}

export function Workspace({
  projectName,
  serverUrl,
  concurrency,
  roles,
  roleConfigs,
  tasks,
  referenceDirectory,
  referenceAudios,
  favorites,
  recentUsed,
  batchProgress,
  onBack,
  onRenameProject,
  onParseText,
  onImportFile,
  onSettingsChange,
  onSelectReferenceDir,
  onSetRoleAudio,
  onSetRoleSpeed,
  onToggleFavorite,
  onSetNote,
  onGenerate,
  onBatchGenerate,
  onStopGenerate,
  onExport,
  canExport,
  playingAudio,
  onPlayAudio,
}: WorkspaceProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showTextImport, setShowTextImport] = useState(false);
  const [showFileImport, setShowFileImport] = useState(false);
  const [fileImportType, setFileImportType] = useState<'csv' | 'excel'>('csv');

  const handleRename = () => {
    if (editName.trim() && editName !== projectName) {
      onRenameProject(editName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="返回项目列表"
              >
                <ArrowLeft size={20} />
              </button>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') {
                        setEditName(projectName);
                        setIsEditingName(false);
                      }
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded text-lg font-semibold"
                    autoFocus
                  />
                  <button
                    onClick={handleRename}
                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                    title="确认"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditName(projectName);
                      setIsEditingName(false);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="取消"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-800">{projectName}</h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="重命名"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* 导入按钮组 - 靠左 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTextImport(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                title="粘贴导入"
              >
                <ClipboardPaste size={16} />
                粘贴
              </button>
              <button
                onClick={() => {
                  setFileImportType('csv');
                  setShowFileImport(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                title="CSV 导入"
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>
              <button
                onClick={() => {
                  setFileImportType('excel');
                  setShowFileImport(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                title="Excel 导入"
              >
                <FileSpreadsheet size={16} />
                Excel
              </button>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-3">
              {/* 导出按钮 */}
              <button
                onClick={onExport}
                disabled={!canExport}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={canExport ? '导出音频和字幕' : '请先完成所有任务'}
              >
                <Download size={16} />
                导出
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                {showSidebar ? '隐藏' : '显示'}侧栏
              </button>
              <button
                onClick={() => setShowServerSettings(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="服务器设置"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Main Area */}
        <div className={`flex-1 p-6 space-y-4 ${showSidebar ? 'mr-80' : ''}`}>
          {/* 总体进度条 - 始终显示 */}
          <div className="bg-white rounded-lg shadow px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 flex-shrink-0">进度</span>
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%`,
                    backgroundColor: tasks.some(t => t.status === 'error') ? '#f59e0b' : '#22c55e'
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
              </span>
              {batchProgress.isRunning && (
                <>
                  <span className="text-xs text-blue-600 truncate max-w-[200px]">{batchProgress.currentTask}</span>
                  <button
                    onClick={onStopGenerate}
                    className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex-shrink-0"
                  >
                    停止
                  </button>
                </>
              )}
            </div>
          </div>

          <DubbingTable
            tasks={tasks}
            onGenerate={onGenerate}
            onBatchGenerate={onBatchGenerate}
            playingAudio={playingAudio}
            onPlayAudio={onPlayAudio}
          />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed right-0 top-[73px] bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto p-4">
            <RoleSidebar
              roles={roles}
              roleConfigs={roleConfigs}
              referenceAudios={referenceAudios}
              referenceDirectory={referenceDirectory}
              favorites={favorites}
              recentUsed={recentUsed}
              onSelectReferenceDir={onSelectReferenceDir}
              onSetRoleAudio={onSetRoleAudio}
              onSetRoleSpeed={onSetRoleSpeed}
              onToggleFavorite={onToggleFavorite}
              onSetNote={onSetNote}
              playingAudio={playingAudio}
              onPlayAudio={onPlayAudio}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ServerSettingsModal
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
        serverUrl={serverUrl}
        concurrency={concurrency}
        onSave={onSettingsChange}
      />

      <TextImportModal
        isOpen={showTextImport}
        onClose={() => setShowTextImport(false)}
        onImport={onParseText}
      />

      <FileImportModal
        isOpen={showFileImport}
        onClose={() => setShowFileImport(false)}
        onImport={(file) => onImportFile(file, fileImportType)}
        type={fileImportType}
      />
    </div>
  );
}
