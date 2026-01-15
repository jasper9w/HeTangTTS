import { FolderOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ProjectManagerProps {
  projects: Array<{ name: string; path: string }>;
  currentProject: string;
  onSelectProject: (name: string) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (oldName: string, newName: string) => void;
  onDeleteProject: (name: string) => void;
}

export function ProjectManager({
  projects,
  currentProject,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateProject(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleRename = (oldName: string) => {
    if (editName.trim() && editName !== oldName) {
      onRenameProject(oldName, editName.trim());
    }
    setEditingProject(null);
    setEditName('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">项目管理</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={16} />
          新建项目
        </button>
      </div>

      {isCreating && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="输入项目名称"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              创建
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewName('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            暂无项目，点击"新建项目"开始
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                currentProject === project.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {editingProject === project.name ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(project.name);
                    if (e.key === 'Escape') {
                      setEditingProject(null);
                      setEditName('');
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => onSelectProject(project.name)}
                  className="flex-1 text-left flex items-center gap-2"
                >
                  <FolderOpen size={16} className="text-gray-500" />
                  <span className="font-medium text-gray-800">{project.name}</span>
                </button>
              )}

              <div className="flex items-center gap-1">
                {editingProject === project.name ? (
                  <>
                    <button
                      onClick={() => handleRename(project.name)}
                      className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                      title="确认"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingProject(null);
                        setEditName('');
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      title="取消"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingProject(project.name);
                        setEditName(project.name);
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      title="重命名"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`确定要删除项目"${project.name}"吗？`)) {
                          onDeleteProject(project.name);
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
