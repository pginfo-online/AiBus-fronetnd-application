import BusCard from "../BusCard/BusCard";

import "./BusList.css";

function BusList({ buses, searchFrom, searchTo, searchFromId, searchToId, searchDate }) {
  if (!buses || buses.length === 0) {
    return null;
  }

  return (
    <div className="bus-list">
      {buses.map((bus) => (
        <BusCard
          key={bus.id}
          bus={bus}
          searchFrom={searchFrom}
          searchTo={searchTo}
          searchFromId={searchFromId}
          searchToId={searchToId}
          searchDate={searchDate}
        />
      ))}
    </div>
  );
}

export default BusList;