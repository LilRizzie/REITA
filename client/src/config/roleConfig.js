const roleConfig = {
  Investor: {
    heroTitle: 'Portfolio intelligence',
    heroText: 'Track acquisition targets, monitor performance, and keep every decision aligned with your long-term strategy.',
    stats: [
      { label: 'Portfolio value', value: 'Live', change: 'Available' },
      { label: 'Net yield', value: 'Live', change: 'Available' },
      { label: 'Active deals', value: 'Live', change: 'Available' },
    ],
    highlights: [
      'Properties, reports, and analyses are stored locally for quick access.',
      'Each investment can be reviewed and refined from one streamlined workspace.',
      'Reports can be printed or downloaded instantly from the Reports page.',
    ],
    quickActions: ['Add Property', 'Open Calculator', 'Generate Report'],
    navItems: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Properties', path: '/properties' },
      { label: 'Calculator', path: '/calculator' },
      { label: 'Reports', path: '/reports' },
      { label: 'Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  'Property Agent': {
    heroTitle: 'Listing momentum',
    heroText: 'Coordinate client opportunities, track your pipeline, and keep every listing moving with calm precision.',
    stats: [
      { label: 'Listings live', value: 'Live', change: 'Available' },
      { label: 'Client follow-ups', value: 'Live', change: 'Available' },
      { label: 'Potential commission', value: 'Live', change: 'Available' },
    ],
    highlights: [
      'Client and property records remain organized and searchable.',
      'Agent-specific pages keep your pipeline visible without clutter.',
      'Reports stay aligned with the latest property and client updates.',
    ],
    quickActions: ['Open Properties', 'Manage Clients', 'Generate Report'],
    navItems: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Listings', path: '/listings' },
      { label: 'Clients', path: '/clients' },
      { label: 'Reports', path: '/reports' },
      { label: 'Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' },
    ],
  },
  Administrator: {
    heroTitle: 'Operations dashboard',
    heroText: 'Monitor platform performance, oversee users, and shape the next wave of growth from one elegant command center.',
    stats: [
      { label: 'Active users', value: 'Live', change: 'Available' },
      { label: 'System health', value: 'Live', change: 'Available' },
      { label: 'Pending approvals', value: 'Live', change: 'Available' },
    ],
    highlights: [
      'The system surface keeps stakeholders informed without overwhelming them.',
      'Operational health and governance remain visible at a glance.',
      'Reports and platform signals can be reviewed in a single workspace.',
    ],
    quickActions: ['Review Users', 'Open Analytics', 'Share Report'],
    navItems: [
      { label: 'Dashboard', path: '/admin-dashboard' },
      { label: 'Users', path: '/users' },
      { label: 'Properties', path: '/properties' },
      { label: 'Reports', path: '/reports' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' },
    ],
  },
};

export const getRoleConfig = (investorType) => roleConfig[investorType] || roleConfig.Investor;

export const getRoleLabel = (investorType) => investorType || 'Investor';

export const roleRoutes = {
  Administrator: ['/admin-dashboard', '/users', '/properties', '/reports', '/analytics', '/settings', '/profile'],
  Investor: ['/dashboard', '/properties', '/calculator', '/reports', '/profile', '/settings'],
  'Property Agent': ['/dashboard', '/listings', '/clients', '/reports', '/profile', '/settings'],
};

export const canAccessRoute = (role, pathname) => (roleRoutes[role] || roleRoutes.Investor).includes(pathname);