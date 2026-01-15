import os
import threading
import webview
from pathlib import Path
from typing import Optional
from loguru import logger

from backend.audio_service import AudioAnalyzer, find_audio_files
from backend.project_manager import ProjectManager
from backend.global_config import GlobalConfig
from backend.tts_service import TTSService


class Api:
    """暴露给前端的 API"""

    def __init__(self):
        self.analyzer = AudioAnalyzer()
        self.selected_directory: str = ""
        self.audio_files: list[str] = []
        self._window = None
        self._analysis_thread: Optional[threading.Thread] = None
        self.project_manager = ProjectManager()
        self.global_config = GlobalConfig()
        self.tts_service = TTSService()

    def set_window(self, window):
        """设置 window 引用（仅用于 evaluate_js）"""
        self._window = window

    def _notify_frontend(self, event: str, data: dict):
        """通知前端事件"""
        if self._window:
            import json
            js_data = json.dumps(data, ensure_ascii=False)
            self._window.evaluate_js(f'window.onBackendEvent && window.onBackendEvent("{event}", {js_data})')

    def select_directory(self) -> dict:
        """选择目录"""
        import webview
        result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            self.selected_directory = result[0]
            logger.info(f"Selected directory: {self.selected_directory}")
            return {'success': True, 'path': self.selected_directory}
        return {'success': False, 'path': ''}

    def scan_audio_files(self, directory: str = "") -> dict:
        """扫描音频文件"""
        target_dir = directory or self.selected_directory
        if not target_dir:
            return {'success': False, 'files': [], 'error': 'No directory selected'}

        if not os.path.isdir(target_dir):
            return {'success': False, 'files': [], 'error': 'Directory does not exist'}

        self.audio_files = find_audio_files(target_dir)
        self.selected_directory = target_dir

        file_list = []
        for f in self.audio_files:
            rel_path = os.path.relpath(f, target_dir)
            file_list.append({
                'path': rel_path,
                'fullPath': f,
                'name': os.path.basename(f),
                'size': os.path.getsize(f)
            })

        logger.info(f"Found {len(file_list)} audio files in {target_dir}")
        return {'success': True, 'files': file_list, 'directory': target_dir}

    def start_analysis(self, output_dir: str = "") -> dict:
        """开始分析"""
        if self.analyzer.is_running:
            return {'success': False, 'error': 'Analysis is already running'}

        if not self.selected_directory:
            return {'success': False, 'error': 'No directory selected'}

        if not self.audio_files:
            return {'success': False, 'error': 'No audio files found'}

        # 设置输出目录
        if not output_dir:
            output_dir = os.path.expanduser("~/Documents/AudioAnalysis")

        os.makedirs(output_dir, exist_ok=True)

        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_path = os.path.join(output_dir, f"voice_analysis_{timestamp}.csv")

        # 设置进度回调
        def on_progress(data: dict):
            self._notify_frontend('progress', data)

        self.analyzer.set_progress_callback(on_progress)

        # 在后台线程中运行分析
        def run_analysis():
            self.analyzer.start_analysis(self.selected_directory, csv_path, num_workers=5)

        self._analysis_thread = threading.Thread(target=run_analysis)
        self._analysis_thread.start()

        logger.info(f"Analysis started, output to: {csv_path}")
        return {'success': True, 'csvPath': csv_path}

    def stop_analysis(self) -> dict:
        """停止分析"""
        if not self.analyzer.is_running:
            return {'success': False, 'error': 'No analysis is running'}

        self.analyzer.stop_analysis()
        logger.info("Analysis stop requested")
        return {'success': True}

    def get_results(self) -> dict:
        """获取分析结果"""
        results = self.analyzer.get_results()
        return {'success': True, 'results': results}

    def get_status(self) -> dict:
        """获取当前状态"""
        return {
            'isRunning': self.analyzer.is_running,
            'selectedDirectory': self.selected_directory,
            'fileCount': len(self.audio_files),
            'resultCount': len(self.analyzer.get_results())
        }

    def export_csv(self, output_path: str = "") -> dict:
        """导出CSV"""
        if not output_path:
            import webview
            result = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename='voice_analysis.csv',
                file_types=('CSV Files (*.csv)',)
            )
            if result:
                output_path = result
            else:
                return {'success': False, 'error': 'No output path selected'}

        results = self.analyzer.get_results()
        if not results:
            return {'success': False, 'error': 'No results to export'}

        import csv
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['名称', '相对路径', '年龄', '性别', '类型', '标签', '描述'])
            for r in results:
                tags_str = '|'.join(r.get('tags', []))
                writer.writerow([
                    r.get('name', ''),
                    r.get('path', ''),
                    r.get('age', ''),
                    r.get('gender', ''),
                    r.get('type', ''),
                    tags_str,
                    r.get('description', '')
                ])

        logger.info(f"Exported {len(results)} results to {output_path}")
        return {'success': True, 'path': output_path, 'count': len(results)}

    def select_reference_directory(self) -> dict:
        """选择参考音目录"""
        import webview
        result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
        if result and len(result) > 0:
            ref_dir = result[0]
            logger.info(f"Selected reference directory: {ref_dir}")
            return {'success': True, 'path': ref_dir}
        return {'success': False, 'path': ''}

    def scan_reference_audio(self, directory: str, max_depth: int = 3, max_size_kb: int = 1024) -> dict:
        """扫描参考音文件（递归指定层数，限制文件大小）"""
        if not directory:
            return {'success': False, 'files': [], 'error': 'No directory specified'}

        if not os.path.isdir(directory):
            return {'success': False, 'files': [], 'error': 'Directory does not exist'}

        audio_extensions = {'.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg'}
        max_size_bytes = max_size_kb * 1024
        ref_files: list[dict] = []

        def scan_dir(current_dir: str, current_depth: int):
            if current_depth > max_depth:
                return
            try:
                for entry in os.scandir(current_dir):
                    if entry.is_file():
                        ext = os.path.splitext(entry.name)[1].lower()
                        if ext in audio_extensions:
                            try:
                                size = entry.stat().st_size
                                if size <= max_size_bytes:
                                    rel_path = os.path.relpath(entry.path, directory)
                                    ref_files.append({
                                        'path': rel_path,
                                        'fullPath': entry.path,
                                        'name': entry.name,
                                        'size': size
                                    })
                            except OSError:
                                pass
                    elif entry.is_dir() and not entry.name.startswith('.'):
                        scan_dir(entry.path, current_depth + 1)
            except PermissionError:
                pass

        scan_dir(directory, 1)
        logger.info(f"Found {len(ref_files)} reference audio files in {directory}")
        return {'success': True, 'files': ref_files, 'directory': directory}

    def parse_text_content(self, text: str, delimiter: str = "|") -> dict:
        """解析粘贴的文本内容"""
        if not text.strip():
            return {'success': False, 'lines': [], 'error': 'Empty text'}

        lines = text.strip().split('\n')
        parsed_lines: list[dict] = []
        roles: set[str] = set()

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            parts = line.split(delimiter)
            role = parts[0].strip() if len(parts) > 0 else ""
            content = parts[1].strip() if len(parts) > 1 else line
            if role:
                roles.add(role)
            parsed_lines.append({
                'index': i,
                'role': role,
                'content': content,
                'raw': line
            })

        logger.info(f"Parsed {len(parsed_lines)} lines, found {len(roles)} roles")
        return {
            'success': True,
            'lines': parsed_lines,
            'roles': list(roles),
            'count': len(parsed_lines)
        }

    def list_projects(self) -> dict:
        """列出所有项目"""
        projects = self.project_manager.list_projects()
        return {'success': True, 'projects': projects}

    def create_project(self, name: str = "未命名") -> dict:
        """创建新项目"""
        return self.project_manager.create_project(name)

    def load_project(self, name: str) -> dict:
        """加载项目"""
        return self.project_manager.load_project(name)

    def save_project(self, name: str, data: dict) -> dict:
        """保存项目"""
        return self.project_manager.save_project(name, data)

    def rename_project(self, old_name: str, new_name: str) -> dict:
        """重命名项目"""
        return self.project_manager.rename_project(old_name, new_name)

    def delete_project(self, name: str) -> dict:
        """删除项目"""
        return self.project_manager.delete_project(name)

    def get_project_output_dir(self, name: str) -> dict:
        """获取项目输出目录"""
        output_dir = self.project_manager.get_output_dir(name)
        return {'success': True, 'path': str(output_dir)}

    def generate_audio(self, project_name: str, line_index: int, role: str,
                      content: str, reference_audio: str, speed: float,
                      server_url: str) -> dict:
        """生成单条配音"""
        try:
            output_dir = self.project_manager.get_output_dir(project_name)
            output_file = output_dir / f"{line_index:04d}_{role}.wav"

            logger.info(f"开始生成配音: {output_file}")
            logger.info(f"  角色: {role}, 语速: {speed}x")
            logger.info(f"  参考音: {reference_audio}")
            logger.info(f"  内容: {content[:50]}...")
            logger.info(f"  服务器: {server_url}")

            # 调用 TTS 服务生成配音
            result = self.tts_service.generate(
                server_url=server_url,
                text=content,
                spk_audio_file=reference_audio,
                output_file=str(output_file),
                speed=speed,
                emo_control_method=0,
                emo_weight=1.0,
                emo_random=False
            )

            if result["success"]:
                logger.info(f"配音生成成功: {output_file}")
                return {
                    'success': True,
                    'output': str(output_file),
                    'line_index': line_index
                }
            else:
                logger.error(f"配音生成失败: {result.get('error', '未知错误')}")
                return {
                    'success': False,
                    'error': result.get('error', '配音生成失败'),
                    'line_index': line_index
                }

        except Exception as e:
            error_msg = f"配音生成异常: {str(e)}"
            logger.exception(error_msg)
            return {
                'success': False,
                'error': error_msg,
                'line_index': line_index
            }

    def add_favorite(self, audio_path: str) -> dict:
        """添加收藏"""
        success = self.global_config.add_favorite(audio_path)
        return {'success': success}

    def remove_favorite(self, audio_path: str) -> dict:
        """移除收藏"""
        success = self.global_config.remove_favorite(audio_path)
        return {'success': success}

    def get_favorites(self) -> dict:
        """获取收藏列表"""
        favorites = self.global_config.get_favorites()
        return {'success': True, 'favorites': favorites}

    def get_recent_used(self) -> dict:
        """获取最近使用"""
        recent = self.global_config.get_recent_used()
        return {'success': True, 'recent': recent}

    def add_recent_used(self, audio_path: str) -> dict:
        """添加最近使用"""
        self.global_config.add_recent_used(audio_path)
        return {'success': True}

    def set_audio_note(self, audio_path: str, note: str) -> dict:
        """设置音频备注"""
        self.global_config.set_note(audio_path, note)
        return {'success': True}

    def get_audio_note(self, audio_path: str) -> dict:
        """获取音频备注"""
        note = self.global_config.get_note(audio_path)
        return {'success': True, 'note': note}

    def set_audio_tags(self, audio_path: str, tags: list[str]) -> dict:
        """设置音频标签"""
        self.global_config.set_tags(audio_path, tags)
        return {'success': True}

    def get_audio_tags(self, audio_path: str) -> dict:
        """获取音频标签"""
        tags = self.global_config.get_tags(audio_path)
        return {'success': True, 'tags': tags}

    def extract_audio_tags(self, filename: str) -> dict:
        """从文件名提取标签"""
        tags = self.global_config.extract_tags_from_filename(filename)
        return {'success': True, 'tags': tags}

    def scan_reference_audio_with_tags(self, directory: str, max_depth: int = 3, max_size_kb: int = 1024) -> dict:
        """扫描参考音并自动提取标签"""
        scan_result = self.scan_reference_audio(directory, max_depth, max_size_kb)
        if not scan_result['success']:
            return scan_result

        # 为每个音频文件添加标签和备注信息
        files_with_meta = []
        for file in scan_result['files']:
            # 获取或生成标签
            existing_tags = self.global_config.get_tags(file['fullPath'])
            if not existing_tags:
                # 自动提取标签
                auto_tags = self.global_config.extract_tags_from_filename(file['name'])
                if auto_tags:
                    self.global_config.set_tags(file['fullPath'], auto_tags)
                    existing_tags = auto_tags

            files_with_meta.append({
                **file,
                'tags': existing_tags,
                'note': self.global_config.get_note(file['fullPath']),
                'isFavorite': self.global_config.is_favorite(file['fullPath'])
            })

        return {
            'success': True,
            'files': files_with_meta,
            'directory': scan_result['directory']
        }

    def get_audio_data_url(self, audio_path: str) -> dict:
        """获取音频文件的 data URL（用于前端播放）"""
        import base64
        import mimetypes

        if not os.path.exists(audio_path):
            return {'success': False, 'error': 'File not found'}

        try:
            with open(audio_path, 'rb') as f:
                audio_data = f.read()

            # 获取 MIME 类型
            mime_type, _ = mimetypes.guess_type(audio_path)
            if not mime_type:
                mime_type = 'audio/mpeg'

            # 转换为 base64
            base64_data = base64.b64encode(audio_data).decode('utf-8')
            data_url = f"data:{mime_type};base64,{base64_data}"

            return {
                'success': True,
                'dataUrl': data_url,
                'mimeType': mime_type,
                'size': len(audio_data)
            }
        except Exception as e:
            logger.error(f"Failed to read audio file: {e}")
            return {'success': False, 'error': str(e)}

    def export_project(self, project_name: str) -> dict:
        """导出项目：合并音频并生成SRT字幕"""
        import shutil
        from pydub import AudioSegment

        try:
            # 加载项目数据
            project_result = self.load_project(project_name)
            if not project_result['success']:
                return {'success': False, 'error': 'Failed to load project'}

            project_data = project_result['data']
            tasks = project_data.get('tasks', [])

            if not tasks:
                return {'success': False, 'error': 'No tasks in project'}

            # 检查是否所有任务都已完成
            incomplete = [t for t in tasks if t.get('status') != 'completed']
            if incomplete:
                return {'success': False, 'error': f'There are {len(incomplete)} incomplete tasks'}

            # 选择导出目录
            result = self._window.create_file_dialog(
                webview.FOLDER_DIALOG,
                directory=str(Path.home() / 'Documents')
            )

            if not result or not result[0]:
                return {'success': False, 'error': 'Export cancelled'}

            export_dir = Path(result[0])
            export_name = f"{project_name}_export"
            export_path = export_dir / export_name
            export_path.mkdir(parents=True, exist_ok=True)

            logger.info(f"Exporting project to: {export_path}")

            # 按顺序合并音频并生成SRT
            combined_audio = AudioSegment.empty()
            srt_content = []
            current_time_ms = 0

            for i, task in enumerate(sorted(tasks, key=lambda t: t.get('index', 0))):
                output_file = task.get('outputFile')
                if not output_file or not os.path.exists(output_file):
                    logger.warning(f"Audio file not found: {output_file}")
                    continue

                # 加载音频
                audio = AudioSegment.from_file(output_file)
                duration_ms = len(audio)

                # 添加到合并音频
                combined_audio += audio

                # 生成SRT条目
                start_time = self._format_srt_time(current_time_ms)
                end_time = self._format_srt_time(current_time_ms + duration_ms)
                srt_content.append(f"{i + 1}")
                srt_content.append(f"{start_time} --> {end_time}")
                srt_content.append(task.get('content', ''))
                srt_content.append('')

                current_time_ms += duration_ms

            # 保存合并的音频
            output_audio_path = export_path / f"{project_name}.wav"
            combined_audio.export(str(output_audio_path), format="wav")
            logger.info(f"Exported audio: {output_audio_path}")

            # 保存SRT字幕
            output_srt_path = export_path / f"{project_name}.srt"
            with open(output_srt_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(srt_content))
            logger.info(f"Exported SRT: {output_srt_path}")

            return {
                'success': True,
                'path': str(export_path)
            }

        except Exception as e:
            logger.exception(f"Export failed: {e}")
            return {'success': False, 'error': str(e)}

    def _format_srt_time(self, ms: int) -> str:
        """格式化毫秒为SRT时间格式 (HH:MM:SS,mmm)"""
        hours = ms // 3600000
        minutes = (ms % 3600000) // 60000
        seconds = (ms % 60000) // 1000
        milliseconds = ms % 1000
        return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


