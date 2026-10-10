import { useState, useRef, useEffect } from "react";
import SearchBox from "../../components/SearchBox/SearchBox";
import PopularOffers from "../../components/PopularOffers/PopularOffers";
import adventurePoster from "../../assets/hero/adventure-bus.jpg";
import "./Home.css";

function Home() {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoLoaded(true);
    };

    video.addEventListener("canplaythrough", handleCanPlay);
    video.addEventListener("loadeddata", handleCanPlay);

    return () => {
      video.removeEventListener("canplaythrough", handleCanPlay);
      video.removeEventListener("loadeddata", handleCanPlay);
    };
  }, []);

  return (
    <main className="home-page">

      {/* ================================
          FULL SCREEN HERO BANNER WITH VIDEO
      ================================= */}
      <section className="hero-section">
        <video
          ref={videoRef}
          className={`hero-video-bg ${isVideoLoaded ? "loaded" : ""}`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={adventurePoster}
        >
          <source src="/hero/bus-journey-hero.webm" type="video/webm" />
          <source src="/hero/bus-journey-hero.mp4" type="video/mp4" />
        </video>

        <div className="hero-overlay">

          <div className="hero-container">

            {/* ============================
                LEFT: VERTICAL SEARCH CARD
            ============================ */}
            <div className="hero-search-wrapper">
              <SearchBox layout="vertical" />
            </div>

            {/* ============================
                RIGHT TOP: TEXT SECTION
            ============================ */}
            <div className="hero-content hero-content-top-right">

              <div className="hero-eyebrow">
                <span>JOURNEYS CONNECT PEOPLE</span>
                <span className="eyebrow-line"></span>
              </div>

              <h1 className="hero-title">
                Book Your <span>Bus Journey</span>
              </h1>

              <p className="hero-subtitle">
                Search buses across 10,000+ routes with real-time tracking & verified operators.
              </p>

              <div className="hero-highlights">
                <div className="hero-highlight-pill">
                  <span className="pill-dot"></span>
                  <span>10,000+ Routes</span>
                </div>
                <div className="hero-highlight-pill">
                  <span className="pill-dot"></span>
                  <span>Instant M-Tickets</span>
                </div>
                <div className="hero-highlight-pill">
                  <span className="pill-dot"></span>
                  <span>Best Price Guarantee</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================================
          OFFERS
      ================================= */}
      <PopularOffers />

    </main>
  );
}

export default Home;