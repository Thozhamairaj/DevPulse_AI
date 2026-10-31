import json
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from backend.app.models.schemas import Project, Task, QABug

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "projects.json"

class ProjectService:
    def __init__(self, data_path: Path = DATA_PATH):
        self.data_path = data_path
        self._cache: Dict[str, Project] = {}
        self.reload_data()

    def reload_data(self) -> None:
        """Loads seeded projects from JSON file."""
        if not self.data_path.exists():
            raise FileNotFoundError(f"Project data file not found at {self.data_path}")
        with open(self.data_path, "r", encoding="utf-8") as f:
            raw_projects = json.load(f)
            self._cache = {
                proj["id"]: Project(**proj) for proj in raw_projects
            }

    def list_projects(self) -> List[Project]:
        """Returns list of all available projects."""
        return list(self._cache.values())

    def get_project(self, project_id: str) -> Optional[Project]:
        """Returns a project by ID or None."""
        return self._cache.get(project_id)

    def get_tasks(self, project_id: str) -> List[Task]:
        """Returns all tasks for a project."""
        project = self.get_project(project_id)
        return project.tasks if project else []

    def get_task(self, project_id: str, task_id: str) -> Optional[Task]:
        """Returns a specific task by ID."""
        for t in self.get_tasks(project_id):
            if t.id == task_id:
                return t
        return None

    def get_qa_bugs(self, project_id: str) -> List[QABug]:
        """Returns all QA bugs for a project."""
        project = self.get_project(project_id)
        return project.qa_bugs if project else []

    # --- Date Utility Helpers ---
    @staticmethod
    def parse_date(date_str: str) -> date:
        return datetime.strptime(date_str, "%Y-%m-%d").date()

    @staticmethod
    def format_date(d: date) -> str:
        return d.strftime("%Y-%m-%d")

    @classmethod
    def days_between(cls, date_str_1: str, date_str_2: str) -> int:
        d1 = cls.parse_date(date_str_1)
        d2 = cls.parse_date(date_str_2)
        return (d2 - d1).days

    @classmethod
    def add_days(cls, date_str: str, days: int) -> str:
        d = cls.parse_date(date_str)
        return cls.format_date(d + timedelta(days=days))

# Global singleton
project_service = ProjectService()

