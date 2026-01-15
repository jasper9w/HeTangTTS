import { X, Search, Star, Clock, Music, Play, Square, Edit2, Save } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { AudioFile } from '../types';

interface AudioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  audios: AudioFile[];
  favorites: string[];
  recentUsed: string[];
  onSelect: (audio: AudioFile) => void;
  onToggleFavorite: (audioPath: string, isFavorite: boolean) => void;
  onSetNote: (audioPath: string, note: string) => void;
  playingAudio: string | null;
  onPlayAudio: (audioPath: string) => void;
}

type FilterType = 'all' | 'favorites' | 'recent';
type TagFilter = 'all' | '男' | '女' | '儿童' | '老年' | '青年' | '中年';

export function AudioSelectorModal({
  isOpen,
  onClose,
  audios,
  favorites,
  recentUsed,
  onSelect,
  onToggleFavorite,
  onSetNote,
  playingAudio,
  onPlayAudio,
}: AudioSelectorModalProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const filteredAudios = useMemo(() => {
    let result = audios;

    // 按类型筛选
    if (filterType === 'favorites') {
      result = result.filter(a => favorites.includes(a.fullPath));
    } else if (filterType === 'recent') {
      result = result.filter(a => recentUsed.includes(a.fullPath));
      // 按最近使用顺序排序
      result.sort((a, b) => {
        const aIndex = recentUsed.indexOf(a.fullPath);
        const bIndex = recentUsed.indexOf(b.fullPath);
        return aIndex - bIndex;
      });
    }

    // 按标签筛选
    if (tagFilter !== 'all') {
      result = result.filter(a => a.tags?.includes(tagFilter));
    }

    // 按搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.note?.toLowerCase().includes(query) ||
        a.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [audios, filterType, tagFilter, searchQuery, favorites, recentUsed]);

  const handleSaveNote = (audioPath: string) => {
    onSetNote(audioPath, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">选择参考音</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType('favorites')}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'favorites'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star size={16} />
              收藏
            </button>
            <button
              onClick={() => setFilterType('recent')}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'recent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock size={16} />
              最近使用
            </button>
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', '男', '女', '儿童', '老年', '青年', '中年'] as TagFilter[]).map(tag => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  tagFilter === tag
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag === 'all' ? '全部标签' : tag}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件名、标签或备注..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Audio List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAudios.length === 0 ? (
            <div className="text-center py-12">
              <Music size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">没有找到匹配的音频文件</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAudios.map((audio) => {
                const isFavorite = favorites.includes(audio.fullPath);
                const isPlaying = playingAudio === audio.fullPath;
                const isEditingThisNote = editingNote === audio.fullPath;

                return (
                  <div
                    key={audio.fullPath}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* Play Button */}
                      <button
                        onClick={() => onPlayAudio(audio.fullPath)}
                        className={`p-2 rounded-lg ${
                          isPlaying
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {isPlaying ? <Square size={20} /> : <Play size={20} />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-gray-800 truncate">{audio.name}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => onToggleFavorite(audio.fullPath, !isFavorite)}
                              className={`p-1.5 rounded ${
                                isFavorite
                                  ? 'text-yellow-500 hover:bg-yellow-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={isFavorite ? '取消收藏' : '收藏'}
                            >
                              <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => {
                                onSelect(audio);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              选择
                            </button>
                          </div>
                        </div>

                        {/* Tags */}
                        {audio.tags && audio.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {audio.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Note */}
                        {isEditingThisNote ? (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="添加备注..."
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(audio.fullPath)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingNote(null);
                                setNoteText('');
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-2">
                            {audio.note ? (
                              <p className="text-sm text-gray-600 flex-1">{audio.note}</p>
                            ) : (
                              <p className="text-sm text-gray-400 flex-1">暂无备注</p>
                            )}
                            <button
                              onClick={() => {
                                setEditingNote(audio.fullPath);
                                setNoteText(audio.note || '');
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          {Math.round(audio.size / 1024)}KB
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 {filteredAudios.length} 个音频文件
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
