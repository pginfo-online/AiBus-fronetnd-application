import React from "react";
import "./SeatLegend.css";

function SeatLegend() {
  const legendItems = [
    { type: "available", label: "Available", desc: "Open to all" },
    { type: "selected", label: "Selected", desc: "Your chosen berths" },
    { type: "booked-male", label: "Booked (Male)", desc: "Occupied by male" },
    { type: "booked-female", label: "Booked (Female)", desc: "Reserved female area" },
    { type: "blocked", label: "Blocked", desc: "Unavailable" },
  ];

  return (
    <div className="modern-seat-legend-card" aria-label="Seat Map Legend">
      <div className="legend-items-grid">
        {legendItems.map((item) => (
          <div className="modern-legend-item" key={item.type}>
            <div className={`legend-mini-seat ${item.type}`}>
              <span className="mini-headrest" />
            </div>
            <div className="legend-label-col">
              <span className="legend-item-title">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeatLegend;
