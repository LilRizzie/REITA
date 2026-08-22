import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope, FaArrowUp } from 'react-icons/fa';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import Calculator from './pages/Calculator';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Properties from './pages/Properties';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import { Clients, Users } from './pages/Management';
import Listings from './pages/Listings';
import Signup from './pages/Signup';
import VerificationRequired from './pages/VerificationRequired';
import SetPassword from './pages/SetPassword';
import Investments from './pages/Investments';
import InvestmentDetails from './pages/InvestmentDetails';
import CompareInvestments from './pages/CompareInvestments';

const features = [
  {
    icon: '◈',
    title: 'Property Management',
    text: 'Track acquisitions, monitor performance, and manage your entire portfolio from one refined workspace.',
  },
  {
    icon: '◎',
    title: 'ROI Calculator',
    text: 'Analyze yield, costs, and timing with precision before committing to any investment.',
  },
  {
    icon: '✦',
    title: 'PDF Reports',
    text: 'Generate professional, branded investment reports you can download or print instantly.',
  },
  {
    icon: '◉',
    title: 'Dashboard Analytics',
    text: 'Gain a panoramic view of every active investment with clear, actionable metrics.',
  },
  {
    icon: '⌕',
    title: 'Property Search & Filtering',
    text: 'Find the right opportunity fast with powerful search, filters, and sorting.',
  },
  {
    icon: '🔒',
    title: 'Secure Authentication',
    text: 'Email verification keeps your investment data protected.',
  },
];

const whyReita = [
  {
    icon: '⚡',
    title: 'Fast Analysis',
    text: 'Run complete investment calculations in seconds with instant, accurate results.',
  },
  {
    icon: '🛡️',
    title: 'Secure',
    text: 'JWT authentication with email verification keeps your data safe.',
  },
  {
    icon: '📄',
    title: 'Professional Reports',
    text: 'Generate polished PDF reports that present your analysis with clarity and authority.',
  },
  {
    icon: '👥',
    title: 'Role Based Access',
    text: 'Dedicated workspaces for investors, property agents, and administrators.',
  },
  {
    icon: '🎨',
    title: 'Modern Interface',
    text: 'A luxury-grade dark interface designed for focused, confident decision-making.',
  },
];

