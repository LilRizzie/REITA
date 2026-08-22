import { apiRequest } from './api';

const getStorageKey = (uid, prefix) => {
  if (!uid) return null;
  return `reita-${prefix}-${uid}`;
};

const readStoredItems = (key) => {
  if (typeof window === 'undefined' || !key) return [];

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Storage read error:', error);
    return [];
  }
};

const writeStoredItems = (key, items) => {
  if (typeof window === 'undefined' || !key) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error('Storage write error:', error);
  }
};

const comparisonKey = 'reita-investment-comparison';

export function getComparisonProperties() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(comparisonKey);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Comparison read error:', error);
    return [];
  }
}

export function saveComparisonProperties(properties) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(comparisonKey, JSON.stringify(properties.slice(0, 3)));
}

export function clearComparisonProperties() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(comparisonKey);
}

// ============================================================
// PROPERTIES — MongoDB backed via REITA API
// ============================================================

const stripOwnerFields = (payload) => {
  const {
    ownerId,
    ownerUid,
    ownerEmail,
    ownerName,
    role,
    ...rest
  } = payload || {};

  return rest;
};

export async function getProperties(uid, role) {
  const endpoint = role === 'Property Agent' ? '/api/properties/my-properties' : '/api/properties';
  const response = await apiRequest(endpoint);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load properties.');
  }

  return Array.isArray(data.properties) ? data.properties : [];
}

export async function getAllProperties() {
  return getProperties(null);
}

export async function getProperty(id) {
  const response = await apiRequest(`/api/properties/${id}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load property.');
  }

  return data.property || null;
}

export async function getInvestmentProperties() {
  const response = await apiRequest('/api/properties/investments');
  const data = await response.json();
  if (!response.ok || !data.success) {
    const error = new Error(data.message || 'Unable to load investment opportunities.');
    error.code = data.code || null;
    throw error;
  }
  return Array.isArray(data.properties) ? data.properties : [];
}

export async function getInvestmentProperty(id) {
  const response = await apiRequest(`/api/properties/investments/${id}`);
  const data = await response.json();
  if (!response.ok || !data.success) {
    const error = new Error(data.message || 'Unable to load this investment opportunity.');
    error.code = data.code || null;
    throw error;
  }
  return data.property || null;
}

export async function saveProperty(uid, property) {
  const isEditing = Boolean(property?.id);

  const body = stripOwnerFields(property);

  const response = await apiRequest(
    isEditing
      ? `/api/properties/${property.id}`
      : '/api/properties',
    {
      method: isEditing ? 'PUT' : 'POST',
      body,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to save property.');
  }

  return data.property;
}

export async function updateProperty(uid, property) {
  return saveProperty(uid, property);
}

export async function deleteProperty(uid, id) {
  const response = await apiRequest(`/api/properties/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete property.');
  }

  return data;
}


// ============================================================
// REPORTS — MongoDB backed via REITA API
// ============================================================

export async function getAllReports() {
  const response = await apiRequest('/api/reports');
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load reports.');
  }

  return Array.isArray(data.reports) ? data.reports : [];
}

export async function getReports(uid) {
  const response = await apiRequest('/api/reports');
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load reports.');
  }

  return Array.isArray(data.reports) ? data.reports : [];
}

