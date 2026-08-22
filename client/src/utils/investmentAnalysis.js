const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatCurrency = (value) => `₦${finiteNumber(value).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export const formatPercentage = (value, digits = 1) => (
  value === null || !Number.isFinite(Number(value)) ? 'N/A' : `${Number(value).toFixed(digits)}%`
);

export const getExpectedRentalIncome = (property) => finiteNumber(
  property?.expectedRentalIncome ?? property?.annualRentalIncome ?? property?.annualRent
);

export const calculateInvestmentAnalysis = (property) => {
  const purchasePrice = finiteNumber(property?.purchasePrice);
  const currentValue = finiteNumber(property?.currentValue);
  const rentalIncome = getExpectedRentalIncome(property);
  const annualExpenses = finiteNumber(property?.annualExpenses);
  const appreciationRate = finiteNumber(property?.expectedAppreciation ?? property?.appreciationRate);
  const annualAppreciation = purchasePrice * (appreciationRate / 100);
  const netRentalIncome = rentalIncome - annualExpenses;
  const annualCashFlow = netRentalIncome + annualAppreciation;
  const roi = purchasePrice > 0 ? (annualCashFlow / purchasePrice) * 100 : null;
  const rentalYield = purchasePrice > 0 ? (netRentalIncome / purchasePrice) * 100 : 0;
  const expenseRatio = rentalIncome > 0 ? (annualExpenses / rentalIncome) * 100 : 100;

  return {
    purchasePrice,
    currentValue,
    rentalIncome,
    annualExpenses,
    appreciationRate,
    annualAppreciation,
    appreciation: annualAppreciation,
    netRentalIncome,
    annualCashFlow,
    estimatedAnnualReturn: annualCashFlow,
    roi: Number.isFinite(roi) ? roi : null,
    rentalYield,
    expenseRatio,
    paybackPeriod: annualCashFlow > 0 ? purchasePrice / annualCashFlow : null,
  };
};

export const calculateInvestmentMetrics = calculateInvestmentAnalysis;

export const calculateRisk = (propertyOrAnalysis) => {
  const metrics = propertyOrAnalysis?.annualCashFlow !== undefined
    ? propertyOrAnalysis
    : calculateInvestmentAnalysis(propertyOrAnalysis);
  const weakCashFlow = metrics.annualCashFlow <= 0;

  if (weakCashFlow || metrics.roi === null || metrics.roi < 7 || metrics.rentalYield < 5 || metrics.expenseRatio > 50) {
    return {
      level: 'HIGH',
      reason: weakCashFlow
        ? 'High Risk — projected cash flow is negative or unavailable, so the investment is not currently self-supporting.'
        : metrics.expenseRatio > 50
          ? 'High Risk — the high expense burden reduces cash-flow stability.'
          : 'High Risk — projected returns or rental yield are below the stronger investment thresholds.',
    };
  }

  if (metrics.roi >= 12 && metrics.rentalYield >= 8 && metrics.expenseRatio <= 35) {
    return {
      level: 'LOW',
      reason: 'Low Risk — the property combines strong projected returns, healthy rental income, and a relatively low expense burden.',
    };
  }

  return {
    level: 'MEDIUM',
    reason: metrics.expenseRatio > 35
      ? 'Medium Risk — projected returns are reasonable, but higher annual expenses reduce cash-flow stability.'
      : 'Medium Risk — projected returns are reasonable, but rental yield or appreciation leaves some uncertainty.',
  };
};

export const calculateShareInvestment = (property, investmentAmount) => {
  const analysis = calculateInvestmentAnalysis(property);
  const amount = finiteNumber(investmentAmount);
  const pricePerShare = finiteNumber(property?.pricePerShare);
  const availableShares = Math.max(0, Math.floor(finiteNumber(property?.availableShares)));
  const minimumInvestment = Math.max(0, finiteNumber(property?.minimumInvestment));
  const shareDataAvailable = pricePerShare > 0 && availableShares > 0;
  const maxInvestment = pricePerShare * availableShares;
  const validationError = !shareDataAvailable
    ? ''
    : amount <= 0
      ? 'Investment amount must be greater than zero.'
    : amount < minimumInvestment
      ? `Investment amount must be at least ${formatCurrency(minimumInvestment)}.`
      : amount > maxInvestment
        ? `Investment amount cannot exceed ${formatCurrency(maxInvestment)}.`
        : amount < pricePerShare
          ? `Investment amount must be enough for one full share (${formatCurrency(pricePerShare)}).`
        : '';
  const numberOfShares = shareDataAvailable && amount >= pricePerShare
    ? Math.min(availableShares, Math.floor(amount / pricePerShare))
    : 0;
  const projectedAnnualIncome = shareDataAvailable
    ? numberOfShares * (analysis.netRentalIncome / availableShares)
    : analysis.netRentalIncome;
  const projectedAppreciation = shareDataAvailable
    ? numberOfShares * (analysis.annualAppreciation / availableShares)
    : analysis.annualAppreciation;

  return {
    amount,
    pricePerShare,
    availableShares,
    minimumInvestment,
    maxInvestment,
    shareDataAvailable,
    validationError,
    numberOfShares,
    projectedAnnualIncome,
    projectedAppreciation,
    projectedAnnualReturn: projectedAnnualIncome + projectedAppreciation,
  };
};

export const formatMetric = (value, digits = 1) => (
  value === null || !Number.isFinite(Number(value)) ? 'N/A' : Number(value).toFixed(digits)
);
