import os
import json
import shutil
from pathlib import Path
from typing import Optional
from loguru import logger


class ProjectManager:
    """项目管理器"""

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            desktop = Path.home() / "Desktop"
            self.base_dir = desktop / "荷塘配音"
        else:
            self.base_dir = Path(base_dir)

        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Project base directory: {self.base_dir}")

    def list_projects(self) -> list[dict]:
        """列出所有项目"""
        projects: list[dict] = []
        for json_file in self.base_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    projects.append({
                        'name': json_file.stem,
                        'path': str(json_file),
                        'data': data
                    })
            except Exception as e:
                logger.error(f"Failed to load project {json_file}: {e}")
        return projects

    def create_project(self, name: str) -> dict:
        """创建新项目"""
        # 避免重名
        original_name = name
        counter = 1
        while (self.base_dir / f"{name}.json").exists():
            name = f"{original_name}_{counter}"
            counter += 1

        project_file = self.base_dir / f"{name}.json"
        output_dir = self.base_dir / name

        # 创建输出目录
        output_dir.mkdir(parents=True, exist_ok=True)

        # 创建项目文件
        project_data = {
            'name': name,
            'created_at': str(Path(project_file).stat().st_ctime if project_file.exists() else 0),
            'lines': [],
            'roles': [],
            'roleConfigs': {},
            'serverUrl': 'https://api.shaohua.fun',
            'delimiter': '|'
        }

        with open(project_file, 'w', encoding='utf-8') as f:
            json.dump(project_data, f, ensure_ascii=False, indent=2)

        logger.info(f"Created project: {name}")
        return {'success': True, 'name': name, 'path': str(project_file)}

    def load_project(self, name: str) -> dict:
        """加载项目"""
        project_file = self.base_dir / f"{name}.json"
        if not project_file.exists():
            return {'success': False, 'error': 'Project not found'}

        try:
            with open(project_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"Loaded project: {name}")
            return {'success': True, 'data': data}
        except Exception as e:
            logger.error(f"Failed to load project {name}: {e}")
            return {'success': False, 'error': str(e)}

    def save_project(self, name: str, data: dict) -> dict:
        """保存项目"""
        project_file = self.base_dir / f"{name}.json"

        try:
            with open(project_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"Saved project: {name}")
            return {'success': True}
        except Exception as e:
            logger.error(f"Failed to save project {name}: {e}")
            return {'success': False, 'error': str(e)}

    def rename_project(self, old_name: str, new_name: str) -> dict:
        """重命名项目"""
        old_file = self.base_dir / f"{old_name}.json"
        new_file = self.base_dir / f"{new_name}.json"
        old_dir = self.base_dir / old_name
        new_dir = self.base_dir / new_name

        if not old_file.exists():
            return {'success': False, 'error': 'Project not found'}

        if new_file.exists():
            return {'success': False, 'error': 'Project name already exists'}

        try:
            # 重命名文件
            old_file.rename(new_file)

            # 重命名目录
            if old_dir.exists():
                old_dir.rename(new_dir)

            # 更新项目数据中的名称
            with open(new_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            data['name'] = new_name
            with open(new_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            logger.info(f"Renamed project: {old_name} -> {new_name}")
            return {'success': True, 'name': new_name}
        except Exception as e:
            logger.error(f"Failed to rename project {old_name}: {e}")
            return {'success': False, 'error': str(e)}

    def delete_project(self, name: str) -> dict:
        """删除项目"""
        project_file = self.base_dir / f"{name}.json"
        output_dir = self.base_dir / name

        if not project_file.exists():
            return {'success': False, 'error': 'Project not found'}

        try:
            # 删除项目文件
            project_file.unlink()

            # 删除输出目录
            if output_dir.exists():
                shutil.rmtree(output_dir)

            logger.info(f"Deleted project: {name}")
            return {'success': True}
        except Exception as e:
            logger.error(f"Failed to delete project {name}: {e}")
            return {'success': False, 'error': str(e)}

    def get_output_dir(self, name: str) -> Path:
        """获取项目输出目录"""
        return self.base_dir / name
