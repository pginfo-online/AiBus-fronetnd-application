import { useState, useId } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  ArrowRight,
  Bus,
  Calendar,
  Percent,
  Info,
  Sparkles,
  Calculator,
  Search,
} from "lucide-react";
import "./CancellationPolicy.css";

export default function CancellationPolicy() {
  const calcFareId = useId();
  const calcWindowId = useId();
  const calcMethodId = useId();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);
  const [faqSearch, setFaqSearch] = useState("");

  // Interactive Calculator State
  const [ticketFare, setTicketFare] = useState(1000);
  const [selectedWindow, setSelectedWindow] = useState("24_plus");
  const [selectedMethod, setSelectedMethod] = useState("upi");

  // Calculator logic matching redBus standard private operator slabs
  const windowSlabs = {
    "24_plus": { label: "More than 24 hours before departure", chargePct: 10, refundPct: 90, badge: "Max Refund", badgeClass: "badge-green" },
    "12_to_24": { label: "12 to 24 hours before departure", chargePct: 20, refundPct: 80, badge: "Standard Refund", badgeClass: "badge-blue" },
    "2_to_12": { label: "2 to 12 hours before departure", chargePct: 50, refundPct: 50, badge: "Partial Refund", badgeClass: "badge-amber" },
    "under_2": { label: "Less than 2 hours before departure / Post-departure", chargePct: 100, refundPct: 0, badge: "Non-Refundable", badgeClass: "badge-red" },
  };

  const paymentModes = {
    upi: { name: "UPI (Google Pay, PhonePe, Paytm)", eta: "2 to 4 Hours", note: "Direct to linked bank account" },
    cards: { name: "Credit / Debit Cards", eta: "5 to 7 Business Days", note: "Subject to card issuing bank cycles" },
    netbanking: { name: "Net Banking", eta: "3 to 5 Business Days", note: "Direct NEFT / IMPS reversal" },
    wallet: { name: "AiBus Instant Wallet", eta: "Instant (Within 5 mins)", note: "Ready for immediate next booking" },
  };

  const activeSlab = windowSlabs[selectedWindow];
  const activeMethod = paymentModes[selectedMethod];
  const deductionAmt = Math.round((ticketFare * activeSlab.chargePct) / 100);
  const refundAmt = Math.max(0, ticketFare - deductionAmt);

  // FAQ Items identical to redBus standards
  const faqs = [
    {
      q: "How are cancellation charges calculated?",
      a: "As per industry and redBus standards, cancellation charges are strictly determined by individual bus operators (private operators and state RTCs). Charges are calculated based on the scheduled departure time of the bus from the first originating boarding point of the service, not intermediate boarding points.",
    },
    {
      q: "Can I cancel only one passenger's seat from a group booking (Partial Cancellation)?",
      a: "Yes, partial cancellation is permitted provided the specific bus operator supports it. When you initiate cancellation in 'My Bookings', you can select the specific seat(s) you wish to cancel. The cancellation charges and refund will be calculated proportionally only for the selected seats. If the operator does not permit partial cancellation, you will be notified to cancel the entire ticket.",
    },
    {
      q: "How long does it take for the refund to reflect in my account?",
      a: "Once cancelled, AiBus initiates the refund immediately. The time to reflect depends on your original payment mode: UPI transfers typically reflect within 2 to 4 hours; Net Banking takes 3 to 5 business days; Credit and Debit cards take 5 to 7 business days depending on your bank's settlement cycle. If you choose AiBus Wallet, the refund is credited instantly within 5 minutes.",
    },
    {
      q: "What happens if the bus operator cancels the trip or the bus breaks down?",
      a: "If the bus service is cancelled by the operator due to technical failure, breakdown, strikes, or adverse weather conditions, you are entitled to a 100% full refund of the base fare. In such cases, please notify our 24x7 support desk within 24 hours of the incident, and our team will verify with the operator to process your full refund immediately.",
    },
    {
      q: "What if I miss the bus because I arrived late at the boarding point?",
      a: "If you fail to board the bus on time at your designated boarding point, the ticket is classified as a 'No-Show'. In accordance with redBus and operator guidelines, no refund is admissible for missed buses. We strongly recommend arriving at your boarding point at least 15 to 30 minutes before the scheduled pickup time.",
    },
    {
      q: "Are platform convenience fees and discount coupons refundable?",
      a: "Platform convenience fees or internet handling fees charged at the time of checkout are non-refundable once the ticket is issued, as they cover the technology and payment gateway processing costs. Promotional coupons and cashback discounts applied during purchase are non-refundable and will be deducted prior to calculating the cash refund.",
    },
    {
      q: "Can I reschedule my journey instead of cancelling the ticket?",
      a: "Several bus operators support 'Free Reschedule' up to 4 to 8 hours before departure. Check your ticket details in 'My Bookings' to see if your operator supports rescheduling. If supported, you can modify your travel date or time without paying standard cancellation penalties (fare differences between buses may still apply).",
    },
    {
      q: "Does the cancellation fee apply to taxes (GST)?",
      a: "GST on passenger transportation services is recalculated based on the final retained amount. When a ticket is cancelled, the applicable refund includes a proportional refund of the tax component as governed by Indian GST rules.",
    },
    {
      q: "How do I know my cancellation has been processed successfully?",
      a: "Upon confirming cancellation on our website or app, your ticket status changes to 'CANCELLED' in real time. You will immediately receive a confirmation SMS and an email containing your Cancellation ID, refund amount breakdown, and bank reference/ARN number.",
    },
    {
      q: "What should I do if my refund hasn't arrived within the stipulated time?",
      a: "In rare cases of bank server delays or reconciliation lags, bank credit may take a little longer. You can track your refund live by sharing your ARN number with your bank, or reach out to our dedicated 24x7 helpline at 8010097706 or email cancellations@aibus.in with your Ticket Number.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="cancellation-policy-page" id="cancellation-policy-root">
      {/* 1. HERO HEADER */}
      <section className="cp-hero-section">
        <div className="cp-container">
          <div className="cp-hero-badge">
            <Sparkles size={14} />
            <span>redBus Standard Transparent Guidelines</span>
          </div>
          <h1 className="cp-hero-title">AiBus Cancellation & Refund Policy</h1>
          <p className="cp-hero-subtitle">
            Fair, transparent, and hassle-free cancellation terms. Learn how refunds are calculated,
            banking timelines, operator guidelines, and track your refunds easily.
          </p>

          <div className="cp-hero-pills">
            <div className="cp-pill">
              <ShieldCheck size={16} className="cp-pill-icon" />
              <span>Operator-Direct Slabs</span>
            </div>
            <div className="cp-pill">
              <Clock size={16} className="cp-pill-icon" />
              <span>Instant 2-4 Hr UPI Refunds</span>
            </div>
            <div className="cp-pill">
              <RefreshCw size={16} className="cp-pill-icon" />
              <span>100% Refund on Service Cancellation</span>
            </div>
            <div className="cp-pill">
              <CheckCircle2 size={16} className="cp-pill-icon" />
              <span>Partial Seat Cancellation Supported</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK JUMP NAV */}
      <nav className="cp-nav-bar" aria-label="Policy Navigation">
        <div className="cp-container cp-nav-inner">
          <a href="#overview" className="cp-nav-link">Overview</a>
          <a href="#slabs" className="cp-nav-link">Cancellation Slabs</a>
          <a href="#timelines" className="cp-nav-link">Refund Timelines</a>
          <a href="#special-cases" className="cp-nav-link">Operator Guarantees</a>
          <a href="#calculator" className="cp-nav-link">Refund Estimator</a>
          <a href="#how-to-cancel" className="cp-nav-link">How to Cancel</a>
          <a href="#faqs" className="cp-nav-link">Frequently Asked Questions</a>
        </div>
      </nav>

      <div className="cp-container cp-main-content">
        {/* 2. OVERVIEW & PLATFORM ROLE */}
        <section id="overview" className="cp-section-card">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-emerald">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">1. Platform Overview & Operator Governance</h2>
              <p className="cp-section-desc">Our operational framework follows the official redBus India aggregator standard.</p>
            </div>
          </div>

          <div className="cp-prose">
            <p>
              <strong>AiBus</strong> acts purely as an online technology facilitator and travel marketplace connecting
              travelers with licensed bus fleet operators, including private bus partners and State Road Transport
              Corporations (RTCs such as KSRTC, TSRTC, MSRTC, UPSRTC, GSRTC, etc.).
            </p>
            <div className="cp-callout cp-callout-info">
              <Info size={20} className="cp-callout-icon" />
              <div>
                <strong>Important Principle:</strong> Cancellation terms, deduction percentages, and cutoff windows are
                <strong> set and governed directly by individual bus operators</strong>, not by AiBus. Different operators
                may enforce different refund slabs depending on route, bus class (AC Sleeper vs. Non-AC Seater), and holiday seasons.
              </div>
            </div>
            <p>
              The specific cancellation policy applicable to your ticket is <em>always prominently displayed</em> on the bus
              search card, during seat selection, before final payment checkout, and printed clearly on your confirmed E-Ticket
              and SMS booking confirmation.
            </p>
          </div>
        </section>

        {/* 3. STANDARD OPERATOR CANCELLATION SLABS */}
        <section id="slabs" className="cp-section-card">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-blue">
              <Percent size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">2. Standard Cancellation Slabs & Charges</h2>
              <p className="cp-section-desc">Indicative cancellation deduction matrix practiced across major private bus operators.</p>
            </div>
          </div>

          <p className="cp-slab-intro">
            Cancellation charges are measured from the <strong>scheduled departure time of the bus from its primary originating boarding point</strong>:
          </p>

          <div className="cp-table-responsive">
            <table className="cp-table">
              <thead>
                <tr>
                  <th>Cancellation Time Window</th>
                  <th>Operator Penalty Fee</th>
                  <th>Customer Refund</th>
                  <th>Refund Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-highlight-green">
                  <td>
                    <div className="cp-window-cell">
                      <Clock size={16} className="text-emerald" />
                      <div>
                        <strong>More than 24 hours before departure</strong>
                        <span>Ample notice period</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>10% to 15%</strong> of base fare</td>
                  <td className="text-emerald font-bold">85% to 90% Refund</td>
                  <td><span className="cp-badge badge-green">Maximum Refund</span></td>
                </tr>
                <tr className="row-highlight-blue">
                  <td>
                    <div className="cp-window-cell">
                      <Clock size={16} className="text-blue" />
                      <div>
                        <strong>Between 12 to 24 hours before departure</strong>
                        <span>Standard cancellation</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>20% to 25%</strong> of base fare</td>
                  <td className="text-blue font-bold">75% to 80% Refund</td>
                  <td><span className="cp-badge badge-blue">Standard Refund</span></td>
                </tr>
                <tr className="row-highlight-amber">
                  <td>
                    <div className="cp-window-cell">
                      <Clock size={16} className="text-amber" />
                      <div>
                        <strong>Between 2 to 12 hours before departure</strong>
                        <span>Short notice cancellation</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>50%</strong> of base fare</td>
                  <td className="text-amber font-bold">50% Refund</td>
                  <td><span className="cp-badge badge-amber">Partial Refund</span></td>
                </tr>
                <tr className="row-highlight-red">
                  <td>
                    <div className="cp-window-cell">
                      <Clock size={16} className="text-red" />
                      <div>
                        <strong>Within 2 hours before departure or Post-departure</strong>
                        <span>Last minute / Bus on transit</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>100%</strong> of base fare</td>
                  <td className="text-red font-bold">0% (No Refund)</td>
                  <td><span className="cp-badge badge-red">Non-Refundable</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cp-notes-grid">
            <div className="cp-note-item">
              <strong>Government RTC Buses:</strong> State transport corporations (e.g., KSRTC, TSRTC) follow statutory state corporation bylaws, with nominal flat cancellation slabs (e.g., ₹25–₹50 or 10%–25% based on hours).
            </div>
            <div className="cp-note-item">
              <strong>Free Cancellation Add-On:</strong> If you opted for the 'Free Cancellation' badge at booking, you can cancel up to 6 hours before departure with a 100% base fare refund without any cancellation fee.
            </div>
          </div>
        </section>

        {/* 4. REFUND TIMELINES & PAYMENT MODES */}
        <section id="timelines" className="cp-section-card">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-purple">
              <CreditCard size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">3. Refund Processing Timelines & Modes</h2>
              <p className="cp-section-desc">Refunds are automatically routed back to your original source of payment.</p>
            </div>
          </div>

          <p className="cp-prose">
            Immediately upon cancellation confirmation, AiBus initiates the refund batch transfer to the banking network.
            The time taken for the funds to reflect in your bank account is governed by Reserve Bank of India (RBI) interbank clearing cycles:
          </p>

          <div className="cp-modes-grid">
            {/* Mode 1: UPI */}
            <div className="cp-mode-card">
              <div className="cp-mode-icon-box bg-emerald-light">
                <Smartphone size={24} className="text-emerald" />
              </div>
              <h3 className="cp-mode-title">UPI / VPA</h3>
              <p className="cp-mode-sub">Google Pay, PhonePe, Paytm, BHIM</p>
              <div className="cp-mode-eta">
                <Clock size={15} />
                <strong>2 to 4 Hours</strong>
              </div>
              <span className="cp-mode-tag">Fastest Method</span>
            </div>

            {/* Mode 2: Cards */}
            <div className="cp-mode-card">
              <div className="cp-mode-icon-box bg-blue-light">
                <CreditCard size={24} className="text-blue" />
              </div>
              <h3 className="cp-mode-title">Debit & Credit Cards</h3>
              <p className="cp-mode-sub">Visa, Mastercard, RuPay, Amex</p>
              <div className="cp-mode-eta">
                <Clock size={15} />
                <strong>5 to 7 Business Days</strong>
              </div>
              <span className="cp-mode-tag">Bank Settlement</span>
            </div>

            {/* Mode 3: Net Banking */}
            <div className="cp-mode-card">
              <div className="cp-mode-icon-box bg-purple-light">
                <Building2 size={24} className="text-purple" />
              </div>
              <h3 className="cp-mode-title">Net Banking</h3>
              <p className="cp-mode-sub">SBI, HDFC, ICICI, Axis & All Banks</p>
              <div className="cp-mode-eta">
                <Clock size={15} />
                <strong>3 to 5 Business Days</strong>
              </div>
              <span className="cp-mode-tag">NEFT / IMPS Reversal</span>
            </div>

            {/* Mode 4: AiBus Wallet */}
            <div className="cp-mode-card cp-mode-highlight">
              <div className="cp-mode-icon-box bg-emerald-light">
                <Wallet size={24} className="text-emerald" />
              </div>
              <h3 className="cp-mode-title">AiBus Instant Wallet</h3>
              <p className="cp-mode-sub">Internal travel credit</p>
              <div className="cp-mode-eta">
                <Sparkles size={15} />
                <strong>Instant (Within 5 Mins)</strong>
              </div>
              <span className="cp-mode-tag badge-emerald-fill">Zero Wait Time</span>
            </div>
          </div>

          <div className="cp-callout cp-callout-warning" style={{ marginTop: "24px" }}>
            <AlertTriangle size={20} className="cp-callout-icon" />
            <div>
              <strong>Bank Holidays & Weekends:</strong> Settlements through Debit/Credit cards and Net Banking do not process on national bank holidays, second/fourth Saturdays, or Sundays. Business day timelines resume on the subsequent bank working day.
            </div>
          </div>
        </section>

        {/* 5. OPERATOR CANCELLATION & SPECIAL SITUATIONS */}
        <section id="special-cases" className="cp-section-card">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-amber">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">4. Special Circumstances & 100% Refund Guarantees</h2>
              <p className="cp-section-desc">When you are protected with a complete refund under redBus standards.</p>
            </div>
          </div>

          <div className="cp-scenarios-grid">
            <div className="cp-scenario-card">
              <div className="cp-scenario-head">
                <CheckCircle2 size={20} className="text-emerald" />
                <h4>Bus Cancelled by Operator</h4>
              </div>
              <p>
                If the bus service is cancelled by the fleet operator due to operational issues, weather conditions, or vehicle unavailability, you are entitled to a <strong>100% full refund</strong> of the base fare and applicable taxes.
              </p>
            </div>

            <div className="cp-scenario-card">
              <div className="cp-scenario-head">
                <CheckCircle2 size={20} className="text-emerald" />
                <h4>Bus Breakdown Mid-Journey</h4>
              </div>
              <p>
                In the event of a mechanical breakdown where the operator fails to arrange a suitable alternative vehicle within a reasonable timeframe, a full or proportionate refund is approved after operator confirmation.
              </p>
            </div>

            <div className="cp-scenario-card">
              <div className="cp-scenario-head">
                <CheckCircle2 size={20} className="text-emerald" />
                <h4>Bus Departed Early / Changed Boarding Point</h4>
              </div>
              <p>
                If the bus left before the scheduled departure time without prior communication to the passenger, or if the pickup point was shifted without adequate notice, a 100% refund is initiated upon ticket verification.
              </p>
            </div>

            <div className="cp-scenario-card">
              <div className="cp-scenario-head">
                <AlertTriangle size={20} className="text-red" />
                <h4>Passenger No-Show (Missed Bus)</h4>
              </div>
              <p>
                If a passenger fails to reach the designated pickup location on time, the ticket is marked as a passenger No-Show. No refund is granted for passenger-delayed missed departures.
              </p>
            </div>
          </div>
        </section>

        {/* 6. INTERACTIVE REFUND ESTIMATOR */}
        <section id="calculator" className="cp-section-card cp-calculator-section">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-emerald">
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">5. Interactive Refund & Deduction Estimator</h2>
              <p className="cp-section-desc">Estimate your cancellation fee and net refund based on your ticket fare and time window.</p>
            </div>
          </div>

          <div className="cp-calculator-wrapper">
            <div className="cp-calc-inputs">
              {/* Input 1: Ticket Fare */}
              <div className="cp-form-group">
                <label htmlFor={calcFareId} className="cp-label">Ticket Base Fare (₹)</label>
                <div className="cp-input-prefix-box">
                  <span className="cp-currency-symbol">₹</span>
                  <input
                    id={calcFareId}
                    type="number"
                    min="100"
                    max="10000"
                    step="50"
                    value={ticketFare}
                    onChange={(e) => setTicketFare(Math.max(0, Number(e.target.value)))}
                    className="cp-input-number"
                  />
                </div>
                <div className="cp-quick-amounts">
                  {[500, 800, 1200, 1800, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`cp-quick-btn ${ticketFare === amt ? "active" : ""}`}
                      onClick={() => setTicketFare(amt)}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input 2: Time Window */}
              <div className="cp-form-group">
                <label htmlFor={calcWindowId} className="cp-label">When are you cancelling?</label>
                <select
                  id={calcWindowId}
                  value={selectedWindow}
                  onChange={(e) => setSelectedWindow(e.target.value)}
                  className="cp-select"
                >
                  <option value="24_plus">&gt; 24 hrs before departure (10% fee)</option>
                  <option value="12_to_24">12 to 24 hrs before departure (20% fee)</option>
                  <option value="2_to_12">2 to 12 hrs before departure (50% fee)</option>
                  <option value="under_2">&lt; 2 hrs before departure (100% fee / No Refund)</option>
                </select>
              </div>

              {/* Input 3: Payment Method */}
              <div className="cp-form-group">
                <label htmlFor={calcMethodId} className="cp-label">Original Payment Method</label>
                <select
                  id={calcMethodId}
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="cp-select"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm) - 2 to 4 hrs</option>
                  <option value="wallet">AiBus Wallet - Instant (5 Mins)</option>
                  <option value="cards">Debit / Credit Card - 5 to 7 Days</option>
                  <option value="netbanking">Net Banking - 3 to 5 Days</option>
                </select>
              </div>
            </div>

            {/* Output Display Card */}
            <div className="cp-calc-result-card">
              <div className="cp-result-header">
                <span className="cp-result-subtitle">Estimated Breakdown</span>
                <span className={`cp-badge ${activeSlab.badgeClass}`}>{activeSlab.badge}</span>
              </div>

              <div className="cp-result-main">
                <div className="cp-result-row">
                  <span>Gross Ticket Fare</span>
                  <strong>₹{ticketFare.toLocaleString("en-IN")}</strong>
                </div>
                <div className="cp-result-row text-red">
                  <span>Cancellation Deduction ({activeSlab.chargePct}%)</span>
                  <strong>- ₹{deductionAmt.toLocaleString("en-IN")}</strong>
                </div>

                <div className="cp-result-divider" />

                <div className="cp-result-total">
                  <div>
                    <span className="cp-total-label">Estimated Refund</span>
                    <p className="cp-total-sub">{activeSlab.refundPct}% of Base Fare</p>
                  </div>
                  <span className="cp-total-amount">₹{refundAmt.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="cp-result-footer">
                <div className="cp-footer-row">
                  <Clock size={16} className="text-emerald" />
                  <div>
                    <span className="cp-footer-label">Expected Credit Time</span>
                    <strong>{activeMethod.eta}</strong>
                  </div>
                </div>
                <p className="cp-footer-note">{activeMethod.note}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. HOW TO CANCEL - 4 STEPS */}
        <section id="how-to-cancel" className="cp-section-card">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-blue">
              <RefreshCw size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">6. How to Cancel Your Ticket Online</h2>
              <p className="cp-section-desc">Cancel tickets directly from your phone or browser in 4 simple steps.</p>
            </div>
          </div>

          <div className="cp-steps-grid">
            <div className="cp-step-card">
              <div className="cp-step-number">1</div>
              <h4>Go to My Bookings</h4>
              <p>Navigate to <strong>My Bookings</strong> in the top menu or on the mobile app. You can also click the button below.</p>
            </div>

            <div className="cp-step-card">
              <div className="cp-step-number">2</div>
              <h4>Select Your Ticket</h4>
              <p>Choose the upcoming confirmed bus booking you wish to cancel and click on <strong>Cancel Ticket</strong>.</p>
            </div>

            <div className="cp-step-card">
              <div className="cp-step-number">3</div>
              <h4>Review Refund Details</h4>
              <p>Select which seat(s) to cancel. Preview the exact cancellation charges and net refund amount computed by the provider.</p>
            </div>

            <div className="cp-step-card">
              <div className="cp-step-number">4</div>
              <h4>Confirm & Receive Funds</h4>
              <p>Confirm the cancellation. Your ticket will be cancelled and refund processed immediately with instant SMS confirmation.</p>
            </div>
          </div>

          <div className="cp-cta-banner">
            <div>
              <h3 className="cp-cta-title">Need to cancel an existing bus booking?</h3>
              <p className="cp-cta-sub">Log in to view your tickets and preview the live refund eligibility for your journey.</p>
            </div>
            <Link to="/my-bookings" className="cp-btn cp-btn-primary">
              <span>Go to My Bookings</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* 8. FREQUENTLY ASKED QUESTIONS (FAQS) */}
        <section id="faqs" className="cp-section-card">
          <div className="cp-section-header">
            <div className="cp-header-icon bg-purple">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="cp-section-title">7. Frequently Asked Questions</h2>
              <p className="cp-section-desc">Everything you need to know about cancellations, refunds, and bus policies.</p>
            </div>
          </div>

          {/* Search Bar for FAQs */}
          <div className="cp-faq-search-box">
            <Search size={18} className="cp-faq-search-icon" />
            <input
              type="text"
              placeholder="Search frequently asked questions (e.g. UPI, partial cancel, breakdown)..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="cp-faq-search-input"
            />
          </div>

          <div className="cp-accordion">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`cp-accordion-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    className="cp-accordion-trigger"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className="cp-faq-question">{faq.q}</span>
                    <span className="cp-faq-icon">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="cp-accordion-content">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="cp-empty-faq">
                <Info size={24} />
                <p>No matching questions found for "{faqSearch}". Please reach out to our 24x7 support desk below.</p>
              </div>
            )}
          </div>
        </section>

        {/* 9. CUSTOMER SUPPORT & ESCALATION CONTACT */}
        <section className="cp-support-card">
          <div className="cp-support-inner">
            <div className="cp-support-icon-circle">
              <Phone size={28} />
            </div>
            <div className="cp-support-details">
              <h3 className="cp-support-title">Still have questions or facing an emergency?</h3>
              <p className="cp-support-desc">
                Our customer care grievance officers are available 24 hours a day, 7 days a week to assist you with cancellation disputes, operator delays, or refund status tracking.
              </p>
              <div className="cp-support-links">
                <a href="tel:8010097706" className="cp-support-btn">
                  <Phone size={16} />
                  <span>Call 24x7 Helpline: <strong>8010097706</strong></span>
                </a>
                <a href="mailto:cancellations@aibus.in" className="cp-support-btn">
                  <Mail size={16} />
                  <span>Email: <strong>cancellations@aibus.in</strong></span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
