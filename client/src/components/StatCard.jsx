import { motion } from 'framer-motion';

export default function StatCard({ label, value, change }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card metric-card"
    >
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      <span className="metric-change">{change}</span>
    </motion.article>
  );
}
