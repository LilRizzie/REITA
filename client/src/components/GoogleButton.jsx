export default function GoogleButton({ onClick, loading }) {
  return (
    <button type="button" className="google-btn" onClick={onClick} disabled={loading}>
      <span className="google-mark">G</span>
      {loading ? 'Continuing with Google…' : 'Continue with Google'}
    </button>
  );
}
