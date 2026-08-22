// ------------------------------------------------------------
// COMPARISON SERVICE
// Compares a user property against reference/market properties.
// Only uses available data — missing metrics are clearly marked.
// ------------------------------------------------------------

const fmtNumber = (value) => Number(value || 0);

/**
 * Compute financial metrics for a property-like object.
 * Accepts either a user Property or a ReferenceProperty.
 */
function computeMetrics(property) {
  const price = fmtNumber(property.currentValue || property.purchasePrice || property.askingPrice || property.price);
  const rent = fmtNumber(
    property.annualRent ||
    property.annualRentalIncome ||
    (fmtNumber(property.monthlyRent) * 12) ||
    property.rent
  );
  const expenses = fmtNumber(property.annualExpenses);
  const area = fmtNumber(property.area);
  const bedrooms = fmtNumber(property.bedrooms);
  const bathrooms = fmtNumber(property.bathrooms);
  const appreciation = fmtNumber(property.expectedAppreciation || property.appreciationRate);

  const rentalYield = price > 0 ? (rent / price) * 100 : null;
  const netIncome = rent - expenses;
  const capRate = price > 0 ? (netIncome / price) * 100 : null;
  const pricePerSqm = area > 0 ? price / area : null;
  const rentPerSqm = area > 0 ? rent / area : null;

  return {
    price,
    rent,
    expenses,
    area,
    bedrooms,
    bathrooms,
    appreciation,
    rentalYield,
    netIncome,
    capRate,
    pricePerSqm,
    rentPerSqm,
  };
}

/**
 * Build a comparison between a user property and reference properties.
 * @param {object} userProperty - the user's property (raw or normalized)
 * @param {Array} referenceProperties - reference/market properties
 */
function buildComparison(userProperty, referenceProperties) {
  const base = computeMetrics(userProperty);

  const comparables = (referenceProperties || []).map((ref) => {
    const metrics = computeMetrics(ref);

    const priceDiff = base.price > 0 && metrics.price > 0 ? metrics.price - base.price : null;
    const priceDiffPct = base.price > 0 && metrics.price > 0 ? (priceDiff / base.price) * 100 : null;
    const rentDiff = base.rent > 0 && metrics.rent > 0 ? metrics.rent - base.rent : null;
    const rentDiffPct = base.rent > 0 && metrics.rent > 0 ? (rentDiff / base.rent) * 100 : null;
    const yieldDiff = base.rentalYield !== null && metrics.rentalYield !== null ? metrics.rentalYield - base.rentalYield : null;

    return {
      id: String(ref._id || ref.id || ''),
      propertyName: ref.propertyName || 'Unnamed reference property',
      propertyType: ref.propertyType || '',
      state: ref.state || '',
      city: ref.city || '',
      address: ref.address || '',
      image: ref.image || '',
      source: ref.source || 'manual',
      listingUrl: ref.listingUrl || '',
      metrics,
      differences: {
        priceDiff,
        priceDiffPct,
        rentDiff,
        rentDiffPct,
        yieldDiff,
      },
    };
  });

  return {
    baseProperty: {
      id: String(userProperty._id || userProperty.id || ''),
      propertyName: userProperty.propertyName || 'Selected property',
      propertyType: userProperty.propertyType || '',
      state: userProperty.state || '',
      city: userProperty.city || '',
      address: userProperty.address || '',
      image: userProperty.image || '',
      metrics: base,
    },
    comparables,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  computeMetrics,
  buildComparison,
};