import { useState, useCallback, useEffect, useRef } from 'react';
import { ProjectListPage } from './components/ProjectListPage';
import { Workspace } from './components/Workspace';
import { usePyWebView } from './hooks/usePyWebView';
import type { AudioFile, RoleConfig, DubbingTask, Project } from './types';
import './index.css';

// 批量生成进度状态
interface BatchProgress {
  isRunning: boolean;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  currentTask: string;
}

function App() {
  const { api, isReady } = usePyWebView();

  // 视图状态
  const [view, setView] = useState<'list' | 'workspace'>('list');

  // 项目管理
  const [projects, setProjects] = useState<Array<{ name: string; path: string; data?: Project }>>([]);
  const [currentProject, setCurrentProject] = useState<string>('');
  const [projectData, setProjectData] = useState<Project | null>(null);

  // 配音任务
  const [tasks, setTasks] = useState<DubbingTask[]>([]);

  // 批量生成进度
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    isRunning: false,
    total: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    currentTask: ''
  });

  // 停止生成标志 (使用 ref 避免闭包问题)
  const stopRequestedRef = useRef(false);

  // 参考音
  const [referenceDirectory, setReferenceDirectory] = useState('');
  const [referenceAudios, setReferenceAudios] = useState<AudioFile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentUsed, setRecentUsed] = useState<string[]>([]);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // 加载项目列表
  useEffect(() => {
    if (api) {
      loadProjects();
      loadFavorites();
      loadRecentUsed();
    }
  }, [api]);

  const loadFavorites = useCallback(async () => {
    if (!api) return;
    const result = await api.get_favorites();
    if (result.success) {
      setFavorites(result.favorites);
    }
  }, [api]);

  const loadRecentUsed = useCallback(async () => {
    if (!api) return;
    const result = await api.get_recent_used();
    if (result.success) {
      setRecentUsed(result.recent);
    }
  }, [api]);

  const loadProjects = useCallback(async () => {
    if (!api) return;
    const result = await api.list_projects();
    if (result.success) {
      setProjects(result.projects);
    }
  }, [api]);

  const selectProject = useCallback(async (name: string) => {
    if (!api) return;
    const result = await api.load_project(name);
    if (result.success && result.data) {
      setCurrentProject(name);
      setProjectData(result.data);

      // 恢复项目数据
      if (result.data.tasks) {
        // 清除所有"生成中"状态，防止程序异常退出导致状态不一致
        const cleanedTasks = result.data.tasks.map(task => {
          if (task.status === 'generating') {
            return { ...task, status: 'pending' as const };
          }
          return task;
        });
        setTasks(cleanedTasks);
      } else if (result.data.lines) {
        // 从 lines 创建 tasks
        const newTasks: DubbingTask[] = result.data.lines.map((line, index) => ({
          index,
          role: line.role,
          content: line.content,
          status: 'pending' as const
        }));
        setTasks(newTasks);
      }

      // 恢复参考音文件夹
      if (result.data.referenceDirectory) {
        setReferenceDirectory(result.data.referenceDirectory);
        // 扫描参考音文件
        const scanResult = await api.scan_reference_audio_with_tags(result.data.referenceDirectory, 3, 1024);
        if (scanResult.success) {
          setReferenceAudios(scanResult.files);
        }
      }

      setView('workspace');
    }
  }, [api]);

  const saveProject = useCallback(async () => {
    if (!api || !currentProject || !projectData) return;

    const dataToSave: Project = {
      ...projectData,
      tasks
    };

    await api.save_project(currentProject, dataToSave);
  }, [api, currentProject, projectData, tasks]);

  // 自动保存
  useEffect(() => {
    if (currentProject && projectData && view === 'workspace') {
      const timer = setTimeout(() => {
        saveProject();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentProject, projectData, tasks, view, saveProject]);

  const handleCreateProject = useCallback(async () => {
    if (!api) return;
    const name = prompt('请输入项目名称', '未命名');
    if (!name) return;

    const result = await api.create_project(name.trim());
    if (result.success && result.name) {
      await loadProjects();
      await selectProject(result.name);
    }
  }, [api, loadProjects, selectProject]);

  const handleRenameProject = useCallback(async (newName: string) => {
    if (!api || !currentProject) return;
    const result = await api.rename_project(currentProject, newName);
    if (result.success && result.name) {
      setCurrentProject(result.name);
      await loadProjects();
    }
  }, [api, currentProject, loadProjects]);

  const handleDeleteProject = useCallback(async (projectName: string) => {
    if (!api) return;
    const result = await api.delete_project(projectName);
    if (result.success) {
      if (projectName === currentProject) {
        setCurrentProject('');
        setProjectData(null);
        setTasks([]);
        setView('list');
      }
      await loadProjects();
    }
  }, [api, currentProject, loadProjects]);

  const handleBackToList = useCallback(() => {
    saveProject();
    setView('list');
  }, [saveProject]);

  const handleParseText = useCallback(async (text: string, delimiter: string) => {
    if (!api || !projectData) return;
    const result = await api.parse_text_content(text, delimiter);
    if (result.success) {
      const newTasks: DubbingTask[] = result.lines.map((line, index) => ({
        index,
        role: line.role,
        content: line.content,
        status: 'pending' as const
      }));

      setTasks(newTasks);

      const configs: Record<string, RoleConfig> = {};
      result.roles.forEach(role => {
        configs[role] = {
          role,
          referenceAudio: null,
          speed: role === '旁白' ? 1.5 : 1.0
        };
      });

      setProjectData({
        ...projectData,
        lines: result.lines,
        roles: result.roles,
        roleConfigs: configs,
        delimiter
      });
    }
  }, [api, projectData]);

  const handleImportFile = useCallback(async (file: File, type: 'csv' | 'excel') => {
    // TODO: 实现CSV/Excel文件解析
    console.log('Import file:', file.name, 'type:', type);
    alert(`${type.toUpperCase()} 导入功能开发中...`);
  }, []);

  const handleSelectReferenceDir = useCallback(async () => {
    if (!api || !projectData) return;
    const result = await api.select_reference_directory();
    if (result.success && result.path) {
      setReferenceDirectory(result.path);
      // 保存到项目配置
      setProjectData({
        ...projectData,
        referenceDirectory: result.path
      });
      const scanResult = await api.scan_reference_audio_with_tags(result.path, 3, 1024);
      if (scanResult.success) {
        setReferenceAudios(scanResult.files);
      }
    }
  }, [api, projectData]);

  const handleToggleFavorite = useCallback(async (audioPath: string, isFavorite: boolean) => {
    if (!api) return;
    if (isFavorite) {
      await api.add_favorite(audioPath);
    } else {
      await api.remove_favorite(audioPath);
    }
    await loadFavorites();
  }, [api, loadFavorites]);

  const handleSetNote = useCallback(async (audioPath: string, note: string) => {
    if (!api) return;
    await api.set_audio_note(audioPath, note);
    // 更新本地音频列表中的备注
    setReferenceAudios(prev => prev.map(audio =>
      audio.fullPath === audioPath ? { ...audio, note } : audio
    ));
  }, [api]);

  const handlePlayAudio = useCallback(async (audioPath: string) => {
    if (playingAudio === audioPath) {
      audioElement?.pause();
      setPlayingAudio(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();

      if (!api) return;

      try {
        const result = await api.get_audio_data_url(audioPath);
        if (result.success && result.dataUrl) {
          const audio = new Audio(result.dataUrl);
          await audio.play();
          audio.onended = () => {
            setPlayingAudio(null);
            setAudioElement(null);
          };
          setPlayingAudio(audioPath);
          setAudioElement(audio);
        }
      } catch (error) {
        console.error('Failed to play audio:', error);
      }
    }
  }, [api, playingAudio, audioElement]);

  const handleSetRoleAudio = useCallback(async (role: string, audio: AudioFile | null) => {
    if (!projectData) return;
    setProjectData({
      ...projectData,
      roleConfigs: {
        ...projectData.roleConfigs,
        [role]: { ...projectData.roleConfigs[role], role, referenceAudio: audio }
      }
    });
    // 添加到最近使用
    if (api && audio) {
      await api.add_recent_used(audio.fullPath);
      await loadRecentUsed();
    }
  }, [projectData, api, loadRecentUsed]);

  const handleSetRoleSpeed = useCallback((role: string, speed: number) => {
    if (!projectData) return;
    setProjectData({
      ...projectData,
      roleConfigs: {
        ...projectData.roleConfigs,
        [role]: { ...projectData.roleConfigs[role], role, speed }
      }
    });
  }, [projectData]);

  const handleGenerate = useCallback(async (index: number) => {
    if (!api || !currentProject || !projectData) return;

    const task = tasks[index];
    const roleConfig = projectData.roleConfigs[task.role];

    if (!roleConfig?.referenceAudio) {
      // 设置错误状态而非弹窗
      setTasks(prev => prev.map(t =>
        t.index === index ? { ...t, status: 'error' as const, error: `角色"${task.role}"未配置参考音` } : t
      ));
      return;
    }

    // 更新状态为生成中
    setTasks(prev => prev.map(t =>
      t.index === index ? { ...t, status: 'generating' as const } : t
    ));

    try {
      const result = await api.generate_audio(
        currentProject,
        index,
        task.role,
        task.content,
        roleConfig.referenceAudio.fullPath,
        roleConfig.speed,
        projectData.serverUrl
      );

      if (result.success) {
        setTasks(prev => prev.map(t =>
          t.index === index ? { ...t, status: 'completed' as const, outputFile: result.output } : t
        ));
      } else {
        setTasks(prev => prev.map(t =>
          t.index === index ? { ...t, status: 'error' as const, error: result.error } : t
        ));
      }
    } catch (error) {
      setTasks(prev => prev.map(t =>
        t.index === index ? { ...t, status: 'error' as const, error: String(error) } : t
      ));
    }
  }, [api, currentProject, projectData, tasks]);

  const handleBatchGenerate = useCallback(async (indices: number[]) => {
    if (!api || !currentProject || !projectData) return;

    const concurrency = projectData.concurrency || 5;
    const queue = [...indices];
    let completedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // 重置停止标志
    stopRequestedRef.current = false;

    // 计算总体进度（所有任务中已完成的数量）
    const totalTasks = tasks.length;
    const alreadyCompleted = tasks.filter(t => t.status === 'completed').length;

    // 初始化进度 - 显示总体进度
    setBatchProgress({
      isRunning: true,
      total: totalTasks,
      completed: alreadyCompleted,
      failed: 0,
      skipped: 0,
      currentTask: '准备中...'
    });

    // 并发执行函数
    const runWithConcurrency = async () => {
      const executing: Promise<void>[] = [];

      while ((queue.length > 0 || executing.length > 0) && !stopRequestedRef.current) {
        // 填充执行队列到并发数上限
        while (queue.length > 0 && executing.length < concurrency && !stopRequestedRef.current) {
          const index = queue.shift()!;
          const task = tasks[index];
          const roleConfig = projectData.roleConfigs[task.role];

          if (!roleConfig?.referenceAudio) {
            // 跳过没有配置参考音的任务，设置错误状态
            skippedCount++;
            failedCount++;
            setTasks(prev => prev.map(t =>
              t.index === index ? { ...t, status: 'error' as const, error: `角色"${task.role}"未配置参考音` } : t
            ));
            setBatchProgress(prev => ({
              ...prev,
              skipped: skippedCount,
              failed: failedCount,
              currentTask: `跳过: ${task.role} - 未配置参考音`
            }));
            continue;
          }

          // 更新状态为生成中
          setTasks(prev => prev.map(t =>
            t.index === index ? { ...t, status: 'generating' as const } : t
          ));

          setBatchProgress(prev => ({
            ...prev,
            currentTask: `正在生成: ${task.role} - ${task.content.slice(0, 20)}...`
          }));

          const promise = (async () => {
            try {
              const result = await api.generate_audio(
                currentProject,
                index,
                task.role,
                task.content,
                roleConfig.referenceAudio!.fullPath,
                roleConfig.speed,
                projectData.serverUrl
              );

              if (result.success) {
                completedCount++;
                setTasks(prev => prev.map(t =>
                  t.index === index ? { ...t, status: 'completed' as const, outputFile: result.output } : t
                ));
              } else {
                failedCount++;
                setTasks(prev => prev.map(t =>
                  t.index === index ? { ...t, status: 'error' as const, error: result.error } : t
                ));
              }
            } catch (error) {
              failedCount++;
              setTasks(prev => prev.map(t =>
                t.index === index ? { ...t, status: 'error' as const, error: String(error) } : t
              ));
            }

            // 更新总体进度
            setBatchProgress(prev => ({
              ...prev,
              completed: alreadyCompleted + completedCount,
              failed: failedCount
            }));
          })();

          executing.push(promise);
          // 移除已完成的 promise
          promise.finally(() => {
            const idx = executing.indexOf(promise);
            if (idx > -1) executing.splice(idx, 1);
          });
        }

        // 等待任意一个任务完成
        if (executing.length > 0) {
          await Promise.race(executing);
        }
      }

      // 等待所有正在执行的任务完成
      if (executing.length > 0) {
        await Promise.all(executing);
      }
    };

    await runWithConcurrency();

    // 完成
    const finalCompleted = alreadyCompleted + completedCount;
    const wasStopped = stopRequestedRef.current;
    setBatchProgress(prev => ({
      ...prev,
      isRunning: false,
      completed: finalCompleted,
      currentTask: wasStopped
        ? `已停止! 本次成功: ${completedCount}, 失败: ${failedCount}`
        : `完成! 本次成功: ${completedCount}, 失败: ${failedCount}, 跳过: ${skippedCount}`
    }));
    stopRequestedRef.current = false;
  }, [api, currentProject, projectData, tasks]);

  const handleStopGenerate = useCallback(() => {
    stopRequestedRef.current = true;
    setBatchProgress(prev => ({
      ...prev,
      currentTask: '正在停止...'
    }));
  }, []);

  const handleSettingsChange = useCallback((url: string, concurrency: number) => {
    if (!projectData) return;
    setProjectData({
      ...projectData,
      serverUrl: url,
      concurrency: concurrency
    });
  }, [projectData]);

  const handleExport = useCallback(async () => {
    if (!api || !currentProject) return;
    const result = await api.export_project(currentProject);
    if (result.success) {
      alert(`导出成功!\n路径: ${result.path}`);
    } else {
      alert(`导出失败: ${result.error}`);
    }
  }, [api, currentProject]);

  // 计算是否可以导出：所有任务都已完成
  const canExport = tasks.length > 0 && tasks.every(t => t.status === 'completed');

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <ProjectListPage
        projects={projects}
        onSelectProject={selectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />
    );
  }

  if (view === 'workspace' && currentProject && projectData) {
    return (
      <Workspace
        projectName={currentProject}
        serverUrl={projectData.serverUrl}
        concurrency={projectData.concurrency || 5}
        roles={projectData.roles || []}
        roleConfigs={projectData.roleConfigs || {}}
        tasks={tasks}
        referenceDirectory={referenceDirectory}
        referenceAudios={referenceAudios}
        favorites={favorites}
        recentUsed={recentUsed}
        batchProgress={batchProgress}
        onBack={handleBackToList}
        onRenameProject={handleRenameProject}
        onParseText={handleParseText}
        onImportFile={handleImportFile}
        onSettingsChange={handleSettingsChange}
        onSelectReferenceDir={handleSelectReferenceDir}
        onSetRoleAudio={handleSetRoleAudio}
        onSetRoleSpeed={handleSetRoleSpeed}
        onToggleFavorite={handleToggleFavorite}
        onSetNote={handleSetNote}
        onGenerate={handleGenerate}
        onBatchGenerate={handleBatchGenerate}
        onStopGenerate={handleStopGenerate}
        onExport={handleExport}
        canExport={canExport}
        playingAudio={playingAudio}
        onPlayAudio={handlePlayAudio}
      />
    );
  }

  return null;
}

export default App;
