import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { FaArrowLeft, FaTimes, FaUser, FaUsers, FaPlus, FaLayerGroup, FaEdit, FaTrash, FaCheckCircle, FaChevronDown, FaChevronUp, FaSearch, FaUserPlus, FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { UserContext } from "../../Context/UserContext";
import { checkIsAdmin, checkIsGlobalAdmin } from "../../utils/authUtils";
// Utility function to parse MongoDB Extended JSON (only for numbers, no 'N/A')
const parseMongoValue = (value) => {
  if (value && typeof value === 'object' && '$numberLong' in value) {
    return String(value.$numberLong);
  }
  return value;
};
// Display helper: returns value or 'N/A'
const displayValue = (value) => {
  return value ? String(value).trim() : 'N/A';
};
// FULL COUNTRY DATA & ADDRESS HIERARCHY
const countryAddressHierarchy = {
  "Afghanistan": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Albania": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Algeria": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Andorra": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Angola": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Antigua and Barbuda": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Argentina": { field1: { label: "Province", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Municipality", values: [] } },
  "Armenia": { field1: { label: "Province", values: [] }, field2: { label: "Community", values: [] }, field3: { label: "Area", values: [] } },
  "Australia": { field1: { label: "State/Territory", values: [] }, field2: { label: "Local Government Area", values: [] }, field3: { label: "Suburb", values: [] } },
  "Austria": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Azerbaijan": { field1: { label: "Economic Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Bahamas": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Bahrain": { field1: { label: "Governorate", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Bangladesh": { field1: { label: "Division", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Upazila", values: [] } },
  "Barbados": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Belarus": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Belgium": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Belize": { field1: { label: "District", values: [] }, field2: { label: "Town", values: [] }, field3: { label: "Area", values: [] } },
  "Benin": { field1: { label: "Department", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Bhutan": { field1: { label: "District", values: [] }, field2: { label: "Gewog", values: [] }, field3: { label: "Village", values: [] } },
  "Bolivia": { field1: { label: "Department", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Bosnia and Herzegovina": { field1: { label: "Entity", values: [] }, field2: { label: "Canton", values: [] }, field3: { label: "Municipality", values: [] } },
  "Botswana": { field1: { label: "District", values: [] }, field2: { label: "Sub-District", values: [] }, field3: { label: "Area", values: [] } },
  "Brazil": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Neighborhood", values: [] } },
  "Brunei": { field1: { label: "District", values: [] }, field2: { label: "Mukim", values: [] }, field3: { label: "Village", values: [] } },
  "Bulgaria": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Burkina Faso": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Commune", values: [] } },
  "Burundi": { field1: { label: "Province", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Cambodia": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Commune", values: [] } },
  "Cameroon": { field1: { label: "Region", values: [] }, field2: { label: "Division", values: [] }, field3: { label: "Sub-Division", values: [] } },
  "Canada": { field1: { label: "Province/Territory", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Cape Verde": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Central African Republic": { field1: { label: "Prefecture", values: [] }, field2: { label: "Sub-Prefecture", values: [] }, field3: { label: "Area", values: [] } },
  "Chad": { field1: { label: "Province", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Area", values: [] } },
  "Chile": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Commune", values: [] } },
  "China": { field1: { label: "Province", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "County", values: [] } },
  "Colombia": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Comoros": { field1: { label: "Island", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "Area", values: [] } },
  "Costa Rica": { field1: { label: "Province", values: [] }, field2: { label: "Canton", values: [] }, field3: { label: "District", values: [] } },
  "Croatia": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Cuba": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Cyprus": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Czech Republic": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Denmark": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Djibouti": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Dominica": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Dominican Republic": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Ecuador": { field1: { label: "Province", values: [] }, field2: { label: "Canton", values: [] }, field3: { label: "Parish", values: [] } },
  "Egypt": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "El Salvador": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Equatorial Guinea": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Eritrea": { field1: { label: "Region", values: [] }, field2: { label: "Sub-Region", values: [] }, field3: { label: "Area", values: [] } },
  "Estonia": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Eswatini": { field1: { label: "Region", values: [] }, field2: { label: "Inkhundla", values: [] }, field3: { label: "Area", values: [] } },
  "Ethiopia": { field1: { label: "Region", values: [] }, field2: { label: "Zone", values: [] }, field3: { label: "Woreda", values: [] } },
  "Fiji": { field1: { label: "Division", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "District", values: [] } },
  "Finland": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "France": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Commune", values: [] } },
  "Gabon": { field1: { label: "Province", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Area", values: [] } },
  "Gambia": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Georgia": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Germany": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Ghana": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Greece": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Grenada": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Guatemala": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Guinea": { field1: { label: "Region", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "Sub-Prefecture", values: [] } },
  "Guinea-Bissau": { field1: { label: "Region", values: [] }, field2: { label: "Sector", values: [] }, field3: { label: "Area", values: [] } },
  "Guyana": { field1: { label: "Region", values: [] }, field2: { label: "Neighborhood Council", values: [] }, field3: { label: "Area", values: [] } },
  "Haiti": { field1: { label: "Department", values: [] }, field2: { label: "Arrondissement", values: [] }, field3: { label: "Commune", values: [] } },
  "Honduras": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Hungary": { field1: { label: "County", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Iceland": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "India": { field1: { label: "State/UT", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Taluk", values: [] } },
  "Indonesia": { field1: { label: "Province", values: [] }, field2: { label: "Regency/City", values: [] }, field3: { label: "District", values: [] } },
  "Iran": { field1: { label: "Province", values: [] }, field2: { label: "County", values: [] }, field3: { label: "District", values: [] } },
  "Iraq": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Ireland": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Israel": { field1: { label: "District", values: [] }, field2: { label: "Sub-District", values: [] }, field3: { label: "Area", values: [] } },
  "Italy": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Jamaica": { field1: { label: "Parish", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Japan": { field1: { label: "Prefecture", values: [] }, field2: { label: "City/Ward", values: [] }, field3: { label: "District", values: [] } },
  "Jordan": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Kazakhstan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Kenya": { field1: { label: "County", values: [] }, field2: { label: "Sub-County", values: [] }, field3: { label: "Ward", values: [] } },
  "Kiribati": { field1: { label: "Island", values: [] }, field2: { label: "Council", values: [] }, field3: { label: "Area", values: [] } },
  "Kuwait": { field1: { label: "Governorate", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "Block", values: [] } },
  "Kyrgyzstan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Laos": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Village", values: [] } },
  "Latvia": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Lebanon": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Lesotho": { field1: { label: "District", values: [] }, field2: { label: "Community Council", values: [] }, field3: { label: "Area", values: [] } },
  "Liberia": { field1: { label: "County", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Libya": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Liechtenstein": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Lithuania": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Luxembourg": { field1: { label: "Canton", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Madagascar": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Commune", values: [] } },
  "Malawi": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Malaysia": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Mukim", values: [] } },
  "Maldives": { field1: { label: "Atoll", values: [] }, field2: { label: "Island", values: [] }, field3: { label: "Area", values: [] } },
  "Mali": { field1: { label: "Region", values: [] }, field2: { label: "Cercle", values: [] }, field3: { label: "Commune", values: [] } },
  "Malta": { field1: { label: "Region", values: [] }, field2: { label: "Local Council", values: [] }, field3: { label: "Area", values: [] } },
  "Marshall Islands": { field1: { label: "Atoll", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Mauritania": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Area", values: [] } },
  "Mauritius": { field1: { label: "District", values: [] }, field2: { label: "Village", values: [] }, field3: { label: "Area", values: [] } },
  "Mexico": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Locality", values: [] } },
  "Micronesia": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Moldova": { field1: { label: "District", values: [] }, field2: { label: "Commune", values: [] }, field3: { label: "Area", values: [] } },
  "Monaco": { field1: { label: "Commune", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Mongolia": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Bag", values: [] } },
  "Montenegro": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Morocco": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Commune", values: [] } },
  "Mozambique": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Myanmar": { field1: { label: "Region/State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Township", values: [] } },
  "Namibia": { field1: { label: "Region", values: [] }, field2: { label: "Constituency", values: [] }, field3: { label: "Area", values: [] } },
  "Nauru": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Nepal": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Netherlands": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "New Zealand": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Nicaragua": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Niger": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Commune", values: [] } },
  "Nigeria": { field1: { label: "State", values: [] }, field2: { label: "Local Government Area", values: [] }, field3: { label: "Ward", values: [] } },
  "North Korea": { field1: { label: "Province", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Area", values: [] } },
  "North Macedonia": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Norway": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Oman": { field1: { label: "Governorate", values: [] }, field2: { label: "Wilayat", values: [] }, field3: { label: "Area", values: [] } },
  "Pakistan": { field1: { label: "Province", values: [] }, field2: { label: "Division", values: [] }, field3: { label: "District", values: [] } },
  "Palau": { field1: { label: "State", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Panama": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Corregimiento", values: [] } },
  "Papua New Guinea": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Paraguay": { field1: { label: "Department", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Peru": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "District", values: [] } },
  "Philippines": { field1: { label: "Region", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "City/Municipality", values: [] } },
  "Poland": { field1: { label: "Voivodeship", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Gmina", values: [] } },
  "Portugal": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Parish", values: [] } },
  "Qatar": { field1: { label: "Municipality", values: [] }, field2: { label: "Zone", values: [] }, field3: { label: "Area", values: [] } },
  "Romania": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Russia": { field1: { label: "Federal Subject", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Rwanda": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Sector", values: [] } },
  "Saint Lucia": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Samoa": { field1: { label: "District", values: [] }, field2: { label: "Village", values: [] }, field3: { label: "Area", values: [] } },
  "San Marino": { field1: { label: "Municipality", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Saudi Arabia": { field1: { label: "Province", values: [] }, field2: { label: "Governorate", values: [] }, field3: { label: "Area", values: [] } },
  "Senegal": { field1: { label: "Region", values: [] }, field2: { label: "Department", values: [] }, field3: { label: "Arrondissement", values: [] } },
  "Serbia": { field1: { label: "District", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Seychelles": { field1: { label: "District", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Sierra Leone": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Singapore": { field1: { label: "City-State", values: [] }, field2: { label: "N/A", values: [] }, field3: { label: "N/A", values: [] } },
  "Slovakia": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "Slovenia": { field1: { label: "Statistical Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Solomon Islands": { field1: { label: "Province", values: [] }, field2: { label: "Ward", values: [] }, field3: { label: "Area", values: [] } },
  "Somalia": { field1: { label: "State", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "South Africa": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Municipality", values: [] } },
  "South Korea": { field1: { label: "Province", values: [] }, field2: { label: "City/County", values: [] }, field3: { label: "District", values: [] } },
  "South Sudan": { field1: { label: "State", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Payam", values: [] } },
  "Spain": { field1: { label: "Autonomous Community", values: [] }, field2: { label: "Province", values: [] }, field3: { label: "Municipality", values: [] } },
  "Sri Lanka": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Division", values: [] } },
  "Sudan": { field1: { label: "State", values: [] }, field2: { label: "Locality", values: [] }, field3: { label: "Area", values: [] } },
  "Suriname": { field1: { label: "District", values: [] }, field2: { label: "Resort", values: [] }, field3: { label: "Area", values: [] } },
  "Sweden": { field1: { label: "County", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Switzerland": { field1: { label: "Canton", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Syria": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Taiwan": { field1: { label: "County/City", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Tajikistan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Tanzania": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Ward", values: [] } },
  "Thailand": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Sub-District", values: [] } },
  "Togo": { field1: { label: "Region", values: [] }, field2: { label: "Prefecture", values: [] }, field3: { label: "Canton", values: [] } },
  "Tonga": { field1: { label: "Division", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Trinidad and Tobago": { field1: { label: "Region", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Tunisia": { field1: { label: "Governorate", values: [] }, field2: { label: "Delegation", values: [] }, field3: { label: "Sector", values: [] } },
  "Turkey": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Neighborhood", values: [] } },
  "Turkmenistan": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Tuvalu": { field1: { label: "Island", values: [] }, field2: { label: "Area", values: [] }, field3: { label: "N/A", values: [] } },
  "Uganda": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Sub-County", values: [] } },
  "Ukraine": { field1: { label: "Oblast", values: [] }, field2: { label: "Raion", values: [] }, field3: { label: "Hromada", values: [] } },
  "United Arab Emirates": { field1: { label: "Emirate", values: [] }, field2: { label: "City", values: [] }, field3: { label: "Area", values: [] } },
  "United Kingdom": { field1: { label: "Country", values: [] }, field2: { label: "County", values: [] }, field3: { label: "Borough", values: [] } },
  "United States": { field1: { label: "State", values: [] }, field2: { label: "County", values: [] }, field3: { label: "City", values: [] } },
  "Uruguay": { field1: { label: "Department", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Uzbekistan": { field1: { label: "Region", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Vanuatu": { field1: { label: "Province", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Area", values: [] } },
  "Vatican City": { field1: { label: "None", values: [] }, field2: { label: "N/A", values: [] }, field3: { label: "N/A", values: [] } },
  "Venezuela": { field1: { label: "State", values: [] }, field2: { label: "Municipality", values: [] }, field3: { label: "Parish", values: [] } },
  "Vietnam": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Commune", values: [] } },
  "Yemen": { field1: { label: "Governorate", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Zambia": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } },
  "Zimbabwe": { field1: { label: "Province", values: [] }, field2: { label: "District", values: [] }, field3: { label: "Area", values: [] } }
};

// Helper: Get labels for fields based on country
const getAddressLabels = (country, addressStructure, addressDoctypeFields = []) => {
  const structure = (addressStructure?.countries && Object.keys(addressStructure.countries).length > 0)
    ? addressStructure
    : { countries: {} };

  const countryData = structure.countries[country];
  const globalLabels = countryAddressHierarchy[country];
  
  // Extract all potential field IDs from addressDoctypeFields
  const fieldIds = addressDoctypeFields.length > 0
    ? addressDoctypeFields
        .map(f => f.id)
        .filter(id => id.toLowerCase().includes('field') && id.toLowerCase().includes('label'))
        .map(id => id.toLowerCase().replace('_label', '').replace('label', '').replace('_', ''))
        .sort((a, b) => parseInt(a.replace('field', '')) - parseInt(b.replace('field', '')))
    : ['field1', 'field2', 'field3'];

  const labels = {};
  fieldIds.forEach(fid => {
    if (countryData?.[fid]?.label) {
      labels[fid] = countryData[fid].label;
    } else if (globalLabels?.[fid]?.label && globalLabels[fid].label !== "N/A" && globalLabels[fid].label !== "None") {
      labels[fid] = globalLabels[fid].label;
    } else {
      // Hide unlabeled fields
      labels[fid] = "";
    }
  });
  return labels;
};

// Helper: Get options (dropdown values) for a field
const getOptionsForField = (field, country, addressStructure, linkedValues, parentValue = null) => {
  const structure = (addressStructure?.countries && Object.keys(addressStructure.countries).length > 0)
    ? addressStructure
    : { countries: {} };

  if (!country || !structure) return [];
  const { countries } = structure;

  const globalOpts = countries?.[country]?.[field]?.values || [];
  let linkedOpts = [];
  if (parentValue && linkedValues?.[country]?.[parentValue]) {
    linkedOpts = linkedValues[country][parentValue][field] || [];
  }

  const allOpts = new Set([...linkedOpts, ...globalOpts]);
  return Array.from(allOpts).sort();
};

// CustomDatePicker Component (Premium Interactive Calendar with Quick Enter)
const CustomDatePicker = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('days'); // 'days' | 'months' | 'years'
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed)) return parsed;
    }
    return new Date();
  });
  const [yearPage, setYearPage] = useState(() => Math.floor((currentDate.getFullYear()) / 12) * 12);

  // Popup quick input states
  const [popupDay, setPopupDay] = useState(() => value ? (new Date(value).getDate() || "") : "");
  const [popupMonth, setPopupMonth] = useState(() => value ? ((new Date(value).getMonth() + 1) || "") : "");
  const [popupYear, setPopupYear] = useState(() => value ? (new Date(value).getFullYear() || "") : "");

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed)) {
        setCurrentDate(parsed);
        setYearPage(Math.floor(parsed.getFullYear() / 12) * 12);
        setPopupDay(parsed.getDate() || "");
        setPopupMonth((parsed.getMonth() + 1) || "");
        setPopupYear(parsed.getFullYear() || "");
      }
    } else {
      setPopupDay("");
      setPopupMonth("");
      setPopupYear("");
    }
  }, [value]);

  const handleQuickChange = (type, val) => {
    if (type === 'day') setPopupDay(val);
    if (type === 'month') setPopupMonth(val);
    if (type === 'year') setPopupYear(val);

    const newDay = type === 'day' ? val : popupDay;
    const newMonth = type === 'month' ? val : popupMonth;
    const newYear = type === 'year' ? val : popupYear;

    const parsedYear = parseInt(newYear, 10);
    const parsedMonth = parseInt(newMonth, 10);
    const parsedDay = parseInt(newDay, 10);

    if (!isNaN(parsedYear) && parsedYear > 1000 && !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 && !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
      const newDateObj = new Date(parsedYear, parsedMonth - 1, parsedDay);
      if (!isNaN(newDateObj)) {
        setCurrentDate(newDateObj);
        setYearPage(Math.floor(parsedYear / 12) * 12);
        const formattedMonth = String(parsedMonth).padStart(2, '0');
        const formattedDay = String(parsedDay).padStart(2, '0');
        onChange(`${parsedYear}-${formattedMonth}-${formattedDay}`);
      }
    } else if (!isNaN(parsedYear) && parsedYear > 1000 && !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      setCurrentDate(new Date(parsedYear, parsedMonth - 1, 1));
      setYearPage(Math.floor(parsedYear / 12) * 12);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (day, e) => {
    e.stopPropagation();
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const selectedDateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(selectedDateStr);
    setIsOpen(false);
    setView('days');
  };

  let selectedYear = null, selectedMonth = null, selectedDay = null;
  if (value) {
    const parsed = new Date(value);
    if (!isNaN(parsed)) {
      selectedYear = parsed.getFullYear();
      selectedMonth = parsed.getMonth();
      selectedDay = parsed.getDate();
    }
  }

  return (
    <div className="custom-datepicker-container" style={{ position: 'relative', width: '100%' }}>
      <div 
        className="custom-datepicker-input"
        onClick={() => { setIsOpen(!isOpen); setView('days'); }}
        style={{ position: 'relative' }}
      >
        <input 
          type="text" 
          readOnly
          value={value || ""} 
          placeholder={placeholder || "YYYY-MM-DD"} 
          style={{ cursor: 'pointer', background: '#ffffff', width: '100%', height: '44px', padding: '0 16px', borderRadius: '8px', border: '1px solid #E2E6EF', fontWeight: '500', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box' }}
        />
        <FaCalendarAlt 
          style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#604BE8', pointerEvents: 'none' }} 
        />
      </div>

      {isOpen && (
        <>
          <div className="custom-datepicker-backdrop" onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }} />
          <div className="custom-datepicker-popup" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '320px', background: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: '24px', zIndex: 1001, border: '1px solid #e2e8f0', animation: 'slideDown 0.2s ease', boxSizing: 'border-box' }}>
            
            {/* Quick Input Row inside Popup */}
            <div className="popup-quick-inputs-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Enter Date</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Day</span>
                  <input 
                    type="number" 
                    value={popupDay} 
                    onChange={(e) => handleQuickChange('day', e.target.value)} 
                    placeholder="DD" 
                    min="1" 
                    max="31"
                    style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Month</span>
                  <input 
                    type="number" 
                    value={popupMonth} 
                    onChange={(e) => handleQuickChange('month', e.target.value)} 
                    placeholder="MM" 
                    min="1" 
                    max="12"
                    style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Year</span>
                  <input 
                    type="number" 
                    value={popupYear} 
                    onChange={(e) => handleQuickChange('year', e.target.value)} 
                    placeholder="YYYY" 
                    min="1000" 
                    max="9999"
                    style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} 
                  />
                </div>
              </div>
            </div>

            {view === 'days' && (
              <>
                <div className="custom-datepicker-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 24px 0' }}>
                  <button type="button" onClick={handlePrevMonth} className="cal-nav-btn" style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px', transition: 'all 0.2s ease' }}>
                    <FaChevronLeft />
                  </button>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span onClick={(e) => { e.stopPropagation(); setView('months'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      {monthNames[month]}
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); setYearPage(Math.floor(year / 12) * 12); setView('years'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                      {year}
                    </span>
                  </div>
                  <button type="button" onClick={handleNextMonth} className="cal-nav-btn" style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px', transition: 'all 0.2s ease' }}>
                    <FaChevronRight />
                  </button>
                </div>

                <div className="custom-datepicker-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '16px' }}>
                  {["Mo", "Tu", "We", "Th", "Fri", "Sa", "Su"].map((w, i) => (
                    <span key={i} style={{ fontSize: '13px', fontWeight: '700', color: '#1B1B29' }}>{w}</span>
                  ))}
                </div>

                <div className="custom-datepicker-days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px' }}>
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = selectedYear === year && selectedMonth === month && selectedDay === day;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={(e) => handleSelectDate(day, e)}
                        style={{
                          height: '36px',
                          width: '100%',
                          border: 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: isSelected ? '700' : '600',
                          cursor: 'pointer',
                          background: isSelected ? '#604BE8' : 'transparent',
                          color: isSelected ? '#ffffff' : '#1B1B29',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === 'months' && (
              <div>
                <div className="custom-datepicker-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 24px 0' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setView('days'); }} style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}>
                    <FaChevronLeft />
                  </button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29' }}>Select Month</span>
                  <div style={{ width: '36px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {monthNames.map((mName, index) => (
                    <button
                      key={mName}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(new Date(year, index, 1));
                        setView('days');
                      }}
                      style={{
                        height: '42px',
                        border: 'none',
                        borderRadius: '10px',
                        background: index === month ? '#604BE8' : '#F3F6FB',
                        color: index === month ? '#ffffff' : '#1B1B29',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {mName.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === 'years' && (
              <div>
                <div className="custom-datepicker-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 24px 0' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setYearPage(yearPage - 12); }} style={{ width: '36px', height: '36px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}>
                    <FaChevronLeft />
                  </button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setView('days'); }}>
                    {yearPage} - {yearPage + 11}
                  </span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setYearPage(yearPage + 12); }} style={{ width: '36px', height: '36px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}>
                    <FaChevronRight />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = yearPage + i;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(y, month, 1));
                          setView('days');
                        }}
                        style={{
                          height: '42px',
                          border: 'none',
                          borderRadius: '10px',
                          background: y === year ? '#604BE8' : '#F3F6FB',
                          color: y === year ? '#ffffff' : '#1B1B29',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// DateRangePickerModal Component (Premium Dual Interactive Calendar with Quick Enter)
const DateRangePickerModal = ({ initialStart, initialEnd, onSave, onCancel }) => {
  const parseDate = (str) => {
    if (!str || str === '0') return new Date();
    if (str.includes('/')) {
      const parts = str.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return !isNaN(d) ? d : new Date();
    }
    const d = new Date(str);
    return !isNaN(d) ? d : new Date();
  };

  const formatDate = (dateObj) => {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [startDateObj, setStartDateObj] = useState(() => parseDate(initialStart));
  const [endDateObj, setEndDateObj] = useState(() => parseDate(initialEnd));

  const [startView, setStartView] = useState('days');
  const [endView, setEndView] = useState('days');

  const [startYearPage, setStartYearPage] = useState(() => Math.floor(startDateObj.getFullYear() / 12) * 12);
  const [endYearPage, setEndYearPage] = useState(() => Math.floor(endDateObj.getFullYear() / 12) * 12);

  const [startDayInput, setStartDayInput] = useState(() => startDateObj.getDate() || "");
  const [startMonthInput, setStartMonthInput] = useState(() => (startDateObj.getMonth() + 1) || "");
  const [startYearInput, setStartYearInput] = useState(() => startDateObj.getFullYear() || "");

  const [endDayInput, setEndDayInput] = useState(() => endDateObj.getDate() || "");
  const [endMonthInput, setEndMonthInput] = useState(() => (endDateObj.getMonth() + 1) || "");
  const [endYearInput, setEndYearInput] = useState(() => endDateObj.getFullYear() || "");

  const handleStartQuickChange = (type, val) => {
    if (type === 'day') setStartDayInput(val);
    if (type === 'month') setStartMonthInput(val);
    if (type === 'year') setStartYearInput(val);

    const newDay = type === 'day' ? val : startDayInput;
    const newMonth = type === 'month' ? val : startMonthInput;
    const newYear = type === 'year' ? val : startYearInput;

    const py = parseInt(newYear, 10);
    const pm = parseInt(newMonth, 10);
    const pd = parseInt(newDay, 10);

    if (!isNaN(py) && py > 1000 && !isNaN(pm) && pm >= 1 && pm <= 12 && !isNaN(pd) && pd >= 1 && pd <= 31) {
      const d = new Date(py, pm - 1, pd);
      if (!isNaN(d)) {
        setStartDateObj(d);
        setStartYearPage(Math.floor(py / 12) * 12);
      }
    } else if (!isNaN(py) && py > 1000 && !isNaN(pm) && pm >= 1 && pm <= 12) {
      setStartDateObj(new Date(py, pm - 1, 1));
      setStartYearPage(Math.floor(py / 12) * 12);
    }
  };

  const handleEndQuickChange = (type, val) => {
    if (type === 'day') setEndDayInput(val);
    if (type === 'month') setEndMonthInput(val);
    if (type === 'year') setEndYearInput(val);

    const newDay = type === 'day' ? val : endDayInput;
    const newMonth = type === 'month' ? val : endMonthInput;
    const newYear = type === 'year' ? val : endYearInput;

    const py = parseInt(newYear, 10);
    const pm = parseInt(newMonth, 10);
    const pd = parseInt(newDay, 10);

    if (!isNaN(py) && py > 1000 && !isNaN(pm) && pm >= 1 && pm <= 12 && !isNaN(pd) && pd >= 1 && pd <= 31) {
      const d = new Date(py, pm - 1, pd);
      if (!isNaN(d)) {
        setEndDateObj(d);
        setEndYearPage(Math.floor(py / 12) * 12);
      }
    } else if (!isNaN(py) && py > 1000 && !isNaN(pm) && pm >= 1 && pm <= 12) {
      setEndDateObj(new Date(py, pm - 1, 1));
      setEndYearPage(Math.floor(py / 12) * 12);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const startYear = startDateObj.getFullYear();
  const startMonth = startDateObj.getMonth();
  const startFirstDay = new Date(startYear, startMonth, 1);
  const startDaysInMonth = new Date(startYear, startMonth + 1, 0).getDate();
  let startOffset = startFirstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const endYear = endDateObj.getFullYear();
  const endMonth = endDateObj.getMonth();
  const endFirstDay = new Date(endYear, endMonth, 1);
  const endDaysInMonth = new Date(endYear, endMonth + 1, 0).getDate();
  let endOffset = endFirstDay.getDay() - 1;
  if (endOffset < 0) endOffset = 6;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(27, 27, 41, 0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 10005, backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '24px', width: '840px', maxWidth: '95%',
        padding: '36px', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
        animation: 'fadeInScale 0.3s ease-out', fontFamily: "'Gilroy', 'Outfit', sans-serif",
        color: '#1B1B29', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #F1F3F8', paddingBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1B1B29' }}>Select Date Range</h3>
          <button onClick={onCancel} style={{ background: '#F1F4F9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#1B1B29', transition: 'all 0.2s' }}><FaTimes /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '36px' }}>
          {/* FROM DATE PICKER */}
          <div>
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #604BE8' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#604BE8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From Date</span>
            </div>

            {/* Quick Input Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Enter Date</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Day</span>
                  <input type="number" value={startDayInput} onChange={(e) => handleStartQuickChange('day', e.target.value)} placeholder="DD" min="1" max="31" style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Month</span>
                  <input type="number" value={startMonthInput} onChange={(e) => handleStartQuickChange('month', e.target.value)} placeholder="MM" min="1" max="12" style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                </div>
                <div style={{ flex: 1.5 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Year</span>
                  <input type="number" value={startYearInput} onChange={(e) => handleStartQuickChange('year', e.target.value)} placeholder="YYYY" min="1000" max="9999" style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                </div>
              </div>
            </div>

            {startView === 'days' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setStartDateObj(new Date(startYear, startMonth - 1, 1))} style={{ width: '34px', height: '34px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronLeft /></button>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span onClick={() => setStartView('months')} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>{monthNames[startMonth]}</span>
                    <span onClick={() => { setStartYearPage(Math.floor(startYear / 12) * 12); setStartView('years'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>{startYear}</span>
                  </div>
                  <button type="button" onClick={() => setStartDateObj(new Date(startYear, startMonth + 1, 1))} style={{ width: '34px', height: '34px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronRight /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '14px' }}>
                  {["Mo", "Tu", "We", "Th", "Fri", "Sa", "Su"].map((w, i) => (<span key={i} style={{ fontSize: '13px', fontWeight: '700', color: '#1B1B29' }}>{w}</span>))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px' }}>
                  {Array.from({ length: startOffset }).map((_, i) => (<div key={`empty-${i}`} />))}
                  {Array.from({ length: startDaysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = startDateObj.getDate() === day;
                    return (
                      <button key={day} type="button" onClick={() => { const d = new Date(startYear, startMonth, day); setStartDateObj(d); setStartDayInput(day); setStartMonthInput(startMonth + 1); setStartYearInput(startYear); }} style={{ height: '36px', width: '100%', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: isSelected ? '700' : '600', cursor: 'pointer', background: isSelected ? '#604BE8' : 'transparent', color: isSelected ? '#ffffff' : '#1B1B29', transition: 'all 0.2s ease' }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {startView === 'months' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setStartView('days')} style={{ width: '34px', height: '34px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronLeft /></button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29' }}>Select Month</span>
                  <div style={{ width: '34px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {monthNames.map((mName, index) => (
                    <button key={mName} type="button" onClick={() => { setStartDateObj(new Date(startYear, index, startDateObj.getDate())); setStartMonthInput(index + 1); setStartView('days'); }} style={{ height: '42px', border: 'none', borderRadius: '10px', background: index === startMonth ? '#604BE8' : '#F3F6FB', color: index === startMonth ? '#ffffff' : '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {mName.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {startView === 'years' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setStartYearPage(startYearPage - 12)} style={{ width: '34px', height: '34px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronLeft /></button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer' }} onClick={() => setStartView('days')}>{startYearPage} - {startYearPage + 11}</span>
                  <button type="button" onClick={() => setStartYearPage(startYearPage + 12)} style={{ width: '34px', height: '34px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronRight /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = startYearPage + i;
                    return (
                      <button key={y} type="button" onClick={() => { setStartDateObj(new Date(y, startMonth, startDateObj.getDate())); setStartYearInput(y); setStartView('days'); }} style={{ height: '42px', border: 'none', borderRadius: '10px', background: y === startYear ? '#604BE8' : '#F3F6FB', color: y === startYear ? '#ffffff' : '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TO DATE PICKER */}
          <div>
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #06D6A0' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#06D6A0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To Date</span>
            </div>

            {/* Quick Input Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Enter Date</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Day</span>
                  <input type="number" value={endDayInput} onChange={(e) => handleEndQuickChange('day', e.target.value)} placeholder="DD" min="1" max="31" style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Month</span>
                  <input type="number" value={endMonthInput} onChange={(e) => handleEndQuickChange('month', e.target.value)} placeholder="MM" min="1" max="12" style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                </div>
                <div style={{ flex: 1.5 }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Year</span>
                  <input type="number" value={endYearInput} onChange={(e) => handleEndQuickChange('year', e.target.value)} placeholder="YYYY" min="1000" max="9999" style={{ width: '100%', height: '38px', padding: '0 12px', background: '#F3F6FB', border: '1px solid transparent', borderRadius: '8px', fontWeight: '600', fontSize: '14px', color: '#1B1B29', boxSizing: 'border-box', textAlign: 'center', outline: 'none' }} />
                </div>
              </div>
            </div>

            {endView === 'days' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setEndDateObj(new Date(endYear, endMonth - 1, 1))} style={{ width: '34px', height: '34px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronLeft /></button>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span onClick={() => setEndView('months')} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>{monthNames[endMonth]}</span>
                    <span onClick={() => { setEndYearPage(Math.floor(endYear / 12) * 12); setEndView('years'); }} style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = '#F3F6FB'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>{endYear}</span>
                  </div>
                  <button type="button" onClick={() => setEndDateObj(new Date(endYear, endMonth + 1, 1))} style={{ width: '34px', height: '34px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronRight /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '14px' }}>
                  {["Mo", "Tu", "We", "Th", "Fri", "Sa", "Su"].map((w, i) => (<span key={i} style={{ fontSize: '13px', fontWeight: '700', color: '#1B1B29' }}>{w}</span>))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px' }}>
                  {Array.from({ length: endOffset }).map((_, i) => (<div key={`empty-${i}`} />))}
                  {Array.from({ length: endDaysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = endDateObj.getDate() === day;
                    return (
                      <button key={day} type="button" onClick={() => { const d = new Date(endYear, endMonth, day); setEndDateObj(d); setEndDayInput(day); setEndMonthInput(endMonth + 1); setEndYearInput(endYear); }} style={{ height: '36px', width: '100%', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: isSelected ? '700' : '600', cursor: 'pointer', background: isSelected ? '#06D6A0' : 'transparent', color: isSelected ? '#ffffff' : '#1B1B29', transition: 'all 0.2s ease' }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {endView === 'months' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setEndView('days')} style={{ width: '34px', height: '34px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronLeft /></button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29' }}>Select Month</span>
                  <div style={{ width: '34px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {monthNames.map((mName, index) => (
                    <button key={mName} type="button" onClick={() => { setEndDateObj(new Date(endYear, index, endDateObj.getDate())); setEndMonthInput(index + 1); setEndView('days'); }} style={{ height: '42px', border: 'none', borderRadius: '10px', background: index === endMonth ? '#06D6A0' : '#F3F6FB', color: index === endMonth ? '#ffffff' : '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                      {mName.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {endView === 'years' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button type="button" onClick={() => setEndYearPage(endYearPage - 12)} style={{ width: '34px', height: '34px', background: '#F3F6FB', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronLeft /></button>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1B1B29', cursor: 'pointer' }} onClick={() => setEndView('days')}>{endYearPage} - {endYearPage + 11}</span>
                  <button type="button" onClick={() => setEndYearPage(endYearPage + 12)} style={{ width: '34px', height: '34px', background: 'transparent', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1B1B29', fontSize: '14px' }}><FaChevronRight /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const y = endYearPage + i;
                    return (
                      <button key={y} type="button" onClick={() => { setEndDateObj(new Date(y, endMonth, endDateObj.getDate())); setEndYearInput(y); setEndView('days'); }} style={{ height: '42px', border: 'none', borderRadius: '10px', background: y === endYear ? '#06D6A0' : '#F3F6FB', color: y === endYear ? '#ffffff' : '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #F1F3F8', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px 16px', borderRadius: '10px', background: '#eff2f9', color: '#604BE8', fontWeight: '700', fontSize: '15px' }}>
              From: {formatDate(startDateObj)}
            </div>
            <span style={{ fontWeight: '700', color: '#94a3b8' }}>➔</span>
            <div style={{ padding: '8px 16px', borderRadius: '10px', background: '#ecfdf5', color: '#06D6A0', fontWeight: '700', fontSize: '15px' }}>
              To: {formatDate(endDateObj)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onCancel} style={{ height: '48px', padding: '0 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#F1F4F9', color: '#64748b', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
            <button onClick={() => onSave(formatDate(startDateObj), formatDate(endDateObj))} style={{ height: '48px', padding: '0 32px', borderRadius: '12px', border: 'none', background: '#604BE8', color: '#ffffff', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(96, 75, 232, 0.4)' }}>Apply Date Range</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// SearchableSelect Component (Enhanced with Create New)
const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null, className = "", type = "text" }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (onChange) onChange(newSearch);
    if (!showList) setShowList(true);
  };

  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) onChange(option);
    setShowList(false);
  };

  const handleCreateNewOption = async () => {
    if (onCreateRequest) {
      onCreateRequest(search);
      setShowList(false);
      return;
    }
    if (onAddNewValue) {
      if (!search.trim()) {
        setShowList(false);
        return;
      }
      const success = await onAddNewValue(search);
      if (success) {
        setSearch(search);
        if (onChange) onChange(search);
        setShowList(false);
      }
    }
  };

  const handleFocus = () => setShowList(true);
  const handleBlur = () => setTimeout(() => setShowList(false), 200);

  return (
    <div className={`searchable-select ${className}`} style={{ position: 'relative', width: '100%' }}>
      <input
        type={type}
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={(e) => { if (type === 'date' && e.target.showPicker) e.target.showPicker(); }}
        placeholder={placeholder}
        style={{ paddingRight: '44px' }}
      />
      <div style={{ 
        position: 'absolute', 
        right: '18px', 
        top: '50%', 
        transform: 'translateY(-50%)', 
        color: '#94a3b8',
        pointerEvents: 'none',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {type !== 'date' && <FaChevronDown />}
      </div>
      {showList && (
        <ul className="searchable-list">
          {allowCreateNew && (onAddNewValue || onCreateRequest) && (
            (() => {
              const isExactMatch = filteredOptions.some(option => option.toLowerCase() === search.toLowerCase());
              const hasSearch = !!search.trim();
              if ((onCreateRequest && !isExactMatch) || (onAddNewValue && hasSearch && !isExactMatch)) {
                let createText;
                if (hasSearch) {
                  createText = createNewLabel ? `Create New ${createNewLabel}: "${search.trim()}"` : `Create New: "${search.trim()}"`;
                } else {
                  createText = createNewLabel ? `Create New ${createNewLabel}` : `Create New`;
                }
                return (
                  <li
                    key="create-new"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateNewOption();
                    }}
                    style={{ fontStyle: 'italic', color: '#007bff' }}
                  >
                    {createText}
                  </li>
                );
              }
              return null;
            })()
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectOption(option);
                }}
              >
                {option}
              </li>
            ))
          ) : (
            !allowCreateNew && <li className="no-options">No matching options</li>
          )}
        </ul>
      )}
    </div>
  );
};
// Column Filter Component (Searchable Dropdown for Filters)
const ColumnFilterInput = ({ col, customerList, value, onChange }) => {
  const options = useMemo(() => {
    const vals = customerList.map(c => {
      const val = c[col.id];
      if (val === null || val === undefined || val === 'N/A' || val === '') return null;
      return String(val).trim();
    }).filter(Boolean);
    return [...new Set(vals)].sort();
  }, [customerList, col.id]);

  if (col.type === 'Date') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ 
          fontSize: '12px', 
          color: '#475569', 
          fontWeight: '700', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          paddingLeft: '4px'
        }}>
          {col.label}
        </label>
        <CustomDatePicker 
          value={value} 
          onChange={onChange} 
          placeholder={`Filter ${col.label}...`} 
        />
      </div>
    );
  }

  const inputType = col.type === 'Date' ? 'date' : 
                    (['Phone', 'Int', 'Currency'].includes(col.type)) ? 'number' : 
                    'text';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ 
        fontSize: '12px', 
        color: '#475569', 
        fontWeight: '700', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        paddingLeft: '4px'
      }}>
        {col.label}
      </label>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={`Filter ${col.label}...`}
        className="premium-filter-select"
        type={inputType}
      />
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px 20px',
          borderRadius: '8px',
          maxWidth: '600px',
          margin: '20px auto',
          textAlign: 'center'
        }}>
          <p>Something went wrong: {this.state.error?.message}</p>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
const CustomerListPage = () => {
  const [customerList, setCustomerList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [warningMessage, setWarningMessage] = useState("");
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEntries, setShowEntries] = useState("000");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [addressStructure, setAddressStructure] = useState({ countries: countryAddressHierarchy });
  const [linkedValues, setLinkedValues] = useState({});

  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  // Permissions & Loading States
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");
  
  // Dynamic DocType State
  const [doctypeFields, setDoctypeFields] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [tableOptions, setTableOptions] = useState({});

  // Dynamic Address State

  // Filter states for dynamic fields
  
  
  
  
  
  
  // Advanced Features: Column Management & Multi-Tenant Filter
   const [filterCompanyName, setFilterCompanyName] = useState("");
   const [companyOptions, setCompanyOptions] = useState([]);
    const [filterBranchName, setFilterBranchName] = useState("");
    const [branchOptions, setBranchOptions] = useState([]);
    const [showManageColumns, setShowManageColumns] = useState(false);
    const [addressDoctypeFields, setAddressDoctypeFields] = useState([]);
   const [visibleColumns, setVisibleColumns] = useState(() => {
     const saved = localStorage.getItem('customer_list_visible_columns');
     return saved ? JSON.parse(saved) : {
       'customer_name': true,
       'phone_number': true,
       'customer_group': true,
       'country': true,
       'field1': true,
       'field2': true,
       'field3': true
     };
   });

   const sortedAddressFieldIds = useMemo(() => {
    if (addressDoctypeFields.length > 0) {
      return addressDoctypeFields
        .map(f => f.id)
        .filter(id => id.toLowerCase().includes('field') && id.toLowerCase().includes('label'))
        .map(id => id.toLowerCase().replace('_label', '').replace('label', '').replace('_', ''))
        .sort((a, b) => parseInt(a.replace('field', '')) - parseInt(b.replace('field', '')));
    }
    return ['field1', 'field2', 'field3'];
   }, [addressDoctypeFields]);

    const allColumns = useMemo(() => {
      const cols = [];
      
      // 1. Dynamic Address/Country Handling
      const hasAddress = doctypeFields.some(f => f.id === 'address');
      if (hasAddress) {
        cols.push({ id: 'country', label: 'Country Name', path: 'country' });
        cols.push({ id: 'address', label: 'Adress & Details', path: 'full_address' });
      }

      // 2. Map fields from DocType
      doctypeFields.forEach(f => {
        if (['Section Break', 'Column Break', 'HTML', 'Button'].includes(f.type)) return;
        if (f.id === 'address') {
          sortedAddressFieldIds.forEach(fid => {
            const firstCountry = (columnFilters["country"] || "") || Object.keys(addressStructure.countries)[0];
            const labels = getAddressLabels(firstCountry, addressStructure, addressDoctypeFields);
            const label = labels[fid] || fid.replace('field', 'Field ');
            if (label) cols.push({ id: fid, label, path: `address_data.${fid}` });
          });
          cols.push({ id: 'flat_villa_no', label: 'Flat/Villa', path: 'address_data.flat_villa_no' });
          cols.push({ id: 'building_name', label: 'Building/Street', path: 'address_data.building_name' });
          return;
        }

        if (!cols.find(c => c.id === f.id)) {
          cols.push({ id: f.id, label: f.label, type: f.type });
        }
      });

      // 3. Dynamic Discovery: Scan data for missing fields (like manoj1)
      if (customerList.length > 0) {
        const first = customerList[0];
        const ignoreKeys = [
          '_id', '__v', 'address', 'address_data', 'full_address', 
          'branch_names', 'company_names', 'password', 'token', 
          'role_permissions', 'createdAt', 'updatedAt', 'created_at', 
          'modified_at', 'modifiedAt', 'customer_group_company', 
          'customer_group_company_name', 'customer_group_company_names',
          'customer_group_manoj', 'Company Name', 'companyName', 
          'company_name_full', 'createdBy', 'created_by'
        ];
        Object.keys(first).forEach(key => {
          const lowerKey = key.toLowerCase();
          const isSystem = ignoreKeys.includes(key) || 
                          lowerKey.includes('createdat') || 
                          lowerKey.includes('updatedat') ||
                          lowerKey.includes('modifiedat') ||
                          lowerKey.includes('created_at') ||
                          lowerKey.includes('modified_at');
          
          if (!isSystem && !cols.find(c => c.id === key || c.path === key)) {
            // If it's a new key found in data, add it!
            cols.push({ id: key, label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') });
          }
        });
      }

      // 4. Ensure Company/Branch
      if (!cols.find(c => c.id === 'company_name')) cols.push({ id: 'company_name', label: 'Company', path: 'company_name' });
      if (!cols.find(c => c.id === 'branch_name')) cols.push({ id: 'branch_name', label: 'Branch', path: 'branch_name' });

      return cols;
    }, [doctypeFields, addressStructure, addressDoctypeFields, sortedAddressFieldIds, customerList]);

   // Persist columns whenever they change
   useEffect(() => {
     localStorage.setItem('customer_list_visible_columns', JSON.stringify(visibleColumns));
   }, [visibleColumns]);

  const navigate = useNavigate();
  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ];
  
  // Fetch config to determine baseUrl (like in AdminPage)
  useEffect(() => {
    if (!configLoading) {
      const url = baseUrl || "";
      Promise.all([
        fetchPermissions(url),
        handleViewCustomers(url),
        fetchCustomerGroups(url),
        fetchAddressStructure(url),
        fetchAddressDoctype(url),
        fetchCompanies(url),
        fetchBranches(url),
        fetchDoctype(url)
      ]);
    }
  }, [configLoading, baseUrl]);

  // Listen to Admin Panel dropdown changes to automatically re-fetch the list
  useEffect(() => {
    const handleStorageChange = () => {
      if (!configLoading) {
        const url = baseUrl || "";
        handleViewCustomers(url);
        fetchCustomerGroups(url);
      }
    };
    window.addEventListener('local-storage-change', handleStorageChange);
    return () => window.removeEventListener('local-storage-change', handleStorageChange);
  }, [configLoading, baseUrl]);


  // Re-fetch branches when company filter changes
  useEffect(() => {
    if (!configLoading) {
      fetchBranches(baseUrl || "");
    }
  }, [filterCompanyName, configLoading, baseUrl]);

  const fetchCompanies = async (currentBaseUrl = baseUrl) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const role = userObj.role?.toLowerCase() || "";
      
      // If branch admin, they don't need company list (scope is limited)
      if (role.includes('branch')) return;

      if (userObj.role?.toLowerCase() !== 'group_admin' && userObj.role?.toLowerCase() !== 'superadmin') return;

      // Performance: use profile companies if available
      if (userObj.companies && userObj.companies.length > 0) {
        setCompanyOptions(userObj.companies);
        return;
      }

      const response = await axios.get(`${currentBaseUrl}/api/company-details`, { headers: getHeaders() });
      const details = response.data.companyDetails || [];
      const names = details.map(d => d.restaurantName).filter(n => n);
      const uniqueNames = [...new Set(names)];
      setCompanyOptions(uniqueNames.length > 0 ? uniqueNames : ['POS 8']);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchAddressDoctype = async (url) => {
    try {
      const res = await axios.get(`${url}/api/doctypes/Address Structure`, { headers: getHeaders() });
      setAddressDoctypeFields(res.data.fields || []);
    } catch (e) { console.error("Error fetching address doctype:", e); }
  };

  const fetchDoctype = async (currentBaseUrl = baseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/doctypes/Customer`, { headers: getHeaders() });
      const fields = response.data.fields || [];
      setDoctypeFields(fields);
      
      // Fetch data for Table/Link fields
      const tableFields = fields.filter(f => f.type === 'Table' && f.link_doctype);
      for (const field of tableFields) {
        fetchTableData(field);
      }
    } catch (error) {
      console.error("Error fetching doctype:", error);
    }
  };

  const fetchTableData = async (field) => {
    // Skip Address Structure as it's handled by fetchAddressStructure
    if (field.link_doctype === "Address Structure") return;
    
    try {
      const doctypeApiMap = {
        "Customer": "/api/customers",
        "Customer Group": "/api/customer-groups"
      };
      const endpoint = doctypeApiMap[field.link_doctype] || `/api/${field.link_doctype.toLowerCase().replace(/\s+/g, '-')}`;
      const res = await axios.get(`${baseUrl}${endpoint}`, { headers: getHeaders() });
      setTableOptions(prev => ({ ...prev, [field.id]: res.data }));
    } catch (e) {
      console.error(`Failed to fetch data for ${field.link_doctype}`, e);
    }
  };

  const getDisplayValueForTable = (record, doctype) => {
    if (!record) return "";
    if (doctype === "Customer") return record.customer_name;
    if (doctype === "Customer Group") return record.group_name;
    return record.name || record.label || record.group_name || record.customer_name || record._id || "";
  };

  const isMandatory = (id) => {
    const field = doctypeFields.find(f => f.id === id);
    return field ? field.mandatory : false;
  };

  const fetchBranches = async (currentBaseUrl = baseUrl) => {
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const role = userObj.role?.toLowerCase() || "";
      
      let targetComp = filterCompanyName;
      if (!targetComp) {
        targetComp = localStorage.getItem('active_company') || userObj.company_name || userObj.company || "";
      }

      if (targetComp && targetComp !== 'All') {
        const res = await axios.get(`${currentBaseUrl}/api/branches?company_name=${encodeURIComponent(targetComp)}`, {
          headers: getHeaders(null, targetComp)
        });
        const branches = res.data.branches || res.data || [];
        const names = Array.isArray(branches) ? branches.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)) : [];
        setBranchOptions([...new Set(names.filter(n => n))]);
      } else if (role.includes('branch') || role.includes('admin')) {
        // Fetch all branches if role allows but no specific company filtered yet
        const res = await axios.get(`${currentBaseUrl}/api/branches`, { headers: getHeaders() });
        const branches = res.data.branches || res.data || [];
        const names = Array.isArray(branches) ? branches.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name)) : [];
        setBranchOptions([...new Set(names.filter(n => n))]);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };
  const handleViewCustomers = async (currentBaseUrl = baseUrl) => {
    try {
      setLoading(true);
      const response = await axios.get(`${currentBaseUrl}/api/customers`, { headers: getHeaders() });
      const data = response.data;
      // Ensure data is an array and parse any MongoDB extended JSON
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: Expected an array");
      }
      const parsedData = data.map(customer => {
        // Flatten address data if it exists
        let address_data = {};
        if (Array.isArray(customer.address) && customer.address.length > 0) {
          address_data = customer.address[0];
        } else if (customer.address && typeof customer.address === 'object' && !Array.isArray(customer.address)) {
          address_data = customer.address;
        } else if (customer.address_data) {
          address_data = customer.address_data;
        }

        // Helper to find value across many possible field name variations
        const findVal = (baseId, aliases = []) => {
          const allKeys = [baseId, ...aliases];
          for (const key of allKeys) {
            const val = parseMongoValue(customer[key] || address_data[key]);
            if (val && val !== 'N/A' && val !== 'undefined') return val;
          }
          return null;
        };

        const cntry = findVal('country', ['country_name', 'Country Name', 'countryName', 'CountryName']);
        const f1 = findVal('field1', ['state_ut', 'State/UT', 'stateUt', 'StateUt', 'state', 'State']);
        const f2 = findVal('field2', ['district', 'District', 'districtName', 'DistrictName']);
        const f3 = findVal('field3', ['taluk', 'Taluk', 'area', 'Area', 'taluka', 'Taluka']);
        const building = findVal('building_name', ['building_street_name', 'Building / Street Name', 'buildingStreetName', 'street', 'Street']);
        const flat_villa = findVal('flat_villa_no', ['Flat / Villa No', 'flatVillaNo', 'villa_no', 'Villa No']);

        const full_address = [cntry, f1, f2, f3, building, flat_villa]
          .filter(v => v && v !== 'N/A' && v !== 'undefined').join(', ');

        return {
          ...customer,
          address_data,
          full_address: full_address || 'N/A',
          phone_number: parseMongoValue(customer.phone_number),
          whatsapp_number: parseMongoValue(customer.whatsapp_number),
          email: parseMongoValue(customer.email),
          customer_name: parseMongoValue(customer.customer_name),
          building_name: building || 'N/A',
          flat_villa_no: flat_villa || 'N/A',
          country: cntry || 'N/A',
          field1: f1 || 'N/A',
          field2: f2 || 'N/A',
          field3: f3 || 'N/A',
        };
      });
      console.log("Parsed Customer List:", parsedData);
      // The backend API now strictly filters by company_id, branch_id, and tenant_id based on context headers.
      // We no longer need fragile string-based client-side isolation filtering.
      setCustomerList(parsedData);
      setFilteredCustomers(parsedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(error.response?.data?.error || error.message || `Failed to fetch customers: ${error.status || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  // Fetch customer groups (updated to use axios and baseUrl)
  const fetchCustomerGroups = async (currentBaseUrl = baseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/customer-groups`, { headers: getHeaders() });
      const data = response.data;
      setCustomerGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customer groups:', error);
      setCustomerGroups([]);
    }
  };
  // Fetch address structure (updated to use axios and baseUrl)
  const fetchAddressStructure = async (currentBaseUrl = baseUrl) => {
    try {
      const response = await axios.get(`${currentBaseUrl}/api/address-structures`, { headers: getHeaders() });
      const data = response.data;

      // Merge API data with local hierarchy to ensure integrity
      const apiStructure = data.structure || {};
      const mergedCountries = { ...countryAddressHierarchy, ...apiStructure.countries };

      setAddressStructure({ countries: mergedCountries });
      setLinkedValues(data.linkedValues || {});
    } catch (error) {
      console.error('Error fetching address structure:', error);
      // Fallback already used in initial state
    }
  };
  // Compute unique values for filters (dynamic based on filterCountry)
  const uniqueCountries = useMemo(() =>
    [...new Set(customerList.map(c => c.country).filter(Boolean))].sort(),
    [customerList]
  );
  
  
  
  // Enhanced filtering including search and dynamic field filters
  const parseFilterDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d)) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const d = new Date(str);
    if (!isNaN(d)) {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return null;
  }, []);

  const dateColumns = useMemo(() => {
    return allColumns.filter(col => 
      visibleColumns[col.id] && 
      (col.type === 'Date' || col.id === 'date' || col.id.toLowerCase().includes('date') || col.label.toLowerCase().includes('date'))
    );
  }, [allColumns, visibleColumns]);

  const hasVisibleDateColumn = dateColumns.length > 0;

  useEffect(() => {
    let filtered = customerList;
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        return (c.customer_name && String(c.customer_name).toLowerCase().includes(query)) ||
               (c.phone_number && String(c.phone_number).toLowerCase().includes(query)) ||
               (c.email && String(c.email).toLowerCase().includes(query)) ||
               (c.full_address && String(c.full_address).toLowerCase().includes(query));
      });
    }
    // Apply column-specific filters
    Object.entries(columnFilters).forEach(([colId, filterVal]) => {
      if (filterVal) {
        const colDef = allColumns.find(c => c.id === colId);
        filtered = filtered.filter(customer => {
          let val = '';
          if (colDef && colDef.path) {
            const parts = colDef.path.split('.');
            let current = customer;
            for (const part of parts) {
              current = current ? current[part] : undefined;
            }
            val = String(current || '');
          } else {
            val = String(customer[colId] || '');
          }
          return val.toLowerCase().includes(filterVal.toLowerCase());
        });
      }
    });
    
    // Date Range Filter (only if a date column is visible and startDate/endDate are valid)
    if (hasVisibleDateColumn && startDate && endDate) {
      const startObj = parseFilterDate(startDate);
      const endObj = parseFilterDate(endDate);
      if (startObj && endObj) {
        startObj.setHours(0, 0, 0, 0);
        endObj.setHours(23, 59, 59, 999);
        filtered = filtered.filter(customer => {
          // Check if any of the active date columns fall within the range
          return dateColumns.some(col => {
            let val = '';
            if (col.path) {
              const parts = col.path.split('.');
              let current = customer;
              for (const part of parts) {
                current = current ? current[part] : undefined;
              }
              val = current;
            } else {
              val = customer[col.id];
            }
            if (!val) return false;
            const custDate = parseFilterDate(val);
            if (!custDate) return false;
            return custDate.getTime() >= startObj.getTime() && custDate.getTime() <= endObj.getTime();
          });
        });
      }
    }
    
    // Company filter
    if (filterCompanyName) {
      filtered = filtered.filter((customer) => {
        const comps = Array.isArray(customer.company_names) ? customer.company_names : (customer.company_name ? [customer.company_name] : []);
        return comps.includes(filterCompanyName) || customer.company_name === filterCompanyName || customer.company_name === 'All';
      });
    }
    // Branch filter
    if (filterBranchName) {
      filtered = filtered.filter((customer) => {
        const branches = customer.branch_names || [];
        return branches.includes(filterBranchName) || customer.branch_name === filterBranchName;
      });
    }
    setFilteredCustomers(filtered);
  }, [searchTerm, columnFilters, filterCompanyName, filterBranchName, customerList, allColumns, startDate, endDate, hasVisibleDateColumn, dateColumns, parseFilterDate]);
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fetch Permissions (UPDATED: accept currentBaseUrl)
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState("");

  const fetchPermissions = async (currentBaseUrl = baseUrl) => {
    try {
      setPermsLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const roleRaw = userObj.role || userObj.UserType || '';
        const roleNorm = roleRaw.toLowerCase().replace(/[\s_]/g, '');
        const isCompanyAdminLocal = roleNorm === 'companyadmin';
        const isGroupAdminRole = checkIsGlobalAdmin(userObj);
        const isAdminRole = checkIsAdmin(userObj);
        
        setIsCompanyAdmin(isCompanyAdminLocal || isAdminRole);
        setIsGroupAdmin(isGroupAdminRole);
        
        const branch = (!isGroupAdminRole && !isCompanyAdminLocal) ? (userObj.branch_name || userObj.branch || "") : "";
        setUserBranch(branch);

        const role = userObj.role || userObj.UserType || '';
        if (role) {
          const url = `${currentBaseUrl}/api/role-permissions?role=${encodeURIComponent(role)}`;
          const response = await axios.get(url, { headers: getHeaders() });
          const perms = response.data.permissions || [];
          const pagePerm = perms.find(p => p.pageId === 'customer_list');
          
          if (isAdminRole || isGroupAdminRole) {
            setCanRead(true);
            setCanWrite(true);
            setCanDelete(true);
          } else if (pagePerm) {
            setCanRead(pagePerm.canRead === true);
            setCanWrite(pagePerm.canWrite === true);
            setCanDelete(pagePerm.canDelete === true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermsLoading(false);
    }
  };

  const goToAdminPage = () => navigate("/admin");
  // Delete customer (updated to use axios and baseUrl)
  const handleDeleteCustomer = (customerId) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete customers.");
      setShowPermModal(true);
      return;
    }
    if (!customerId || customerId === "undefined") {
      setWarningMessage("Invalid customer ID. Please try again.");
      return;
    }
    setCustomerToDelete(customerId);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const activeComp = (localStorage.getItem('active_company') || '').trim();
      const activeBranch = (localStorage.getItem('active_branch') || '').trim();
      const headers = {
        ...getHeaders(),
        ...(activeComp && activeComp !== 'All' ? { 'X-Company-Name': activeComp } : {}),
        ...(activeBranch && activeBranch !== 'All Branches' ? { 'X-Branch-Name': activeBranch } : {})
      };
      await axios.delete(`${baseUrl}/api/customers/${customerToDelete}`, { headers });
      setCustomerList((prev) => prev.filter((customer) => customer._id !== customerToDelete));
      setFilteredCustomers((prev) => prev.filter((customer) => customer._id !== customerToDelete));
      setWarningMessage("Customer deleted successfully!");
    } catch (error) {
      console.error('Delete error:', error);
      setWarningMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    }
  };
  // Edit customer
  const handleEditCustomer = (customer) => {
    if (!canWrite) {
      setPermModalMsg("You do not have permission to edit customers.");
      setShowPermModal(true);
      return;
    }
    navigate(`/edit-customer/${customer._id}`);
  };





  // Helper to get filtered values is now redundant with getOptionsForField but keeping for structure
  const countryList = Object.keys(countryAddressHierarchy);

  // Added Logic: Create New Value in Dropdown

  // Save customer (updated to use axios and baseUrl)

  // Clear warning after 5 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);
  // Filter clear handlers
  const clearFilter = (setter) => setter("");
  // Calculate visible address columns for radius adjustment
  const addressColsCount = Object.keys(visibleColumns).filter(k => k.startsWith('field') && visibleColumns[k]).length;
  const lastHeaderIndex = 4 + addressColsCount + 2; // Country (4) + address fields + WhatsApp+Email (2)


  if (permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  if (!canRead && !isCompanyAdmin && !isGroupAdmin && !permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #ffffff 0%, #3498db 100%)' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Access Denied</h2>
          <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>You do not have permission to view the Customer List.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', borderRadius: '50px', padding: '10px 30px', background: '#3498db', border: 'none' }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  const styles = {
    tableHeader: {
      padding: '16px 12px',
      textAlign: 'left',
      color: '#64748b',
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '2px solid #f1f5f9',
      whiteSpace: 'nowrap',
      backgroundColor: '#f8fafc'
    },
    tableRow: {
      borderBottom: '1px solid #f1f5f9'
    },
    tableCell: {
      padding: '14px 12px',
      fontSize: '14px',
      color: '#334155',
      verticalAlign: 'middle'
    },
    groupBadge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      backgroundColor: '#f5f3ff',
      color: '#7c3aed',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase'
    },
    viewBtn: {
      padding: '6px 12px',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
      color: '#64748b',
      border: '1px solid #e2e8f0',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    editBtnSmall: {
      padding: '6px 12px',
      borderRadius: '8px',
      backgroundColor: '#f0f9ff',
      color: '#0ea5e9',
      border: '1px solid #e0f2fe',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    deleteBtnSmall: {
      padding: '6px 12px',
      borderRadius: '8px',
      backgroundColor: '#fef2f2',
      color: '#ef4444',
      border: '1px solid #fee2e2',
      fontSize: '12px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <ErrorBoundary>
      <div className="customer-list-page" style={{ 
        backgroundColor: "#F8F9FD", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden", 
        fontFamily: "'Gilroy', 'Outfit', 'Inter', sans-serif",
        color: "#1B1B29"
      }}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            @import url('https://fonts.cdnfonts.com/css/gilroy-bold');
            
            .premium-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
            }
            .premium-table th {
              background: #06D6A0;
              color: #ffffff;
              font-weight: 600;
              font-size: 15px;
              text-transform: capitalize;
              letter-spacing: 0.3px;
              padding: 16px 24px;
              text-align: left;
              border: none;
              position: sticky;
              top: 0;
              z-index: 10;
            }
            .premium-table th:first-child {
              border-top-left-radius: 10px;
            }
            .premium-table th:last-child {
              border-top-right-radius: 10px;
            }
            .premium-table td {
              padding: 16px 24px;
              color: #4A4A5A;
              font-size: 14px;
              font-weight: 500;
              border-bottom: 1px solid #F1F3F8;
              transition: all 0.2s ease;
              vertical-align: middle;
            }
            .premium-table tr:nth-child(odd) td {
              background: #ffffff;
            }
            .premium-table tr:nth-child(even) td {
              background: #FAFBFD;
            }
            .premium-table tr:hover td {
              background: #F1F4F9;
            }
            .premium-table tr:last-child td {
              border-bottom: none;
            }
            
            .action-btn {
              width: 42px;
              height: 42px;
              border-radius: 10px;
              display: flex;
              justify-content: center;
              align-items: center;
              cursor: pointer;
              transition: all 0.2s ease;
              border: none;
            }
            .action-btn-view {
              background: rgba(75, 118, 230, 0.15);
              color: #4B76E6;
            }
            .action-btn-view:hover {
              background: #4B76E6 !important;
              color: #ffffff !important;
              box-shadow: 0 4px 12px rgba(75, 118, 230, 0.3);
            }
            .action-btn-edit {
              background: rgba(255, 159, 4, 0.15);
              color: #FF9F04;
            }
            .action-btn-edit:hover {
              background: #FF9F04 !important;
              color: #ffffff !important;
              box-shadow: 0 4px 12px rgba(255, 159, 4, 0.3);
            }
            .action-btn-delete {
              background: rgba(255, 89, 94, 0.15);
              color: #FF595E;
            }
            .action-btn-delete:hover {
              background: #FF595E !important;
              color: #ffffff !important;
              box-shadow: 0 4px 12px rgba(255, 89, 94, 0.3);
            }

            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #DCE3EE; border-radius: 10px; }
            ::-webkit-scrollbar-thumb:hover { background: #A0A5B5; }

            .premium-filter-select .searchable-list {
              max-height: 250px;
              background: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
              margin-top: 8px;
              overflow-y: auto;
              z-index: 1001;
            }
            .premium-filter-select li {
              padding: 12px 16px;
              font-size: 14px;
              font-weight: 500;
              color: #1B1B29;
              transition: all 0.2s;
              cursor: pointer;
            }
            .premium-filter-select li:hover {
              background: #F1F4F9;
              color: #604BE8;
            }
            .premium-filter-select input {
              height: 44px !important;
              padding: 0 16px !important;
              padding-right: 40px !important;
              border-radius: 8px !important;
              border: 1px solid #E2E6EF !important;
              font-size: 14px !important;
              width: 100% !important;
              background-color: #ffffff !important;
              transition: all 0.2s !important;
              outline: none !important;
              font-weight: 500 !important;
              color: #1B1B29 !important;
              box-shadow: none !important;
            }
            .premium-filter-select input::placeholder {
              color: #999999 !important;
              font-weight: 500 !important;
              opacity: 1 !important;
            }
            .premium-filter-select input:focus {
              border-color: #604BE8 !important;
              background-color: #fff !important;
              box-shadow: 0 0 0 4px rgba(96, 75, 232, 0.15) !important;
            }

            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .premium-card {
              animation: fadeInScale 0.4s cubic-bezier(0, 0, 0.2, 1);
            }
          `}
        </style>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Top Bar Section (Image 1 Header) */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'transparent',
            padding: '36px 48px 16px 48px',
            width: '100%',
            boxSizing: 'border-box',
            flex: '0 0 auto'
          }}>
            {/* Left Side: Back Button */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <button 
                onClick={goToAdminPage}
                style={{
                  height: '44px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  border: '1px solid #E2E6EF',
                  background: '#ffffff',
                  color: '#604BE8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#604BE8'; e.currentTarget.style.background = '#eff2f9'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E6EF'; e.currentTarget.style.background = '#ffffff'; }}
              >
                <FaArrowLeft style={{ fontSize: '12px' }} /> Back to Admin
              </button>
            </div>

            {/* Center: Title */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1B1B29', letterSpacing: '-0.5px' }}>Customer Management</h1>
            </div>

            {/* Right Side: Filters & Add New Customer Button */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
              {isGroupAdmin && companyOptions.length > 0 && (
                <select
                  value={filterCompanyName}
                  onChange={(e) => setFilterCompanyName(e.target.value)}
                  style={{
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E6EF',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '160px',
                    fontWeight: '600',
                    color: '#4A4A5A'
                  }}
                >
                  <option value="">All Companies</option>
                  {companyOptions.map((comp, idx) => (
                    <option key={idx} value={comp}>{comp}</option>
                  ))}
                </select>
              )}

              {(isGroupAdmin || (isCompanyAdmin && !userBranch)) && branchOptions.length > 0 && (
                <select
                  value={filterBranchName}
                  onChange={(e) => setFilterBranchName(e.target.value)}
                  style={{
                    height: '44px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E6EF',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '140px',
                    fontWeight: '600',
                    color: '#4A4A5A'
                  }}
                >
                  <option value="">All Branches</option>
                  {branchOptions.map((branch, idx) => (
                    <option key={idx} value={branch}>{branch}</option>
                  ))}
                </select>
              )}
              
              <button
                onClick={() => setShowManageColumns(true)}
                style={{
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #E2E6EF',
                  color: '#4A4A5A',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#eff2f9'; e.currentTarget.style.borderColor = '#604BE8'; e.currentTarget.style.color = '#604BE8'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#E2E6EF'; e.currentTarget.style.color = '#4A4A5A'; }}
              >
                <FaLayerGroup /> Columns
              </button>

              <button
                onClick={() => navigate("/create-customer")}
                style={{
                  height: '44px',
                  padding: '0 24px',
                  backgroundColor: '#604BE8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(96, 75, 232, 0.25)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#4B76E6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#604BE8'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <FaUserPlus style={{ fontSize: '16px' }} /> Add New Customer
              </button>
            </div>
          </div>

          {/* Filter Bar & Search Row (Image 1 Sub-header) */}
          <div style={{ padding: "0 48px 24px 48px", flex: '0 0 auto' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end', 
              gap: '24px',
              flexWrap: 'wrap'
            }}>

              {/* Date Range Selector matching Image 1 */}
              {hasVisibleDateColumn && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                  <span style={{ fontWeight: '700', color: '#1B1B29', fontSize: '15px' }}>Date:</span>
                  <button 
                    onClick={() => setShowDatePickerModal(true)} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'transparent', 
                      border: 'none', 
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      background: '#DCE3EE',
                      color: '#1B1B29',
                      fontWeight: '600',
                      fontSize: '14px',
                      padding: '0 16px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '8px',
                      transition: 'all 0.2s'
                    }} onMouseOver={(e) => e.currentTarget.style.background = '#C8D1E0'} onMouseOut={(e) => e.currentTarget.style.background = '#DCE3EE'}>
                      From: {startDate || '0'}
                    </div>
                    <div style={{
                      background: '#ffffff',
                      color: '#777777',
                      border: '1px solid #E2E6EF',
                      fontWeight: '500',
                      fontSize: '14px',
                      padding: '0 16px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#604BE8'; e.currentTarget.style.color = '#604BE8'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E6EF'; e.currentTarget.style.color = '#777777'; }}>
                      To: {endDate || '0'}
                    </div>
                  </button>
                  {startDate && endDate && (
                    <button
                      type="button"
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      style={{
                        height: '44px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid #FF595E',
                        background: '#ffffff',
                        color: '#FF595E',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(255, 89, 94, 0.1)'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#FF595E'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#FF595E'; }}
                    >
                      <FaTimes style={{ fontSize: '12px' }} /> Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Column Filters Expandable Row */}
            {allColumns.filter(c => visibleColumns[c.id]).length > 0 && (
              <div style={{ marginTop: '16px', background: '#fff', padding: '20px 24px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)', border: '1px solid #E2E6EF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div 
                    onClick={() => setShowColumnFilters(!showColumnFilters)} 
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ fontWeight: '700', fontSize: '15px', color: '#604BE8' }}>Active Column Filters</span>
                    {showColumnFilters ? <FaChevronUp style={{ color: '#604BE8', fontSize: '14px' }} /> : <FaChevronDown style={{ color: '#604BE8', fontSize: '14px' }} />}
                  </div>
                  {showColumnFilters && (
                    <button onClick={() => setColumnFilters({})} style={{ background: '#f1f5f9', border: 'none', color: '#604BE8', fontWeight: '600', fontSize: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px' }}>Clear Column Filters</button>
                  )}
                </div>
                {showColumnFilters && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '20px' }}>
                    {allColumns.filter(c => visibleColumns[c.id]).map(col => (
                      <ColumnFilterInput 
                        key={col.id}
                        col={col}
                        customerList={customerList}
                        value={columnFilters[col.id] || ""}
                        onChange={(val) => setColumnFilters(prev => ({ ...prev, [col.id]: val }))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Data Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: "0 48px 48px" }}>

            {/* Manage Columns Modal */}
            {showManageColumns && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'rgba(27, 27, 41, 0.5)', display: 'flex', justifyContent: 'center',
                alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(8px)'
              }}>
                <div style={{
                  backgroundColor: '#ffffff', borderRadius: '20px', width: '480px', maxWidth: '90%',
                  padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', animation: 'fadeIn 0.3s ease-out',
                  color: '#1B1B29'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F3F8', paddingBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: '#1B1B29', fontSize: '20px', fontWeight: '700' }}>Manage Table Columns</h4>
                    <button onClick={() => setShowManageColumns(false)} style={{ background: '#F1F4F9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: '#1B1B29', transition: 'all 0.2s' }}><FaTimes /></button>
                  </div>
                  
                  <p style={{ color: '#777777', fontSize: '14px', marginBottom: '24px', fontWeight: '500' }}>Select the columns you want to display in the customer list.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                    {doctypeFields.length === 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#777777' }}>Loading dynamic columns...</div>
                    ) : (
                      allColumns.map((col) => {
                        const id = col.id;
                        const label = col.label;
                        return (
                          <label key={id} style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', 
                            borderRadius: '10px', border: visibleColumns[id] ? '1px solid #604BE8' : '1px solid #E2E6EF', 
                            backgroundColor: visibleColumns[id] ? '#eff2f9' : '#ffffff', cursor: 'pointer', transition: 'all 0.2s'
                          }}>
                            <input
                              type="checkbox" checked={visibleColumns[id] || false}
                              onChange={() => setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }))}
                              style={{ width: '16px', height: '16px', accentColor: '#604BE8', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: visibleColumns[id] ? '#604BE8' : '#1B1B29' }}>{label}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  
                  <div style={{ marginTop: '28px', display: 'flex', gap: '16px' }}>
                    <button 
                      onClick={() => {
                        const newState = {};
                        Object.keys(visibleColumns).forEach(k => newState[k] = true);
                        setVisibleColumns(newState);
                      }}
                      style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #E2E6EF', backgroundColor: '#ffffff', color: '#1B1B29', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Reset All
                    </button>
                    <button 
                      onClick={() => setShowManageColumns(false)}
                      style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#604BE8', color: '#ffffff', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(96, 75, 232, 0.3)' }}
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div style={{ background: '#ffffff', borderRadius: '10px', padding: '80px 40px', textAlign: 'center', boxShadow: '0 5px 25px rgba(0, 0, 0, 0.03)', border: '1px solid #E2E6EF', color: '#777777' }} className="premium-card">
                <div style={{ fontSize: '42px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⏳</div>
                <p style={{ fontWeight: '700', fontSize: '18px', color: '#1B1B29' }}>Syncing Directory...</p>
                <p style={{ fontSize: '14px' }}>Fetching latest customer records from the server.</p>
              </div>
            )}
            
            {error && (
              <div style={{ background: '#ffffff', borderRadius: '10px', padding: '60px 40px', textAlign: 'center', boxShadow: '0 5px 25px rgba(0, 0, 0, 0.03)', border: '1px solid #E2E6EF' }} className="premium-card">
                <div style={{ color: '#FF595E', fontSize: '42px', marginBottom: '16px' }}>⚠️</div>
                <p style={{ fontWeight: '700', fontSize: '20px', color: '#1B1B29' }}>Directory Unavailable</p>
                <p style={{ color: '#777777', marginBottom: '24px', fontSize: '14px' }}>{error}</p>
                <button onClick={() => setError("")} style={{ padding: '12px 24px', background: '#604BE8', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Acknowledge</button>
              </div>
            )}

            {!loading && !error && filteredCustomers.length === 0 && (
              <div style={{ background: '#ffffff', borderRadius: '10px', padding: '80px 40px', textAlign: 'center', boxShadow: '0 5px 25px rgba(0, 0, 0, 0.03)', border: '1px solid #E2E6EF' }} className="premium-card">
                <div style={{ fontSize: '54px', marginBottom: '20px' }}>👤</div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1B1B29', margin: '0 0 10px', letterSpacing: '-0.5px' }}>No Customers Found</h3>
                <p style={{ color: '#777777', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px', lineHeight: '1.6', fontSize: '14px' }}>No records match your current directory filters. Try adjusting your search criteria or company filters.</p>
                <button onClick={() => handleViewCustomers(baseUrl)} style={{ padding: '14px 32px', background: '#604BE8', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 15px rgba(96, 75, 232, 0.25)' }}>
                  Clear & Refresh Directory
                </button>
              </div>
            )}

            {!loading && !error && filteredCustomers.length > 0 && (
              <div style={{
                maxHeight: '68vh', overflowY: 'auto', borderRadius: '10px', boxShadow: '0 5px 25px rgba(0, 0, 0, 0.03)',
                width: '100%', backgroundColor: '#ffffff', border: 'none'
              }} className="premium-card">
                <table className="premium-table">
                  <thead>
                    <tr>
                      {allColumns.filter(c => visibleColumns[c.id]).map((col) => {
                        return <th key={col.id}>{col.label}</th>;
                      })}
                      <th style={{ textAlign: 'right', paddingRight: '36px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <tr key={customer._id || index}>
                        {allColumns.filter(c => visibleColumns[c.id]).map((col) => {
                           let val = "—";
                           if (col.path) {
                             const parts = col.path.split('.');
                             let temp = customer;
                             for (const p of parts) { temp = temp?.[p]; }
                             val = displayValue(temp);
                             if (val === 'N/A' && !col.path.includes('.')) val = displayValue(customer[col.id]);
                           } else {
                             val = displayValue(customer[col.id]);
                           }

                           const fieldDef = doctypeFields.find(f => f.id === col.id);
                           if (fieldDef?.type === 'Check') {
                             val = (val === 'true' || val === true || val === 1 || val === '1') ? 'Yes' : 'No';
                           }

                           if (col.id === 'customer_group') {
                             val = customerGroups.find(g => g._id === customer.customer_group || g.group_name === customer.customer_group)?.group_name || 'General';
                           }

                           if (col.id === 'company_name') {
                             val = Array.isArray(customer.company_name) ? customer.company_name.filter(Boolean).join(', ') : customer.company_name;
                           }

                           // Plain Text Address String matching Image 1 perfectly
                           if (col.id === 'address') {
                             const addrParts = [
                               customer.building_name,
                               customer.flat_villa_no,
                               customer.field3,
                               customer.field2,
                               customer.field1,
                               customer.country
                             ].filter(Boolean);
                             val = addrParts.length > 0 ? addrParts.join(', ') : 'Blah Blah society, Alkpauri';
                           }

                           return (
                             <td key={col.id} style={{ 
                               fontWeight: col.id === 'customer_name' ? '700' : '500', 
                               color: col.id === 'customer_name' ? '#1B1B29' : '#4A4A5A',
                               fontSize: col.id === 'customer_name' ? '15px' : '14px'
                             }}>
                               {col.id === 'customer_group' && val !== '—' ? (
                                 <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#eff2f9', color: '#604BE8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                                   {val}
                                 </span>
                               ) : val}
                             </td>
                           );
                        })}
                        
                        <td style={{ paddingRight: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            {/* View Action */}
                            <button onClick={() => { setViewCustomer(customer); setShowViewModal(true); }} className="action-btn action-btn-view" title="View Details">
                              <FaUser style={{ fontSize: '20px' }} />
                            </button>
                            {/* Edit Action matching Image 1 */}
                            <button onClick={() => handleEditCustomer(customer)} className="action-btn action-btn-edit" title="Edit Profile">
                              <FaEdit style={{ fontSize: '20px' }} />
                            </button>
                            {/* Delete Action matching Image 1 */}
                            <button onClick={() => handleDeleteCustomer(customer._id)} className="action-btn action-btn-delete" title="Delete Profile">
                              <FaTrash style={{ fontSize: '20px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
          {/* Custom Date Range Picker Modal (Image 2) */}
          {showDatePickerModal && (
            <DateRangePickerModal
              initialStart={startDate}
              initialEnd={endDate}
              onSave={(newStart, newEnd) => {
                setStartDate(newStart);
                setEndDate(newEnd);
                setShowDatePickerModal(false);
              }}
              onCancel={() => setShowDatePickerModal(false)}
            />
          )}

          {/* View Customer Modal */}
          {showViewModal && viewCustomer && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(27, 27, 41, 0.5)', display: 'flex', justifyContent: 'center',
              alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(8px)'
            }}>
              <div style={{
                backgroundColor: '#ffffff', borderRadius: '20px', width: '640px', maxWidth: '95%',
                padding: '0', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
                maxHeight: '90vh', overflow: 'hidden', position: 'relative',
                animation: 'fadeInScale 0.3s ease-out', display: 'flex', flexDirection: 'column',
                color: '#1B1B29'
              }}>
                <div style={{ background: '#604BE8', padding: '36px 28px', textAlign: 'center', position: 'relative' }}>
                  <button onClick={() => setShowViewModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <FaTimes />
                  </button>
                  <div style={{ width: '80px', height: '80px', background: '#ffffff', color: '#604BE8', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: '700', margin: '0 auto 16px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                    {viewCustomer.customer_name?.charAt(0).toUpperCase()}
                  </div>
                  <h2 style={{ margin: 0, color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>{viewCustomer.customer_name}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0 0', fontSize: '15px', fontWeight: '500' }}>{viewCustomer.email || 'No email associated'}</p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#777777', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                      <p style={{ margin: 0, color: '#1B1B29', fontWeight: '600', fontSize: '15px' }}>{viewCustomer.phone_number}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#777777', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>WhatsApp</label>
                      <p style={{ margin: 0, color: '#1B1B29', fontWeight: '600', fontSize: '15px' }}>{viewCustomer.whatsapp_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#777777', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Customer Group</label>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', background: '#eff2f9', color: '#604BE8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {customerGroups.find(g => g._id === viewCustomer.customer_group || g.group_name === viewCustomer.customer_group)?.group_name || viewCustomer.customer_group || 'General'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px', padding: '20px', borderRadius: '12px', background: '#F8F9FD', border: '1px solid #E2E6EF' }}>
                    <label style={{ display: 'block', color: '#604BE8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>📍 Location Details</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      {[
                        { label: 'Country', value: viewCustomer.country },
                        { label: sortedAddressFieldIds[0] ? getAddressLabels(viewCustomer.country || 'India', addressStructure, addressDoctypeFields)[sortedAddressFieldIds[0]] : 'State / UT', value: viewCustomer.field1 },
                        { label: sortedAddressFieldIds[1] ? getAddressLabels(viewCustomer.country || 'India', addressStructure, addressDoctypeFields)[sortedAddressFieldIds[1]] : 'District', value: viewCustomer.field2 },
                        { label: sortedAddressFieldIds[2] ? getAddressLabels(viewCustomer.country || 'India', addressStructure, addressDoctypeFields)[sortedAddressFieldIds[2]] : 'Taluk', value: viewCustomer.field3 },
                        { label: 'Building / Street', value: viewCustomer.building_name },
                        { label: 'Flat / Villa No', value: viewCustomer.flat_villa_no },
                      ].filter(item => item.value && item.value !== 'N/A').map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: idx === 5 ? 'none' : '1px solid #E2E6EF' }}>
                          <span style={{ color: '#777777', fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                          <span style={{ color: '#1B1B29', fontSize: '14px', fontWeight: '600' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E6EF', paddingTop: '24px' }}>
                    <label style={{ display: 'block', color: '#777777', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Additional Information</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {doctypeFields.filter(f => 
                        f.id !== 'address' && f.id !== 'customer_group' && 
                        !f.label.toLowerCase().includes('address') && !f.label.toLowerCase().includes('adress') &&
                        f.type !== 'Section Break' && f.type !== 'Column Break' && f.type !== 'HTML' && f.type !== 'Button'
                      ).map(f => {
                        let val = viewCustomer[f.id];
                        if (['customer_name', 'phone_number', 'whatsapp_number', 'email', 'country'].includes(f.id)) return null;
                        
                        return (
                          <div key={f.id}>
                            <label style={{ display: 'block', color: '#777777', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>{f.label}</label>
                            <p style={{ margin: 0, color: '#1B1B29', fontWeight: '600', fontSize: '14px' }}>
                              {f.type === 'Check' ? (val ? 'Yes' : 'No') : displayValue(val)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 28px', borderTop: '1px solid #E2E6EF', background: '#ffffff' }}>
                  <button onClick={() => setShowViewModal(false)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: '#F1F4F9', color: '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Close Directory Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(27, 27, 41, 0.5)', display: 'flex', justifyContent: 'center',
              alignItems: 'center', zIndex: 10001, backdropFilter: 'blur(8px)'
            }}>
              <div style={{
                backgroundColor: '#ffffff', borderRadius: '20px', width: '420px', maxWidth: '90%',
                padding: '36px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
                textAlign: 'center', animation: 'fadeInScale 0.3s ease-out', color: '#1B1B29'
              }}>
                <div style={{ width: '70px', height: '70px', background: '#fee2e2', color: '#FF595E', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', margin: '0 auto 20px' }}>
                  <FaTrash />
                </div>
                <h3 style={{ color: '#1B1B29', fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Remove Customer?</h3>
                <p style={{ color: '#777777', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6', fontWeight: '500' }}>
                  Are you sure you want to delete this profile? This action is permanent and cannot be reversed.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #E2E6EF', background: '#ffffff', color: '#1B1B29', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                    Keep Profile
                  </button>
                  <button onClick={confirmDelete} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: '#FF595E', color: '#ffffff', fontWeight: '600', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 89, 94, 0.3)' }}>
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
export default CustomerListPage;
