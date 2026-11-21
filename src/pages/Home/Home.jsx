import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Globe,
  Percent,
  ShieldCheck,
  Headphones,
  Navigation,
  Bus,
  Leaf,
  Users,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Wind,
  Zap,
  Sparkles,
  Radio,
  LifeBuoy,
  Copy,
  Check,
  Tag,
  Clock,
} from "lucide-react";
import SearchBox from "../../components/SearchBox/SearchBox";
import OffersModal from "../../components/PopularOffers/OffersModal";
import offersService from "../../services/offersService";
import "./Home.css";

const CAROUSEL_SLIDES = [
  {
    id: "luxury-sleeper-fleet",
    tag: "India's Flagship Fleet",
    title: "Redefining Luxury Sleeper",
    highlight: "Luxury Sleeper",
    subtitle: "Custom-crafted private berths, climate-controlled cabins, ambient reading suites, and whisper-quiet suspension.",
    image: "/images/bus_luxury.jpg",
    accent: "#F06A38",
    routeBadge: "AiBus Black Executive",
    stats: "40+ Express Routes",
  },
  {
    id: "city-express-highways",
    tag: "High-Speed Connect",
    title: "Direct Intercity Highways",
    highlight: "Intercity",
    subtitle: "Punctual departures connecting financial hubs and metro capitals with non-stop express highway lanes.",
    image: "/hero/city-bus.jpg",
    accent: "#38BDF8",
    routeBadge: "Metro Highway Lines",
    stats: "99.4% On-Time Record",
  },
  {
    id: "panoramic-mountains",
    tag: "Scenic Mountain Passes",
    title: "Panoramic Horizon Journeys",
    highlight: "Horizon",
    subtitle: "Breathtaking vistas across misty mountain passes, coastal routes, and golden sunrise corridors in ultimate comfort.",
    image: "/hero/adventure-bus.jpg",
    accent: "#F59E0B",
    routeBadge: "Scenic Express",
    stats: "1000+ Verified Routes",
  },
  {
    id: "first-class-cabin",
    tag: "Ultra-Comfort Interiors",
    title: "First Class Ergonomic Recliners",
    highlight: "First Class",
    subtitle: "Supple Italian leather seating, high-speed onboard charging, sanitised bedding, and 24/7 telematics tracking.",
    image: "/images/leather_interior.jpg",
    accent: "#34D399",
    routeBadge: "Gold Class Fleet",
    stats: "Live GPS Telematics",
  },
];

const POPULAR_ROUTES = [
  {
    id: 1,
    from: "Mumbai",
    to: "Pune",
    fromId: "mumbai",
    toId: "pune",
    price: "₹350",
    image: "/images/mumbai.jpg",
  },
  {
    id: 2,
    from: "Bangalore",
    to: "Chennai",
    fromId: "bangalore",
    toId: "chennai",
    price: "₹450",
    image: "/images/bangalore.jpg",
  },
  {
    id: 3,
    from: "Delhi",
    to: "Jaipur",
    fromId: "delhi",
    toId: "jaipur",
    price: "₹500",
    image: "/images/delhi.jpg",
  },
  {
    id: 4,
    from: "Hyderabad",
    to: "Bangalore",
    fromId: "hyderabad",
    toId: "bangalore",
    price: "₹650",
    image: "/images/hyderabad.jpg",
  },
  {
    id: 5,
    from: "Ahmedabad",
    to: "Udaipur",
    fromId: "ahmedabad",
    toId: "udaipur",
    price: "₹600",
    image: "/images/udaipur.jpg",
  },
];

const BUS_TYPES = [
  {
    id: "seater",
    title: "Seater",
    desc: "Budget-friendly and comfortable",
    image: "/images/bus_seater.jpg",
  },
  {
    id: "sleeper",
    title: "Sleeper",
    desc: "Relax and travel overnight",
    image: "/images/sleeper_bus.jpg",
  },
  {
    id: "ac",
    title: "AC Buses",
    desc: "Cool and comfortable for long journeys",
    image: "/images/leather_interior.jpg",
  },
  {
    id: "luxury",
    title: "Luxury",
    desc: "Premium travel with extra comfort",
    image: "/images/bus_luxury.jpg",
  },
];

