import React, { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import TopNavBar from '../components/TopNavBar'
import heroVideo from '../assets/hero_section.mp4'
import techVideo from '../assets/technology.mp4'
import './LandingPage.css'

export const LandingPage = () => {
  const location = useLocation()
  const revealRefs = useRef([])

  useEffect(() => {
    // 1. Setup IntersectionObserver for scroll reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active')
          }
        });
      },
      { threshold: 0.1 }
    )

    // Select all elements to reveal
    const revealElements = document.querySelectorAll('.reveal')
    revealElements.forEach((el) => observer.observe(el))

    // 2. Handle scroll redirects from other pages
    if (location.state && location.state.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo)
        if (element) {
          const headerOffset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.scrollY - headerOffset
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }

    return () => {
      observer.disconnect()
    }
  }, [location])

  return (
    <div className="landing-container bg-hex-grid">
      <TopNavBar />

      <main className="landing-main">
        {/* HERO SECTION */}
        <section className="container landing-section" style={{ borderBottom: 'none' }}>
          <div className="hero-grid">
            <div className="hero-text reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="mono-tag" style={{ width: 'max-content' }}>
                <span className="material-symbols-outlined text-[14px]">science</span>
                VERSION 2.1 ACTIVE
              </div>
              <h1 className="hero-title">
                Advancing Computational Mycology: <br/>
                <span>Tempe Few-Shot Classification</span>
              </h1>
              <p className="body-lg" style={{ maxWidth: '520px' }}>
                A sophisticated digital lens into biological structures. Leveraging state-of-the-art Prototypical Neural Networks to analyze culture maturity with unprecedented precision.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link to="/auth" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
                  GET STARTED
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </Link>
                <a href="#problem" className="btn btn-ghost" style={{ padding: '0.875rem 2rem' }}>
                  LEARN MORE
                </a>
              </div>

              {/* Statistical Mini-counters */}
              <div className="stats-row">
                <div className="stat-item">
                  <div className="stat-val">3</div>
                  <div className="stat-lbl">Fermentation Stages</div>
                </div>
                <div className="stat-item">
                  <div className="stat-val">98.4%</div>
                  <div className="stat-lbl">Classification F1</div>
                </div>
                <div className="stat-item">
                  <div className="stat-val">&lt; 1s</div>
                  <div className="stat-lbl">Processing Latency</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visualizer Panel */}
            <div 
              className="hero-image-wrapper reveal" 
              style={{ transitionDelay: '0.3s' }}
            >
              <video 
                src={heroVideo}
                autoPlay
                loop
                muted
                playsInline
                className="hero-image"
              />
              <div className="absolute-overlay" style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, var(--color-surface-container-lowest), transparent)'
              }}></div>
              <div className="mono-tag" style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'rgba(14, 20, 26, 0.8)',
                borderColor: 'rgba(99, 247, 255, 0.3)',
                backdropFilter: 'blur(8px)'
              }}>
                LENS CALIBRATION: COMPLETE
              </div>
              {/* Animated Scanning Line */}
              <div className="animate-scan" style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--color-secondary-fixed), transparent)',
                boxShadow: '0 0 10px var(--color-secondary-fixed)'
              }}></div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section id="problem" className="landing-section">
          <div className="container reveal">
            <h2 className="h2-text" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              Why Precision Matters
            </h2>
            <div className="bento-grid">
              <div className="glass-panel bento-card" style={{ gridColumn: 'span 4' }}>
                <span className="material-symbols-outlined bento-icon">monitor_heart</span>
                <h3 className="h3-text" style={{ fontSize: '1.1rem' }}>Food Safety Assurance</h3>
                <p className="body-md" style={{ fontSize: '0.85rem' }}>
                  Monitoring fermentation quality is critical in computational mycology. Uncontrolled conditions or incorrect timing can lead to toxic mold contamination or unconsumable under-fermented cultures.
                </p>
              </div>

              <div className="glass-panel bento-card" style={{ gridColumn: 'span 4' }}>
                <span className="material-symbols-outlined bento-icon">science</span>
                <h3 className="h3-text" style={{ fontSize: '1.1rem' }}>Biotech Accessibility</h3>
                <p className="body-md" style={{ fontSize: '0.85rem' }}>
                  This platform democratizes quality control by bridging laboratory science with practical production. It offers a cost-effective, rapid, and objective inspection tool that runs in any browser without expensive specialized hardware.
                </p>
              </div>

              <div className="glass-panel bento-card" style={{ gridColumn: 'span 4' }}>
                <span className="material-symbols-outlined bento-icon">biotech</span>
                <h3 className="h3-text" style={{ fontSize: '1.1rem' }}>Mycology Automation</h3>
                <p className="body-md" style={{ fontSize: '0.85rem' }}>
                  Automating culture inspection scales standard research QA controls far beyond manual human capabilities, ensuring optimal biological mycelial growth and cake density consistency.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TECHNOLOGY SECTION */}
        <section id="technology" className="landing-section" style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
          <div className="container">
            <div className="hero-grid">
              {/* Left Side: Deep Learning Image with Animation */}
              <div className="glass-panel reveal" style={{
                height: '380px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 247, 255, 0.1)'
              }}>
                <video 
                  src={techVideo} 
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.75,
                  }}
                />
                <div className="absolute-overlay" style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, var(--color-surface-container-lowest), transparent)'
                }}></div>
                <div className="mono-tag" style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', backgroundColor: 'rgba(14, 20, 26, 0.8)', backdropFilter: 'blur(8px)' }}>
                  Prototypical Neural Network
                </div>
                {/* Floating biotech scan line */}
                <div className="animate-scan" style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, var(--color-secondary-fixed), transparent)',
                  boxShadow: '0 0 10px var(--color-secondary-fixed)',
                  opacity: 0.6
                }}></div>
              </div>

              {/* Right Side: Text description */}
              <div className="hero-text reveal" style={{ transitionDelay: '0.2s' }}>
                <h2 className="h2-text">Few-Shot Deep Learning</h2>
                <p className="body-md">
                  Training deep neural classifiers for custom biological strains is often bottlenecked by a lack of large, labeled datasets.
                </p>
                <p className="body-md">
                  Our system implements **Few-Shot Learning (FSL)** with prototypical networks, mapping culture visual parameters to a vector space where similar classes group together. This permits robust class separation with only a few support images.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary-fixed)' }}>check_circle</span>
                    <span className="body-md" style={{ fontWeight: 500 }}>ResNet-18 Deep Feature Extractor</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary-fixed)' }}>check_circle</span>
                    <span className="body-md" style={{ fontWeight: 500 }}>High-precision classification with limited data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="landing-section">
          <div className="container reveal">
            <h2 className="h2-text" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
              Operational Protocol
            </h2>
            <div className="protocol-grid">
              {/* Connection Line on desktop */}
              <div className="nav-desktop-links" style={{
                position: 'absolute',
                top: '48px',
                left: '15%',
                right: '15%',
                height: '1px',
                background: 'rgba(99, 247, 255, 0.1)',
                zIndex: 1
              }} />

              {/* Step 1 */}
              <div className="protocol-step">
                <div className="protocol-circle">
                  <span className="material-symbols-outlined protocol-icon">photo_camera</span>
                </div>
                <div>
                  <div className="protocol-number">01. CAPTURE / UPLOAD</div>
                  <p className="protocol-desc" style={{ marginTop: '0.5rem' }}>
                    Acquire or drop standardized imagery of the culture cake specimen.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="protocol-step">
                <div className="protocol-circle" style={{ borderColor: 'var(--color-primary-container)' }}>
                  <span className="material-symbols-outlined protocol-icon" style={{ color: 'var(--color-primary)' }}>memory</span>
                </div>
                <div>
                  <div className="protocol-number" style={{ color: 'var(--color-secondary-fixed)' }}>02. AI EMBEDDING</div>
                  <p className="protocol-desc" style={{ marginTop: '0.5rem' }}>
                    Feature extraction via few-shot neural nodes in latent space.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="protocol-step">
                <div className="protocol-circle">
                  <span className="material-symbols-outlined protocol-icon">analytics</span>
                </div>
                <div>
                  <div className="protocol-number">03. MATURITY METRICS</div>
                  <p className="protocol-desc" style={{ marginTop: '0.5rem' }}>
                    Immediate projection mapping to Day 0, Day 1, or Day 2 stages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT / AFFILIATION */}
        <section id="about" className="landing-section" style={{ borderBottom: 'none' }}>
          <div className="container reveal">
            <div className="glass-panel" style={{
              padding: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: '4px solid var(--color-primary)',
              flexWrap: 'wrap',
              gap: '2rem'
            }}>
              <div style={{ flex: '1 1 500px' }}>
                <h3 className="h3-text" style={{ marginBottom: '0.75rem' }}>
                  Computational Biology Course Initiative
                </h3>
                <p className="body-md" style={{ color: 'var(--color-on-surface-variant)' }}>
                  TempeClassify was designed and built as a computational biology project. The platform integrates deep neural models with web architecture to demonstrate practical AI deployments for food biotechnology and agricultural quality control.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '4.5rem', color: 'var(--color-outline)', opacity: 0.35 }}>
                  school
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer 
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderTop: '1px solid var(--color-outline-variant)',
          padding: '3rem 0',
          width: '100%'
        }}
      >
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div className="sidebar-brand" style={{ margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              biotech
            </span>
            TEMPE.AI
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <a 
              href="https://github.com/yosukeyung/Few-Shot-Image-Classification-for-Tempeh-Fermentation-Monitoring" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-outline)', textDecoration: 'none', transition: 'color var(--transition-fast)' }} 
              onMouseEnter={e => e.target.style.color = 'var(--color-secondary-fixed)'} 
              onMouseLeave={e => e.target.style.color = 'var(--color-outline)'}
            >
              Technical Documentation
            </a>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-outline)' }}>
            &copy; 2026 TEMPE BIOLABS. AFFILIATED WITH COMPUTATIONAL BIOLOGY INSTITUTE.
          </div>
        </div>
      </footer>
    </div>
  )
}
export default LandingPage
