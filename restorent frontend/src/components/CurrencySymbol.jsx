import React, { useState, useEffect } from 'react';

// Complete currency symbol map
const CURRENCY_SYMBOLS = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", JPY: "¥", CNY: "¥",
  SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", KRW: "₩", PHP: "₱", SAR: "﷼",
  QAR: "﷼", KWD: "د.ك", OMR: "﷼", BHD: ".د.ب", CAD: "CA$", AUD: "A$", NZD: "NZ$",
  CHF: "CHF", ZAR: "R", BRL: "R$", PKR: "₨", LKR: "Rs", NGN: "₦", EGP: "E£",
  TRY: "₺", MXN: "$", SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč",
  HUF: "Ft", HKD: "HK$", TWD: "NT$", MAD: "د.م.", TND: "د.ت", DZD: "دج",
  IQD: "ع.د", JOD: "د.ا", BDT: "৳", VND: "₫", THB: "฿", MMK: "Ks",
  ETB: "Br", GHS: "₵", KES: "KSh", TZS: "Sh", UGX: "USh", ZMW: "ZK",
};

/**
 * Resolve currency code based on priority:
 * 1. Explicit currencyCode prop
 * 2. activeCompany/activeBranch lookup from currency_map stored in user localStorage
 * 3. active_company / active_branch from localStorage keys
 * 4. systemSettings localStorage
 * 5. user.tenant_currency
 * 6. "INR" fallback
 */
export function resolveCurrencyCode(currencyCode = null, activeCompany = null, activeBranch = null) {
  // Priority 1: explicit prop
  if (currencyCode) return currencyCode.toUpperCase();

  try {
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const currencyMap = userObj?.currency_map || {};

    // Priority 2: Resolve from currency_map using activeCompany/activeBranch
    const resolveComp = activeCompany || localStorage.getItem('active_company') || '';
    const resolveBranch = activeBranch || localStorage.getItem('active_branch') || '';

    // Branch-specific key first: "CompanyName|BranchName"
    if (resolveComp && resolveBranch && resolveBranch !== 'All' && resolveBranch !== 'All Branches') {
      const branchKey = `${resolveComp}|${resolveBranch}`;
      if (currencyMap[branchKey]) return currencyMap[branchKey].toUpperCase();
      // Try branch name alone
      if (currencyMap[resolveBranch]) return currencyMap[resolveBranch].toUpperCase();
    }

    // Company-specific key
    if (resolveComp && resolveComp !== 'All' && resolveComp !== 'All Companies') {
      if (currencyMap[resolveComp]) return currencyMap[resolveComp].toUpperCase();
    }

    // "All companies" → use tenant-level currency
    if (resolveComp === 'All' || resolveComp === 'All Companies' || !resolveComp) {
      if (currencyMap['All']) return currencyMap['All'].toUpperCase();
      if (currencyMap['__tenant__']) return currencyMap['__tenant__'].toUpperCase();
    }

    // Priority 3: systemSettings
    const storedSettings = localStorage.getItem('systemSettings');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed.currency) {
        const codeMatch = parsed.currency.match(/[A-Z]{3}/);
        if (codeMatch) return codeMatch[0];
      }
    }

    // Priority 4: user.tenant_currency
    if (userObj?.tenant_currency) return userObj.tenant_currency.toUpperCase();

  } catch (e) {
    // Silent fallback
  }

  return 'INR';
}

/**
 * CurrencySymbol Component
 * 
 * Props:
 *   - currencyCode: explicit currency code (e.g., "AED", "INR") — takes top priority
 *   - activeCompany: the currently selected/filtered company name
 *   - activeBranch: the currently selected/filtered branch name
 *   - size: font/icon size in px (default 18)
 *   - style: additional inline styles
 */
const CurrencySymbol = ({ size = 18, style = {}, currencyCode = null, activeCompany = null, activeBranch = null }) => {
  const [resolvedCode, setResolvedCode] = useState(() =>
    resolveCurrencyCode(currencyCode, activeCompany, activeBranch)
  );

  useEffect(() => {
    setResolvedCode(resolveCurrencyCode(currencyCode, activeCompany, activeBranch));
  }, [currencyCode, activeCompany, activeBranch]);

  const code = (resolvedCode || 'INR').toUpperCase();

  if (code === 'AED') {
    return (
      <img
        src="/assets/Dirham Currency Symbol - Black.svg"
        alt="AED"
        style={{
          height: size,
          width: 'auto',
          verticalAlign: 'middle',
          marginRight: '2px',
          filter: 'brightness(0.1)',
          ...style
        }}
      />
    );
  }

  const symbol = CURRENCY_SYMBOLS[code] || code;

  return (
    <span style={{ fontSize: size, fontWeight: '500', marginRight: '2px', lineHeight: 1, ...style }}>
      {symbol}
    </span>
  );
};

export default CurrencySymbol;
