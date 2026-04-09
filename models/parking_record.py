from datetime import datetime


class ParkingRecord:
    def __init__(self, vehicle_id: str, reserved_hours: float):
        self.vehicle_id = vehicle_id
        self.entry_time: datetime | None = None
        self.exit_time: datetime | None = None
        self.reserved_hours = reserved_hours
