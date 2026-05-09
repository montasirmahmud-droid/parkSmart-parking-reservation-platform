import Reservation from "../models/Reservation.js";

export const extendReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { newEndTime } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: "Not found" });

    const conflict = await Reservation.findOne({
      slot: reservation.slot,
      startTime: { $lt: new Date(newEndTime) },
      endTime: { $gt: reservation.endTime }
    });

    if (conflict) {
      return res.status(400).json({ message: "Time conflict" });
    }

    reservation.endTime = newEndTime;
    await reservation.save();

    res.json(reservation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
