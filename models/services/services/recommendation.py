from collections import defaultdict


class RecommendationService:
    def __init__(self):
        self.usage = defaultdict(lambda: defaultdict(int))
        # user_id -> slot_id -> count

    def record_usage(self, user_id: str, slot_id: str):
        self.usage[user_id][slot_id] += 1

    def get_frequent_slots(self, user_id: str):
        if user_id not in self.usage:
            return []

        slots = self.usage[user_id]
        sorted_slots = sorted(slots.items(), key=lambda x: x[1], reverse=True)

        return [slot_id for slot_id, _ in sorted_slots]
