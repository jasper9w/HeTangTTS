import http.client
import json
import os
import csv
import threading
from pathlib import Path
from queue import Queue
from typing import Callable, Optional
from loguru import logger

# API 配置
API_KEY = "sk-uXZW4Tnvm1i3LPFt9TUF6d3WK0NLTMdfDQrZEhq2QRtReSTs"
API_HOST = "api.shaohua.fun"

# 线程锁用于CSV写操作
csv_lock = threading.Lock()


def get_connection() -> http.client.HTTPSConnection:
    """创建新的HTTP连接"""
    return http.client.HTTPSConnection(API_HOST)


def upload(file_path: str, conn: http.client.HTTPSConnection) -> str:
    """上传文件到API"""
    import mimetypes
    from codecs import encode

    dataList = []
    boundary = 'wL36Yn8afVp8Ag7AmP8qZ0SA4n1v9T'

    filename = os.path.basename(file_path)

    dataList.append(encode('--' + boundary))
    dataList.append(encode('Content-Disposition: form-data; name="file"; filename="{0}"'.format(filename)))

    fileType = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
    dataList.append(encode('Content-Type: {}'.format(fileType)))
    dataList.append(encode(''))

    with open(file_path, 'rb') as f:
        dataList.append(f.read())

    dataList.append(encode('--' + boundary + '--'))
    dataList.append(encode(''))
    body = b'\r\n'.join(dataList)
    payload = body
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-type': 'multipart/form-data; boundary={}'.format(boundary)
    }
    conn.request("POST", "/v1/files", payload, headers)
    res = conn.getresponse()
    data = res.read()

    raw_str = data.decode("utf-8")
    json_data = json.loads(raw_str)
    url = json_data['url']
    return url


