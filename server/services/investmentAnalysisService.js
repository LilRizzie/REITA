// ------------------------------------------------------------
// INVESTMENT ANALYSIS SERVICE
// Generates investment score, strengths, weaknesses, and a
// recommendation from a property's financial data.
// Missing data is never invented — metrics are only computed
// when the underlying values are available.
// ------------------------------------------------------------

const fmtNumber = (value) => Number(value || 0);

/**
 * Analyze a property and produce an investment assessment.
 * @param {object} property - property-like object with financial fields
 */
function analyzeInvestment(property) {
  const purchasePrice = fmtNumber(property.purchasePrice);
  const currentValue = fmtNumber(property.currentValue || property.askingPrice || property.price);
  const rent = fmtNumber(
    property.annualRent ||
    property.annualRentalIncome ||
    (fmtNumber(property.monthlyRent) * 12) ||
    property.rent
  );
  const expenses = fmtNumber(property.annualExpenses);
  const loanAmount = fmtNumber(property.loanAmount || property.mortgage);
  const interestRate = fmtNumber(property.interestRate);
  const loanYears = fmtNumber(property.loanYears);
  const appreciation = fmtNumber(property.expectedAppreciation || property.appreciationRate);

  const netAnnualIncome = rent - expenses;
  const cashInvested = Math.max(purchasePrice - loanAmount, 0);
  const profit = currentValue - purchasePrice;
  const roi = cashInvested > 0 ? (netAnnualIncome / cashInvested) * 100 : null;
  const capitalGainPct = purchasePrice > 0 ? (profit / purchasePrice) * 100 : null;
  const monthlyCashflow = netAnnualIncome / 12;
  const payback = netAnnualIncome > 0 ? cashInvested / netAnnualIncome : null;
  const capRate = currentValue > 0 ? (netAnnualIncome / currentValue) * 100 : null;
  const rentalYield = purchasePrice > 0 ? (rent / purchasePrice) * 100 : null;

  // Monthly debt service (amortized).
  let monthlyDebtService = 0;
  if (loanAmount > 0 && interestRate > 0 && loanYears > 0) {
    const monthlyRate = interestRate / 100 / 12;
    const periods = loanYears * 12;
    monthlyDebtService = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
  }
  const cashOnCash = cashInvested > 0 ? ((netAnnualIncome - monthlyDebtService * 12) / cashInvested) * 100 : null;
  const monthlyProfit = monthlyCashflow - monthlyDebtService;

  // Projected future value (simple appreciation over 5 years).
  const projectedYears = 5;
  const projectedFutureValue = purchasePrice > 0 && appreciation > 0
    ? purchasePrice * Math.pow(1 + appreciation / 100, projectedYears)
    : null;

  // ---- Investment score (0-100) ----
  let score = 50;
  if (roi !== null) score += Math.max(-30, Math.min(30, roi * 1.5));
  if (rentalYield !== null) score += Math.max(-15, Math.min(15, rentalYield * 1.2));
  if (capRate !== null) score += Math.max(-10, Math.min(10, capRate * 1.0));
  if (netAnnualIncome < 0) score -= 20;
  if (expenses > 0 && rent > 0 && expenses > rent * 0.35) score -= 10;
  if (loanAmount > 0 && purchasePrice > 0 && loanAmount > purchasePrice * 0.6) score -= 5;
  if (appreciation > 0) score += Math.min(10, appreciation * 0.5);
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ---- Strengths & weaknesses ----
  const strengths = [];
  const weaknesses = [];

  if (roi !== null && roi >= 10) strengths.push(`Strong ROI of ${roi.toFixed(1)}% on cash invested.`);
  if (rentalYield !== null && rentalYield >= 6) strengths.push(`Healthy rental yield of ${rentalYield.toFixed(1)}%.`);
  if (capRate !== null && capRate >= 5) strengths.push(`Solid cap rate of ${capRate.toFixed(1)}%.`);
  if (netAnnualIncome > 0) strengths.push('Positive annual cash flow.');
  if (appreciation > 0) strengths.push(`Expected appreciation of ${appreciation.toFixed(1)}% per year.`);
  if (monthlyProfit > 0) strengths.push('Positive monthly profit after debt service.');

  if (netAnnualIncome < 0) weaknesses.push('Negative annual cash flow.');
  if (expenses > 0 && rent > 0 && expenses > rent * 0.35) weaknesses.push('Annual expenses are high relative to rental income.');
  if (loanAmount > 0 && purchasePrice > 0 && loanAmount > purchasePrice * 0.6) weaknesses.push('Loan amount is large relative to the purchase price.');
  if (roi !== null && roi < 5) weaknesses.push(`Low ROI of ${roi.toFixed(1)}%.`);
  if (rentalYield !== null && rentalYield < 4) weaknesses.push(`Low rental yield of ${rentalYield.toFixed(1)}%.`);
  if (purchasePrice <= 0) weaknesses.push('Purchase price is missing — metrics are incomplete.');
  if (rent <= 0) weaknesses.push('Rental income is missing — yield and cash flow cannot be fully assessed.');

  if (!strengths.length) strengths.push('No strong signals detected with the available data.');
  if (!weaknesses.length) weaknesses.push('No significant weaknesses detected with the available data.');

  // ---- Recommendation ----
  let recommendation = 'High Risk';
  let tone = 'danger';
  if (score >= 75) {
    recommendation = 'Excellent Investment';
    tone = 'success';
  } else if (score >= 60) {
    recommendation = 'Good Investment';
    tone = 'info';
  } else if (score >= 45) {
    recommendation = 'Average';
    tone = 'warning';
  }

  return {
    metrics: {
      purchasePrice,
      currentValue,
      annualRentalIncome: rent,
      annualExpenses: expenses,
      loanAmount,
      interestRate,
      loanYears,
      netAnnualIncome,
      cashInvested,
      profit,
      roi,
      capitalGainPct,
      monthlyCashflow,
      payback,
      monthlyDebtService,
      capRate,
      rentalYield,
      cashOnCash,
      monthlyProfit,
      projectedFutureValue,
      projectedYears,
    },
    investmentScore: score,
    risk: score >= 60 ? 'Low' : score >= 45 ? 'Medium' : 'High',
    strengths,
    weaknesses,
    recommendation,
    recommendationTone: tone,
  };
}

module.exports = {
  analyzeInvestment,
};