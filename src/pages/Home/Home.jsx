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
} from "lucide-react";
import SearchBox from "../../components/SearchBox/SearchBox";
import OffersModal from "../../components/PopularOffers/OffersModal";
import "./Home.css";

const CAROUSEL_SLIDES = [
  {
    id: "sunset-tour",
    tag: "Travel Beyond Destinations",
    title: "Comfort in Every Mile",
    highlight: "Every Mile",
    subtitle: "Modern buses, premium seating and a safer travel experience for a better tomorrow.",
    image: "/images/hero_bus_sunset_hd.jpg",
    accent: "#E2725B",
    routeBadge: "Over 1000+ Scenic Routes",
  },
  {
    id: "scenic-highway",
    tag: "Explore Beautiful Horizons",
    title: "Unforgettable Journeys",
    highlight: "Journeys",
    subtitle: "Connecting vibrant cities across India with punctual departures and panoramic views.",
    image: "/images/scenic_bus.jpg",
    accent: "#F59E0B",
    routeBadge: "Direct Highway Express",
  },
  {
    id: "luxury-cabin",
    tag: "First Class Experience",
    title: "Luxury On Every Route",
    highlight: "Luxury",
    subtitle: "Ergonomic leather recliners, climate control, individual charging points and ultra-smooth ride.",
    image: "/images/leather_interior.jpg",
    accent: "#38BDF8",
    routeBadge: "Executive Class Comfort",
  },
  {
    id: "night-sleeper",
    tag: "Sleep While You Travel",
    title: "Peaceful Overnight Travel",
    highlight: "Overnight",
    subtitle: "Spacious private sleeper berths with sanitised linens, reading lights and live GPS tracking.",
    image: "/images/amenities_bus.jpg",
    accent: "#34D399",
    routeBadge: "Star Sleeper Fleet",
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
          1. FULL-WIDTH HERO CAROUSEL SLIDER
          ======================================================= */}
      <section
        className="ogl-fullwidth-hero"
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        aria-label="Featured Travel Destinations Carousel"
      >
        {/* Full-bleed Background Images with Smooth Cross-fade and Ken-Burns animation */}
        <div className="hero-carousel-backgrounds">
          {CAROUSEL_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`hero-bg-slide ${activeHeroIndex === idx ? "active" : ""}`}
              aria-hidden={activeHeroIndex !== idx}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="hero-bg-img"
                loading={idx === 0 ? "eager" : "lazy"}
              />
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

            {/* Social Proof */}
            <div className="ogl-hero-social">
              <div className="ogl-avatar-stack">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Traveller"
                  className="ogl-avatar"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Traveller"
                  className="ogl-avatar"
                />
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                  alt="Traveller"
                  className="ogl-avatar"
                />
              </div>
              <div className="ogl-social-text">
                <span className="ogl-social-count">10,000+ Happy Travellers</span>
                <div className="ogl-stars-row">
                  <span className="gold-stars">★★★★★</span>
                  <span className="rating-val">4.8/5</span>
                </div>
              </div>
            </div>

            {/* Handwritten Doodle in the Hero */}
            <div className="ogl-hero-doodle">
              <span className="doodle-text">Good Journeys,</span>
              <span className="doodle-text">Brighter Days ♡</span>
              <div className="doodle-sparkle">✦</div>
            </div>
          </div>

          {/* Right Column: Glassmorphic Preview & Thumbnails */}
          <div className="ogl-hero-right-glass">
            <div className="glass-preview-card">
              <div className="glass-card-header">
                <span className="glass-card-num">0{activeHeroIndex + 1} / 0{CAROUSEL_SLIDES.length}</span>
                <span className="glass-live-indicator"><span className="pulse-dot" /> LIVE FLEET</span>
              </div>
              <h3 className="glass-card-title">{CAROUSEL_SLIDES[activeHeroIndex].title}</h3>
              <p className="glass-card-desc">{CAROUSEL_SLIDES[activeHeroIndex].subtitle}</p>

              {/* Mini thumbnail strip */}
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
          3. VALUE PROPOSITION FEATURES ROW (4 Items)
          ======================================================= */}
      <section className="ogl-features-bar">
        <div className="ogl-features-inner">
          <div className="ogl-feature-card">
            <div className="ogl-feature-icon-circle green">
              <Globe size={20} />
            </div>
            <div className="ogl-feature-info">
              <h4 className="ogl-feature-title">Wide Network</h4>
              <p className="ogl-feature-desc">1000+ cities across India</p>
            </div>
          </div>

          <div
            className="ogl-feature-card clickable"
            onClick={() => setShowOffersModal(true)}
            role="button"
            tabIndex={0}
            title="Click to view exclusive offers and coupon codes"
          >
            <div className="ogl-feature-icon-circle orange">
              <Percent size={18} />
            </div>
            <div className="ogl-feature-info">
              <h4 className="ogl-feature-title">Best Prices</h4>
              <p className="ogl-feature-desc">Get exclusive offers</p>
            </div>
          </div>

          <div className="ogl-feature-card">
            <div className="ogl-feature-icon-circle blue">
              <ShieldCheck size={20} />
            </div>
            <div className="ogl-feature-info">
              <h4 className="ogl-feature-title">Safe & Reliable</h4>
              <p className="ogl-feature-desc">Verified operators</p>
            </div>
          </div>

          <div className="ogl-feature-card">
            <div className="ogl-feature-icon-circle purple">
              <Headphones size={20} />
            </div>
            <div className="ogl-feature-info">
              <h4 className="ogl-feature-title">24/7 Support</h4>
              <p className="ogl-feature-desc">We're always here</p>
            </div>
          </div>
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
              {/* Google Play Store Badge */}
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noreferrer"
                className="ogl-store-btn"
                aria-label="Get on Google Play"
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
                rel="noreferrer"
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
          </div>

          {/* Center & Right: Phone Mockup & Scenic View */}
          <div className="ogl-app-right">
            <div className="ogl-app-doodle">
              <span>Your Next Destination</span>
              <span>Awaits ♡</span>
            </div>

            {/* Smartphone Mockup */}
            <div className="ogl-phone-mockup">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-app-header">
                  <Bus size={14} />
                  <span>Ai<span className="accent">Bus</span></span>
                </div>
                <div className="phone-card">
                  <span className="p-label">From</span>
                  <strong className="p-val">Mumbai</strong>
                  <span className="p-label">To</span>
                  <strong className="p-val">Pune</strong>
                  <div className="p-row">
                    <div>
                      <span className="p-label">Date</span>
                      <strong className="p-subval">18 Oct 2026</strong>
                    </div>
                    <div>
                      <span className="p-label">Passengers</span>
                      <strong className="p-subval">1 Passenger</strong>
                    </div>
                  </div>
                  <button type="button" className="phone-search-btn">
                    Search Buses
                  </button>
                </div>
              </div>
            </div>

            {/* Bus on road backdrop image */}
            <div className="ogl-app-bus-bg">
              <img src="/images/scenic_bus.jpg" alt="AiBus Mobile" />
            </div>
          </div>
        </div>
      </section>

      {/* =======================================================
          OFFERS & COUPONS MODAL (Preserving full functionality)
          ======================================================= */}
      {showOffersModal && <OffersModal onClose={() => setShowOffersModal(false)} />}
    </main>
  );
}

export default Home;