import RoleDashboardShell from './RoleDashboardShell';

export default function ProtectedLayout({ title, subtitle, children }) {
  return <RoleDashboardShell title={title} subtitle={subtitle}>{children}</RoleDashboardShell>;
}
