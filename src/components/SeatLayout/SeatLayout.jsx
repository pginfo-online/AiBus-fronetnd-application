import { useState } from "react";
import { Disc, Info, AlertTriangle, ArrowDown, Sparkles } from "lucide-react";
import SeatLegend from "../SeatLegend/SeatLegend";
import "./SeatLayout.css";

// Helper to compute dynamic row-based price (Front premium, Middle standard, Rear discount)
export function getSeatPriceByRow(basePrice = 580, rowNum = 1) {
  if (rowNum <= 2) return basePrice + 100; // Front rows (+₹100)
  if (rowNum <= 6) return basePrice;       // Middle rows (Base)
  return Math.max(15, basePrice - 60);     // Rear rows (-₹60)
}

// Generate deterministic seat grid data based on bus layoutType and deck
function getSeatGridData(layoutType, deck = "LOWER", basePrice = 580) {
  const isUpper = deck === "UPPER";
  const deckSuffix = isUpper ? "U" : "L";

  // REAL INDIAN BUS CONVENTION (2+1): Single berth on LEFT, Double berths on RIGHT
  if (layoutType.includes("SLEEPER_2_1") || layoutType.includes("SLEEPER_COUPLE_2_1")) {
    const rows = [];
    for (let r = 1; r <= 8; r++) {
      const price = getSeatPriceByRow(basePrice, r);
      rows.push({
        rowNum: r,
        price,
        left: [
          { id: `${r}A-${deckSuffix}`, display: `${r}A`, price, rowNum: r, isWindow: true, typeLbl: "Single Berth (Window)" },
        ],
        right: [
          { id: `${r}B-${deckSuffix}`, display: `${r}B`, price, rowNum: r, isWindow: false, typeLbl: "Double Berth (Aisle)" },
          { id: `${r}C-${deckSuffix}`, display: `${r}C`, price, rowNum: r, isWindow: true, typeLbl: "Double Berth (Window)" },
        ],
      });
    }
    return { type: "SLEEPER", columns: "1+2", rows };
  }

  if (layoutType.includes("SLEEPER_2_2") || layoutType.includes("SLEEPER_COUPLE_2_2")) {
    const rows = [];
    for (let r = 1; r <= 8; r++) {
      const price = getSeatPriceByRow(basePrice, r);
      rows.push({
        rowNum: r,
        price,
        left: [
          { id: `${r}A-${deckSuffix}`, display: `${r}A`, price, rowNum: r, isWindow: true, typeLbl: "Window Berth" },
          { id: `${r}B-${deckSuffix}`, display: `${r}B`, price, rowNum: r, isWindow: false, typeLbl: "Aisle Berth" },
        ],
        right: [
          { id: `${r}C-${deckSuffix}`, display: `${r}C`, price, rowNum: r, isWindow: false, typeLbl: "Aisle Berth" },
          { id: `${r}D-${deckSuffix}`, display: `${r}D`, price, rowNum: r, isWindow: true, typeLbl: "Window Berth" },
        ],
      });
    }
    return { type: "SLEEPER", columns: "2+2", rows };
  }

  if (layoutType === "HYBRID_2_1" || layoutType === "HYBRID_2_2") {
    if (isUpper) {
      const rows = [];
      for (let r = 1; r <= 8; r++) {
        const price = getSeatPriceByRow(basePrice, r);
        rows.push({
          rowNum: r,
          price,
          left: [{ id: `${r}A-U`, display: `${r}A`, price, rowNum: r, isWindow: true, typeLbl: "Single Berth (Window)" }],
          right: [{ id: `${r}B-U`, display: `${r}B`, price, rowNum: r, isWindow: true, typeLbl: "Single Berth (Window)" }],
        });
      }
      return { type: "SLEEPER", columns: "1+1", rows };
    } else {
      const rows = [];
      for (let r = 1; r <= 8; r++) {
        const price = getSeatPriceByRow(basePrice, r);
        rows.push({
          rowNum: r,
          price,
          left: [{ id: `${r}A-L`, display: `${r}A`, price, rowNum: r, isWindow: true, typeLbl: "Single Seat (Window)" }],
          right: [
            { id: `${r}B-L`, display: `${r}B`, price, rowNum: r, isWindow: false, typeLbl: "Aisle Seat" },
            { id: `${r}C-L`, display: `${r}C`, price, rowNum: r, isWindow: true, typeLbl: "Window Seat" },
          ],
        });
      }
      return { type: "SEATER", columns: "1+2", rows };
    }
  }

  // Default: SEATER_2_2 & SEMI_SLEEPER_2_2 (standard 2x2 pushback coach)
  const rows = [];
  for (let r = 1; r <= 8; r++) {
    const price = getSeatPriceByRow(basePrice, r);
    rows.push({
      rowNum: r,
      price,
      left: [
        { id: `${r}A`, display: `${r}A`, price, rowNum: r, isWindow: true, typeLbl: "Window Seat" },
        { id: `${r}B`, display: `${r}B`, price, rowNum: r, isWindow: false, typeLbl: "Aisle Seat" },
      ],
      right: [
        { id: `${r}C`, display: `${r}C`, price, rowNum: r, isWindow: false, typeLbl: "Aisle Seat" },
        { id: `${r}D`, display: `${r}D`, price, rowNum: r, isWindow: true, typeLbl: "Window Seat" },
      ],
    });
  }
  return {
    type: layoutType?.includes("SEMI") ? "SEMI_SLEEPER" : "SEATER",
    columns: "2+2",
    rows,
  };
}

