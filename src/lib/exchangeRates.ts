import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Standard baseline FX rates relative to USD (1 USD = X Currency)
 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1600.0,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 155.0,
  GHS: 15.2,
  KES: 130.0,
  ZAR: 18.5,
};

/**
 * Fetches exchange rates from Supabase exchange_rates table or open FX API,
 * with resilient fallback to cached / default market rates.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency, rate');

      if (!error && data && data.length > 0) {
        const ratesMap: Record<string, number> = { USD: 1.0 };
        data.forEach((row: { currency: string; rate: number }) => {
          if (row.currency && row.rate) {
            ratesMap[row.currency.toUpperCase()] = Number(row.rate);
          }
        });
        return { ...DEFAULT_EXCHANGE_RATES, ...ratesMap };
      }
    } catch {
      // Gracefully continue to fallback
    }
  }

  // Attempt live open FX rate sync if online
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'force-cache' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.rates) {
        return { ...DEFAULT_EXCHANGE_RATES, ...json.rates };
      }
    }
  } catch {
    // Offline or network error - use default rates
  }

  return DEFAULT_EXCHANGE_RATES;
}

/**
 * Convert an amount from one currency to another using exchange rates relative to USD
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES
): number {
  if (!amount || amount === 0) return 0;
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'USD').toUpperCase();
  if (from === to) return amount;

  const rateFrom = rates[from] || DEFAULT_EXCHANGE_RATES[from] || 1.0;
  const rateTo = rates[to] || DEFAULT_EXCHANGE_RATES[to] || 1.0;

  // Convert `from` to USD baseline, then USD to `to`
  const amountInUSD = amount / rateFrom;
  return amountInUSD * rateTo;
}

/**
 * Format currency with proper symbols and number localization
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if currency code is non-standard
    const symbolMap: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      CAD: 'CA$',
      AUD: 'A$',
      JPY: '¥',
    };
    const sym = symbolMap[currencyCode.toUpperCase()] || `${currencyCode.toUpperCase()} `;
    return `${sym}${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
