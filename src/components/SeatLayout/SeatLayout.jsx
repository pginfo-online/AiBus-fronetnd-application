import { useState } from "react";
import { User, Check, Sparkles, Info } from "lucide-react";
import SeatLegend from "../SeatLegend/SeatLegend";
import "./SeatLayout.css";

// Standard 3-spoke bus steering wheel icon matching Image 1
function SteeringWheelIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="steering-wheel-svg"
      aria-label="Driver Steering Wheel"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="9" />
      <line x1="4.93" y1="16.5" x2="9.8" y2="13.5" />
      <line x1="19.07" y1="16.5" x2="14.2" y2="13.5" />
    </svg>
  );
}

// Dynamic berth price calculator matching Image 1 (₹2000/₹1700 Lower, ₹1900/₹1600 Upper)
export function getSeatPrice(baseFare = 1700, isUpper = false, isSingle = false) {
  let price = Number(baseFare) || 1700;
  if (isSingle) {
    return isUpper ? Math.round(price + 200) : Math.round(price + 300); // ₹1900 Upper / ₹2000 Lower
  }
  return isUpper ? Math.max(105, price - 100) : price; // ₹1600 Upper / ₹1700 Lower
}

// Generate deterministic seat grid data based on bus layoutType and deck
function getSeatGridData(layoutType = "SLEEPER_2_1", deck = "LOWER", basePrice = 1700) {
  const isUpper = deck === "UPPER";
  const deckSuffix = isUpper ? "U" : "L";

  // Standard Sleeper (1+2): 1 berth on LEFT, 2 berths on RIGHT
  const rows = [];
  const numRows = 5;

  for (let r = 1; r <= numRows; r++) {
    const singlePrice = getSeatPrice(basePrice, isUpper, true);
    const doublePrice = getSeatPrice(basePrice, isUpper, false);

    // Numbering: Lower e.g. 1A, 1B, 1C or sequential; Upper e.g. U1A, U1B, U1C
    const singleSeatNo = isUpper ? `${r * 3 - 2 + 18}` : `${r * 3 - 2}`;
    const doubleSeatNo1 = isUpper ? `${r * 3 - 1 + 18}` : `${r * 3 - 1}`;
    const doubleSeatNo2 = isUpper ? `${r * 3 + 18}` : `${r * 3}`;

    rows.push({
      rowNum: r,
      left: [
        {
          id: `${r}A-${deckSuffix}`,
          display: singleSeatNo,
          seatNo: singleSeatNo,
          label: `${r}A`,
          price: singlePrice,
          rowNum: r,
          isWindow: true,
          deck: deck,
          typeLbl: "Single Sleeper",
        },
      ],
      right: [
        {
          id: `${r}B-${deckSuffix}`,
          display: doubleSeatNo1,
          seatNo: doubleSeatNo1,
          label: `${r}B`,
          price: doublePrice,
          rowNum: r,
          isWindow: false,
          deck: deck,
          typeLbl: "Double Sleeper (Aisle)",
        },
        {
          id: `${r}C-${deckSuffix}`,
          display: doubleSeatNo2,
          seatNo: doubleSeatNo2,
          label: `${r}C`,
          price: doublePrice,
          rowNum: r,
          isWindow: true,
          deck: deck,
          typeLbl: "Double Sleeper (Window)",
        },
      ],
    });
  }

  return { type: "SLEEPER", columns: "1+2", rows };
}

// Status assignment for berths matching Image 1
function getSeatStatus(seatId, deck, rowNum, col, seatsLayout) {
  // If backend provided live seats status
  if (Array.isArray(seatsLayout) && seatsLayout.length > 0) {
    const seatNumber = seatId.split("-")[0];
    const found = seatsLayout.find((s) => s.seatNumber === seatNumber || s.seatNumber === seatId);
    if (found) {
      if (found.status === "BOOKED") return "BOOKED_MALE";
      if (found.status === "BLOCKED") return "BLOCKED";
      if (found.status === "AVAILABLE") return "AVAILABLE";
    }
  }

  // Exact Sold status pattern shown in Image 1:
  // Lower deck: all front rows available
  // Upper deck: Row 2 left sold (male), Row 3 left sold (female), Row 4 left & right sold
  if (deck === "UPPER") {
    if (rowNum === 2 && col === "left") return "BOOKED_MALE";
    if (rowNum === 3 && col === "left") return "BOOKED_FEMALE";
    if (rowNum === 4) return "BOOKED_MALE";
  }

  return "AVAILABLE";
}