function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      <header className={`topbar${scrollY > 50 ? ' topbar-scrolled' : ''}`}>
        <a className="brand" href="#home">
          <span className="brand-mark">A</span>
          REITA
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#home" className={scrollY < 300 ? 'active' : ''}>Home</a>
          <a href="#features" className={scrollY >= 300 && scrollY < 900 ? 'active' : ''}>Features</a>
          <a href="#about" className={scrollY >= 900 && scrollY < 1500 ? 'active' : ''}>About</a>
          <a href="#analytics" className={scrollY >= 1500 && scrollY < 2200 ? 'active' : ''}>Calculator</a>
          <a href="#contact" className={scrollY >= 2200 ? 'active' : ''}>Contact</a>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>

      <main id="home">
        <section className="hero-section reveal">
          <div className="hero-background" style={{ backgroundPositionY: `${50 + scrollY * 0.08}%` }} />
          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow">Luxury Real Estate Intelligence</p>
              <h1>Smarter Real Estate Investment Starts Here</h1>
              <p className="hero-text">
                Analyze profit, risk, and timing before making your next move. REITA gives Nigerian property investors the clarity they need to invest with confidence.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" to="/signup">
                  Start Analyzing
                </Link>
                <a className="btn btn-secondary" href="#about">
                  Learn More
                </a>
              </div>
            </div>

            <div className="glass-card hero-panel">
              <p className="eyebrow">Live opportunity view</p>
              <h3>Premium corridor performance</h3>
              <p>A refined analytics experience designed for investors who expect elegance, precision, and speed.</p>
              <div className="hero-panel-metrics">
                <div>
                  <strong>+18.6%</strong>
                  <span>Projected yield</span>
                </div>
                <div>
                  <strong>6.8%</strong>
                  <span>Annual return</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-strip reveal">
          <div className="stats-grid">
            <div className="stat-item">
              <strong>24/7</strong>
              <span>Live market insight</span>
            </div>
            <div className="stat-item">
              <strong>92%</strong>
              <span>Forecast clarity</span>
            </div>
            <div className="stat-item">
              <strong>3x</strong>
              <span>Faster review cycles</span>
            </div>
          </div>
        </section>

        <section id="features" className="section reveal">
          <div className="section-heading">
            <p className="eyebrow">Features</p>
            <h2>Everything you need for confident property investment.</h2>
          </div>
          <div className="feature-list">
            {features.map((feature) => (
              <div className="feature-row" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="section reveal">
          <div className="section-heading">
            <p className="eyebrow">About REITA</p>
            <h2>Real Estate Investment Analysis System</h2>
          </div>
          <div className="about-grid">
            <div className="glass-card about-card">
              <p className="about-intro">
                REITA is a comprehensive real estate investment analysis platform built for Nigerian investors, property agents, and administrators. It combines intelligent financial modeling with a luxury-grade interface to help you make informed decisions.
              </p>
              <ul className="check-list">
                <li>Property Analysis</li>
                <li>ROI Calculator</li>
                <li>Investment Reports</li>
                <li>Portfolio Management</li>
                <li>Admin Dashboard</li>
                <li>Property Agents</li>
                <li>Investor Dashboard</li>
              </ul>
            </div>
            <div className="glass-card analytics-card">
              <p className="eyebrow">Investment analytics preview</p>
              <div className="bar-chart" aria-hidden="true">
                {[42, 60, 78, 56, 69].map((height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
              <div className="metrics-row">
                <div>
                  <strong>$1.24M</strong>
                  <span>Projected value</span>
                </div>
                <div>
                  <strong>6.8%</strong>
                  <span>Annual return</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="analytics" className="section reveal">
          <div className="section-heading">
            <p className="eyebrow">Investment Calculator</p>
            <h2>See every opportunity with clarity and control.</h2>
          </div>
          <div className="glass-card spotlight-card">
            <div className="spotlight-copy">
              <p className="eyebrow">Performance snapshot</p>
              <h3>Analyze profit before you invest.</h3>
              <p>Our premium experience merges real estate intelligence with sophisticated forecasting so every move feels deliberate.</p>
            </div>
            <div className="spotlight-metrics">
              <div>
                <strong>12.4%</strong>
                <span>Portfolio uplift</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Investor confidence</span>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="section reveal">
          <div className="section-heading">
            <p className="eyebrow">Why REITA?</p>
            <h2>Built for investors who expect more.</h2>
          </div>
          <div className="testimonial-grid">
            {whyReita.map((item) => (
              <div className="glass-card testimonial-card" key={item.title}>
                <div className="why-icon">{item.icon}</div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">A</span>
              REITA
            </div>
            <p className="footer-tagline">Real Estate Investment Analysis System</p>
            <p className="footer-desc">
              Helping investors make informed real estate decisions through intelligent financial analysis.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#analytics">Calculator</a>
            <a href="#contact">Contact</a>
            <Link to="/login">Login</Link>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <p><strong>Email:</strong> <a href="mailto:britneyjacksonel@gmail.com">britneyjacksonel@gmail.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:08141360230">08141360230</a></p>
          </div>

          <div className="footer-col">
            <h4>Follow Us</h4>
            <div className="social-icons">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
              <a href="mailto:britneyjacksonel@gmail.com" aria-label="Email"><FaEnvelope /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 REITA. All Rights Reserved.</p>
          <div className="footer-legal">
            <a href="#home">Privacy Policy</a>
            <a href="#home">Terms of Service</a>
          </div>
        </div>
      </footer>

      {showBackToTop && (
        <button type="button" className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <FaArrowUp />
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/verification-required" element={<VerificationRequired />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<Dashboard />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/users" element={<Users />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/investments/compare" element={<CompareInvestments />} />
        <Route path="/investments/:id" element={<InvestmentDetails />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;