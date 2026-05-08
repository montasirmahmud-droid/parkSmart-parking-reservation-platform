import React, { useState } from "react";
import axios from "axios";

const ExtendReservation = ({ reservationId }) => {
  const [time, setTime] = useState("");

  const handleExtend = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/reservations/extend/${reservationId}`,
        { newEndTime: time }
      );
      alert("Extended successfully");
    } catch (err) {
      alert("Error extending");
    }
  };

  return (
    <div>
      <h3>Extend Reservation</h3>
      <input
        type="datetime-local"
        onChange={(e) => setTime(e.target.value)}
      />
      <button onClick={handleExtend}>Extend</button>
    </div>
  );
};

export default ExtendReservation;
