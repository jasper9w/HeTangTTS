import { FolderOpen, Music, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { AudioSelectorModal } from './AudioSelectorModal';
import type { AudioFile, RoleConfig } from '../types';

interface RoleSidebarProps {
  roles: string[];
  roleConfigs: Record<string, RoleConfig>;
  referenceAudios: AudioFile[];
  referenceDirectory: string;
  favorites: string[];
  recentUsed: string[];
  onSelectReferenceDir: () => void;
  onSetRoleAudio: (role: string, audio: AudioFile | null) => void;
  onSetRoleSpeed: (role: string, speed: number) => void;
  onToggleFavorite: (audioPath: string, isFavorite: boolean) => void;
  onSetNote: (audioPath: string, note: string) => void;
  playingAudio: string | null;
  onPlayAudio: (audioPath: string) => void;
}

export function RoleSidebar({
  roles,
  roleConfigs,
  referenceAudios,
  referenceDirectory,
  favorites,
  recentUsed,
  onSelectReferenceDir,
  onSetRoleAudio,
  onSetRoleSpeed,
  onToggleFavorite,
  onSetNote,
  playingAudio,
  onPlayAudio,
}: RoleSidebarProps) {
  const [selectingForRole, setSelectingForRole] = useState<string | null>(null);

  // 排序角色：旁白始终在最上面
  const sortedRoles = [...roles].sort((a, b) => {
    if (a === '旁白') return -1;
    if (b === '旁白') return 1;
    return 0;
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 flex-shrink-0">角色设置</h2>

      <div className="flex-shrink-0">
        <button
          onClick={onSelectReferenceDir}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <FolderOpen size={16} />
          选择参考音文件夹
        </button>
        {referenceDirectory && (
          <p className="text-xs text-gray-500 mt-1 truncate" title={referenceDirectory}>
            {referenceDirectory}
          </p>
        )}
        {referenceAudios.length > 0 && (
          <p className="text-xs text-gray-500">
            可用 {referenceAudios.length} 个音频文件
          </p>
        )}
      </div>

      {roles.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4 flex-shrink-0">
          暂无角色。请先解析文本内容。
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {sortedRoles.map((role) => (
            <RoleItem
              key={role}
              role={role}
              config={roleConfigs[role]}
              onSelectAudio={() => setSelectingForRole(role)}
              onSetSpeed={(speed) => onSetRoleSpeed(role, speed)}
            />
          ))}
        </div>
      )}

      {/* Audio Selector Modal */}
      <AudioSelectorModal
        isOpen={selectingForRole !== null}
        onClose={() => setSelectingForRole(null)}
        audios={referenceAudios}
        favorites={favorites}
        recentUsed={recentUsed}
        onSelect={(audio) => {
          if (selectingForRole) {
            onSetRoleAudio(selectingForRole, audio);
          }
          setSelectingForRole(null);
        }}
        onToggleFavorite={onToggleFavorite}
        onSetNote={onSetNote}
        playingAudio={playingAudio}
        onPlayAudio={onPlayAudio}
      />
    </div>
  );
}

interface RoleItemProps {
  role: string;
  config?: RoleConfig;
  onSelectAudio: () => void;
  onSetSpeed: (speed: number) => void;
}

function RoleItem({ role, config, onSelectAudio, onSetSpeed }: RoleItemProps) {
  const selectedAudio = config?.referenceAudio;
  const speed = config?.speed || (role === '旁白' ? 1.5 : 1.0);

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      {/* 角色名和倍速在同一行 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Music size={14} className="text-gray-500" />
          <span className="font-medium text-gray-800 text-sm">{role}</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={speed}
            onChange={(e) => onSetSpeed(parseFloat(e.target.value) || 1.0)}
            min="0.5"
            max="2.0"
            step="0.1"
            className="w-14 px-1.5 py-0.5 text-xs text-center border border-gray-300 rounded"
          />
          <span className="text-xs text-gray-500">x</span>
        </div>
      </div>
      {/* 选择音色按钮 */}
      <button
        onClick={onSelectAudio}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
          selectedAudio
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={selectedAudio ? 'font-medium' : ''}>
          {selectedAudio ? selectedAudio.name : '选择音色'}
        </span>
        <ChevronRight size={16} className={selectedAudio ? 'text-blue-500' : 'text-gray-400'} />
      </button>
    </div>
  );
}
