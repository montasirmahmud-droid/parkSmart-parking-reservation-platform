from datetime import datetime
from typing import Dict

from models.parking_record import ParkingRecord
from services.logger import ActivityLogger
from services.overstay import calculate_overstay_penalty
from services.slot_service import SlotService
from services.recommendation import RecommendationService


class ParkingSystem:
    def __init__(self, hourly_rate: float = 50.0):
        self.records: Dict[str, ParkingRecord] = {}
        self.hourly_rate = hourly_rate
        self.logger = ActivityLogger()

        self.slot_service = SlotService()
        self.recommendation_service = RecommendationService()

    def vehicle_entry(self, vehicle_id: str, reserved_hours: float, user_id: str, slot_id: str) -> None:
        record = ParkingRecord(vehicle_id, reserved_hours)
        record.entry_time = datetime.now()
        record.slot_id = slot_id
        record.user_id = user_id

        self.records[vehicle_id] = record

        self.recommendation_service.record_usage(user_id, slot_id)

        self.logger.log(f"ENTRY: Vehicle {vehicle_id} in slot {slot_id}")

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
            f"EXIT: Vehicle {vehicle_id} | Fee: {total_fee:.2f}"
        )

        return total_fee

    # Feature 19: Extend Reservation
    def extend_reservation(self, vehicle_id: str, extra_hours: float):
        if vehicle_id not in self.records:
            raise ValueError("Vehicle not found")

        record = self.records[vehicle_id]
        record.reserved_hours += extra_hours

        self.logger.log(
            f"EXTEND: Vehicle {vehicle_id} extended by {extra_hours} hours"
        )

    # Feature 20: Recommendation
    def get_recommendations(self, user_id: str):
        return self.recommendation_service.get_frequent_slots(user_id)
