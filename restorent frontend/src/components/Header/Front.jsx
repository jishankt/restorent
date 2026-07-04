import React, { useEffect, useState, useRef, useContext, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import CurrencySymbol, { resolveCurrencyCode } from '../CurrencySymbol';
import { useSelector } from "react-redux"
import FoodDetails from "./FoodDetails"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { Card, Button } from 'react-bootstrap';
import {
  Home,
  Truck,
  Armchair,
  ChefHat,
  CircleDollarSign,
  BarChart3,
  LogOut,
  Palette,
  LayoutGrid,
  Menu,
  Search,
  Power,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Check,
  FileText,
  ClipboardList,
  RotateCcw,
  ShoppingCart,
  IceCream,
  Flame,
  Bell,
  ShoppingBag,
  Archive,
  Keyboard,
  Edit3,
  Percent,
  Trash2
} from "lucide-react";
import { UserContext } from "../../Context/UserContext";
import "./front.css"
const SearchableSelect = ({ options = [], value = '', onChange, placeholder, allowCreateNew = false, onAddNewValue = null, createNewLabel = null, onCreateRequest = null }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);
  const selectRef = useRef(null); // Ref for the entire select container

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) setShowList(true);
    if (allowCreateNew && !onAddNewValue && !onCreateRequest) {
      if (onChange) onChange(newSearch);
    }
  };

  const handleSelectOption = (option, e) => {
    if (e) e.stopPropagation();
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
  const handleBlur = (e) => {
    if (selectRef.current && !selectRef.current.contains(e.relatedTarget)) {
      // Delay listing hide to allow click
      setTimeout(() => setShowList(false), 200);
    }
  };

  return (
    <div className="searchable-select" ref={selectRef}>
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        placeholder={placeholder}
      />
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
                      e.preventDefault(); // crucial for blur prevention
                      e.stopPropagation(); // Stop bubbling to prevent parent "click outside" listeners
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
                  e.stopPropagation(); // Stop bubbling to prevent parent "click outside" listeners
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
const getAddressLabels = (country, addressStructure) => {
  // Use local hierarchy if structure is empty or country missing
  const structure = (addressStructure?.countries && Object.keys(addressStructure.countries).length > 0)
    ? addressStructure
    : { countries: countryAddressHierarchy };

  if (!country || !structure.countries[country]) {
    return ["Region", "City", "Area", "Building"];
  }
  const countryData = structure.countries[country];
  return [
    countryData.field1?.label || "Region",
    countryData.field2?.label || "City",
    countryData.field3?.label || "Area",
    countryData.field4?.label || "Building"
  ];
};

// Helper: Get options (dropdown values) for a field
const getOptionsForField = (field, country, addressStructure, linkedValues, parentValue = null) => {
  // Use local hierarchy if structure is empty or country missing
  const structure = (addressStructure?.countries && Object.keys(addressStructure.countries).length > 0)
    ? addressStructure
    : { countries: countryAddressHierarchy };

  if (!country || !structure) return [];

  const { countries } = structure;

  // Level 1: Dependent only on Country
  if (field === 'field1') {
    return countries?.[country]?.field1?.values || [];
  }

  // Level 2: Dependent on Field 1 (parentValue)
  if (field === 'field2') {
    // Get GLOBAL options from the structure
    const globalOpts = countries?.[country]?.field2?.values || [];

    // Get LINKED options specific to the parent
    let linkedOpts = [];
    if (parentValue && linkedValues?.[country]?.[parentValue]) {
      linkedOpts = linkedValues[country][parentValue].field2 || [];
    }

    // Merge and Deduplicate
    const allOpts = new Set([...linkedOpts, ...globalOpts]);
    return Array.from(allOpts).sort();
  }

  // Level 3: Dependent on Field 2 (parentValue)
  if (field === 'field3') {
    // Get GLOBAL options from the structure
    const globalOpts = countries?.[country]?.field3?.values || [];

    // Get LINKED options specific to the parent
    let linkedOpts = [];
    if (parentValue && linkedValues?.[country]?.[parentValue]) {
      linkedOpts = linkedValues[country][parentValue].field3 || [];
    }

    // Merge and Deduplicate
    const allOpts = new Set([...linkedOpts, ...globalOpts]);
    return Array.from(allOpts).sort();
  }

  return [];
};
function FrontPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const {
    tableNumber: passedTableNumber = "N/A",
    chairsCount: initialChairsCount = 0,
    chairsBooked: initialChairsBooked = [],
    existingOrder,
    cartItems: initialCartItems,
    phoneNumber: initialPhoneNumber,
    customerName: initialCustomerName,
    deliveryAddress: initialDeliveryAddress,
    whatsappNumber: initialInitialWhatsappNumber,
    email: initialEmail,
    deliveryPersonId,
    deliveryPersonName,
    floor: initialFloor,
  } = state || {}

  const [menuItems, setMenuItems] = useState([])
  const [comboList, setComboList] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All Items")
  const [categories, setCategories] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)

  // Initialize states with values from location.state if available
  // Initialize states with values from location.state if available, then from localStorage, fallback to Dine In
  const [orderType, setOrderType] = useState(() => {
    return state?.orderType || existingOrder?.orderType || localStorage.getItem('selectedOrderType') || "Dine In";
  });

  // Get user from Redux or fallback to localStorage (memoized to prevent re-renders)
  const reduxUser = useSelector((state) => state.user.user);
  const user = useMemo(() => {
    if (reduxUser) return reduxUser;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : { email: "Guest" };
    } catch (e) {
      return { email: "Guest" };
    }
  }, [reduxUser]);

  const [cartItems, setCartItems] = useState(initialCartItems || existingOrder?.cartItems || [])
  const [billCartItems, setBillCartItems] = useState(initialCartItems || existingOrder?.cartItems || [])
  const [isPhoneNumberSet, setIsPhoneNumberSet] = useState(!!(initialPhoneNumber || existingOrder?.phoneNumber))
  const [savedOrders, setSavedOrders] = useState([])

  // Parse initial ISD code for phone
  const getInitialPhoneCode = () => {
    const fullPhone = initialPhoneNumber || existingOrder?.phoneNumber || ""
    if (!fullPhone) return "+91"
    const isdCodes = ["+91", "+1", "+44", "+971", "+61"] // Local copy for initialization
    return isdCodes.find(code => fullPhone.startsWith(code)) || "+91"
  }

  const [selectedISDCode, setSelectedISDCode] = useState(getInitialPhoneCode())
  const [phoneNumber, setPhoneNumber] = useState((initialPhoneNumber || existingOrder?.phoneNumber || "").replace(getInitialPhoneCode(), ""))

  const [customers, setCustomers] = useState([])
  const [customerName, setCustomerName] = useState(initialCustomerName || existingOrder?.customerName || "")
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [showCustomerSection, setShowCustomerSection] = useState(false)
  const { baseUrl, configLoading, getHeaders } = useContext(UserContext);
  const [companyTaxType, setCompanyTaxType] = useState('GST');
  const [companyTaxRate, setCompanyTaxRate] = useState(18);
  const [paymentSettings, setPaymentSettings] = useState({
    takeaway: { pay: true, payLater: true },
    dinein: { pay: true, payLater: true },
    onlinedelivery: { pay: true, payLater: true }
  });

  const [deliveryAddress, setDeliveryAddress] = useState({
    building_name: initialDeliveryAddress?.building_name || existingOrder?.deliveryAddress?.building_name || "",
    flat_villa_no: initialDeliveryAddress?.flat_villa_no || existingOrder?.deliveryAddress?.flat_villa_no || "",
    country: initialDeliveryAddress?.country || existingOrder?.deliveryAddress?.country || "",
    field1: initialDeliveryAddress?.field1 || existingOrder?.deliveryAddress?.field1 || "",
    field2: initialDeliveryAddress?.field2 || existingOrder?.deliveryAddress?.field2 || "",
    field3: initialDeliveryAddress?.field3 || existingOrder?.deliveryAddress?.field3 || "",
  })

  // WhatsApp initialization helper
  const getInitialWhatsappData = () => {
    const fullWhatsapp = initialInitialWhatsappNumber || existingOrder?.whatsappNumber || ""
    const isdCodes = ["+91", "+1", "+44", "+971", "+61"]
    const code = isdCodes.find(c => fullWhatsapp.startsWith(c)) || "+91"
    return { code, number: fullWhatsapp.replace(code, "") }
  }
  const whatsappData = getInitialWhatsappData()

  const [whatsappNumber, setWhatsappNumber] = useState(whatsappData.number)
  const [whatsappISDCode, setWhatsappISDCode] = useState(whatsappData.code)
  const [showWhatsappISDCodeDropdown, setShowWhatsappISDCodeDropdown] = useState(false)
  const [email, setEmail] = useState(initialEmail || existingOrder?.email || "")
  const [orderId, setOrderId] = useState(existingOrder?.orderId || null)
  const [orderNo, setOrderNo] = useState(existingOrder?.orderNo || null)
  const [bookedTables, setBookedTables] = useState([])
  const [bookedChairs, setBookedChairs] = useState({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showUnservedPopup, setShowUnservedPopup] = useState(false)
  const [unservedItems, setUnservedItems] = useState([])
  const [showISDCodeDropdown, setShowISDCodeDropdown] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [warningType, setWarningType] = useState("warning")
  const [pendingAction, setPendingAction] = useState(null)
  const [focusedInputKey, setFocusedInputKey] = useState(null)
  const [tempQuantity, setTempQuantity] = useState(null)
  const [selectedCartItem, setSelectedCartItem] = useState(null)
  const [activeVariantItem, setActiveVariantItem] = useState(null);
  const [floor, setFloor] = useState(initialFloor || existingOrder?.floor || "") // INITIALIZED FROM STATE
  const [tableNumber, setTableNumber] = useState(passedTableNumber || existingOrder?.tableNumber || "N/A") // INITIALIZED FROM STATE
  const [activeChairsBooked, setActiveChairsBooked] = useState(initialChairsBooked || []) // INITIALIZED FROM STATE
  const [totalChairs, setTotalChairs] = useState(0)
  const [currentDate, setCurrentDate] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showPOSGrid, setShowPOSGrid] = useState(() => {
    return localStorage.getItem("posViewMode") === "true";
  });
  const [posPage, setPosPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [posDesign, setPosDesign] = useState(() => {
    return localStorage.getItem("posDesign") || "design1";
  });
  const [showDesignSelector, setShowDesignSelector] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("selectedTheme") || "light";
  });
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarSwappedDesign2, setIsSidebarSwappedDesign2] = useState(() => {
    return localStorage.getItem("isSidebarSwappedDesign2") === "true";
  });
  const [showOrderTypeRequiredModal, setShowOrderTypeRequiredModal] = useState(false); // NEW: State for order type required popup
  const [disabledPages, setDisabledPages] = useState([]);
  const [workflowSettings, setWorkflowSettings] = useState({}); // NEW: Hierarchical workflow settings
  const [isKeyboardShortcutsEnabled, setIsKeyboardShortcutsEnabled] = useState(() => localStorage.getItem("isKeyboardShortcutsEnabled") === "true");
  const [showKeyboardModal, setShowKeyboardModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("isKeyboardShortcutsEnabled", isKeyboardShortcutsEnabled);
  }, [isKeyboardShortcutsEnabled]);

  useEffect(() => {
    const handleChatbotSetCustomer = (e) => {
      const data = e.detail;
      if (data && data.name) {
        setCustomerName(data.name);
        if (data.phone) {
          setPhoneNumber(data.phone.replace(/^\+91/, '').replace(/^\+/, ''));
        }
      }
    };
    window.addEventListener('chatbot_set_customer', handleChatbotSetCustomer);
    return () => window.removeEventListener('chatbot_set_customer', handleChatbotSetCustomer);
  }, []);

  // Broadcast cart items to the global ChatbotModal whenever they change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pos_cart_updated', { detail: cartItems }));
  }, [cartItems]);

  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const phoneNumberRef = useRef(null)
  const customerSectionRef = useRef(null)
  // NEW: Ref for scrollable category container
  const categoryContainerRef = useRef(null);

  const handleScroll = (direction) => {
    const length = categories.length;
    if (length === 0) return;

    // The targetCenterIndex is where the active item currently sits
    let targetCenterIndex = 3;
    if (length < 7) targetCenterIndex = Math.floor(length / 2);

    if (direction === "left") {
      // Navigate to the category immediately to the left of center
      const prevIndex = (targetCenterIndex - 1 + length) % length;
      handleFilter(categories[prevIndex]);
    } else {
      // Navigate to the category immediately to the right of center
      const nextIndex = (targetCenterIndex + 1) % length;
      handleFilter(categories[nextIndex]);
    }
  };

  const toggleSidebarSwapDesign2 = () => {
    const newVal = !isSidebarSwappedDesign2;
    setIsSidebarSwappedDesign2(newVal);
    localStorage.setItem("isSidebarSwappedDesign2", newVal.toString());
  };

  // REMOVED old pagination state (itemsPerCategoryPage) as we strictly utilize scroll now
  const [itemsPerCategoryPage, setItemsPerCategoryPage] = useState(9); // Kept to avoid breaking effects if dependencies exist, but unused in render

  useEffect(() => {
    const handleResize = () => {
      // Adjusted for safer fitting with long category names
      if (window.innerWidth < 576) {
        setItemsPerCategoryPage(2);
      } else if (window.innerWidth < 768) {
        setItemsPerCategoryPage(3);
      } else if (window.innerWidth < 1200) {
        setItemsPerCategoryPage(5); // Tablet/Small Laptop
      } else {
        setItemsPerCategoryPage(7); // Large Screen
      }
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const themes = {
    light: {
      name: "Light",
      icon: "☀️",
    },
    dark: {
      name: "Dark",
      icon: "🌙",
    },
    nature: {
      name: "Nature",
      icon: "🌿",
    },
    sunset: {
      name: "Sunset",
      icon: "🌅",
    },
    ocean: {
      name: "Ocean",
      icon: "🌊",
    },
  }
  const [customerGroups, setCustomerGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [doctypeFields, setDoctypeFields] = useState([])
  const [dynamicValues, setDynamicValues] = useState({})
  // Address Structure State
  const defaultStructure = {
    countries: countryAddressHierarchy,
  };
  const [addressStructure, setAddressStructure] = useState(defaultStructure);
  const [linkedValues, setLinkedValues] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalField, setModalField] = useState('');
  const [modalContent, setModalContent] = useState(''); // using modalValue in logic, let's stick to modalValue name to match
  const [modalValue, setModalValue] = useState('');
  const [modalCountry, setModalCountry] = useState(null);
  const [modalParentValue, setModalParentValue] = useState(null);

  const fetchDoctype = async (url) => {
    try {
      const apiPath = url ? `${url}/api/doctypes/Customer` : '/api/doctypes/Customer';
      const response = await axios.get(apiPath, { headers: getHeaders() });
      setDoctypeFields(response.data.fields || []);
    } catch (error) {
      console.error("Error fetching Customer doctype:", error);
    }
  };

  const fetchAddressStructure = async (currentBaseUrl) => {
    try {
      const apiUrl = currentBaseUrl ? `${currentBaseUrl}/api/address-structures` : '/api/address-structures';
      const response = await axios.get(apiUrl, { headers: getHeaders() });
      const data = response.data;

      // Merge backend structure with local hierarchy
      const backendCountries = data.structure?.countries || {};
      const mergedCountries = { ...countryAddressHierarchy, ...backendCountries };

      setAddressStructure({ countries: mergedCountries });
      setLinkedValues(data.linkedValues || {});
    } catch (error) {
      console.error("Error fetching address structure:", error);
      setAddressStructure({ countries: countryAddressHierarchy });
    }
  };

  useEffect(() => {
    if (!configLoading) {
      fetchAddressStructure(baseUrl);
      fetchDoctype(baseUrl);
    }
  }, [baseUrl, configLoading]);

  const handleAddNewAddressValue = async (field, newValue, associatedCountry) => {
    try {
      const parentVal = field === 'field2' ? deliveryAddress.field1 : (field === 'field3' ? deliveryAddress.field2 : null);

      // If adding a country, the field is 'country' and value is the new country name.
      // The API expects: country, field, value, parentValue
      // For new country: { country: "New Country", field: "country", value: "New Country", parentValue: null }
      // Wait, if I create a country, I need to pass it as 'country' param?
      const payload = {
        country: associatedCountry || (field === 'country' ? newValue : null),
        field,
        value: newValue,
        parentValue: parentVal
      };

      await axios.post(`${baseUrl}/api/add-address-value`, payload, { headers: getHeaders() });
      // Refresh structure
      await fetchAddressStructure(baseUrl);
      return true;
    } catch (error) {
      console.error('Error adding new address value:', error);
      setWarningMessage("Failed to add new value. Please try again.");
      setWarningType("warning");
      return false;
    }
  };

  const handleOpenAddModal = (field, value, country, parentValue) => {
    setModalField(field);
    setModalValue(value);
    setModalCountry(country);
    setModalParentValue(parentValue);
    setShowAddModal(true);
  };

  const handleSaveModal = async () => {
    if (!modalValue.trim()) return;
    const success = await handleAddNewAddressValue(modalField, modalValue, modalCountry);
    if (success) {
      if (modalField === 'country') {
        handleDeliveryAddressChange('country', modalValue);
      } else if (modalField === 'field1') {
        handleDeliveryAddressChange('field1', modalValue);
      } else if (modalField === 'field2') {
        handleDeliveryAddressChange('field2', modalValue);
      } else if (modalField === 'field3') {
        handleDeliveryAddressChange('field3', modalValue);
      }
      setShowAddModal(false);
      setModalValue('');
    }
  };


  // NEW: Handle Order Type Change from Header Buttons
  const handleOrderTypeChange = (type) => {
    localStorage.setItem('selectedOrderType', type);
    localStorage.setItem('isOrderTypeSelected', 'true'); // NEW: Set flag when changed from header
    if (type === "Dine In") {
      navigate('/table', { state: { orderType: 'Dine In' } });
      return;
    }
    setOrderType(type);
    setOrderNo(generate_order_number(type));
    // Optional: Clear cart or warn if needed, but for now just switch context
    console.log("Switched order type to:", type);
  };
  // FIXED: Define generate_order_number function with robust prefix handling matching backend real naming series
  const generate_order_number = (orderType) => {
    // Retrieve active company and branch from localStorage or user object
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const activeComp = localStorage.getItem('active_company') || storedUser.company || storedUser.company_name || "Company";
    const activeBranch = localStorage.getItem('active_branch') || storedUser.branch || storedUser.branch_name || "Branch";

    // Format company prefix (first 2 alphanumeric chars uppercase)
    const compStr = activeComp.replace(/[^a-zA-Z0-9]/g, '');
    const compPrefix = compStr.length >= 2 ? compStr.slice(0, 2).toUpperCase() : "CO";

    // Format branch prefix (first 2 alphanumeric chars uppercase)
    // Removed the hardcoded 'All Branches' -> 'BR' to match backend which processes it to 'AL'
    const branchStr = activeBranch ? activeBranch.replace(/[^a-zA-Z0-9]/g, '') : "";
    const branchPrefix = branchStr.length >= 2 ? branchStr.slice(0, 2).toUpperCase() : "BR";

    // Robust type prefix check (matching backend app1.py exactly)
    const normalizedType = String(orderType).trim().toLowerCase();
    let typePrefix = "OND";
    if (normalizedType === "dine in" || normalizedType === "dine-in") {
      typePrefix = "DIN";
    } else if (normalizedType === "takeaway" || normalizedType === "take away") {
      typePrefix = "TAK";
    } else if (normalizedType === "online delivery" || normalizedType === "delivery") {
      typePrefix = "OND";
    }

    // Generate a 4-digit mock counter (like 0001, 0002) instead of a random 6-digit timestamp
    const randomCounter = Math.floor(1000 + Math.random() * 9000).toString().slice(-4);

    return `${compPrefix}-${branchPrefix}-${typePrefix}-${randomCounter}`;
  };

  // NEW: Helper function to reset all order-specific state
  const resetOrderState = () => {
    setOrderId(null);
    setOrderNo(null);
    setCartItems([]);
    setBillCartItems([]);
    setCustomerName("");
    setPhoneNumber("");
    setEmail("");
    setDeliveryAddress({ building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" });
    setIsPhoneNumberSet(false);
    setActiveChairsBooked([]);
    setStartIndex(0);
    // If not Dine In, reset table/floor to defaults
    if (localStorage.getItem('selectedOrderType') !== "Dine In") {
      setTableNumber("N/A");
      setFloor("N/A");
    }
  };

  const strikethroughStyle = { textDecoration: "line-through", color: "#888", marginRight: "10px" };
  const offerPriceStyle = { color: "#ff4500", fontWeight: "bold" };
  const posterStyle = { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "12px", padding: "12px", textAlign: "center", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)", color: "#ffffff", position: "relative", cursor: "pointer", transition: "all 0.3s ease", border: "2px solid rgba(255, 255, 255, 0.3)", height: "auto" };
  const logoStyle = { position: "absolute", top: "8px", left: "8px", fontSize: "18px", fontWeight: "bold", color: "#ffffff", textShadow: "0 1px 3px rgba(0,0,0,0.3)" };
  const offerNameStyle = { fontSize: "22px", marginBottom: "8px", textShadow: "1px 1px 3px rgba(0,0,0,0.2)", fontFamily: 'ui-sans-serif', color: "#ffffff", fontWeight: "600" };
  const offerPeriodStyle = { fontSize: "13px", color: "#ffffff", marginBottom: "8px", fontWeight: "bold", backgroundColor: "rgba(0, 0, 0, 0.2)", padding: "4px 8px", borderRadius: "4px", display: "inline-block" };
  const uploadedImagesStyle = { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px", justifyContent: "center" };
  const uploadedImageThumbStyle = { width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "2px solid rgba(255, 255, 255, 0.5)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" };
  const itemsListStyle = { backgroundColor: "rgba(0, 0, 0, 0.2)", border: "1px solid rgba(255, 255, 255, 0.3)", borderRadius: "8px", padding: "10px", marginBottom: "8px", textAlign: "left" };
  const itemsListItemStyle = { display: "flex", alignItems: "center", fontSize: "14px", color: "#ffffff", fontWeight: "bold", marginBottom: "6px", listStyleType: "none", paddingLeft: "0" };
  const itemImageStyle = { width: "30px", height: "30px", objectFit: "cover", borderRadius: "4px", marginRight: "8px", border: "1px solid rgba(255, 255, 255, 0.5)" };
  const totalPriceStyle = { fontSize: "18px", margin: "12px 0", backgroundColor: "rgba(0, 0, 0, 0.25)", padding: "8px", borderRadius: "8px", color: "#fdd835", fontWeight: "bold", textAlign: "center" };
  const limitedOfferStyle = { fontSize: "13px", color: "#fdd835", marginTop: "8px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center" };

  const getCurrencySymbol = (currCode = null) => {
    const code = (currCode || resolveCurrencyCode(null, localStorage.getItem('active_company'), localStorage.getItem('active_branch')))?.toUpperCase();
    return <CurrencySymbol currencyCode={code} size={14} />;
  };
  const formatPrice = (price) => {
    const symbol = getCurrencySymbol();
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>{symbol}{(Number(price) || 0).toFixed(2)}</span>;
  };
  // NEW: Helper to get effective tax rate (use company tax if item rate is 0 but applicable)
  const getEffectiveTaxRate = (taxApplicable, taxRate, isAddon = false, isCombo = false) => {
    if (!taxApplicable) return 0;
    if (taxRate > 0) return taxRate;
    // If applicable but rate 0, fallback to company tax rate
    return companyTaxRate;
  };
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme)
    setShowThemeSelector(false)
    localStorage.setItem("selectedTheme", theme)
    document.body.className = `theme-${theme}`
  }

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const userObj = user || JSON.parse(localStorage.getItem('user'));
        if (!userObj || !userObj.role) {
          return;
        }

        const safeBaseUrl = baseUrl || '';
        const notifUrl = `${safeBaseUrl}/api/notifications`;
        const permUrl = `${safeBaseUrl}/api/role-permissions?role=${encodeURIComponent(userObj.role)}`;

        const [notifRes, permRes] = await Promise.all([
          axios.get(notifUrl, { headers: getHeaders() }).catch(() => ({ data: [] })),
          axios.get(permUrl, { headers: getHeaders() }).catch(() => ({ data: { permissions: [] } }))
        ]);

        const allNotifs = notifRes.data || [];
        const perms = permRes.data?.permissions || [];
        const leaveNotifPerm = perms.find(p => p.pageId === 'leave_apply_notif');
        const scheduleNotifPerm = perms.find(p => p.pageId === 'schedule_assign_notif');

        const isAdmin = userObj.role?.toLowerCase().includes('admin') || userObj.is_test;
        const userEmpId = String(userObj.employeeId || userObj.employeeIdCode || userObj.id);

        const currentUserId = String(userObj.id || userObj._id);
        const filtered = allNotifs.filter(n => {
          if (n.deleted_by && n.deleted_by.includes(currentUserId)) return false;
          if (n.read_by && n.read_by.includes(currentUserId)) return false;

          if (isAdmin) return true;

          if (String(n.employeeId) === userEmpId || String(n.userId) === String(userObj.id)) {
            return true;
          }

          const category = n.category || 'general';
          if (category === 'leave') {
            if (!leaveNotifPerm || !leaveNotifPerm.canRead) return false;
            if (leaveNotifPerm.dataAccess === 'OWN') return false;
            return true;
          }
          if (category === 'schedule') {
            if (!scheduleNotifPerm || !scheduleNotifPerm.canRead) return false;
            if (scheduleNotifPerm.dataAccess === 'OWN') return false;
            return true;
          }
          return true;
        });
        setUnreadCount(filtered.length);
      } catch (err) {
        // Silently handle error
      }
    };
    if (baseUrl !== undefined) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 120000);
      window.addEventListener('notificationUpdate', fetchUnread);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationUpdate', fetchUnread);
      };
    }
  }, [user, baseUrl]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("selectedTheme") || "light"
    setCurrentTheme(savedTheme)
    document.body.className = `theme-${savedTheme}`
  }, [])
  useEffect(() => {
    document.body.className = `theme-${currentTheme}`
  }, [currentTheme])

  const isdCodes = [
    { code: "+91", country: "India" },
    { code: "+1", country: "USA" },
    { code: "+44", country: "UK" },
    { code: "+971", country: "UAE" },
    { code: "+61", country: "Australia" },
  ]
  const [tableStatus, setTableStatus] = useState("available") // Placeholder if needed
  // Consolidated initial data fetching
  useEffect(() => {
    if (configLoading) return;

    const fetchAllData = async () => {
      try {
        const apiBase = baseUrl || "";
        const [currencyRes, companyRes] = await Promise.all([
          axios.get(`${apiBase}/api/settings`, { headers: getHeaders() }),
          axios.get(`${apiBase}/api/company-details`, { headers: getHeaders() })
        ]);

        if (currencyRes.data) {
          const { paymentSettings: fetchedPaymentSettings } = currencyRes.data;
          if (fetchedPaymentSettings) {
            setPaymentSettings(fetchedPaymentSettings);
          }
        }

        if (companyRes.data.companyDetails && companyRes.data.companyDetails.length > 0) {
          const latestDetails = companyRes.data.companyDetails[companyRes.data.companyDetails.length - 1];
          setCompanyTaxType(latestDetails.taxType || 'GST');
          setCompanyTaxRate(Number(latestDetails.taxPercentage) || 18);
        }
      } catch (error) {
        console.error("Failed to fetch initial data in Front.jsx:", error);
      }
    };

    fetchAllData();
  }, [baseUrl, configLoading]);
  // Handle clicks outside customer section
  // Handle clicks outside customer section
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if the Add New Value modal is open
      if (showAddModal) return;

      if (customerSectionRef.current && !customerSectionRef.current.contains(event.target) && showCustomerSection) {
        setShowCustomerSection(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showCustomerSection, showAddModal])
  // Update date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }))
    }
    updateDateTime()
    const intervalId = setInterval(updateDateTime, 60000)
    return () => clearInterval(intervalId)
  }, [])
  // Fetch table data
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/tables`, { headers: getHeaders() });
        // UPDATED: Find table matching both tableNumber AND floor to ensure correct capacity
        const table = response.data.message.find((t) =>
          String(t.table_number) === String(tableNumber) &&
          (floor === "N/A" || !floor || String(t.floor) === String(floor))
        )
        if (table) {
          // Derive floor if missing
          if (floor === "N/A" || !floor) {
            setFloor(table.floor);
          }
          // UPDATED: Prioritize visual chair count (table.chairs.length) over number_of_chairs
          const capacity = (Array.isArray(table.chairs) && table.chairs.length > 0) ? table.chairs.length : (table.number_of_chairs || 0);
          setTotalChairs(capacity)
        } else {
          setTotalChairs(0)
        }
      } catch (err) {
        setWarningMessage(`Error fetching table data: ${err.message}`)
        setWarningType("warning")
      }
    }
    if (tableNumber && tableNumber !== "N/A") fetchTableData()
  }, [tableNumber, baseUrl, floor]) // Added floor dependency
  // FIXED: Always fetch address structure, regardless of baseUrl (use relative if empty)
  useEffect(() => {
    const fetchAddressStructure = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/address-structures` : '/api/address-structures';
        const active_company = localStorage.getItem('active_company');
        const active_branch = localStorage.getItem('active_branch');
        const token = localStorage.getItem('token');

        const headers = {
          "Authorization": `Bearer ${token}`,
          "X-Company-Name": active_company || "",
          "X-Branch-Name": active_branch || ""
        };

        const response = await fetch(apiPath, { headers });
        if (!response.ok) {
          throw new Error('Failed to fetch address structure');
        }
        const data = await response.json();
        setAddressStructure(data.structure || defaultStructure);
        setLinkedValues(data.linkedValues || {});
      } catch (error) {
        console.error('Error fetching address structure:', error);
      }
    };
    fetchAddressStructure();
  }, [baseUrl]);

  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const userObj = user || JSON.parse(localStorage.getItem('user'));
        if (!userObj) return;

        const activeComp = localStorage.getItem('active_company') || userObj.company;
        const activeBranch = localStorage.getItem('active_branch');
        const params = { company: activeComp };
        if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

        const response = await axios.get('/api/module-visibility', { params, headers: getHeaders() });
        setDisabledPages(response.data.disabled_pages || []);
      } catch (err) {
        console.error("Front.jsx: Failed to fetch visibility", err);
      }
    };

    const fetchWorkflowSettings = async () => {
      try {
        const userObj = user || JSON.parse(localStorage.getItem('user'));
        if (!userObj) return;
        const activeComp = localStorage.getItem('active_company') || userObj.company;
        const activeBranch = localStorage.getItem('active_branch');
        const params = { company: activeComp };
        if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

        const response = await axios.get('/api/workflow-visibility', { params, headers: getHeaders() });
        setWorkflowSettings(response.data.settings || {});
      } catch (err) {
        console.error("Front.jsx: Failed to fetch workflow settings", err);
      }
    };

    fetchVisibility();
    fetchWorkflowSettings();

    const handleVisibilityUpdate = () => {
      fetchVisibility();
      fetchWorkflowSettings();
    };

    window.addEventListener('visibilityChange', handleVisibilityUpdate);
    window.addEventListener('companyChange', handleVisibilityUpdate);
    return () => {
      window.removeEventListener('visibilityChange', handleVisibilityUpdate);
      window.removeEventListener('companyChange', handleVisibilityUpdate);
    };
  }, [user]);


  const getWorkflowCategory = () => {
    if (orderType === "Dine In") return "Dine In";
    // Normalize Take Away variations to "Takeaway" (Backend Key)
    if (orderType === "Takeaway" || orderType === "Take Away") return "Takeaway";
    if (orderType === "Online Delivery") return "Online Delivery";
    return "Dine In";
  };

  const getWorkflowSetting = (path) => {
    try {
      const category = getWorkflowCategory();
      const keys = path.split('.');
      let current = workflowSettings[category];
      for (const key of keys) {
        if (!current || current[key] === undefined) return undefined;
        current = current[key];
      }
      return current;
    } catch { return undefined; }
  };

  const isPageEnabled = (path) => {
    // 1. Check direct role-based/manual suppression
    if (disabledPages && disabledPages.includes(path)) return false;

    // 2. Check Global Workflow Suppression (Setup once in Group Manage)
    const settings = workflowSettings?.global_modules;

    // Mapping relevant POS paths to their module/page names
    const pathMap = {
      "/active-orders": { mod: "tracking", page: "ActiveOrders" },
      "/kitchen": { mod: "kitchen_display", page: "KitchenView" },
      "/add-kitchen": { mod: "kitchen_display", page: "AddKitchen" },
      "/inventory": { mod: "inventory", page: "ItemsList" },
      "/items": { mod: "inventory", page: "ItemsList" },
      "/add-employee": { mod: "hr_payroll", page: "AddEmployee" },
      "/employee-list": { mod: "hr_payroll", page: "EmployeeList" },
      "/admin": { mod: "admin_dashboard", page: "AdminPanel" },
      "/dashboard": { mod: "admin_dashboard", page: "Dashboard" },
      "/main": { mod: "admin_dashboard", page: "MainPage" },
      "/import-data": { mod: "admin_dashboard", page: "ImportData" },
      "/customers": { mod: "customer_module", page: "CustomerList" },
      "/create-customer": { mod: "customer_module", page: "CreateCustomer" },
      "/create-customer-group": { mod: "customer_module", page: "CustomerGroup" },
      "/bearer": { mod: "bearer_waiter", page: "BearerPage" },
      "/opening-entry": { mod: "bearer_waiter", page: "OpeningEntry" },
      "/closing-entry": { mod: "bearer_waiter", page: "ClosingEntry" },
      "/add-table": { mod: "table_management", page: "AddTable" },
      "/table": { mod: "table_management", page: "TableView" },
      "/frontpage": { mod: "table_management", page: "FrontPage" },
      "/booking": { mod: "table_management", page: "Booking" },
      "/users": { mod: "hr_payroll", page: "Users" },
      "/vehicle-management": { mod: "vehicle_module", page: "VehicleManagement" },
      "/address-structure": { mod: "address_module", page: "AddressStructure" },
      "/holiday-doctype": { mod: "hr_payroll", page: "HolidayList" },
      "/extended-doctype": { mod: "hr_payroll", page: "ExtendedDocType" },
      "/vat": { mod: "settings", page: "VatPage" },
      "/combo-offer": { mod: "pos_billing", page: "ComboOffer" },
      "/notifications": { mod: "notifications", page: "Notifications" },
      "/record": { mod: "admin_dashboard", page: "AuditRecords" },
    };

    const map = pathMap[path];
    if (!map) return true; // Unmapped paths (like /login) are allowed by default

    // Define Core Modules that are always allowed
    const CORE_MODULES = ["admin_dashboard", "multi_branch", "auth", "settings"];
    if (CORE_MODULES.includes(map.mod)) return true;

    // IF SETTINGS NOT YET LOADED: Allow to avoid flash
    if (!workflowSettings) return true;

    // Default to VISIBLE if module not explicitly mentioned in config
    if (!settings) return true;

    const modSet = settings[map.mod];
    if (!modSet) return true;

    // Check specific module enable flag
    if (modSet.enabled === false) return false;

    // Check specific page enable flag (if set)
    if (modSet.pages && modSet.pages[map.page] === false) return false;

    return true;
  };

  const isWorkflowFeatureEnabled = (feature, subItem = null) => {
    const category = getWorkflowCategory();
    const settings = workflowSettings[category];

    // Default to true if no configuration has been deployed for this category
    if (!settings) return true;

    const featureKey = feature.toLowerCase();
    const featSettings = settings[featureKey];

    // Default to true if feature not explicitly mentioned
    if (!featSettings) return true;

    if (featSettings.enabled === false) return false;

    if (subItem) {
      const subKey = subItem.toLowerCase().replace(/\s+/g, '');
      const subEnabled = featSettings[subKey];
      // If the setting is explicitly defined, respect it.
      if (subEnabled !== undefined) return subEnabled === true;
      // Otherwise default to true
      return true;
    }
    return true;
  };

  const isButtonEnabled = (btnName) => {
    const isKitchenAllowed = isWorkflowFeatureEnabled("save", "Kitchen") &&
      (workflowSettings.global_modules?.kitchen_display?.enabled !== false);

    const isActiveOrdersAllowed = isWorkflowFeatureEnabled("save", "Active Orders") &&
      (workflowSettings.global_modules?.tracking?.enabled !== false);

    if (btnName === "Save") {
      return isKitchenAllowed || isActiveOrdersAllowed;
    }
    if (btnName === "Active Orders") return isActiveOrdersAllowed;
    if (btnName === "Kitchen") return isKitchenAllowed;
    if (btnName === "Cancel") return true; // Default always enabled unless added to config
    return true;
  };

  // Initialize state logic moved to useState calls to avoid race conditions
  // Load saved orders and booked tables/chairs
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedOrders")) || []
    setSavedOrders(saved)
    const booked = JSON.parse(localStorage.getItem("bookedTables")) || []
    setBookedTables(booked)
    // REMOVED: Initial load of bookedChairs from localStorage (will be synced via useEffect below)
  }, [])

  // NEW: Synchronize bookedChairs state with savedOrders filtered by floor
  useEffect(() => {
    const activeOrders = savedOrders.filter(order => order.floor === floor && !order.paid);
    const updatedBookedChairs = {};
    activeOrders.forEach(order => {
      const tNo = order.tableNumber;
      if (tNo) {
        if (!updatedBookedChairs[tNo]) updatedBookedChairs[tNo] = [];
        if (Array.isArray(order.chairsBooked)) {
          order.chairsBooked.forEach(c => {
            if (!updatedBookedChairs[tNo].includes(c)) {
              updatedBookedChairs[tNo].push(c);
            }
          });
        }
      }
    });
    setBookedChairs(updatedBookedChairs);
  }, [savedOrders, floor]);
  // Fetch menu items and combos
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/items`, { headers: getHeaders() })
        const data = response.data
        console.log("FETCHED ITEMS API RESPONSE:", data);
        if (Array.isArray(data)) {
          const safeParse = (str) => {
            if (typeof str === 'string') {
              try { return JSON.parse(str); } catch (e) { return []; }
            }
            return str || [];
          };
          const seenItems = new Map();

          // Resolve the correct price based on active branch → active company → fallback
          const activeComp = localStorage.getItem('active_company') || '';
          const activeBranch = localStorage.getItem('active_branch') || '';
          const isSpecificBranch = activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All';
          const isSpecificCompany = activeComp && activeComp !== 'All' && activeComp !== 'All Companies';

          const resolvePrice = (rawPrice, branchPrices, companyPrices) => {
            // 1. Branch-specific price (highest priority)
            if (isSpecificBranch && branchPrices && branchPrices[activeBranch] !== undefined && Number(branchPrices[activeBranch]) > 0) {
              return Number(branchPrices[activeBranch]);
            }
            // 2. Company-specific price
            if (isSpecificCompany && companyPrices && companyPrices[activeComp] !== undefined && Number(companyPrices[activeComp]) > 0) {
              return Number(companyPrices[activeComp]);
            }
            // 3. Fallback to base price
            return Number(rawPrice) || 0;
          };

          const addItemIfNotExists = (item) => {
            // Create a unique key based on name and type ONLY to avoid duplicates
            const nameKey = (item.name || "").toString().trim().toLowerCase();
            const typeKey = item.type;
            const key = `${nameKey}-${typeKey}`;

            const itemBranchesRaw = (item.branch_names || []).concat(item.branches || []).concat(item.branch_name ? [item.branch_name] : []).concat(item.branch ? [item.branch] : []);
            const flattenedBranches = itemBranchesRaw.flatMap(b => typeof b === 'string' ? b.split(',').map(s => s.trim().toLowerCase()) : b).filter(Boolean);
            const isUniversal = flattenedBranches.length === 0 || flattenedBranches.some(b => ['global', 'all', 'all branches', 'any'].includes(b));

            // STRICT FILTERING: 
            // If user is at Company-level (All Branches), ONLY show company-level (universal) items
            if (!isSpecificBranch && !isUniversal) return;

            if (!seenItems.has(key)) {
              seenItems.set(key, item);
            } else {
              // Priority Resolution: If we are in a specific branch, prioritize the branch-specific item over the universal one
              const existingItem = seenItems.get(key);

              const existingBranchesRaw = (existingItem.branch_names || []).concat(existingItem.branches || []).concat(existingItem.branch_name ? [existingItem.branch_name] : []).concat(existingItem.branch ? [existingItem.branch] : []);
              const existingFlattened = existingBranchesRaw.flatMap(b => typeof b === 'string' ? b.split(',').map(s => s.trim().toLowerCase()) : b).filter(Boolean);
              const existingIsUniversal = existingFlattened.length === 0 || existingFlattened.some(b => ['global', 'all', 'all branches', 'any'].includes(b));

              if (isSpecificBranch && existingIsUniversal && !isUniversal) {
                seenItems.set(key, item);
              }
            }
          };

          data.forEach((item) => {
            // 1. Push the Main Item
            // DETECT TYPE BASED ON GROUP: If user grouped it as "Addons", treat it as Addon.
            const group = item.item_group ? item.item_group.toLowerCase() : "uncategorized";
            let itemType = 'item';
            if (group.includes('addon')) itemType = 'addon';

            const mainBasePrice = resolvePrice(item.price_list_rate, item.branch_prices, item.company_prices);

            addItemIfNotExists({
              id: uuidv4(),
              name: item.item_name || "Unnamed Item",
              category: item.item_group || "uncategorized",
              image: item.image ? `${baseUrl}${item.image}` : "/static/images/default-item.jpg",
              type: itemType, // Dynamic type based on group
              branch: item.branch,
              branch_name: item.branch_name,
              basePrice: mainBasePrice,
              offer_price: Number(item.offer_price) || 0,
              offer_start_time: item.offer_start_time,
              offer_end_time: item.offer_end_time,
              tax_applicable: item.tax_applicable || false,
              tax_rate: item.tax_rate || 0,
              size: item.size || {
                enabled: true,
                small_price: mainBasePrice - 10 || 0,
                medium_price: mainBasePrice || 0,
                large_price: mainBasePrice + 10 || 0,
              },
              cold: item.cold || { enabled: false, ice_preference: "without_ice", ice_price: 10 },
              spicy: item.spicy || { enabled: false, is_spicy: false, spicy_price: 20 },
              sugar: item.sugar || { enabled: false, level: "medium" },
              custom_variants: safeParse(item.custom_variants),
              addons: safeParse(item.addons),
              combos: safeParse(item.combos),
              kitchen: item.kitchen || "Main Kitchen",
              ingredients: safeParse(item.ingredients),
            });

            // 2. Push Addons as separate items (so their groups appear in sidebar)
            if (item.addons && item.addons.length > 0) {
              item.addons.forEach((addon) => {
                const addonPrice = resolvePrice(addon.addon_price, addon.branch_prices, addon.company_prices);
                addItemIfNotExists({
                  id: uuidv4(),
                  name: addon.name1,
                  category: addon.item_group || "Addons",
                  type: 'addon', // Mark as addon
                  branch: item.branch,
                  branch_name: item.branch_name,
                  image: addon.addon_image ? `${baseUrl}${addon.addon_image}` : "/static/images/default-addon-image.jpg",
                  basePrice: addonPrice,
                  tax_applicable: addon.tax_applicable || false,
                  tax_rate: addon.tax_rate || 0,
                  size: addon.size || { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                  cold: addon.cold || { enabled: false, ice_preference: "without_ice", ice_price: 10 },
                  spicy: addon.spicy || { enabled: false, is_spicy: false, spicy_price: 20 },
                  sugar: addon.sugar || { enabled: false, level: "medium" },
                  custom_variants: safeParse(addon.custom_variants),
                  kitchen: addon.kitchen || "Main Kitchen",
                  addons: [],
                  combos: [],
                });
              });
            }

            // 3. Push Combos as separate items
            if (item.combos && item.combos.length > 0) {
              item.combos.forEach((combo) => {
                const comboPrice = resolvePrice(combo.combo_price, combo.branch_prices, combo.company_prices);
                addItemIfNotExists({
                  id: uuidv4(),
                  name: combo.name1,
                  category: combo.item_group || "Combos",
                  type: 'item_combo', // Mark as item_combo
                  branch: item.branch,
                  branch_name: item.branch_name,
                  image: combo.combo_image ? `${baseUrl}${combo.combo_image}` : "/static/images/default-combo-image.jpg",
                  basePrice: comboPrice,
                  tax_applicable: combo.tax_applicable || false,
                  tax_rate: combo.tax_rate || 0,
                  size: combo.size || { enabled: false, small_price: 0, medium_price: 0, large_price: 0 },
                  cold: combo.cold || { enabled: false, ice_preference: "without_ice", ice_price: 10 },
                  spicy: combo.spicy || { enabled: false, is_spicy: false, spicy_price: 20 },
                  sugar: combo.sugar || { enabled: false, level: "medium" },
                  custom_variants: safeParse(combo.custom_variants),
                  kitchen: combo.kitchen || "Main Kitchen",
                  addons: [],
                  combos: [],
                });
              });
            }
          });

          const finalFormattedItems = Array.from(seenItems.values());
          setMenuItems(finalFormattedItems)
          // UPDATED: Show all items including technical addons/combos if categories require it
          // Wait, actually let's keep the default "All Items" clean, BUT ensure they are available
          setFilteredItems(finalFormattedItems.filter(item => item.type !== 'addon' && item.type !== 'item_combo'))
        }
      } catch (error) {
        console.error("Error fetching items:", error)
        setWarningMessage("Failed to load menu items. Please try again.")
        setWarningType("warning")
      }
    }
    const fetchCombos = async () => {
      try {
        const response = await axios.get(`${baseUrl}/api/combo-offer`, { headers: getHeaders() });
        if (response.data) {
          const now = new Date();
          const validCombos = response.data.filter(combo => {
            if (combo.offer_end_time && new Date(combo.offer_end_time) < now) return false;
            return true;
          });
          const formattedCombos = validCombos.map((combo) => ({
            id: combo._id,
            name: combo.description || "Combo Offer",
            category: combo.item_group || "Combos Offer",
            images: combo.images || [], // FIXED: Use uploaded images array for combo
            image: combo.images && combo.images.length > 0 ? `${baseUrl}/api/combo-images/${combo.images[0]}` : "/static/images/default-combo.jpg", // Primary image
            basePrice: Number(combo.total_price) || 0,
            offer_price: Number(combo.offer_price) || 0,
            offer_start_time: combo.offer_start_time,
            offer_end_time: combo.offer_end_time,
            tax_applicable: false, // Default for combo offers
            tax_rate: 0,
            isCombo: true,
            comboItems: combo.items.map((citem) => ({
              name: citem.data.item_name || citem.data.name1,
              description: citem.data.description || '',
              price: Number(citem.price) || 0,
              image: citem.data.image ? `${baseUrl}${citem.data.image}` : citem.data.addon_image ? `${baseUrl}${citem.data.addon_image}` : citem.data.combo_image ? `${baseUrl}${citem.data.combo_image}` : "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E",
              kitchen: citem.data.kitchen || "Main Kitchen",
            })),
            addons: combo.addons || [], // FIXED: Include addons for rendering
            combos: combo.combos || [], // FIXED: Include sub-combos
            branch: combo.branch,
            branch_name: combo.branch_name,
            kitchen: combo.kitchen || "Main Kitchen",
          }));
          setComboList(formattedCombos);
        } else {
          console.error('Failed to fetch combos');
        }
      } catch (error) {
        console.error('Error fetching combos:', error);
      }
    };
    fetchItems();
    fetchCombos();
  }, [baseUrl]);

  useEffect(() => {
    const finalCategories = ["All"];
    const hasMenu = menuItems.length > 0;
    const hasCombos = comboList.length > 0;
    if (hasMenu) {
      const activeGroups = new Set(menuItems.filter(i => i.is_active || !i.is_hidden).map(i => i.item_group || "Uncategorized"));
      finalCategories.push(...Array.from(activeGroups).sort());
    }
    if (hasCombos) finalCategories.push("Combos Offer");
    setCategories(finalCategories);
  }, [menuItems, comboList]);

  // Sync Cart, OrderType, and Menu state to Chatbot via localStorage
  useEffect(() => {
    const cartData = cartItems.map(i => ({ name: i.item_name || i.name, quantity: i.quantity, price: i.standard_rate || i.price }));
    const menuData = menuItems.map(i => ({ name: i.item_name || i.name, price: i.standard_rate || i.price }));
    
    localStorage.setItem('chatbot_cart', JSON.stringify(cartData));
    localStorage.setItem('chatbot_orderType', orderType);
    localStorage.setItem('chatbot_menu', JSON.stringify(menuData));
    
    // Also try postMessage for live updates while iframe is open
    const chatbotIframe = document.getElementById('chatbot-iframe');
    if (chatbotIframe && chatbotIframe.contentWindow) {
      chatbotIframe.contentWindow.postMessage({
        type: 'SYNC_STATE',
        cart: cartData,
        orderType: orderType,
        menu: menuData
      }, '*');
    }
  }, [cartItems, orderType, menuItems]);

  // Fetch customers

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/customers` : '/api/customers';
        const response = await axios.get(apiPath, { headers: getHeaders() })
        setCustomers(response.data)
        setFilteredCustomers(response.data)
      } catch (error) {
        console.error("Error fetching customers:", error)
        setWarningMessage("Failed to load customers. Please try again.")
        setWarningType("warning")
      }
    }
    fetchCustomers()
  }, [baseUrl])
  // Fetch customer groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const apiPath = baseUrl ? `${baseUrl}/api/customer-groups` : '/api/customer-groups';
        const response = await axios.get(apiPath, { headers: getHeaders() })
        setCustomerGroups(response.data)
      } catch (error) {
        console.error("Error fetching customer groups:", error)
        setWarningMessage("Failed to load customer groups. Please try again.")
        setWarningType("warning")
      }
    }
    fetchGroups()
  }, [baseUrl])
  // REMOVED: Fetch VAT rate - now per item
  // Filter menu items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      if (selectedCategory === "All Items") {
        setFilteredItems(menuItems.filter(item => item.type !== 'addon' && item.type !== 'item_combo'))
      } else if (selectedCategory === "Combos Offer" || selectedCategory.toLowerCase() === "combos" || selectedCategory.toLowerCase() === "combo") {
        const combosFromMenu = menuItems.filter(item => item.type === 'item_combo' || item.category.toLowerCase() === selectedCategory.toLowerCase() && item.type === 'item_combo');
        const combosFromList = comboList;

        // Remove duplicates if any (though they usually have different IDs)
        const combined = [...combosFromMenu, ...combosFromList];
        const uniqueCombos = Array.from(new Map(combined.map(item => [item.id, item])).values());

        setFilteredItems(uniqueCombos)
      } else if (selectedCategory.toLowerCase().includes("addon")) {
        setFilteredItems(menuItems.filter(item =>
          item.category.toLowerCase() === selectedCategory.toLowerCase() &&
          item.type === 'addon'
        ))
      } else {
        setFilteredItems(menuItems.filter(item =>
          item.category.toLowerCase() === selectedCategory.toLowerCase() &&
          item.type !== 'addon' &&
          item.type !== 'item_combo'
        ))
      }
    } else {
      let filtered = menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      // Hide addons and combos from search results globally
      filtered = filtered.filter(item => item.type !== 'addon' && item.type !== 'item_combo')
      setFilteredItems(filtered)
    }
    setPosPage(1)
  }, [searchQuery, menuItems, selectedCategory, comboList])
  const handleFilter = (category) => {
    setSearchQuery("")
    const normalizedCategory = category.includes("Combos Offer") ? "Combos Offer" : category
    setSelectedCategory(normalizedCategory)
    if (normalizedCategory === "All Items") {
      setFilteredItems(menuItems.filter(item => item.type !== 'addon' && item.type !== 'item_combo'))
    } else if (normalizedCategory === "Combos Offer" || normalizedCategory.toLowerCase() === "combos" || normalizedCategory.toLowerCase() === "combo") {
      const combosFromMenu = menuItems.filter(item => item.type === 'item_combo' || item.category.toLowerCase() === normalizedCategory.toLowerCase() && item.type === 'item_combo');
      const combosFromList = comboList;

      const combined = [...combosFromMenu, ...combosFromList];
      const uniqueCombos = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setFilteredItems(uniqueCombos)
    } else if (normalizedCategory.toLowerCase().includes("addon")) {
      setFilteredItems(menuItems.filter(item =>
        item.category.toLowerCase() === normalizedCategory.toLowerCase() &&
        item.type === 'addon'
      ))
    } else {
      // Global Filter: Ensure selected category also hides addons and combos
      setFilteredItems(menuItems.filter(item =>
        item.category.toLowerCase() === category.toLowerCase() &&
        item.type !== 'addon' &&
        item.type !== 'item_combo'
      ))
    }
    setPosPage(1); // Reset pagination on category change

    // Centering Logic: Rotate the categories array so the clicked item is in the visual center (Index 3)
    // Only apply for Design 1 (where categories are in the header)
    if (posDesign !== "design2" && posDesign !== "design3") {
      const index = categories.indexOf(category);
      if (index !== -1) {
        const length = categories.length;

        // The user wants 3 items to the left and 3 items to the right.
        // This means the clicked item should be at Index 3 (4th item).
        let targetCenterIndex = 3;

        // If categories count is less than 7, we center at the middle
        if (length < 7) {
          targetCenterIndex = Math.floor(length / 2);
        }

        // Calculate shift to move current index to targetCenterIndex
        const shift = index - targetCenterIndex;

        if (shift !== 0) {
          let newCategories = [...categories];
          if (shift > 0) {
            // Rotate Left (move items from front to back)
            for (let i = 0; i < shift; i++) {
              newCategories.push(newCategories.shift());
            }
          } else {
            // Rotate Right (move items from back to front)
            for (let i = 0; i < Math.abs(shift); i++) {
              newCategories.unshift(newCategories.pop());
            }
          }
          setCategories(newCategories);

          // Immediate scroll reset to ensure the first item (visually index 0) is at the start
          if (categoryContainerRef.current) {
            categoryContainerRef.current.scrollLeft = 0;
          }
        }
      }
    }
  }

  const handleItemClick = (item, preSelectedSize = null) => {
    // NEW: Check if order type has been selected
    const isOrderTypeSelected = localStorage.getItem('isOrderTypeSelected') === 'true';
    if (!isOrderTypeSelected) {
      setShowOrderTypeRequiredModal(true);
      return;
    }

    // Check if we are clicking a specific size variant card (so we pass preSelectedSize)
    // OR if the item object itself has a preSelectedSize property attached during mapping
    const size = preSelectedSize || item.preSelectedSize || null;

    setSelectedItem(item)

    // ALWAYS set selectedCartItem to null when clicking from the menu grid.
    // This forces "Add Mode", ensuring a fresh dialog opens.
    if (size) {
      // If specific size clicked, seed the dialog but still as new
      setSelectedCartItem({ selectedSize: size });
    } else {
      setSelectedCartItem(null);
    }
  }
  const handleCartItemClick = (cartItem) => {
    const menuItem = menuItems.find((item) => item.name === cartItem.item_name);
    setSelectedItem(menuItem || null);
    setSelectedCartItem(cartItem);
  }
  const hasActiveOffer = (item) => {
    if (!item || item.offer_price === undefined || !item.offer_start_time || !item.offer_end_time) {
      return false;
    }
    const currentTime = new Date();
    const startTime = new Date(item.offer_start_time);
    const endTime = new Date(item.offer_end_time);
    return startTime <= currentTime && currentTime <= endTime;
  };
  const calculateOfferSizePrice = (offerPrice, size) => {
    if (!offerPrice) return 0
    switch (size) {
      case "S":
        return offerPrice - 10
      case "M":
        return offerPrice
      case "L":
        return offerPrice + 10
      default:
        return offerPrice
    }
  }
  const createStandaloneAddonItem = (addon, size = "M", isSplitVariant = false, mainItemSize = null) => {
    const effectiveSize = isSplitVariant ? size : (mainItemSize || size);
    const addonSizePrice = addon?.size?.enabled
      ? effectiveSize === "S" ? addon.size.small_price || addon.price - 10 || 0
        : effectiveSize === "L" ? addon.size.large_price || addon.price + 10 || 0
          : addon.size.medium_price || addon.price || 0
      : addon.price || 0;

    const effectiveTaxRate = getEffectiveTaxRate(addon.tax_applicable, addon.tax_rate, true);
    const exclTotal = addonSizePrice * 1; // Quantity 1
    const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
    const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};

    return {
      id: uuidv4(),
      item_name: addon.name1, // Standalone: Use addon name as item
      name: addon.name1,
      quantity: 1,
      basePrice: addonSizePrice, // Use size-adjusted price
      totalPrice: exclTotal + taxTotal,
      exclTotal,
      taxTotal,
      taxBreakdown,
      mainTaxTotal: taxTotal,
      mainTaxRate: effectiveTaxRate,
      mainExclPerUnit: addonSizePrice, // Needed for main item quantity updates
      selectedSize: effectiveSize,
      kitchen: addon.kitchen || "Main Kitchen",
      image: addon.addon_image || "/static/images/default-addon-image.jpg",
      isStandaloneAddon: true, // Flag to identify in cart/billing
      status: "Pending",
      served: false,
      // Variants for addon itself (if needed later)
      addonVariants: { [addon.name1]: { size: effectiveSize } }, // Self-reference if needed
    };
  };

  // NEW: Helper to create standalone combo as cart item
  const createStandaloneComboItem = (combo, size = "M", isSplitVariant = false, mainItemSize = null) => {
    const effectiveSize = isSplitVariant ? size : (mainItemSize || size);
    const comboSizePrice = combo?.size?.enabled
      ? effectiveSize === "S" ? combo.size.small_price || combo.price - 10 || 0
        : effectiveSize === "L" ? combo.size.large_price || combo.price + 10 || 0
          : combo.size.medium_price || combo.price || 0
      : combo.price || 0;

    const effectiveTaxRate = getEffectiveTaxRate(combo.tax_applicable, combo.tax_rate, false, true);
    const exclTotal = comboSizePrice * 1; // Quantity 1
    const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
    const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};

    return {
      id: uuidv4(),
      item_name: combo.name1, // Standalone: Use combo name as item
      name: combo.name1,
      quantity: 1,
      basePrice: comboSizePrice,
      totalPrice: exclTotal + taxTotal,
      exclTotal,
      taxTotal,
      taxBreakdown,
      mainTaxTotal: taxTotal,
      mainTaxRate: effectiveTaxRate,
      mainExclPerUnit: comboSizePrice, // Needed for main item quantity updates
      selectedSize: effectiveSize,
      kitchen: combo.kitchen || "Main Kitchen",
      image: combo.combo_image || "/static/images/default-combo-image.jpg",
      isStandaloneCombo: true, // Flag to identify
      status: "Pending",
      served: false,
      // Combo details if sub-items
      comboItems: combo.comboItems || [], // If it's a sub-combo
    };
  };

  const getComboItemsWithImages = (combo) => {
    const itemsWithImages = [];
    if (combo.comboItems && combo.comboItems.length > 0) {
      combo.comboItems.forEach(comboItem => {
        const name = comboItem.name || '';
        const image = comboItem.image || null;
        if (name.trim() !== '') {
          itemsWithImages.push({ name, image });
        }
      });
    }
    return itemsWithImages;
  };

  const getUploadedImages = (combo) => {
    if (combo.images && combo.images.length > 0) {
      return combo.images.map(img => `/api/combo-images/${img}`);
    }
    return [];
  };

  const handleItemUpdate = (updatedItem, forceAdd = false) => {
    // Helper to check for identical items (Deep Equality)
    const isItemIdentical = (cartItem, newItem) => {
      if (cartItem.item_name !== (newItem.item_name || newItem.name)) return false;

      const newSize = newItem.variants?.size?.selected || newItem.selectedSize || null;
      const newIce = newItem.variants?.cold?.icePreference || newItem.icePreference || "without_ice";
      const newSpicy = newItem.variants?.spicy?.isSpicy || newItem.isSpicy || false;
      const newSugar = newItem.variants?.sugar?.level || newItem.sugarLevel || "medium";
      const newKitchen = newItem.kitchen || "Main Kitchen";

      if (cartItem.selectedSize !== newSize) return false;
      if ((cartItem.icePreference || "without_ice") !== newIce) return false;
      if ((cartItem.isSpicy || false) !== newSpicy) return false;
      if ((cartItem.sugarLevel || "medium") !== newSugar) return false;
      if ((cartItem.kitchen || "Main Kitchen") !== newKitchen) return false;

      const simpleDeepEqual = (o1, o2) => {
        const k1 = Object.keys(o1 || {}).sort();
        const k2 = Object.keys(o2 || {}).sort();
        if (k1.length !== k2.length) return false;
        for (let i = 0; i < k1.length; i++) {
          if (k1[i] !== k2[i]) return false;
          if (JSON.stringify(o1[k1[i]]) !== JSON.stringify(o2[k1[i]])) return false;
        }
        return true;
      }

      if (JSON.stringify(cartItem.addonQuantities || {}) !== JSON.stringify(newItem.addonQuantities || {})) return false;
      if (!simpleDeepEqual(cartItem.addonVariants, newItem.addonVariants)) return false;
      if (JSON.stringify(cartItem.comboQuantities || {}) !== JSON.stringify(newItem.comboQuantities || {})) return false;
      if (!simpleDeepEqual(cartItem.comboVariants, newItem.comboVariants)) return false;
      if (!simpleDeepEqual(cartItem.selectedCustomVariants, newItem.selectedCustomVariants)) return false;
      if (!simpleDeepEqual(cartItem.kitchenNotes, newItem.kitchenNotes)) return false;

      return true;
    };

    let existingItemIndex = -1;

    // Check if we are in Edit Mode (Updating a specific line item from Cart)
    if (selectedCartItem && !forceAdd) {
      existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === selectedCartItem.id);
    }
    // Add Mode (Adding from Menu)
    else {
      // Check if there is an IDENTICAL item to merge with
      existingItemIndex = cartItems.findIndex((cartItem) => isItemIdentical(cartItem, updatedItem));
    }

    // Logic for Combos
    if (updatedItem.isCombo) {
      const menuItem = comboList.find(c => c.id === updatedItem.id) || updatedItem;
      const hasOffer = hasActiveOffer(menuItem);
      const finalPrice = hasOffer ? menuItem.offer_price || 0 : menuItem.basePrice || 0;
      const quantity = (existingItemIndex !== -1 && !selectedCartItem) ? cartItems[existingItemIndex].quantity + (Number(updatedItem.quantity) || 1) : (Number(updatedItem.quantity) || 1);

      const effectiveTaxRate = getEffectiveTaxRate(menuItem.tax_applicable, menuItem.tax_rate);
      const exclTotal = finalPrice * quantity;
      const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
      const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};

      const cartItem = {
        id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
        name: updatedItem.name,
        item_name: updatedItem.name,
        quantity,
        originalBasePrice: hasOffer ? updatedItem.basePrice || 0 : null,
        basePrice: finalPrice,
        totalPrice: exclTotal + taxTotal,
        exclTotal,
        taxTotal,
        taxBreakdown,
        mainTaxTotal: taxTotal,
        mainTaxRate: effectiveTaxRate,
        isCombo: true,
        is_combo_offer: true,
        offer_description: updatedItem.name,
        comboItems: updatedItem.comboItems,
        kitchen: updatedItem.kitchen || "Main Kitchen",
        status: "Pending",
        served: false,
        image: updatedItem.image,
        kitchenStatuses: existingItemIndex !== -1 ? cartItems[existingItemIndex].kitchenStatuses : {},
        kitchenNotes: updatedItem.kitchenNotes || {},
      };

      if (existingItemIndex !== -1) {
        setCartItems((prevItems) => {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex] = cartItem
          return updatedItems
        })
        setBillCartItems((prevItems) => {
          const updatedItems = [...prevItems]
          updatedItems[existingItemIndex] = cartItem
          return updatedItems
        })
      } else {
        setCartItems((prevItems) => [...prevItems, cartItem])
        setBillCartItems((prevItems) => [...prevItems, cartItem])
      }
      setSelectedItem(null)
      setSelectedCartItem(null)
      return;
    }


    // Logic for Items
    const lookupName = updatedItem.originalName || updatedItem.item_name;
    let menuItem = menuItems.find((item) => item.name === lookupName);

    // NEW: Fallback for Combos in 'All Items' or 'Combos' view
    if (!menuItem) {
      menuItem = comboList.find((c) => c.name === lookupName);
    }

    if (!menuItem) {
      console.warn(`Item '${lookupName}' not found in menuItems or comboList. Treating as standalone or error.`);
      // If type is addon or item_combo, we can proceed to add it as a simplified item
      if (updatedItem.type === 'addon' || updatedItem.type === 'item_combo') {
        const quantity = Number(updatedItem.quantity) || 1;
        const basePrice = Number(updatedItem.basePrice) || 0;
        const effectiveTaxRate = getEffectiveTaxRate(updatedItem.tax_applicable, updatedItem.tax_rate, updatedItem.type === 'addon', updatedItem.type === 'item_combo');
        const exclTotal = basePrice * quantity;
        const taxTotal = effectiveTaxRate > 0 ? exclTotal * (effectiveTaxRate / 100) : 0;
        const taxBreakdown = taxTotal > 0 ? { [effectiveTaxRate]: taxTotal } : {};

        const cartItem = {
          id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
          name: updatedItem.item_name,
          item_name: updatedItem.item_name,
          quantity,
          basePrice,
          totalPrice: exclTotal + taxTotal,
          exclTotal,
          taxTotal,
          taxBreakdown,
          mainTaxTotal: taxTotal,
          mainTaxRate: effectiveTaxRate,
          selectedSize: updatedItem.variants?.size?.selected || "M", // Addons usually M
          kitchen: updatedItem.kitchen || "Main Kitchen",
          image: updatedItem.image || (updatedItem.type === 'addon' ? "/static/images/default-addon-image.jpg" : "/static/images/default-combo-image.jpg"),
          isStandaloneAddon: updatedItem.type === 'addon',
          isStandaloneCombo: updatedItem.type === 'item_combo',
          status: "Pending",
          served: false,
          addonVariants: updatedItem.addonVariants || {}, // For self-reference if needed
        };

        if (existingItemIndex !== -1) {
          setCartItems(prev => {
            const next = [...prev];
            next[existingItemIndex] = cartItem;
            return next;
          });
          setBillCartItems(prev => {
            const next = [...prev];
            next[existingItemIndex] = cartItem;
            return next;
          });
        } else {
          setCartItems(prev => [...prev, cartItem]);
          setBillCartItems(prev => [...prev, cartItem]);
        }
        setSelectedItem(null);
        setSelectedCartItem(null);
        return;
      }
      return;
    }

    const hasSizeVariant = menuItem?.size?.enabled || false
    const updatedSelectedSize = hasSizeVariant ? updatedItem.variants?.size?.selected : null
    const hasOffer = hasActiveOffer(menuItem);

    // FIXED: For standalone custom variants, preserve their specific basePrice
    let originalBasePrice = updatedItem.isStandaloneCustomVariant ? (updatedItem.basePrice || 0) : (menuItem.basePrice || 0);
    let finalBasePrice = updatedItem.isStandaloneCustomVariant ? (updatedItem.basePrice || 0) : (hasOffer ? menuItem.offer_price || 0 : menuItem.basePrice || 0);

    if (hasSizeVariant && !updatedItem.isStandaloneCustomVariant) {
      const size = updatedSelectedSize || "M";
      originalBasePrice = size === "S" ? menuItem.size.small_price || 0 : size === "L" ? menuItem.size.large_price || 0 : menuItem.size.medium_price || 0;
      finalBasePrice = hasOffer ? calculateOfferSizePrice(menuItem.offer_price || 0, size) : originalBasePrice;
    }
    const effectiveMainTaxRate = getEffectiveTaxRate(menuItem?.tax_applicable, menuItem?.tax_rate, false);
    const icePrice = Number(updatedItem.icePrice) || ((updatedItem.variants?.cold?.selected === 'with_ice' || updatedItem.variants?.cold?.icePreference === 'with_ice') ? Number(menuItem?.cold?.ice_price || menuItem?.variants?.cold?.ice_price || 0) : 0);
    const spicyPrice = Number(updatedItem.spicyPrice) || ((updatedItem.variants?.spicy?.selected === true || updatedItem.variants?.spicy?.isSpicy === true) ? Number(menuItem?.spicy?.spicy_price || menuItem?.variants?.spicy?.spicy_price || 0) : 0);
    const addonVariants = {}
    const addonImages = {}
    const addonPrices = {}
    const addonSizePrices = {}
    const addonIcePrices = {}
    const addonIceQuantities = updatedItem.addonIceQuantities || {}
    const addonSpicyPrices = {}
    const addonSpicyQuantities = updatedItem.addonSpicyQuantities || {}
    const addonCustomVariantsDetails = updatedItem.addonCustomVariantsDetails || {}
    const addonCustomVariantsQuantities = updatedItem.addonCustomVariantsQuantities || {}
    const addonTaxes = {}
    const addonTaxRates = {}
    const addonInclPrices = {}
    const addonExclTotals = {}
    let addonTaxTotal = 0
    let addonExclTotal = 0
    let taxBreakdown = {};
    Object.keys(updatedItem.addonQuantities || {}).forEach((addonName) => {
      const addon = menuItem?.addons.find((a) => a.name1 === addonName)
      const addonBasePrice = addon?.price || updatedItem.addonPrices?.[addonName] || 0
      const variants = updatedItem.addonVariants?.[addonName] || {}
      const addonSize = variants.size || "M"
      const addonCold = variants.cold || "without_ice"
      const addonSpicy = variants.spicy || false
      const addonSizePrice = addon?.size?.enabled
        ? addonSize === "S"
          ? addon.size.small_price || addonBasePrice - 10 || 0
          : addonSize === "L"
            ? addon.size.large_price || addonBasePrice + 10 || 0
            : addon.size.medium_price || addonBasePrice || 0
        : addonBasePrice || 0
      const addonIcePrice = addon?.cold?.enabled && addonCold === 'with_ice' ? addon.cold.ice_price || 0 : 0
      const addonSpicyPrice = addon?.spicy?.enabled && addonSpicy ? addon.spicy.spicy_price || 30 : 0
      const addonCustomPrice = addonCustomVariantsDetails[addonName]
        ? Object.entries(addonCustomVariantsDetails[addonName]).reduce((sum, [vName, variant]) => {
          const vQty = Number(addonCustomVariantsQuantities?.[addonName]?.[vName]) || 1
          return sum + (variant.price || 0) * vQty
        }, 0)
        : 0
      const addonIceQty = Number(addonIceQuantities[addonName]) || 1
      const addonSpicyQty = Number(addonSpicyQuantities[addonName]) || 1
      const qty = Number(updatedItem.addonQuantities[addonName]) || 1
      const exclTotal = (addonSizePrice * qty) + (addonIcePrice * addonIceQty) + (addonSpicyPrice * addonSpicyQty) + addonCustomPrice
      const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
      const tax = effectiveAddonTaxRate > 0 ? exclTotal * (effectiveAddonTaxRate / 100) : 0
      addonTaxTotal += tax
      addonExclTotal += exclTotal
      addonTaxes[addonName] = tax
      addonTaxRates[addonName] = effectiveAddonTaxRate
      addonInclPrices[addonName] = exclTotal + tax
      addonExclTotals[addonName] = exclTotal
      addonVariants[addonName] = {
        ...variants,
        size: addonSize,
        cold: addonCold,
        spicy: addonSpicy,
        kitchen: addon?.kitchen || "Main Kitchen",
        sugar: variants.sugar || "medium",
      }
      addonImages[addonName] = addon?.addon_image || addon?.image || "/static/images/default-addon-image.jpg"
      addonPrices[addonName] = addonSizePrice + (addonCustomPrice / qty) // Base price per unit for main row display
      addonSizePrices[addonName] = addonSizePrice
      addonIcePrices[addonName] = addonIcePrice
      addonSpicyPrices[addonName] = addonSpicyPrice
      if (tax > 0) {
        taxBreakdown[effectiveAddonTaxRate] = (taxBreakdown[effectiveAddonTaxRate] || 0) + tax;
      }
    })
    const comboVariants = {}
    const comboImages = {}
    const comboPrices = {}
    const comboSizePrices = {}
    const comboIcePrices = {}
    const comboIceQuantities = updatedItem.comboIceQuantities || {}
    const comboSpicyPrices = {}
    const comboSpicyQuantities = updatedItem.comboSpicyQuantities || {}
    const comboCustomVariantsDetails = updatedItem.comboCustomVariantsDetails || {}
    const comboCustomVariantsQuantities = updatedItem.comboCustomVariantsQuantities || {}
    const comboTaxes = {}
    const comboTaxRates = {}
    const comboInclPrices = {}
    const comboExclTotals = {}
    let comboTaxTotal = 0
    let comboExclTotal = 0
    Object.keys(updatedItem.comboQuantities || {}).forEach((comboName) => {
      const combo = menuItem?.combos.find((c) => c.name1 === comboName)
      const comboBasePrice = combo?.price || updatedItem.comboPrices?.[comboName] || 0
      const variants = updatedItem.comboVariants?.[comboName] || {}
      const comboSize = variants.size || "M"
      const comboCold = variants.cold || "without_ice"
      const comboSpicy = variants.spicy || false
      const comboSizePrice = combo?.size?.enabled
        ? comboSize === "S"
          ? combo.size.small_price || comboBasePrice - 10 || 0
          : comboSize === "L"
            ? combo.size.large_price || comboBasePrice + 10 || 0
            : combo.size.medium_price || comboBasePrice || 0
        : comboBasePrice || 0
      const comboIcePrice = combo?.cold?.enabled && comboCold === 'with_ice' ? combo.cold.ice_price || 0 : 0
      const comboSpicyPrice = combo?.spicy?.enabled && comboSpicy ? combo.spicy.spicy_price || 30 : 0
      const comboCustomPrice = comboCustomVariantsDetails[comboName]
        ? Object.entries(comboCustomVariantsDetails[comboName]).reduce((sum, [vName, variant]) => {
          const vQty = Number(comboCustomVariantsQuantities?.[comboName]?.[vName]) || 1
          return sum + (variant.price || 0) * vQty
        }, 0)
        : 0
      const comboIceQty = Number(comboIceQuantities[comboName]) || 1
      const comboSpicyQty = Number(comboSpicyQuantities[comboName]) || 1
      const qty = Number(updatedItem.comboQuantities[comboName]) || 1
      const exclTotal = (comboSizePrice * qty) + (comboIcePrice * comboIceQty) + (comboSpicyPrice * comboSpicyQty) + comboCustomPrice
      const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
      const tax = effectiveComboTaxRate > 0 ? exclTotal * (effectiveComboTaxRate / 100) : 0
      comboTaxTotal += tax
      comboExclTotal += exclTotal
      comboTaxes[comboName] = tax
      comboTaxRates[comboName] = effectiveComboTaxRate
      comboInclPrices[comboName] = exclTotal + tax
      comboExclTotals[comboName] = exclTotal
      comboVariants[comboName] = {
        ...variants,
        size: comboSize,
        cold: comboCold,
        spicy: comboSpicy,
        kitchen: combo?.kitchen || "Main Kitchen",
        sugar: variants.sugar || "medium",
      }
      comboImages[comboName] = combo?.combo_image || combo?.image || "/static/images/default-combo-image.jpg"
      comboPrices[comboName] = comboSizePrice + (comboCustomPrice / qty) // Base price per unit for main row display
      comboSizePrices[comboName] = comboSizePrice
      comboIcePrices[comboName] = comboIcePrice
      comboSpicyPrices[comboName] = comboSpicyPrice
      if (tax > 0) {
        taxBreakdown[effectiveComboTaxRate] = (taxBreakdown[effectiveComboTaxRate] || 0) + tax;
      }
    })
    const customVariantsDetails = {}
    const customVariantsQuantities = {}
    let customVariantsTotalPrice = 0
    if (updatedItem.selectedCustomVariants && Array.isArray(menuItem?.custom_variants)) {
      menuItem.custom_variants.forEach((variant) => {
        if (variant.enabled && Array.isArray(variant.subheadings)) {
          variant.subheadings.forEach((sub) => {
            if (updatedItem.selectedCustomVariants[sub.name]) {
              customVariantsDetails[sub.name] = { name: sub.name, price: sub.price || 0, heading: variant.heading }
              customVariantsQuantities[sub.name] = Number(updatedItem.customVariantsQuantities?.[sub.name]) || 1
              customVariantsTotalPrice += (sub.price || 0) * (Number(updatedItem.customVariantsQuantities?.[sub.name]) || 1)
            }
          })
        }
      })
    }
    const quantity = (existingItemIndex !== -1 && !selectedCartItem) ? cartItems[existingItemIndex].quantity + (Number(updatedItem.quantity) || 1) : (Number(updatedItem.quantity) || 1);

    // FIXED: Correctly extract preferences from either flattened props or variants object
    const effectiveIcePreference = updatedItem.icePreference || updatedItem.variants?.cold?.selected || updatedItem.variants?.cold?.icePreference || "without_ice";
    const effectiveIsSpicy = updatedItem.isSpicy || updatedItem.variants?.spicy?.selected || updatedItem.variants?.spicy?.isSpicy || false;

    const iceQty = Number(updatedItem.iceQuantity) || 1;
    const spicyQty = Number(updatedItem.spicyQuantity) || 1;

    const mainExclTotal = (finalBasePrice * quantity) + (icePrice * iceQty) + (spicyPrice * spicyQty) + customVariantsTotalPrice;
    const mainExclPerUnit = (finalBasePrice) + (icePrice * iceQty / quantity) + (spicyPrice * spicyQty / quantity) + (customVariantsTotalPrice / quantity); // Approximation for unit price display
    const mainTaxTotal = effectiveMainTaxRate > 0 ? mainExclTotal * (effectiveMainTaxRate / 100) : 0
    const mainTaxRate = effectiveMainTaxRate
    if (mainTaxTotal > 0) {
      taxBreakdown[effectiveMainTaxRate] = (taxBreakdown[effectiveMainTaxRate] || 0) + mainTaxTotal;
    }
    const totalExcl = mainExclTotal + addonExclTotal + comboExclTotal
    const totalTax = mainTaxTotal + addonTaxTotal + comboTaxTotal
    const cartItem = {
      ...updatedItem,
      id: existingItemIndex !== -1 ? cartItems[existingItemIndex].id : uuidv4(),
      name: updatedItem.item_name || "Unnamed Item",
      item_name: updatedItem.item_name,
      quantity,
      originalBasePrice: hasOffer ? originalBasePrice : null,
      basePrice: finalBasePrice,
      icePrice,
      spicyPrice,
      iceQuantity: Number(updatedItem.iceQuantity) || 1,
      spicyQuantity: Number(updatedItem.spicyQuantity) || 1,
      sugarLevel: updatedItem.sugarLevel || "medium",
      totalPrice: totalExcl + totalTax,
      exclTotal: totalExcl,
      taxTotal: totalTax,
      taxBreakdown,
      mainExclTotal,
      mainTaxTotal,
      mainTaxRate,
      mainExclPerUnit,
      addonExclTotal,
      comboExclTotal,
      addonTaxes,
      addonTaxRates,
      addonInclPrices,
      comboTaxes,
      comboTaxRates,
      comboInclPrices,
      addonQuantities: updatedItem.addonQuantities || {},
      addonVariants,
      addonPrices,
      addonSizePrices,
      addonIcePrices,
      addonIceQuantities,
      addonSpicyPrices,
      addonSpicyQuantities,
      addonCustomVariantsQuantities,
      addonImages,
      comboQuantities: updatedItem.comboQuantities || {},
      comboVariants,
      comboPrices,
      comboSizePrices,
      comboIcePrices,
      comboIceQuantities,
      comboSpicyPrices,
      comboSpicyQuantities,
      comboCustomVariantsQuantities,
      comboImages,
      selectedCombos: updatedItem.selectedCombos || [],
      selectedSize: updatedSelectedSize,
      icePreference: effectiveIcePreference,
      isSpicy: effectiveIsSpicy,
      sugarLevel: updatedItem.variants?.sugar?.selected || updatedItem.variants?.sugar?.level || menuItem?.sugar?.level || "medium",
      kitchen: updatedItem.kitchen || "Main Kitchen",
      ingredients: updatedItem.ingredients || [],
      selectedCustomVariants: updatedItem.selectedCustomVariants || {},
      customVariantsDetails,
      customVariantsQuantities,
      status: "Pending",
      served: false,
      image: menuItem?.image || "/static/images/default-item.jpg",
      kitchenStatuses: existingItemIndex !== -1 ? cartItems[existingItemIndex].kitchenStatuses : {},
      kitchenNotes: updatedItem.kitchenNotes || {},
    }
    if (existingItemIndex !== -1) {
      setCartItems((prevItems) => {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = cartItem
        return updatedItems
      })
      setBillCartItems((prevItems) => {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = cartItem
        return updatedItems
      })
    } else {
      setCartItems((prevItems) => [...prevItems, cartItem])
      setBillCartItems((prevItems) => [...prevItems, cartItem])
    }
    setSelectedItem(null)
    setSelectedCartItem(null)
  }
  const handleQuantityChange = (itemId, value, type, name) => {
    const newQty = Math.max(1, Number.parseInt(value) || 1)
    const updateItems = (prevItems) =>
      prevItems.map((cartItem) => {
        if (cartItem.id === itemId) {
          let updatedItem = { ...cartItem }
          if (cartItem.isCombo) {
            const exclPerUnit = cartItem.basePrice || 0
            const exclTotal = exclPerUnit * newQty
            const taxTotal = cartItem.tax_applicable ? exclTotal * (cartItem.tax_rate / 100) : 0
            updatedItem = {
              ...updatedItem,
              quantity: newQty,
              exclTotal,
              taxTotal,
              totalPrice: exclTotal + taxTotal,
              mainTaxTotal: taxTotal,
            }
            return updatedItem;
          }
          if (type === "item") {
            // FIXED: Decouple Ice and Spicy from quantity scaling
            const basePrice = updatedItem.basePrice || 0
            const customVariantsTotalPrice = Object.values(updatedItem.customVariantsDetails || {}).reduce((sum, v) => sum + (v.price || 0) * (updatedItem.customVariantsQuantities?.[v.name] || 1), 0)
            const mainExclTotalNew = (basePrice * newQty) + (updatedItem.icePrice * (updatedItem.iceQuantity || 1)) + (updatedItem.spicyPrice * (updatedItem.spicyQuantity || 1)) + customVariantsTotalPrice;
            const mainTaxTotalNew = updatedItem.mainTaxRate > 0 ? mainExclTotalNew * (updatedItem.mainTaxRate / 100) : 0
            const deltaMainExcl = mainExclTotalNew - (updatedItem.mainExclTotal || 0)
            const deltaMainTax = mainTaxTotalNew - (updatedItem.mainTaxTotal || 0)
            updatedItem = {
              ...updatedItem,
              quantity: newQty,
              mainExclTotal: mainExclTotalNew,
              mainTaxTotal: mainTaxTotalNew,
              exclTotal: (updatedItem.exclTotal || 0) + deltaMainExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaMainTax,
              totalPrice: updatedItem.totalPrice + deltaMainExcl + deltaMainTax,
            }
          } else if (type === "addon" && name) {
            // Recalculate for this addon
            const addon = menuItems.find(m => m.addons?.some(a => a.name1 === name))?.addons.find(a => a.name1 === name)
            const oldQty = Number(updatedItem.addonQuantities[name]) || 1
            const addonSizePrice = updatedItem.addonSizePrices?.[name] || 0
            const addonIcePrice = updatedItem.addonIcePrices?.[name] || 0
            const addonSpicyPrice = updatedItem.addonSpicyPrices?.[name] || 0
            const addonIceQty = Number(updatedItem.addonIceQuantities?.[name]) || 1
            const addonSpicyQty = Number(updatedItem.addonSpicyQuantities?.[name]) || 1
            const addonCustomPrice = Object.entries(updatedItem.addonCustomVariantsDetails?.[name] || {}).reduce((sum, [vName, v]) => sum + (v.price || 0) * (updatedItem.addonCustomVariantsQuantities?.[name]?.[vName] || 1), 0)

            const oldExcl = (addonSizePrice * oldQty) + (addonIcePrice * addonIceQty) + (addonSpicyPrice * addonSpicyQty) + addonCustomPrice
            const newExcl = (addonSizePrice * newQty) + (addonIcePrice * addonIceQty) + (addonSpicyPrice * addonSpicyQty) + addonCustomPrice

            const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
            const oldTax = effectiveAddonTaxRate > 0 ? oldExcl * (effectiveAddonTaxRate / 100) : 0
            const newTax = effectiveAddonTaxRate > 0 ? newExcl * (effectiveAddonTaxRate / 100) : 0
            const deltaExcl = newExcl - oldExcl
            const deltaTax = newTax - oldTax
            updatedItem = {
              ...updatedItem,
              addonQuantities: { ...updatedItem.addonQuantities, [name]: newQty },
              addonTaxes: { ...updatedItem.addonTaxes, [name]: newTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: updatedItem.totalPrice + deltaExcl + deltaTax,
            }
          } else if (type === "combo" && name) {
            // Similar for combo
            const combo = menuItems.find(m => m.combos?.some(c => c.name1 === name))?.combos.find(c => c.name1 === name)
            const oldQty = Number(updatedItem.comboQuantities[name]) || 1
            const comboSizePrice = updatedItem.comboSizePrices?.[name] || 0
            const comboIcePrice = updatedItem.comboIcePrices?.[name] || 0
            const comboSpicyPrice = updatedItem.comboSpicyPrices?.[name] || 0
            const comboIceQty = Number(updatedItem.comboIceQuantities?.[name]) || 1
            const comboSpicyQty = Number(updatedItem.comboSpicyQuantities?.[name]) || 1
            const comboCustomPrice = Object.entries(updatedItem.comboCustomVariantsDetails?.[name] || {}).reduce((sum, [vName, v]) => sum + (v.price || 0) * (updatedItem.comboCustomVariantsQuantities?.[name]?.[vName] || 1), 0)

            const oldExcl = (comboSizePrice * oldQty) + (comboIcePrice * comboIceQty) + (comboSpicyPrice * comboSpicyQty) + comboCustomPrice
            const newExcl = (comboSizePrice * newQty) + (comboIcePrice * comboIceQty) + (comboSpicyPrice * comboSpicyQty) + comboCustomPrice

            const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
            const oldTax = effectiveComboTaxRate > 0 ? oldExcl * (effectiveComboTaxRate / 100) : 0
            const newTax = effectiveComboTaxRate > 0 ? newExcl * (effectiveComboTaxRate / 100) : 0
            const deltaExcl = newExcl - oldExcl
            const deltaTax = newTax - oldTax
            updatedItem = {
              ...updatedItem,
              comboQuantities: { ...updatedItem.comboQuantities, [name]: newQty },
              comboTaxes: { ...updatedItem.comboTaxes, [name]: newTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: updatedItem.totalPrice + deltaExcl + deltaTax,
            }
          } else if (type === "customVariant" && name) {
            // Recalculate custom total
            const customVariantsTotalPrice = Object.entries(updatedItem.customVariantsDetails || {}).reduce(
              (sum, [variantName, variant]) =>
                sum +
                (variant.price || 0) *
                (variantName === name ? newQty : updatedItem.customVariantsQuantities?.[variantName] || 1),
              0,
            )
            const mainExclTotalNew = (updatedItem.basePrice * updatedItem.quantity) + (updatedItem.icePrice * (updatedItem.iceQuantity || 1)) + (updatedItem.spicyPrice * (updatedItem.spicyQuantity || 1)) + customVariantsTotalPrice;
            const mainTaxTotalNew = updatedItem.mainTaxRate > 0 ? mainExclTotalNew * (updatedItem.mainTaxRate / 100) : 0
            const deltaMainExcl = mainExclTotalNew - (updatedItem.mainExclTotal || 0)
            const deltaMainTax = mainTaxTotalNew - (updatedItem.mainTaxTotal || 0)
            updatedItem = {
              ...updatedItem,
              customVariantsQuantities: { ...updatedItem.customVariantsQuantities, [name]: newQty },
              mainExclTotal: mainExclTotalNew,
              mainTaxTotal: mainTaxTotalNew,
              exclTotal: (updatedItem.exclTotal || 0) + deltaMainExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaMainTax,
              totalPrice: updatedItem.totalPrice + deltaMainExcl + deltaMainTax,
            }
          } else if (type === "ice") {
            const oldIceQty = Number(updatedItem.iceQuantity) || 1
            const icePrice = updatedItem.icePrice || 0
            const deltaExcl = icePrice * (Number(newQty) - oldIceQty)
            const deltaTax = (updatedItem.mainTaxRate || 0) > 0 ? deltaExcl * (updatedItem.mainTaxRate / 100) : 0
            updatedItem = {
              ...updatedItem,
              iceQuantity: Number(newQty),
              mainExclTotal: (updatedItem.mainExclTotal || 0) + deltaExcl,
              mainTaxTotal: (updatedItem.mainTaxTotal || 0) + deltaTax,
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "spicy") {
            const oldSpicyQty = Number(updatedItem.spicyQuantity) || 1
            const spicyPrice = updatedItem.spicyPrice || 0
            const deltaExcl = spicyPrice * (Number(newQty) - oldSpicyQty)
            const deltaTax = (updatedItem.mainTaxRate || 0) > 0 ? deltaExcl * (updatedItem.mainTaxRate / 100) : 0
            updatedItem = {
              ...updatedItem,
              spicyQuantity: Number(newQty),
              mainExclTotal: (updatedItem.mainExclTotal || 0) + deltaExcl,
              mainTaxTotal: (updatedItem.mainTaxTotal || 0) + deltaTax,
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "addonIce" && name) {
            const oldIceQty = Number(updatedItem.addonIceQuantities?.[name]) || 1
            const icePrice = updatedItem.addonIcePrices?.[name] || 0
            const deltaExcl = icePrice * (Number(newQty) - oldIceQty)
            const addon = menuItems.find(m => m.addons?.some(a => a.name1 === name))?.addons.find(a => a.name1 === name)
            const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
            const deltaTax = effectiveAddonTaxRate > 0 ? deltaExcl * (effectiveAddonTaxRate / 100) : 0
            updatedItem = {
              ...updatedItem,
              addonIceQuantities: { ...updatedItem.addonIceQuantities, [name]: Number(newQty) },
              addonTaxes: { ...updatedItem.addonTaxes, [name]: (updatedItem.addonTaxes?.[name] || 0) + deltaTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "addonSpicy" && name) {
            const oldSpicyQty = Number(updatedItem.addonSpicyQuantities?.[name]) || 1
            const spicyPrice = updatedItem.addonSpicyPrices?.[name] || 0
            const deltaExcl = spicyPrice * (Number(newQty) - oldSpicyQty)
            const addon = menuItems.find(m => m.addons?.some(a => a.name1 === name))?.addons.find(a => a.name1 === name)
            const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
            const deltaTax = effectiveAddonTaxRate > 0 ? deltaExcl * (effectiveAddonTaxRate / 100) : 0
            updatedItem = {
              ...updatedItem,
              addonSpicyQuantities: { ...updatedItem.addonSpicyQuantities, [name]: Number(newQty) },
              addonTaxes: { ...updatedItem.addonTaxes, [name]: (updatedItem.addonTaxes?.[name] || 0) + deltaTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "comboIce" && name) {
            const oldIceQty = Number(updatedItem.comboIceQuantities?.[name]) || 1
            const icePrice = updatedItem.comboIcePrices?.[name] || 0
            const deltaExcl = icePrice * (Number(newQty) - oldIceQty)
            const combo = menuItems.find(m => m.combos?.some(c => c.name1 === name))?.combos.find(c => c.name1 === name)
            const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
            const deltaTax = effectiveComboTaxRate > 0 ? deltaExcl * (effectiveComboTaxRate / 100) : 0
            updatedItem = {
              ...updatedItem,
              comboIceQuantities: { ...updatedItem.comboIceQuantities, [name]: Number(newQty) },
              comboTaxes: { ...updatedItem.comboTaxes, [name]: (updatedItem.comboTaxes?.[name] || 0) + deltaTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "comboSpicy" && name) {
            const oldSpicyQty = Number(updatedItem.comboSpicyQuantities?.[name]) || 1
            const spicyPrice = updatedItem.comboSpicyPrices?.[name] || 0
            const deltaExcl = spicyPrice * (Number(newQty) - oldSpicyQty)
            const combo = menuItems.find(m => m.combos?.some(c => c.name1 === name))?.combos.find(c => c.name1 === name)
            const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
            const deltaTax = effectiveComboTaxRate > 0 ? deltaExcl * (effectiveComboTaxRate / 100) : 0
            updatedItem = {
              ...updatedItem,
              comboSpicyQuantities: { ...updatedItem.comboSpicyQuantities, [name]: Number(newQty) },
              comboTaxes: { ...updatedItem.comboTaxes, [name]: (updatedItem.comboTaxes?.[name] || 0) + deltaTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "addonCustomVariant" && name) {
            const [addonName, variantName] = name.split("|")
            const oldQty = Number(updatedItem.addonCustomVariantsQuantities?.[addonName]?.[variantName]) || 1
            const variant = updatedItem.addonCustomVariantsDetails?.[addonName]?.[variantName]
            const variantPrice = variant?.price || 0
            const deltaExcl = variantPrice * (Number(newQty) - oldQty)
            const addon = menuItems.find(m => m.addons?.some(a => a.name1 === addonName))?.addons.find(a => a.name1 === addonName)
            const effectiveAddonTaxRate = getEffectiveTaxRate(addon?.tax_applicable, addon?.tax_rate, true);
            const deltaTax = effectiveAddonTaxRate > 0 ? deltaExcl * (effectiveAddonTaxRate / 100) : 0

            const newAddonCustomQuantities = { ...updatedItem.addonCustomVariantsQuantities }
            newAddonCustomQuantities[addonName] = { ...newAddonCustomQuantities[addonName], [variantName]: Number(newQty) }

            updatedItem = {
              ...updatedItem,
              addonCustomVariantsQuantities: newAddonCustomQuantities,
              addonTaxes: { ...updatedItem.addonTaxes, [addonName]: (updatedItem.addonTaxes?.[addonName] || 0) + deltaTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          } else if (type === "comboCustomVariant" && name) {
            const [comboName, variantName] = name.split("|")
            const oldQty = Number(updatedItem.comboCustomVariantsQuantities?.[comboName]?.[variantName]) || 1
            const variant = updatedItem.comboCustomVariantsDetails?.[comboName]?.[variantName]
            const variantPrice = variant?.price || 0
            const deltaExcl = variantPrice * (Number(newQty) - oldQty)
            const combo = menuItems.find(m => m.combos?.some(c => c.name1 === comboName))?.combos.find(c => c.name1 === comboName)
            const effectiveComboTaxRate = getEffectiveTaxRate(combo?.tax_applicable, combo?.tax_rate, false, true);
            const deltaTax = effectiveComboTaxRate > 0 ? deltaExcl * (effectiveComboTaxRate / 100) : 0

            const newComboCustomQuantities = { ...updatedItem.comboCustomVariantsQuantities }
            newComboCustomQuantities[comboName] = { ...newComboCustomQuantities[comboName], [variantName]: Number(newQty) }

            updatedItem = {
              ...updatedItem,
              comboCustomVariantsQuantities: newComboCustomQuantities,
              comboTaxes: { ...updatedItem.comboTaxes, [comboName]: (updatedItem.comboTaxes?.[comboName] || 0) + deltaTax },
              exclTotal: (updatedItem.exclTotal || 0) + deltaExcl,
              taxTotal: (updatedItem.taxTotal || 0) + deltaTax,
              totalPrice: (updatedItem.totalPrice || 0) + deltaExcl + deltaTax,
            }
          }
          return updatedItem
        }
        return cartItem
      })
    setCartItems(updateItems)
    setBillCartItems(updateItems)
  }
  const getAddonsTotal = (item) => {
    if (!item.addonQuantities || !item.addonPrices) return 0
    return Object.entries(item.addonQuantities).reduce((sum, [addonName, qty]) => {
      const price = item.addonPrices[addonName] || 0
      return sum + price * (Number(qty) || 1) // FIXED: Explicit Number() || 1
    }, 0)
  }
  const getCombosTotal = (item) => {
    if (!item.comboQuantities || !item.comboPrices) return 0
    return Object.entries(item.comboQuantities).reduce((sum, [comboName, qty]) => {
      const price = item.comboPrices[comboName] || 0
      return sum + price * (Number(qty) || 1) // FIXED: Explicit Number() || 1
    }, 0)
  }
  const getCustomVariantsTotal = (item) => {
    if (!item.customVariantsDetails || !item.customVariantsQuantities) return 0
    return Object.entries(item.customVariantsDetails).reduce((sum, [variantName, variant]) => {
      const qty = Number(item.customVariantsQuantities[variantName]) || 1 // FIXED: Explicit Number() || 1
      return sum + (variant.price || 0) * qty
    }, 0)
  }
  const getMainItemTotal = (item) => {
    if (item.isCombo) {
      return (item.basePrice || 0) * (Number(item.quantity) || 1) // FIXED: Explicit Number()
    }
    // Return only the base price for the main row display to avoid double-counting with separate option rows
    const mainItemPrice = Number(item.basePrice) || 0
    return mainItemPrice * (Number(item.quantity) || 1)
  }
  const getOriginalMainItemTotal = (item) => {
    if (item.originalBasePrice) {
      return (Number(item.originalBasePrice) || 0) * (Number(item.quantity) || 1)
    }
    return getMainItemTotal(item)
  }
  // UPDATED: Excl total calculation
  const calculateExclTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.exclTotal || 0), 0)
  }
  // UPDATED: Tax total calculation
  const calculateTaxTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.taxTotal || 0), 0)
  }
  // UPDATED: VAT by rate
  const getVatByRate = (items) => {
    const byRate = {};
    items.forEach(item => {
      if (item.taxBreakdown) {
        Object.entries(item.taxBreakdown).forEach(([rate, amt]) => {
          byRate[rate] = (byRate[rate] || 0) + amt;
        });
      }
    });
    return byRate;
  }
  const removeFromCart = (item) => {
    setCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.id !== item.id))
    setBillCartItems((prevItems) => prevItems.filter((cartItem) => cartItem.id !== item.id))
  }

  // NEW: Variant Selection Sidebar Component
  const VariantSidePanel = ({ item, cartItem, onClose }) => {
    if (!item) return null;

    const [localVariants, setLocalVariants] = useState({
      sizes: cartItem?.selectedSize ? [cartItem.selectedSize] : [item.splitSize || "M"],
      cold: cartItem?.icePreference || item.icePreference || "without_ice",
      spicy: cartItem?.isSpicy ?? item.isSpicy ?? false,
      sugar: cartItem?.sugarLevel || item.sugarLevel || "medium",
      customVariants: { ...(cartItem?.customVariantsQuantities || item.customVariantsQuantities || {}) }
    });

    const handleToggleCustom = (vName) => {
      setLocalVariants(prev => ({
        ...prev,
        customVariants: {
          ...prev.customVariants,
          [vName]: prev.customVariants[vName] ? 0 : 1
        }
      }));
    };

    const handleAddToCartFromSide = () => {
      const selectedSizes = Array.isArray(localVariants.sizes) ? localVariants.sizes : [localVariants.sizes];

      if (selectedSizes.length === 0) {
        setWarningMessage("Please select at least one size.");
        setWarningType("warning");
        return;
      }

      selectedSizes.forEach((size, index) => {
        handleItemUpdate({
          ...item,
          id: (cartItem && index === 0) ? cartItem.id : undefined, // First size overwrites the edited item.
          quantity: cartItem ? cartItem.quantity : 1, // Retain quantity
          isPOSGrid: true,
          selectedSize: size,
          icePreference: localVariants.cold,
          isSpicy: localVariants.spicy,
          sugarLevel: localVariants.sugar,
          customVariantsQuantities: localVariants.customVariants,
          selectedCustomVariants: localVariants.customVariants, // Truthy values trigger selection
          variants: {
            size: { selected: size },
            cold: { selected: localVariants.cold },
            spicy: { selected: localVariants.spicy },
            sugar: { level: localVariants.sugar }
          }
        }, index > 0); // Force add as new item for 2nd, 3rd sizes etc.
      });

      setWarningMessage(`${item.item_name || item.name} ${cartItem ? 'updated' : 'added'}!`);
      setWarningType("success");
      onClose();
    };

    return (
      <div className={`pos-variant-sidebar ${posDesign === 'design2' ? 'design2-variant-modal' : ''}`}>
        <div className="pos-variant-sidebar-header">
          <div className="pos-variant-sidebar-item-info">
            <h4>{item.item_name || item.name}</h4>
            {posDesign !== 'design2' && (
              <div className="price">{formatPrice(item.displayPrice || item.basePrice)}</div>
            )}
          </div>
          <button className="pos-variant-sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pos-variant-sidebar-content">
          {/* Sizes */}
          {item.size?.enabled && (
            <div className="pos-variant-group">
              <span className="pos-variant-group-title">{posDesign === 'design2' ? 'Variation' : 'Select Size'}</span>
              <div className={`pos-variant-options ${posDesign === 'design2' ? 'design2-size-options' : ''}`}>
                {["S", "M", "L"].map(s => {
                  const sPrice = s === "S" ? item.size.small_price : s === "L" ? item.size.large_price : item.size.medium_price;
                  const label = s === "S" ? "Small" : s === "M" ? "Medium" : "Large";
                  const toggleSize = () => {
                    setLocalVariants(p => {
                      const newSizes = p.sizes.includes(s)
                        ? p.sizes.filter(size => size !== s)
                        : [...p.sizes, s];
                      return { ...p, sizes: newSizes.length ? newSizes : [s] }; // Ensure at least 1 size selected
                    });
                  };

                  if (posDesign === 'design2') {
                    return (
                      <div className="design2-size-col" key={s}>
                        <button
                          className={`design2-size-name-btn ${localVariants.sizes.includes(s) ? 'active' : ''}`}
                          onClick={toggleSize}
                        >
                          {label}
                        </button>
                        <button
                          className={`design2-size-price-btn ${localVariants.sizes.includes(s) ? 'active' : ''}`}
                          onClick={toggleSize}
                        >
                          {formatPrice(sPrice)}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={s}
                      className={`${posDesign === 'design2' ? 'design2-size-btn' : 'pos-variant-option-btn'} ${localVariants.sizes.includes(s) ? 'active' : ''}`}
                      onClick={toggleSize}
                    >
                      {label} ({formatPrice(sPrice)})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preferences */}
          {(item.cold?.enabled || item.spicy?.enabled) && (
            <div className="pos-variant-group">
              <span className="pos-variant-group-title">{posDesign === 'design2' ? 'Preferences' : 'Preferences'}</span>
              <div className={`pos-variant-options ${posDesign === 'design2' ? 'design2-topping-options' : ''}`}>
                {item.cold?.enabled && (
                  <button
                    className={`${posDesign === 'design2' ? 'design2-topping-btn' : 'pos-variant-option-btn'} ${localVariants.cold === 'with_ice' ? 'active' : ''}`}
                    onClick={() => setLocalVariants(p => ({ ...p, cold: p.cold === 'with_ice' ? 'without_ice' : 'with_ice' }))}
                  >
                    {posDesign === 'design2' ? (
                      <span>Ice ({formatPrice(item.cold.ice_price || 0)})</span>
                    ) : (
                      <div className="d-flex flex-column align-items-center">
                        <span><IceCream size={16} /> Ice</span>
                        <small>+{formatPrice(item.cold.ice_price || 0)}</small>
                      </div>
                    )}
                  </button>
                )}
                {item.spicy?.enabled && (
                  <button
                    className={`${posDesign === 'design2' ? 'design2-topping-btn' : 'pos-variant-option-btn'} ${localVariants.spicy ? 'active' : ''}`}
                    onClick={() => setLocalVariants(p => ({ ...p, spicy: !p.spicy }))}
                  >
                    {posDesign === 'design2' ? (
                      <span>Spicy ({formatPrice(item.spicy.spicy_price || 0)})</span>
                    ) : (
                      <div className="d-flex flex-column align-items-center">
                        <span><Flame size={16} /> Spicy</span>
                        <small>+{formatPrice(item.spicy.spicy_price || 0)}</small>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sugar Level */}
          {item.sugar?.enabled && (
            <div className="pos-variant-group">
              <span className="pos-variant-group-title">{posDesign === 'design2' ? 'Sugar Level' : 'Sugar Level'}</span>
              <div className={`pos-variant-options ${posDesign === 'design2' ? 'design2-topping-options' : ''}`}>
                {['no_sugar', 'low', 'medium', 'high'].map((level) => {
                  const levelLabel = level.replace('_', ' ').charAt(0).toUpperCase() + level.replace('_', ' ').slice(1);
                  return (
                    <button
                      key={level}
                      className={`${posDesign === 'design2' ? 'design2-topping-btn' : 'pos-variant-option-btn'} ${localVariants.sugar === level ? 'active' : ''}`}
                      onClick={() => setLocalVariants(p => ({ ...p, sugar: level }))}
                    >
                      <span>{levelLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Variants */}
          {item.custom_variants && item.custom_variants.length > 0 && (
            <div className="pos-variant-group">
              <span className="pos-variant-group-title">{posDesign === 'design2' ? 'Toppings' : 'Flavours / Add-ons'}</span>
              <div className="pos-variant-options scrollable-options">
                {item.custom_variants.map((v) => (
                  v.enabled && (
                    <div key={v.heading} className="w-100">
                      {posDesign !== 'design2' && <small className="text-muted mb-2 d-block">{v.heading}</small>}
                      <div className={`pos-variant-options mb-3 ${posDesign === 'design2' ? 'design2-topping-options' : ''}`}>
                        {v.subheadings.map(sub => (
                          <button
                            key={sub.name}
                            className={`${posDesign === 'design2' ? 'design2-topping-btn' : 'pos-variant-option-btn'} ${localVariants.customVariants[sub.name] > 0 ? 'active' : ''}`}
                            onClick={() => handleToggleCustom(sub.name)}
                          >
                            {posDesign === 'design2' ? (
                              <span>{sub.name} ({formatPrice(sub.price || 0)})</span>
                            ) : (
                              <>
                                <span>{sub.name}</span>
                                <small>{formatPrice(sub.price || 0)}</small>
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`pos-variant-sidebar-footer ${posDesign === 'design2' ? 'design2-modal-footer' : ''}`}>
          {posDesign === 'design2' ? (
            <div className="design2-footer-content">
              <div className="design2-total-price">
                {/* Basic price calculation for display */}
                {(() => {
                  let calcPrice = Number(item.basePrice || item.displayPrice || item.price_list_rate || 0);
                  if (item.size?.enabled) {
                    if (localVariants.size === "S") calcPrice = Number(item.size?.small_price || 0);
                    else if (localVariants.size === "L") calcPrice = Number(item.size?.large_price || 0);
                    else calcPrice = Number(item.size?.medium_price || 0);
                  }

                  calcPrice += (localVariants.cold === 'with_ice' ? Number(item.cold?.ice_price || 0) : 0);
                  calcPrice += (localVariants.spicy ? Number(item.spicy?.spicy_price || 0) : 0);

                  calcPrice += Object.keys(localVariants.customVariants).reduce((sum, cvName) => {
                    if (localVariants.customVariants[cvName] > 0) {
                      let p = 0;
                      item.custom_variants?.forEach(v => v.subheadings?.forEach(sub => { if (sub.name === cvName) p = Number(sub.price || 0); }));
                      return sum + p;
                    }
                    return sum;
                  }, 0);

                  return formatPrice(calcPrice);
                })()}
              </div>
              <div className="design2-footer-actions">
                <button className="design2-cancel-btn" onClick={onClose}>Cancel</button>
                <button className="design2-save-btn" onClick={handleAddToCartFromSide}>Save</button>
              </div>
            </div>
          ) : (
            <button className="pos-variant-add-btn" onClick={handleAddToCartFromSide}>
              <ShoppingCart size={20} /> {cartItem ? 'UPDATE CART' : 'ADD TO CART'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const removeAddonOrCombo = (itemId, type, name) => {
    const updateItems = (prevItems) =>
      prevItems.map((cartItem) => {
        if (cartItem.id === itemId) {
          let updatedItem = { ...cartItem }
          if (type === "addon") {
            const oldQty = Number(updatedItem.addonQuantities[name]) || 1
            const exclPerUnit = updatedItem.addonPrices[name] || 0
            const oldExcl = exclPerUnit * oldQty
            const oldTax = updatedItem.addonTaxes[name] || 0
            const { [name]: _, ...remainingAddons } = updatedItem.addonQuantities || {}
            const { [name]: __, ...remainingAddonVariants } = updatedItem.addonVariants || {}
            const { [name]: ___, ...remainingAddonPrices } = updatedItem.addonPrices || {}
            const { [name]: ____, ...remainingAddonImages } = updatedItem.addonImages || {}
            const { [name]: _____, ...remainingAddonSizePrices } = updatedItem.addonSizePrices || {}
            const { [name]: ______, ...remainingAddonIcePrices } = updatedItem.addonIcePrices || {}
            const { [name]: _______, ...remainingAddonSpicyPrices } = updatedItem.addonSpicyPrices || {}
            const { [name]: ________, ...remainingAddonTaxes } = updatedItem.addonTaxes || {}
            const { [name]: _________, ...remainingAddonTaxRates } = updatedItem.addonTaxRates || {}
            const { [name]: __________, ...remainingAddonInclPrices } = updatedItem.addonInclPrices || {}
            updatedItem = {
              ...updatedItem,
              addonQuantities: remainingAddons,
              addonVariants: remainingAddonVariants,
              addonPrices: remainingAddonPrices,
              addonSizePrices: remainingAddonSizePrices,
              addonIcePrices: remainingAddonIcePrices,
              addonSpicyPrices: remainingAddonSpicyPrices,
              addonImages: remainingAddonImages,
              addonTaxes: remainingAddonTaxes,
              addonTaxRates: remainingAddonTaxRates,
              addonInclPrices: remainingAddonInclPrices,
              addonCustomVariantsDetails: { ...updatedItem.addonCustomVariantsDetails, [name]: {} },
              exclTotal: updatedItem.exclTotal - oldExcl,
              taxTotal: updatedItem.taxTotal - oldTax,
              totalPrice: updatedItem.totalPrice - oldExcl - oldTax,
            }
          } else if (type === "combo") {
            const oldQty = Number(updatedItem.comboQuantities[name]) || 1
            const exclPerUnit = updatedItem.comboPrices[name] || 0
            const oldExcl = exclPerUnit * oldQty
            const oldTax = updatedItem.comboTaxes[name] || 0
            const { [name]: _, ...remainingCombos } = updatedItem.comboQuantities || {}
            const { [name]: __, ...remainingComboVariants } = updatedItem.comboVariants || {}
            const { [name]: ___, ...remainingComboPrices } = updatedItem.comboPrices || {}
            const { [name]: ____, ...remainingComboImages } = updatedItem.comboImages || {}
            const { [name]: _____, ...remainingComboSizePrices } = updatedItem.comboSizePrices || {}
            const { [name]: ______, ...remainingComboIcePrices } = updatedItem.comboIcePrices || {}
            const { [name]: _______, ...remainingComboSpicyPrices } = updatedItem.comboSpicyPrices || {}
            const { [name]: ________, ...remainingComboTaxes } = updatedItem.comboTaxes || {}
            const { [name]: _________, ...remainingComboTaxRates } = updatedItem.comboTaxRates || {}
            const { [name]: __________, ...remainingComboInclPrices } = updatedItem.comboInclPrices || {}
            updatedItem = {
              ...updatedItem,
              comboQuantities: remainingCombos,
              comboVariants: remainingComboVariants,
              comboPrices: remainingComboPrices,
              comboSizePrices: remainingComboSizePrices,
              comboIcePrices: remainingComboIcePrices,
              comboSpicyPrices: remainingComboSpicyPrices,
              comboImages: remainingComboImages,
              comboTaxes: remainingComboTaxes,
              comboTaxRates: remainingComboTaxRates,
              comboInclPrices: remainingComboInclPrices,
              selectedCombos: updatedItem.selectedCombos.filter((combo) => combo.name1 !== name),
              comboCustomVariantsDetails: { ...updatedItem.comboCustomVariantsDetails, [name]: {} },
              exclTotal: updatedItem.exclTotal - oldExcl,
              taxTotal: updatedItem.taxTotal - oldTax,
              totalPrice: updatedItem.totalPrice - oldExcl - oldTax,
            }
          }
          return updatedItem
        }
        return cartItem
      })
    setCartItems(updateItems)
    setBillCartItems(updateItems)
  }
  const removeCustomVariant = (itemId, variantName) => {
    const updateItems = (prevItems) =>
      prevItems.map((cartItem) => {
        if (cartItem.id === itemId) {
          const { [variantName]: _, ...remainingCustomVariants } = cartItem.selectedCustomVariants || {}
          const { [variantName]: __, ...remainingCustomVariantsDetails } = cartItem.customVariantsDetails || {}
          const { [variantName]: ___, ...remainingCustomVariantsQuantities } = cartItem.customVariantsQuantities || {}
          const customVariantsTotalPrice = Object.entries(remainingCustomVariantsDetails).reduce(
            (sum, [vName, variant]) => sum + (variant.price || 0) * (remainingCustomVariantsQuantities[vName] || 1),
            0,
          )
          const mainExclPerUnitNew = (cartItem.basePrice || 0) + (cartItem.icePrice || 0) + (cartItem.spicyPrice || 0) + customVariantsTotalPrice
          const mainExclTotalNew = mainExclPerUnitNew * cartItem.quantity
          const mainTaxTotalNew = cartItem.mainTaxRate > 0 ? mainExclTotalNew * (cartItem.mainTaxRate / 100) : 0
          const deltaMainExcl = mainExclTotalNew - cartItem.mainExclTotal
          const deltaMainTax = mainTaxTotalNew - cartItem.mainTaxTotal
          return {
            ...cartItem,
            selectedCustomVariants: remainingCustomVariants,
            customVariantsDetails: remainingCustomVariantsDetails,
            customVariantsQuantities: remainingCustomVariantsQuantities,
            mainExclTotal: mainExclTotalNew,
            mainTaxTotal: mainTaxTotalNew,
            exclTotal: cartItem.exclTotal + deltaMainExcl,
            taxTotal: cartItem.taxTotal + deltaMainTax,
            totalPrice: cartItem.totalPrice + deltaMainExcl + deltaMainTax,
          }
        }
        return cartItem
      })
    setCartItems(updateItems)
    setBillCartItems(updateItems)
  }
  const handleWarningOk = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    setWarningMessage("")
    setWarningType("warning")
  }
  const handleConfirmYes = () => {
    setShowPaymentModal(true)
    setWarningMessage("")
    setIsConfirmation(false)
    setPendingAction(null)
  }
  const handleConfirmNo = () => {
    setWarningMessage("")
    setIsConfirmation(false)
    setPendingAction(null)
    resetOrderState(); // FIXED: use resetOrderState to clear all session IDs
    if (orderType === "Dine In") {
      navigate("/table")
    }
  }
  // UPDATED: Use excl total for subtotal
  const calculateSubtotal = (items) => calculateExclTotal(items)
  const calculateOriginalSubtotal = (items) => {
    return items.reduce((sum, item) => {
      let mainItemPrice = (Number(item.basePrice) || 0) + (Number(item.icePrice) || 0) + (Number(item.spicyPrice) || 0) + getCustomVariantsTotal(item) // FIXED: Explicit Number()
      if (item.originalBasePrice) {
        mainItemPrice = (Number(item.originalBasePrice) || 0) + (Number(item.icePrice) || 0) + (Number(item.spicyPrice) || 0) + getCustomVariantsTotal(item) // FIXED: Explicit Number()
      }
      const mainItemTotal = mainItemPrice * (Number(item.quantity) || 1) // FIXED: Explicit Number()
      const addonsTotal = getAddonsTotal(item)
      const combosTotal = getCombosTotal(item)
      return sum + mainItemTotal + addonsTotal + combosTotal
    }, 0)
  }
  // Keyboard Shortcuts Implementation
  const flattenedCartRows = useMemo(() => {
    const rows = [];
    cartItems.forEach((item, index) => {
      if (!item || !item.id) return;
      rows.push({ type: 'item', id: item.id, itemIndex: index });

      if (!item.isStandaloneAddon && !item.isStandaloneCombo) {
        if (item.isCombo && item.comboItems) {
          item.comboItems.forEach((comboItem, cIndex) => {
            rows.push({ type: 'comboItem', id: `${item.id}-comboitem-${cIndex}`, itemIndex: index, cIndex });
          });
        }
        if (item.icePreference === "with_ice") {
          rows.push({ type: 'ice', id: `${item.id}-ice`, itemIndex: index });
        }
        if (item.isSpicy) {
          rows.push({ type: 'spicy', id: `${item.id}-spicy`, itemIndex: index });
        }
        if (item.customVariantsDetails) {
          Object.keys(item.customVariantsDetails).forEach(variantName => {
            rows.push({ type: 'customVariant', id: `${item.id}-custom-${variantName}`, itemIndex: index, variantName });
          });
        }
        if (item.addonQuantities) {
          Object.entries(item.addonQuantities).forEach(([addonName, qty]) => {
            if (Number(qty) > 0) {
              rows.push({ type: 'addon', id: `${item.id}-addon-${addonName}`, itemIndex: index, addonName });
            }
          });
        }
        if (item.comboQuantities) {
          Object.entries(item.comboQuantities).forEach(([comboName, qty]) => {
            if (Number(qty) > 0) {
              rows.push({ type: 'combo', id: `${item.id}-combo-${comboName}`, itemIndex: index, comboName });
            }
          });
        }
      }
    });
    return rows;
  }, [cartItems]);

  const activeRowId = flattenedCartRows[selectedCartIndex]?.id;

  useEffect(() => {
    if (!isKeyboardShortcutsEnabled) return;
    if (selectedItem) return; // Disable Front page shortcuts when FoodDetails modal is open

    const handleKeyDown = (e) => {
      // Prevent default browser behaviors for function keys
      if (e.key.match(/^F([1-9]|1[0-2])$/)) {
        e.preventDefault();
      }

      const getCards = () => Array.from(document.querySelectorAll('.frontpage-menu-card, .pos-item-card, .design-3-card'));
      const getCategoryBtns = () => Array.from(document.querySelectorAll('.frontpage-category-btn, .pos-category-btn'));
      const alertButtons = Array.from(document.querySelectorAll('.frontpage-alert-button, .modal-btn'));
      const isAlertOpen = alertButtons.length > 0;

      const activeEl = document.activeElement;
      const isCardActive = activeEl && (activeEl.classList.contains('frontpage-menu-card') || activeEl.classList.contains('pos-item-card') || activeEl.classList.contains('design-3-card'));
      const isCategoryActive = activeEl && (activeEl.classList.contains('frontpage-category-btn') || activeEl.classList.contains('pos-category-btn'));
      const isAlertButtonActive = activeEl && (activeEl.classList.contains('frontpage-alert-button') || activeEl.classList.contains('modal-btn'));

      if (isAlertOpen && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        const activeIdx = alertButtons.indexOf(activeEl);
        e.preventDefault();

        if (e.key === 'Enter') {
          if (activeIdx >= 0) activeEl.click();
          else alertButtons[0].click();
          return;
        }

        // Navigation within alert buttons
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          if (activeIdx > 0) alertButtons[activeIdx - 1].focus();
          else alertButtons[alertButtons.length - 1].focus();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          if (activeIdx >= 0 && activeIdx < alertButtons.length - 1) alertButtons[activeIdx + 1].focus();
          else alertButtons[0].focus();
        }
        return;
      }

      if (isAlertOpen) return; // Block other shortcuts when alert is open

      switch (e.key) {
        case 'Shift':
          if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
            e.preventDefault();
            const categoryBtns = getCategoryBtns();
            if (categoryBtns.length > 0) {
              const activeCatIdx = categoryBtns.findIndex(btn => btn.classList.contains('active'));
              if (activeCatIdx >= 0) categoryBtns[activeCatIdx].focus();
              else categoryBtns[0].focus();
            }
          }
          break;
        case 'F1':
          searchInputRef.current?.focus();
          break;
        case 'F2':
          cancelCart();
          break;
        case 'F3':
          handlePayButtonClick();
          break;
        case 'F4':
          saveOrder();
          break;
        case 'F5':
          navigate("/home");
          break;
        case 'F6':
          handleActiveOrdersClick();
          break;
        case 'F7':
          navigate("/kitchen");
          break;
        case 'F8':
          setShowCustomerSection((prev) => {
            if (!prev) {
              setTimeout(() => {
                phoneNumberRef.current?.focus();
              }, 50);
            }
            return !prev;
          });
          break;
        case 'f':
        case 'F':
          if (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA') {
            e.preventDefault();
            setShowCustomerSection((prev) => {
              if (!prev) {
                setTimeout(() => {
                  phoneNumberRef.current?.focus();
                }, 50);
              }
              return !prev;
            });
          }
          break;
        case 'F9':
          navigate("/salespage");
          break;

        case 'F11':
          if (!showPOSGrid) {
            setShowPOSGrid(true);
            localStorage.setItem("posDesign", "design1");
            setPosDesign("design1");
          } else if (posDesign === "design1") {
            localStorage.setItem("posDesign", "design2");
            setPosDesign("design2");
          } else if (posDesign === "design2") {
            localStorage.setItem("posDesign", "design3");
            setPosDesign("design3");
          } else if (posDesign === "design3") {
            setShowPOSGrid(false);
          }
          break;
        case 'F12':
          handleLogoutClick();
          break;
        case 'Backspace':
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            navigate(-1);
          }
          break;
        case 'ArrowLeft':
          if (activeEl.tagName !== 'INPUT') {
            if (isCardActive) {
              const cards = getCards();
              const idx = cards.indexOf(activeEl);
              if (idx > 0) cards[idx - 1].focus();
            } else if (isCategoryActive) {
              e.preventDefault();
              const categoryBtns = getCategoryBtns();
              const idx = categoryBtns.indexOf(activeEl);
              if (idx > 0) categoryBtns[idx - 1].focus();
            } else {
              handlePrev();
            }
          }
          break;
        case 'ArrowRight':
          if (activeEl.tagName !== 'INPUT') {
            if (isCardActive) {
              const cards = getCards();
              const idx = cards.indexOf(activeEl);
              if (idx >= 0 && idx < cards.length - 1) cards[idx + 1].focus();
            } else if (isCategoryActive) {
              e.preventDefault();
              const categoryBtns = getCategoryBtns();
              const idx = categoryBtns.indexOf(activeEl);
              if (idx >= 0 && idx < categoryBtns.length - 1) categoryBtns[idx + 1].focus();
            } else {
              handleNext();
            }
          }
          break;
        case 'ArrowUp':
          if (activeEl.tagName !== 'INPUT') {
            e.preventDefault();
            if (isCardActive) {
              const cards = getCards();
              const idx = cards.indexOf(activeEl);
              if (idx >= 4) cards[idx - 4].focus();
              else if (idx > 0) cards[0].focus();
            } else if (isCategoryActive) {
              const categoryBtns = getCategoryBtns();
              const idx = categoryBtns.indexOf(activeEl);
              if (idx > 0) categoryBtns[idx - 1].focus();
            } else if (flattenedCartRows.length > 0) {
              setSelectedCartIndex(prev => Math.max(0, prev - 1));
            }
          }
          break;
        case 'ArrowDown':
          if (activeEl.tagName !== 'INPUT') {
            e.preventDefault();
            if (isCardActive) {
              const cards = getCards();
              const idx = cards.indexOf(activeEl);
              if (idx >= 0 && idx + 4 < cards.length) cards[idx + 4].focus();
              else if (cards.length > 0) cards[cards.length - 1].focus();
            } else if (isCategoryActive) {
              const categoryBtns = getCategoryBtns();
              const idx = categoryBtns.indexOf(activeEl);
              if (idx >= 0 && idx < categoryBtns.length - 1) categoryBtns[idx + 1].focus();
            } else if (flattenedCartRows.length > 0) {
              setSelectedCartIndex(prev => Math.min(flattenedCartRows.length - 1, prev + 1));
            }
          }
          break;
        case 'Enter':
          if (isCardActive || isCategoryActive) {
            e.preventDefault();
            activeEl.click();
          }
          break;
        case '+':
        case '=':
          if (activeEl.tagName !== 'INPUT' && selectedCartIndex >= 0 && selectedCartIndex < flattenedCartRows.length) {
            const row = flattenedCartRows[selectedCartIndex];
            const item = cartItems[row.itemIndex];
            if (row.type === 'item') {
              handleQuantityChange(item.id, Number(item.quantity || 1) + 1, "item");
            } else if (row.type === 'ice') {
              handleQuantityChange(item.id, Number(item.iceQuantity || 1) + 1, "ice");
            } else if (row.type === 'spicy') {
              handleQuantityChange(item.id, Number(item.spicyQuantity || 1) + 1, "spicy");
            } else if (row.type === 'customVariant') {
              handleQuantityChange(item.id, Number(item.customVariantsQuantities?.[row.variantName] || 1) + 1, "customVariant", row.variantName);
            } else if (row.type === 'addon') {
              handleQuantityChange(item.id, Number(item.addonQuantities?.[row.addonName] || 1) + 1, "addon", row.addonName);
            } else if (row.type === 'combo') {
              handleQuantityChange(item.id, Number(item.comboQuantities?.[row.comboName] || 1) + 1, "combo", row.comboName);
            }
          }
          break;
        case '-':
        case '_':
          if (activeEl.tagName !== 'INPUT' && selectedCartIndex >= 0 && selectedCartIndex < flattenedCartRows.length) {
            const row = flattenedCartRows[selectedCartIndex];
            const item = cartItems[row.itemIndex];
            if (row.type === 'item') {
              const newQty = Math.max(1, Number(item.quantity || 1) - 1);
              handleQuantityChange(item.id, newQty, "item");
            } else if (row.type === 'ice') {
              const newQty = Math.max(1, Number(item.iceQuantity || 1) - 1);
              handleQuantityChange(item.id, newQty, "ice");
            } else if (row.type === 'spicy') {
              const newQty = Math.max(1, Number(item.spicyQuantity || 1) - 1);
              handleQuantityChange(item.id, newQty, "spicy");
            } else if (row.type === 'customVariant') {
              const newQty = Math.max(1, Number(item.customVariantsQuantities?.[row.variantName] || 1) - 1);
              handleQuantityChange(item.id, newQty, "customVariant", row.variantName);
            } else if (row.type === 'addon') {
              const newQty = Math.max(1, Number(item.addonQuantities?.[row.addonName] || 1) - 1);
              handleQuantityChange(item.id, newQty, "addon", row.addonName);
            } else if (row.type === 'combo') {
              const newQty = Math.max(1, Number(item.comboQuantities?.[row.comboName] || 1) - 1);
              handleQuantityChange(item.id, newQty, "combo", row.comboName);
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isKeyboardShortcutsEnabled, orderType, cartItems, selectedCartIndex, posDesign, showPOSGrid, flattenedCartRows, selectedItem]);

  // Focus warning modal buttons when it opens
  useEffect(() => {
    if (warningMessage || showLogoutModal) {
      setTimeout(() => {
        const okBtn = document.querySelector('.frontpage-alert-button.ok-btn') ||
          document.querySelector('.modal-btn.confirm-btn') ||
          document.querySelector('.frontpage-alert-button') ||
          document.querySelector('.modal-btn');
        if (okBtn) okBtn.focus();
      }, 50);
    }
  }, [warningMessage, showLogoutModal]);

  // Auto-hide toast notifications (non-confirmations)
  useEffect(() => {
    if (warningMessage && !isConfirmation) {
      const timer = setTimeout(() => {
        setWarningMessage("");
        setWarningType("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage, isConfirmation]);

  // NEW: Handle PAY button click with cart validation before showing payment modal
  // NEW: Trigger unserved checks immediately on mount when an existing order is loaded
  useEffect(() => {
    if (billCartItems.length > 0) {
      const notServed = billCartItems.map(item => {
        const isMainServed = (item.servedQuantity || 0) >= (item.quantity || 1);
        const unservedAddonNames = Object.keys(item.addonQuantities || {}).filter(a => !item.servedAddons?.[a]);
        const unservedComboNames = Object.keys(item.comboQuantities || {}).filter(c => !item.servedCombos?.[c]);
        const unservedComboOfferItems = (item.is_combo_offer && item.comboItems)
          ? item.comboItems.filter(ci => !item.servedComboItems?.[ci.name]).map(ci => ci.name)
          : [];

        const hasUnserved = !isMainServed || unservedAddonNames.length > 0 || unservedComboNames.length > 0 || unservedComboOfferItems.length > 0;

        if (hasUnserved) {
          return {
            ...item,
            _unservedDetails: {
              main: !isMainServed,
              addons: unservedAddonNames.map(name => ({ name, price: item.addonPrices?.[name] || 0 })),
              combos: unservedComboNames.map(name => ({ name, price: item.comboPrices?.[name] || 0 })),
              comboOfferItems: unservedComboOfferItems
            }
          };
        }
        return null;
      }).filter(item => item !== null);

      if (notServed.length > 0) {
        setUnservedItems(notServed);
        setShowUnservedPopup(true);
      }
    }
  }, []); // Run on mount

  const handlePayButtonClick = () => {
    // Validate cart is not empty
    if (cartItems.length === 0) {
      setWarningMessage("Cart is empty. Please add items before proceeding.");
      setWarningType("warning");
      return;
    }

    // Original behavior: Directly show payment modal as unserved check happened on mount
    setShowPaymentModal(true);
  };

  const handleUnservedProceed = () => {
    const updatedBillCart = billCartItems.map(item => {
      const updatedItem = { ...item };
      updatedItem.served = true;
      updatedItem.servedQuantity = Number(item.quantity) || 1;

      // Mark all addons as served
      if (item.addonQuantities) {
        updatedItem.servedAddons = {};
        Object.keys(item.addonQuantities).forEach(addonName => {
          updatedItem.servedAddons[addonName] = true;
        });
      }

      // Mark all combos as served
      if (item.comboQuantities) {
        updatedItem.servedCombos = {};
        Object.keys(item.comboQuantities).forEach(comboName => {
          updatedItem.servedCombos[comboName] = true;
        });
      }

      // Mark all combo offer items as served
      if (item.is_combo_offer && item.comboItems) {
        updatedItem.servedComboItems = {};
        item.comboItems.forEach(ci => {
          updatedItem.servedComboItems[ci.name] = true;
        });
      }

      return updatedItem;
    });

    setBillCartItems(updatedBillCart);
    setCartItems(updatedBillCart);
    setShowUnservedPopup(false);
  };

  const handleUnservedCancel = () => {
    const updatedBillCart = billCartItems.map(item => {
      const isMainServed = (item.servedQuantity || 0) >= (item.quantity || 1);

      // If main item is NOT served, we remove the whole item by returning null
      if (!isMainServed) return null;

      // If main item IS served, filter out only unserved addons/combos
      const filteredItem = { ...item };
      let recalculate = false;

      // Filter Addons
      if (filteredItem.addonQuantities) {
        const addonKeys = Object.keys(filteredItem.addonQuantities);
        const servedAddonKeys = addonKeys.filter(a => filteredItem.servedAddons?.[a]);
        if (servedAddonKeys.length !== addonKeys.length) {
          recalculate = true;
          const newAddonQuants = {};
          servedAddonKeys.forEach(k => { newAddonQuants[k] = filteredItem.addonQuantities[k]; });
          filteredItem.addonQuantities = newAddonQuants;

          // Also sync other addon-related states if they exist
          if (filteredItem.addonVariants) {
            const newAddonVars = {};
            servedAddonKeys.forEach(k => { newAddonVars[k] = filteredItem.addonVariants[k]; });
            filteredItem.addonVariants = newAddonVars;
          }
        }
      }

      // Filter Combos
      if (filteredItem.comboQuantities) {
        const comboKeys = Object.keys(filteredItem.comboQuantities);
        const servedComboKeys = comboKeys.filter(c => filteredItem.servedCombos?.[c]);
        if (servedComboKeys.length !== comboKeys.length) {
          recalculate = true;
          const newComboQuants = {};
          servedComboKeys.forEach(k => { newComboQuants[k] = filteredItem.comboQuantities[k]; });
          filteredItem.comboQuantities = newComboQuants;

          if (filteredItem.comboVariants) {
            const newComboVars = {};
            servedComboKeys.forEach(k => { newComboVars[k] = filteredItem.comboVariants[k]; });
            filteredItem.comboVariants = newComboVars;
          }
        }
      }

      // Filter Combo Offer Items (for items where is_combo_offer is true)
      if (filteredItem.is_combo_offer && filteredItem.comboItems) {
        const newComboOfferItems = filteredItem.comboItems.filter(ci => filteredItem.servedComboItems?.[ci.name]);
        if (newComboOfferItems.length !== filteredItem.comboItems.length) {
          recalculate = true;
          filteredItem.comboItems = newComboOfferItems;
        }
      }

      if (recalculate) {
        // COMPREHENSIVE RECALCULATION: Account for all components including variants
        const qty = Number(filteredItem.quantity) || 1;
        const basePrice = Number(filteredItem.basePrice) || 0;
        const icePrice = Number(filteredItem.icePrice) || 0;
        const iceQty = Number(filteredItem.iceQuantity) || 1;
        const spicyPrice = Number(filteredItem.spicyPrice) || 0;
        const spicyQty = Number(filteredItem.spicyQuantity) || 1;

        // 1. Calculate main item section (Base + Ice + Spicy + Custom Variants like Flavours)
        const mainExclTotal = (basePrice * qty) + (icePrice * iceQty) + (spicyPrice * spicyQty) + getCustomVariantsTotal(filteredItem);
        // 2. Addons Total
        const addonExclTotal = getAddonsTotal(filteredItem);
        // 3. Combos Total
        const comboExclTotal = getCombosTotal(filteredItem);

        const newExclTotal = mainExclTotal + addonExclTotal + comboExclTotal;
        const taxRate = Number(filteredItem.mainTaxRate) || Number(filteredItem.taxRate) || 0;
        const newTaxTotal = newExclTotal * (taxRate / 100);

        filteredItem.exclTotal = newExclTotal;
        filteredItem.taxTotal = newTaxTotal;
        filteredItem.totalPrice = newExclTotal + newTaxTotal;
        filteredItem.mainExclTotal = mainExclTotal;
        filteredItem.addonExclTotal = addonExclTotal;
        filteredItem.comboExclTotal = comboExclTotal;

        if (taxRate > 0) {
          filteredItem.taxBreakdown = { [taxRate]: newTaxTotal };
        }
      }

      return filteredItem;
    }).filter(item => item !== null);

    setBillCartItems(updatedBillCart);
    setCartItems(updatedBillCart);
    setShowUnservedPopup(false);
  };

  // Payment Modal Keyboard Shortcuts
  useEffect(() => {
    if (!showPaymentModal) return;

    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setShowPaymentModal(false);
      } else if (e.key === '1' && isWorkflowFeatureEnabled('pay', 'Cash')) {
        handlePaymentSelection("CASH");
      } else if (e.key === '2' && isWorkflowFeatureEnabled('pay', 'Card')) {
        handlePaymentSelection("CARD");
      } else if (e.key === '3' && isWorkflowFeatureEnabled('pay', 'UPI')) {
        handlePaymentSelection("UPI");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPaymentModal, billCartItems, isWorkflowFeatureEnabled]);

  const handlePaymentSelection = async (method) => {
    if (billCartItems.length === 0) {
      setWarningMessage("Cart is empty. Please add items before proceeding.")
      setWarningType("warning")
      return
    }
    if (user.email === "Guest") {
      setWarningMessage("Please log in to save the sale.")
      setWarningType("warning")
      return
    }
    const subtotal = calculateExclTotal(billCartItems)
    const totalVat = calculateTaxTotal(billCartItems)
    const grandTotal = subtotal + totalVat
    if (isNaN(grandTotal) || grandTotal === 0) {
      setWarningMessage("Invalid total amount. Please check your cart items.")
      setWarningType("warning")
      return
    }
    const paymentDetails = {
      mode_of_payment: method,
      amount: Number(grandTotal.toFixed(2)),
    }
    const { chairsBooked } = location.state || {}
    const billDetails = {
      customer: customerName.trim() || "N/A",
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      whatsappNumber: whatsappNumber ? `${whatsappISDCode}${whatsappNumber}` : "N/A", // UPDATED: Use full WhatsApp with code
      tableNumber: tableNumber || "N/A",
      chairsBooked: chairsBooked,
      deliveryAddress: deliveryAddress,
      email: email || "N/A",
      items: billCartItems.map((item) => ({
        item_name: item.item_name || item.name,
        basePrice: Number(item.basePrice) || 0,
        originalBasePrice: item.originalBasePrice || null,
        icePreference: item.icePreference,
        ice_price: Number(item.icePrice) || 0,
        isSpicy: item.isSpicy,
        spicy_price: Number(item.spicyPrice) || 0,
        quantity: Number(item.quantity) || 1,
        amount: Number((item.totalPrice || 0).toFixed(2)) || 0, // incl
        tax_amount: Number(item.taxTotal || 0), // UPDATED: Add tax amount
        excl_amount: Number(item.exclTotal || 0), // UPDATED: Add excl for backend if needed
        addons: Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => ({
          name1: addonName,
          addon_image: item.addonImages?.[addonName] || "/static/images/default-addon-image.jpg",
          addon_size_price: Number(item.addonSizePrices?.[addonName] || 0),
          addon_ice_price: Number(item.addonIcePrices?.[addonName] || 0),
          addon_spicy_price: Number(item.addonSpicyPrices?.[addonName] || 0),
          addon_price: Number(item.addonPrices?.[addonName] || item.addonVariants?.[addonName]?.price || 0),
          addon_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
          tax_amount: Number(item.addonTaxes?.[addonName] || 0), // UPDATED: Add tax for addon
          size: item.addonVariants?.[addonName]?.size || "M",
          cold: item.addonVariants?.[addonName]?.cold || "without_ice",
          isSpicy: item.addonVariants?.[addonName]?.spicy || false,
          kitchen: item.addonVariants?.[addonName]?.kitchen || "Main Kitchen",
          sugar: item.addonVariants?.[addonName]?.sugar || "medium",
          custom_variants: item.addonCustomVariantsDetails?.[addonName] || {},
        })),
        selectedCombos: Object.entries(item.comboQuantities || {}).map(([comboName, qty]) => ({
          name1: comboName,
          combo_image: item.comboImages?.[comboName] || "/static/images/default-combo-image.jpg",
          combo_size_price: Number(item.comboSizePrices?.[comboName] || 0),
          combo_ice_price: Number(item.comboIcePrices?.[comboName] || 0),
          combo_spicy_price: Number(item.comboSpicyPrices?.[comboName] || 0),
          combo_price: Number(item.comboPrices?.[comboName] || item.comboVariants?.[comboName]?.price || 0),
          size: item.comboVariants?.[comboName]?.size || "M",
          cold: item.comboVariants?.[comboName]?.cold || "without_ice",
          isSpicy: item.comboVariants?.[comboName]?.spicy || false,
          kitchen: item.comboVariants?.[comboName]?.kitchen || "Main Kitchen",
          sugar: item.comboVariants?.[comboName]?.sugar || "medium",
          combo_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
          tax_amount: Number(item.comboTaxes?.[comboName] || 0), // UPDATED: Add tax for combo
          custom_variants: item.comboCustomVariantsDetails?.[comboName] || {},
        })),
        kitchen: item.kitchen,
        selectedSize: item.selectedSize || null,
        ingredients: item.ingredients || [],
        selectedCustomVariants: item.selectedCustomVariants || {},
        customVariantsDetails: item.customVariantsDetails || {},
        customVariantsQuantities: item.customVariantsQuantities || {},
        image: item.image || "/static/images/default-item.jpg",
        // FIXED: Preserve is_combo_offer and offer_description for backend
        is_combo_offer: item.is_combo_offer || false,
        offer_description: item.offer_description || null,
        kitchenStatuses: item.kitchenStatuses || {},
      })),
      subtotal: Number(subtotal.toFixed(2)),
      vat_amount: Number(totalVat.toFixed(2)), // UPDATED: Add total VAT
      totalAmount: Number(grandTotal.toFixed(2)), // UPDATED: Grand total incl VAT
      payments: [paymentDetails],
      date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split("T")[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }
    try {
      const savedSale = await handleSaveToBackend(paymentDetails)
      if (savedSale) {
        billDetails.invoice_no = savedSale.invoice_no
      }
      // FIXED: Use dynamic baseUrl for order update
      if (orderId) {
        try {
          const apiPath = baseUrl ? `${baseUrl}/api/activeorders/${orderId}` : `/api/activeorders/${orderId}`;
          // UPDATED: Send updated billCartItems (with served flags) to ensure backend is updated
          await axios.put(apiPath, { paid: true, cartItems: billCartItems }, { headers: getHeaders() });
          console.log("Order updated with paid status");
        } catch (error) {
          console.error("Error updating order paid status:", error);
        }
      }
      if (method === "CASH") {
        handlePaymentCompletion(tableNumber, chairsBooked, floor) // UPDATED: Pass floor
        resetOrderState(); // FIXED: ensure state is reset
        navigate("/cash", { state: { billDetails } })
      } else if (method === "CARD") {
        handlePaymentCompletion(tableNumber, chairsBooked, floor) // UPDATED: Pass floor
        resetOrderState(); // FIXED: ensure state is reset
        navigate("/card", { state: { billDetails } })
      } else if (method === "UPI") {
        handlePaymentCompletion(tableNumber, chairsBooked, floor) // UPDATED: Pass floor
        resetOrderState(); // FIXED: ensure state is reset
        navigate("/upi", { state: { billDetails } })
      }
      setShowPaymentModal(false)
    } catch (error) {
      console.error("Error processing payment:", error)
      setWarningMessage(`Failed to process payment: ${error.message}`)
      setWarningType("warning")
    }
  }
  const handlePaymentCompletion = (tableNumber, chairsBookedList = [], floor) => {
    // Clear the specific chairs from savedOrders
    const saved = JSON.parse(localStorage.getItem("savedOrders")) || []
    const safeChairsBookedList = chairsBookedList || [];
    const updatedOrders = saved.map(o => {
      if (String(o.tableNumber) === String(tableNumber) && o.floor === floor && !o.paid) {
        // Check if any of the chairs in chairsBookedList are present in this order's chairsBooked
        // If so, mark this order as paid.
        if (o.chairsBooked && o.chairsBooked.some(c => safeChairsBookedList.includes(c))) {
          return { ...o, paid: true };
        }
      }
      return o;
    });
    localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
    setSavedOrders(updatedOrders); // Trigger reactive UI update for availability
    setCartItems([]);
    setBillCartItems([]);
    setWarningMessage(
      `Payment completed.`
    );
    setWarningType("success");
    setPendingAction(() => () => navigate("/table"));
  }
  // UPDATED: handleSaveToBackend - NEW: Include posOpeningEntry from localStorage, use grand total
  const handleSaveToBackend = async (paymentDetails) => {
    if (billCartItems.length === 0) {
      setWarningMessage("Cart is empty. Please add items before saving.")
      setWarningType("warning")
      throw new Error("Cart is empty")
    }
    if (user.email === "Guest") {
      setWarningMessage("Please log in to save the sale.")
      setWarningType("warning")
      throw new Error("User not logged in")
    }
    const validItems = billCartItems.filter((item) => (Number(item.quantity) || 1) > 0) // FIXED: Explicit Number()
    if (validItems.length !== billCartItems.length) {
      setWarningMessage("All items must have a quantity greater than zero.")
      setWarningType("warning")
      throw new Error("Invalid item quantities")
    }
    const subtotal = calculateExclTotal(billCartItems)
    const totalVat = calculateTaxTotal(billCartItems)
    const grandTotal = subtotal + totalVat
    // NEW: Get posOpeningEntry from localStorage (set in OpeningEntryWithNavbar.jsx)
    const posOpeningEntry = localStorage.getItem('posOpeningEntry') || '';
    console.log('Including posOpeningEntry in sales payload:', posOpeningEntry); // Debug log
    const payload = {
      customer: customerName.trim() || "N/A",
      phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
      whatsappNumber: whatsappNumber ? `${whatsappISDCode}${whatsappNumber}` : "N/A", // UPDATED: Full WhatsApp with code
      tableNumber: tableNumber || "N/A",
      floor: floor || "N/A", // ADDED: Include floor in payload
      chairsBooked: activeChairsBooked,
      deliveryAddress: deliveryAddress,
      email: email || "N/A",
      items: validItems.map((item) => {
        // NEW: Log item for debugging (remove in prod)
        console.log(`Payload item: ${item.item_name}, quantity: ${item.quantity}, addons:`, item.addonQuantities, 'combos:', item.comboQuantities);
        return ({
          item_name: item.item_name || item.name || "Unnamed Item",
          basePrice: Number(item.basePrice) || 0,
          originalBasePrice: item.originalBasePrice || null,
          icePreference: item.icePreference,
          ice_price: Number(item.icePrice) || 0,
          isSpicy: item.isSpicy,
          spicy_price: Number(item.spicyPrice) || 0,
          quantity: Number(item.quantity) || 1,
          amount: Number(item.totalPrice.toFixed(2)) || 0, // incl
          tax_amount: Number(item.taxTotal || 0), // UPDATED
          excl_amount: Number(item.exclTotal || 0), // UPDATED
          addons: Object.entries(item.addonQuantities || {}).map(([addonName, qty]) => ({
            name1: addonName,
            addon_image: item.addonImages?.[addonName] || "/static/images/default-addon-image.jpg",
            addon_size_price: Number(item.addonSizePrices?.[addonName] || 0),
            addon_ice_price: Number(item.addonIcePrices?.[addonName] || 0),
            addon_spicy_price: Number(item.addonSpicyPrices?.[addonName] || 0),
            addon_price: Number(item.addonPrices?.[addonName] || item.addonVariants?.[addonName]?.price || 0),
            addon_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
            tax_amount: Number(item.addonTaxes?.[addonName] || 0), // UPDATED
            size: item.addonVariants?.[addonName]?.size || "M",
            cold: item.addonVariants?.[addonName]?.cold || "without_ice",
            isSpicy: item.addonVariants?.[addonName]?.spicy || false,
            kitchen: item.addonVariants?.[addonName]?.kitchen || "Main Kitchen",
            sugar: item.addonVariants?.[addonName]?.sugar || "medium",
            custom_variants: item.addonCustomVariantsDetails?.[addonName] || {},
          })),
          selectedCombos: Object.entries(item.comboQuantities || {}).map(([comboName, qty]) => ({
            name1: comboName,
            combo_image: item.comboImages?.[comboName] || "/static/images/default-combo-image.jpg",
            combo_size_price: Number(item.comboSizePrices?.[comboName] || 0),
            combo_ice_price: Number(item.comboIcePrices?.[comboName] || 0),
            combo_spicy_price: Number(item.comboSpicyPrices?.[comboName] || 0),
            combo_price: Number(item.comboPrices?.[comboName] || item.comboVariants?.[comboName]?.price || 0),
            size: item.comboVariants?.[comboName]?.size || "M",
            cold: item.comboVariants?.[comboName]?.cold || "without_ice",
            isSpicy: item.comboVariants?.[comboName]?.spicy || false,
            kitchen: item.comboVariants?.[comboName]?.kitchen || "Main Kitchen",
            sugar: item.comboVariants?.[comboName]?.sugar || "medium",
            combo_quantity: Number(qty) || 1, // FIXED: Explicit Number() || 1
            tax_amount: Number(item.comboTaxes?.[comboName] || 0), // UPDATED
            custom_variants: item.comboCustomVariantsDetails?.[comboName] || {},
          })),
          kitchen: item.kitchen,
          selectedSize: item.selectedSize || null,
          ingredients: item.ingredients || [],
          selectedCustomVariants: item.selectedCustomVariants || {},
          customVariantsDetails: item.customVariantsDetails || {},
          customVariantsQuantities: item.customVariantsQuantities || {},
          image: item.image || "/static/images/default-item.jpg",
          // FIXED: Preserve is_combo_offer and offer_description for backend
          is_combo_offer: item.is_combo_offer || false,
          offer_description: item.offer_description || null,
          kitchenStatuses: item.kitchenStatuses || {},
          // NEW: Include served status fields in sales payload
          served: item.served || false,
          servedQuantity: item.servedQuantity || 0,
          servedAddons: item.servedAddons || {},
          servedCombos: item.servedCombos || {},
          servedComboItems: item.servedComboItems || {},
        })
      }),
      subtotal: Number(subtotal.toFixed(2)),
      vat_amount: Number(totalVat.toFixed(2)), // UPDATED
      total: Number(grandTotal.toFixed(2)), // UPDATED: Grand total
      userId: user.email,
      payment_terms: [{ due_date: new Date().toISOString().split("T")[0], payment_terms: "Immediate" }],
      payments: [paymentDetails],
      orderType: orderType || "Dine In",
      status: "Pending",
      // UPDATED: Use orderNo state (from SAVE) or existingOrder.orderNo for Online Delivery to match active order
      orderNo: orderNo || existingOrder?.orderNo || generate_order_number(orderType),
      deliveryPersonName: deliveryPersonName || existingOrder?.deliveryPersonName || "",
      date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split("T")[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      // NEW: Include pos_opening_entry for association with opening entry
      pos_opening_entry: posOpeningEntry,
    }
    // NEW: Log full payload for debugging (remove in prod)
    console.log("Sending sales payload:", payload);
    try {
      // FIXED: Use dynamic baseUrl for sales save
      const apiPath = baseUrl ? `${baseUrl}/api/sales` : '/api/sales';
      const response = await axios.post(apiPath, payload, { headers: getHeaders() })
      setWarningMessage(`Sale saved successfully! Invoice No: ${response.data.invoice_no}`)
      setWarningType("success")
      setPendingAction(() => () => {
        setCartItems([])
        setBillCartItems([])
      })
      return response.data
    } catch (error) {
      console.error("Error saving to backend:", error)
      setWarningMessage(`Failed to save sale: ${error.response?.data?.error || error.message}`)
      setWarningType("warning")
      throw error
    }
  }
  const handleKeyPress = (e) => {
    if (e.key === " " || e.keyCode === 32) {
      e.preventDefault()
    }
  }
  const handleDeliveryAddressChange = (field, value) => {
    setDeliveryAddress((p) => ({ ...p, [field]: value }));
    // If changing country or field1, clear dependent fields
    if (field === 'country' || field === 'field1') {
      setDeliveryAddress((p) => ({ ...p, field2: '', field3: '' }));
    }
  };
  // Helper to get filtered values for the selected Field1
  // Helper to get filtered values for the selected Field1
  const getFilteredValues = (field) => {
    // Determine parent value based on field hierarchy
    let parentValue = null;
    if (field === 'field2') parentValue = deliveryAddress.field1;
    if (field === 'field3') parentValue = deliveryAddress.field2;

    return getOptionsForField(field, deliveryAddress.country, addressStructure, linkedValues, parentValue);
  };
  const countryList = Object.keys({ ...countryAddressHierarchy, ...(addressStructure?.countries || {}) }).sort();
  const handleCreateCustomer = async () => {
    if (orderType !== "Dine In" && (!customerName.trim() || !phoneNumber)) {
      setWarningMessage("Customer name and phone number are required for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    if (orderType !== "Dine In" && phoneNumber.length < 7) {
      setWarningMessage("Phone number must be at least 7 digits for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    try {
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        whatsapp_number: `${whatsappISDCode}${whatsappNumber}`,
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        country: deliveryAddress.country || "",
        field1: deliveryAddress.field1 || "",
        field2: deliveryAddress.field2 || "",
        field3: deliveryAddress.field3 || "",
        email: email || "",
        customer_group: selectedGroupId || null,
        company_name: user?.company_name || user?.company || "",
        branch_name: user?.branch_name || user?.branch || "",
        ...dynamicValues
      }
      // FIXED: Use dynamic baseUrl for customer create
      const apiPath = baseUrl ? `${baseUrl}/api/customers` : '/api/customers';
      const response = await axios.post(apiPath, customerData, { headers: getHeaders() })
      const newCustomer = { ...customerData, _id: response.data.id }
      setCustomers((prev) => [...prev, newCustomer])
      setFilteredCustomers((prev) => [...prev, newCustomer])
      setShowCustomerSection(false)
      console.log("Customer saved successfully!")
      setIsPhoneNumberSet(true)
      phoneNumberRef.current?.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("Error creating customer:", error)
      if (error.response?.status === 409) {
        setWarningMessage(
          `Phone number ${phoneNumber} already exists for customer ${error.response.data.customer_name}`,
        )
      } else {
        setWarningMessage(`Failed to create customer: ${error.response?.data?.error || error.message}`)
      }
      setWarningType("warning")
    }
  }
  const handleUpdateCustomer = async (id) => {
    if (orderType !== "Dine In" && (!customerName.trim() || !phoneNumber)) {
      setWarningMessage("Customer name and phone number are required for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    if (orderType !== "Dine In" && phoneNumber.length < 7) {
      setWarningMessage("Phone number must be at least 7 digits for non-Dine In orders.")
      setWarningType("warning")
      return
    }
    try {
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        whatsapp_number: `${whatsappISDCode}${whatsappNumber}`,
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        country: deliveryAddress.country || "",
        field1: deliveryAddress.field1 || "",
        field2: deliveryAddress.field2 || "",
        field3: deliveryAddress.field3 || "",
        email: email || "",
        customer_group: selectedGroupId || null,
        company_name: user?.company_name || user?.company || "",
        branch_name: user?.branch_name || user?.branch || "",
        ...dynamicValues
      }
      // FIXED: Use dynamic baseUrl for customer update
      const apiPath = baseUrl ? `${baseUrl}/api/customers/${id}` : `/api/customers/${id}`;
      await axios.put(apiPath, customerData, { headers: getHeaders() })
      const updatedCustomer = { ...customerData, _id: id }
      setCustomers((prev) => prev.map((c) => (c._id === id ? updatedCustomer : c)))
      setFilteredCustomers((prev) => prev.map((c) => (c._id === id ? updatedCustomer : c)))
      setShowCustomerSection(false)
      console.log("Customer saved successfully!")
      setIsPhoneNumberSet(true)
      phoneNumberRef.current?.scrollIntoView({ behavior: "smooth" })
    } catch (error) {
      console.error("Error updating customer:", error)
      setWarningMessage(`Failed to update customer: ${error.response?.data?.error || error.message}`)
      setWarningType("warning")
    }
  }
  const handleCustomerNameChange = (e) => {
    const value = e.target.value
    setCustomerName(value)
    if (value.trim() === "") {
      setFilteredCustomers(customers)
      setPhoneNumber("")
      setWhatsappNumber("")
      setWhatsappISDCode("+91") // RESET: WhatsApp code
      setDeliveryAddress({ building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" })
      setEmail("")
      setSelectedGroupId("")
      setDynamicValues({})
      setIsPhoneNumberSet(false)
    } else {
      const filtered = customers.filter((customer) =>
        customer.customer_name.toLowerCase().includes(value.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    }
  }
  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (value.length <= 15) {
      setPhoneNumber(value);

      // Robust matching: Try full match with selected code, OR check if value itself contains a known code
      let existingCustomer = customers.find((c) => c.phone_number === `${selectedISDCode}${value}`);

      if (!existingCustomer) {
        // Try searching for the raw value if it starts with any known ISD code
        const matchedISD = isdCodes.find(isd => value.startsWith(isd.code.replace('+', '')));
        if (matchedISD) {
          existingCustomer = customers.find(c => c.phone_number === `+${value}`);
        }
      }

      if (existingCustomer) {
        handleCustomerSelect(existingCustomer);
      } else {
        // Reset only if clearing
        if (value.length === 0) {
          setCustomerName("");
          setWhatsappNumber("");
          setDeliveryAddress({ building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" });
          setEmail("");
          setSelectedGroupId("");
          setDynamicValues({});
          setIsPhoneNumberSet(false);
        }
      }
    }
  };
  // NEW: Handler to copy phone to WhatsApp (triggered by copy message or button)
  const handleCopyPhoneToWhatsapp = () => {
    setWhatsappNumber(phoneNumber);
    setWhatsappISDCode(selectedISDCode);
  };
  // UPDATED: WhatsApp number change handler (digits only, up to 10)
  const handleWhatsappNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 10) setWhatsappNumber(value)
  };
  const handleISDCodeSelect = (code) => {
    setSelectedISDCode(code)
    setShowISDCodeDropdown(false)
  }
  // NEW: Handler for WhatsApp ISD code select
  const handleWhatsappISDCodeSelect = (code) => {
    setWhatsappISDCode(code)
    setShowWhatsappISDCodeDropdown(false)
  }
  const handleCustomerSelect = (customer) => {
    if (!customer) return;

    setCustomerName(customer.customer_name || "");

    // Parse phone number and ISD code
    const fullPhone = customer.phone_number || "";
    const foundISD = isdCodes.find((isd) => fullPhone.startsWith(isd.code));
    if (foundISD) {
      setSelectedISDCode(foundISD.code);
      setPhoneNumber(fullPhone.replace(foundISD.code, ""));
    } else {
      setPhoneNumber(fullPhone);
    }

    // Parse WhatsApp number and ISD code
    const fullWhatsapp = customer.whatsapp_number || "";
    const foundWhatsappISD = isdCodes.find((isd) => fullWhatsapp.startsWith(isd.code));
    if (foundWhatsappISD) {
      setWhatsappISDCode(foundWhatsappISD.code);
      setWhatsappNumber(fullWhatsapp.replace(foundWhatsappISD.code, ""));
    } else {
      setWhatsappNumber(fullWhatsapp);
    }

    // Populate address with explicit mapping
    setDeliveryAddress({
      building_name: customer.building_name || "",
      flat_villa_no: customer.flat_villa_no || "",
      country: customer.country || "",
      field1: customer.field1 || "",
      field2: customer.field2 || "",
      field3: customer.field3 || "",
    });

    setEmail(customer.email || "");
    setSelectedGroupId(customer.customer_group || "");

    // Extract dynamic fields correctly
    const dyn = {};
    if (doctypeFields && doctypeFields.length > 0) {
      doctypeFields.forEach(f => {
        if (!f.is_default && customer[f.id] !== undefined) {
          dyn[f.id] = customer[f.id];
        }
      });
    }
    setDynamicValues(dyn);

    setShowCustomerSection(false);
    setIsPhoneNumberSet(true);

    // Smooth scroll if needed
    phoneNumberRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleCustomerSubmit = async () => {
    if (orderType === "Dine In") {
      setIsPhoneNumberSet(true)
      return
    }
    if (!customerName.trim()) {
      setWarningMessage("Customer name is required.");
      setWarningType("warning");
      return;
    }
    if (phoneNumber.length < 7) {
      setWarningMessage("Phone number must be at least 7 digits.");
      setWarningType("warning");
      return;
    }

    if (customerName.trim() && phoneNumber.length >= 7) {
      const existingCustomer = customers.find((c) => c.phone_number === `${selectedISDCode}${phoneNumber}`)
      const customerData = {
        customer_name: customerName.trim(),
        phone_number: `${selectedISDCode}${phoneNumber}`,
        whatsapp_number: `${whatsappISDCode}${whatsappNumber}`,
        building_name: deliveryAddress.building_name || "",
        flat_villa_no: deliveryAddress.flat_villa_no || "",
        country: deliveryAddress.country || "",
        field1: deliveryAddress.field1 || "",
        field2: deliveryAddress.field2 || "",
        field3: deliveryAddress.field3 || "",
        email: email || "",
        customer_group: selectedGroupId || null,
        company_name: user?.company_name || user?.company || "",
        branch_name: user?.branch_name || user?.branch || "",
        ...dynamicValues
      }
      if (existingCustomer) {
        const hasChanges = Object.keys(customerData).some(
          (key) => customerData[key] !== (existingCustomer[key] || "")
        )
        if (hasChanges) {
          await handleUpdateCustomer(existingCustomer._id)
        } else {
          handleCustomerSelect(existingCustomer)
        }
      } else {
        await handleCreateCustomer()
      }
    }
  }
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setWarningMessage("Group name is required.")
      setWarningType("warning")
      return
    }
    try {
      // FIXED: Use dynamic baseUrl for group create
      const apiPath = baseUrl ? `${baseUrl}/api/customer-groups` : '/api/customer-groups';
      const response = await axios.post(apiPath, { group_name: newGroupName.trim() }, { headers: getHeaders() })
      setCustomerGroups([response.data, ...customerGroups])
      setSelectedGroupId(response.data._id)
      setNewGroupName("")
      setShowGroupModal(false)
      setWarningMessage("Group created successfully!")
      setWarningType("success")
    } catch (error) {
      console.error("Error creating group:", error)
      setWarningMessage("Failed to create group.")
      setWarningType("warning")
    }
  }
  // FIXED: Updated saveOrder to use generate_order_number without undefined orderNo
  const saveOrder = async () => {
    if (isSavingOrder) return
    setIsSavingOrder(true)
    try {
      if (cartItems.length === 0) {
        setWarningMessage("Cart is empty. Please add items before saving.")
        setWarningType("warning")
        return
      }
      if (user.email === "Guest") {
        setWarningMessage("Please log in to save the order.")
        setWarningType("warning")
        return
      }
      let currentOrderId = orderId || uuidv4()
      const newOrder = {
        orderId: currentOrderId,
        orderNo: generate_order_number(orderType), // FIXED: Use the defined function directly
        customerName: customerName || "N/A",
        tableNumber: tableNumber || "N/A",
        floor: (floor && floor !== "N/A") ? floor : (initialFloor && initialFloor !== "N/A" ? initialFloor : "N/A"), // FIXED: Robust floor tracking
        chairsBooked: Array.isArray(activeChairsBooked) ? activeChairsBooked : [],
        phoneNumber: phoneNumber ? `${selectedISDCode}${phoneNumber}` : "N/A",
        whatsappNumber: whatsappNumber ? `${whatsappISDCode}${whatsappNumber}` : "N/A", // UPDATED: Full WhatsApp
        deliveryAddress: deliveryAddress || { building_name: "", flat_villa_no: "", country: "", field1: "", field2: "", field3: "" },
        email: email || "N/A",
        cartItems: cartItems.map((item) => ({
          id: item.id || uuidv4(),
          item_name: item.item_name || item.name,
          name: item.name || item.item_name,
          image: item.image || "/static/images/default-item.jpg",
          quantity: Number(item.quantity) || 1, // FIXED: Explicit Number()
          basePrice: Number(item.basePrice) || 0, // FIXED: Explicit Number()
          originalBasePrice: item.originalBasePrice || null,
          totalPrice: Number(item.totalPrice) || (Number(item.basePrice) * (Number(item.quantity) || 1)) || 0, // FIXED: Explicit Number()
          exclTotal: item.exclTotal || 0,
          taxTotal: item.taxTotal || 0,
          addonQuantities: item.addonQuantities || {},
          addonVariants: item.addonVariants || {},
          addonPrices: item.addonPrices || {},
          addonSizePrices: item.addonSizePrices || {},
          addonIcePrices: item.addonIcePrices || {},
          addonSpicyPrices: item.addonSpicyPrices || {},
          addonImages: item.addonImages || {},
          addonTaxes: item.addonTaxes || {},
          comboQuantities: item.comboQuantities || {},
          comboVariants: item.comboVariants || {},
          comboPrices: item.comboPrices || {},
          comboSizePrices: item.comboSizePrices || {},
          comboIcePrices: item.comboIcePrices || {},
          comboSpicyPrices: item.comboSpicyPrices || {},
          comboImages: item.comboImages || {},
          comboTaxes: item.comboTaxes || {},
          selectedCombos: item.selectedCombos || [],
          selectedSize: item.selectedSize || null,
          kitchen: item.kitchen || "Main Kitchen",
          ingredients: item.ingredients || [],
          requiredKitchens: item.requiredKitchens || [],
          kitchenStatuses: item.kitchenStatuses || {}, // Preserve statuses
          served: item.served || false,
          addonCustomVariantsDetails: item.addonCustomVariantsDetails || {},
          comboCustomVariantsDetails: item.comboCustomVariantsDetails || {},
          customVariantsDetails: item.customVariantsDetails || {},
          customVariantsQuantities: item.customVariantsQuantities || {},
          selectedCustomVariants: item.selectedCustomVariants || {},
          icePreference: item.icePreference || "without_ice",
          icePrice: Number(item.icePrice) || 0,
          isSpicy: item.isSpicy || false,
          spicyPrice: Number(item.spicyPrice) || 0,
          sugarLevel: item.sugarLevel || "medium",
          // FIXED: Preserve is_combo_offer and offer_description
          is_combo_offer: item.is_combo_offer || false,
          offer_description: item.offer_description || null,
          comboItems: item.comboItems || [], // Include comboItems for combo offers
          kitchenNotes: item.kitchenNotes || {},
          // NEW: Preserve served status fields in active order payload
          servedQuantity: item.servedQuantity || 0,
          servedAddons: item.servedAddons || {},
          servedCombos: item.servedCombos || {},
          servedComboItems: item.servedComboItems || {},
        })),
        timestamp: new Date().toISOString(),
        orderType: orderType || "Dine In",
        status: "Pending",
        paid: false,
      }
      // FIXED: Use dynamic baseUrl for kitchen save
      const apiPathKitchen = baseUrl ? `${baseUrl}/api/kitchen-saved` : '/api/kitchen-saved';
      const kitchenResponse = await axios.post(apiPathKitchen, newOrder, { headers: getHeaders() })
      if (!kitchenResponse.data.success) {
        throw new Error(kitchenResponse.data.error || "Failed to notify kitchen")
      }
      console.log("Order sent to kitchen:", kitchenResponse.data.order_id)
      let message = orderId ? "Order updated successfully!" : "Order saved successfully!";
      if (orderId) {
        // FIXED: Use dynamic baseUrl for order update
        const apiPathUpdate = baseUrl ? `${baseUrl}/api/activeorders/${orderId}` : `/api/activeorders/${orderId}`;
        const updateResponse = await axios.put(apiPathUpdate, newOrder, { headers: getHeaders() })
        if (updateResponse.status === 200) {
          console.log("Order updated successfully")
          message = "Order updated successfully!";
        }
      } else {
        // FIXED: Use dynamic baseUrl for order save
        const apiPathSave = baseUrl ? `${baseUrl}/api/activeorders` : '/api/activeorders';
        const response = await axios.post(apiPathSave, newOrder, { headers: getHeaders() })
        if (response.status === 201) {
          console.log("Order saved successfully")
          setOrderId(response.data.orderId)
          // UPDATED: Set orderNo from backend response for new orders
          setOrderNo(response.data.orderNo)
          currentOrderId = response.data.orderId
        } else {
          throw new Error("Failed to save order")
        }
      }
      const updatedOrders = [
        ...savedOrders.filter((order) => {
          // If we are updating an existing order (orderId exists), only remove that specific order
          if (orderId && order.orderId === orderId) return false;

          // For Dine In orders without orderId, we still use table/floor/chairs matching for legacy compatibility
          if (orderType === "Dine In") {
            const isSameTable = String(order.tableNumber) === String(tableNumber);
            const isSameFloor = order.floor === floor;
            const hasSameChairs = order.chairsBooked.some((chair) => activeChairsBooked.includes(chair));
            return !(isSameTable && isSameFloor && hasSameChairs);
          }

          // For Takeaway/Delivery without orderId, every save is a NEW order, so don't filter anything
          return true;
        }),
        { ...newOrder, orderId: currentOrderId },
      ]
      setSavedOrders(updatedOrders)
      localStorage.setItem("savedOrders", JSON.stringify(updatedOrders))

      // REDUNDANT BOOKEDCHAIRS/TABLES LOGIC REMOVED (Handled by sync effects)
      setWarningMessage(message)
      setWarningType("success")
      setIsConfirmation(true)
      setPendingAction(() => () => {
        handlePaymentCompletion(tableNumber, activeChairsBooked, floor)
        resetOrderState() // FIXED: Use resetOrderState here
        if (orderType === "Dine In") {
          navigate("/table")
        }
      })
    } catch (error) {
      console.error("Error saving order:", error)
      if (error.message !== "Cart is empty" && error.message !== "Please log in") {
        setWarningMessage(`Failed to save order: ${error.response?.data?.error || error.message}`)
        setWarningType("warning")
      }
    } finally {
      setIsSavingOrder(false)
    }
  }
  const handleSetPhoneNumber = () => {
    if (orderType === "Dine In") {
      setIsPhoneNumberSet(true)
      return
    }
    if (phoneNumber.length !== 10) {
      setWarningMessage("Please enter a valid 10-digit phone number.")
      setWarningType("warning")
      return
    }
    handleCustomerSubmit()
  }
  const cancelCart = () => {
    resetOrderState(); // FIXED: use resetOrderState to clear all session IDs
    setWarningMessage("Cart cleared successfully.")
    setWarningType("success")
  }
  const handleActiveOrdersClick = () => {
    navigate("/active-orders")
  }
  const handleNext = () => {
    if (categoryContainerRef.current) {
      categoryContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  }
  const handlePrev = () => {
    if (categoryContainerRef.current) {
      categoryContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  }
  const handleSalesReportNavigation = () => {
    navigate("/sales-reports")
  }
  const handleClosingEntryNavigation = () => {
    navigate("/closing-entry")
  }
  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }
  const confirmLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("selectedOrderType")
    localStorage.removeItem("isOrderTypeSelected")
    navigate("/")
  }
  const cancelLogout = () => {
    setShowLogoutModal(false)
  }
  // UPDATED: Calculate total booked chairs by merging saved orders and current active booking
  const getUniqueBookedChairs = () => {
    const saved = bookedChairs[tableNumber] || [];
    const current = Array.isArray(activeChairsBooked) ? activeChairsBooked.map(Number) : [];
    // Combine and deduplicate
    return [...new Set([...saved.map(Number), ...current])];
  };
  const totalBookedChairs = getUniqueBookedChairs().length;
  const availableChairs = Math.max(0, totalChairs - totalBookedChairs);
  const subtotal = calculateExclTotal(cartItems)
  const vatByRate = getVatByRate(cartItems)
  const totalVat = calculateTaxTotal(cartItems)
  const total = subtotal + totalVat
  const showKitchenColumn = orderType === "Dine In"
  // UPDATED: Price display helper for cart rows - FIXED: Return excl price always (VAT at bottom only); for isComboSub return "Included" or 0
  // FIXED: Add null checks and optional chaining to prevent undefined errors (e.g., item?.icePrice)
  const getPriceDisplay = (item, isMain = false, addonName = null, comboName = null, isIce = false, isSpicy = false, variantName = null, isComboSub = false, showBreakdown = false) => {
    if (!item) return formatPrice(0);

    if (isComboSub) {
      return "Included";
    }
    let excl = 0
    let tax = 0
    let rate = 0
    if (isMain && !isIce && !isSpicy && !variantName) {
      excl = getMainItemTotal(item)
      tax = item.mainTaxTotal || 0
      rate = item.mainTaxRate || 0
      if (showBreakdown && rate > 0) {
        tax = excl * (rate / 100)
      }
    } else if (addonName && !isIce && !isSpicy && !variantName) {
      const qty = Number(item.addonQuantities?.[addonName]) || 1
      excl = (item.addonSizePrices?.[addonName] || 0) * qty
      tax = item.addonTaxes?.[addonName] || 0
      rate = item.addonTaxRates?.[addonName] || 0
    } else if (comboName && !isIce && !isSpicy && !variantName) {
      const qty = Number(item.comboQuantities?.[comboName]) || 1
      excl = (item.comboSizePrices?.[comboName] || 0) * qty
      tax = item.comboTaxes?.[comboName] || 0
      rate = item.comboTaxRates?.[comboName] || 0
    } else if (isIce) {
      const qty = addonName ? (item.addonIceQuantities?.[addonName] || 1) :
        comboName ? (item.comboIceQuantities?.[comboName] || 1) :
          (item.iceQuantity || 1);
      const price = addonName ? (item.addonIcePrices?.[addonName] || 0) :
        comboName ? (item.comboIcePrices?.[comboName] || 0) :
          (item.icePrice || item.ice_price || item.variants?.cold?.ice_price || 0);
      excl = price * qty;
      tax = 0;
    } else if (isSpicy) {
      const qty = addonName ? (item.addonSpicyQuantities?.[addonName] || 1) :
        comboName ? (item.comboSpicyQuantities?.[comboName] || 1) :
          (item.spicyQuantity || 1);
      const price = addonName ? (item.addonSpicyPrices?.[addonName] || 0) :
        comboName ? (item.comboSpicyPrices?.[comboName] || 0) :
          (item.spicyPrice || item.spicy_price || item.variants?.spicy?.spicy_price || 0);
      excl = price * qty;
      tax = 0;
    } else if (variantName) {
      const qty = addonName ? (item.addonCustomVariantsQuantities?.[addonName]?.[variantName] || 1) :
        comboName ? (item.comboCustomVariantsQuantities?.[comboName]?.[variantName] || 1) :
          (item.customVariantsQuantities?.[variantName] || 1);
      const variant = addonName ? (item.addonCustomVariantsDetails?.[addonName]?.[variantName]) :
        comboName ? (item.comboCustomVariantsDetails?.[comboName]?.[variantName]) :
          (item.customVariantsDetails?.[variantName]);
      price = (variant?.price || 0) * qty;
      excl = price;
      tax = 0;
    }
    if (showBreakdown && tax > 0) {
      if (isInclusive) {
        const trueExcl = price / (1 + rate / 100)
        const trueTax = price - trueExcl
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {formatPrice(trueExcl)}&nbsp;+ VAT {rate}% ({formatPrice(trueTax)})&nbsp;=&nbsp;{formatPrice(price)}
          </span>
        )
      }
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
          {formatPrice(excl)}&nbsp;+ VAT {rate}% ({formatPrice(tax)})&nbsp;=&nbsp;{formatPrice(excl + tax)}
        </span>
      )
    }
    // FIXED: For isComboSub, return "Included" (handled above, but keeping logic consistent)
    if (isComboSub) return "Included";
    // FIXED: Always return excl price for cart rows (VAT shown only at bottom summary)
    return formatPrice(excl)
  }

  // 1. Simplify POS grid items to show only base items (Logic extracted for pagination calculations)
  const allGridItems = useMemo(() => {
    return filteredItems.map((item) => ({
      ...item,
      item_name: item.name,
      displayPrice: item.basePrice || 0,
      uniqueId: item.id,
      hasVariants: (item.size?.enabled || item.cold?.enabled || item.spicy?.enabled || (item.custom_variants && item.custom_variants.length > 0))
    }));
  }, [filteredItems]);

  const totalPages = Math.ceil(allGridItems.length / itemsPerPage);

  const isVariantSidebarOpen = activeVariantItem || (posDesign === 'design2' && showPOSGrid && selectedItem && selectedCartItem);

  // Listen for Chatbot messages
  useEffect(() => {
    const handleChatbotMessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'ADD_TO_CART') {
        const itemName = data.item;
        const qty = parseInt(data.quantity) || 1;
        
        // menuItems objects use 'name' field (set at line ~1344 as item.item_name)
        let foundItem = menuItems.find(i => 
          (i.name || '').toLowerCase().trim() === itemName.toLowerCase().trim()
        );
        // Fallback: partial match
        if (!foundItem) {
          foundItem = menuItems.find(i => {
            const n = (i.name || '').toLowerCase();
            return n.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(n);
          });
        }
        
        if (foundItem) {
          // CRITICAL: handleItemUpdate builds cart item using `item_name`, so we must set it
          // from foundItem.name (since menuItems only has `name`, not `item_name`)
          const itemToAdd = {
            ...foundItem,
            name: foundItem.name,
            item_name: foundItem.name,  // <-- this is what handleItemUpdate uses for cart display
            quantity: qty,
            isPOSGrid: true,
          };
          console.log("[Chatbot] Adding to cart:", itemToAdd.name, "x", qty);
          handleItemUpdate(itemToAdd, true);
        } else {
          console.error("[Chatbot] ADD_TO_CART: item not found:", itemName, "Available:", menuItems.map(i => i.name));
          setWarningMessage(`Could not add "${itemName}" — item not found on menu.`);
          setWarningType("warning");
        }
      } else if (data.type === 'REMOVE_FROM_CART') {
        const itemName = data.item;
        setCartItems(prev => prev.filter(item => item.name.toLowerCase() !== itemName.toLowerCase()));
        setBillCartItems(prev => prev.filter(item => item.name.toLowerCase() !== itemName.toLowerCase()));
      } else if (data.type === 'CLEAR_CART') {
        setCartItems([]);
        setBillCartItems([]);
      } else if (data.type === 'ACTION_SAVE') {
        saveOrder();
      } else if (data.type === 'ACTION_CANCEL') {
        cancelCart();
      } else if (data.type === 'PLACE_ORDER') {
        handlePayButtonClick();
      } else if (data.type === 'SET_ORDER_TYPE' || data.type === 'NAVIGATE') {
        if (data.orderType) {
          setOrderType(data.orderType);
          console.log("Updated order type from chatbot to:", data.orderType);
        }
      } else if (data.type === 'SET_TABLE') {
        if (data.tableNumber) setTableNumber(data.tableNumber);
        if (data.chairs) {
          const chairsArray = Array.from({length: parseInt(data.chairs)}, (_, i) => i + 1);
          setActiveChairsBooked(chairsArray);
        }
      } else if (data.type === 'CHECK_MENU_READY') {
        // Chatbot iframe is asking if menu items are loaded yet
        if (menuItems && menuItems.length > 0) {
          // Reply to the chatbot iframe directly
          const iframe = document.getElementById('chatbot-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'MENU_READY', count: menuItems.length }, '*');
          }
        }
        // If menuItems are not loaded yet, don't reply — the iframe will retry
      }
    };

    window.addEventListener('message', handleChatbotMessage);
    return () => window.removeEventListener('message', handleChatbotMessage);
  }, [menuItems, cartItems, saveOrder, cancelCart, handlePayButtonClick, handleItemUpdate]);

  return (
    <div className={`frontpage-container ${showPOSGrid ? "pos-screen-active" : ""} ${posDesign === 'design2' && showPOSGrid ? 'design-2-active' : ''} ${posDesign === 'design3' && showPOSGrid ? 'design-3-active' : ''}`}>
      <div className={`frontpage-sidebar ${showPOSGrid ? "pos-hidden" : ""} ${isSidebarOpen ? "open" : ""}`}>
        {isSidebarOpen && (
          <div className="frontpage-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </div>
        )}
        <div className="sidebar-section-header">
          <ChevronDown size={14} className="section-arrow" />
          <span>PUBLIC</span>
        </div>
        <ul className="navbar-nav mx-auto mb-2 mb-lg-0 d-flex justify-content-start flex-column align-items-center">
          {isPageEnabled('/frontpage') && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/frontpage" ? "active" : ""} cursor-pointer`}
                onClick={() => navigate("/frontpage")}
                title="Home"
              >
                <div className="icon-container">
                  <Home className="digital-icon" />
                </div>
                <span className="nav-item-label">Home</span>
              </a>
            </li>
          )}
          {isPageEnabled('/home') && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/home" ? "active" : ""} cursor-pointer`}
                onClick={() => navigate("/home")}
                title="Type Of Delivery"
                style={{ position: 'relative' }}
              >
                <div className="icon-container">
                  <Truck className="digital-icon" />
                </div>
                <span className="nav-item-label">Type Of Delivery</span>
                {isKeyboardShortcutsEnabled && <span className="shortcut-badge-nav">F5</span>}
              </a>
            </li>
          )}
          {isPageEnabled('/table') && orderType === "Dine In" && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/table" ? "active" : ""} cursor-pointer`}
                onClick={() => navigate("/table")}
                title="Table"
              >
                <div className="icon-container">
                  <Armchair className="digital-icon" />
                </div>
                <span className="nav-item-label">Table</span>
              </a>
            </li>
          )}
          {isPageEnabled('/kitchen') && isButtonEnabled('Kitchen') && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/kitchen" ? "active" : ""} cursor-pointer`}
                onClick={() => navigate("/kitchen")}
                title="Kitchen"
                style={{ position: 'relative' }}
              >
                <div className="icon-container">
                  <ChefHat className="digital-icon" />
                </div>
                <span className="nav-item-label">Kitchen</span>
                {isKeyboardShortcutsEnabled && <span className="shortcut-badge-nav">F7</span>}
              </a>
            </li>
          )}
          {isPageEnabled('/salespage') && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/salespage" ? "active" : ""} cursor-pointer`}
                onClick={() => navigate("/salespage")}
                title="Sales Invoice"
                style={{ position: 'relative' }}
              >
                <div className="icon-container">
                  <CircleDollarSign className="digital-icon" />
                </div>
                <span className="nav-item-label">Sales Invoice</span>
                {isKeyboardShortcutsEnabled && <span className="shortcut-badge-nav">F9</span>}
              </a>
            </li>
          )}
          {isPageEnabled('/sales-reports') && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/sales-reports" ? "active" : ""} cursor-pointer`}
                onClick={handleSalesReportNavigation}
                title="Sales Report"
              >
                <div className="icon-container">
                  <BarChart3 className="digital-icon" />
                </div>
                <span className="nav-item-label">Sales Report</span>
              </a>
            </li>
          )}
          {isPageEnabled('/closing-entry') && (
            <li className="nav-item">
              <a
                className={`nav-link ${location.pathname === "/closing-entry" ? "active" : ""} cursor-pointer`}
                onClick={handleClosingEntryNavigation}
                title="Closing Entry"
              >
                <div className="icon-container">
                  <LogOut className="digital-icon" />
                </div>
                <span className="nav-item-label">Closing Entry</span>
              </a>
            </li>
          )}
          <li className="nav-item">
            <a
              className="nav-link cursor-pointer"
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              title="Theme"
            >
              <div className="icon-container">
                <Palette className="digital-icon" />
              </div>
              <span className="nav-item-label">Theme</span>
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${showPOSGrid ? "active" : ""} cursor-pointer`}
              onClick={() => setShowDesignSelector(!showDesignSelector)}
              title="Switch POS Design"
              style={{ position: 'relative' }}
            >
              <div className="icon-container">
                <LayoutGrid className="digital-icon" />
              </div>
              <span className="nav-item-label">POS Design</span>
              {isKeyboardShortcutsEnabled && <span className="shortcut-badge-nav">F11</span>}
            </a>
          </li>
        </ul>
      </div>

      {/* Design Selector Dropdown (similar to theme selector) */}
      {showDesignSelector && (
        <div className="theme-selector-dropdown design-selector">
          <div className="theme-selector-header">
            <h4>Choose POS Design</h4>
            <button className="theme-close-btn" onClick={() => setShowDesignSelector(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="theme-options">
            <button
              className="theme-option"
              onClick={() => {
                setShowPOSGrid(false);
                setShowDesignSelector(false);
                localStorage.setItem("posViewMode", "false");
              }}
            >
              <span className="theme-emoji">⬜</span>
              <span className="theme-name">Normal View</span>
            </button>
            <button
              className={`theme-option ${posDesign === "design1" && showPOSGrid ? "active" : ""}`}
              onClick={() => {
                setPosDesign("design1");
                localStorage.setItem("posDesign", "design1");
                setShowDesignSelector(false);
                setShowPOSGrid(true);
                localStorage.setItem("posViewMode", "true");
              }}
            >
              <span className="theme-emoji">🟦</span>
              <span className="theme-name">POS Screen</span>
            </button>
            <button
              className={`theme-option ${posDesign === "design2" && showPOSGrid ? "active" : ""}`}
              onClick={() => {
                setPosDesign("design2");
                localStorage.setItem("posDesign", "design2");
                setShowDesignSelector(false);
                setShowPOSGrid(true);
                localStorage.setItem("posViewMode", "true");
              }}
            >
              <span className="theme-emoji">🟧</span>
              <span className="theme-name">Design 1</span>
            </button>
            <button
              className={`theme-option ${posDesign === "design3" && showPOSGrid ? "active" : ""}`}
              onClick={() => {
                setPosDesign("design3");
                localStorage.setItem("posDesign", "design3");
                setShowDesignSelector(false);
                setShowPOSGrid(true);
                localStorage.setItem("posViewMode", "true");
              }}
            >
              <span className="theme-emoji">🟩</span>
              <span className="theme-name">Design 2</span>
            </button>
          </div>
        </div>
      )}

      {showThemeSelector && (
        <div className="theme-selector-dropdown">
          <div className="theme-selector-header">
            <h4>Choose Theme</h4>
            <button className="theme-close-btn" onClick={() => setShowThemeSelector(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="theme-options">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`theme-option ${currentTheme === key ? "active" : ""}`}
                onClick={() => handleThemeChange(key)}
              >
                <span className="theme-emoji">{theme.icon}</span>
                <span className="theme-name">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {isSidebarOpen && <div className="frontpage-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      {showThemeSelector && <div className="theme-selector-overlay" onClick={() => setShowThemeSelector(false)}></div>}
      {showDesignSelector && <div className="theme-selector-overlay" onClick={() => setShowDesignSelector(false)}></div>}

      {/* Design 2 & Design 3 Vertical Sidebar */}
      {(posDesign === 'design2' || posDesign === 'design3') && showPOSGrid && (
        <div className="pos-sidebar-nav">
          {isPageEnabled('/frontpage') && <button className="sidebar-nav-item" onClick={() => navigate("/frontpage")}><Home size={22} /><span>Home</span></button>}
          {isPageEnabled('/home') && <button className="sidebar-nav-item" onClick={() => navigate("/home")}><Truck size={22} /><span>Delivery</span></button>}
          {isPageEnabled('/table') && orderType === "Dine In" && <button className="sidebar-nav-item" onClick={() => navigate("/table")}><Armchair size={22} /><span>Table</span></button>}
          {isPageEnabled('/kitchen') && isButtonEnabled('Kitchen') && <button className="sidebar-nav-item" onClick={() => navigate("/kitchen")}><ChefHat size={22} /><span>Kitchen</span></button>}
          {isPageEnabled('/salespage') && <button className="sidebar-nav-item" onClick={() => navigate("/salespage")}><CircleDollarSign size={22} /><span>Invoice</span></button>}
          {isPageEnabled('/sales-reports') && <button className="sidebar-nav-item" onClick={handleSalesReportNavigation}><BarChart3 size={22} /><span>Reports</span></button>}
          {isPageEnabled('/closing-entry') && <button className="sidebar-nav-item" onClick={handleClosingEntryNavigation}><LogOut size={22} /><span>Close</span></button>}
          <button className="sidebar-nav-item" onClick={() => setShowThemeSelector(true)}><Palette size={22} /><span>Theme</span></button>
          <button className="sidebar-nav-item active" onClick={() => setShowDesignSelector(true)}><LayoutGrid size={22} /><span>Design</span></button>
        </div>
      )}

      <div className={`frontpage-main-content ${showPOSGrid ? "pos-full-width" : ""}`}>
        <div className="frontpage-header">
          <div className="frontpage-header-left">
            <div className="frontpage-hamburger" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={28} />
            </div>
            <h2>DINE -8 POS</h2>
          </div>
          <div className="frontpage-search-container header-search" style={{ position: 'relative' }}>
            <Search className="frontpage-search-icon" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              className="frontpage-search-input"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isKeyboardShortcutsEnabled && <span className="shortcut-badge-search">F1</span>}
          </div>
          <div className="frontpage-user-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            {/* Left side: Keyboard Shortcuts Modal Trigger */}
            <div
              className={`keyboard-toggle-btn ${isKeyboardShortcutsEnabled ? 'enabled' : ''}`}
              onClick={() => setShowKeyboardModal(true)}
              title="View Keyboard Shortcuts"
              style={{
                cursor: 'pointer',
                backgroundColor: isKeyboardShortcutsEnabled ? 'var(--accent-color)' : 'var(--bg-secondary)',
                padding: '8px',
                borderRadius: '50%',
                boxShadow: '0 2px 8px var(--shadow-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                border: '1px solid var(--border-color)',
                color: isKeyboardShortcutsEnabled ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Keyboard size={24} />
            </div>

            {/* Left side: Notification Icon */}
            {isPageEnabled('/notifications') && (
              <div
                className="notification-nav-btn"
                onClick={() => navigate('/notifications')}
                title="Notifications"
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '8px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px var(--shadow-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Bell size={24} style={{ color: 'var(--accent-color)' }} />
                {unreadCount > 0 && (
                  <span className="notification-badge-pulse" style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: 'var(--danger-color)',
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '18px',
                    height: '18px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bg-secondary)',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                    zIndex: 10
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
            )}

            {/* Middle: User Email, Date, Time stacked */}
            <div className="frontpage-user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.3' }}>
              <span className="frontpage-user-email" style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user.email}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentDate}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentTime}</span>
            </div>

            {/* Right side: Logout */}
            <a className="frontpage-header-logout" onClick={handleLogoutClick} title="Logout" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#ef4444', transition: 'all 0.3s ease' }}>
              <Power className="digital-icon logout-icon" size={20} />
            </a>

          </div>
        </div>
        <div className="frontpage-content-wrapper">
          <div className="frontpage-left-panel">
            <div className="frontpage-category-search-section">
              {!showPOSGrid && (
                <div className="frontpage-category-nav">
                  <button
                    className="frontpage-nav-arrow left"
                    onClick={handlePrev}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div
                    className="frontpage-categories-container"
                    ref={categoryContainerRef}
                  >
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`frontpage-category-btn ${selectedCategory === (category.includes("Combos Offer") ? "Combos Offer" : category) ? "active" : ""}`}
                        onClick={() => handleFilter(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <button
                    className="frontpage-nav-arrow right"
                    onClick={handleNext}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
            <div className="frontpage-menu-section">
              {showPOSGrid ? (
                /* ── POS GRID VIEW WITH SIDEBAR ── */
                <div className={`frontpage-pos-layout-wrapper ${posDesign === "design2" ? "pos-design-2" : ""} ${posDesign === "design3" ? "pos-design-3" : ""} ${posDesign === "design2" && isSidebarSwappedDesign2 && !isVariantSidebarOpen ? "pos-sidebar-swapped" : ""} ${isVariantSidebarOpen ? "variant-open" : ""}`}>
                  {/* Design 3: Top Category Bar */}
                  {posDesign === "design3" && !isVariantSidebarOpen && (
                    <div className="categories-top">
                      <div className="pos-category-nav-wrapper">
                        <button className="pos-nav-arrow-small left" onClick={handlePrev}>
                          <ChevronLeft size={18} />
                        </button>
                        <div className="pos-category-scroll" ref={categoryContainerRef}>
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              className={`pos-category-btn ${selectedCategory === cat ? "active" : ""}`}
                              onClick={() => handleFilter(cat)}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <button className="pos-nav-arrow-small right" onClick={handleNext}>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category Sidebar - Positioned based on Design */}
                  {posDesign === "design2" && !isVariantSidebarOpen && (
                    <div className="pos-design-2-top-categories">
                      <div className="pos-category-nav-wrapper">
                        <button className="pos-nav-arrow-small left" onClick={handlePrev}>
                          <ChevronLeft size={18} />
                        </button>
                        <div className="pos-design-2-category-scroll" ref={categoryContainerRef}>
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              className={`pos-design-2-category-tab ${selectedCategory === cat ? "active" : ""}`}
                              onClick={() => handleFilter(cat)}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <button className="pos-nav-arrow-small right" onClick={handleNext}>
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`pos-items-grid-container ${isVariantSidebarOpen ? 'shrunk' : ''}`}>
                    <div className="frontpage-pos-items">
                      <div className="pos-grid-scroll-area">
                        <div className="row g-2">
                          {(() => {
                            const currentGridItems = (posDesign === 'design2' || posDesign === 'design3')
                              ? allGridItems
                              : allGridItems.slice((posPage - 1) * itemsPerPage, posPage * itemsPerPage);

                            return (
                              <>
                                {currentGridItems.map((gridItem) => (
                                  <div key={gridItem.uniqueId} className={`${isVariantSidebarOpen ? 'col-6 col-md-3' : 'col-6 col-md-2'} mb-2`}>
                                    <div
                                      tabIndex="0"
                                      className={`${posDesign === 'design3' ? 'design-3-card' : posDesign === 'design2' ? 'pos-item-card pos-design-2-card' : 'pos-item-card'} ${activeVariantItem?.id === gridItem.id ? 'active-selection' : ''}`}
                                      onClick={() => {
                                        if (gridItem.hasVariants) {
                                          if (posDesign === 'design2') {
                                            setActiveVariantItem(gridItem);
                                          } else {
                                            setSelectedItem(gridItem);
                                          }
                                        } else {
                                          handleItemUpdate({ ...gridItem, quantity: 1, isPOSGrid: true });
                                          setWarningMessage(`${gridItem.item_name} added!`);
                                          setWarningType("success");
                                        }
                                      }}
                                    >
                                      <div className={posDesign === 'design2' ? 'pos-design-2-image-wrapper' : 'pos-item-image-wrapper'}>
                                        {posDesign === 'design3' && <span className="item-tag">ITEM</span>}
                                        <img src={gridItem.image || "/static/images/default-item.jpg"} alt={gridItem.item_name} />
                                      </div>
                                      <div className={posDesign === 'design2' ? 'pos-design-2-card-body' : 'pos-card-body'}>
                                        <h6 className={posDesign === 'design2' ? 'pos-design-2-item-name' : 'pos-item-name'}>{gridItem.item_name || gridItem.name}</h6>
                                        <div className={posDesign === 'design2' ? 'pos-design-2-item-price' : `pos-item-price ${posDesign === 'design3' ? 'text-primary' : 'text-success'} mt-1`}>{formatPrice(gridItem.displayPrice)}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {currentGridItems.length === 0 && (
                                  <div className="col-12 text-center py-5">
                                    <p className="text-muted">No items found in this category.</p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Pagination Footer */}
                      {totalPages > 1 && posDesign !== 'design2' && posDesign !== 'design3' && (
                        <div className="pos-pagination-footer">
                          {posPage > 1 && (
                            <button className="btn btn-secondary pos-page-btn" onClick={() => setPosPage(p => Math.max(p - 1, 1))}>Previous</button>
                          )}
                          <span className="pos-page-info">Page {posPage} of {totalPages}</span>
                          {posPage < totalPages && (
                            <button className="btn btn-primary pos-page-btn" onClick={() => setPosPage(p => p + 1)}>Next</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VARIANT SIDE PANEL (SIDE TABLE) */}
                  {isVariantSidebarOpen && (
                    <VariantSidePanel
                      item={activeVariantItem || selectedItem}
                      cartItem={activeVariantItem ? null : selectedCartItem}
                      onClose={() => {
                        setActiveVariantItem(null);
                        setSelectedItem(null);
                        setSelectedCartItem(null);
                      }}
                    />
                  )}

                  {/* Design 1: Categories on right if no sidebar */}
                  {posDesign === "design1" && !isVariantSidebarOpen && (
                    <div className="frontpage-pos-categories">
                      <h6 className="pos-category-header">Categories</h6>
                      <div className="pos-category-list">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            className={`pos-category-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => handleFilter(cat)}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── NORMAL CARD VIEW (Simplified) ── */
                <div className={`frontpage-menu-grid ${selectedCategory === "Combos Offer" ? "combo-grid" : ""}`}>
                  {filteredItems.flatMap((item) => {
                    if (item.isCombo) {
                      return [{ ...item, isPoster: true }];
                    }

                    // CASE 2: Main Item - Single Card (User Request: "Normal view item only")
                    // We do NOT split into sizes (S/M/L) here anymore.
                    return [{
                      ...item,
                      displayPrice: item.basePrice,
                      displayName: item.name,
                      preSelectedSize: null
                    }];
                  }).map((item, index) => { // Use index for unique key with UUID fallback
                    if (item.isPoster) {
                      // Render Poster Card (Combo Offer)
                      return (
                        <div key={item.id} className="col-md-6 mb-4">
                          <Card
                            style={posterStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-5px) scale(1.01)";
                              e.currentTarget.style.boxShadow = "0 8px 15px rgba(0, 0, 0, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0) scale(1)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                            }}
                          >
                            <div style={logoStyle}>K</div>
                            <h4 style={offerNameStyle}>{item.name}</h4>
                            {hasActiveOffer(item) && (
                              <p style={offerPeriodStyle}>
                                <strong>Offer Period:</strong> {new Date(item.offer_start_time).toLocaleDateString()} {new Date(item.offer_start_time).toLocaleTimeString()} to {new Date(item.offer_end_time).toLocaleDateString()} {new Date(item.offer_end_time).toLocaleTimeString()}
                              </p>
                            )}
                            {(() => {
                              const uploadedImages = getUploadedImages(item);
                              if (uploadedImages.length > 0) {
                                return (
                                  <div style={uploadedImagesStyle}>
                                    {uploadedImages.map((imgPath, idx) => (
                                      <img key={idx} src={`${baseUrl}${imgPath}`} alt="" style={uploadedImageThumbStyle} onError={(e) => { e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23eee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22Arial%22%20font-size%3D%2212%22%20fill%3D%22%23aaa%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E"; }} />
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <ul style={itemsListStyle}>
                              {getComboItemsWithImages(item).map((itemWithImage, idx) => (
                                <li key={idx} style={itemsListItemStyle}>
                                  {itemWithImage.image && <img src={itemWithImage.image} alt="" style={itemImageStyle} onError={(e) => { e.target.style.display = "none"; }} />}
                                  {itemWithImage.name}
                                </li>
                              ))}
                            </ul>
                            <p style={totalPriceStyle}>
                              Total Price: {hasActiveOffer(item) ? (
                                <>
                                  <span style={{ ...strikethroughStyle, color: "#aaa", fontSize: "16px" }}>{formatPrice(item.basePrice)}</span>
                                  <span style={{ color: "#fdd835", fontSize: "18px" }}>{formatPrice(item.offer_price)}</span>
                                </>
                              ) : (
                                <span style={{ color: "#ffffff", fontSize: "18px" }}>{formatPrice(item.basePrice)}</span>
                              )}
                            </p>
                            {hasActiveOffer(item) && <p style={limitedOfferStyle}>LIMITED OFFERS! Place Your Order</p>}
                            <Button
                              variant="success"
                              onClick={() => handleItemUpdate({ ...item, quantity: 1 })}
                              style={viewButtonStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f0f0f0"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; }}
                            >
                              Add to Cart
                            </Button>
                          </Card>
                        </div>
                      );
                    }

                    // Render Normal Card (Main Item / Variant)
                    return (
                      <div key={item.id + (item.preSelectedSize || "")} tabIndex="0" className="frontpage-menu-card" onClick={() => handleItemClick(item, item.preSelectedSize)}>
                        {/* Size Badge */}
                        {item.preSelectedSize && (
                          <span className="badge bg-primary" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
                            {item.preSelectedSize}
                          </span>
                        )}
                        {/* Type Badge - NEW: Display Item/Addon/Combo tag */}
                        <span
                          className={`badge ${item.type === 'addon' ? 'bg-info text-dark' : item.type === 'item_combo' ? 'bg-warning text-dark' : 'bg-secondary'}`}
                          style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}
                        >
                          {item.type === 'addon' ? 'Addon' : item.type === 'item_combo' ? 'Combo' : 'Item'}
                        </span>

                        <img src={item.image || "/placeholder.svg"} alt={item.displayName} className="frontpage-menu-card-image" />
                        <div className="frontpage-menu-card-content">
                          <h5 className="frontpage-menu-card-name" style={{ fontSize: '1rem', fontWeight: 600 }}>{item.displayName}</h5>
                          <p className="frontpage-menu-card-price">
                            {formatPrice(hasActiveOffer(item) && !item.isVariantCard ? item.offer_price : item.displayPrice)}
                          </p>
                          {hasActiveOffer(item) && !item.isVariantCard && <span className="frontpage-offer-badge">Offer</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="frontpage-billing-section">
            {/* NEW: Billing Order Buttons - Only Visible in POS Grid Mode */}
            {showPOSGrid && (() => {
              const settings = workflowSettings || {};
              const g = settings.global_modules;
              const coreKeys = ['Takeaway', 'Dine In', 'Online Delivery'];
              const hasAnyConfig = coreKeys.some(key => settings[key] !== undefined) || (g && Object.keys(g).length > 0);

              const isDineInVisible = !hasAnyConfig || (settings['Dine In']?.enabled === true && g?.table_management?.enabled === true);
              const isTakeawayVisible = !hasAnyConfig || (settings['Takeaway']?.enabled === true && g?.pos_billing?.enabled === true);
              const isDeliveryVisible = !hasAnyConfig || (settings['Online Delivery']?.enabled === true && g?.pos_billing?.enabled === true);

              if (!isDineInVisible && !isTakeawayVisible && !isDeliveryVisible) return null;

              return (
                <div className="billing-order-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  {isDineInVisible && (
                    <button
                      className={`billing-order-btn header-btn-dinein ${orderType === 'Dine In' ? 'active' : ''}`}
                      onClick={() => handleOrderTypeChange('Dine In')}
                      style={{ flex: 1, padding: '8px 5px', fontSize: '0.85rem' }}
                    >
                      <span>🍽️</span> Dine In
                    </button>
                  )}
                  {isTakeawayVisible && (
                    <button
                      className={`billing-order-btn header-btn-takeaway ${(orderType === 'Takeaway' || orderType === 'Take Away') ? 'active' : ''}`}
                      onClick={() => handleOrderTypeChange('Takeaway')}
                      style={{ flex: 1, padding: '8px 5px', fontSize: '0.85rem' }}
                    >
                      <span>🍔</span> Takeaway
                    </button>
                  )}
                  {isDeliveryVisible && (
                    <button
                      className={`billing-order-btn header-btn-delivery ${orderType === 'Online Delivery' ? 'active' : ''}`}
                      onClick={() => handleOrderTypeChange('Online Delivery')}
                      style={{ flex: 1, padding: '8px 5px', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title="Online Delivery"
                    >
                      <span>🚚</span> Delivery
                    </button>
                  )}
                  {/* Display Order No if available */}
                  {orderNo && (
                    <div className="mt-2 text-center">
                      <span className="badge bg-secondary" style={{ fontSize: '0.9rem' }}>
                        Order #: {orderNo}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="frontpage-billing-tabs">
              {isPageEnabled('/active-orders') && isButtonEnabled('Active Orders') && (
                <button
                  className={`frontpage-billing-tab ${location.pathname === "/active-orders" ? "active" : ""}`}
                  onClick={handleActiveOrdersClick}
                  style={{ position: 'relative' }}
                >
                  Active Orders
                  {isKeyboardShortcutsEnabled && <span className="shortcut-badge-nav" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9em', padding: '4px 8px' }}>F6</span>}
                </button>
              )}
              <button
                className={`frontpage-billing-tab ${showCustomerSection ? "active" : ""}`}
                onClick={() => setShowCustomerSection(true)}
                style={{ position: 'relative' }}
              >
                Customers
                {isKeyboardShortcutsEnabled && <span className="shortcut-badge-nav" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9em', padding: '4px 8px' }}>F8</span>}
              </button>
            </div>
            {showCustomerSection && (
              <div className="frontpage-customer-info" ref={customerSectionRef}>
                <div className="frontpage-input-group">
                  <input
                    type="text"
                    className="frontpage-customer-input"
                    placeholder="Enter Customer Name"
                    value={customerName}
                    onChange={handleCustomerNameChange}
                    onKeyPress={(e) => orderType !== "Dine In" && e.key === "Enter" && handleCustomerSubmit()}
                  />
                  {filteredCustomers.length > 0 && customerName.trim() && (
                    <ul className="frontpage-customer-suggestions">
                      {filteredCustomers.map((customer, index) => (
                        <li key={index} onClick={() => handleCustomerSelect(customer)}>
                          {customer.customer_name} ({customer.phone_number})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="frontpage-phone-input-group" style={{ position: 'relative' }}>
                  <div className="frontpage-phone-prefix">
                    <button className="frontpage-isd-button" onClick={() => setShowISDCodeDropdown(!showISDCodeDropdown)}>
                      {selectedISDCode} <i className="bi bi-chevron-down"></i>
                    </button>
                    {showISDCodeDropdown && (
                      <ul className="frontpage-isd-code-dropdown">
                        {isdCodes.map((isd, index) => (
                          <li key={index} onClick={() => handleISDCodeSelect(isd.code)}>
                            {isd.code} ({isd.country})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    ref={phoneNumberRef}
                    type="text"
                    className="frontpage-phone-input"
                    placeholder="Enter Phone Number"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                  />
                </div>
                {orderType !== "Dine In" && (
                  <>
                    {/* NEW: Copy suggestion for WhatsApp */}
                    {phoneNumber && !whatsappNumber && (
                      <div className="copy-suggestion">
                        <span>Use the same number for WhatsApp?</span>
                        <button type="button" className="copy-btn" onClick={handleCopyPhoneToWhatsapp}>
                          Copy
                        </button>
                      </div>
                    )}
                    <div className="frontpage-phone-input-group">
                      <div className="frontpage-phone-prefix">
                        <button className="frontpage-isd-button" onClick={() => setShowWhatsappISDCodeDropdown(!showWhatsappISDCodeDropdown)}>
                          {whatsappISDCode} <i className="bi bi-chevron-down"></i>
                        </button>
                        {showWhatsappISDCodeDropdown && (
                          <ul className="frontpage-isd-code-dropdown">
                            {isdCodes.map((isd, index) => (
                              <li key={index} onClick={() => handleWhatsappISDCodeSelect(isd.code)}>
                                {isd.code} ({isd.country})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <input
                        type="text"
                        className="frontpage-phone-input"
                        placeholder="Enter WhatsApp Number"
                        value={whatsappNumber}
                        onChange={handleWhatsappNumberChange}
                      />
                    </div>
                    <div className="frontpage-input-group">
                      <label>Country</label>
                      <SearchableSelect
                        options={countryList}
                        value={deliveryAddress.country}
                        onChange={(value) => {
                          handleDeliveryAddressChange("country", value);
                          handleDeliveryAddressChange("field1", "");
                          handleDeliveryAddressChange("field2", "");
                          handleDeliveryAddressChange("field3", "");
                        }}
                        placeholder="Select Country"
                        allowCreateNew={true}
                        onCreateRequest={(val) => handleOpenAddModal('country', val, val)}
                        createNewLabel="Country"
                      />
                    </div>
                    {/* FIELD 1 */}
                    {deliveryAddress.country && (
                      <div className="frontpage-input-group">
                        <label>{getAddressLabels(deliveryAddress.country, addressStructure)[0]}</label>
                        <SearchableSelect
                          options={getOptionsForField('field1', deliveryAddress.country, addressStructure, linkedValues)}
                          value={deliveryAddress.field1}
                          onChange={(value) => {
                            handleDeliveryAddressChange("field1", value);
                            handleDeliveryAddressChange("field2", "");
                            handleDeliveryAddressChange("field3", "");
                          }}
                          placeholder={`Select ${getAddressLabels(deliveryAddress.country, addressStructure)[0]}`}
                          allowCreateNew={true}
                          onCreateRequest={(val) => handleOpenAddModal('field1', val, deliveryAddress.country)}
                          createNewLabel={getAddressLabels(deliveryAddress.country, addressStructure)[0]}
                        />
                      </div>
                    )}
                    {/* FIELD 2 (filtered by selected Field1) */}
                    {deliveryAddress.country && deliveryAddress.field1 && (
                      <div className="frontpage-input-group">
                        <label>{getAddressLabels(deliveryAddress.country, addressStructure)[1]}</label>
                        <SearchableSelect
                          options={getFilteredValues("field2")}
                          value={deliveryAddress.field2}
                          onChange={(value) => handleDeliveryAddressChange("field2", value)}
                          placeholder={`Select ${getAddressLabels(deliveryAddress.country, addressStructure)[1]}`}
                          allowCreateNew={true}
                          onCreateRequest={(val) => handleOpenAddModal('field2', val, deliveryAddress.country, deliveryAddress.field1)}
                          createNewLabel={getAddressLabels(deliveryAddress.country, addressStructure)[1]}
                        />
                      </div>
                    )}
                    {/* FIELD 3 (shown always if defined) */}
                    {deliveryAddress.country && deliveryAddress.field2 && getAddressLabels(deliveryAddress.country, addressStructure)[2] !== "N/A" && (
                      <div className="frontpage-input-group">
                        <label>{getAddressLabels(deliveryAddress.country, addressStructure)[2]}</label>
                        <SearchableSelect
                          options={getFilteredValues("field3")}
                          value={deliveryAddress.field3}
                          onChange={(value) => handleDeliveryAddressChange("field3", value)}
                          placeholder={`Select ${getAddressLabels(deliveryAddress.country, addressStructure)[2]}`}
                          allowCreateNew={true}
                          onCreateRequest={(val) => handleOpenAddModal('field3', val, deliveryAddress.country, deliveryAddress.field2)}
                          createNewLabel={getAddressLabels(deliveryAddress.country, addressStructure)[2]}
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      className="frontpage-customer-input"
                      placeholder="Enter Flat/Villa No"
                      value={deliveryAddress.flat_villa_no}
                      onChange={(e) => handleDeliveryAddressChange("flat_villa_no", e.target.value)}
                    />
                    <input
                      type="text"
                      className="frontpage-customer-input"
                      placeholder="Enter Building Name"
                      value={deliveryAddress.building_name}
                      onChange={(e) => handleDeliveryAddressChange("building_name", e.target.value)}
                    />
                    <input
                      type="email"
                      className="frontpage-customer-input"
                      placeholder="Enter Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />

                    {/* Dynamic Doctype Fields */}
                    {doctypeFields.filter(f => !f.is_default && f.type !== 'Table').map(f => (
                      <div key={f.id} className="frontpage-input-group">
                        <label>{f.label} {f.mandatory && <span className="required">*</span>}</label>
                        {f.allow_create_new ? (
                          <SearchableSelect
                            options={[]}
                            value={dynamicValues[f.id] || ""}
                            onChange={(val) => setDynamicValues({ ...dynamicValues, [f.id]: val })}
                            placeholder={`Select / Create ${f.label}`}
                            allowCreateNew={true}
                          />
                        ) : (
                          <input
                            type={f.type === 'Number' ? 'number' : f.type === 'Date' ? 'date' : 'text'}
                            className="frontpage-customer-input"
                            value={dynamicValues[f.id] || ""}
                            onChange={(e) => setDynamicValues({ ...dynamicValues, [f.id]: e.target.value })}
                            placeholder={f.label}
                          />
                        )}
                      </div>
                    ))}
                    <div className="frontpage-input-group">
                      <select
                        className="frontpage-customer-input"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                      >
                        <option value="">Select Customer Group</option>
                        {customerGroups.map((group) => (
                          <option key={group._id} value={group._id}>
                            {group.group_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="frontpage-add-group-btn" onClick={() => setShowGroupModal(true)}>
                      Add New Group
                    </button>
                    <button className="frontpage-save-customer-btn" onClick={handleCustomerSubmit}>
                      Save Customer
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="frontpage-order-details">
              {orderType === "Dine In" && tableNumber && tableNumber !== "N/A" && (
                <>
                  <h4 className="frontpage-order-header">
                    Order for Table {tableNumber}, Chairs {Array.isArray(activeChairsBooked) ? activeChairsBooked.join(", ") : "None"}
                  </h4>
                  <div className="frontpage-chairs-container">
                    {totalChairs > 0 ? (
                      <>
                        {Array.from({ length: totalBookedChairs }).map((_, index) => (
                          <i
                            key={`booked-${index}`}
                            className="fa-solid fa-chair frontpage-chair-icon frontpage-booked-chair"
                          ></i>
                        ))}
                        {Array.from({ length: availableChairs }).map((_, index) => (
                          <i
                            key={`available-${index}`}
                            className="fa-solid fa-chair frontpage-chair-icon frontpage-available-chair"
                          ></i>
                        ))}
                      </>
                    ) : (
                      <span>No chairs</span>
                    )}
                  </div>
                  <div className="frontpage-chair-status">
                    {totalChairs > 0 && (
                      <span>
                        {totalBookedChairs} booked, {availableChairs} available
                      </span>
                    )}
                  </div>
                </>
              )}
              {(customerName || phoneNumber || whatsappNumber) && (
                <div className="frontpage-selected-customer">
                  {customerName && <p>Customer: {customerName}</p>}
                  {phoneNumber && (
                    <p>
                      Phone: {selectedISDCode}
                      {phoneNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="frontpage-cart-section">
              {posDesign === 'design2' && showPOSGrid ? (
                <div className="design2-cart-items-wrapper">
                  <table className="design2-cart-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Items</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'left' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.filter(item => item && item.id).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="frontpage-empty-cart">Cart is empty.</td>
                        </tr>
                      ) : (
                        cartItems.filter(item => item && item.id).map((item, index) => (
                          <React.Fragment key={item.id}>
                            <tr className="d2-cart-row">
                              <td>
                                <div className="d2-item-name-cell">
                                  <div className="d2-item-title-row">
                                    <span className="d2-item-name" onClick={() => handleCartItemClick(item)}>
                                      {item.item_name || item.name} {item.selectedSize && `(${item.selectedSize})`}
                                    </span>
                                    <button className="d2-edit-icon" onClick={() => handleCartItemClick(item)} title="Edit Variants">
                                      <Edit3 size={12} />
                                    </button>
                                  </div>
                                  <div className="d2-item-amount">Amount {formatPrice(item.basePrice || item.price_list_rate || 0)}</div>

                                  {/* Sub-items directly inside the first column */}
                                  {!item.isStandaloneAddon && !item.isStandaloneCombo && item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                                    <div key={`${item.id}-comboitem-${cIndex}`} style={{ marginTop: "4px" }}>
                                      <div className="d2-sub-name">+ {comboItem.name}</div>
                                    </div>
                                  ))}
                                  {!item.isCombo && !item.isStandaloneCustomVariant && item.cartItemAddons && item.cartItemAddons.map((addon, aIndex) => (
                                    <div key={`${item.id}-addon-${aIndex}`} style={{ marginTop: "4px" }}>
                                      <div className="d2-sub-name">+ {addon.name}</div>
                                      <div className="d2-item-amount">Amount {formatPrice(addon.price)}</div>
                                    </div>
                                  ))}
                                  {item.isSpicy && (
                                    <div style={{ marginTop: "4px" }}>
                                      <div className="d2-sub-name">+ Spicy</div>
                                      {(Number(item.spicyPrice) > 0 || Number(item.spicy_price) > 0) && (
                                        <div className="d2-item-amount">Amount {formatPrice(Number(item.spicyPrice) || Number(item.spicy_price) || 0)}</div>
                                      )}
                                    </div>
                                  )}
                                  {item.icePreference && item.icePreference !== 'without_ice' && (
                                    <div style={{ marginTop: "4px" }}>
                                      <div className="d2-sub-name">+ Ice</div>
                                      {(Number(item.icePrice) > 0 || Number(item.ice_price) > 0) && (
                                        <div className="d2-item-amount">Amount {formatPrice(Number(item.icePrice) || Number(item.ice_price) || 0)}</div>
                                      )}
                                    </div>
                                  )}
                                  {item.sugarLevel && item.sugarLevel !== 'medium' && (
                                    <div style={{ marginTop: "4px" }}>
                                      <div className="d2-sub-name">+ Sugar ({item.sugarLevel})</div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <div className="d2-qty-pill">
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    const newQty = Math.max(1, (Number(item.quantity) || 1) - 1);
                                    handleQuantityChange(item.id, newQty, "item");
                                  }}>-</button>
                                  <span>{item.quantity || 1}</span>
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    const newQty = (Number(item.quantity) || 1) + 1;
                                    handleQuantityChange(item.id, newQty, "item");
                                  }}>+</button>
                                </div>
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <div className="d2-price-actions">
                                  <span className="d2-price-text">{formatPrice(item.totalPrice)}</span>
                                  <div className="d2-action-icons">
                                    <button className="d2-discount-btn" title="Discount"><Percent size={14} /></button>
                                    <button className="d2-delete-btn" onClick={(e) => { e.stopPropagation(); removeFromCart(item); }} title="Remove"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <table className="frontpage-cart-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center', padding: '8px 4px' }}>T.No.</th>
                      <th>Item Details</th>
                      <th>Qty</th>
                      <th>Price</th>
                      {showKitchenColumn && <th>Kitchen</th>}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* FIXED: Filter out undefined/invalid items to prevent render errors */}
                    {cartItems.filter(item => item && item.id).length === 0 ? (
                      <tr>
                        <td colSpan={showKitchenColumn ? 6 : 5} className="frontpage-empty-cart">
                          Cart is empty.
                        </td>
                      </tr>
                    ) : (
                      cartItems.filter(item => item && item.id).map((item, index) => (
                        <React.Fragment key={item.id}>
                          <tr className={activeRowId === item.id ? 'active-cart-row' : ''}>
                            <td style={{ width: '45px', textAlign: 'center', padding: '8px 4px' }}>{tableNumber !== "N/A" ? tableNumber : index + 1}</td>
                            <td>
                              <div className="frontpage-cart-item-details">
                                {/* UPDATED: Show images for all items (including Predefined Variants/Sizes) EXCEPT Standalone Custom Variants */}
                                {!item.isStandaloneCustomVariant && (
                                  <img
                                    src={item.image || "/placeholder.svg"}
                                    alt={item.name}
                                    className="frontpage-cart-item-image"
                                    onError={(e) => (e.target.src = "/static/images/default-item.jpg")}
                                    onClick={() => handleCartItemClick(item)}
                                  />
                                )}
                                <span className="frontpage-cart-item-link" onClick={() => handleCartItemClick(item)}>
                                  {item.item_name || item.name} {item.selectedSize && `(${item.selectedSize})`}
                                </span>
                              </div>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="frontpage-cart-quantity-input"
                                value={focusedInputKey === `${item.id}-item` ? (tempQuantity !== null ? tempQuantity : "") : (item.quantity || 1)}
                                onFocus={() => {
                                  setFocusedInputKey(`${item.id}-item`);
                                  setTempQuantity("");
                                }}
                                onBlur={() => {
                                  setFocusedInputKey(null);
                                  setTempQuantity(null);
                                }}
                                onChange={(e) => {
                                  setTempQuantity(e.target.value);
                                  handleQuantityChange(item.id, e.target.value, "item");
                                }}
                                min="1"
                              />
                            </td>
                            <td>
                              {item.isCombo && item.originalBasePrice ? (
                                <>
                                  <span className="strikethroughStyle">{formatPrice(item.originalBasePrice * item.quantity)}</span> {getPriceDisplay(item, true)}
                                </>
                              ) : item.originalBasePrice ? (
                                <>
                                  <span className="strikethroughStyle">{formatPrice(getOriginalMainItemTotal(item))}</span> {getPriceDisplay(item, true)}
                                </>
                              ) : (
                                getPriceDisplay(item, true)
                              )}
                            </td>
                            {showKitchenColumn && <td>{item.kitchen || "Main Kitchen"}</td>}
                            <td>
                              <button className="frontpage-remove-btn" onClick={() => removeFromCart(item)}>
                                <X size={18} />
                              </button>
                            </td>
                          </tr>
                          {/* Render sub-rows ONLY if NOT standalone addon/combo */}
                          {!item.isStandaloneAddon && !item.isStandaloneCombo && (
                            <>
                              {item.isCombo && item.comboItems && item.comboItems.map((comboItem, cIndex) => (
                                <tr key={`${item.id}-comboitem-${cIndex}`} className={activeRowId === `${item.id}-comboitem-${cIndex}` ? 'active-cart-row' : ''}>
                                  <td></td>
                                  <td>
                                    <div className="frontpage-cart-item-details">
                                      <img
                                        src={comboItem.image || "/placeholder.svg"}
                                        alt={comboItem.name}
                                        className="frontpage-cart-item-image"
                                        onError={(e) => (e.target.src = "/static/images/default-item.jpg")}
                                      />
                                      <span className="frontpage-cart-item-addon">{comboItem.name}</span>
                                    </div>
                                  </td>
                                  <td>{item.quantity}</td>
                                  <td>{getPriceDisplay(item, false, null, null, false, false, false, true)}</td>
                                  {showKitchenColumn && <td>{comboItem.kitchen || "Main Kitchen"}</td>}
                                  <td></td>
                                </tr>
                              ))}
                              {item.icePreference === "with_ice" && (
                                <tr className={activeRowId === `${item.id}-ice` ? 'active-cart-row' : ''}>
                                  <td></td>
                                  <td>
                                    <div className="frontpage-cart-item-option">Ice</div>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="frontpage-cart-quantity-input"
                                      value={focusedInputKey === `${item.id}-ice` ? (tempQuantity !== null ? tempQuantity : "") : (item.iceQuantity || 1)}
                                      onFocus={() => {
                                        setFocusedInputKey(`${item.id}-ice`);
                                        setTempQuantity("");
                                      }}
                                      onBlur={() => {
                                        setFocusedInputKey(null);
                                        setTempQuantity(null);
                                      }}
                                      onChange={(e) => {
                                        setTempQuantity(e.target.value);
                                        handleQuantityChange(item.id, e.target.value, "ice");
                                      }}
                                      min="1"
                                    />
                                  </td>
                                  <td>{getPriceDisplay(item, false, null, null, true)}</td>
                                  {showKitchenColumn && <td></td>}
                                  <td>
                                    <button
                                      className="frontpage-remove-btn"
                                      onClick={() => handleItemUpdate({ ...item, icePreference: "without_ice", icePrice: 0 })}
                                    >
                                      <X size={18} />
                                    </button>
                                  </td>
                                </tr>
                              )}
                              {item.isSpicy && (
                                <tr className={activeRowId === `${item.id}-spicy` ? 'active-cart-row' : ''}>
                                  <td></td>
                                  <td>
                                    <div className="frontpage-cart-item-option">Spicy</div>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="frontpage-cart-quantity-input"
                                      value={focusedInputKey === `${item.id}-spicy` ? (tempQuantity !== null ? tempQuantity : "") : (item.spicyQuantity || 1)}
                                      onFocus={() => {
                                        setFocusedInputKey(`${item.id}-spicy`);
                                        setTempQuantity("");
                                      }}
                                      onBlur={() => {
                                        setFocusedInputKey(null);
                                        setTempQuantity(null);
                                      }}
                                      onChange={(e) => {
                                        setTempQuantity(e.target.value);
                                        handleQuantityChange(item.id, e.target.value, "spicy");
                                      }}
                                      min="1"
                                    />
                                  </td>
                                  <td>{getPriceDisplay(item, false, null, null, false, true)}</td>
                                  {showKitchenColumn && <td></td>}
                                  <td>
                                    <button
                                      className="frontpage-remove-btn"
                                      onClick={() => handleItemUpdate({ ...item, isSpicy: false, spicyPrice: 0 })}
                                    >
                                      <X size={18} />
                                    </button>
                                  </td>
                                </tr>
                              )}
                              {item.customVariantsDetails &&
                                Object.entries(item.customVariantsDetails).map(([variantName, variant]) => (
                                  <tr key={`${item.id}-custom-${variantName}`} className={activeRowId === `${item.id}-custom-${variantName}` ? 'active-cart-row' : ''}>
                                    <td></td>
                                    <td>
                                      <div className="frontpage-cart-item-option">
                                        {variant.heading}: {variant.name}
                                      </div>
                                    </td>
                                    <td>
                                      <input
                                        type="number"
                                        className="frontpage-cart-quantity-input"
                                        value={focusedInputKey === `${item.id}-custom-${variantName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.customVariantsQuantities?.[variantName] || 1)}
                                        onFocus={() => {
                                          setFocusedInputKey(`${item.id}-custom-${variantName}`);
                                          setTempQuantity("");
                                        }}
                                        onBlur={() => {
                                          setFocusedInputKey(null);
                                          setTempQuantity(null);
                                        }}
                                        onChange={(e) => {
                                          setTempQuantity(e.target.value);
                                          handleQuantityChange(item.id, e.target.value, "customVariant", variantName);
                                        }}
                                        min="1"
                                      />
                                    </td>
                                    <td>{formatPrice((variant.price || 0) * (item.customVariantsQuantities?.[variantName] || 1))}</td>
                                    {showKitchenColumn && <td></td>}
                                    <td>
                                      <button
                                        className="frontpage-remove-btn"
                                        onClick={() => removeCustomVariant(item.id, variantName)}
                                      >
                                        <X size={18} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              {item.addonQuantities &&
                                Object.entries(item.addonQuantities).map(
                                  ([addonName, qty]) =>
                                    Number(qty) > 0 && (
                                      <React.Fragment key={`${item.id}-addon-${addonName}`}>
                                        <tr className={activeRowId === `${item.id}-addon-${addonName}` ? 'active-cart-row' : ''}>
                                          <td></td>
                                          <td>
                                            <div className="frontpage-cart-item-details">
                                              <img
                                                src={item.addonImages ? item.addonImages[addonName] || "/static/images/default-addon-image.jpg" : "/static/images/default-addon-image.jpg"}
                                                alt={addonName}
                                                className="frontpage-cart-item-image"
                                                onError={(e) => (e.target.src = "/static/images/default-addon-image.jpg")}
                                              />
                                              <span className="frontpage-cart-item-addon">
                                                {addonName} ({item.addonVariants ? item.addonVariants[addonName]?.size || "M" : "M"})
                                              </span>
                                            </div>
                                          </td>
                                          <td>
                                            <input
                                              type="number"
                                              className="frontpage-cart-quantity-input"
                                              value={focusedInputKey === `${item.id}-addon-${addonName}` ? (tempQuantity !== null ? tempQuantity : "") : (qty || 1)}
                                              onFocus={() => {
                                                setFocusedInputKey(`${item.id}-addon-${addonName}`);
                                                setTempQuantity("");
                                              }}
                                              onBlur={() => {
                                                setFocusedInputKey(null);
                                                setTempQuantity(null);
                                              }}
                                              onChange={(e) => {
                                                setTempQuantity(e.target.value);
                                                handleQuantityChange(item.id, e.target.value, "addon", addonName);
                                              }}
                                              min="1"
                                            />
                                          </td>
                                          <td>{getPriceDisplay(item, false, addonName)}</td>
                                          {showKitchenColumn && (
                                            <td>{item.addonVariants ? item.addonVariants[addonName]?.kitchen || "Main Kitchen" : "Main Kitchen"}</td>
                                          )}
                                          <td>
                                            <button
                                              className="frontpage-remove-btn"
                                              onClick={() => removeAddonOrCombo(item.id, "addon", addonName)}
                                            >
                                              <X size={18} />
                                            </button>
                                          </td>
                                        </tr>
                                        {item.addonVariants?.[addonName]?.cold === 'with_ice' && (
                                          <tr>
                                            <td></td>
                                            <td>
                                              <div className="frontpage-cart-item-option">{addonName} (Ice)</div>
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                className="frontpage-cart-quantity-input"
                                                value={focusedInputKey === `${item.id}-addon-ice-${addonName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.addonIceQuantities?.[addonName] || 1)}
                                                onFocus={() => {
                                                  setFocusedInputKey(`${item.id}-addon-ice-${addonName}`);
                                                  setTempQuantity("");
                                                }}
                                                onBlur={() => {
                                                  setFocusedInputKey(null);
                                                  setTempQuantity(null);
                                                }}
                                                onChange={(e) => {
                                                  setTempQuantity(e.target.value);
                                                  handleQuantityChange(item.id, e.target.value, "addonIce", addonName);
                                                }}
                                                min="1"
                                              />
                                            </td>
                                            <td>{getPriceDisplay(item, false, addonName, null, true)}</td>
                                            {showKitchenColumn && <td></td>}
                                            <td>
                                              <button
                                                className="frontpage-remove-btn"
                                                onClick={() => {
                                                  const updatedVariants = {
                                                    ...item.addonVariants,
                                                    [addonName]: { ...item.addonVariants[addonName], cold: 'without_ice' },
                                                  }
                                                  handleItemUpdate({
                                                    ...item,
                                                    addonVariants: updatedVariants,
                                                    addonIcePrices: { ...item.addonIcePrices, [addonName]: 0 },
                                                  })
                                                }}
                                              >
                                                <X size={18} />
                                              </button>
                                            </td>
                                          </tr>
                                        )}
                                        {item.addonVariants?.[addonName]?.spicy && (
                                          <tr>
                                            <td></td>
                                            <td>
                                              <div className="frontpage-cart-item-option">{addonName} (Spicy)</div>
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                className="frontpage-cart-quantity-input"
                                                value={focusedInputKey === `${item.id}-addon-spicy-${addonName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.addonSpicyQuantities?.[addonName] || 1)}
                                                onFocus={() => {
                                                  setFocusedInputKey(`${item.id}-addon-spicy-${addonName}`);
                                                  setTempQuantity("");
                                                }}
                                                onBlur={() => {
                                                  setFocusedInputKey(null);
                                                  setTempQuantity(null);
                                                }}
                                                onChange={(e) => {
                                                  setTempQuantity(e.target.value);
                                                  handleQuantityChange(item.id, e.target.value, "addonSpicy", addonName);
                                                }}
                                                min="1"
                                              />
                                            </td>
                                            <td>{getPriceDisplay(item, false, addonName, null, false, true)}</td>
                                            {showKitchenColumn && <td></td>}
                                            <td>
                                              <button
                                                className="frontpage-remove-btn"
                                                onClick={() => {
                                                  const updatedVariants = {
                                                    ...item.addonVariants,
                                                    [addonName]: { ...item.addonVariants[addonName], spicy: false },
                                                  }
                                                  handleItemUpdate({
                                                    ...item,
                                                    addonVariants: updatedVariants,
                                                    addonSpicyPrices: { ...item.addonSpicyPrices, [addonName]: 0 },
                                                  })
                                                }}
                                              >
                                                <X size={18} />
                                              </button>
                                            </td>
                                          </tr>
                                        )}
                                        {item.addonVariants?.[addonName]?.sugar &&
                                          item.addonVariants[addonName].sugar !== "medium" && (
                                            <tr>
                                              <td></td>
                                              <td>
                                                <div className="frontpage-cart-item-option">
                                                  {addonName} (Sugar:{" "}
                                                  {item.addonVariants[addonName].sugar.charAt(0).toUpperCase() +
                                                    item.addonVariants[addonName].sugar.slice(1)}
                                                  )
                                                </div>
                                              </td>
                                              <td>
                                                <input
                                                  type="number"
                                                  className="frontpage-cart-quantity-input"
                                                  value={focusedInputKey === `${item.id}-addon-${addonName}` ? (tempQuantity !== null ? tempQuantity : "") : (qty || 1)}
                                                  onFocus={() => {
                                                    setFocusedInputKey(`${item.id}-addon-${addonName}`);
                                                    setTempQuantity("");
                                                  }}
                                                  onBlur={() => {
                                                    setFocusedInputKey(null);
                                                    setTempQuantity(null);
                                                  }}
                                                  onChange={(e) => {
                                                    setTempQuantity(e.target.value);
                                                    handleQuantityChange(item.id, e.target.value, "addon", addonName);
                                                  }}
                                                  min="1"
                                                />
                                              </td>
                                              <td>{formatPrice(0)}</td> {/* UPDATED: Use formatPrice */}
                                              {showKitchenColumn && <td></td>}
                                              <td>
                                                <button
                                                  className="frontpage-remove-btn"
                                                  onClick={() => {
                                                    const updatedVariants = {
                                                      ...item.addonVariants,
                                                      [addonName]: { ...item.addonVariants[addonName], sugar: "medium" },
                                                    }
                                                    handleItemUpdate({
                                                      ...item,
                                                      addonVariants: updatedVariants,
                                                    })
                                                  }}
                                                >
                                                  <X size={18} />
                                                </button>
                                              </td>
                                            </tr>
                                          )}
                                        {item.addonCustomVariantsDetails?.[addonName] &&
                                          Object.entries(item.addonCustomVariantsDetails[addonName]).map(
                                            ([variantName, variant]) => (
                                              <tr key={`${item.id}-addon-${addonName}-custom-${variantName}`}>
                                                <td></td>
                                                <td>
                                                  <div className="frontpage-cart-item-option">
                                                    {addonName} - {variant.heading}: {variant.name}
                                                  </div>
                                                </td>
                                                <td>
                                                  <input
                                                    type="number"
                                                    className="frontpage-cart-quantity-input"
                                                    value={focusedInputKey === `${item.id}-addon-${addonName}-custom-${variantName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.addonCustomVariantsQuantities?.[addonName]?.[variantName] || 1)}
                                                    onFocus={() => {
                                                      setFocusedInputKey(`${item.id}-addon-${addonName}-custom-${variantName}`);
                                                      setTempQuantity("");
                                                    }}
                                                    onBlur={() => {
                                                      setFocusedInputKey(null);
                                                      setTempQuantity(null);
                                                    }}
                                                    onChange={(e) => {
                                                      setTempQuantity(e.target.value);
                                                      handleQuantityChange(item.id, e.target.value, "addonCustomVariant", `${addonName}|${variantName}`);
                                                    }}
                                                    min="1"
                                                  />
                                                </td>
                                                <td>{formatPrice((variant.price || 0) * (item.addonCustomVariantsQuantities?.[addonName]?.[variantName] || 1))}</td>
                                                {showKitchenColumn && <td></td>}
                                                <td>
                                                  <button
                                                    className="frontpage-remove-btn"
                                                    onClick={() => {
                                                      const updatedDetails = { ...item.addonCustomVariantsDetails }
                                                      delete updatedDetails[addonName][variantName]
                                                      if (Object.keys(updatedDetails[addonName]).length === 0) {
                                                        delete updatedDetails[addonName]
                                                      }
                                                      handleItemUpdate({ ...item, addonCustomVariantsDetails: updatedDetails })
                                                    }}
                                                  >
                                                    <X size={18} />
                                                  </button>
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                      </React.Fragment>
                                    ),
                                )}
                              {item.comboQuantities &&
                                Object.entries(item.comboQuantities).map(
                                  ([comboName, qty]) =>
                                    Number(qty) > 0 && (
                                      <React.Fragment key={`${item.id}-combo-${comboName}`}>
                                        <tr className={activeRowId === `${item.id}-combo-${comboName}` ? 'active-cart-row' : ''}>
                                          <td></td>
                                          <td>
                                            <div className="frontpage-cart-item-details">
                                              <img
                                                src={item.comboImages ? item.comboImages[comboName] || "/static/images/default-combo-image.jpg" : "/static/images/default-combo-image.jpg"}
                                                alt={comboName}
                                                className="frontpage-cart-item-image"
                                                onError={(e) => (e.target.src = "/static/images/default-combo-image.jpg")}
                                              />
                                              <span className="frontpage-cart-item-addon">
                                                {comboName} ({item.comboVariants ? item.comboVariants[comboName]?.size || "M" : "M"})
                                              </span>
                                            </div>
                                          </td>
                                          <td>
                                            <input
                                              type="number"
                                              className="frontpage-cart-quantity-input"
                                              value={focusedInputKey === `${item.id}-combo-${comboName}` ? (tempQuantity !== null ? tempQuantity : "") : (qty || 1)}
                                              onFocus={() => {
                                                setFocusedInputKey(`${item.id}-combo-${comboName}`);
                                                setTempQuantity("");
                                              }}
                                              onBlur={() => {
                                                setFocusedInputKey(null);
                                                setTempQuantity(null);
                                              }}
                                              onChange={(e) => {
                                                setTempQuantity(e.target.value);
                                                handleQuantityChange(item.id, e.target.value, "combo", comboName);
                                              }}
                                              min="1"
                                            />
                                          </td>
                                          <td>{getPriceDisplay(item, false, null, comboName)}</td>
                                          {showKitchenColumn && (
                                            <td>{item.comboVariants ? item.comboVariants[comboName]?.kitchen || "Main Kitchen" : "Main Kitchen"}</td>
                                          )}
                                          <td>
                                            <button
                                              className="frontpage-remove-btn"
                                              onClick={() => removeAddonOrCombo(item.id, "combo", comboName)}
                                            >
                                              <X size={18} />
                                            </button>
                                          </td>
                                        </tr>
                                        {item.comboVariants?.[comboName]?.cold === 'with_ice' && (
                                          <tr>
                                            <td></td>
                                            <td>
                                              <div className="frontpage-cart-item-option">{comboName} (Ice)</div>
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                className="frontpage-cart-quantity-input"
                                                value={focusedInputKey === `${item.id}-combo-ice-${comboName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.comboIceQuantities?.[comboName] || 1)}
                                                onFocus={() => {
                                                  setFocusedInputKey(`${item.id}-combo-ice-${comboName}`);
                                                  setTempQuantity("");
                                                }}
                                                onBlur={() => {
                                                  setFocusedInputKey(null);
                                                  setTempQuantity(null);
                                                }}
                                                onChange={(e) => {
                                                  setTempQuantity(e.target.value);
                                                  handleQuantityChange(item.id, e.target.value, "comboIce", comboName);
                                                }}
                                                min="1"
                                              />
                                            </td>
                                            <td>{getPriceDisplay(item, false, null, comboName, true)}</td>
                                            {showKitchenColumn && <td></td>}
                                            <td>
                                              <button
                                                className="frontpage-remove-btn"
                                                onClick={() => {
                                                  const updatedVariants = {
                                                    ...item.comboVariants,
                                                    [comboName]: { ...item.comboVariants[comboName], cold: 'without_ice' },
                                                  }
                                                  handleItemUpdate({
                                                    ...item,
                                                    comboVariants: updatedVariants,
                                                    comboIcePrices: { ...item.comboIcePrices, [comboName]: 0 },
                                                  })
                                                }}
                                              >
                                                <X size={18} />
                                              </button>
                                            </td>
                                          </tr>
                                        )}
                                        {item.comboVariants?.[comboName]?.spicy && (
                                          <tr>
                                            <td></td>
                                            <td>
                                              <div className="frontpage-cart-item-option">{comboName} (Spicy)</div>
                                            </td>
                                            <td>
                                              <input
                                                type="number"
                                                className="frontpage-cart-quantity-input"
                                                value={focusedInputKey === `${item.id}-combo-spicy-${comboName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.comboSpicyQuantities?.[comboName] || 1)}
                                                onFocus={() => {
                                                  setFocusedInputKey(`${item.id}-combo-spicy-${comboName}`);
                                                  setTempQuantity("");
                                                }}
                                                onBlur={() => {
                                                  setFocusedInputKey(null);
                                                  setTempQuantity(null);
                                                }}
                                                onChange={(e) => {
                                                  setTempQuantity(e.target.value);
                                                  handleQuantityChange(item.id, e.target.value, "comboSpicy", comboName);
                                                }}
                                                min="1"
                                              />
                                            </td>
                                            <td>{getPriceDisplay(item, false, null, comboName, false, true)}</td>
                                            {showKitchenColumn && <td></td>}
                                            <td>
                                              <button
                                                className="frontpage-remove-btn"
                                                onClick={() => {
                                                  const updatedVariants = {
                                                    ...item.comboVariants,
                                                    [comboName]: { ...item.comboVariants[comboName], spicy: false },
                                                  }
                                                  handleItemUpdate({
                                                    ...item,
                                                    comboVariants: updatedVariants,
                                                    comboSpicyPrices: { ...item.comboSpicyPrices, [comboName]: 0 },
                                                  })
                                                }}
                                              >
                                                <X size={18} />
                                              </button>
                                            </td>
                                          </tr>
                                        )}
                                        {item.comboVariants?.[comboName]?.sugar &&
                                          item.comboVariants[comboName].sugar !== "medium" && (
                                            <tr>
                                              <td></td>
                                              <td>
                                                <div className="frontpage-cart-item-option">
                                                  {comboName} (Sugar:{" "}
                                                  {item.comboVariants[comboName].sugar.charAt(0).toUpperCase() +
                                                    item.comboVariants[comboName].sugar.slice(1)}
                                                  )
                                                </div>
                                              </td>
                                              <td>
                                                <input
                                                  type="number"
                                                  className="frontpage-cart-quantity-input"
                                                  value={focusedInputKey === `${item.id}-combo-${comboName}` ? (tempQuantity !== null ? tempQuantity : "") : (qty || 1)}
                                                  onFocus={() => {
                                                    setFocusedInputKey(`${item.id}-combo-${comboName}`);
                                                    setTempQuantity("");
                                                  }}
                                                  onBlur={() => {
                                                    setFocusedInputKey(null);
                                                    setTempQuantity(null);
                                                  }}
                                                  onChange={(e) => {
                                                    setTempQuantity(e.target.value);
                                                    handleQuantityChange(item.id, e.target.value, "combo", comboName);
                                                  }}
                                                  min="1"
                                                />
                                              </td>
                                              <td>{formatPrice(0)}</td> {/* UPDATED: Use formatPrice */}
                                              {showKitchenColumn && <td></td>}
                                              <td>
                                                <button
                                                  className="frontpage-remove-btn"
                                                  onClick={() => {
                                                    const updatedVariants = {
                                                      ...item.comboVariants,
                                                      [comboName]: { ...item.comboVariants[comboName], sugar: "medium" },
                                                    }
                                                    handleItemUpdate({
                                                      ...item,
                                                      comboVariants: updatedVariants,
                                                    })
                                                  }}
                                                >
                                                  <X size={18} />
                                                </button>
                                              </td>
                                            </tr>
                                          )}
                                        {item.comboCustomVariantsDetails?.[comboName] &&
                                          Object.entries(item.comboCustomVariantsDetails[comboName]).map(
                                            ([variantName, variant]) => (
                                              <tr key={`${item.id}-combo-${comboName}-custom-${variantName}`}>
                                                <td></td>
                                                <td>
                                                  <div className="frontpage-cart-item-option">
                                                    {comboName} - {variant.heading}: {variant.name}
                                                  </div>
                                                </td>
                                                <td>
                                                  <input
                                                    type="number"
                                                    className="frontpage-cart-quantity-input"
                                                    value={focusedInputKey === `${item.id}-combo-${comboName}-custom-${variantName}` ? (tempQuantity !== null ? tempQuantity : "") : (item.comboCustomVariantsQuantities?.[comboName]?.[variantName] || 1)}
                                                    onFocus={() => {
                                                      setFocusedInputKey(`${item.id}-combo-${comboName}-custom-${variantName}`);
                                                      setTempQuantity("");
                                                    }}
                                                    onBlur={() => {
                                                      setFocusedInputKey(null);
                                                      setTempQuantity(null);
                                                    }}
                                                    onChange={(e) => {
                                                      setTempQuantity(e.target.value);
                                                      handleQuantityChange(item.id, e.target.value, "comboCustomVariant", `${comboName}|${variantName}`);
                                                    }}
                                                    min="1"
                                                  />
                                                </td>
                                                <td>{formatPrice((variant.price || 0) * (item.comboCustomVariantsQuantities?.[comboName]?.[variantName] || 1))}</td>
                                                {showKitchenColumn && <td></td>}
                                                <td>
                                                  <button
                                                    className="frontpage-remove-btn"
                                                    onClick={() => {
                                                      const updatedDetails = { ...item.comboCustomVariantsDetails }
                                                      delete updatedDetails[comboName][variantName]
                                                      if (Object.keys(updatedDetails[comboName]).length === 0) {
                                                        delete updatedDetails[comboName]
                                                      }
                                                      handleItemUpdate({ ...item, comboCustomVariantsDetails: updatedDetails })
                                                    }}
                                                  >
                                                    <X size={18} />
                                                  </button>
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                      </React.Fragment>
                                    ),
                                )}
                            </>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="frontpage-billing-bottom-wrapper">
              <div className="frontpage-billing-summary">
                <div className="frontpage-summary-row">
                  <span>TOTAL QUANTITY:</span>
                  <span>{cartItems.reduce((total, item) => total + (item?.quantity || 0), 0)}</span>
                </div>
                {cartItems.filter(item => item && item.originalBasePrice).map(item => (
                  <div className="frontpage-summary-row" key={item.id}>
                    <span>{item.name}:</span>
                    <span>
                      <span className="strikethroughStyle">{formatPrice(item.originalBasePrice * item.quantity)}</span> {getPriceDisplay(item, true)}
                    </span>
                  </div>
                ))}
                <div className="frontpage-summary-row">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span> {/* UPDATED: Use formatPrice */}
                </div>
                {Object.entries(vatByRate).map(([rate, amt]) => (
                  <div key={rate} className="frontpage-summary-row vat">
                    <span>VAT {rate}%:</span>
                    <span>{formatPrice(amt)}</span>
                  </div>
                ))}
                <div className="frontpage-summary-row vat">
                  <span>Total VAT:</span>
                  <span>{formatPrice(totalVat)}</span> {/* Show 0 if no VAT */}
                </div>
                <div className="frontpage-summary-row total">
                  <span>Grand Total:</span>
                  <span>{formatPrice(total)}</span> {/* UPDATED: Use formatPrice */}
                </div>
              </div>
              <div className="frontpage-action-buttons">
                {isButtonEnabled('Save') && (
                  <button className="frontpage-action-btn frontpage-btn-save" onClick={saveOrder}>
                    SAVE {isKeyboardShortcutsEnabled && <span className="shortcut-badge-btn">F4</span>}
                  </button>
                )}
                {isButtonEnabled('Cancel') && (
                  <button className="frontpage-action-btn frontpage-btn-cancel" onClick={cancelCart}>
                    CANCEL {isKeyboardShortcutsEnabled && <span className="shortcut-badge-btn">F2</span>}
                  </button>
                )}
                <button className="frontpage-action-btn frontpage-btn-pay" onClick={handlePayButtonClick}>
                  PAY {isKeyboardShortcutsEnabled && <span className="shortcut-badge-btn">F3</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        showUnservedPopup && (
          <div className="frontpage-modal-overlay">
            <div className="unserved-warning-modal">
              <div className="unserved-warning-header">
                <CircleAlert size={48} className="unserved-warning-icon" />
                <h3>Unserved Items Detected</h3>
                <p>The following items or their components have not been served. How would you like to proceed?</p>
              </div>
              <div className="unserved-items-list-container">
                <table className="unserved-items-table">
                  <thead>
                    <tr>
                      <th>Item Details</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unservedItems.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr className="unserved-main-row">
                          <td className={item._unservedDetails?.main ? "text-unserved" : ""}>
                            {item.item_name || item.name}
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.totalPrice)}</td>
                        </tr>
                        {item._unservedDetails && (
                          <>
                            {item._unservedDetails.addons.map(addon => (
                              <tr key={`addon-${addon.name}`} className="unserved-sub-row">
                                <td colSpan="2" className="text-unserved-sub">+ {addon.name} (Addon Not Served)</td>
                                <td>{formatPrice(addon.price)}</td>
                              </tr>
                            ))}
                            {item._unservedDetails.combos.map(combo => (
                              <tr key={`combo-${combo.name}`} className="unserved-sub-row">
                                <td colSpan="2" className="text-unserved-sub">+ {combo.name} (Combo Not Served)</td>
                                <td>{formatPrice(combo.price)}</td>
                              </tr>
                            ))}
                            {item._unservedDetails.comboOfferItems.map(ci => (
                              <tr key={`ci-${ci}`} className="unserved-sub-row">
                                <td colSpan="3" className="text-unserved-sub">+ {ci} (Not Served)</td>
                              </tr>
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="unserved-warning-footer">
                <button className="unserved-btn-cancel" onClick={handleUnservedCancel}>
                  Cancel (Remove & Pay)
                </button>
                <button className="unserved-btn-proceed" onClick={handleUnservedProceed}>
                  Proceed (Pay All)
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Auto-hiding Toast for non-confirmations */}
      {warningMessage && !isConfirmation && (
        <div className={`frontpage-toast frontpage-toast-${warningType}`}>
          <span>{warningMessage}</span>
        </div>
      )}
      {/* Modal for confirmations */}
      {warningMessage && isConfirmation && (
        <div className="frontpage-modal-overlay">
          <div className={`frontpage-alert frontpage-alert-${warningType}`}>
            <span>{warningMessage}</span>
            <div className="frontpage-alert-actions">
              {paymentSettings[orderType.replace(/\s+/g, "").toLowerCase()]?.pay !== false && (
                <button className="frontpage-alert-button" onClick={handleConfirmYes}>
                  Pay
                </button>
              )}
              {paymentSettings[orderType.replace(/\s+/g, "").toLowerCase()]?.payLater !== false && (
                <button className="frontpage-alert-button" onClick={handleConfirmNo}>
                  Pay Later
                </button>
              )}
              <button className="frontpage-alert-button ok-btn" onClick={handleWarningOk}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {
        showPaymentModal && (
          <div className="frontpage-modal-overlay">
            <div className="frontpage-modal-content">
              <div className="frontpage-modal-header">
                <h3 className="frontpage-modal-title">Select Payment Method</h3>
                <button className="frontpage-modal-close" onClick={() => setShowPaymentModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="frontpage-modal-body">
                <div className="frontpage-payment-options">
                  {isWorkflowFeatureEnabled('pay', 'Cash') && (
                    <button className="frontpage-payment-btn frontpage-cash" onClick={() => handlePaymentSelection("CASH")}>
                      CASH <small style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.8 }}>[1]</small>
                    </button>
                  )}
                  {isWorkflowFeatureEnabled('pay', 'Card') && (
                    <button className="frontpage-payment-btn frontpage-card" onClick={() => handlePaymentSelection("CARD")}>
                      CARD <small style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.8 }}>[2]</small>
                    </button>
                  )}
                  {isWorkflowFeatureEnabled('pay', 'UPI') && (
                    <button className="frontpage-payment-btn frontpage-upi" onClick={() => handlePaymentSelection("UPI")}>
                      UPI <small style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.8 }}>[3]</small>
                    </button>
                  )}
                </div>
              </div>
              <div className="frontpage-modal-footer">
                <button className="frontpage-modal-btn frontpage-cancel" onClick={() => setShowPaymentModal(false)}>
                  Cancel <small style={{ fontSize: '10px', marginLeft: '5px', opacity: 0.8 }}>[ESC]</small>
                </button>
              </div>
            </div>
          </div>
        )
      }
      {
        showGroupModal && (
          <div className="frontpage-modal-overlay">
            <div className="frontpage-modal-content">
              <div className="frontpage-modal-header">
                <h3 className="frontpage-modal-title">Add New Customer Group</h3>
                <button className="frontpage-modal-close" onClick={() => setShowGroupModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="frontpage-modal-body">
                <input
                  type="text"
                  className="frontpage-customer-input"
                  placeholder="Enter Group Name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="frontpage-modal-footer">
                <button className="frontpage-modal-btn frontpage-save" onClick={handleCreateGroup}>
                  Save
                </button>
                <button className="frontpage-modal-btn frontpage-cancel" onClick={() => setShowGroupModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
      {
        selectedItem && (!(posDesign === 'design2' && showPOSGrid) || !selectedCartItem) && (
          <FoodDetails
            item={selectedItem}
            cartItem={selectedCartItem}
            onClose={() => {
              setSelectedItem(null)
              setSelectedCartItem(null)
            }}
            onUpdate={handleItemUpdate}
          />
        )
      }
      {/* ── STYLES (Add these to your CSS file or inline if needed) ── */}
      <style jsx>{`
        /* Searchable Select Styles */
        .searchable-select {
          position: relative;
          width: 100%;
        }
        .searchable-select input {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .searchable-select input:focus {
          outline: none;
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0,123,255,.2);
        }
        .searchable-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1.5px solid #007bff;
          border-top: none;
          border-radius: 0 0 6px 6px;
          max-height: 200px;
          overflow-y: auto;
          list-style: none;
          margin: 0;
          padding: 0;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .searchable-list li {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid #f0f0f0;
        }
        .searchable-list li:hover {
          background: #f8f9fa;
        }
        .searchable-list .no-options {
          color: #6c757d;
          font-style: italic;
          cursor: default;
          padding: 12px;
          text-align: center;
        }
        /* Customer Input Group */
        .frontpage-input-group {
          position: relative;
          margin-bottom: 16px;
        }
        .frontpage-input-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: bold;
          color: #333;
        }
        .frontpage-customer-input {
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .frontpage-customer-input:focus {
          outline: none;
          border-color: #0056b3;
          box-shadow: 0 0 0 3px rgba(0,123,255,.2);
        }
        /* NEW: Copy Suggestion Styles (from CreateCustomerPage) */
        .copy-suggestion {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          border-radius: 4px;
          font-size: 13px;
          color: #0066cc;
          margin-top: 4px;
        }
        .copy-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .copy-btn:hover {
          background: #0056b3;
        }
        /* Phone Input Group Styles (for WhatsApp too) */
        .frontpage-phone-input-group {
          display: flex;
          height: 42px;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .frontpage-phone-prefix { position: relative; }
        .frontpage-isd-button {
          background: #fff;
          border: none;
          border-right: 1.5px solid #007bff;
          padding: 0 10px;
          font-size: 13px;
          height: 100%;
          width: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .frontpage-isd-button:hover { background: #f1f3f5; }
        .frontpage-isd-code-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1050;
          background: #fff;
          border: 1.5px solid #007bff;
          border-radius: 6px;
          list-style: none;
          margin: 2px 0 0;
          padding: 6px 0;
          min-width: 140px;
          max-height: 220px;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,.15);
        }
        .frontpage-isd-code-dropdown li {
          padding: 8px 14px;
          cursor: pointer;
          font-size: 13px;
        }
        .frontpage-isd-code-dropdown li:hover { background: #f8f9fa; }
        .frontpage-phone-input {
          flex: 1;
          padding: 0 12px;
          font-size: 13px;
          border: none;
        }
        .frontpage-phone-input:focus { outline: none; }
        .strikethroughStyle {
          text-decoration: line-through;
          color: #888;
        }
        .shortcut-key {
          font-size: 0.75em !important;
          padding: 2px 5px !important;
          background-color: #f1f3f5 !important;
          border-radius: 4px !important;
          border: 1px solid #dee2e6 !important;
          color: #495057 !important;
          font-weight: 600 !important;
          display: inline-block !important;
          line-height: 1 !important;
        }
        .shortcut-badge-nav {
          position: absolute;
          top: 2px;
          right: 2px;
          font-size: 0.7em !important;
          padding: 2px 4px !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          color: white !important;
          border-radius: 4px !important;
          font-weight: bold !important;
          z-index: 10;
          pointer-events: none;
          line-height: 1 !important;
        }
        .shortcut-badge-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.7em !important;
          padding: 2px 5px !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          color: white !important;
          border-radius: 4px !important;
          font-weight: bold !important;
          z-index: 10;
          pointer-events: none;
          line-height: 1 !important;
        }
        .frontpage-action-btn {
          position: relative;
        }
        .shortcut-badge-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.75em !important;
          padding: 2px 5px !important;
          background-color: rgba(255, 255, 255, 0.3) !important;
          color: inherit;
          border-radius: 3px !important;
          font-weight: bold !important;
        }
      `}</style>
      {/* Add New Address Value Modal */}
      {showAddModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-content" style={{ maxWidth: '400px' }}>
            <div className="pos-modal-header">
              <h5 className="pos-modal-title">Add New {modalField === "country" ? "Country" :
                getAddressLabels(modalCountry || (modalField === 'country' ? modalValue : deliveryAddress.country), addressStructure)[
                modalField === "field1" ? 0 : modalField === "field2" ? 1 : modalField === "field3" ? 2 : 0
                ] || "Value"}</h5>
              <button aria-label="Close" className="pos-modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="pos-modal-body">
              {modalField === 'field2' && <p style={{ marginBottom: '10px' }}><strong>Parent:</strong> {modalParentValue}</p>}
              {modalField === 'field3' && <p style={{ marginBottom: '10px' }}><strong>Parent:</strong> {modalParentValue}</p>}

              <div className="frontpage-input-group">
                <label>Name</label>
                <input
                  type="text"
                  className="frontpage-customer-input"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  placeholder="Enter new value"
                  autoFocus
                />
              </div>
            </div>
            <div className="pos-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveModal}>Save</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        /* Reuse existing modal styles if possible, else define: */
        .pos-modal-overlay {
          position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        }
        .pos-modal-content {
          background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        overflow: hidden;
        }
        .pos-modal-header {
          padding: 15px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        }
        .pos-modal-title {margin: 0; font-size: 1.25rem; }
        .pos-modal-close {
          background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        }
        .pos-modal-body {padding: 20px; }
        .pos-modal-footer {
          padding: 15px 20px;
        background: #f8f9fa;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        }
      `}</style>

      {/* Order Type Required Popup */}
      {showOrderTypeRequiredModal && (
        <div className="order-type-modal-overlay">
          <div className="order-type-modal">
            <div className="modal-icon">
              <CircleAlert size={60} color="#ffc107" />
            </div>
            <h2 className="modal-title">Selection Required</h2>
            <p className="modal-text">select which ordertakeaway, dinein, onlinedelivery</p>

            <div className="modal-footer-btns">
              <button className="home-btn" onClick={() => {
                setShowOrderTypeRequiredModal(false);
                navigate("/home");
              }}>
                <Home size={20} /> Got Home
              </button>
              <button className="close-btn" onClick={() => setShowOrderTypeRequiredModal(false)}>
                <X size={20} /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardModal && (
        <div className="keyboard-modal-overlay">
          <div className="keyboard-modal-content">
            <div className="keyboard-modal-header">
              <h2>Keyboard Shortcuts</h2>
              <button className="keyboard-close-btn" onClick={() => setShowKeyboardModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="keyboard-modal-body">
              <div className="keyboard-toggle-container">
                <span className="keyboard-toggle-label">Enable Keyboard Shortcuts</span>
                <label className="keyboard-switch">
                  <input
                    type="checkbox"
                    checked={isKeyboardShortcutsEnabled}
                    onChange={(e) => setIsKeyboardShortcutsEnabled(e.target.checked)}
                  />
                  <span className="keyboard-slider round"></span>
                </label>
              </div>

              <div className="shortcuts-list-container">
                <table className="shortcuts-table">
                  <thead>
                    <tr>
                      <th>Shortcut Key</th>
                      <th>Action / Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><span className="shortcut-key">F1</span></td><td>Focus Item Search</td></tr>
                    <tr><td><span className="shortcut-key">F2</span></td><td>Cancel Order / Clear Cart</td></tr>
                    <tr><td><span className="shortcut-key">F3</span></td><td>Pay (Open Payment Modal)</td></tr>
                    <tr><td><span className="shortcut-key">F4</span></td><td>Save Order</td></tr>
                    <tr><td><span className="shortcut-key">F5</span></td><td>Navigate to Delivery Type (Home)</td></tr>
                    <tr><td><span className="shortcut-key">F6</span></td><td>Active Orders</td></tr>
                    <tr><td><span className="shortcut-key">F7</span></td><td>Kitchen View</td></tr>
                    <tr><td><span className="shortcut-key">F8</span> or <span className="shortcut-key">F</span></td><td>Open Customer Details & Focus Phone Input</td></tr>
                    <tr><td><span className="shortcut-key">F9</span></td><td>Sales Invoice</td></tr>

                    <tr><td><span className="shortcut-key">F11</span></td><td>Cycle POS Grid Views (Normal & Designs 1-3)</td></tr>
                    <tr><td><span className="shortcut-key">F12</span></td><td>Logout</td></tr>
                    <tr><td><span className="shortcut-key">Backspace</span></td><td>Go Back to Previous Page</td></tr>
                    <tr><td><span className="shortcut-key">Enter</span></td><td>Add Focused Menu Item to Cart</td></tr>
                    <tr><td><span className="shortcut-key">Arrow Left / Right</span></td><td>Scroll Categories / Navigate Menu Grid</td></tr>
                    <tr><td><span className="shortcut-key">Arrow Up / Down</span></td><td>Navigate Menu Grid / Navigate Cart Items</td></tr>
                    <tr><td><span className="shortcut-key">+ / -</span></td><td>Increase/Decrease Cart Item Qty</td></tr>

                    <tr><td><span className="shortcut-key">Escape</span></td><td>Close Popups / Modal</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="custom-modal-overlay">
          <div className="custom-logout-modal">
            <div className="modal-icon">
              <CircleAlert size={60} />
            </div>
            <h2 className="modal-title">Logout Confirmation</h2>
            <p className="modal-text">Are you sure you want to logout from the system?</p>
            <div className="modal-buttons">
              <button className="modal-btn confirm-btn" onClick={confirmLogout}>
                <Check size={20} /> YES
              </button>
              <button className="modal-btn cancel-btn" onClick={cancelLogout}>
                <X size={20} /> NO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default FrontPage;


