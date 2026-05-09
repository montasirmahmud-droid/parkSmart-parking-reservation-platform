import Reservation from "../models/Reservation.js";

export const getRecommendedSlots = async (req, res) => {
  try {
    const userId = req.user?.id;

    const data = await Reservation.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$slot", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