def detect(audio_url: str, conn: http.client.HTTPSConnection) -> str:
    """分析音频特点"""
    payload = json.dumps({
        "model": "gemini-2.5-pro-preview-05-06",
        "stream": False,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """请分析这个音频的声音特点，并按以下格式输出结果：

【好听的名称】请为这个声音起一个2-6个字的好听的人名或昵称（可使用汉字、简洁创意的词汇）

【年龄段】
提取年龄段和性别

【声音类型】
判断最适用的用途：配音 或 解说

【声音特征】
列举3-8个声音特征标签，用竖线|分隔

【详细描述】
用150字左右精准描述这个声音的特点，包括：
1. 年龄段和性别特征
2. 音色质地（明亮/沙哑/圆润/尖细等）
3. 音调高低范围
4. 语速和节奏特点
5. 情感特质（活泼/温柔/深沉等）
6. 音量大小和力度特点
7. 适用场景

请严格按照这个格式输出。"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": audio_url
                        }
                    }
                ]
            }
        ],
        "max_tokens": 4000
    })
    headers = {
        'Accept': 'application/json',
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    conn.request("POST", "/v1/chat/completions", payload, headers)
    res = conn.getresponse()
    data = res.read()

    raw_str = data.decode("utf-8")
    json_data = json.loads(raw_str)

    result = json_data['choices'][0]['message']['content']
    return result


def parse_analysis(analysis_text: str) -> tuple[str, str, str, str, list[str], str]:
    """解析AI分析结果"""
    lines = analysis_text.split('\n')

    name = "未知"
    age = "未知"
    gender = "未知"
    voice_type = "配音"
    tags: list[str] = []
    description = analysis_text

    current_section: Optional[str] = None

    # 按段落解析
    for line in lines:
        line = line.strip()
        if not line:
            continue

        if '【好听的名称】' in line:
            current_section = 'name'
            name_text = line.replace('【好听的名称】', '').strip()
            if name_text and len(name_text) <= 6:
                name = name_text
        elif '【年龄段】' in line:
            current_section = 'age'
        elif '【声音类型】' in line:
            current_section = 'type'
        elif '【声音特征】' in line:
            current_section = 'tags'
        elif '【详细描述】' in line:
            current_section = 'description'
        elif current_section == 'name' and not line.startswith('【'):
            if len(line) <= 6 and line and ':' not in line:
                name = line
        elif current_section == 'age' and not line.startswith('【'):
            if '女' in line or '女孩' in line:
                gender = "女"
            elif '男' in line or '男孩' in line:
                gender = "男"

            if '5' in line and '7' in line:
                age = "5-7岁"
            elif '8' in line and '12' in line:
                age = "8-12岁"
            elif '13' in line and '18' in line:
                age = "13-18岁"
            elif '18' in line and '25' in line:
                age = "18-25岁"
            elif '25' in line and '35' in line:
                age = "25-35岁"
            elif '35' in line and '50' in line:
                age = "35-50岁"
            elif '50' in line:
                age = "50岁+"
        elif current_section == 'type' and not line.startswith('【'):
            if '解说' in line:
                voice_type = "解说"
            elif '配音' in line:
                voice_type = "配音"
        elif current_section == 'tags' and not line.startswith('【'):
            if '|' in line:
                tag_list = [t.strip() for t in line.split('|') if t.strip()]
                tags.extend(tag_list)
            elif line and ':' not in line:
                tags.append(line)
        elif current_section == 'description' and not line.startswith('【'):
            if line:
                description = line

    if len(tags) < 3:
        tag_keywords = ['明亮', '沙哑', '圆润', '尖细', '活泼', '温柔', '深沉', '清脆', '沙沙',
                        '成熟', '稚嫩', '柔和', '有力', '高亢', '低沉', '快速', '缓慢', '标准',
                        '方言', '口音', '甜美', '冷漠', '热情', '平静', '性感', '呆萌', '沧桑',
                        '磁性', '爽朗', '文艺', '知性', '俏皮', '浑厚', '轻柔']

        for keyword in tag_keywords:
            if keyword in analysis_text:
                tags.append(keyword)

        if len(tags) < 3:
            default_tags = ['参考音', '清晰', '自然']
            tags.extend(default_tags[:3 - len(tags)])

    tags = tags[:8]

    return name, age, gender, voice_type, tags, description


def find_audio_files(base_dir: str) -> list[str]:
    """递归查找所有音频文件"""
    audio_extensions = ['.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg']
    audio_files: list[str] = []

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in audio_extensions:
                audio_files.append(os.path.join(root, file))

    return audio_files


class AudioAnalyzer:
    """音频分析器"""

    def __init__(self):
        self.is_running = False
        self.should_stop = False
        self.results: list[dict] = []
        self.progress_callback: Optional[Callable[[dict], None]] = None
        self.base_dir: str = ""
        self.csv_file: str = ""

    def set_progress_callback(self, callback: Callable[[dict], None]):
        """设置进度回调函数"""
        self.progress_callback = callback

    def notify_progress(self, data: dict):
        """通知进度更新"""
        if self.progress_callback:
            self.progress_callback(data)

    def init_csv(self, csv_path: str):
        """初始化CSV文件"""
        self.csv_file = csv_path
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['名称', '相对路径', '年龄', '性别', '类型', '标签', '描述'])

    def save_to_csv(self, name: str, relative_path: str, age: str, gender: str,
                    voice_type: str, tags: list[str], description: str):
        """保存单条记录到CSV"""
        with csv_lock:
            with open(self.csv_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                tags_str = '|'.join(tags)
                writer.writerow([name, relative_path, age, gender, voice_type, tags_str, description])
                f.flush()

    def process_single_file(self, file_path: str, index: int, total: int) -> Optional[dict]:
        """处理单个音频文件"""
        if self.should_stop:
            return None

        try:
            conn = get_connection()
            relative_path = os.path.relpath(file_path, self.base_dir)

            logger.info(f"Processing: {relative_path}")
            self.notify_progress({
                'type': 'processing',
                'file': relative_path,
                'current': index + 1,
                'total': total
            })

            # 上传文件
            audio_url = upload(file_path, conn)
            logger.info(f"Uploaded: {relative_path}")

            if self.should_stop:
                conn.close()
                return None

            # 分析音频
            analysis = detect(audio_url, conn)
            logger.info(f"Analyzed: {relative_path}")

            # 解析结果
            name, age, gender, voice_type, tags, description = parse_analysis(analysis)

            # 保存到CSV
            self.save_to_csv(name, relative_path, age, gender, voice_type, tags, description)

            result = {
                'name': name,
                'path': relative_path,
                'age': age,
                'gender': gender,
                'type': voice_type,
                'tags': tags,
                'description': description
            }

            self.notify_progress({
                'type': 'completed',
                'file': relative_path,
                'current': index + 1,
                'total': total,
                'result': result
            })

            conn.close()
            return result

        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")
            self.notify_progress({
                'type': 'error',
                'file': os.path.relpath(file_path, self.base_dir),
                'current': index + 1,
                'total': total,
                'error': str(e)
            })
            return None

    def start_analysis(self, base_dir: str, csv_path: str, num_workers: int = 5):
        """开始分析"""
        self.is_running = True
        self.should_stop = False
        self.results = []
        self.base_dir = base_dir

        # 初始化CSV
        self.init_csv(csv_path)

        # 查找音频文件
        audio_files = find_audio_files(base_dir)
        total = len(audio_files)

        logger.info(f"Found {total} audio files")
        self.notify_progress({
            'type': 'start',
            'total': total
        })

        if not audio_files:
            self.notify_progress({
                'type': 'finish',
                'total': 0,
                'success': 0
            })
            self.is_running = False
            return

        # 创建任务队列
        queue: Queue = Queue()
        results_lock = threading.Lock()

        def worker():
            while True:
                item = queue.get()
                if item is None:
                    break
                index, file_path = item
                result = self.process_single_file(file_path, index, total)
                if result:
                    with results_lock:
                        self.results.append(result)
                queue.task_done()

        # 启动工作线程
        threads = []
        for _ in range(num_workers):
            thread = threading.Thread(target=worker)
            thread.start()
            threads.append(thread)

        # 添加任务到队列
        for index, file_path in enumerate(audio_files):
            if self.should_stop:
                break
            queue.put((index, file_path))

        # 等待所有任务完成
        queue.join()

        # 停止工作线程
        for _ in range(num_workers):
            queue.put(None)

        for thread in threads:
            thread.join()

        self.notify_progress({
            'type': 'finish',
            'total': total,
            'success': len(self.results)
        })

        self.is_running = False
        logger.info(f"Analysis completed. {len(self.results)}/{total} files processed successfully")

    def stop_analysis(self):
        """停止分析"""
        self.should_stop = True
        logger.info("Stopping analysis...")

    def get_results(self) -> list[dict]:
        """获取分析结果"""
        return self.results