// Status assignment for seats
function getSeatStatus(seatId, seatsLayout) {
  if (Array.isArray(seatsLayout) && seatsLayout.length > 0) {
    const seatNumber = seatId.split("-")[0]; // e.g. "1A-L" -> "1A"
    const found = seatsLayout.find((s) => s.seatNumber === seatNumber || s.seatNumber === seatId);
    if (found) {
      if (found.status === "BOOKED") return "BOOKED_MALE";
      if (found.status === "BLOCKED") return "BLOCKED";
      if (found.status === "AVAILABLE") return "AVAILABLE";
    }
  }

  const upper = seatId.toUpperCase();
  if (upper.includes("3A") || upper.includes("3C")) return "BLOCKED";
  if (upper.includes("2B") || upper.includes("2U")) return "BOOKED_MALE";
  if (upper.includes("6B") || upper.includes("6U")) return "BOOKED_FEMALE";
  return "AVAILABLE";
}

function SingleBusFrame({ deckTitle, gridData, selectedSeats, onSeatClick, seatsLayout }) {
  return (
    <div className="bus-deck-column">
      <div className="deck-badge-header">
        <span className="deck-title-pill">{deckTitle}</span>
      </div>

      <div className={`bus-body-frame ${gridData.type.toLowerCase()}-mode`}>
        {/* Aerodynamic Driver Cabin & Windshield */}
        <div className="bus-chassis-driver-area">
          <div className="windshield-glass">
            <span className="windshield-reflection" />
          </div>
          <div className="driver-controls-row">
            <div className="entry-door-sign">
              <ArrowDown size={11} className="entry-arrow" />
              <span>ENTRY / EXIT</span>
            </div>
            <div className="driver-seat-box" title="Driver Cabin">
              <Disc size={18} className="steering-wheel-icon" />
              <span className="driver-lbl">DRIVER</span>
            </div>
          </div>
        </div>

        {/* Interior Seating Grid */}
        <div className="bus-interior-grid">
          {gridData.rows.map((row, rIdx) => (
            <div key={rIdx} className="bus-interior-row">
              {/* Left Group */}
              <div className="berth-group left-group">
                {row.left.map((seat) => {
                  const defaultStatus = getSeatStatus(seat.id, seatsLayout);
                  const isSelected = selectedSeats.some(
                    (s) => (typeof s === "string" ? s === seat.id : s.id === seat.id)
                  );
                  const isOccupied =
                    defaultStatus === "BOOKED_MALE" ||
                    defaultStatus === "BOOKED_FEMALE" ||
                    defaultStatus === "BLOCKED";

                  let btnClass = `seat-element ${gridData.type.toLowerCase()}-berth`;
                  if (isSelected) btnClass += " selected";
                  else if (defaultStatus === "BOOKED_MALE") btnClass += " booked-male";
                  else if (defaultStatus === "BOOKED_FEMALE") btnClass += " booked-female";
                  else if (defaultStatus === "BLOCKED") btnClass += " blocked";
                  else btnClass += " available";

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isOccupied}
                      className={btnClass}
                      onClick={() => onSeatClick(seat)}
                      title={`Seat ${seat.display} • ${seat.typeLbl || "Seat"} • ₹${seat.price}`}
                    >
                      <span className="seat-headrest-bar" />
                      <span className="seat-code-label">
                        {defaultStatus === "BLOCKED" ? "×" : seat.display}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Central Walking Aisle */}
              <div className="aisle-gap">
                <span className="aisle-guide-line" />
              </div>

              {/* Right Group */}
              <div className="berth-group right-group">
                {row.right.map((seat) => {
                  const defaultStatus = getSeatStatus(seat.id, seatsLayout);
                  const isSelected = selectedSeats.some(
                    (s) => (typeof s === "string" ? s === seat.id : s.id === seat.id)
                  );
                  const isOccupied =
                    defaultStatus === "BOOKED_MALE" ||
                    defaultStatus === "BOOKED_FEMALE" ||
                    defaultStatus === "BLOCKED";

                  let btnClass = `seat-element ${gridData.type.toLowerCase()}-berth`;
                  if (isSelected) btnClass += " selected";
                  else if (defaultStatus === "BOOKED_MALE") btnClass += " booked-male";
                  else if (defaultStatus === "BOOKED_FEMALE") btnClass += " booked-female";
                  else if (defaultStatus === "BLOCKED") btnClass += " blocked";
                  else btnClass += " available";

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isOccupied}
                      className={btnClass}
                      onClick={() => onSeatClick(seat)}
                      title={`Seat ${seat.display} • ${seat.typeLbl || "Seat"} • ₹${seat.price}`}
                    >
                      <span className="seat-headrest-bar" />
                      <span className="seat-code-label">
                        {defaultStatus === "BLOCKED" ? "×" : seat.display}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rear Exit & Engine Area */}
        <div className="bus-chassis-rear-area">
          <span className="rear-bumper-line" />
          <span className="rear-exit-text">REAR / EMERGENCY EXIT</span>
        </div>
      </div>
    </div>
  );
}

function ApiChartLayout({ chartData, selectedSeats, onSeatClick }) {
  const decks = chartData.ChartLayout?.Info?.Decks || 1;

  const renderDeck = (deckName) => {
    const layoutInfo = chartData.ChartLayout?.Info?.[deckName];
    const layoutArray = chartData.ChartLayout?.Layout?.[deckName];
    if (!layoutInfo || !layoutArray) return null;

    const maxRows = layoutInfo.MaxRows;
    const maxCols = layoutInfo.MaxCols;

    return (
      <div className="bus-deck-column" key={deckName}>
        <div className="deck-badge-header">
          <span className="deck-title-pill">{deckName} Deck</span>
        </div>

        <div className="bus-body-frame api-mode">
          {/* Driver Area */}
          <div className="bus-chassis-driver-area">
            <div className="windshield-glass">
              <span className="windshield-reflection" />
            </div>
            <div className="driver-controls-row">
              <div className="entry-door-sign">
                <ArrowDown size={11} className="entry-arrow" />
                <span>ENTRY</span>
              </div>
              <div className="driver-seat-box" title="Driver Cabin">
                <Disc size={18} className="steering-wheel-icon" />
                <span className="driver-lbl">DRIVER</span>
              </div>
            </div>
          </div>

          <div
            className="api-deck-grid"
            style={{
              display: "grid",
              gridTemplateRows: `repeat(${maxRows + 1}, auto)`,
              gridTemplateColumns: `repeat(${maxCols + 1}, auto)`,
              gap: "10px",
              justifyContent: "center",
              padding: "10px 0",
            }}
          >
            {layoutArray.map((seatData) => {
              const [seq_no, row, col, width, height, seat_type] = seatData;
              const display = chartData.ChartSeats?.Seats?.[seq_no] || `${seq_no}`;
              const statusVal = chartData.SeatsStatus?.Status?.[seq_no] ?? 1;
              const fareArray = chartData.SeatsStatus?.Fares?.[seq_no];
              const price = fareArray ? fareArray[0] : 15;

              const seatObj = {
                id: String(display),
                display: String(display),
                seatNo: String(display),
                seq_no,
                price: Number(price),
                statusVal,
                seat_type,
              };

              const isSelected = selectedSeats.some(
                (s) =>
                  (typeof s === "string" ? s === seatObj.id || s === seatObj.display : s.id === seatObj.id || s.display === seatObj.display || s.seatNo === seatObj.seatNo)
              );

              let isOccupied = false;
              let btnClass = "seat-element api-berth";

              if (seat_type === 2) btnClass += " sleeper-berth";
              else btnClass += " seater-berth";

              if (statusVal === 0 || statusVal === "0") {
                btnClass += " blocked";
                isOccupied = true;
              } else if (statusVal === -2 || statusVal === "-2") {
                btnClass += " booked-male";
                isOccupied = true;
              } else if (statusVal === -3 || statusVal === "-3") {
                btnClass += " booked-female";
                isOccupied = true;
              } else if (statusVal === 2 || statusVal === "2") {
                btnClass += " available-male";
              } else if (statusVal === 3 || statusVal === "3") {
                btnClass += " available-female";
              }

              if (isSelected) {
                btnClass += " selected";
              } else if (!isOccupied && !btnClass.includes("available-")) {
                btnClass += " available";
              }

              return (
                <button
                  key={seq_no}
                  type="button"
                  disabled={isOccupied}
                  className={btnClass}
                  style={{
                    gridRow: `${row + 1} / span ${height}`,
                    gridColumn: `${col + 1} / span ${width}`,
                  }}
                  onClick={() => onSeatClick(seatObj)}
                  title={`Seat ${display} • ₹${price}`}
                >
                  <span className="seat-headrest-bar" />
                  <span className="seat-code-label">
                    {statusVal === 0 ? "×" : display}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bus-chassis-rear-area">
            <span className="rear-bumper-line" />
            <span className="rear-exit-text">REAR / EMERGENCY EXIT</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="decks-side-by-side-row">
      {renderDeck("Lower")}
      {decks > 1 && renderDeck("Upper")}
    </div>
  );
}

function SeatLayout({ bus, selectedSeats = [], onSeatClick }) {
  const [genderNotice, setGenderNotice] = useState("");

  const chartData = bus?.seatsLayout;
  const hasApiChart =
    chartData &&
    chartData.success !== false &&
    chartData.ChartLayout &&
    chartData.ChartSeats &&
    chartData.SeatsStatus;

  const layoutType = bus?.layoutType || "SEATER_2_2";
  const basePrice = bus?.price || 15;
  const hasMultipleDecks =
    layoutType.includes("SLEEPER") ||
    layoutType.includes("HYBRID") ||
    bus?.busType?.toLowerCase().includes("sleeper");

  const lowerGrid = getSeatGridData(layoutType, "LOWER", basePrice);
  const upperGrid = getSeatGridData(layoutType, "UPPER", basePrice);

  const handleValidatedSeatClick = (seatObj) => {
    setGenderNotice("");

    if (hasApiChart) {
      if (seatObj.statusVal === 2) {
        setGenderNotice("ℹ️ This seat is reserved for Male passengers only.");
      } else if (seatObj.statusVal === 3) {
        setGenderNotice("ℹ️ This seat is reserved for Female passengers only.");
      }
    }
    onSeatClick(seatObj);
  };

  return (
    <div className="modern-seat-layout-card">
      {/* Header with Luxury Bus Badge */}
      <div className="layout-top-strip">
        <div className="layout-title-group">
          <h3 className="layout-main-heading">Select Desired Berth / Seat</h3>
          <p className="layout-sub-heading">Click on any available white seat to select or deselect</p>
        </div>

        <div className="layout-coach-pill">
          <Sparkles size={13} className="sparkle-gold" />
          <span>{bus?.busType || "2X2 Luxury Coach"}</span>
        </div>
      </div>

      {/* Optional Gender Notice */}
      {genderNotice && (
        <div className="gender-warning-banner">
          <div className="banner-left">
            <Info size={15} />
            <span>{genderNotice}</span>
          </div>
          <button
            type="button"
            className="dismiss-warning-btn"
            onClick={() => setGenderNotice("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Bus Frame Grid */}
      <div className="bus-visual-chassis-container">
        {hasApiChart ? (
          <ApiChartLayout
            chartData={chartData}
            selectedSeats={selectedSeats}
            onSeatClick={handleValidatedSeatClick}
          />
        ) : (
          <div className="decks-side-by-side-row">
            <SingleBusFrame
              deckTitle={hasMultipleDecks ? "Lower Deck" : "Main Deck"}
              gridData={lowerGrid}
              selectedSeats={selectedSeats}
              onSeatClick={handleValidatedSeatClick}
              seatsLayout={bus?.seatsLayout}
            />

            {hasMultipleDecks && (
              <SingleBusFrame
                deckTitle="Upper Deck"
                gridData={upperGrid}
                selectedSeats={selectedSeats}
                onSeatClick={handleValidatedSeatClick}
                seatsLayout={bus?.seatsLayout}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Interactive Legend Strip */}
      <SeatLegend />
    </div>
  );
}

export default SeatLayout;