export async function saveReport(uid, report) {
  const body = {
    propertyId: report?.propertyId || null,
    propertyName: report?.propertyName || '',
    propertyType: report?.propertyType || '',
    location: report?.location || '',
    analysisDate: report?.analysisDate || '',
    summary: report?.summary || {},
    recommendation: report?.recommendation || {},
    userName: report?.userName || '',
    generatedBy: report?.generatedBy || '',
    generatedByEmail: report?.generatedByEmail || '',
  };

  const response = await apiRequest('/api/reports', {
    method: 'POST',
    body,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to save report.');
  }

  return data.report;
}

export async function deleteReport(uid, id) {
  const response = await apiRequest(`/api/reports/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete report.');
  }

  return data;
}


// ============================================================
// ANALYSES — MongoDB backed via REITA API
// ============================================================

export async function saveAnalysis(uid, analysis) {
  const body = {
    propertyId: analysis?.propertyId || null,
    propertyName: analysis?.propertyName || '',
    summary: analysis?.summary || {},
    recommendation: analysis?.recommendation || '',
  };

  const response = await apiRequest('/api/analyses', {
    method: 'POST',
    body,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to save analysis.');
  }

  return data.analysis;
}

export async function getAnalyses(uid) {
  const response = await apiRequest('/api/analyses');
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to load analyses.');
  }

  return Array.isArray(data.analyses) ? data.analyses : [];
}

export async function deleteAnalysis(uid, id) {
  const response = await apiRequest(`/api/analyses/${id}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete analysis.');
  }

  return data;
};


// ============================================================
// SETTINGS — LOCAL STORAGE
// ============================================================

export function saveSettings(uid, settings) {
  const key = getStorageKey(uid, 'settings');

  writeStoredItems(key, settings);

  return settings;
}

export function getSettings(uid) {
  return readStoredItems(getStorageKey(uid, 'settings'));
}

export function resetSettings(uid) {
  const key = getStorageKey(uid, 'settings');

  const defaults = {
    darkMode: true,
    language: 'English',
    currency: 'NGN',
    emailNotifications: true,
    smsNotifications: false,
    autoReportGeneration: true,
    defaultRoiCalculation: 'Simple ROI',
  };

  writeStoredItems(key, defaults);

  return defaults;
}


// ============================================================
// PROFILE IMAGE — LOCAL STORAGE
// ============================================================

export function saveProfileImage(uid, imageData) {
  if (typeof window === 'undefined' || !uid) return null;

  window.localStorage.setItem(
    `reita-profile-image-${uid}`,
    imageData
  );

  return imageData;
}

export function getProfileImage(uid) {
  if (typeof window === 'undefined' || !uid) return '';

  return (
    window.localStorage.getItem(
      `reita-profile-image-${uid}`
    ) || ''
  );
}

export function removeProfileImage(uid) {
  if (typeof window === 'undefined' || !uid) return;

  window.localStorage.removeItem(
    `reita-profile-image-${uid}`
  );
}


// ============================================================
// CLIENTS — LOCAL STORAGE FOR NOW
// ============================================================

export function saveClient(uid, client) {
  const key = getStorageKey(uid, 'clients');
  const list = readStoredItems(key);

  const normalized = {
    ...client,
    id:
      client.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: client.createdAt || Date.now(),
  };

  const existingIndex = list.findIndex(
    (item) => String(item.id) === String(normalized.id)
  );

  if (existingIndex >= 0) {
    list[existingIndex] = normalized;
  } else {
    list.unshift(normalized);
  }

  writeStoredItems(key, list);

  return normalized;
}

export function getClients(uid) {
  return readStoredItems(
    getStorageKey(uid, 'clients')
  );
}

export function deleteClient(uid, id) {
  const key = getStorageKey(uid, 'clients');

  const list = readStoredItems(key).filter(
    (item) => String(item.id) !== String(id)
  );

  writeStoredItems(key, list);

  return list;
}


// ============================================================
// LISTINGS — LOCAL STORAGE FOR NOW
// ============================================================

export function saveListing(uid, listing) {
  const key = getStorageKey(uid, 'listings');
  const list = readStoredItems(key);

  const normalized = {
    ...listing,
    id:
      listing.id ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: listing.createdAt || Date.now(),
  };

  const index = list.findIndex(
    (item) => String(item.id) === String(normalized.id)
  );

  if (index >= 0) {
    list[index] = normalized;
  } else {
    list.unshift(normalized);
  }

  writeStoredItems(key, list);

  return normalized;
}

export function getListings(uid) {
  return readStoredItems(
    getStorageKey(uid, 'listings')
  );
}

export function deleteListing(uid, id) {
  const key = getStorageKey(uid, 'listings');

  writeStoredItems(
    key,
    readStoredItems(key).filter(
      (item) => String(item.id) !== String(id)
    )
  );
}


// ============================================================
// USERS — LOCAL STORAGE FOR NOW
// ============================================================

export function getAllUsers() {
  return readStoredItems('reita-users');
}

export function updateUserRole(uid, investorType) {
  if (typeof window === 'undefined' || !uid) return null;

  if (!['Investor', 'Property Agent'].includes(investorType)) {
    return null;
  }

  const users = getAllUsers();

  const index = users.findIndex(
    (user) => user.id === uid
  );

  if (index < 0) return null;

  users[index] = {
    ...users[index],
    role: investorType,
  };

  writeStoredItems('reita-users', users);

  const key = `reita-profile-${uid}`;

  let saved = {};

  try {
    saved = JSON.parse(
      window.localStorage.getItem(key) || '{}'
    );
  } catch {
    // Keep the empty fallback when saved profile data is malformed.
  }

  window.localStorage.setItem(
    key,
    JSON.stringify({
      ...saved,
      investorType,
    })
  );

  return users[index];
}

export function disableUser(uid, disabled) {
  if (typeof window === 'undefined' || !uid) return null;

  const users = getAllUsers();

  const index = users.findIndex(
    (user) => user.id === uid
  );

  if (index < 0) return null;

  users[index] = {
    ...users[index],
    disabled,
  };

  writeStoredItems('reita-users', users);

  return users[index];
}

export function deleteUser(uid) {
  if (typeof window === 'undefined' || !uid) return;

  writeStoredItems(
    'reita-users',
    getAllUsers().filter(
      (user) => user.id !== uid
    )
  );

  window.localStorage.removeItem(
    `reita-profile-${uid}`
  );
}