function SingleDeckCard({ deckTitle, gridData, selectedSeats, onSeatClick, seatsLayout, isLower, isSingleDeck }) {
  return (
    <div className={`bus-deck-card-container ${isSingleDeck ? "is-single-deck" : ""}`}>
      {/* Deck Card Header (Matches Image 1) */}
      <div className="deck-card-header-bar">
        <div className="deck-title-group">
          <h4 className="deck-card-title">{deckTitle}</h4>
          {isSingleDeck && (
            <span className="single-deck-status-badge">Single Deck</span>
          )}
        </div>
        {isLower && (
          <div className="steering-wheel-wrap" title="Driver Cabin (Front)">
            <span className="deck-front-label">Front</span>
            <SteeringWheelIcon />
          </div>
        )}
      </div>

      {/* Interior Grid of Sleeper Berths */}
      <div className="deck-berths-flow">
        {gridData.rows.map((row) => (
          <div key={row.rowNum} className="deck-row-layout">
            {/* Left Column (Single Berth) */}
            <div className="berth-col left-col">
              {row.left.map((seat) => {
                const status = getSeatStatus(seat.id, gridData.rows[0].left[0].deck, row.rowNum, "left", seatsLayout);
                const isSelected = selectedSeats.some(
                  (s) => (typeof s === "string" ? s === seat.id : s.id === seat.id || s.seatNo === seat.seatNo)
                );
                const isOccupied = status === "BOOKED_MALE" || status === "BOOKED_FEMALE" || status === "BLOCKED";

                let berthClasses = "sleeper-berth-capsule";
                if (isSelected) berthClasses += " selected";
                else if (status === "BOOKED_MALE") berthClasses += " booked-male";
                else if (status === "BOOKED_FEMALE") berthClasses += " booked-female";
                else if (status === "BLOCKED") berthClasses += " blocked";
                else berthClasses += " available";

                return (
                  <div key={seat.id} className="berth-wrapper-node">
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={berthClasses}
                      onClick={() => onSeatClick(seat)}
                      title={`Berth ${seat.display} • ₹${seat.price}`}
                    >
                      {/* Pillow Indicator at Top */}
                      <span className="berth-pillow-bar" />

                      {/* Content inside berth */}
                      <div className="berth-inner-center">
                        {isSelected ? (
                          <Check size={14} className="berth-check-icon" strokeWidth={3} />
                        ) : status === "BOOKED_MALE" ? (
                          <User size={15} className="berth-silhouette-icon male" />
                        ) : status === "BOOKED_FEMALE" ? (
                          <User size={15} className="berth-silhouette-icon female" />
                        ) : status === "BLOCKED" ? (
                          <span className="berth-cross">×</span>
                        ) : null}
                      </div>
                    </button>

                    {/* Price or Sold Label Below Berth */}
                    <span className={`berth-footer-tag ${isSelected ? "selected-text" : isOccupied ? "sold-text" : ""}`}>
                      {isOccupied ? "Sold" : `₹${seat.price}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Central Walking Aisle */}
            <div className="deck-aisle-channel" />

            {/* Right Columns (Double Berths) */}
            <div className="berth-col right-col">
              {row.right.map((seat, colIdx) => {
                const status = getSeatStatus(seat.id, gridData.rows[0].left[0].deck, row.rowNum, `right-${colIdx}`, seatsLayout);
                const isSelected = selectedSeats.some(
                  (s) => (typeof s === "string" ? s === seat.id : s.id === seat.id || s.seatNo === seat.seatNo)
                );
                const isOccupied = status === "BOOKED_MALE" || status === "BOOKED_FEMALE" || status === "BLOCKED";

                let berthClasses = "sleeper-berth-capsule";
                if (isSelected) berthClasses += " selected";
                else if (status === "BOOKED_MALE") berthClasses += " booked-male";
                else if (status === "BOOKED_FEMALE") berthClasses += " booked-female";
                else if (status === "BLOCKED") berthClasses += " blocked";
                else berthClasses += " available";

                return (
                  <div key={seat.id} className="berth-wrapper-node">
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={berthClasses}
                      onClick={() => onSeatClick(seat)}
                      title={`Berth ${seat.display} • ₹${seat.price}`}
                    >
                      {/* Pillow Indicator at Top */}
                      <span className="berth-pillow-bar" />

                      {/* Content inside berth */}
                      <div className="berth-inner-center">
                        {isSelected ? (
                          <Check size={14} className="berth-check-icon" strokeWidth={3} />
                        ) : status === "BOOKED_MALE" ? (
                          <User size={15} className="berth-silhouette-icon male" />
                        ) : status === "BOOKED_FEMALE" ? (
                          <User size={15} className="berth-silhouette-icon female" />
                        ) : status === "BLOCKED" ? (
                          <span className="berth-cross">×</span>
                        ) : null}
                      </div>
                    </button>

                    {/* Price or Sold Label Below Berth */}
                    <span className={`berth-footer-tag ${isSelected ? "selected-text" : isOccupied ? "sold-text" : ""}`}>
                      {isOccupied ? "Sold" : `₹${seat.price}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Rear Exit & Emergency Area (Matches Image 2) */}
      <div className="deck-rear-exit-area">
        <div className="rear-dashed-divider" />
        <span className="rear-exit-label">REAR / EMERGENCY EXIT</span>
      </div>
    </div>
  );
}

// Live GDS / Mantis API Layout
// Live GDS / Mantis API Layout
function ApiChartDeckLayout({ chartData, selectedSeats, onSeatClick, isSingleDeck, activeFilter = "all" }) {
  const decks = chartData.ChartLayout?.Info?.Decks || 1;
  const singleDeckMode = isSingleDeck !== undefined ? isSingleDeck : decks <= 1;

  const renderDeck = (deckName) => {
    const layoutInfo = chartData.ChartLayout?.Info?.[deckName];
    const layoutArray = chartData.ChartLayout?.Layout?.[deckName];
    if (!layoutInfo || !layoutArray) return null;

    const maxRows = layoutInfo.MaxRows;
    const maxCols = layoutInfo.MaxCols;
    const isLower = deckName.toLowerCase().includes("lower") || deckName === "1";

    return (
      <div className={`bus-deck-card-container ${singleDeckMode ? "is-single-deck" : ""}`} key={deckName}>
        {/* redBus Windshield & Front Cabin Header */}
        <div className="coach-front-windshield">
          <div className="coach-cabin-left">
            <div className="coach-door-indicator">
              <span className="door-step-icon">🚪</span>
              <span className="door-step-text">ENTRY</span>
            </div>
          </div>

          <div className="coach-cabin-center">
            <h4 className="deck-card-title">{deckName} deck</h4>
            {singleDeckMode && (
              <span className="single-deck-status-badge">Single Deck</span>
            )}
          </div>

          <div className="coach-cabin-right">
            {isLower && (
              <div className="coach-driver-badge" title="Driver Cabin (Front)">
                <span className="deck-front-label">Driver</span>
                <SteeringWheelIcon />
              </div>
            )}
          </div>
        </div>

        {/* Interior Grid of Seats / Berths */}
        <div
          className={`api-grid-berths ${singleDeckMode ? "is-single-deck" : ""}`}
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${maxRows + 1}, auto)`,
            gridTemplateColumns: `repeat(${maxCols + 1}, auto)`,
            gap: "10px 10px",
            justifyContent: "center",
            padding: "20px 16px",
          }}
        >
          {layoutArray.map((seatData) => {
            const [seq_no, row, col, width, height, seat_type] = seatData;
            const display = chartData.ChartSeats?.Seats?.[seq_no] || `${seq_no}`;
            const statusVal = chartData.SeatsStatus?.Status?.[seq_no] ?? 1;
            const fareArray = chartData.SeatsStatus?.Fares?.[seq_no];
            const price = fareArray ? fareArray[0] : 11;

            const isSleeper = height >= 2 || width >= 2 || seat_type === 2;
            const isWindow = col === 0 || col === maxCols;
            const isAisle = !isWindow && col !== 2;

            const seatObj = {
              id: String(display),
              display: String(display),
              seatNo: String(display),
              seq_no,
              price: Number(price),
              statusVal,
              seat_type,
              isSleeper,
              isWindow,
              isAisle,
              deck: deckName,
            };

            const isSelected = selectedSeats.some(
              (s) =>
                (typeof s === "string" ? s === seatObj.id || s === seatObj.display : s.id === seatObj.id || s.display === seatObj.display || s.seatNo === seatObj.seatNo)
            );

            let isOccupied = false;
            let statusClass = "available";

            if (statusVal === 0 || statusVal === "0") {
              statusClass = "blocked";
              isOccupied = true;
            } else if (statusVal === -2 || statusVal === "-2") {
              statusClass = "booked-male";
              isOccupied = true;
            } else if (statusVal === -3 || statusVal === "-3") {
              statusClass = "booked-female";
              isOccupied = true;
            } else if (statusVal === 2 || statusVal === "2") {
              statusClass = "available-male";
            } else if (statusVal === 3 || statusVal === "3") {
              statusClass = "available-female";
            }

            if (isSelected) {
              statusClass = "selected";
            }

            // Filtering opacity
            let isDimmed = false;
            if (activeFilter === "window" && !isWindow) isDimmed = true;
            if (activeFilter === "aisle" && !isAisle) isDimmed = true;

            return (
              <div
                key={seq_no}
                className={`redbus-seat-wrapper ${isSleeper ? "sleeper-wrapper" : "seater-wrapper"} ${isDimmed ? "filter-dimmed" : ""}`}
                style={{
                  gridRow: `${row + 1} / span ${height}`,
                  gridColumn: `${col + 1} / span ${width}`,
                }}
              >
                {isSleeper ? (
                  /* RedBus Sleeper Berth */
                  <div className="berth-wrapper-node">
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={`sleeper-berth-capsule ${statusClass}`}
                      onClick={() => onSeatClick(seatObj)}
                      title={`Berth ${display} • ${isWindow ? "Window" : "Aisle"} • ₹${price}`}
                    >
                      <span className="berth-pillow-bar" />
                      <div className="berth-inner-center">
                        {isSelected ? (
                          <Check size={14} className="berth-check-icon" strokeWidth={3} />
                        ) : statusVal === -2 ? (
                          <User size={14} className="berth-silhouette-icon male" />
                        ) : statusVal === -3 ? (
                          <User size={14} className="berth-silhouette-icon female" />
                        ) : statusVal === 0 ? (
                          <span className="berth-cross">×</span>
                        ) : (
                          <span className="berth-seat-num">{display}</span>
                        )}
                      </div>
                    </button>
                    <span className={`berth-footer-tag ${isSelected ? "selected-text" : isOccupied ? "sold-text" : ""}`}>
                      {isOccupied ? "Sold" : `₹${price}`}
                    </span>
                  </div>
                ) : (
                  /* RedBus Seater Chair */
                  <div className="seater-wrapper-node">
                    <button
                      type="button"
                      disabled={isOccupied}
                      className={`seater-chair-button ${statusClass}`}
                      onClick={() => onSeatClick(seatObj)}
                      title={`Seat ${display} • ${isWindow ? "Window" : "Aisle"} • ₹${price}`}
                    >
                      <span className="seater-headrest-pip" />
                      <div className="seater-seat-inner">
                        {isSelected ? (
                          <Check size={14} className="seater-check-icon" strokeWidth={3} />
                        ) : statusVal === -2 ? (
                          <User size={13} className="seater-silhouette-icon male" />
                        ) : statusVal === -3 ? (
                          <User size={13} className="seater-silhouette-icon female" />
                        ) : statusVal === 0 ? (
                          <span className="seater-cross">×</span>
                        ) : (
                          <span className="seater-seat-num">{display}</span>
                        )}
                      </div>
                    </button>
                    <span className={`seater-price-tag ${isSelected ? "selected-text" : isOccupied ? "sold-text" : ""}`}>
                      {isOccupied ? "Sold" : `₹${price}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rear Exit */}
        <div className="deck-rear-exit-area">
          <div className="rear-dashed-divider" />
          <span className="rear-exit-label">REAR / EMERGENCY EXIT</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`decks-side-by-side-row ${singleDeckMode ? "is-single-deck" : ""}`}>
      {renderDeck("Lower")}
      {decks > 1 && renderDeck("Upper")}
    </div>
  );
}

function SeatLayout({ bus, selectedSeats = [], onSeatClick, isSingleDeck }) {
  const [seatFilter, setSeatFilter] = useState("all"); // "all" | "window" | "aisle"
  const chartData = bus?.seatsLayout;
  const hasApiChart =
    chartData &&
    chartData.success !== false &&
    chartData.ChartLayout &&
    chartData.ChartSeats &&
    chartData.SeatsStatus;

  const resolvedSingleDeck =
    isSingleDeck !== undefined
      ? isSingleDeck
      : hasApiChart
      ? (Number(chartData.ChartLayout?.Info?.Decks) || 1) <= 1
      : (bus?.decks === 1 || ((bus?.busType || "").toLowerCase().includes("seater") && !(bus?.busType || "").toLowerCase().includes("sleeper")));

  const layoutType = bus?.layoutType || (bus?.isSleeper === false ? "SEATER_2_2" : "SLEEPER_2_1");
  const basePrice = bus?.price || 11;

  const lowerGrid = getSeatGridData(layoutType, "LOWER", basePrice);
  const upperGrid = getSeatGridData(layoutType, "UPPER", basePrice);

  return (
    <div className={`clean-seat-layout-section ${resolvedSingleDeck ? "is-single-deck" : ""}`}>
      {/* RedBus-Style Top Control Bar: Quick Filters & Legend */}
      <div className="redbus-top-controls-bar">
        <div className="redbus-filter-chips">
          <span className="filter-title-label">Filter Seats:</span>
          <button
            type="button"
            className={`redbus-filter-pill ${seatFilter === "all" ? "active" : ""}`}
            onClick={() => setSeatFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`redbus-filter-pill ${seatFilter === "window" ? "active" : ""}`}
            onClick={() => setSeatFilter("window")}
          >
            🪟 Window
          </button>
          <button
            type="button"
            className={`redbus-filter-pill ${seatFilter === "aisle" ? "active" : ""}`}
            onClick={() => setSeatFilter("aisle")}
          >
            🚶 Aisle
          </button>
        </div>

        {/* Inline Status Legend */}
        <div className="redbus-inline-legend">
          <div className="legend-chip">
            <span className="legend-indicator available" />
            <span>Available</span>
          </div>
          <div className="legend-chip">
            <span className="legend-indicator selected" />
            <span>Selected</span>
          </div>
          <div className="legend-chip">
            <span className="legend-indicator booked-male" />
            <span>Booked (M)</span>
          </div>
          <div className="legend-chip">
            <span className="legend-indicator booked-female" />
            <span>Booked (F)</span>
          </div>
        </div>
      </div>

      {/* Coach Chassis Container */}
      <div className={`bus-visual-chassis-container ${resolvedSingleDeck ? "is-single-deck" : ""}`}>
        {hasApiChart ? (
          <ApiChartDeckLayout
            chartData={chartData}
            selectedSeats={selectedSeats}
            onSeatClick={onSeatClick}
            isSingleDeck={resolvedSingleDeck}
            activeFilter={seatFilter}
          />
        ) : (
          <div className={`decks-side-by-side-row ${resolvedSingleDeck ? "is-single-deck" : ""}`}>
            <SingleDeckCard
              deckTitle="Lower deck"
              gridData={lowerGrid}
              selectedSeats={selectedSeats}
              onSeatClick={onSeatClick}
              seatsLayout={bus?.seatsLayout}
              isLower={true}
              isSingleDeck={resolvedSingleDeck}
            />

            {!resolvedSingleDeck && (
              <SingleDeckCard
                deckTitle="Upper deck"
                gridData={upperGrid}
                selectedSeats={selectedSeats}
                onSeatClick={onSeatClick}
                seatsLayout={bus?.seatsLayout}
                isLower={false}
                isSingleDeck={false}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SeatLayout;
