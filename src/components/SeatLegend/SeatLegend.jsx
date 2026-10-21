import React from "react";
import { User } from "lucide-react";
import "./SeatLegend.css";

function SeatLegend({ isSingleDeck }) {
  const legendItems = [
    { type: "available", label: "Available" },
    { type: "selected", label: "Selected" },
    { type: "booked-male", label: "Booked (Male)" },
    { type: "booked-female", label: "Booked (Female)" },
    { type: "blocked", label: "Blocked" },
  ];

  return (
    <div className={`modern-seat-legend-card ${isSingleDeck ? "is-single-deck" : ""}`} aria-label="Seat Map Legend">
      <div className="legend-items-grid">
        {legendItems.map((item) => (
          <div className="modern-legend-item" key={item.type}>
            <div className={`legend-mini-berth ${item.type}`}>
              <span className="mini-headrest" />
              {item.type === "booked-male" && <User size={9} className="mini-user-icon male" />}
              {item.type === "booked-female" && <User size={9} className="mini-user-icon female" />}
            </div>
            <span className="legend-item-title">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeatLegend;
