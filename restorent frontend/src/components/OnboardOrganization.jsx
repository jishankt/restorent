import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Mail, Key, Award, CheckCircle, HelpCircle, FileText, Upload } from 'lucide-react';
import CurrencySymbol from './CurrencySymbol';

const countryMeta = {
  "Afghanistan": { phone_code: "+93", phone_length: 9, currency: "AFN", currency_symbol: "؋" },
  "Albania": { phone_code: "+355", phone_length: 9, currency: "ALL", currency_symbol: "L" },
  "Algeria": { phone_code: "+213", phone_length: 9, currency: "DZD", currency_symbol: "دج" },
  "Andorra": { phone_code: "+376", phone_length: 6, currency: "EUR", currency_symbol: "€" },
  "Angola": { phone_code: "+244", phone_length: 9, currency: "AOA", currency_symbol: "Kz" },
  "Antigua and Barbuda": { phone_code: "+1268", phone_length: 7, currency: "XCD", currency_symbol: "$" },
  "Argentina": { phone_code: "+54", phone_length: 10, currency: "ARS", currency_symbol: "$" },
  "Armenia": { phone_code: "+374", phone_length: 8, currency: "AMD", currency_symbol: "֏" },
  "Australia": { phone_code: "+61", phone_length: 9, currency: "AUD", currency_symbol: "$" },
  "Austria": { phone_code: "+43", phone_length: 10, currency: "EUR", currency_symbol: "€" },
  "Azerbaijan": { phone_code: "+994", phone_length: 9, currency: "AZN", currency_symbol: "₼" },
  "Bahamas": { phone_code: "+1242", phone_length: 7, currency: "BSD", currency_symbol: "$" },
  "Bahrain": { phone_code: "+973", phone_length: 8, currency: "BHD", currency_symbol: ".د.ب" },
  "Bangladesh": { phone_code: "+880", phone_length: 10, currency: "BDT", currency_symbol: "৳" },
  "Barbados": { phone_code: "+1246", phone_length: 7, currency: "BBD", currency_symbol: "$" },
  "Belarus": { phone_code: "+375", phone_length: 9, currency: "BYN", currency_symbol: "Br" },
  "Belgium": { phone_code: "+32", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Belize": { phone_code: "+501", phone_length: 7, currency: "BZD", currency_symbol: "BZ$" },
  "Benin": { phone_code: "+229", phone_length: 8, currency: "XOF", currency_symbol: "CFA" },
  "Bhutan": { phone_code: "+975", phone_length: 8, currency: "BTN", currency_symbol: "Nu." },
  "Bolivia": { phone_code: "+591", phone_length: 8, currency: "BOB", currency_symbol: "Bs." },
  "Bosnia and Herzegovina": { phone_code: "+387", phone_length: 8, currency: "BAM", currency_symbol: "KM" },
  "Botswana": { phone_code: "+267", phone_length: 8, currency: "BWP", currency_symbol: "P" },
  "Brazil": { phone_code: "+55", phone_length: 11, currency: "BRL", currency_symbol: "R$" },
  "Brunei": { phone_code: "+673", phone_length: 7, currency: "BND", currency_symbol: "$" },
  "Bulgaria": { phone_code: "+359", phone_length: 9, currency: "BGN", currency_symbol: "лв" },
  "Burkina Faso": { phone_code: "+226", phone_length: 8, currency: "XOF", currency_symbol: "CFA" },
  "Burundi": { phone_code: "+257", phone_length: 8, currency: "BIF", currency_symbol: "FBu" },
  "Cambodia": { phone_code: "+855", phone_length: 9, currency: "KHR", currency_symbol: "៛" },
  "Cameroon": { phone_code: "+237", phone_length: 9, currency: "XAF", currency_symbol: "FCFA" },
  "Canada": { phone_code: "+1", phone_length: 10, currency: "CAD", currency_symbol: "$" },
  "Cape Verde": { phone_code: "+238", phone_length: 7, currency: "CVE", currency_symbol: "$" },
  "Central African Republic": { phone_code: "+236", phone_length: 8, currency: "XAF", currency_symbol: "FCFA" },
  "Chad": { phone_code: "+235", phone_length: 8, currency: "XAF", currency_symbol: "FCFA" },
  "Chile": { phone_code: "+56", phone_length: 9, currency: "CLP", currency_symbol: "$" },
  "China": { phone_code: "+86", phone_length: 11, currency: "CNY", currency_symbol: "¥" },
  "Colombia": { phone_code: "+57", phone_length: 10, currency: "COP", currency_symbol: "$" },
  "Comoros": { phone_code: "+269", phone_length: 7, currency: "KMF", currency_symbol: "CF" },
  "Costa Rica": { phone_code: "+506", phone_length: 8, currency: "CRC", currency_symbol: "₡" },
  "Croatia": { phone_code: "+385", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Cuba": { phone_code: "+53", phone_length: 8, currency: "CUP", currency_symbol: "$" },
  "Cyprus": { phone_code: "+357", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Czech Republic": { phone_code: "+420", phone_length: 9, currency: "CZK", currency_symbol: "Kč" },
  "Denmark": { phone_code: "+45", phone_length: 8, currency: "DKK", currency_symbol: "kr" },
  "Djibouti": { phone_code: "+253", phone_length: 8, currency: "DJF", currency_symbol: "Fdj" },
  "Dominica": { phone_code: "+1767", phone_length: 7, currency: "XCD", currency_symbol: "$" },
  "Dominican Republic": { phone_code: "+1809", phone_length: 10, currency: "DOP", currency_symbol: "RD$" },
  "Ecuador": { phone_code: "+593", phone_length: 9, currency: "USD", currency_symbol: "$" },
  "Egypt": { phone_code: "+20", phone_length: 10, currency: "EGP", currency_symbol: "E£" },
  "El Salvador": { phone_code: "+503", phone_length: 8, currency: "USD", currency_symbol: "$" },
  "Equatorial Guinea": { phone_code: "+240", phone_length: 9, currency: "XAF", currency_symbol: "FCFA" },
  "Eritrea": { phone_code: "+291", phone_length: 7, currency: "ERN", currency_symbol: "Nfk" },
  "Estonia": { phone_code: "+372", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Eswatini": { phone_code: "+268", phone_length: 8, currency: "SZL", currency_symbol: "E" },
  "Ethiopia": { phone_code: "+251", phone_length: 9, currency: "ETB", currency_symbol: "Br" },
  "Fiji": { phone_code: "+679", phone_length: 7, currency: "FJD", currency_symbol: "$" },
  "Finland": { phone_code: "+358", phone_length: 10, currency: "EUR", currency_symbol: "€" },
  "France": { phone_code: "+33", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Gabon": { phone_code: "+241", phone_length: 8, currency: "XAF", currency_symbol: "FCFA" },
  "Gambia": { phone_code: "+220", phone_length: 7, currency: "GMD", currency_symbol: "D" },
  "Georgia": { phone_code: "+995", phone_length: 9, currency: "GEL", currency_symbol: "₾" },
  "Germany": { phone_code: "+49", phone_length: 11, currency: "EUR", currency_symbol: "€" },
  "Ghana": { phone_code: "+233", phone_length: 9, currency: "GHS", currency_symbol: "₵" },
  "Greece": { phone_code: "+30", phone_length: 10, currency: "EUR", currency_symbol: "€" },
  "Grenada": { phone_code: "+1473", phone_length: 7, currency: "XCD", currency_symbol: "$" },
  "Guatemala": { phone_code: "+502", phone_length: 8, currency: "GTQ", currency_symbol: "Q" },
  "Guinea": { phone_code: "+224", phone_length: 9, currency: "GNF", currency_symbol: "FG" },
  "Guinea-Bissau": { phone_code: "+245", phone_length: 7, currency: "XOF", currency_symbol: "CFA" },
  "Guyana": { phone_code: "+592", phone_length: 7, currency: "GYD", currency_symbol: "$" },
  "Haiti": { phone_code: "+509", phone_length: 8, currency: "HTG", currency_symbol: "G" },
  "Honduras": { phone_code: "+504", phone_length: 8, currency: "HNL", currency_symbol: "L" },
  "Hungary": { phone_code: "+36", phone_length: 9, currency: "HUF", currency_symbol: "Ft" },
  "Iceland": { phone_code: "+354", phone_length: 7, currency: "ISK", currency_symbol: "kr" },
  "India": { phone_code: "+91", phone_length: 10, currency: "INR", currency_symbol: "₹" },
  "Indonesia": { phone_code: "+62", phone_length: 10, currency: "IDR", currency_symbol: "Rp" },
  "Iran": { phone_code: "+98", phone_length: 10, currency: "IRR", currency_symbol: "﷼" },
  "Iraq": { phone_code: "+964", phone_length: 10, currency: "IQD", currency_symbol: "ع.د" },
  "Ireland": { phone_code: "+353", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Israel": { phone_code: "+972", phone_length: 9, currency: "ILS", currency_symbol: "₪" },
  "Italy": { phone_code: "+39", phone_length: 10, currency: "EUR", currency_symbol: "€" },
  "Jamaica": { phone_code: "+1876", phone_length: 7, currency: "JMD", currency_symbol: "J$" },
  "Japan": { phone_code: "+81", phone_length: 10, currency: "JPY", currency_symbol: "¥" },
  "Jordan": { phone_code: "+962", phone_length: 9, currency: "JOD", currency_symbol: "د.ا" },
  "Kazakhstan": { phone_code: "+7", phone_length: 10, currency: "KZT", currency_symbol: "₸" },
  "Kenya": { phone_code: "+254", phone_length: 9, currency: "KES", currency_symbol: "KSh" },
  "Kiribati": { phone_code: "+686", phone_length: 8, currency: "AUD", currency_symbol: "$" },
  "Kuwait": { phone_code: "+965", phone_length: 8, currency: "KWD", currency_symbol: "د.ك" },
  "Kyrgyzstan": { phone_code: "+996", phone_length: 9, currency: "KGS", currency_symbol: "сом" },
  "Laos": { phone_code: "+856", phone_length: 8, currency: "LAK", currency_symbol: "₭" },
  "Latvia": { phone_code: "+371", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Lebanon": { phone_code: "+961", phone_length: 8, currency: "LBP", currency_symbol: "ل.ل" },
  "Lesotho": { phone_code: "+266", phone_length: 8, currency: "LSL", currency_symbol: "L" },
  "Liberia": { phone_code: "+231", phone_length: 8, currency: "LRD", currency_symbol: "$" },
  "Libya": { phone_code: "+218", phone_length: 9, currency: "LYD", currency_symbol: "ل.د" },
  "Liechtenstein": { phone_code: "+423", phone_length: 7, currency: "CHF", currency_symbol: "CHF" },
  "Lithuania": { phone_code: "+370", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Luxembourg": { phone_code: "+352", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Madagascar": { phone_code: "+261", phone_length: 9, currency: "MGA", currency_symbol: "Ar" },
  "Malawi": { phone_code: "+265", phone_length: 9, currency: "MWK", currency_symbol: "MK" },
  "Malaysia": { phone_code: "+60", phone_length: 9, currency: "MYR", currency_symbol: "RM" },
  "Maldives": { phone_code: "+960", phone_length: 7, currency: "MVR", currency_symbol: "Rf" },
  "Mali": { phone_code: "+223", phone_length: 8, currency: "XOF", currency_symbol: "CFA" },
  "Malta": { phone_code: "+356", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Marshall Islands": { phone_code: "+692", phone_length: 7, currency: "USD", currency_symbol: "$" },
  "Mauritania": { phone_code: "+222", phone_length: 8, currency: "MRU", currency_symbol: "UM" },
  "Mauritius": { phone_code: "+230", phone_length: 8, currency: "MUR", currency_symbol: "₨" },
  "Mexico": { phone_code: "+52", phone_length: 10, currency: "MXN", currency_symbol: "$" },
  "Micronesia": { phone_code: "+691", phone_length: 7, currency: "USD", currency_symbol: "$" },
  "Moldova": { phone_code: "+373", phone_length: 8, currency: "MDL", currency_symbol: "L" },
  "Monaco": { phone_code: "+377", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Mongolia": { phone_code: "+976", phone_length: 8, currency: "MNT", currency_symbol: "₮" },
  "Montenegro": { phone_code: "+382", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Morocco": { phone_code: "+212", phone_length: 9, currency: "MAD", currency_symbol: "د.م." },
  "Mozambique": { phone_code: "+258", phone_length: 9, currency: "MZN", currency_symbol: "MT" },
  "Myanmar": { phone_code: "+95", phone_length: 9, currency: "MMK", currency_symbol: "Ks" },
  "Namibia": { phone_code: "+264", phone_length: 9, currency: "NAD", currency_symbol: "$" },
  "Nauru": { phone_code: "+674", phone_length: 7, currency: "AUD", currency_symbol: "$" },
  "Nepal": { phone_code: "+977", phone_length: 10, currency: "NPR", currency_symbol: "₨" },
  "Netherlands": { phone_code: "+31", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "New Zealand": { phone_code: "+64", phone_length: 9, currency: "NZD", currency_symbol: "$" },
  "Nicaragua": { phone_code: "+505", phone_length: 8, currency: "NIO", currency_symbol: "C$" },
  "Niger": { phone_code: "+227", phone_length: 8, currency: "XOF", currency_symbol: "CFA" },
  "Nigeria": { phone_code: "+234", phone_length: 10, currency: "NGN", currency_symbol: "₦" },
  "North Korea": { phone_code: "+850", phone_length: 10, currency: "KPW", currency_symbol: "₩" },
  "North Macedonia": { phone_code: "+389", phone_length: 8, currency: "MKD", currency_symbol: "ден" },
  "Norway": { phone_code: "+47", phone_length: 8, currency: "NOK", currency_symbol: "kr" },
  "Oman": { phone_code: "+968", phone_length: 8, currency: "OMR", currency_symbol: "﷼" },
  "Pakistan": { phone_code: "+92", phone_length: 10, currency: "PKR", currency_symbol: "₨" },
  "Palau": { phone_code: "+680", phone_length: 7, currency: "USD", currency_symbol: "$" },
  "Panama": { phone_code: "+507", phone_length: 8, currency: "PAB", currency_symbol: "B/." },
  "Papua New Guinea": { phone_code: "+675", phone_length: 8, currency: "PGK", currency_symbol: "K" },
  "Paraguay": { phone_code: "+595", phone_length: 9, currency: "PYG", currency_symbol: "₲" },
  "Peru": { phone_code: "+51", phone_length: 9, currency: "PEN", currency_symbol: "S/" },
  "Philippines": { phone_code: "+63", phone_length: 10, currency: "PHP", currency_symbol: "₱" },
  "Poland": { phone_code: "+48", phone_length: 9, currency: "PLN", currency_symbol: "zł" },
  "Portugal": { phone_code: "+351", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Qatar": { phone_code: "+974", phone_length: 8, currency: "QAR", currency_symbol: "﷼" },
  "Romania": { phone_code: "+40", phone_length: 9, currency: "RON", currency_symbol: "lei" },
  "Russia": { phone_code: "+7", phone_length: 10, currency: "RUB", currency_symbol: "₽" },
  "Rwanda": { phone_code: "+250", phone_length: 9, currency: "RWF", currency_symbol: "FRw" },
  "Saint Lucia": { phone_code: "+1758", phone_length: 7, currency: "XCD", currency_symbol: "$" },
  "Samoa": { phone_code: "+685", phone_length: 7, currency: "WST", currency_symbol: "T" },
  "San Marino": { phone_code: "+378", phone_length: 10, currency: "EUR", currency_symbol: "€" },
  "Saudi Arabia": { phone_code: "+966", phone_length: 9, currency: "SAR", currency_symbol: "﷼" },
  "Senegal": { phone_code: "+221", phone_length: 9, currency: "XOF", currency_symbol: "CFA" },
  "Serbia": { phone_code: "+381", phone_length: 9, currency: "RSD", currency_symbol: "дин." },
  "Seychelles": { phone_code: "+248", phone_length: 7, currency: "SCR", currency_symbol: "₨" },
  "Sierra Leone": { phone_code: "+232", phone_length: 8, currency: "SLE", currency_symbol: "Le" },
  "Singapore": { phone_code: "+65", phone_length: 8, currency: "SGD", currency_symbol: "$" },
  "Slovakia": { phone_code: "+421", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Slovenia": { phone_code: "+386", phone_length: 8, currency: "EUR", currency_symbol: "€" },
  "Solomon Islands": { phone_code: "+677", phone_length: 7, currency: "SBD", currency_symbol: "$" },
  "Somalia": { phone_code: "+252", phone_length: 8, currency: "SOS", currency_symbol: "Sh" },
  "South Africa": { phone_code: "+27", phone_length: 9, currency: "ZAR", currency_symbol: "R" },
  "South Korea": { phone_code: "+82", phone_length: 10, currency: "KRW", currency_symbol: "₩" },
  "South Sudan": { phone_code: "+211", phone_length: 9, currency: "SSP", currency_symbol: "£" },
  "Spain": { phone_code: "+34", phone_length: 9, currency: "EUR", currency_symbol: "€" },
  "Sri Lanka": { phone_code: "+94", phone_length: 9, currency: "LKR", currency_symbol: "Rs" },
  "Sudan": { phone_code: "+249", phone_length: 9, currency: "SDG", currency_symbol: "ج.س." },
  "Suriname": { phone_code: "+597", phone_length: 7, currency: "SRD", currency_symbol: "$" },
  "Sweden": { phone_code: "+46", phone_length: 9, currency: "SEK", currency_symbol: "kr" },
  "Switzerland": { phone_code: "+41", phone_length: 9, currency: "CHF", currency_symbol: "CHF" },
  "Syria": { phone_code: "+963", phone_length: 9, currency: "SYP", currency_symbol: "£" },
  "Taiwan": { phone_code: "+886", phone_length: 9, currency: "TWD", currency_symbol: "NT$" },
  "Tajikistan": { phone_code: "+992", phone_length: 9, currency: "TJS", currency_symbol: "ЅМ" },
  "Tanzania": { phone_code: "+255", phone_length: 9, currency: "TZS", currency_symbol: "Sh" },
  "Thailand": { phone_code: "+66", phone_length: 9, currency: "THB", currency_symbol: "฿" },
  "Togo": { phone_code: "+228", phone_length: 8, currency: "XOF", currency_symbol: "CFA" },
  "Tonga": { phone_code: "+676", phone_length: 7, currency: "TOP", currency_symbol: "T$" },
  "Trinidad and Tobago": { phone_code: "+1868", phone_length: 7, currency: "TTD", currency_symbol: "TT$" },
  "Tunisia": { phone_code: "+216", phone_length: 8, currency: "TND", currency_symbol: "د.ت" },
  "Turkey": { phone_code: "+90", phone_length: 10, currency: "TRY", currency_symbol: "₺" },
  "Turkmenistan": { phone_code: "+993", phone_length: 8, currency: "TMT", currency_symbol: "m" },
  "Tuvalu": { phone_code: "+688", phone_length: 6, currency: "AUD", currency_symbol: "$" },
  "Uganda": { phone_code: "+256", phone_length: 9, currency: "UGX", currency_symbol: "USh" },
  "Ukraine": { phone_code: "+380", phone_length: 9, currency: "UAH", currency_symbol: "₴" },
  "United Arab Emirates": { phone_code: "+971", phone_length: 9, currency: "AED", currency_symbol: "د.إ" },
  "United Kingdom": { phone_code: "+44", phone_length: 10, currency: "GBP", currency_symbol: "£" },
  "United States": { phone_code: "+1", phone_length: 10, currency: "USD", currency_symbol: "$" },
  "Uruguay": { phone_code: "+598", phone_length: 8, currency: "UYU", currency_symbol: "$U" },
  "Uzbekistan": { phone_code: "+998", phone_length: 9, currency: "UZS", currency_symbol: "so'm" },
  "Vanuatu": { phone_code: "+678", phone_length: 7, currency: "VUV", currency_symbol: "VT" },
  "Vatican City": { phone_code: "+379", phone_length: 10, currency: "EUR", currency_symbol: "€" },
  "Venezuela": { phone_code: "+58", phone_length: 10, currency: "VES", currency_symbol: "Bs." },
  "Vietnam": { phone_code: "+84", phone_length: 9, currency: "VND", currency_symbol: "₫" },
  "Yemen": { phone_code: "+967", phone_length: 9, currency: "YER", currency_symbol: "﷼" },
  "Zambia": { phone_code: "+260", phone_length: 9, currency: "ZMW", currency_symbol: "ZK" },
  "Zimbabwe": { phone_code: "+263", phone_length: 9, currency: "ZWL", currency_symbol: "$" }
};

const countryHierarchy = {
  "Afghanistan": ["Province", "District", "Area"],
  "Albania": ["County", "Municipality", "Area"],
  "Algeria": ["Province", "District", "Area"],
  "Andorra": ["Parish", "Area", "N/A"],
  "Angola": ["Province", "Municipality", "Area"],
  "Antigua and Barbuda": ["Parish", "Area", "N/A"],
  "Argentina": ["Province", "Department", "Municipality"],
  "Armenia": ["Province", "Community", "Area"],
  "Australia": ["State/Territory", "Local Government Area", "Suburb"],
  "Austria": ["State", "District", "Municipality"],
  "Azerbaijan": ["Economic Region", "District", "Area"],
  "Bahamas": ["District", "Area", "N/A"],
  "Bahrain": ["Governorate", "Municipality", "Area"],
  "Bangladesh": ["Division", "District", "Upazila"],
  "Barbados": ["Parish", "Area", "N/A"],
  "Belarus": ["Region", "District", "Area"],
  "Belgium": ["Region", "Province", "Municipality"],
  "Belize": ["District", "Town", "Area"],
  "Benin": ["Department", "Commune", "Area"],
  "Bhutan": ["District", "Gewog", "Village"],
  "Bolivia": ["Department", "Province", "Municipality"],
  "Bosnia and Herzegovina": ["Entity", "Canton", "Municipality"],
  "Botswana": ["District", "Sub-District", "Area"],
  "Brazil": ["State", "Municipality", "Neighborhood"],
  "Brunei": ["District", "Mukim", "Village"],
  "Bulgaria": ["Province", "Municipality", "Area"],
  "Burkina Faso": ["Region", "Province", "Commune"],
  "Burundi": ["Province", "Commune", "Area"],
  "Cambodia": ["Province", "District", "Commune"],
  "Cameroon": ["Region", "Division", "Sub-Division"],
  "Canada": ["Province/Territory", "Municipality", "Area"],
  "Cape Verde": ["Municipality", "Area", "N/A"],
  "Central African Republic": ["Prefecture", "Sub-Prefecture", "Area"],
  "Chad": ["Province", "Department", "Area"],
  "Chile": ["Region", "Province", "Commune"],
  "China": ["Province", "Prefecture", "County"],
  "Colombia": ["Department", "Municipality", "Area"],
  "Comoros": ["Island", "Prefecture", "Area"],
  "Costa Rica": ["Province", "Canton", "District"],
  "Croatia": ["County", "Municipality", "Area"],
  "Cuba": ["Province", "Municipality", "Area"],
  "Cyprus": ["District", "Municipality", "Area"],
  "Czech Republic": ["Region", "District", "Municipality"],
  "Denmark": ["Region", "Municipality", "Area"],
  "Djibouti": ["Region", "District", "Area"],
  "Dominica": ["Parish", "Area", "N/A"],
  "Dominican Republic": ["Province", "Municipality", "Area"],
  "Ecuador": ["Province", "Canton", "Parish"],
  "Egypt": ["Governorate", "District", "Area"],
  "El Salvador": ["Department", "Municipality", "Area"],
  "Equatorial Guinea": ["Province", "District", "Area"],
  "Eritrea": ["Region", "Sub-Region", "Area"],
  "Estonia": ["County", "Municipality", "Area"],
  "Eswatini": ["Region", "Inkhundla", "Area"],
  "Ethiopia": ["Region", "Zone", "Woreda"],
  "Fiji": ["Division", "Province", "District"],
  "Finland": ["Region", "Municipality", "Area"],
  "France": ["Region", "Department", "Commune"],
  "Gabon": ["Province", "Department", "Area"],
  "Gambia": ["Region", "District", "Area"],
  "Georgia": ["Region", "Municipality", "Area"],
  "Germany": ["State", "District", "Municipality"],
  "Ghana": ["Region", "District", "Area"],
  "Greece": ["Region", "Municipality", "Area"],
  "Grenada": ["Parish", "Area", "N/A"],
  "Guatemala": ["Department", "Municipality", "Area"],
  "Guinea": ["Region", "Prefecture", "Sub-Prefecture"],
  "Guinea-Bissau": ["Region", "Sector", "Area"],
  "Guyana": ["Region", "Neighborhood Council", "Area"],
  "Haiti": ["Department", "Arrondissement", "Commune"],
  "Honduras": ["Department", "Municipality", "Area"],
  "Hungary": ["County", "District", "Municipality"],
  "Iceland": ["Region", "Municipality", "Area"],
  "India": ["State/UT", "District", "Taluk"],
  "Indonesia": ["Province", "Regency/City", "District"],
  "Iran": ["Province", "County", "District"],
  "Iraq": ["Governorate", "District", "Area"],
  "Ireland": ["County", "Municipality", "Area"],
  "Israel": ["District", "Sub-District", "Area"],
  "Italy": ["Region", "Province", "Municipality"],
  "Jamaica": ["Parish", "Area", "N/A"],
  "Japan": ["Prefecture", "City/Ward", "District"],
  "Jordan": ["Governorate", "District", "Area"],
  "Kazakhstan": ["Region", "District", "Area"],
  "Kenya": ["County", "Sub-County", "Ward"],
  "Kiribati": ["Island", "Council", "Area"],
  "Kuwait": ["Governorate", "Area", "Block"],
  "Kyrgyzstan": ["Region", "District", "Area"],
  "Laos": ["Province", "District", "Village"],
  "Latvia": ["Municipality", "Area", "N/A"],
  "Lebanon": ["Governorate", "District", "Area"],
  "Lesotho": ["District", "Community Council", "Area"],
  "Liberia": ["County", "District", "Area"],
  "Libya": ["District", "Municipality", "Area"],
  "Liechtenstein": ["Municipality", "Area", "N/A"],
  "Lithuania": ["County", "Municipality", "Area"],
  "Luxembourg": ["Canton", "Commune", "Area"],
  "Madagascar": ["Region", "District", "Commune"],
  "Malawi": ["Region", "District", "Area"],
  "Malaysia": ["State", "District", "Mukim"],
  "Maldives": ["Atoll", "Island", "Area"],
  "Mali": ["Region", "Cercle", "Commune"],
  "Malta": ["Region", "Local Council", "Area"],
  "Marshall Islands": ["Atoll", "Municipality", "Area"],
  "Mauritania": ["Region", "Department", "Area"],
  "Mauritius": ["District", "Village", "Area"],
  "Mexico": ["State", "Municipality", "Locality"],
  "Micronesia": ["State", "Municipality", "Area"],
  "Moldova": ["District", "Commune", "Area"],
  "Monaco": ["Commune", "Area", "N/A"],
  "Mongolia": ["Province", "District", "Bag"],
  "Montenegro": ["Municipality", "Area", "N/A"],
  "Morocco": ["Region", "Province", "Commune"],
  "Mozambique": ["Province", "District", "Area"],
  "Myanmar": ["Region/State", "District", "Township"],
  "Namibia": ["Region", "Constituency", "Area"],
  "Nauru": ["District", "Area", "N/A"],
  "Nepal": ["Province", "District", "Municipality"],
  "Netherlands": ["Province", "Municipality", "Area"],
  "New Zealand": ["Region", "District", "Area"],
  "Nicaragua": ["Department", "Municipality", "Area"],
  "Niger": ["Region", "Department", "Commune"],
  "Nigeria": ["State", "Local Government Area", "Ward"],
  "North Korea": ["Province", "County", "Area"],
  "North Macedonia": ["Municipality", "Area", "N/A"],
  "Norway": ["County", "Municipality", "Area"],
  "Oman": ["Governorate", "Wilayat", "Area"],
  "Pakistan": ["Province", "Division", "District"],
  "Palau": ["State", "Area", "N/A"],
  "Panama": ["Province", "District", "Corregimiento"],
  "Papua New Guinea": ["Province", "District", "Area"],
  "Paraguay": ["Department", "District", "Area"],
  "Peru": ["Region", "Province", "District"],
  "Philippines": ["Region", "Province", "City/Municipality"],
  "Poland": ["Voivodeship", "County", "Gmina"],
  "Portugal": ["District", "Municipality", "Parish"],
  "Qatar": ["Municipality", "Zone", "Area"],
  "Romania": ["County", "Municipality", "Area"],
  "Russia": ["Federal Subject", "District", "Municipality"],
  "Rwanda": ["Province", "District", "Sector"],
  "Saint Lucia": ["District", "Area", "N/A"],
  "Samoa": ["District", "Village", "Area"],
  "San Marino": ["Municipality", "Area", "N/A"],
  "Saudi Arabia": ["Province", "Governorate", "Area"],
  "Senegal": ["Region", "Department", "Arrondissement"],
  "Serbia": ["District", "Municipality", "Area"],
  "Seychelles": ["District", "Area", "N/A"],
  "Sierra Leone": ["Province", "District", "Area"],
  "Singapore": ["City-State", "N/A", "N/A"],
  "Slovakia": ["Region", "District", "Municipality"],
  "Slovenia": ["Statistical Region", "Municipality", "Area"],
  "Solomon Islands": ["Province", "Ward", "Area"],
  "Somalia": ["State", "District", "Area"],
  "South Africa": ["Province", "District", "Municipality"],
  "South Korea": ["Province", "City/County", "District"],
  "South Sudan": ["State", "County", "Payam"],
  "Spain": ["Autonomous Community", "Province", "Municipality"],
  "Sri Lanka": ["Province", "District", "Division"],
  "Sudan": ["State", "Locality", "Area"],
  "Suriname": ["District", "Resort", "Area"],
  "Sweden": ["County", "Municipality", "Area"],
  "Switzerland": ["Canton", "Municipality", "Area"],
  "Syria": ["Governorate", "District", "Area"],
  "Taiwan": ["County/City", "District", "Area"],
  "Tajikistan": ["Region", "District", "Area"],
  "Tanzania": ["Region", "District", "Ward"],
  "Thailand": ["Province", "District", "Sub-District"],
  "Togo": ["Region", "Prefecture", "Canton"],
  "Tonga": ["Division", "District", "Area"],
  "Trinidad and Tobago": ["Region", "Municipality", "Area"],
  "Tunisia": ["Governorate", "Delegation", "Sector"],
  "Turkey": ["Province", "District", "Neighborhood"],
  "Turkmenistan": ["Province", "District", "Area"],
  "Tuvalu": ["Island", "Area", "N/A"],
  "Uganda": ["Region", "District", "Sub-County"],
  "Ukraine": ["Oblast", "Raion", "Hromada"],
  "United Arab Emirates": ["Emirate", "City", "Area"],
  "United Kingdom": ["Country", "County", "Borough"],
  "United States": ["State", "County", "City"],
  "Uruguay": ["Department", "Municipality", "Area"],
  "Uzbekistan": ["Region", "District", "Area"],
  "Vanuatu": ["Province", "Municipality", "Area"],
  "Vatican City": ["None", "N/A", "N/A"],
  "Venezuela": ["State", "Municipality", "Parish"],
  "Vietnam": ["Province", "District", "Commune"],
  "Yemen": ["Governorate", "District", "Area"],
  "Zambia": ["Province", "District", "Area"],
  "Zimbabwe": ["Province", "District", "Area"]
};

const OnboardOrganization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editTenantId = searchParams.get('tenantId');

  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(!!editTenantId);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Verification Portal State
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');

  // Step 2: Survey States
  const [survey, setSurvey] = useState({
    operation_type: 'QSR',
    goal: 'Speed up billing & checkout',
    daily_orders: '50 - 200',
    dine_in: 'Yes'
  });

  const [showPassword, setShowPassword] = useState({
    tenant: false,
    companies: {},
    branches: {}
  });

  const toggleTenantPassword = () => setShowPassword(p => ({ ...p, tenant: !p.tenant }));
  const toggleCompanyPassword = (id) => setShowPassword(p => ({ ...p, companies: { ...p.companies, [id]: !p.companies[id] } }));
  const toggleBranchPassword = (id) => setShowPassword(p => ({ ...p, branches: { ...p.branches, [id]: !p.branches[id] } }));

  // Step 3: Tenant Details
  const [tenant, setTenant] = useState({
    tenant_name: '',
    country: '',
    state: '',
    city: '',
    address: '',
    phone: '',
    email: location.state?.verifiedEmail || '',
    subscription_plan: 'Basic',
    admin_email: location.state?.verifiedEmail || '',
    admin_username: '',
    admin_password: ''
  });

  const [companies, setCompanies] = useState([
    { id: 1, company_name: '', company_code: '', phone: '', email: '', address: '', country: '', state: '', city: '', admin_email: '', admin_password: '' }
  ]);

  const [branches, setBranches] = useState([
    { id: 1, company_name: '', branch_name: '', branch_code: '', phone: '', email: '', address: '', country: '', state: '', city: '', admin_email: '', admin_password: '' }
  ]);

  // Checkboxes
  const [hasMultipleCompanies, setHasMultipleCompanies] = useState(false);
  const [hasBranches, setHasBranches] = useState(false);

  // Step 4: Modules Toggles
  const [modules, setModules] = useState({
    items: true,
    sales: true,
    purchase: true,
    kot: true,
    delivery: true,
    tables: true
  });

  const [complianceDocs, setComplianceDocs] = useState([
    { doc_type: 'GST/VAT', reg_number: '', expiry_date: '', file: null, file_name: '' },
    { doc_type: 'FSSAI', reg_number: '', expiry_date: '', file: null, file_name: '' },
    { doc_type: 'Accreditation', reg_number: '', expiry_date: '', file: null, file_name: '' }
  ]);

  const [subscriptionPlansData, setSubscriptionPlansData] = useState({});

  useEffect(() => {
    const fetchPlanConfigs = async () => {
      try {
        const res = await fetch('/api/admin/plan_config');
        if (res.ok) {
          const data = await res.json();
          setSubscriptionPlansData(data);
        }
      } catch (err) {
        console.error("Failed to load plans", err);
      }
    };
    fetchPlanConfigs();
  }, []);

  useEffect(() => {
    if (editTenantId) {
      setIsEditMode(true);
      const targetStep = searchParams.get('step');
      if (targetStep) {
        setStep(parseInt(targetStep, 10));
      } else {
        setStep(3); // Skip OTP and Survey in Edit mode
      }
      fetchEditData();
    }
  }, [editTenantId]); // deliberately omitted searchParams to avoid looping

  // Auto configure modules based on plan selection & dine-in survey choice
  useEffect(() => {
    let defaults = { items: true, sales: true, purchase: false, kot: false, delivery: false, tables: false };

    if (tenant.subscription_plan === 'Silver') {
      defaults = { items: true, sales: true, purchase: true, kot: true, delivery: false, tables: true };
    } else if (tenant.subscription_plan === 'Gold') {
      defaults = { items: true, sales: true, purchase: true, kot: true, delivery: true, tables: true };
    }

    // Survey restriction: if no table dinning, disable tables and kot modules
    if (survey.dine_in === 'No') {
      defaults.tables = false;
      defaults.kot = false;
    }

    setModules(defaults);
  }, [tenant.subscription_plan, survey.dine_in]);

  const fetchEditData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await axios.get(`/api/onboard-organization/${editTenantId}`, { headers });
      const data = res.data;

      if (data.tenant) {
        setTenant({
          ...data.tenant,
          admin_email: data.tenant.admin_email || data.tenant.email || '',
          admin_username: data.tenant.admin_username || '',
          admin_password: data.tenant.plain_password || '••••••••'
        });
        if (data.tenant.modules_enabled) {
          const modMap = {};
          data.tenant.modules_enabled.forEach(m => modMap[m] = true);
          setModules(prev => ({ ...prev, ...modMap }));
        }
        if (data.tenant.compliance_docs) {
          // Merge with template
          setComplianceDocs(prev => prev.map(p => {
            const found = data.tenant.compliance_docs.find(d => d.doc_type === p.doc_type);
            return found ? { ...p, ...found } : p;
          }));
        }
      }

      if (data.companies && data.companies.length > 0) {
        const mappedCompanies = data.companies.map(c => ({
          ...c,
          id: c._id || c.id || Date.now() + Math.random(),
          country: c.country || '',
          state: c.state || '',
          city: c.city || '',
          address: c.address || '',
          admin_email: c.admin_email || '',
          admin_password: c.plain_password || '••••••••'
        }));
        setCompanies(mappedCompanies);
        // Show multi-company panel if there's more than one, OR if the first company differs from tenant name
        const isMultiComp = data.companies.length > 1 || (data.companies.length === 1 && data.companies[0].company_name !== data.tenant?.tenant_name);
        setHasMultipleCompanies(isMultiComp);
      }

      if (data.branches && data.branches.length > 0) {
        setBranches(data.branches.map(b => {
          const comp = data.companies ? data.companies.find(c => c._id === b.company_id || c.id === b.company_id) : null;
          return {
            ...b,
            id: b._id || b.id || Date.now() + Math.random(),
            company_name: b.company_name || (comp ? comp.company_name : ''),
            country: b.country || '',
            state: b.state || '',
            city: b.city || '',
            address: b.address || '',
            admin_email: b.admin_email || '',
            admin_password: b.plain_password || '••••••••'
          };
        }));
        setHasBranches(true);
      }
    } catch (err) {
      setError("Failed to load organization data for editing.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!emailForOtp) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/request-otp', { email: emailForOtp });
      setOtpSent(true);
      alert(`OTP sent! (For testing: ${res.data.debug_otp})`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/verify-otp', { email: emailForOtp, otp: otpCode });
      setVerifiedToken(res.data.token);
      setTenant(prev => ({ ...prev, email: emailForOtp, admin_email: emailForOtp }));
      setStep(2); // Go to profiling
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleFileChange = (index, file) => {
    setComplianceDocs(prev => prev.map((item, i) => i === index ? { ...item, file } : item));
  };

  const updateComplianceField = (index, field, value) => {
    setComplianceDocs(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Frontend validation
    if (!tenant.tenant_name) {
      setError('Missing required detail: Organization Name (Step 3)');
      setLoading(false);
      return;
    }
    if (!tenant.admin_email) {
      setError('Missing required detail: Super Admin Email (Step 3)');
      setLoading(false);
      return;
    }
    if (!tenant.admin_password) {
      setError('Missing required detail: Super Admin Password (Step 3)');
      setLoading(false);
      return;
    }

    let finalCompsToSubmit = [];
    if (!hasMultipleCompanies) {
      const existingMainComp = companies.length > 0 ? companies[0] : null;
      finalCompsToSubmit = [{
        _id: existingMainComp && existingMainComp.id ? existingMainComp.id : undefined,
        company_name: tenant.tenant_name,
        company_code: "MAIN",
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        is_default: true,
        country: tenant.country,
        state: tenant.state,
        city: tenant.city,
        admin_email: tenant.admin_email,
        admin_password: tenant.admin_password
      }];
    } else {
      finalCompsToSubmit = companies.filter(c => c.company_name && c.company_name.trim() !== '');
    }

    for (const c of finalCompsToSubmit) {
      if (!c.admin_email) {
        setError(`Missing Admin Email for Company: ${c.company_name}`);
        setLoading(false);
        return;
      }
      if (!c.admin_password) {
        setError(`Missing Admin Password for Company: ${c.company_name}`);
        setLoading(false);
        return;
      }
    }

    let finalBranchesToSubmit = [];
    if (hasBranches) {
      finalBranchesToSubmit = branches.filter(b => b.branch_name && b.branch_name.trim() !== '' && b.company_name && b.company_name.trim() !== '');
      for (const b of finalBranchesToSubmit) {
        if (!b.admin_email) {
          setError(`Missing Admin Email for Branch: ${b.branch_name}`);
          setLoading(false);
          return;
        }
        if (!b.admin_password) {
          setError(`Missing Admin Password for Branch: ${b.branch_name}`);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const formPayload = new FormData();

      const payloadTenant = {
        ...tenant,
        currency: tenant.country && countryMeta[tenant.country] ? countryMeta[tenant.country].currency : '',
        currency_symbol: tenant.country && countryMeta[tenant.country] ? countryMeta[tenant.country].currency_symbol : ''
      };

      if (searchParams.get('step') === '4') {
        delete payloadTenant.admin_email;
        delete payloadTenant.admin_username;
        delete payloadTenant.admin_password;
      }

      const enrichedComps = finalCompsToSubmit.map(c => ({
        ...c,
        currency: c.country && countryMeta[c.country] ? countryMeta[c.country].currency : '',
        currency_symbol: c.country && countryMeta[c.country] ? countryMeta[c.country].currency_symbol : ''
      }));

      const enrichedBranches = finalBranchesToSubmit.map(b => ({
        ...b,
        currency: b.country && countryMeta[b.country] ? countryMeta[b.country].currency : '',
        currency_symbol: b.country && countryMeta[b.country] ? countryMeta[b.country].currency_symbol : ''
      }));
      formPayload.append('tenant', JSON.stringify(payloadTenant));

      formPayload.append('companies', JSON.stringify(enrichedComps));
      formPayload.append('branches', JSON.stringify(enrichedBranches));

      formPayload.append('survey_responses', JSON.stringify(survey));

      const enabledModulesList = Object.keys(modules).filter(k => modules[k]);
      formPayload.append('modules_enabled', JSON.stringify(enabledModulesList));

      const finalDocs = complianceDocs.map((doc, idx) => {
        if (doc.file) {
          const fieldName = `compliance_file_${idx}`;
          formPayload.append(fieldName, doc.file);
          return {
            doc_type: doc.doc_type,
            reg_number: doc.reg_number,
            expiry_date: doc.expiry_date,
            file_field_name: fieldName
          };
        }
        return {
          doc_type: doc.doc_type,
          reg_number: doc.reg_number,
          expiry_date: doc.expiry_date,
          file_name: doc.file_name
        };
      });
      formPayload.append('compliance_docs', JSON.stringify(finalDocs));

      const headers = { 'Content-Type': 'multipart/form-data' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res;
      if (isEditMode) {
        res = await axios.put(`/api/onboard-organization/${editTenantId}`, formPayload, { headers });
      } else {
        res = await axios.post('/api/onboard-organization', formPayload, { headers });
      }

      if (res.status === 201 || res.status === 200) {
        alert(isEditMode ? 'Organization Updated Successfully!' : 'Organization Setup Successful! You can now login.');
        if (searchParams.get('step') === '4') {
          navigate(-1);
        } else {
          navigate(isEditMode ? '/manage-tenants' : '/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during setup');
    } finally {
      setLoading(false);
    }
  };

  const addCompany = () => setCompanies([...companies, { id: Date.now(), company_name: '', company_code: '', phone: '', email: '', address: '', country: '', state: '', city: '', admin_email: '', admin_password: '' }]);
  const removeCompany = (id) => setCompanies(companies.filter(c => c.id !== id));

  const addBranch = () => setBranches([...branches, { id: Date.now(), company_name: '', branch_name: '', branch_code: '', phone: '', email: '', address: '', country: '', state: '', city: '', admin_email: '', admin_password: '' }]);
  const removeBranch = (id) => setBranches(branches.filter(b => b.id !== id));

  const updateCompany = (id, field, value) => {
    setCompanies(companies.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateBranch = (id, field, value) => {
    setBranches(branches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const styles = {
    wrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: "'Inter', sans-serif",
      color: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box'
    },
    card: {
      background: '#1e293b',
      border: '1px solid #334155',
      width: '100%',
      maxWidth: '850px',
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
      position: 'relative'
    },
    header: {
      background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      padding: '40px',
      color: '#ffffff',
      textAlign: 'center'
    },
    headerTitle: {
      margin: 0,
      fontSize: '2rem',
      fontWeight: '800',
      letterSpacing: '-0.5px'
    },
    headerSubtitle: {
      margin: '10px 0 0 0',
      fontSize: '1.1rem',
      opacity: 0.9,
      fontWeight: '500'
    },
    progressContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '25px',
      gap: '8px'
    },
    progressDot: (active) => ({
      width: active ? '24px' : '8px',
      height: '8px',
      borderRadius: '4px',
      background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s ease'
    }),
    body: {
      padding: '40px'
    },
    sectionTitle: {
      fontSize: '1.4rem',
      color: '#ffffff',
      margin: '0 0 20px 0',
      paddingBottom: '12px',
      borderBottom: '1px solid #334155',
      fontWeight: '700',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '0.85rem',
      fontWeight: '600',
      color: '#94a3b8'
    },
    input: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #475569',
      fontSize: '0.95rem',
      outline: 'none',
      color: '#f8fafc',
      backgroundColor: '#0f172a',
      transition: 'all 0.2s ease'
    },
    select: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #475569',
      fontSize: '0.95rem',
      outline: 'none',
      color: '#f8fafc',
      backgroundColor: '#0f172a',
      cursor: 'pointer'
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid #334155'
    },
    btnPrev: {
      background: '#334155',
      color: '#f8fafc',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    btnNext: {
      background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      color: '#ffffff',
      border: 'none',
      padding: '12px 32px',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
      transition: 'all 0.3s ease'
    },
    optionCard: (selected) => ({
      background: selected ? '#312e81' : '#0f172a',
      border: selected ? '2px solid #6366f1' : '1px solid #334155',
      padding: '20px',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center'
    }),
    planCard: (selected) => ({
      background: selected ? '#312e81' : '#1e293b',
      border: selected ? '2px solid #6366f1' : '1px solid #334155',
      padding: '24px',
      borderRadius: '16px',
      cursor: 'pointer',
      flex: 1,
      transition: 'all 0.2s ease'
    }),
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      color: '#cbd5e1'
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input:focus, select:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>{isEditMode ? 'Edit SaaS Organization' : 'SaaS Organization Setup'}</h2>
          <p style={styles.headerSubtitle}>{isEditMode ? 'Modify plan and company settings' : 'Start your SaaS restaurant operation wizard'}</p>
          <div style={styles.progressContainer}>
            <div style={styles.progressDot(step === 2)}></div>
            <div style={styles.progressDot(step === 3)}></div>
            <div style={styles.progressDot(step === 4)}></div>
            <div style={styles.progressDot(step === 5)}></div>
          </div>
        </div>

        <div style={styles.body}>
          {error && (
            <div style={{ background: '#7f1d1d', border: '1px solid #f87171', color: '#fca5a5', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {/* STEP 2: RESTAURANT PROFILE SURVEY */}
          {step === 2 && (
            <div>
              <div style={styles.sectionTitle}>
                <span>Step 2: Restaurant Survey Profile</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '-10px 0 25px 0' }}>Help us configure the layout defaults for your restaurant system.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>What type of food service operation is this?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {['QSR', 'Cafe', 'Fine Dining', 'Bar & Pub', 'Cloud Kitchen', 'Food Truck'].map(t => (
                      <div key={t} onClick={() => setSurvey({ ...survey, operation_type: t })} style={styles.optionCard(survey.operation_type === t)}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>What is your primary goal with our POS platform?</label>
                  <select style={styles.select} value={survey.goal} onChange={e => setSurvey({ ...survey, goal: e.target.value })}>
                    <option value="Speed up billing & checkout">Speed up billing & checkout</option>
                    <option value="Real-time inventory tracking">Real-time inventory tracking</option>
                    <option value="Multi-branch reporting & analytics">Multi-branch reporting & analytics</option>
                    <option value="Employee & shifts management">Employee & shifts management</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Daily Order Volume Estimate</label>
                  <select style={styles.select} value={survey.daily_orders} onChange={e => setSurvey({ ...survey, daily_orders: e.target.value })}>
                    <option value="Under 50">Under 50 orders</option>
                    <option value="50 - 200">50 - 200 orders</option>
                    <option value="200 - 500">200 - 500 orders</option>
                    <option value="500+">500+ orders</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Do you have tables for dining in?</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    {['Yes', 'No'].map(o => (
                      <button key={o} onClick={() => setSurvey({ ...survey, dine_in: o })} style={{ ...styles.btnPrev, background: survey.dine_in === o ? '#6366f1' : '#334155', flex: 1 }}>
                        {o === 'Yes' ? 'Yes, table management is critical' : 'No, we are takeaway/delivery only'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.footer}>
                <button onClick={() => navigate('/')} style={styles.btnPrev}>Cancel</button>
                <button onClick={handleNext} style={styles.btnNext}>Next Step: Setup Organizations →</button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPANY SETUP */}
          {step === 3 && (
            <div>
              <div style={styles.sectionTitle}>
                <span>Step 3: Company Setup</span>
              </div>

              <div style={styles.grid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Organization Name *</label>
                  <input style={styles.input} type="text" value={tenant.tenant_name} onChange={e => setTenant({ ...tenant, tenant_name: e.target.value })} placeholder="Acme Food Group" />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Super Admin Email *</label>
                  <input style={styles.input} type="email" value={tenant.admin_email} onChange={e => setTenant({ ...tenant, admin_email: e.target.value })} placeholder="admin@restaurant.com" />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Super Admin Password *</label>
                  <input style={styles.input} type="text" value={tenant.admin_password} onChange={e => setTenant({ ...tenant, admin_password: e.target.value })} placeholder="Password" />
                </div>
                <div style={{ ...styles.inputGroup, position: 'relative' }}>
                  <label style={styles.label}>Country</label>
                  <input
                    style={styles.input}
                    placeholder="Search or Select Country"
                    value={showCountryDropdown ? countrySearch : (tenant.country || '')}
                    onChange={e => {
                      setCountrySearch(e.target.value);
                      setShowCountryDropdown(true);
                    }}
                    onFocus={() => {
                      setCountrySearch('');
                      setShowCountryDropdown(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowCountryDropdown(false), 200);
                    }}
                  />
                  {showCountryDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      maxHeight: '200px', overflowY: 'auto',
                      background: '#1e293b', border: '1px solid #475569',
                      borderRadius: '8px', zIndex: 10, marginTop: '4px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                      {Object.keys(countryHierarchy)
                        .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                        .map(c => (
                          <div
                            key={c}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #334155', color: '#f8fafc', fontSize: '0.95rem' }}
                            onMouseDown={() => {
                              setTenant({ ...tenant, country: c, state: '', city: '', address: '', phone: '' });
                              setCountrySearch('');
                              setShowCountryDropdown(false);
                            }}
                            onMouseEnter={e => e.target.style.background = '#334155'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                          >
                            {c}
                          </div>
                        ))}
                      {Object.keys(countryHierarchy).filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                        <div style={{ padding: '10px 15px', color: '#94a3b8', fontSize: '0.95rem' }}>No countries found</div>
                      )}
                    </div>
                  )}
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>
                    {tenant.country && countryHierarchy[tenant.country]
                      ? countryHierarchy[tenant.country][0]
                      : 'State/Region'}
                  </label>
                  <input style={styles.input} type="text" value={tenant.state} onChange={e => setTenant({ ...tenant, state: e.target.value })} placeholder={tenant.country && countryHierarchy[tenant.country] ? `Enter ${countryHierarchy[tenant.country][0]}` : "Dubai / California"} />
                </div>
                {tenant.country && countryHierarchy[tenant.country] && countryHierarchy[tenant.country].length > 1 && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>
                      {countryHierarchy[tenant.country][1]}
                    </label>
                    <input style={styles.input} type="text" value={tenant.city || ''} onChange={e => setTenant({ ...tenant, city: e.target.value })} placeholder={`Enter ${countryHierarchy[tenant.country][1]}`} />
                  </div>
                )}
                {tenant.country && countryHierarchy[tenant.country] && countryHierarchy[tenant.country].length > 2 && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>
                      {countryHierarchy[tenant.country][2]}
                    </label>
                    <input style={styles.input} type="text" value={tenant.address || ''} onChange={e => setTenant({ ...tenant, address: e.target.value })} placeholder={`Enter ${countryHierarchy[tenant.country][2]}`} />
                  </div>
                )}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ ...styles.input, backgroundColor: '#334155', color: '#cbd5e1', width: '70px', textAlign: 'center', flexShrink: 0, padding: '12px 0' }}>
                      {tenant.country && countryMeta[tenant.country] ? countryMeta[tenant.country].phone_code : '+--'}
                    </div>
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      type="text"
                      value={tenant.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        setTenant({ ...tenant, phone: val });
                      }}
                      maxLength={tenant.country && countryMeta[tenant.country] ? countryMeta[tenant.country].phone_length : 15}
                      placeholder={tenant.country && countryMeta[tenant.country] ? `Enter ${countryMeta[tenant.country].phone_length} digit number` : "Select country"}
                    />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Currency Symbol</label>
                  <div style={{ ...styles.input, backgroundColor: '#334155', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tenant.country && countryMeta[tenant.country] && countryMeta[tenant.country].currency ? (
                      <>
                        <CurrencySymbol currencyCode={countryMeta[tenant.country].currency} size={18} />
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{countryMeta[tenant.country].currency}</span>
                      </>
                    ) : 'Select country first'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={hasMultipleCompanies} onChange={e => setHasMultipleCompanies(e.target.checked)} />
                  Do you have multiple companies?
                </label>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={hasBranches} onChange={e => setHasBranches(e.target.checked)} />
                  Do you have multiple branches?
                </label>
              </div>

              {/* DYNAMIC COMPANIES FIELDS */}
              {hasMultipleCompanies && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Secondary Companies Setup</h4>
                    <button onClick={addCompany} style={{ ...styles.btnPrev, background: '#10b981', color: '#ffffff', padding: '6px 12px', fontSize: '0.8rem' }}>+ Add Company</button>
                  </div>
                  {companies.map((c, index) => (
                    <div key={c.id} style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '15px', position: 'relative' }}>
                      {companies.length > 1 && (
                        <button onClick={() => removeCompany(c.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                      )}
                      <h5 style={{ margin: '0 0 15px 0' }}>Company #{index + 1}</h5>
                      <div style={styles.grid}>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Company Name *</label>
                          <input style={styles.input} type="text" value={c.company_name} onChange={e => updateCompany(c.id, 'company_name', e.target.value)} placeholder="Company Name" />
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Admin Email *</label>
                          <input style={styles.input} type="email" value={c.admin_email} onChange={e => updateCompany(c.id, 'admin_email', e.target.value)} placeholder="admin@comp.com" />
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Admin Password *</label>
                          <input style={styles.input} type="text" value={c.admin_password} onChange={e => updateCompany(c.id, 'admin_password', e.target.value)} placeholder="Password" />
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Country (Optional)</label>
                          <select style={styles.select} value={c.country || ''} onChange={e => updateCompany(c.id, 'country', e.target.value)}>
                            <option value="">-- Select Country --</option>
                            {Object.keys(countryHierarchy).map(cnt => <option key={cnt} value={cnt}>{cnt}</option>)}
                          </select>
                        </div>
                        {c.country && (
                          <>
                            <div style={styles.inputGroup}>
                              <label style={styles.label}>{countryHierarchy[c.country] ? countryHierarchy[c.country][0] : 'State/Region'}</label>
                              <input style={styles.input} type="text" value={c.state || ''} onChange={e => updateCompany(c.id, 'state', e.target.value)} placeholder={countryHierarchy[c.country] ? `Enter ${countryHierarchy[c.country][0]}` : "State/Region"} />
                            </div>
                            {countryHierarchy[c.country] && countryHierarchy[c.country].length > 1 && (
                              <div style={styles.inputGroup}>
                                <label style={styles.label}>{countryHierarchy[c.country][1]}</label>
                                <input style={styles.input} type="text" value={c.city || ''} onChange={e => updateCompany(c.id, 'city', e.target.value)} placeholder={`Enter ${countryHierarchy[c.country][1]}`} />
                              </div>
                            )}
                            {countryHierarchy[c.country] && countryHierarchy[c.country].length > 2 && (
                              <div style={styles.inputGroup}>
                                <label style={styles.label}>{countryHierarchy[c.country][2]}</label>
                                <input style={styles.input} type="text" value={c.address || ''} onChange={e => updateCompany(c.id, 'address', e.target.value)} placeholder={`Enter ${countryHierarchy[c.country][2]}`} />
                              </div>
                            )}
                            <div style={styles.inputGroup}>
                              <label style={styles.label}>Phone Number</label>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ ...styles.input, backgroundColor: '#334155', color: '#cbd5e1', width: '70px', textAlign: 'center', flexShrink: 0, padding: '12px 0' }}>
                                  {countryMeta[c.country] ? countryMeta[c.country].phone_code : '+--'}
                                </div>
                                <input style={{ ...styles.input, flex: 1 }} type="text" value={c.phone || ''} onChange={e => updateCompany(c.id, 'phone', e.target.value.replace(/\D/g, ''))} maxLength={countryMeta[c.country] ? countryMeta[c.country].phone_length : 15} placeholder={countryMeta[c.country] ? `Enter ${countryMeta[c.country].phone_length} digit number` : "Phone"} />
                              </div>
                            </div>
                            <div style={styles.inputGroup}>
                              <label style={styles.label}>Currency Symbol</label>
                              <div style={{ ...styles.input, backgroundColor: '#334155', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {countryMeta[c.country] && countryMeta[c.country].currency ? (
                                  <>
                                    <CurrencySymbol currencyCode={countryMeta[c.country].currency} size={18} />
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{countryMeta[c.country].currency}</span>
                                  </>
                                ) : 'N/A'}
                              </div>
                            </div>
                          </>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DYNAMIC BRANCHES FIELDS */}
              {hasBranches && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Branches Setup</h4>
                    <button onClick={addBranch} style={{ ...styles.btnPrev, background: '#10b981', color: '#ffffff', padding: '6px 12px', fontSize: '0.8rem' }}>+ Add Branch</button>
                  </div>
                  {branches.map((b, index) => (
                    <div key={b.id} style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '15px', position: 'relative' }}>
                      {branches.length > 1 && (
                        <button onClick={() => removeBranch(b.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                      )}
                      <h5 style={{ margin: '0 0 15px 0' }}>Branch #{index + 1}</h5>
                      <div style={styles.grid}>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Link to Company *</label>
                          <select
                            style={styles.select}
                            value={b.company_name}
                            onChange={e => updateBranch(b.id, 'company_name', e.target.value)}
                            required
                          >
                            <option value="">-- Select Company --</option>
                            {tenant.tenant_name && (
                              <option value={tenant.tenant_name}>{tenant.tenant_name} (Primary)</option>
                            )}
                            {companies.filter(c => c.company_name && c.company_name !== tenant.tenant_name).map(c => (
                              <option key={c.id} value={c.company_name}>{c.company_name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Branch Name *</label>
                          <input style={styles.input} type="text" value={b.branch_name} onChange={e => updateBranch(b.id, 'branch_name', e.target.value)} placeholder="Main Branch / Downtown" />
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Admin Email *</label>
                          <input style={styles.input} type="email" value={b.admin_email} onChange={e => updateBranch(b.id, 'admin_email', e.target.value)} placeholder="branchadmin@comp.com" />
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Admin Password *</label>
                          <input style={styles.input} type="text" value={b.admin_password} onChange={e => updateBranch(b.id, 'admin_password', e.target.value)} placeholder="Password" />
                        </div>
                        <div style={styles.inputGroup}>
                          <label style={styles.label}>Country (Optional)</label>
                          <select style={styles.select} value={b.country || ''} onChange={e => updateBranch(b.id, 'country', e.target.value)}>
                            <option value="">-- Select Country --</option>
                            {Object.keys(countryHierarchy).map(cnt => <option key={cnt} value={cnt}>{cnt}</option>)}
                          </select>
                        </div>
                        {b.country && (
                          <>
                            <div style={styles.inputGroup}>
                              <label style={styles.label}>{countryHierarchy[b.country] ? countryHierarchy[b.country][0] : 'State/Region'}</label>
                              <input style={styles.input} type="text" value={b.state || ''} onChange={e => updateBranch(b.id, 'state', e.target.value)} placeholder={countryHierarchy[b.country] ? `Enter ${countryHierarchy[b.country][0]}` : "State/Region"} />
                            </div>
                            {countryHierarchy[b.country] && countryHierarchy[b.country].length > 1 && (
                              <div style={styles.inputGroup}>
                                <label style={styles.label}>{countryHierarchy[b.country][1]}</label>
                                <input style={styles.input} type="text" value={b.city || ''} onChange={e => updateBranch(b.id, 'city', e.target.value)} placeholder={`Enter ${countryHierarchy[b.country][1]}`} />
                              </div>
                            )}
                            {countryHierarchy[b.country] && countryHierarchy[b.country].length > 2 && (
                              <div style={styles.inputGroup}>
                                <label style={styles.label}>{countryHierarchy[b.country][2]}</label>
                                <input style={styles.input} type="text" value={b.address || ''} onChange={e => updateBranch(b.id, 'address', e.target.value)} placeholder={`Enter ${countryHierarchy[b.country][2]}`} />
                              </div>
                            )}
                            <div style={styles.inputGroup}>
                              <label style={styles.label}>Phone Number</label>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ ...styles.input, backgroundColor: '#334155', color: '#cbd5e1', width: '70px', textAlign: 'center', flexShrink: 0, padding: '12px 0' }}>
                                  {countryMeta[b.country] ? countryMeta[b.country].phone_code : '+--'}
                                </div>
                                <input style={{ ...styles.input, flex: 1 }} type="text" value={b.phone || ''} onChange={e => updateBranch(b.id, 'phone', e.target.value.replace(/\D/g, ''))} maxLength={countryMeta[b.country] ? countryMeta[b.country].phone_length : 15} placeholder={countryMeta[b.country] ? `Enter ${countryMeta[b.country].phone_length} digit number` : "Phone"} />
                              </div>
                            </div>
                            <div style={styles.inputGroup}>
                              <label style={styles.label}>Currency Symbol</label>
                              <div style={{ ...styles.input, backgroundColor: '#334155', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {countryMeta[b.country] && countryMeta[b.country].currency ? (
                                  <>
                                    <CurrencySymbol currencyCode={countryMeta[b.country].currency} size={18} />
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{countryMeta[b.country].currency}</span>
                                  </>
                                ) : 'N/A'}
                              </div>
                            </div>
                          </>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.footer}>
                <button onClick={handlePrev} style={styles.btnPrev}>← Back</button>
                <button onClick={handleNext} disabled={!tenant.tenant_name} style={styles.btnNext}>Next Step: Plans & Modules →</button>
              </div>
            </div>
          )}

          {/* STEP 4: SUBSCRIPTION PLAN & MODULES */}
          {step === 4 && (
            <div>
              <div style={styles.sectionTitle}>
                <span>Step 4: Subscription Plan & POS Modules</span>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '15px' }}>Choose Subscription Plan</h4>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                {[
                  { name: 'Basic', fullName: 'Basic Plan', basePrice: 0, desc: 'Ideal for single coffee shops or QSR counters. Includes Billing & Items.' },
                  { name: 'Silver', fullName: 'Silver Plan', basePrice: 0, desc: 'Adds Purchase management, tables layout, and kitchen KOT. Best for full-service cafes.' },
                  { name: 'Gold', fullName: 'Gold Plan', basePrice: 0, desc: 'Fully featured multi-tenant setup with Delivery integrations, unlimited branches.' }
                ].map(p => {
                  const planItems = subscriptionPlansData[p.fullName] || [];
                  const extraCost = planItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
                  const totalPrice = p.basePrice + extraCost;

                  return (
                    <div key={p.name} onClick={() => setTenant({ ...tenant, subscription_plan: p.name })} style={styles.planCard(tenant.subscription_plan === p.name)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{p.fullName}</span>
                        {tenant.subscription_plan === p.name && <CheckCircle size={18} style={{ color: '#6366f1' }} />}
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#6366f1', marginBottom: '10px' }}>${totalPrice}/mo</div>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 10px 0', minHeight: '30px' }}>{p.desc}</p>
                      
                      {/* Dynamic Scrollable Features List */}
                      {planItems.length > 0 && (
                        <div style={{ 
                          maxHeight: '250px', overflowY: 'auto', 
                          borderTop: '1px solid #334155', paddingTop: '10px',
                          display: 'flex', flexDirection: 'column', gap: '5px' 
                        }}>
                          {planItems.map((item, idx) => (
                            <details key={idx} style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              <summary 
                                onClick={(e) => e.stopPropagation()} 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', outline: 'none', padding: '4px 0', listStyle: 'none' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                  <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{item.name}</span>
                                </div>
                              </summary>
                              {item.pages && item.pages.length > 0 && (
                                <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px', marginBottom: '6px' }}>
                                  {item.pages.map(page => (
                                    <div key={page.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                      <span>- {page.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </details>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>


              <div style={styles.footer}>
                {searchParams.get('step') === '4' ? (
                  <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnNext, width: '100%' }}>
                    {loading ? 'Upgrading Plan...' : 'Upgrade / Save Plan ✨'}
                  </button>
                ) : (
                  <>
                    <button onClick={handlePrev} style={styles.btnPrev}>← Back</button>
                    <button onClick={handleNext} style={styles.btnNext}>Next Step: Compliance Uploads →</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: COMPLIANCE DOCUMENTS */}
          {step === 5 && (
            <div>
              <div style={styles.sectionTitle}>
                <span>Step 5: Compliance Documents Registration</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '-10px 0 25px 0' }}>Attach relevant documents for validation (GST, FSSAI, Accreditations).</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {complianceDocs.map((doc, idx) => (
                  <div key={doc.doc_type} style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                      <FileText size={18} style={{ color: '#6366f1' }} />
                      <span style={{ fontWeight: '700' }}>{doc.doc_type} License / Certificate</span>
                    </div>

                    <div style={styles.grid}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Registration Number</label>
                        <input style={styles.input} type="text" value={doc.reg_number} onChange={e => updateComplianceField(idx, 'reg_number', e.target.value)} placeholder="REG-12345-XYZ" />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Expiry Date</label>
                        <input style={styles.input} type="date" value={doc.expiry_date} onChange={e => updateComplianceField(idx, 'expiry_date', e.target.value)} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Upload Certificate (PDF / Image)</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', border: '1px dashed #475569', borderRadius: '10px', padding: '12px', cursor: 'pointer', justifyContent: 'center' }}>
                          <Upload size={16} style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                            {doc.file ? doc.file.name : doc.file_name ? `Uploaded: ${doc.file_name}` : 'Choose File'}
                          </span>
                          <input type="file" onChange={e => handleFileChange(idx, e.target.files[0])} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg" />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.footer}>
                <button onClick={handlePrev} style={styles.btnPrev}>← Back</button>
                <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btnNext, background: '#10b981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
                  {loading ? 'Finalizing Setup...' : 'Complete SaaS Onboarding ✨'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardOrganization;
