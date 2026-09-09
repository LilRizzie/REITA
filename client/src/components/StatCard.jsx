import { motion } from 'framer-motion';

export default function StatCard({ label, value, change }) {
  const numericValue = String(value ?? '');
  const isLargeValue = numericValue.replace(/[^0-9]/g, '').length > 7;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card metric-card"
    >
      <p className="eyebrow">{label}</p>
      <h3
        className={isLargeValue ? 'metric-card-value metric-card-value-large' : 'metric-card-value'}
        title={numericValue}
      >
        {value}
      </h3>
      <span className="metric-change">{change}</span>
    </motion.article>
  );
}
