class ParkingSlot:
    def __init__(self, slot_id: str, location: str, vehicle_type: str):
        self.slot_id = slot_id
        self.location = location
        self.vehicle_type = vehicle_type
        self.is_available = True

    def occupy(self):
        self.is_available = False

    def release(self):
        self.is_available = True
