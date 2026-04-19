import React, { useEffect, useState } from "react";
import axios from "axios";

const SlotDetails = ({ slotId }) => {
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/slots/${slotId}`)
      .then(res => setSlot(res.data))
      .catch(err => console.log(err));
  }, [slotId]);

  if (!slot) return <p>Loading...</p>;

  return (
    <div>
      <h2>Slot Details</h2>
      <p><b>ID:</b> {slot.slotId}</p>
      <p><b>Location:</b> {slot.location}</p>
      <p><b>Vehicle:</b> {slot.vehicleType}</p>
      <p><b>Status:</b> {slot.isAvailable ? "Available" : "Occupied"}</p>
    </div>
  );
};

export default SlotDetails;
