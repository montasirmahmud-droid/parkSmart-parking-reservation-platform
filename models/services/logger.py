from datetime import datetime
from typing import List


class ActivityLogger:
    def __init__(self):
        self.logs: List[str] = []

    def log(self, message: str) -> None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"{timestamp} - {message}"
        self.logs.append(entry)

    def get_logs(self) -> List[str]:
        return self.logs

    def clear_logs(self) -> None:
        self.logs.clear()
