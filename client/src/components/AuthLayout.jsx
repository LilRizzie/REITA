export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-orb orb-one" />
      <div className="auth-orb orb-two" />
      <div className="auth-panel glass-card">
        <div className="auth-hero">
          <div className="auth-brand">
            <div className="brand-mark">A</div>
            <div>
              <p className="eyebrow">REITA</p>
              <h2>Luxury investment access</h2>
            </div>
          </div>

          <p className="auth-hero-copy">
            Welcome to the private workspace for discerning investors, agents, and developers.
          </p>

          <div className="auth-illustration" aria-hidden="true" />

          <ul className="auth-highlights">
            <li>Secure investor onboarding</li>
            <li>Elegant portfolio visibility</li>
            <li>Refined market intelligence</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-card__header">
            <div>
              <p className="eyebrow">Access</p>
              <h1>{title}</h1>
            </div>
          </div>

          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
