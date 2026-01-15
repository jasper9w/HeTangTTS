import { Plus, FolderOpen, Calendar, ChevronRight, Trash2 } from 'lucide-react';

interface ProjectListPageProps {
  projects: Array<{ name: string; path: string; data?: { created_at?: string } }>;
  onSelectProject: (name: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (name: string) => void;
}

export function ProjectListPage({ projects, onSelectProject, onCreateProject, onDeleteProject }: ProjectListPageProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">荷塘配音工具</h1>
          <p className="text-gray-600">AI 批量配音生成</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">我的项目</h2>
            <button
              onClick={onCreateProject}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              新建项目
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-6">还没有项目</p>
              <button
                onClick={onCreateProject}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                创建第一个项目
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="group relative p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除项目"${project.name}"吗？`)) {
                        onDeleteProject(project.name);
                      }
                    }}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除项目"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => onSelectProject(project.name)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <FolderOpen size={32} className="text-blue-500 group-hover:text-blue-600" />
                      <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                      {project.name}
                    </h3>
                    {project.data?.created_at && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>{new Date(project.data.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>项目文件保存在：~/Desktop/荷塘配音</p>
        </div>
      </div>
    </div>
  );
}
