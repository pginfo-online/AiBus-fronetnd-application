import { useState } from "react";

function EcoTravelModal({ isOpen, onClose, onSearchBuses }) {
  const [distanceKm, setDistanceKm] = useState(280);

  if (!isOpen) return null;

  // CO2 calculation constants (approximate kg CO2 per passenger km)
  // Average petrol/diesel solo car: ~0.171 kg CO2/km
  // Modern intercity express bus: ~0.032 kg CO2/passenger-km
  const carCO2 = (distanceKm * 0.171).toFixed(1);
  const busCO2 = (distanceKm * 0.032).toFixed(1);
  const savedCO2 = (carCO2 - busCO2).toFixed(1);
  const treesEquivalent = (savedCO2 / 1.8).toFixed(1); // approx 1 tree absorbs ~1.8 kg CO2 per month

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container eco-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge-icon badge-green">🌱</span>
            <div>
              <h3>Eco-Friendly Travel with AiBus</h3>
              <p>Choosing bus travel lowers your carbon footprint and protects our planet.</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Key Impact Metrics Grid */}
          <div className="eco-stats-grid">
            <div className="eco-stat-card">
              <span className="eco-stat-icon">📉</span>
              <strong className="eco-stat-number">82% Less</strong>
              <span className="eco-stat-label">CO2 emissions compared to driving a solo car</span>
            </div>
            <div className="eco-stat-card">
              <span className="eco-stat-icon">⚡</span>
              <strong className="eco-stat-number">50+ EV Buses</strong>
              <span className="eco-stat-label">Expanding zero-emission fleet across intercity routes</span>
            </div>
            <div className="eco-stat-card">
              <span className="eco-stat-icon">🌲</span>
              <strong className="eco-stat-number">25,000+</strong>
              <span className="eco-stat-label">Trees planted through passenger green points</span>
            </div>
            <div className="eco-stat-card">
              <span className="eco-stat-icon">🎟️</span>
              <strong className="eco-stat-number">100% Digital</strong>
              <span className="eco-stat-label">Paperless QR m-tickets saving tons of paper daily</span>
            </div>
          </div>

          {/* Interactive Carbon Savings Calculator */}
          <div className="carbon-calculator-card">
            <div className="calc-header">
              <div>
                <h4 className="calc-title">🌱 Your Carbon Footprint Calculator</h4>
                <p className="calc-subtitle">
                  Slide your planned journey distance to see how much CO2 you will save by taking a bus:
                </p>
              </div>
              <span className="distance-badge">{distanceKm} km</span>
            </div>

            <div className="slider-wrapper">
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="distance-slider"
              />
              <div className="slider-labels">
                <span>50 km (Short trip)</span>
                <span>500 km</span>
                <span>1,000 km (Long haul)</span>
              </div>
            </div>

            <div className="calc-results-comparison">
              <div className="comparison-box car-box">
                <span className="box-title">Solo Car Ride</span>
                <span className="emission-val">{carCO2} kg</span>
                <span className="emission-desc">CO2 emissions</span>
              </div>

              <div className="comparison-divider">vs</div>

              <div className="comparison-box bus-box">
                <span className="box-title">AiBus Journey</span>
                <span className="emission-val green-text">{busCO2} kg</span>
                <span className="emission-desc">CO2 emissions</span>
              </div>

              <div className="comparison-box saved-box">
                <span className="box-title">You Save</span>
                <span className="emission-val hero-green">{savedCO2} kg</span>
                <span className="emission-desc">≈ {treesEquivalent} trees monthly absorption</span>
              </div>
            </div>
          </div>

          {/* Green Commitments */}
          <div className="eco-commitments-section">
            <h4>Our Green Planet Commitments</h4>
            <div className="commitments-list">
              <div className="commitment-item">
                <span className="commit-icon">🍃</span>
                <div>
                  <strong>1 Ticket = 1 Green Point</strong>
                  <p>Every booking contributes towards afforestation projects in India.</p>
                </div>
              </div>
              <div className="commitment-item">
                <span className="commit-icon">🔋</span>
                <div>
                  <strong>EV & Clean Hybrid Fleet</strong>
                  <p>Transitioning 60% of our fleet to electric and hybrid tech by 2027.</p>
                </div>
              </div>
              <div className="commitment-item">
                <span className="commit-icon">♻️</span>
                <div>
                  <strong>Zero-Plastic Policy</strong>
                  <p>Encouraging biodegradable water bottles and recycling bins at terminals.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <p className="footer-note">🌍 Every shared journey is a step toward a cleaner tomorrow.</p>
          <button
            type="button"
            className="action-btn btn-solid-green"
            onClick={() => {
              onClose();
              if (onSearchBuses) onSearchBuses();
            }}
          >
            Travel Green - Search Buses &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export default EcoTravelModal;
