export const JOURNEY_PASS_PRICING = {
  NG:      { amount: 800,  currency: 'NGN', symbol: '₦',   display: '₦800' },
  GH:      { amount: 10,   currency: 'GHS', symbol: 'GH₵', display: 'GH₵10' },
  KE:      { amount: 100,  currency: 'KES', symbol: 'KSh', display: 'KSh100' },
  ZA:      { amount: 15,   currency: 'ZAR', symbol: 'R',   display: 'R15' },
  DEFAULT: { amount: 1.49, currency: 'USD', symbol: '$',   display: '$1.49' },
}

const COUNTRY_CODES = {
  Nigeria: 'NG', Ghana: 'GH', Kenya: 'KE', 'South Africa': 'ZA',
}

export function getJourneyPassPrice(countryName) {
  const code = COUNTRY_CODES[countryName] || 'DEFAULT'
  return JOURNEY_PASS_PRICING[code]
}
