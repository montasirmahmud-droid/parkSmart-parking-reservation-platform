import React, { useEffect, useState } from "react";
import axios from "axios";

const RecommendedSlots = () => {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/recommendations")
      .then(res => setSlots(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      <h2>Recommended Slots</h2>
      {slots.map((slot, index) => (
        <p key={index}>
          Slot ID: {slot._id} | Used: {slot.count} times
        </p>
      ))}
    </div>
  );
};

export default RecommendedSlots;
