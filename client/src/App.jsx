import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import Calculator from './pages/Calculator';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Properties from './pages/Properties';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import { Clients, Users } from './pages/Management';
import Listings from './pages/Listings';
import Signup from './pages/Signup';

const features = [
  {
    icon: '◈',
    title: 'Live market intelligence',
    text: 'Track emerging demand and property momentum with clarity and speed.',
  },
  {
    icon: '◎',
    title: 'Profit-first modeling',
    text: 'Review yield, costs, and timing in one elegant workflow before committing.',
  },
  {
    icon: '✦',
    title: 'Portfolio precision',
    text: 'Gain a panoramic view of every active investment with calm confidence.',
  },
];

const whyChoose = [
  'Nigerian property insights designed for confident decision-making.',
  'Luxury-grade analytics with clear, professional reporting.',
  'A refined experience built for ambitious private investors.',
];

const testimonials = [
  {
    quote: 'It gave us the confidence to move on a premium opportunity before the market shifted.',
    name: 'Ada Okafor',
    role: 'Residential Investor',
  },
  {
    quote: 'The experience feels as polished as the investments it helps us evaluate.',
    name: 'Tunde Adebayo',
    role: 'Portfolio Lead',
  },
];

function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
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

  return (
    <div className="landing-page">
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brand-mark">A</span>
          REITA
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#home">Home</a>
          <a href="#analytics">Investment Calculator</a>
          <a href="#features">Dashboard</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
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
                Encourage Nigerian property investors to analyze profit, risk, and timing before making their next move.
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
            <h2>Designed for thoughtful investment decisions.</h2>
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
            <p className="eyebrow">Why Choose Us</p>
            <h2>Elegant systems for investors who value precision.</h2>
          </div>
          <div className="about-grid">
            <div className="glass-card about-card">
              <ul className="check-list">
                {whyChoose.map((item) => (
                  <li key={item}>{item}</li>
                ))}
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
            <p className="eyebrow">Testimonials</p>
            <h2>Trusted by investors who expect more.</h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <blockquote className="glass-card testimonial-card" key={item.name}>
                <p>“{item.quote}”</p>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </blockquote>
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="footer">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>Let your next property move feel effortless.</h2>
          <div className="contact-info-list">
            <p><strong>Phone:</strong> <a href="tel:08141360230">08141360230</a></p>
            <p><strong>Email:</strong> <a href="mailto:britneyjacksonel@gmail.com">britneyjacksonel@gmail.com</a></p>
          </div>
        </div>
        <a className="btn btn-primary" href="mailto:britneyjacksonel@gmail.com">
          britneyjacksonel@gmail.com
        </a>
      </footer>
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
