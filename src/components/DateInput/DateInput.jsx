import { useState, useRef, useEffect } from "react";
import "./DateInput.css";

function DateInput({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const getLocalDate = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const todayDate = getLocalDate();

  const getLocalDateStr = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr(0);
  const tomorrowStr = getLocalDateStr(1);

  // Calendar view month/year state
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }
    return new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  });

  const wrapperRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isTodayActive = value === todayStr;
  const isTomorrowActive = value === tomorrowStr;

  const handleTodayClick = (e) => {
    e.stopPropagation();
    onChange(todayStr);
    setViewDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
    setIsOpen(false);
  };

  const handleTomorrowClick = (e) => {
    e.stopPropagation();
    onChange(tomorrowStr);
    const tomorrowObj = new Date(todayDate);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    setViewDate(new Date(tomorrowObj.getFullYear(), tomorrowObj.getMonth(), 1));
    setIsOpen(false);
  };

  const toggleCalendar = () => {
    setIsOpen((prev) => !prev);
  };

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return "Select date";
    try {
      const parts = dateVal.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      return dateVal;
    } catch {
      return dateVal;
    }
  };

  // Calendar Grid Logic
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isPrevDisabled =
    viewYear < todayDate.getFullYear() ||
    (viewYear === todayDate.getFullYear() && viewMonth <= todayDate.getMonth());

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (!isPrevDisabled) {
      setViewDate(new Date(viewYear, viewMonth - 1, 1));
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (dayNum, isPast, e) => {
    e.stopPropagation();
    if (isPast) return;

    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(dayNum).padStart(2, "0");
    const selectedStr = `${viewYear}-${m}-${d}`;

    onChange(selectedStr);
    setIsOpen(false);
  };

  return (
    <div className="date-input-group" ref={wrapperRef}>
      <label htmlFor="journey-date-field">JOURNEY DATE</label>

      <div className="date-input-row">
        <div
          className={`date-input-wrapper ${isOpen ? "active-focus" : ""}`}
          onClick={toggleCalendar}
        >
          <svg
            className="input-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>

          <span className={`custom-date-text ${!value ? "placeholder" : ""}`}>
            {formatDisplayDate(value)}
          </span>

          <svg
            className={`calendar-chevron ${isOpen ? "open" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>

          {/* Custom Dropdown Calendar */}
          {isOpen && (
            <div
              className="custom-calendar-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Calendar Header */}
              <div className="calendar-header">
                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={handlePrevMonth}
                  disabled={isPrevDisabled}
                  aria-label="Previous month"
                >
                  &#x2039;
                </button>

                <span className="calendar-month-title">
                  {monthNames[viewMonth]} {viewYear}
                </span>

                <button
                  type="button"
                  className="calendar-nav-btn"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  &#x203A;
                </button>
              </div>

              {/* Day Headers */}
              <div className="calendar-days-header">
                {dayNames.map((d) => (
                  <span key={d} className="day-name">
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="calendar-grid">
                {/* Empty cells before start of month */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <span key={`empty-${idx}`} className="calendar-cell empty" />
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const cellDate = new Date(viewYear, viewMonth, dayNum);
                  cellDate.setHours(0, 0, 0, 0);

                  const isPast = cellDate < todayDate;
                  const isToday = cellDate.getTime() === todayDate.getTime();

                  const mStr = String(viewMonth + 1).padStart(2, "0");
                  const dStr = String(dayNum).padStart(2, "0");
                  const dateStr = `${viewYear}-${mStr}-${dStr}`;

                  const isSelected = value === dateStr;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      disabled={isPast}
                      className={`calendar-cell day-btn ${isPast ? "disabled" : ""} ${
                        isToday ? "is-today" : ""
                      } ${isSelected ? "selected" : ""}`}
                      onClick={(e) => handleSelectDay(dayNum, isPast, e)}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="date-shortcuts">
          <button
            type="button"
            className={`date-shortcut-btn ${isTodayActive ? "active" : ""}`}
            onClick={handleTodayClick}
          >
            Today
          </button>

          <button
            type="button"
            className={`date-shortcut-btn ${isTomorrowActive ? "active" : ""}`}
            onClick={handleTomorrowClick}
          >
            Tomorrow
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateInput;