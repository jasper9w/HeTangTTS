import json
from pathlib import Path
from typing import Optional
from loguru import logger


class GlobalConfig:
    """全局配置管理"""

    def __init__(self, config_dir: Optional[Path] = None):
        if config_dir is None:
            self.config_dir = Path.home() / ".config" / "hetang_dubbing"
        else:
            self.config_dir = Path(config_dir)

        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.config_file = self.config_dir / "config.json"
        self.config = self._load_config()

    def _load_config(self) -> dict:
        """加载配置"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load config: {e}")
                return self._default_config()
        return self._default_config()

    def _default_config(self) -> dict:
        """默认配置"""
        return {
            'favorites': [],  # 收藏的参考音
            'recent_used': [],  # 最近使用的参考音
            'audio_notes': {},  # 参考音备注 {path: note}
            'audio_tags': {}  # 参考音标签 {path: [tags]}
        }

    def _save_config(self):
        """保存配置"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save config: {e}")

    def add_favorite(self, audio_path: str) -> bool:
        """添加收藏"""
        if audio_path not in self.config['favorites']:
            self.config['favorites'].append(audio_path)
            self._save_config()
            return True
        return False

    def remove_favorite(self, audio_path: str) -> bool:
        """移除收藏"""
        if audio_path in self.config['favorites']:
            self.config['favorites'].remove(audio_path)
            self._save_config()
            return True
        return False

    def is_favorite(self, audio_path: str) -> bool:
        """是否收藏"""
        return audio_path in self.config['favorites']

    def add_recent_used(self, audio_path: str):
        """添加最近使用"""
        if audio_path in self.config['recent_used']:
            self.config['recent_used'].remove(audio_path)
        self.config['recent_used'].insert(0, audio_path)
        # 只保留最近20个
        self.config['recent_used'] = self.config['recent_used'][:20]
        self._save_config()

    def get_recent_used(self) -> list[str]:
        """获取最近使用"""
        return self.config['recent_used']

    def get_favorites(self) -> list[str]:
        """获取收藏列表"""
        return self.config['favorites']

    def set_note(self, audio_path: str, note: str):
        """设置备注"""
        self.config['audio_notes'][audio_path] = note
        self._save_config()

    def get_note(self, audio_path: str) -> str:
        """获取备注"""
        return self.config['audio_notes'].get(audio_path, '')

    def set_tags(self, audio_path: str, tags: list[str]):
        """设置标签"""
        self.config['audio_tags'][audio_path] = tags
        self._save_config()

    def get_tags(self, audio_path: str) -> list[str]:
        """获取标签"""
        return self.config['audio_tags'].get(audio_path, [])

    def extract_tags_from_filename(self, filename: str) -> list[str]:
        """从文件名提取标签"""
        tags = []
        filename_lower = filename.lower()

        # 性别标签
        if any(k in filename_lower for k in ['男', 'male', 'man', 'boy']):
            tags.append('男')
        if any(k in filename_lower for k in ['女', 'female', 'woman', 'girl']):
            tags.append('女')

        # 年龄标签
        if any(k in filename_lower for k in ['儿童', 'child', 'kid', '小孩', '童']):
            tags.append('儿童')
        if any(k in filename_lower for k in ['老年', 'old', 'elder', '老人', '老']):
            tags.append('老年')
        if any(k in filename_lower for k in ['青年', 'young', '年轻']):
            tags.append('青年')
        if any(k in filename_lower for k in ['中年', 'middle']):
            tags.append('中年')

        # 音色标签
        if any(k in filename_lower for k in ['温柔', 'gentle', 'soft']):
            tags.append('温柔')
        if any(k in filename_lower for k in ['磁性', 'magnetic']):
            tags.append('磁性')
        if any(k in filename_lower for k in ['清脆', 'clear', 'crisp']):
            tags.append('清脆')
        if any(k in filename_lower for k in ['沙哑', 'hoarse']):
            tags.append('沙哑')
        if any(k in filename_lower for k in ['甜美', 'sweet']):
            tags.append('甜美')

        return tags
