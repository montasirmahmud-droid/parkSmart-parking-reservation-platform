from datetime import datetime
from typing import Dict

from models.parking_record import ParkingRecord
from services.logger import ActivityLogger
from services.overstay import calculate_overstay_penalty


class ParkingSystem:
    def __init__(self, hourly_rate: float = 50.0):
        self.records: Dict[str, ParkingRecord] = {}
        self.hourly_rate = hourly_rate
        self.logger = ActivityLogger()

    def vehicle_entry(self, vehicle_id: str, reserved_hours: float) -> None:
        record = ParkingRecord(vehicle_id, reserved_hours)
        record.entry_time = datetime.now()
        self.records[vehicle_id] = record
        self.logger.log(f"ENTRY: Vehicle {vehicle_id}")

    def vehicle_exit(self, vehicle_id: str) -> float:
        if vehicle_id not in self.records:
            raise ValueError("Vehicle not found")

        record = self.records[vehicle_id]
        record.exit_time = datetime.now()

        duration = record.exit_time - record.entry_time
        hours = duration.total_seconds() / 3600

        base_fee = hours * self.hourly_rate
        penalty = calculate_overstay_penalty(record, hours)

        total_fee = base_fee + penalty

        self.logger.log(
            f"EXIT: Vehicle {vehicle_id} | Duration: {hours:.2f} hrs | Fee: {total_fee:.2f}"
        )

        return total_fee
