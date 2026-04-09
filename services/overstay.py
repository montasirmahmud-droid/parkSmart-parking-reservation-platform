from models.parking_record import ParkingRecord


def calculate_overstay_penalty(record: ParkingRecord, actual_hours: float, penalty_rate: float = 100.0) -> float:
    if actual_hours > record.reserved_hours:
        extra_hours = actual_hours - record.reserved_hours
        return extra_hours * penalty_rate
    return 0.0
