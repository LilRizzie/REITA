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
    console.error(error);
    return [];
  }
};

const writeStoredItems = (key, items) => {
  if (typeof window === 'undefined' || !key) return;
  window.localStorage.setItem(key, JSON.stringify(items));
};

export function saveProperty(uid, property) {
  const key = getStorageKey(uid, 'properties');
  const list = readStoredItems(key);
  const now = Date.now();
  const normalized = {
    ...property,
    id: property.id || `${now}-${Math.random().toString(36).slice(2, 8)}`,
    ownerUid: uid,
    createdAt: property.createdAt || now,
    updatedAt: now,
  };

  const existingIndex = list.findIndex((item) => String(item.id) === String(normalized.id));

  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...normalized, updatedAt: now };
  } else {
    list.unshift(normalized);
  }

  writeStoredItems(key, list);
  const globalList = readStoredItems('reita-properties');
  const globalProperty = { ...normalized, ownerId: uid, ownerEmail: property.ownerEmail || '', ownerName: property.ownerName || '' };
  const globalIndex = globalList.findIndex((item) => String(item.id) === String(normalized.id));
  if (globalIndex >= 0) globalList[globalIndex] = globalProperty; else globalList.unshift(globalProperty);
  writeStoredItems('reita-properties', globalList);
  return normalized;
}

export function getProperties(uid) {
  return readStoredItems(getStorageKey(uid, 'properties'));
}

export function getAllProperties() {
  return readStoredItems('reita-properties');
}

export function getAllReports() {
  if (typeof window === 'undefined') return [];
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith('reita-reports-'))
    .flatMap((key) => readStoredItems(key));
}

export function updateProperty(uid, property) {
  return saveProperty(uid, property);
}

export function deleteProperty(uid, id) {
  const globalList = readStoredItems('reita-properties');
  const target = globalList.find((item) => String(item.id) === String(id));
  const ownerId = target?.ownerId || target?.ownerUid || uid;
  const key = getStorageKey(ownerId, 'properties');
  const list = readStoredItems(key).filter((item) => String(item.id) !== String(id));
  writeStoredItems(key, list);
  writeStoredItems('reita-properties', globalList.filter((item) => String(item.id) !== String(id)));
  return list;
}

export function saveReport(uid, report) {
  const key = getStorageKey(uid, 'reports');
  const list = readStoredItems(key);
  const normalized = {
    ...report,
    id: report.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: report.createdAt || Date.now(),
    generatedBy: report.generatedBy || '',
    generatedByEmail: report.generatedByEmail || '',
  };

  list.unshift(normalized);
  writeStoredItems(key, list);
  return normalized;
}

export function getReports(uid) {
  return readStoredItems(getStorageKey(uid, 'reports'));
}

export function deleteReport(uid, id) {
  if (typeof window === 'undefined') return [];
  const allKeys = Object.keys(window.localStorage).filter((key) => key.startsWith('reita-reports-'));
  for (const key of allKeys) {
    const list = readStoredItems(key);
    const filtered = list.filter((item) => String(item.id) !== String(id));
    if (filtered.length !== list.length) {
      writeStoredItems(key, filtered);
      return filtered;
    }
  }
  const key = getStorageKey(uid, 'reports');
  const list = readStoredItems(key).filter((item) => String(item.id) !== String(id));
  writeStoredItems(key, list);
  return list;
}

export function saveAnalysis(uid, analysis) {
  const key = getStorageKey(uid, 'analyses');
  const list = readStoredItems(key);
  const normalized = {
    ...analysis,
    id: analysis.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: analysis.createdAt || Date.now(),
  };

  list.unshift(normalized);
  writeStoredItems(key, list);
  return normalized;
}

export function getAnalyses(uid) {
  return readStoredItems(getStorageKey(uid, 'analyses'));
}

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

export function saveProfileImage(uid, imageData) {
  if (typeof window === 'undefined' || !uid) return null;
  window.localStorage.setItem(`reita-profile-image-${uid}`, imageData);
  return imageData;
}

export function getProfileImage(uid) {
  if (typeof window === 'undefined' || !uid) return '';
  return window.localStorage.getItem(`reita-profile-image-${uid}`) || '';
}

export function removeProfileImage(uid) {
  if (typeof window === 'undefined' || !uid) return;
  window.localStorage.removeItem(`reita-profile-image-${uid}`);
}

export function saveClient(uid, client) {
  const key = getStorageKey(uid, 'clients');
  const list = readStoredItems(key);
  const normalized = {
    ...client,
    id: client.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: client.createdAt || Date.now(),
  };

  const existingIndex = list.findIndex((item) => String(item.id) === String(normalized.id));
  if (existingIndex >= 0) {
    list[existingIndex] = normalized;
  } else {
    list.unshift(normalized);
  }

  writeStoredItems(key, list);
  return normalized;
}

export function getClients(uid) {
  return readStoredItems(getStorageKey(uid, 'clients'));
}

export function deleteClient(uid, id) {
  const key = getStorageKey(uid, 'clients');
  const list = readStoredItems(key).filter((item) => String(item.id) !== String(id));
  writeStoredItems(key, list);
  return list;
}

export function saveListing(uid, listing) {
  const key = getStorageKey(uid, 'listings');
  const list = readStoredItems(key);
  const normalized = { ...listing, id: listing.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: listing.createdAt || Date.now() };
  const index = list.findIndex((item) => String(item.id) === String(normalized.id));
  if (index >= 0) list[index] = normalized; else list.unshift(normalized);
  writeStoredItems(key, list);
  return normalized;
}

export function getListings(uid) { return readStoredItems(getStorageKey(uid, 'listings')); }

export function deleteListing(uid, id) {
  const key = getStorageKey(uid, 'listings');
  writeStoredItems(key, readStoredItems(key).filter((item) => String(item.id) !== String(id)));
}

export function getAllUsers() { return readStoredItems('reita-users'); }

export function updateUserRole(uid, investorType) {
  if (typeof window === 'undefined' || !uid) return null;
  if (!['Investor', 'Property Agent'].includes(investorType)) return null;
  const users = getAllUsers(); const index = users.findIndex((user) => user.id === uid);
  if (index < 0) return null;
  users[index] = { ...users[index], role: investorType };
  writeStoredItems('reita-users', users);
  const key = `reita-profile-${uid}`; const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
  window.localStorage.setItem(key, JSON.stringify({ ...saved, investorType }));
  return users[index];
}

export function disableUser(uid, disabled) {
  if (typeof window === 'undefined' || !uid) return null;
  const users = getAllUsers(); const index = users.findIndex((user) => user.id === uid);
  if (index < 0) return null;
  users[index] = { ...users[index], disabled };
  writeStoredItems('reita-users', users);
  return users[index];
}

export function deleteUser(uid) {
  if (typeof window === 'undefined' || !uid) return;
  writeStoredItems('reita-users', getAllUsers().filter((user) => user.id !== uid));
  window.localStorage.removeItem(`reita-profile-${uid}`);
}