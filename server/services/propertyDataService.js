const ReferenceProperty = require('../models/ReferenceProperty');

// ------------------------------------------------------------
// PROPERTY DATA SERVICE
// Clean abstraction for reference/market property data.
//
// Currently REITA stores reference properties in MongoDB and
// allows administrators to import them manually. A future
// external provider (e.g. a real-estate API) can be plugged in
// here without changing the rest of the application.
//
// To enable a future provider, set the documented environment
// variable (e.g. PROPERTY_API_KEY) and implement fetchFromProvider().
// ------------------------------------------------------------

const PROVIDER_ENABLED = Boolean(process.env.PROPERTY_API_KEY && process.env.PROPERTY_API_URL);

/**
 * Search reference properties with optional filters.
 * @param {object} filters { query, propertyType, state, city, minPrice, maxPrice, minRent, maxRent, limit }
 */
async function searchReferenceProperties(filters = {}) {
  const {
    query = '',
    propertyType = '',
    state = '',
    city = '',
    minPrice,
    maxPrice,
    minRent,
    maxRent,
    limit = 50,
  } = filters;

  const filter = {};

  if (query) {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { propertyName: regex },
      { address: regex },
      { city: regex },
      { state: regex },
      { description: regex },
    ];
  }

  if (propertyType) filter.propertyType = propertyType;
  if (state) filter.state = state;
  if (city) filter.city = city;

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  if (minRent !== undefined || maxRent !== undefined) {
    filter.rent = {};
    if (minRent !== undefined) filter.rent.$gte = Number(minRent);
    if (maxRent !== undefined) filter.rent.$lte = Number(maxRent);
  }

  const items = await ReferenceProperty.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 200));

  return items;
}

/**
 * Import/synchronize a reference property. Avoids creating duplicate
 * records when the same external property is imported repeatedly.
 * @param {object} data
 */
async function importReferenceProperty(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Reference property data is required.');
  }

  const externalId = data.externalId || '';
  const source = data.source || 'manual';

  // If an externalId + source is provided, upsert to avoid duplicates.
  if (externalId) {
    const existing = await ReferenceProperty.findOne({ externalId, source });
    if (existing) {
      Object.assign(existing, {
        propertyName: data.propertyName ?? existing.propertyName,
        propertyType: data.propertyType ?? existing.propertyType,
        state: data.state ?? existing.state,
        city: data.city ?? existing.city,
        address: data.address ?? existing.address,
        latitude: data.latitude ?? existing.latitude,
        longitude: data.longitude ?? existing.longitude,
        price: data.price ?? existing.price,
        rent: data.rent ?? existing.rent,
        bedrooms: data.bedrooms ?? existing.bedrooms,
        bathrooms: data.bathrooms ?? existing.bathrooms,
        area: data.area ?? existing.area,
        description: data.description ?? existing.description,
        image: data.image ?? existing.image,
        listingUrl: data.listingUrl ?? existing.listingUrl,
        fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : new Date(),
        metadata: data.metadata ?? existing.metadata,
      });
      await existing.save();
      return { property: existing, created: false };
    }
  }

  const property = await ReferenceProperty.create({
    externalId,
    source,
    propertyName: data.propertyName || '',
    propertyType: data.propertyType || 'Residential',
    state: data.state || '',
    city: data.city || '',
    address: data.address || '',
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    price: Number(data.price) || 0,
    rent: Number(data.rent) || 0,
    bedrooms: Number(data.bedrooms) || 0,
    bathrooms: Number(data.bathrooms) || 0,
    area: Number(data.area) || 0,
    description: data.description || '',
    image: data.image || '',
    listingUrl: data.listingUrl || '',
    fetchedAt: data.fetchedAt ? new Date(data.fetchedAt) : new Date(),
    metadata: data.metadata || {},
  });

  return { property, created: true };
}

/**
 * Import many reference properties at once (deduplicated).
 */
async function importReferenceProperties(items) {
  const results = [];
  for (const item of items || []) {
    try {
      results.push(await importReferenceProperty(item));
    } catch (error) {
      results.push({ error: error.message, item });
    }
  }
  return results;
}

/**
 * Retrieve comparable reference properties for a given property.
 * Uses location + property type + price/rent proximity.
 * @param {object} property - user property (normalized or raw)
 * @param {object} options { limit }
 */
async function getComparableProperties(property, options = {}) {
  const limit = Math.min(Number(options.limit) || 5, 20);
  const filter = {};

  const type = property.propertyType || property.propertyType;
  const state = property.state || '';
  const city = property.city || '';
  const price = Number(property.currentValue || property.purchasePrice || property.askingPrice || 0);
  const rent = Number(property.annualRent || property.annualRentalIncome || (Number(property.monthlyRent || 0) * 12) || 0);

  if (type) filter.propertyType = type;

  // Prefer same state/city when available.
  const locationClauses = [];
  if (city) locationClauses.push({ city });
  if (state) locationClauses.push({ state });
  if (locationClauses.length) filter.$or = locationClauses;

  let candidates = await ReferenceProperty.find(filter).limit(100);

  // Score candidates by proximity to the user property.
  const scored = candidates
    .map((candidate) => {
      let score = 0;
      if (candidate.propertyType === type) score += 20;
      if (candidate.city && candidate.city === city) score += 30;
      else if (candidate.state && candidate.state === state) score += 15;

      if (price > 0 && candidate.price > 0) {
        const priceRatio = Math.abs(candidate.price - price) / price;
        score += Math.max(0, 40 - priceRatio * 100);
      }
      if (rent > 0 && candidate.rent > 0) {
        const rentRatio = Math.abs(candidate.rent - rent) / rent;
        score += Math.max(0, 20 - rentRatio * 100);
      }
      if (candidate.bedrooms && property.bedrooms && candidate.bedrooms === property.bedrooms) score += 5;
      if (candidate.bathrooms && property.bathrooms && candidate.bathrooms === property.bathrooms) score += 5;

      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);

  return scored;
}

/**
 * Fetch from an external provider. Currently a no-op unless a provider
 * is configured. This keeps the app decoupled from any single provider.
 */
async function fetchFromProvider() {
  if (!PROVIDER_ENABLED) {
    return { enabled: false, items: [], message: 'No external property provider configured.' };
  }

  // Future: call the external API here using process.env.PROPERTY_API_URL
  // and process.env.PROPERTY_API_KEY, then importReferenceProperties(items).
  return { enabled: true, items: [], message: 'External provider not yet implemented.' };
}

module.exports = {
  searchReferenceProperties,
  importReferenceProperty,
  importReferenceProperties,
  getComparableProperties,
  fetchFromProvider,
  PROVIDER_ENABLED,
};