const COUPON_OFFERS = [
  {
    id: "aibus100",
    code: "AIBUS100",
    title: "Flat ₹100 OFF",
    desc: "Valid on all AC and Sleeper express bookings across India",
    minSpend: "Min. spend ₹500",
    validTill: "Valid till 30 Nov",
    tag: "Most Popular",
    color: "#D95325",
    bgGradient: "linear-gradient(135deg, #FFF6F0 0%, #FFE9DF 100%)",
    accentBorder: "rgba(217, 83, 37, 0.35)",
    discountBadge: "SAVE ₹100",
  },
  {
    id: "firstbus",
    code: "FIRSTBUS",
    title: "Flat 15% OFF",
    desc: "Welcome discount for all new travelers on their first route",
    minSpend: "No min. order required",
    validTill: "New Users Only",
    tag: "Welcome Gift",
    color: "#2563EB",
    bgGradient: "linear-gradient(135deg, #F0F6FF 0%, #DEECFF 100%)",
    accentBorder: "rgba(37, 99, 235, 0.35)",
    discountBadge: "UP TO ₹150",
  },
  {
    id: "weekend20",
    code: "WEEKEND20",
    title: "Weekend 20% OFF",
    desc: "Friday to Sunday departures for quick getaways and vacations",
    minSpend: "Min. spend ₹700",
    validTill: "Fri - Sun Travel",
    tag: "Weekend Special",
    color: "#D97706",
    bgGradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    accentBorder: "rgba(217, 119, 6, 0.35)",
    discountBadge: "20% OFF",
  },
  {
    id: "return50",
    code: "RETURN50",
    title: "Round Trip ₹50 OFF",
    desc: "Book round-trip journey tickets together and save instantly",
    minSpend: "Round trip tickets",
    validTill: "Instant Cashback",
    tag: "Double Journey",
    color: "#059669",
    bgGradient: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
    accentBorder: "rgba(5, 150, 105, 0.35)",
    discountBadge: "INSTANT ₹50",
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya S.",
    quote: "Smooth booking and comfortable journey!",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    rating: 5,
  },
  {
    id: 2,
    name: "Rahul M.",
    quote: "On time, clean buses and great service.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    rating: 5,
  },
  {
    id: 3,
    name: "Neha K.",
    quote: "Best travel experience at affordable prices.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    rating: 5,
  },
];

