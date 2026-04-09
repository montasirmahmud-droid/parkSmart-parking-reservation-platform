from typing import Dict
from models.parking_slot import ParkingSlot


class SlotService:
    def __init__(self):
        self.slots: Dict[str, ParkingSlot] = {}

    def add_slot(self, slot: ParkingSlot):
        self.slots[slot.slot_id] = slot

    def get_slot_info(self, slot_id: str):
        if slot_id not in self.slots:
            raise ValueError("Slot not found")

        slot = self.slots[slot_id]

        return {
            "slot_id": slot.slot_id,
            "location": slot.location,
            "vehicle_type": slot.vehicle_type,
            "availability": slot.is_available
        }

    def get_all_slots(self):
        return [self.get_slot_info(slot_id) for slot_id in self.slots]
