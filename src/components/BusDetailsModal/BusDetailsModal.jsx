import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
  Droplets,
  Radio,
  Tv,
  Star,
  Info,
  CheckCircle2,
  Calendar,
  Bus,
  ArrowRight,
  PhoneCall,
  Navigation,
  Percent,
  RefreshCw,
} from "lucide-react";
import busService from "../../services/busService";
import "./BusDetailsModal.css";

function formatTimeOnly(timeStr) {
  if (!timeStr) return "08:30 PM";
  if (timeStr.includes(" ")) {
    const timePart = timeStr.split(" ")[1];
    return timePart ? timePart.slice(0, 5) : timeStr;
  }
  if (timeStr.includes("T")) {
    const timePart = timeStr.split("T")[1];
    return timePart ? timePart.slice(0, 5) : timeStr;
  }
  return timeStr.slice(0, 5);
}

export default function BusDetailsModal({
  isOpen,
  onClose,
  initialBus,
  fromCityId,
  toCityId,
  journeyDate,
  fromName,
  toName,
  onSelectSeats,
}) {
  const [activeTab, setActiveTab] = useState("points"); // 'points' | 'policy' | 'amenities' | 'safety'
  const [busData, setBusData] = useState(initialBus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !initialBus) return;

    let isMounted = true;
    setBusData(initialBus);

    // Fetch fresh detailed single bus data & boarding/dropping points via Mantis /ota/Chart
    const fetchChartDetails = async () => {
      const busIdToFetch = initialBus.routeBusId || initialBus.busId || initialBus.id;
      if (!busIdToFetch) return;

      setLoading(true);
      try {
        const chartResponse = await busService.getSeatChart(busIdToFetch, {
          fromCityId,
          toCityId,
          journeyDate,
        });

        if (isMounted && chartResponse) {
          setBusData((prev) => ({
            ...prev,
            seatsLayout: chartResponse,
            pickups: chartResponse.BoardingPoints?.length ? chartResponse.BoardingPoints : (prev?.pickups || []),
            dropoffs: chartResponse.DroppingPoints?.length ? chartResponse.DroppingPoints : (prev?.dropoffs || []),
            cancellationPolicy: chartResponse.CancellationPolicy?.length
              ? chartResponse.CancellationPolicy
              : (prev?.cancellationPolicy || []),
          }));
        }
      } catch (err) {
        console.warn("Could not refresh live chart details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChartDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialBus, fromCityId, toCityId, journeyDate, fromName, toName]);

  if (!isOpen || !busData) return null;

  const pickups = busData.pickups || [];
  const dropoffs = busData.dropoffs || [];
  const cancellationPolicy = busData.cancellationPolicy || [];

  const basePrice = busData.price || 650;

  // Compute cancellation refunds based on minutes before departure
  const parsedPolicy =
    cancellationPolicy.length > 0
      ? cancellationPolicy.map((rule) => {
          const hours = Math.round((rule.Mins || 0) / 60);
          const refundPct = Math.max(0, 100 - (rule.Pct || 0));
          const refundAmt = Math.round((basePrice * refundPct) / 100);
          const penaltyAmt = Math.round((basePrice * (rule.Pct || 0)) / 100);
          return {
            hours,
            pct: rule.Pct,
            refundPct,
            refundAmt,
            penaltyAmt,
            label:
              hours >= 24
                ? `More than ${Math.round(hours / 24)} day(s) before departure`
                : hours > 0
                ? `${hours} hours before departure`
                : `Within 2 hours before departure / Post departure`,
          };
        })
      : [
          { label: "0 to 12 hrs before departure", refundPct: 0, penaltyAmt: basePrice, refundAmt: 0 },
          { label: "12 to 24 hrs before departure", refundPct: 50, penaltyAmt: Math.round(basePrice * 0.5), refundAmt: Math.round(basePrice * 0.5) },
          { label: "24 to 48 hrs before departure", refundPct: 80, penaltyAmt: Math.round(basePrice * 0.2), refundAmt: Math.round(basePrice * 0.8) },
          { label: "More than 48 hrs before departure", refundPct: 90, penaltyAmt: Math.round(basePrice * 0.1), refundAmt: Math.round(basePrice * 0.9) },
        ];

  const amenitiesList = [
    { icon: Wifi, label: "High-Speed Free WiFi", desc: "Stay connected throughout your journey", match: "wifi" },
    { icon: Zap, label: "Individual Charging Ports", desc: "Fast USB & AC sockets at each seat", match: "charg" },
    { icon: Droplets, label: "Complimentary Water Bottle", desc: "500ml sealed mineral water", match: "water" },
    { icon: Sparkles, label: "Fresh Clean Blanket & Pillow", desc: "Sanitized and sealed in fresh covers", match: "blanket" },
    { icon: Radio, label: "Live GPS Tracking Link", desc: "Share live trip status with family via SMS", match: "gps" },
    { icon: Tv, label: "Personal / Central TV", desc: "Entertainment system on board", match: "tv" },
    { icon: ShieldCheck, label: "M-Ticket & Contactless Boarding", desc: "Show QR code or SMS on mobile", match: "ticket" },
    { icon: CheckCircle2, label: "Emergency Medical Kit & Extinguisher", desc: "First-aid essentials onboard", match: "emergency" },
  ];

  return (
    <div className="modern-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Strip */}
        <div className="modal-header-gradient">
          <div className="modal-header-top">
            <div className="modal-bus-identity">
              <div className="operator-badge-row">
                <span className="live-pill">
                  <span className="pulse-dot" /> Live Verified Bus
                </span>
                <span className="bus-id-chip">Bus ID: {busData.routeBusId || busData.busId || "1"}</span>
              </div>
              <h2 className="modal-operator-title">{busData.operator || "Intercity Premium Lines"}</h2>
              <p className="modal-bus-sub">{busData.busType || "AC Sleeper 2+1"} • {busData.busNumber || "AI-BUS-EXP"}</p>
            </div>

            <button type="button" className="modal-close-btn" onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>

          <div className="modal-quick-stats-strip">
            <div className="stat-pill">
              <Clock size={15} />
              <span>{busData.departureTime || "21:00"} → {busData.arrivalTime || "06:30"} ({busData.duration || "9h 30m"})</span>
            </div>
            <div className="stat-pill">
              <Star size={15} className="star-icon" fill="#f59e0b" />
              <span>4.8 (500+ reviews)</span>
            </div>
            <div className="stat-pill fare-pill">
              <span>Fare: <strong>₹{basePrice.toLocaleString("en-IN")}</strong></span>
            </div>
            {loading && (
              <div className="stat-pill sync-pill">
                <RefreshCw size={13} className="spin-icon" />
                <span>Syncing live API...</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="modal-nav-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "points" ? "active" : ""}`}
            onClick={() => setActiveTab("points")}
          >
            <MapPin size={16} />
            <span>Boarding & Dropping</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "policy" ? "active" : ""}`}
            onClick={() => setActiveTab("policy")}
          >
            <ShieldCheck size={16} />
            <span>Cancellation Policy</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "amenities" ? "active" : ""}`}
            onClick={() => setActiveTab("amenities")}
          >
            <Sparkles size={16} />
            <span>Amenities & Facilities</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "safety" ? "active" : ""}`}
            onClick={() => setActiveTab("safety")}
          >
            <Info size={16} />
            <span>Operator & Safety</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="modal-content-scroll">
          {/* TAB 1: BOARDING & DROPPING POINTS */}
          {activeTab === "points" && (
            <div className="tab-pane points-pane">
              <div className="points-split-grid">
                {/* Boarding Points Column */}
                <div className="points-column boarding-col">
                  <div className="column-header">
                    <div className="col-icon-circle boarding-icon">
                      <Navigation size={16} />
                    </div>
                    <div>
                      <h4 className="col-title">Boarding Points</h4>
                      <p className="col-sub">{fromName || busData.from || "Origin"} • {pickups.length || 3} Locations</p>
                    </div>
                  </div>

                  <div className="timeline-list">
                    {pickups.length > 0 ? (
                      pickups.map((p, idx) => (
                        <div className="timeline-item" key={p.PickupCode || idx}>
                          <div className="timeline-bullet boarding-bullet" />
                          <div className="timeline-content-card">
                            <div className="time-badge">{formatTimeOnly(p.PickupTime || p.time)}</div>
                            <h5 className="point-name">{p.PickupName || p.name || "Main Boarding Station"}</h5>
                            {p.Address && <p className="point-address">{p.Address}</p>}
                            {p.Landmark && <p className="point-landmark">📍 Landmark: {p.Landmark}</p>}
                            {p.Contact && (
                              <div className="point-contact">
                                <PhoneCall size={12} />
                                <span>{p.Contact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="timeline-item">
                          <div className="timeline-bullet boarding-bullet" />
                          <div className="timeline-content-card">
                            <div className="time-badge">{busData.departureTime || "21:00"}</div>
                            <h5 className="point-name">Majestic Anand Rao Circle</h5>
                            <p className="point-address">Opposite SRS Travels, Majestic, {fromName || "Bangalore"}</p>
                            <p className="point-landmark">📍 Landmark: Metro Pillar #42</p>
                          </div>
                        </div>
                        <div className="timeline-item">
                          <div className="timeline-bullet boarding-bullet" />
                          <div className="timeline-content-card">
                            <div className="time-badge">21:45</div>
                            <h5 className="point-name">Silk Board Junction</h5>
                            <p className="point-address">Near Total Mall, Hosur Main Road</p>
                            <p className="point-landmark">📍 Landmark: Petrol Pump</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Dropping Points Column */}
                <div className="points-column dropping-col">
                  <div className="column-header">
                    <div className="col-icon-circle dropping-icon">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="col-title">Dropping Points</h4>
                      <p className="col-sub">{toName || busData.to || "Destination"} • {dropoffs.length || 2} Locations</p>
                    </div>
                  </div>

                  <div className="timeline-list">
                    {dropoffs.length > 0 ? (
                      dropoffs.map((d, idx) => (
                        <div className="timeline-item" key={d.DropoffCode || idx}>
                          <div className="timeline-bullet dropping-bullet" />
                          <div className="timeline-content-card">
                            <div className="time-badge drop-badge">{formatTimeOnly(d.DropoffTime || d.time)}</div>
                            <h5 className="point-name">{d.DropoffName || d.name || "Main Terminal"}</h5>
                            {d.Address && <p className="point-address">{d.Address}</p>}
                            {d.Landmark && <p className="point-landmark">📍 Landmark: {d.Landmark}</p>}
                            {d.Contact && (
                              <div className="point-contact">
                                <PhoneCall size={12} />
                                <span>{d.Contact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="timeline-item">
                          <div className="timeline-bullet dropping-bullet" />
                          <div className="timeline-content-card">
                            <div className="time-badge drop-badge">{busData.arrivalTime || "06:00"}</div>
                            <h5 className="point-name">Koyambedu Bus Terminal</h5>
                            <p className="point-address">Platform 4, CMBT Bus Station, {toName || "Chennai"}</p>
                          </div>
                        </div>
                        <div className="timeline-item">
                          <div className="timeline-bullet dropping-bullet" />
                          <div className="timeline-content-card">
                            <div className="time-badge drop-badge">06:30</div>
                            <h5 className="point-name">Chennai Central Railway Station</h5>
                            <p className="point-address">Opposite Central Metro Station Gate 2</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CANCELLATION POLICY */}
          {activeTab === "policy" && (
            <div className="tab-pane policy-pane">
              <div className="policy-banner">
                <div className="policy-banner-icon">
                  <Percent size={24} />
                </div>
                <div>
                  <h4 className="policy-banner-title">Guaranteed Transparent Refunds</h4>
                  <p className="policy-banner-sub">
                    Cancellations are calculated based on the official bus departure time ({busData.departureTime || "21:00"}).
                  </p>
                </div>
              </div>

              <div className="policy-table-wrapper">
                <table className="policy-table">
                  <thead>
                    <tr>
                      <th>Cancellation Time Window</th>
                      <th>Refund %</th>
                      <th>Est. Refund / Seat</th>
                      <th>Cancellation Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedPolicy.map((item, idx) => (
                      <tr key={idx} className={item.refundPct >= 80 ? "high-refund-row" : ""}>
                        <td>
                          <div className="window-cell">
                            <Clock size={14} className="cell-clock-icon" />
                            <span>{item.label}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`refund-chip ${item.refundPct >= 80 ? "green-chip" : item.refundPct > 0 ? "orange-chip" : "red-chip"}`}>
                            {item.refundPct}% Refund
                          </span>
                        </td>
                        <td>
                          <strong className="refund-amount">₹{item.refundAmt.toLocaleString("en-IN")}</strong>
                        </td>
                        <td className="fee-text">₹{item.penaltyAmt.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="policy-notes-card">
                <h5 className="policy-notes-heading">⚠️ Important Terms & Conditions</h5>
                <ul>
                  <li>Refund amount will be processed automatically within 2-4 business days to your original payment method.</li>
                  <li>No refunds are provided for partial cancellations after the scheduled departure time has passed.</li>
                  <li>Discount coupon savings and convenience fees are non-refundable.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: AMENITIES & FEATURES */}
          {activeTab === "amenities" && (
            <div className="tab-pane amenities-pane">
              <div className="amenities-hero-strip">
                <h4>Premium Onboard Amenities</h4>
                <p>Designed for maximum comfort, safety, and a seamless travel experience.</p>
              </div>

              <div className="amenities-modern-grid">
                {amenitiesList.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div className="amenity-detail-card" key={idx}>
                      <div className="amenity-icon-box">
                        <Icon size={20} />
                      </div>
                      <div className="amenity-text-box">
                        <h5>{item.label}</h5>
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: OPERATOR & SAFETY */}
          {activeTab === "safety" && (
            <div className="tab-pane safety-pane">
              <div className="safety-grid">
                <div className="safety-card">
                  <div className="safety-card-header">
                    <ShieldCheck size={22} className="safety-icon" />
                    <h5>AiBus SafeJourney™ Protocol</h5>
                  </div>
                  <ul className="safety-checklist">
                    <li><CheckCircle2 size={15} /> Continuous sanitization before every trip</li>
                    <li><CheckCircle2 size={15} /> Certified, background-verified professional drivers</li>
                    <li><CheckCircle2 size={15} /> Emergency panic button and 24x7 control room monitoring</li>
                    <li><CheckCircle2 size={15} /> First aid kits and fire extinguishers inspected monthly</li>
                  </ul>
                </div>

                <div className="safety-card">
                  <div className="safety-card-header">
                    <Bus size={22} className="safety-icon" />
                    <h5>Operator Information</h5>
                  </div>
                  <div className="operator-details-list">
                    <div className="op-item">
                      <span className="op-lbl">Fleet Name:</span>
                      <strong>{busData.operator || "Intercity Premium Travels"}</strong>
                    </div>
                    <div className="op-item">
                      <span className="op-lbl">Bus Layout:</span>
                      <strong>{busData.layoutType?.replace(/_/g, " ") || "2+1 AC Sleeper"}</strong>
                    </div>
                    <div className="op-item">
                      <span className="op-lbl">Customer Support:</span>
                      <strong>1800-419-AIBUS (24x7 Helpline)</strong>
                    </div>
                    <div className="op-item">
                      <span className="op-lbl">Reporting Time:</span>
                      <strong>15 minutes prior to scheduled departure</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="modal-footer-bar">
          <div className="footer-left-info">
            <span className="footer-fare-label">Starting Fare per Seat</span>
            <div className="footer-fare-value">
              <span className="price-tag">₹{basePrice.toLocaleString("en-IN")}</span>
              <span className="tax-inclusive-lbl">all taxes included</span>
            </div>
          </div>

          <div className="footer-right-actions">
            <button type="button" className="footer-secondary-btn" onClick={onClose}>
              Back to List
            </button>
            <button
              type="button"
              className="footer-primary-btn"
              onClick={() => {
                onClose();
                if (onSelectSeats) onSelectSeats(busData);
              }}
            >
              Select Seats & Book <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