function Home() {
  const navigate = useNavigate();
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [couponsList, setCouponsList] = useState(COUPON_OFFERS);

  useEffect(() => {
    let isMounted = true;
    offersService
      .getOffers()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const colors = [
            { color: "#D95325", bgGradient: "linear-gradient(135deg, #FFF6F0 0%, #FFE9DF 100%)", accentBorder: "rgba(217, 83, 37, 0.35)" },
            { color: "#2563EB", bgGradient: "linear-gradient(135deg, #F0F6FF 0%, #DEECFF 100%)", accentBorder: "rgba(37, 99, 235, 0.35)" },
            { color: "#059669", bgGradient: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)", accentBorder: "rgba(5, 150, 105, 0.35)" },
            { color: "#7C3AED", bgGradient: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", accentBorder: "rgba(124, 58, 237, 0.35)" },
          ];
          const enriched = data.slice(0, 4).map((c, i) => ({
            id: c.id || c.code,
            code: c.code,
            title: c.title,
            desc: c.description || c.subtitle,
            minSpend: c.subtitle || (c.minOrderValue ? `Min. spend ₹${c.minOrderValue}` : "No min. order"),
            validTill: c.formattedExpiry || "Active today",
            tag: c.category || "Hot Deal",
            discountBadge: c.discountBadge || (c.type === "PERCENTAGE" ? `${c.value}% OFF` : `₹${c.value} OFF`),
            ...colors[i % colors.length],
          }));
          setCouponsList(enriched);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCoupon = (code, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2200);
  };

  useEffect(() => {
    const handleOpen = () => setShowOffersModal(true);
    window.addEventListener("openOffersModal", handleOpen);
    return () => window.removeEventListener("openOffersModal", handleOpen);
  }, []);

  // Smooth auto-play carousel background slider every 5.5s (pauses on hover)
  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHeroHovered]);

  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Swipe detection threshold
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    setTouchEndX(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNextHero();
    } else if (isRightSwipe) {
      handlePrevHero();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleNextHero = () => {
    setActiveHeroIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const handlePrevHero = () => {
    setActiveHeroIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  const scrollToSearch = () => {
    const el = document.getElementById("bus-search-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToBusTypes = () => {
    const el = document.getElementById("bus-types-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleRouteClick = (route) => {
    const today = new Date().toISOString().split("T")[0];
    const params = new URLSearchParams({
      fromName: route.from,
      toName: route.to,
      date: today,
    });
    navigate(`/search?${params.toString()}`);
  };

  const handleNextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <main className="ogl-home-page">
      {/* =======================================================
          1. FULL-WIDTH HERO CAROUSEL SLIDER (SWIPEABLE & FULL-SCREEN)
          ======================================================= */}
      <section
        className={`ogl-fullwidth-hero ${isDragging ? "is-dragging" : ""}`}
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => {
          setIsHeroHovered(false);
          if (isDragging) onTouchEnd();
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onTouchStart}
        onMouseMove={(e) => {
          if (isDragging) onTouchMove(e);
        }}
        onMouseUp={onTouchEnd}
        aria-label="Featured Travel Destinations Carousel"
      >
        {/* Full-bleed Background Images & Video with Smooth Cross-fade and Ken-Burns animation */}
        <div className="hero-carousel-backgrounds">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`hero-bg-slide ${activeHeroIndex === idx ? "active" : ""}`}
              aria-hidden={activeHeroIndex !== idx}
            >
              {slide.video ? (
                <video
                  src={slide.video}
                  poster={slide.image}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="hero-bg-img hero-bg-video"
                />
              ) : (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="hero-bg-img"
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              )}
              <div className="hero-bg-overlay" />
            </div>
          ))}
        </div>

        {/* Carousel Content Container */}
        <div className="ogl-hero-inner fullwidth">
          <div className="ogl-hero-left">
            <div className="ogl-hero-tag-wrap">
              <span className="ogl-hero-tag">
                <span className="tag-flourish">~</span> {CAROUSEL_SLIDES[activeHeroIndex].tag} <span className="tag-flourish">~</span>
              </span>
              <span className="ogl-hero-badge-pill">
                {CAROUSEL_SLIDES[activeHeroIndex].routeBadge}
              </span>
            </div>

            <h1 className="ogl-hero-title">
              {CAROUSEL_SLIDES[activeHeroIndex].title.split(CAROUSEL_SLIDES[activeHeroIndex].highlight)[0]}
              <span
                className="ogl-title-highlight"
                style={{ color: CAROUSEL_SLIDES[activeHeroIndex].accent }}
              >
                {CAROUSEL_SLIDES[activeHeroIndex].highlight}
              </span>
              {CAROUSEL_SLIDES[activeHeroIndex].title.split(CAROUSEL_SLIDES[activeHeroIndex].highlight)[1]}
            </h1>

            <p className="ogl-hero-sub">
              {CAROUSEL_SLIDES[activeHeroIndex].subtitle}
            </p>

            <div className="ogl-hero-cta-wrap">
              <button
                type="button"
                className="ogl-hero-btn"
                onClick={scrollToSearch}
              >
                <span>Book Your Journey</span>
                <ArrowRight size={18} strokeWidth={2.4} />
              </button>
            </div>

            {/* Handwritten Doodle in the Hero */}
            <div className="ogl-hero-doodle">
              <span className="doodle-text">Good Journeys,</span>
              <span className="doodle-text">Brighter Days ♡</span>
              <div className="doodle-sparkle">✦</div>
            </div>
          </div>

          {/* Right Column: Editorial Fleet Preview with live stats and thumbnail switch */}
          <div className="ogl-hero-right-glass">
            <div className="glass-preview-card">
              <div className="glass-card-header">
                <span className="glass-card-num">0{activeHeroIndex + 1} &mdash; 0{CAROUSEL_SLIDES.length}</span>
                <span className="glass-live-indicator"><span className="pulse-dot" /> {CAROUSEL_SLIDES[activeHeroIndex].stats || "LIVE FLEET"}</span>
              </div>
              <div className="glass-card-badge-row">
                <span className="glass-pill-highlight">{CAROUSEL_SLIDES[activeHeroIndex].routeBadge}</span>
              </div>
              <h3 className="glass-card-title">{CAROUSEL_SLIDES[activeHeroIndex].title}</h3>
              <p className="glass-card-desc">{CAROUSEL_SLIDES[activeHeroIndex].subtitle}</p>

              {/* Interactive thumbnail strip with active indicator */}
              <div className="glass-thumbnails-row">
                {CAROUSEL_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`glass-thumb-btn ${activeHeroIndex === idx ? "active" : ""}`}
                    onClick={() => setActiveHeroIndex(idx)}
                    aria-label={`Slide ${idx + 1}: ${slide.title}`}
                  >
                    <img src={slide.image} alt={slide.title} />
                    <span className="thumb-idx">0{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Floating Nav Arrows */}
        <button
          type="button"
          className="hero-arrow-btn left"
          onClick={handlePrevHero}
          aria-label="Previous slide"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="hero-arrow-btn right"
          onClick={handleNextHero}
          aria-label="Next slide"
        >
          <ChevronRight size={22} />
        </button>

        {/* Bottom Slide Indicators Bar with Progress Bars */}
        <div className="hero-carousel-pagination">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              className={`pagination-tab ${activeHeroIndex === idx ? "active" : ""}`}
              onClick={() => setActiveHeroIndex(idx)}
            >
              <div className="pagination-tab-meta">
                <span className="tab-number">0{idx + 1}</span>
                <span className="tab-name">{slide.tag}</span>
              </div>
              <div className="tab-progress-track">
                <div
                  className={`tab-progress-bar ${activeHeroIndex === idx && !isHeroHovered ? "animating" : ""}`}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =======================================================
          2. FLOATING SEARCH BOX CARD
          ======================================================= */}
      <section className="ogl-floating-search-section">
        <div className="ogl-search-shell">
          <SearchBox layout="hero" />
        </div>
      </section>

      {/* =======================================================
          3. EXCLUSIVE OFFERS & COUPONS SECTION (REPLACED FEATURE BAR)
          ======================================================= */}
      <section className="ogl-section ogl-coupons-section" id="offers-and-coupons">
        <div className="ogl-coupons-header">
          <div className="ogl-coupons-header-left">
            <div className="ogl-coupons-badge">
              <Sparkles size={16} />
              <span>LIMITED TIME DEALS</span>
            </div>
            <h2 className="ogl-coupons-title">
              Exclusive Offers <span className="highlight-script">&amp; Coupons</span>
            </h2>
            <p className="ogl-coupons-sub">
              Apply these promo codes at checkout for instant cash discounts on your bookings.
            </p>
          </div>

          <button
            type="button"
            className="ogl-coupons-view-all-btn"
            onClick={() => navigate("/offers")}
          >
            <span>View All Deals</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Dynamic Coupon Cards Grid with modern luxury styling & copy animation */}
        <div className="ogl-coupons-grid">
          {couponsList.map((coupon, idx) => {
            const isCopied = copiedCoupon === coupon.code;
            return (
              <div
                key={coupon.id}
                className="ogl-coupon-card"
                style={{
                  "--accent-color": coupon.color,
                  "--card-bg": coupon.bgGradient,
                  "--card-border": coupon.accentBorder,
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {/* Decorative cutouts on coupon ticket edges */}
                <div className="coupon-notch notch-left" />
                <div className="coupon-notch notch-right" />

                <div className="coupon-card-top">
                  <div className="coupon-tags-row">
                    <span className="coupon-pill-tag" style={{ color: coupon.color }}>
                      <Tag size={12} />
                      {coupon.tag}
                    </span>
                    <span className="coupon-discount-badge" style={{ backgroundColor: coupon.color }}>
                      {coupon.discountBadge}
                    </span>
                  </div>

                  <h3 className="coupon-title">{coupon.title}</h3>
                  <p className="coupon-desc">{coupon.desc}</p>
                </div>

                <div className="coupon-divider">
                  <div className="coupon-dash-line" />
                </div>

                <div className="coupon-card-bottom">
                  <div className="coupon-meta-col">
                    <span className="coupon-min-spend">{coupon.minSpend}</span>
                    <span className="coupon-validity">
                      <Clock size={11} />
                      {coupon.validTill}
                    </span>
                  </div>

                  {/* Copy Coupon Action Button with micro-animation */}
                  <button
                    type="button"
                    className={`coupon-copy-btn ${isCopied ? "copied" : ""}`}
                    onClick={(e) => handleCopyCoupon(coupon.code, e)}
                    aria-label={`Copy coupon code ${coupon.code}`}
                  >
                    <span className="coupon-code-text">{coupon.code}</span>
                    <span className="coupon-copy-icon">
                      {isCopied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
                    </span>
                    <span className="coupon-tooltip">{isCopied ? "Copied!" : "Click to copy"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =======================================================
          4. POPULAR ROUTES
          ======================================================= */}
      <section className="ogl-section ogl-routes-section">
        <div className="ogl-section-header">
          <div className="ogl-header-left">
            <div className="ogl-section-icon-badge">
              <Navigation size={18} />
            </div>
            <div>
              <h2 className="ogl-section-title">Popular Routes</h2>
              <p className="ogl-section-sub">Choose from top destinations across India</p>
            </div>
          </div>

          <button
            type="button"
            className="ogl-view-all-link"
            onClick={scrollToSearch}
          >
            <span>View All Routes</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="ogl-routes-grid">
          {POPULAR_ROUTES.map((route) => (
            <div
              key={route.id}
              className="ogl-route-card"
              onClick={() => handleRouteClick(route)}
              role="button"
              tabIndex={0}
            >
              <img src={route.image} alt={`${route.from} to ${route.to}`} className="ogl-route-img" />
              <div className="ogl-route-overlay">
                <div className="ogl-route-content">
                  <div className="ogl-route-cities">
                    <span className="route-from">{route.from}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-to">{route.to}</span>
                  </div>
                  <span className="ogl-route-price">From {route.price}</span>
                </div>
                <button type="button" className="ogl-route-action-btn" aria-label="Book this route">
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =======================================================
          5. MORE THAN JUST A TICKET (Experience + Bento Grid)
          ======================================================= */}
      <section className="ogl-section ogl-experience-section">
        <div className="ogl-experience-inner">
          {/* Left Column: Heading, Subtitle, Stats */}
          <div className="ogl-exp-left">
            <span className="ogl-exp-tag">~ TRAVEL EXPERIENCE ~</span>
            <h2 className="ogl-exp-title">More Than Just a Ticket</h2>
            <p className="ogl-exp-sub">
              Modern buses, premium seating and a safer travel experience for a better tomorrow.
            </p>

            <button type="button" className="ogl-exp-btn" onClick={scrollToBusTypes}>
              <span>Explore Bus Types</span>
              <ArrowRight size={16} />
            </button>

            {/* 2x2 Stats Grid */}
            <div className="ogl-stats-grid">
              <div className="ogl-stat-item">
                <div className="ogl-stat-icon-wrap">
                  <Users size={20} />
                </div>
                <div>
                  <span className="ogl-stat-num">10K+</span>
                  <span className="ogl-stat-label">Happy Travellers</span>
                </div>
              </div>

              <div className="ogl-stat-item">
                <div className="ogl-stat-icon-wrap">
                  <Star size={20} />
                </div>
                <div>
                  <span className="ogl-stat-num">4.8 ★</span>
                  <span className="ogl-stat-label">Average Rating</span>
                </div>
              </div>

              <div className="ogl-stat-item">
                <div className="ogl-stat-icon-wrap">
                  <MapPin size={20} />
                </div>
                <div>
                  <span className="ogl-stat-num">1000+</span>
                  <span className="ogl-stat-label">Routes</span>
                </div>
              </div>

              <div className="ogl-stat-item">
                <div className="ogl-stat-icon-wrap">
                  <Headphones size={20} />
                </div>
                <div>
                  <span className="ogl-stat-num">24/7</span>
                  <span className="ogl-stat-label">Customer Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bento Grid Collage */}
          <div className="ogl-bento-grid">
            {/* Tile 1: Scenic Routes (Top Left, Wide) */}
            <div className="ogl-bento-tile bento-tile-scenic">
              <img src="/images/scenic_bus.jpg" alt="Scenic Routes" className="bento-img" />
              <div className="bento-gradient-overlay">
                <span className="bento-badge-text">Scenic Routes</span>
                <h4 className="bento-title-text">Unforgettable Journeys</h4>
              </div>
            </div>

            {/* Tile 2: Safer & Greener Tomorrow (Top Right, Mint Card) */}
            <div className="ogl-bento-tile bento-tile-green">
              <div className="bento-green-icon">
                <Leaf size={22} />
              </div>
              <h4 className="bento-green-title">A Safer & Greener Tomorrow</h4>
              <p className="bento-green-sub">
                Comfort for you. A better tomorrow for all.
              </p>
              <button type="button" className="bento-green-btn" aria-label="Learn about eco travel">
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Tile 3: Travel in Comfort (Bottom Left) */}
            <div className="ogl-bento-tile bento-tile-comfort">
              <img src="/images/leather_interior.jpg" alt="Travel in Comfort" className="bento-img" />
              <div className="bento-gradient-overlay">
                <h4 className="bento-title-text">Travel in Comfort</h4>
              </div>
            </div>

            {/* Tile 4: Real People, Real Journeys (Bottom Right) */}
            <div className="ogl-bento-tile bento-tile-people">
              <img src="/images/traveller_girl.jpg" alt="Real People, Real Journeys" className="bento-img" />
              <div className="bento-gradient-overlay">
                <span className="bento-badge-text">Real People</span>
                <h4 className="bento-title-text">Real Journeys</h4>
              </div>
              <button type="button" className="bento-white-btn" aria-label="Traveller stories">
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================
          6. OUR BUS TYPES
          ======================================================= */}
      <section className="ogl-section ogl-bustypes-section" id="bus-types-section">
        <div className="ogl-section-header">
          <div className="ogl-header-left">
            <div className="ogl-section-icon-badge">
              <Bus size={18} />
            </div>
            <div>
              <h2 className="ogl-section-title">Our Bus Types</h2>
              <p className="ogl-section-sub">Choose the travel style that fits you</p>
            </div>
          </div>

          <button type="button" className="ogl-view-all-link" onClick={scrollToSearch}>
            <span>View All</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="ogl-bustypes-grid">
          {BUS_TYPES.map((bt) => (
            <div
              key={bt.id}
              className="ogl-bustype-card"
              onClick={scrollToSearch}
              role="button"
              tabIndex={0}
            >
              <div className="bustype-img-wrap">
                <img src={bt.image} alt={bt.title} className="bustype-img" />
              </div>
              <div className="bustype-footer">
                <div className="bustype-info">
                  <h4 className="bustype-title">{bt.title}</h4>
                  <p className="bustype-desc">{bt.desc}</p>
                </div>
                <button type="button" className="bustype-action-btn" aria-label={`Select ${bt.title}`}>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =======================================================
          7. ONBOARD AMENITIES (Dark Green Curved Banner)
          ======================================================= */}
      <section className="ogl-section ogl-amenities-section">
        <div className="ogl-amenities-banner">
          {/* Left: Amenities Grid */}
          <div className="ogl-amenities-left">
            <div className="amenities-header">
              <div className="amenities-badge-icon">
                <Navigation size={18} />
              </div>
              <div>
                <h2 className="amenities-title">Onboard Amenities</h2>
                <p className="amenities-sub">Everything you need for a comfortable journey</p>
              </div>
            </div>

            <div className="amenities-icons-grid">
              <div className="amenity-item">
                <div className="amenity-icon-circle">
                  <Wind size={20} />
                </div>
                <span className="amenity-name">Reclining Seats</span>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-circle">
                  <Sparkles size={20} />
                </div>
                <span className="amenity-name">AC & Ventilation</span>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-circle">
                  <Zap size={20} />
                </div>
                <span className="amenity-name">Charging Points</span>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-circle">
                  <Wifi size={20} />
                </div>
                <span className="amenity-name">Clean & Hygienic</span>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-circle">
                  <Radio size={20} />
                </div>
                <span className="amenity-name">GPS Tracking</span>
              </div>

              <div className="amenity-item">
                <div className="amenity-icon-circle">
                  <LifeBuoy size={20} />
                </div>
                <span className="amenity-name">Emergency Support</span>
              </div>
            </div>
          </div>

          {/* Right: Bus at Dusk with Doodle */}
          <div className="ogl-amenities-right">
            <div className="amenities-doodle">
              <span>Safe Journeys,</span>
              <span>Happy Destinations ♡</span>
            </div>
            <div className="amenities-bus-frame">
              <img
                src="/images/amenities_bus.jpg"
                alt="Onboard Luxury Amenities"
                className="amenities-bus-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================
          8. TRAVELLER STORIES (Testimonials)
          ======================================================= */}
      <section className="ogl-section ogl-testimonials-section">
        <div className="ogl-section-header">
          <div className="ogl-header-left">
            <div className="ogl-section-icon-badge">
              <Bus size={18} />
            </div>
            <div>
              <h2 className="ogl-section-title">Traveller Stories</h2>
              <p className="ogl-section-sub">Real people. Real journeys.</p>
            </div>
          </div>

          <button
            type="button"
            className="ogl-view-all-link orange"
            onClick={() => setShowOffersModal(true)}
          >
            <span>View All</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="ogl-testimonials-row-wrapper">
          <button
            type="button"
            className="ogl-slider-arrow left"
            onClick={handlePrevTestimonial}
            aria-label="Previous story"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="ogl-testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={t.id}
                className={`ogl-testi-card ${activeTestimonialIndex === idx ? "featured" : ""}`}
              >
                <div className="testi-header">
                  <img src={t.avatar} alt={t.name} className="testi-avatar" />
                  <div className="testi-user-meta">
                    <p className="testi-quote">"{t.quote}"</p>
                    <span className="testi-name">{t.name}</span>
                    <div className="testi-stars">{"★".repeat(t.rating)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="ogl-slider-arrow right"
            onClick={handleNextTestimonial}
            aria-label="Next story"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* =======================================================
          9. BOOK. TRACK. TRAVEL. ALL IN ONE APP.
          ======================================================= */}
      <section className="ogl-section ogl-app-section">
        <div className="ogl-app-banner">
          <div className="ogl-app-left">
            <span className="ogl-app-tag">ON THE GO</span>
            <h2 className="ogl-app-title">
              Book. Track. Travel.<br />
              All in One App.
            </h2>
            <p className="ogl-app-sub">
              Get the AiBus app for a faster, smoother and smarter booking experience.
            </p>

            <div className="ogl-store-badges">
              {/* Official Google Play Store Link */}
              <a
                href="https://play.google.com/store/apps/details?id=com.worknai.aibus&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="ogl-store-btn primary-store-btn"
                aria-label="Get on Google Play Store"
              >
                <svg className="store-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.793 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.442V3.256c0-.568.228-1.08.609-1.442z" />
                  <path d="M17.067 8.726l-2.424 2.424 2.424 2.424 3.738-2.146a1.44 1.44 0 0 0 0-2.556l-3.738-2.146z" />
                  <path d="M14.643 12.85l-10.424 10.423c.356.233.784.377 1.251.377.585 0 1.127-.225 1.551-.598l7.622-4.372v-5.83z" />
                  <path d="M4.22 1.35a2.44 2.44 0 0 0-1.252.378l10.424 10.422 7.622-4.372a2.385 2.385 0 0 0-1.551-.598c-.467 0-.895.144-1.251.378L4.22 1.35z" />
                </svg>
                <div className="store-text-col">
                  <span className="store-label">GET IT ON</span>
                  <span className="store-brand">Google Play</span>
                </div>
              </a>

              {/* Apple App Store Badge */}
              <a
                href="https://apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ogl-store-btn"
                aria-label="Download on App Store"
              >
                <svg className="store-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.65-2.8 1.45-.6.69-1.12 1.83-1 2.97 1.07.08 2.15-.55 2.81-1.32z" />
                </svg>
                <div className="store-text-col">
                  <span className="store-label">Download on the</span>
                  <span className="store-brand">App Store</span>
                </div>
              </a>
            </div>

            {/* Quick rating trust badge */}
            <div className="app-rating-pill">
              <span className="rating-stars">★★★★★</span>
              <span className="rating-text"><strong>4.8</strong> on Google Play &bull; 10K+ Downloads</span>
            </div>
          </div>

          {/* Center & Right: Dual Realistic 3D Mobile Device Mockup */}
          <div className="ogl-app-right">
            <a
              href="https://play.google.com/store/apps/details?id=com.worknai.aibus&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="ogl-dual-phones-link"
              title="Download AiBus on Google Play"
            >
              <div className="ogl-dual-phones-card">
                <img
                  src="/images/aibus_app_mockup.png"
                  alt="AiBus Mobile App Real Device Preview"
                  className="ogl-dual-phones-img"
                />
                <div className="ogl-phones-badge">
                  <span className="badge-glow-dot" />
                  <span>Get on Google Play &bull; Free Download</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* =======================================================
          OFFERS & COUPONS MODAL (Preserving full functionality)
          ======================================================= */}
      {showOffersModal && (
        <OffersModal
          isOpen={true}
          onClose={() => setShowOffersModal(false)}
          onCopyCode={(code) => handleCopyCoupon(code)}
        />
      )}
    </main>
  );
}

export default Home;