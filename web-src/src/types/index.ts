export interface AudioFile {
  path: string;
  fullPath: string;
  name: string;
  size: number;
  tags?: string[];
  note?: string;
  isFavorite?: boolean;
}

export interface AnalysisResult {
  name: string;
  path: string;
  age: string;
  gender: string;
  type: string;
  tags: string[];
  description: string;
}

export interface ParsedLine {
  index: number;
  role: string;
  content: string;
  raw: string;
}

export interface RoleConfig {
  role: string;
  referenceAudio: AudioFile | null;
  speed: number;
}

export interface DubbingTask {
  index: number;
  role: string;
  content: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  outputFile?: string;
  error?: string;
}

export interface Project {
  name: string;
  created_at: string;
  lines: ParsedLine[];
  roles: string[];
  roleConfigs: Record<string, RoleConfig>;
  serverUrl: string;
  concurrency: number;
  delimiter: string;
  referenceDirectory?: string;
  tasks?: DubbingTask[];
}

export interface ProgressEvent {
  type: 'start' | 'processing' | 'completed' | 'error' | 'finish';
  file?: string;
  current?: number;
  total?: number;
  result?: AnalysisResult;
  error?: string;
  success?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

export interface SelectDirectoryResponse extends ApiResponse {
  path: string;
}

export interface ScanFilesResponse extends ApiResponse {
  files: AudioFile[];
  directory: string;
}

export interface StartAnalysisResponse extends ApiResponse {
  csvPath: string;
}

export interface GetResultsResponse extends ApiResponse {
  results: AnalysisResult[];
}

export interface GetStatusResponse {
  isRunning: boolean;
  selectedDirectory: string;
  fileCount: number;
  resultCount: number;
}

export interface ExportCsvResponse extends ApiResponse {
  path: string;
  count: number;
}

export interface ScanReferenceResponse extends ApiResponse {
  files: AudioFile[];
  directory: string;
}

export interface ParseTextResponse extends ApiResponse {
  lines: ParsedLine[];
  roles: string[];
  count: number;
}

export interface ProjectListResponse extends ApiResponse {
  projects: Array<{
    name: string;
    path: string;
    data: Project;
  }>;
}

export interface ProjectResponse extends ApiResponse {
  name?: string;
  path?: string;
  data?: Project;
}

export interface GenerateAudioResponse extends ApiResponse {
  output: string;
  line_index: number;
}

export interface PyWebViewApi {
  select_directory(): Promise<SelectDirectoryResponse>;
  scan_audio_files(directory?: string): Promise<ScanFilesResponse>;
  start_analysis(output_dir?: string): Promise<StartAnalysisResponse>;
  stop_analysis(): Promise<ApiResponse>;
  get_results(): Promise<GetResultsResponse>;
  get_status(): Promise<GetStatusResponse>;
  export_csv(output_path?: string): Promise<ExportCsvResponse>;
  select_reference_directory(): Promise<SelectDirectoryResponse>;
  scan_reference_audio(directory: string, max_depth?: number, max_size_kb?: number): Promise<ScanReferenceResponse>;
  scan_reference_audio_with_tags(directory: string, max_depth?: number, max_size_kb?: number): Promise<ScanReferenceResponse>;
  parse_text_content(text: string, delimiter?: string): Promise<ParseTextResponse>;
  list_projects(): Promise<ProjectListResponse>;
  create_project(name?: string): Promise<ProjectResponse>;
  load_project(name: string): Promise<ProjectResponse>;
  save_project(name: string, data: Project): Promise<ApiResponse>;
  rename_project(old_name: string, new_name: string): Promise<ProjectResponse>;
  delete_project(name: string): Promise<ApiResponse>;
  get_project_output_dir(name: string): Promise<SelectDirectoryResponse>;
  generate_audio(project_name: string, line_index: number, role: string, content: string, reference_audio: string, speed: number, server_url: string): Promise<GenerateAudioResponse>;
  add_favorite(audio_path: string): Promise<ApiResponse>;
  remove_favorite(audio_path: string): Promise<ApiResponse>;
  get_favorites(): Promise<{ success: boolean; favorites: string[] }>;
  get_recent_used(): Promise<{ success: boolean; recent: string[] }>;
  add_recent_used(audio_path: string): Promise<ApiResponse>;
  set_audio_note(audio_path: string, note: string): Promise<ApiResponse>;
  get_audio_note(audio_path: string): Promise<{ success: boolean; note: string }>;
  set_audio_tags(audio_path: string, tags: string[]): Promise<ApiResponse>;
  get_audio_tags(audio_path: string): Promise<{ success: boolean; tags: string[] }>;
  extract_audio_tags(filename: string): Promise<{ success: boolean; tags: string[] }>;
  get_audio_data_url(audio_path: string): Promise<{ success: boolean; dataUrl?: string; mimeType?: string; size?: number; error?: string }>;
  export_project(project_name: string): Promise<{ success: boolean; path?: string; error?: string }>;
}

declare global {
  interface Window {
    pywebview?: {
      api: PyWebViewApi;
    };
    onBackendEvent?: (event: string, data: ProgressEvent) => void;
  }
}
