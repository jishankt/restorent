import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form } from 'react-bootstrap';
import { checkIsAdmin, checkIsGlobalAdmin } from '../../utils/authUtils';

import './Purchase.css';
import CustomerCustomizationModal from './CustomerCustomizationModal';
import TaxMaster from './TaxMaster';
// --- START: SVG Icon Components (Replaced react-icons) ---
const FaArrowLeft = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8 .4 34.3z"></path></svg>;
const FaShoppingCart = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H159.208l-9.166-44.81C147.758 8.021 137.93 0 126.541 0H24C10.745 0 0 10.745 0 24v16c0 13.255 10.745 24 24 24h69.883l70.248 343.435C147.325 417.1 136 435.222 136 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-15.674-6.447-29.835-16.824-40h209.647C430.447 426.165 424 440.326 424 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-22.172-12.888-41.332-31.579-50.405l5.517-24.276c3.413-15.018-8.002-29.319-23.403-29.319H218.117l-6.545-32h293.145c11.206 0 20.92-7.754 23.403-18.681z"></path></svg>;
const FaTruck = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z"></path></svg>;
const FaFileInvoice = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM336 480H48V48h192v80c0 13.3 10.7 24 24 24h80v280zM112 248c-13.3 0-24 10.7-24 24v104c0 13.3 10.7 24 24 24h160c13.3 0 24-10.7 24-24V272c0-13.3-10.7-24-24-24H112zm152 112H120v-80h144v80z"></path></svg>;
const FaChartBar = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M500 384c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v308h436zM309.5 204.4l94.1-94.1c4.7-4.7 12.3-4.7 17 0l19.8 19.8c4.7 4.7 4.7 12.3 0 17L346.3 241.1c-4.7 4.7-12.3 4.7-17 0l-45.2-45.2-112 112c-4.7 4.7-12.3 4.7-17 0l-47.9-47.9c-4.7-4.7-4.7-12.3 0-17l19.8-19.8c4.7-4.7 12.3-4.7 17 0l71.1 71.1 94.1-94.1c4.7-4.7 12.3-4.7 17 0l19.8 19.8c4.7 4.7 4.7 12.3 0 17L218.3 253.1c-4.7 4.7-12.3 4.7-17 0l-45.2-45.2-44.4 44.4c-4.7 4.7-12.3 4.7-17 0l-19.8-19.8c-4.7-4.7-4.7-12.3 0-17l71.1-71.1 94.1 94.1z"></path></svg>;
const FaTrash = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path></svg>;
const FaUser = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>;
const FaPrint = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 192H64C28.7 192 0 220.7 0 256v96c0 35.3 28.7 64 64 64h32v56c0 13.3 10.7 24 24 24h272c13.3 0 24-10.7 24-24v-56h32c35.3 0 64-28.7 64-64v-96c0-35.3-28.7-64-64-64zM384 448H128v-48h256v48zm-48-224H176c-13.3 0-24 10.7-24 24s10.7 24 24 24h160c13.3 0 24-10.7 24-24s-10.7-24-24-24zM448 64h-48V16c0-8.8-7.2-16-16-16H128c-8.8 0-16 7.2-16 16v48H64c-35.3 0-64 28.7-64 64v32h512v-32c0-35.3-28.7-64-64-64z"></path></svg>;
const FaCogs = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M512.1 191l-8.2 14.3c-3 5.3-9.4 7.5-15.1 5.4-11.8-4.4-22.6-10.7-31.8-18.6-4.6-3.9-5.8-10.6-2.8-15.8l8.2-14.3c-6.9-11.4-15.3-21.8-24.9-31l-14.3 8.2c-5.3 3-12 1.8-15.8-2.8-7.9-9.2-14.2-20-18.6-31.8-2.1-5.8 .1-12.1 5.4-15.1l14.3-8.2c-9.2-9.6-19.6-18-31-24.9l-8.2 14.3c-3 5.3-9.4 7.5-15.1 5.4-11.8-4.4-22.6-10.7-31.8-18.6-4.6-3.9-5.8-10.6-2.8-15.8l8.2-14.3C385.7 34 374.3 32.2 362.5 32.2V48.8c0 6.1-4.9 11-11 11h-19c-6.1 0-11-4.9-11-11V32.2c-11.8 0-23.2 1.8-34 4.5l8.2 14.3c3 5.3 1.8 12-2.8 15.8-9.2 7.9-20 14.2-31.8 18.6-5.8 2.1-12.1-.1-15.1-5.4l-8.2-14.3c-11.4 6.9-21.8 15.3-31 24.9l14.3 8.2c5.3 3 7.5 9.4 5.4 15.1-4.4 11.8-10.7 22.6-18.6 31.8-3.9 4.6-10.6 5.8-15.8 2.8l-14.3-8.2c-6.9 11.4-15.3 21.8-24.9 31l8.2 14.3c3 5.3 1.8 12-2.8 15.8-9.2 7.9-20 14.2-31.8 18.6-5.8 2.1-12.1-.1-15.1-5.4l-8.2-14.3c-9.6 9.2-18 19.6-24.9 31l14.3 8.2c5.3 3 7.5 9.4 5.4 15.1-4.4 11.8-10.7 22.6-18.6 31.8-3.9 4.6-10.6 5.8-15.8 2.8l-14.3-8.2c-2.7 10.8-4.5 22.2-4.5 34V208c0 6.1 4.9 11 11 11h19c6.1 0 11-4.9 11-11v-16.6c11.8 0 23.2-1.8 34-4.5l-8.2-14.3c-3-5.3-1.8-12 2.8-15.8 9.2-7.9 20-14.2 31.8-18.6 5.8-2.1 12.1 .1 15.1 5.4l8.2 14.3c11.4-6.9 21.8-15.3 31-24.9l-14.3-8.2c-5.3-3-7.5-9.4-5.4-15.1 4.4-11.8 10.7-22.6 18.6-31.8 3.9-4.6 10.6-5.8 15.8-2.8l14.3 8.2c6.9-11.4 15.3-21.8 24.9-31l-8.2-14.3c-3-5.3-1.8-12 2.8-15.8 9.2-7.9 20-14.2 31.8-18.6 5.8-2.1 12.1 .1 15.1 5.4l8.2 14.3c9.6-9.2 18-19.6 24.9-31l-14.3-8.2c-5.3-3-7.5-9.4-5.4-15.1 4.4-11.8 10.7-22.6 18.6-31.8 3.9-4.6 10.6-5.8 15.8-2.8l14.3 8.2c2.7-10.8 4.5-22.2 4.5-34V64c0-6.1-4.9-11-11-11h-19c-6.1 0-11 4.9-11 11v16.6c-11.8 0-23.2 1.8-34 4.5l8.2 14.3c3 5.3 1.8 12-2.8 15.8-9.2 7.9-20 14.2-31.8 18.6-5.8 2.1-12.1-.1-15.1-5.4l-8.2-14.3c-11.4 6.9-21.8 15.3-31 24.9l14.3 8.2c5.3 3 7.5 9.4 5.4 15.1-4.4 11.8-10.7 22.6-18.6 31.8-3.9 4.6-10.6 5.8-15.8 2.8l-14.3-8.2c-6.9 11.4-15.3 21.8-24.9 31l8.2 14.3c3 5.3 1.8 12-2.8 15.8-9.2 7.9-20 14.2-31.8 18.6-5.8 2.1-12.1 .1-15.1-5.4l-8.2-14.3c-9.6 9.2-18 19.6-24.9 31l14.3 8.2c5.3 3 7.5 9.4 5.4 15.1-4.4 11.8-10.7 22.6-18.6 31.8-3.9 4.6-10.6 5.8-15.8 2.8l-14.3-8.2c-2.7 10.8-4.5 22.2-4.5 34V352c0 6.1 4.9 11 11 11h19c6.1 0 11-4.9 11-11v-16.6c11.8 0 23.2-1.8 34-4.5l-8.2-14.3c-3-5.3-1.8-12 2.8-15.8 9.2-7.9 20-14.2 31.8-18.6 5.8-2.1 12.1-.1 15.1 5.4l8.2 14.3c11.4-6.9 21.8-15.3 31-24.9l-14.3-8.2c-5.3-3-7.5-9.4-5.4-15.1 4.4-11.8 10.7-22.6 18.6-31.8 3.9-4.6 10.6-5.8 15.8-2.8l14.3 8.2c6.9-11.4 15.3-21.8 24.9-31l-8.2-14.3c-3-5.3-1.8-12 2.8-15.8 9.2-7.9 20-14.2 31.8-18.6 5.8-2.1 12.1-.1 15.1 5.4l-8.2-14.3c-9.6-9.2-18-19.6-24.9-31l-14.3-8.2c-5.3-3-7.5-9.4-5.4-15.1 4.4-11.8 10.7-22.6 18.6-31.8 3.9-4.6 10.6-5.8 15.8-2.8l14.3 8.2zM256 128c70.7 0 128 57.3 128 128s-57.3 128-128 128-128-57.3-128-128 57.3-128 128-128z"></path></svg>;
const FaSave = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"></path></svg>;
// --- SVG Icon Components ---
const isdCodes = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+61", country: "Australia" },
];
const digitLengths = {
  '+91': 10,
  '+1': 10,
  '+44': 10,
  '+971': 9,
  '+61': 9,
};
const countryList = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];
const FaPlus = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path></svg>;
const FaEdit = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.2 15.2-39.9 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path></svg>;
const FaCheck = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>;
const FaTimes = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 352 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path></svg>;
const FaFilter = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.662l80 55.98C298.02 518.69 320 507.493 320 487.98V225.941l184.947-184.97C521.021 25.896 510.312 0 488.03 0h-.054z"></path></svg>;
const FaFileExcel = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm64 236c0 6.6-5.4 12-12 12h-72v24c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-24h-72c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h72v-24c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v24h72c6.6 0 12 5.4 12 12v40zm93-243L279 25c-9-9-23.7-9-32.7 0l-7 7c-1.5 1.5-2.2 3.5-2 5.6.1 1.5 .9 3 2.2 4.3l105 105c1.5 1.5 3.5 2.2 5.6 2 1.5-.1 3-.9 4.3-2.2l7-7c9-9.1 9-23.8 0-32.8zM384 128H256V0l128 128z"></path></svg>;
// --- END: SVG Icon Components ---
const API_URL = '';

const SearchableSelect = ({ options = [], value = '', onChange, placeholder }) => {
  const [search, setSearch] = useState(value || '');
  const [showList, setShowList] = useState(false);



  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  const filteredOptions = options.filter(option =>
    (option || '').toLowerCase().includes((search || '').toLowerCase())
  );

  const handleInputChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    if (!showList) {
      setShowList(true);
    }
    if (newSearch === '' && onChange) {
      onChange('');
    }
  };

  const handleSelectOption = (option) => {
    setSearch(option);
    if (onChange) {
      onChange(option);
    }
    setShowList(false);
  };

  const handleFocus = () => {
    setShowList(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowList(false);
    }, 200);
  };

  return (
    <div className="searchable-select">
      <input
        type="text"
        value={search}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="purchase-input"
      />
      {showList && (
        <ul className="searchable-list">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectOption(option);
                }}
              >
                {option}
              </li>
            ))
          ) : (
            <li className="no-options">No matching options</li>
          )}
        </ul>
      )}
    </div>
  );
};
  function WarningMessage({ message, onConfirm, onCancel }) {
    const confirmRef = useRef(null);
    useEffect(() => {
      if (confirmRef.current) {
        confirmRef.current.focus();
      }
    }, []);

    return (
      <div className="purchase-warning-overlay">
        <div className="purchase-warning-message">
          <p>{message}</p>
          <div className="purchase-warning-buttons">
            <button ref={confirmRef} onClick={onConfirm} className="purchase-confirm-button">Confirm</button>
            <button onClick={onCancel} className="purchase-cancel-button">Cancel</button>
          </div>
        </div>
      </div>
    );
  }
function Purchase() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('landing');
  const handleKeyDownRef = useRef(null);
  
  useEffect(() => {
    const handler = (e) => {
      if (handleKeyDownRef.current) {
        handleKeyDownRef.current(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const [globalSearch, setGlobalSearch] = useState(''); // NEW: Global search state
  const [showSaveDropdown, setShowSaveDropdown] = useState(false); // Dropdown for Submit button
  const [showDropdown, setShowDropdown] = useState(false); // NEW: Dropdown visibility state
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showTaxMasterModal, setShowTaxMasterModal] = useState(false); // NEW: Customize Modal state
  const [items, setItems] = useState([]);
  const [doctypeSchemas, setDoctypeSchemas] = useState({});

  const isFieldVisible = (docTypeName, fieldId) => {
    const schema = doctypeSchemas[docTypeName];
    if (!schema || !schema.fields) return true;
    const field = schema.fields.find(f => f.id === fieldId || f.label === fieldId || f.label.toLowerCase().replace(/\s+/g, '_') === fieldId);
    return field ? !field.hidden : true;
  };

  const isFieldMandatory = (docTypeName, fieldId) => {
    const schema = doctypeSchemas[docTypeName];
    if (!schema || !schema.fields) return false;
    const field = schema.fields.find(f => f.id === fieldId || f.label === fieldId || f.label.toLowerCase().replace(/\s+/g, '_') === fieldId);
    return field ? !!field.mandatory : false;
  };

  const getFieldLabel = (docTypeName, fieldId, defaultLabel) => {
    const schema = doctypeSchemas[docTypeName];
    if (!schema || !schema.fields) return defaultLabel;
    const field = schema.fields.find(f => f.id === fieldId || f.label === fieldId || f.label.toLowerCase().replace(/\s+/g, '_') === fieldId);
    if (!field) return defaultLabel;
    // Return plain label only — the mandatory star is rendered separately as a styled <span>
    return field.label;
  };

  const renderDynamicHeaders = (docTypeName, fallbackHeaders, context = {}, showIndex = true, showActions = true) => {
    const schema = doctypeSchemas[docTypeName];
    if (!schema || !schema.fields) return fallbackHeaders;
    // Exclude Section Break and Column Break type fields — they are layout-only
    const visibleFields = schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break');
    return (
      <>
        {showIndex && <th>No</th>}
        {visibleFields.map(f => {
           let label = f.label;
           if (f.id === 'rate' || f.id === 'amount' || f.id === 'total') {
               label = `${label} (${context.currency || 'AED'})`;
           }
           return <th key={f.id}>{label} {f.mandatory ? '*' : ''}</th>;
        })}
        {showActions && <th>Actions</th>}
      </>
    );
  };
  const [suppliers, setSuppliers] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [supplierGroups, setSupplierGroups] = useState([]); // NEW: Supplier Groups
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [purchaseReceipts, setPurchaseReceipts] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [uomOptions, setUomOptions] = useState([]); // Now array of objects {_id, name}
  const [loading, setLoading] = useState(false);
  const [permsLoading, setPermsLoading] = useState(true);
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMsg, setPermModalMsg] = useState("");

  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let timer;
    if (message || error) {
      timer = setTimeout(() => {
        setMessage('');
        setError(null);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [message, error]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showWarning, setShowWarning] = useState(null);
  const [warningAction, setWarningAction] = useState(null);
  const [editingPoId, setEditingPoId] = useState(null);
  const [editingPrId, setEditingPrId] = useState(null);
  const [editingPiId, setEditingPiId] = useState(null);
  const [itemSearch, setItemSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [poDateFrom, setPoDateFrom] = useState('');
  const [poDateTo, setPoDateTo] = useState('');
  const [poSelectedSupplier, setPoSelectedSupplier] = useState('');
  const [poSelectedItem, setPoSelectedItem] = useState('');
  const [prDateFrom, setPrDateFrom] = useState('');
  const [prDateTo, setPrDateTo] = useState('');
  const [prSelectedSupplier, setPrSelectedSupplier] = useState('');
  const [prSelectedItem, setPrSelectedItem] = useState('');
  const [piDateFrom, setPiDateFrom] = useState('');
  const [piDateTo, setPiDateTo] = useState('');
  const [piSelectedSupplier, setPiSelectedSupplier] = useState('');
  const [piSelectedItem, setPiSelectedItem] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [reportSearchTerm, setReportSearchTerm] = useState(''); // NEW: Reports internal search
  const [activeSection, setActiveSection] = useState('details');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showSupplierGroupModal, setShowSupplierGroupModal] = useState(false); // NEW: Supplier Group Modal
  const [showSupplierGroupListModal, setShowSupplierGroupListModal] = useState(false); // NEW: Supplier Group List Modal
  const [editingSupplierGroup, setEditingSupplierGroup] = useState(null); // NEW: Editing Supplier Group
  const [newSupplierGroupName, setNewSupplierGroupName] = useState(''); // NEW: New Group Name
  const [newSupplierGroupTargetCompanies, setNewSupplierGroupTargetCompanies] = useState([]);
  const [newSupplierGroupTargetBranches, setNewSupplierGroupTargetBranches] = useState([]);
  const [newSupplierGroupAvailableBranches, setNewSupplierGroupAvailableBranches] = useState([]);
  const [itemFormRows, setItemFormRows] = useState([
    { 
      company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', 
      outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], branch_name: [], target_companies: [], 
      isTargetCompanyDropdownOpen: false, isCompanyDropdownOpen: false, isBranchDropdownOpen: false,
      branchSearchTerm: '', companySearchTerm: '' // NEW: Search states for row dropdowns
    }
  ]);
  const [uniqueCompanyNames, setUniqueCompanyNames] = useState([]);
  const [supplierForm, setSupplierForm] = useState({
    company: '',
    code: '',

    group: '', // This will now be populated from supplierGroups
    branch_name: [],
    target_companies: [],
    isBranchDropdownOpen: false,
    isTargetCompanyDropdownOpen: false,
    branchSearchTerm: '', // NEW: Search term for branches
    companySearchTerm: '', // NEW: Search term for companies
    country: '',
    currency: '',
    taxId: '',
    taxCategory: '',
    taxWithholdingCategory: '',
    contacts: [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }],
    paymentMode: '',
    paymentTerms: '',
    creditLimit: 0,
    paymentTermsOverride: '',
    bankDetails: '',
    website: '',
    onTimeDelivery: 0,
    defectRate: 0,
    lastPurchaseDate: '',
    lastPurchaseValue: 0
  });
  const [poForm, setPoForm] = useState({
    series: '',
    date: new Date().toISOString().slice(0, 10),
    company: [], // CHANGED TO ARRAY
    supplierId: '',
    supplierCode: '',
    supplierGroup: '',
    address: '',
    phone: '',
    email: '',
    currency: 'AED',
    branch_name: [],
    targetWarehouse: '',
    items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }],
    taxes: [{ tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }],
    subtotal: 0,
    totalQuantity: 0,
    totalTaxes: 0,
    grandTotal: 0,
    totalQtyInCommon: 0,
    commonUOM: '',
    isBranchDropdownOpen: false,
    isCompanyDropdownOpen: false // ADDED
  });
  const [currentPoSupplier, setCurrentPoSupplier] = useState(null);
  const [prForm, setPrForm] = useState({
    series: '',
    date: new Date().toISOString().slice(0, 10),
    company: [], // CHANGED TO ARRAY
    poId: '',
    supplierId: '',
    supplierCode: '',
    supplierGroup: '',
    address: '',
    phone: '',
    email: '',
    currency: '',
    branch_name: [],
    items: [{ itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }],
    taxes: [{ tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }],
    subtotal: 0,
    totalTaxes: 0,
    grandTotal: 0,
    totalQtyInCommon: 0,
    commonUOM: '',
    isBranchDropdownOpen: false,
    isCompanyDropdownOpen: false // ADDED
  });
  const [currentPrSupplier, setCurrentPrSupplier] = useState(null);
  const [piForm, setPiForm] = useState({
    isDirectPurchase: false,
    series: '',
    date: new Date().toISOString().slice(0, 10),
    company: [], // CHANGED TO ARRAY
    supplierId: '',
    supplierCode: '',
    supplierGroup: '',
    address: '',
    phone: '',
    email: '',
    poId: '',
    prId: '',
    currency: '',
    branch_name: [],
    items: [{ itemId: '', acceptedQuantity: 0, quantity: 0, rate: '', amount: 0, unit: '' }],
    taxes: [{ tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }],
    totalQuantity: 0,
    subtotal: 0,
    taxesAdded: 0,
    grandTotal: 0,
    totalQtyInCommon: 0,
    commonUOM: '',
    isBranchDropdownOpen: false,
    isCompanyDropdownOpen: false // ADDED
  });
  const [currentPiSupplier, setCurrentPiSupplier] = useState(null);
  const [showPoFilters, setShowPoFilters] = useState(false);
  const [showPrFilters, setShowPrFilters] = useState(false);
  const [showPiFilters, setShowPiFilters] = useState(false);
  const [showPoDateFilter, setShowPoDateFilter] = useState(false);
  const [showPoSupplierFilter, setShowPoSupplierFilter] = useState(false);
  const [showPiSupplierFilter, setShowPiSupplierFilter] = useState(false);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [assignedCompanies, setAssignedCompanies] = useState([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState(() => {
    const active = localStorage.getItem('active_company');
    if (active) return active;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (checkIsGlobalAdmin(userObj)) return 'All';
      return userObj.company_name || userObj.company || 'All';
    }
    return 'All';
  });
  const [companyBranchesMap, setCompanyBranchesMap] = useState({});
  const [userBranch, setUserBranch] = useState(null);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState(() => {
    // Priority: 1. active_branch (Global), 2. selectedBranch (Legacy/Local)
    const active = localStorage.getItem('active_branch');
    if (active) return [active];

    const saved = localStorage.getItem('selectedBranch');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return saved ? [saved] : [];
    }
  });
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [workflowSettings, setWorkflowSettings] = useState({});
  const location = useLocation();

  const showBranchSelector = isGroupAdmin || isCompanyAdmin || !userBranch || userBranch === 'All Branches' || userBranch === 'All';

  // Sync activeTab with URL parameter ?tab=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tabOptions.some(t => t.key === tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const getHeaders = useCallback(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem('token');

    const headers = { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    // Robust Tenancy Headers
    // Priority: 1. Global Multi-select state, 2. User Profile fallback
    const companyHeader = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') 
      ? selectedCompanyFilter 
      : (user?.company_name || user?.company || '');
    
    if (companyHeader) headers['X-Company-Name'] = companyHeader;

    let branchVal = selectedBranchFilter;
    if (Array.isArray(branchVal)) branchVal = branchVal.join(',');
    const branchHeader = branchVal === 'All Branches' ? '' : (branchVal || localStorage.getItem('active_branch') || user?.branch_name || user?.branch || '');

    if (branchHeader) headers['X-Branch-Name'] = branchHeader;

    // DEBUG LOG: Vital for diagnosing data visibility issues
    console.log(`[Purchase] API Headers Refined:`, {
      company: headers['X-Company-Name'],
      branch: headers['X-Branch-Name']
    });

    return headers;
  }, [selectedBranchFilter, selectedCompanyFilter]);

  // Helper to get the correct company context for forms
  const getFormCompany = () => {
    if (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies') {
      return selectedCompanyFilter;
    }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.company_name || u.company || "";
    }
    return "";
  };
  const [showPoItemFilter, setShowPoItemFilter] = useState(false);
  const [showPrDateFilter, setShowPrDateFilter] = useState(false);
  const [showPrSupplierFilter, setShowPrSupplierFilter] = useState(false);
  const [showPrItemFilter, setShowPrItemFilter] = useState(false);
  const [showPiDateFilter, setShowPiDateFilter] = useState(false);
  const [showDirectPiFilters, setShowDirectPiFilters] = useState(false);
  const [showPiItemFilter, setShowPiItemFilter] = useState(false);
  const paymentModeOptions = ['Bank Transfer', 'Cheque', 'Cash', 'Credit Card'];
  const paymentTermsOptions = ['Net 30', 'Net 60', 'Advance', 'COD'];
    const currencyOptions = [
    { code: "INR", display: "INR (₹) - India" },
    { code: "USD", display: "USD ($) - USA" },
    { code: "EUR", display: "EUR (€) - Eurozone" },
    { code: "GBP", display: "GBP (£) - UK" },
    { code: "AED", display: "AED (د.إ) - UAE" },
    { code: "JPY", display: "JPY (¥) - Japan" },
    { code: "CNY", display: "CNY (¥) - China" },
    { code: "SGD", display: "SGD ($) - Singapore" },
    { code: "MYR", display: "MYR (RM) - Malaysia" },
    { code: "THB", display: "THB (฿) - Thailand" },
    { code: "IDR", display: "IDR (Rp) - Indonesia" },
    { code: "KRW", display: "KRW (₩) - South Korea" },
    { code: "PHP", display: "PHP (₱) - Philippines" },
    { code: "SAR", display: "SAR (﷼) - Saudi Arabia" },
    { code: "QAR", display: "QAR (﷼) - Qatar" },
    { code: "KWD", display: "KWD (د.ك) - Kuwait" },
    { code: "OMR", display: "OMR (﷼) - Oman" },
    { code: "BHD", display: "BHD (.د.ب) - Bahrain" },
    { code: "CAD", display: "CAD ($) - Canada" },
    { code: "AUD", display: "AUD ($) - Australia" },
    { code: "NZD", display: "NZD ($) - New Zealand" },
    { code: "CHF", display: "CHF (CHF) - Switzerland" },
    { code: "ZAR", display: "ZAR (R) - South Africa" },
    { code: "BRL", display: "BRL (R$) - Brazil" },
    { code: "PKR", display: "PKR (₨) - Pakistan" },
    { code: "LKR", display: "LKR (Rs) - Sri Lanka" },
    { code: "NGN", display: "NGN (₦) - Nigeria" }
  ];
  const [showNewUomModal, setShowNewUomModal] = useState(false);
  const [newUomName, setNewUomName] = useState('');
  const [newUomTargetCompanies, setNewUomTargetCompanies] = useState([]);
  const [newUomTargetBranches, setNewUomTargetBranches] = useState([]);
  const [newUomAvailableBranches, setNewUomAvailableBranches] = useState([]);
  const [pendingUom, setPendingUom] = useState(null); // {index, field: 'masterUnit' or 'outerUnit'}
  const [creatingItemForPo, setCreatingItemForPo] = useState(null); // {rowIndex}
  const [creatingItemForPr, setCreatingItemForPr] = useState(null); // {rowIndex}
  const [creatingItemForPi, setCreatingItemForPi] = useState(null); // {rowIndex}
  const [creatingSupplierForPo, setCreatingSupplierForPo] = useState(false);
  const [creatingSupplierForPi, setCreatingSupplierForPi] = useState(false);
  const [creatingSupplierForItem, setCreatingSupplierForItem] = useState(null); // {rowIndex}
  const [editingFrom, setEditingFrom] = useState(null); // 'order', 'receipt', 'invoice'
  const [activeReport, setActiveReport] = useState('po'); // For reports tab: 'po', 'pr', 'pi', 'supplier'
  const [reportPoSearch, setReportPoSearch] = useState('');
  const [reportPoDateFrom, setReportPoDateFrom] = useState('');
  const [reportPoDateTo, setReportPoDateTo] = useState('');
  const [reportPoSupplier, setReportPoSupplier] = useState('');
  const [reportPoStatus, setReportPoStatus] = useState('');
  const [reportPoItem, setReportPoItem] = useState('');
  const [reportPrSearch, setReportPrSearch] = useState('');
  const [reportPrDateFrom, setReportPrDateFrom] = useState('');
  const [reportPrDateTo, setReportPrDateTo] = useState('');
  const [reportPrSupplier, setReportPrSupplier] = useState('');
  const [reportPrStatus, setReportPrStatus] = useState('');
  const [reportPrItem, setReportPrItem] = useState('');
  const [reportPiSearch, setReportPiSearch] = useState('');
  const [reportPiDateFrom, setReportPiDateFrom] = useState('');
  const [reportPiDateTo, setReportPiDateTo] = useState('');
  const [reportPiSupplier, setReportPiSupplier] = useState('');
  const [reportPiStatus, setReportPiStatus] = useState('');
  const [reportPiItem, setReportPiItem] = useState('');
  const [reportSupplierSearch, setReportSupplierSearch] = useState('');
  const [reportSupplierGroup, setReportSupplierGroup] = useState('');
  const [reportSupplierCountry, setReportSupplierCountry] = useState('');
  const [showUomListModal, setShowUomListModal] = useState(false); // New state for UOM list modal

  const [editingUom, setEditingUom] = useState(null); // For editing UOM
  const [editingUomName, setEditingUomName] = useState(''); // Temp name for editing UOM
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newBrandTargetCompanies, setNewBrandTargetCompanies] = useState([]);
  const [newBrandTargetBranches, setNewBrandTargetBranches] = useState([]);
  const [newBrandAvailableBranches, setNewBrandAvailableBranches] = useState([]);
  const [pendingCompany, setPendingCompany] = useState(null);
  // Brand management states
  const [brands, setBrands] = useState([]);
  const [showBrandListModal, setShowBrandListModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingBrandName, setEditingBrandName] = useState('');
  // Item-wise report states
  const [reportItemWiseData, setReportItemWiseData] = useState([]);
  const [reportItemWiseDateFrom, setReportItemWiseDateFrom] = useState('');
  const [reportItemWiseDateTo, setReportItemWiseDateTo] = useState('');
  const [reportItemWiseItem, setReportItemWiseItem] = useState('');
  const [reportItemWiseSupplier, setReportItemWiseSupplier] = useState('');

  const isFeatureEnabled = useCallback((key) => {
    // If we haven't loaded settings yet, assume enabled to avoid flicker
    if (!workflowSettings || Object.keys(workflowSettings).length === 0) return true;

    const settings = workflowSettings?.global_modules?.purchase;
    
    // Explicitly define all keys that can be controlled from manages.jsx
    const pageMap = {
      'item': 'Items',
      'supplier': 'Suppliers',
      'supplier_group_list': 'SupplierGroupList', // Mapped to manages.jsx naming
      'order': 'PurchaseOrder',
      'receipt': 'PurchaseReceipt',
      'invoice': 'PurchaseInvoice',
      'report': 'Reports'
    };
    
    const pageKey = pageMap[key];
    
    // Logic:
    // 1. If 'purchase' module is missing from settings, it's enabled by default.
    // 2. If 'purchase.enabled' is explicitly false, everything is disabled.
    // 3. If a specific page is explicitly false, that page is disabled.
    // 4. Otherwise, it's enabled.
    
    const isModuleEnabled = !settings || settings.enabled !== false;
    const isPageEnabled = !pageKey || !settings?.pages || settings.pages[pageKey] !== false;

    const isEnabled = isModuleEnabled && isPageEnabled;

    if (key === 'receipt' || key === 'invoice') {
       console.log(`[Purchase Visibility Check] Key: ${key} -> PageKey: ${pageKey} -> Enabled: ${isEnabled}`, {
         moduleEnabled: isModuleEnabled,
         pageEnabled: isPageEnabled,
         rawPageValue: settings?.pages?.[pageKey],
         purchaseSettings: settings
       });
    }

    return isEnabled;
  }, [workflowSettings]);

  // NEW: Tab options for global search (without icons)
  const tabOptions = React.useMemo(() => [
    { key: 'item', name: 'Items' },
    { key: 'supplier', name: 'Suppliers' },
    { key: 'supplier_group_list', name: 'Supplier Group List' },
    { key: 'order', name: 'Purchase Order' },
    { key: 'receipt', name: 'Purchase Receipt' },
    { key: 'invoice', name: 'Purchase Invoice' },
    { key: 'report', name: 'Reports' },
  ].filter(tab => isFeatureEnabled(tab.key)), [isFeatureEnabled]);

  // NEW: Dynamic headings for tabs
  const tabHeadings = {
    item: 'Items',
    supplier: 'Suppliers',
    order: 'Purchase Order',
    receipt: 'Purchase Receipt',
    invoice: 'Purchase Invoice',
    report: 'Reports',
  };

  // NEW: Handle Back Button Logic
  const handleBack = () => {
    if (activeTab === 'landing') {
      navigate('/admin');
    } else {
      setActiveTab('landing');
    }
  };

  // Sync activeTab with URL parameter ?tab=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && tabOptions.some(t => t.key === tab)) {
      setActiveTab(tab);
    }
  }, [location.search, tabOptions]);

  // 1. Initial configuration (Permissions, Branches) - Runs only once/login
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setPermsLoading(true);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const roleRaw = userObj.role || userObj.UserType || '';
          const branch = userObj.branch_name || userObj.branch || "";

          const isAdminRole = checkIsAdmin(userObj);
          const isGroupAdminRole = checkIsGlobalAdmin(userObj);
          const is_Admin = isAdminRole && (!branch || branch === 'All Branches' || branch === "");

          setIsCompanyAdmin(is_Admin);
          setIsGroupAdmin(isGroupAdminRole);
          setUserBranch(branch);

          if (roleRaw) {
            const url = `${API_URL}/api/role-permissions?role=${encodeURIComponent(roleRaw)}`;
            const response = await fetch(url, { headers: getHeaders() });
            const data = await response.json();
            const perms = data.permissions || [];
            const pagePerm = perms.find(p => p.pageId === 'purchase');

            if (isAdminRole || isGroupAdminRole) {
              setCanRead(true);
              setCanWrite(true);
              setCanDelete(true);
            } else if (pagePerm) {
              setCanRead(pagePerm.canRead === true);
              setCanWrite(pagePerm.canWrite === true);
              setCanDelete(pagePerm.canWrite === true || pagePerm.canDelete === true);
            }

            if (isGroupAdminRole) {
              const comps = userObj.companies || (userObj.company ? [userObj.company] : []);
              setAssignedCompanies(comps);
              if (selectedCompanyFilter === 'All Companies' && comps.length > 0 && !isGroupAdminRole) {
                setSelectedCompanyFilter(comps[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching permissions:", err);
      } finally {
        setPermsLoading(false);
      }
    };

    const fetchBranches = async (targetCompany = null) => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const headers = {};
          // Robustly get company names for branch fetching
          const companyName = targetCompany || selectedCompanyFilter || user.company_name || user.company;
          if (companyName) headers['X-Company-Name'] = companyName;

          const response = await fetch(`${API_URL}/api/branches`, { headers });
          const data = await response.json();
          const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
          setAvailableBranches(branchData);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    const fetchWorkflowVisibility = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const userObj = userStr ? JSON.parse(userStr) : null;
        if (!userObj) return;

        // Reactive Selection: Priority to UI Filter, then localStorage/Session
        let activeComp = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies')
          ? selectedCompanyFilter
          : (localStorage.getItem('active_company') || userObj.company_name || userObj.company);
          
        if (activeComp === 'All' || activeComp === 'All Companies') {
          if (assignedCompanies && assignedCompanies.length > 0) {
            activeComp = assignedCompanies[0];
          } else {
            console.log("[Purchase] Skipping Workflow Visibility fetch because no specific company is selected.");
            return;
          }
        }
          
        const activeBranch = (selectedBranchFilter && selectedBranchFilter.length > 0)
          ? selectedBranchFilter[0]
          : localStorage.getItem('active_branch');

        const params = { company: activeComp };
        if (activeBranch && activeBranch !== 'All Branches') params.branch = activeBranch;

        const response = await fetch(`${API_URL}/api/workflow-visibility?company=${encodeURIComponent(params.company)}${params.branch ? `&branch=${encodeURIComponent(params.branch)}` : ''}`, { headers: getHeaders() });
        const data = await response.json();
        console.log("[Purchase] Fetched Workflow Visibility:", data);
        setWorkflowSettings(data.settings || {});
      } catch (err) {
        console.error("[Purchase] Failed to fetch workflow visibility:", err);
      }
    };

    fetchPermissions().then((initialComp) => {
      fetchBranches(initialComp);
      fetchWorkflowVisibility();
    });
  }, [selectedCompanyFilter, selectedBranchFilter]);

  useEffect(() => {
    const fetchUomBranches = async () => {
      if (!showNewUomModal) return;
      if (newUomTargetCompanies.length === 0) {
        setNewUomAvailableBranches([]);
        return;
      }
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Company-Name': newUomTargetCompanies.join(',')
          };
          const response = await fetch(`${API_URL}/api/branches`, { headers });
          const data = await response.json();
          const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
          setNewUomAvailableBranches([...new Set(branchData)]);
        }
      } catch (err) {
        console.error('Error fetching UOM branches:', err);
      }
    };
    fetchUomBranches();
  }, [newUomTargetCompanies, showNewUomModal]);

  useEffect(() => {
    const fetchSupplierGroupBranches = async () => {
      if (!showSupplierGroupModal) return;
      if (newSupplierGroupTargetCompanies.length === 0) {
        setNewSupplierGroupAvailableBranches([]);
        return;
      }
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Company-Name': newSupplierGroupTargetCompanies.join(',')
          };
          const response = await fetch(`${API_URL}/api/branches`, { headers });
          const data = await response.json();
          const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
          setNewSupplierGroupAvailableBranches([...new Set(branchData)]);
        }
      } catch (err) {
        console.error('Error fetching Supplier Group branches:', err);
      }
    };
    fetchSupplierGroupBranches();
  }, [newSupplierGroupTargetCompanies, showSupplierGroupModal]);

  useEffect(() => {
    const fetchBrandBranches = async () => {
      if (!showNewCompanyModal) return;
      if (newBrandTargetCompanies.length === 0) {
        setNewBrandAvailableBranches([]);
        return;
      }
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'X-Company-Name': newBrandTargetCompanies.join(',')
          };
          const response = await fetch(`${API_URL}/api/branches`, { headers });
          const data = await response.json();
          const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
          setNewBrandAvailableBranches([...new Set(branchData)]);
        }
      } catch (err) {
        console.error('Error fetching brand branches:', err);
      }
    };
    fetchBrandBranches();
  }, [newBrandTargetCompanies, showNewCompanyModal]);

  useEffect(() => {
    const fetchBranchesForActiveContext = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        let compsToFetch = [];

        if (isGroupAdmin) {
          if (activeTab === 'order') {
            compsToFetch = poForm.company || [];
          } else if (activeTab === 'receipt') {
            compsToFetch = prForm.company || [];
          } else if (activeTab === 'invoice') {
            compsToFetch = piForm.company || [];
          } else if (activeTab === 'supplier') {
            compsToFetch = supplierForm.target_companies || [];
          } else {
            compsToFetch = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All')
              ? [selectedCompanyFilter]
              : user.companies || (user.company ? [user.company] : []);
          }
        } else {
          compsToFetch = [selectedCompanyFilter || user.company_name || user.company];
        }

        compsToFetch = compsToFetch.filter(c => c && c !== 'All' && c !== 'All Companies' && c !== 'undefined');

        if (compsToFetch.length === 0) {
          compsToFetch = user.companies || (user.company ? [user.company] : []);
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Company-Name': compsToFetch.join(',')
        };

        const response = await fetch(`${API_URL}/api/branches`, { headers });
        const data = await response.json();
        const branchData = data.map(b => typeof b === 'string' ? b : (b.branch_name || b.branch || b.name));
        setAvailableBranches([...new Set(branchData)]);
      } catch (error) {
        console.error('Error fetching context branches:', error);
      }
    };

    fetchBranchesForActiveContext();
  }, [poForm.company, prForm.company, piForm.company, supplierForm.target_companies, selectedCompanyFilter, activeTab, isGroupAdmin]);

  const reportTabs = React.useMemo(() => [
    { key: 'po', name: 'Purchase Orders', feature: 'order' },
    { key: 'pr', name: 'Purchase Receipts', feature: 'receipt' },
    { key: 'pi', name: 'Purchase Invoices', feature: 'invoice' },
    { key: 'itemwise', name: 'Item-wise', feature: 'item' },
    { key: 'supplier', name: 'Suppliers', feature: 'supplier' },
  ].filter(rt => isFeatureEnabled(rt.feature)), [isFeatureEnabled]);

  const centeredTabs = React.useMemo(() => [
    { key: 'item', name: 'Items', icon: <FaShoppingCart /> },
    { key: 'supplier', name: 'Suppliers', icon: <FaUser /> },
    { key: 'order', name: 'Purchase Order', icon: <FaShoppingCart /> },
    { key: 'receipt', name: 'Purchase Receipt', icon: <FaTruck /> },
    { key: 'invoice', name: 'Purchase Invoice', icon: <FaFileInvoice /> },
    { key: 'report', name: 'Reports', icon: <FaChartBar /> },
  ].filter(tab => isFeatureEnabled(tab.key)), [isFeatureEnabled]);

  // 2. Data loading/refetching - Re-runs whenever tab, branch or company changes
  useEffect(() => {
    if (activeTab !== 'landing' && (selectedCompanyFilter || !isGroupAdmin)) {
      const loadAllData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchItems(),
            fetchSuppliers(),
            fetchSupplierGroups(),
            fetchBrands(),
            fetchPurchaseOrders(),
            fetchPurchaseReceipts(),
            fetchPurchaseInvoices(),
            fetchUoms(),
            fetchTaxes()
          ]);
        } catch (err) {
          console.error("Error loading data:", err);
          setError("Failed to load module data. Please check your connection.");
        } finally {
          setLoading(false);
        }
      };
      loadAllData();
    }
  }, [activeTab, selectedBranchFilter, selectedCompanyFilter, isGroupAdmin]);
  useEffect(() => {
    if (suppliers.length > 0) {
      const companies = [...new Set(suppliers.map(s => s.company).filter(Boolean))];
      setUniqueCompanyNames(companies);
    }
  }, [suppliers]);
  // 3. Reset filters/forms when company changes

  useEffect(() => {
    const fetchDoctypes = async () => {
      // Fetch each doctype individually via /api/doctypes/<name>
      // so that company/branch-specific customizations (hidden, label, mandatory) are applied correctly.
      const doctypeNames = [
        'Purchase Item',
        'Purchase Order',
        'Purchase Receipt',
        'Purchase Invoice',
        'Purchase Order Item',
        'Purchase Receipt Item',
        'Purchase Invoice Item',
        'Purchase Taxes and Charges',
        'Supplier',
        'Purchase Order Report',
        'Purchase Receipt Report',
        'Purchase Invoice Report',
        'Supplier Report',
        'Purchase Item Report',
      ];
      try {
        const results = await Promise.all(
          doctypeNames.map(name =>
            fetch(`${API_URL}/api/doctypes/${encodeURIComponent(name)}`, { headers: getHeaders() })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        const schemas = {};
        results.forEach((dt, i) => {
          if (dt) schemas[doctypeNames[i]] = dt;
        });
        setDoctypeSchemas(schemas);
      } catch (err) {
        console.error("Error fetching doctypes:", err);
      }
    };
    fetchDoctypes();

    // Listen for real-time doctype updates from the Customization Modal.
    // When the modal saves, it fires 'doctypes-updated' and this re-fetches
    // instantly so the UI reflects changes without a page refresh.
    window.addEventListener('doctypes-updated', fetchDoctypes);
    return () => window.removeEventListener('doctypes-updated', fetchDoctypes);
  }, [selectedCompanyFilter, selectedBranchFilter]);
  useEffect(() => {
    const companyStr = getFormCompany();
    if (companyStr) {
      // Update form defaults
      setPoForm(prev => ({ ...prev, company: companyStr }));
      setPrForm(prev => ({ ...prev, company: companyStr }));
      setPiForm(prev => ({ ...prev, company: companyStr }));
    }
  }, [selectedCompanyFilter, isGroupAdmin]);

  useEffect(() => {
    if (activeTab === 'order' && !editingPoId) {
      const nextSeries = getNextSeries();
      setPoForm(prev => {
        // Only update if it's different to avoid infinite loops, but ensure we catch the fresh value
        if (prev.series !== nextSeries) {
          return { ...prev, series: nextSeries };
        }
        return prev;
      });
    }
  }, [activeTab, editingPoId, purchaseOrders]);
  useEffect(() => {
    if (activeTab === 'receipt' && !editingPrId) {
      const nextSeries = getNextPrSeries();
      setPrForm(prev => {
        if (prev.series !== nextSeries) {
          return { ...prev, series: nextSeries };
        }
        return prev;
      });
    }
  }, [activeTab, editingPrId, purchaseReceipts]);
  useEffect(() => {
    if (activeTab === 'invoice' && !editingPiId) {
      const nextSeries = getNextPiSeries();
      setPiForm(prev => {
        if (prev.series !== nextSeries) {
          return { ...prev, series: nextSeries };
        }
        return prev;
      });
    }
  }, [activeTab, editingPiId, purchaseInvoices]);
  useEffect(() => {
    if (editingItem) {
      setItemFormRows([{
        company: editingItem.brand || editingItem.company || '',
        name: editingItem.item_name || editingItem.name,
        boxToMaster: editingItem.packets_per_box || editingItem.boxToMaster || '',
        masterUnit: editingItem.masterUnit || '',
        masterToOuter: editingItem.units_per_packet || editingItem.masterToOuter || '',
        outerUnit: editingItem.outerUnit || '',
        outerToNos: editingItem.total_units_per_box || editingItem.outerToNos || '',
        nosUnit: editingItem.nosUnit || '',
        grams: editingItem.grams || '',
        suppliers: editingItem.suppliers || [],
        branch_name: Array.isArray(editingItem.branch_name) ? editingItem.branch_name : (editingItem.branch_name ? [editingItem.branch_name] : []),
        isCompanyDropdownOpen: false,
        isSupplierDropdownOpen: false,
        isBranchDropdownOpen: false
      }]);
    } else {
      let initialSuppliers = [];
      if (creatingItemForPo && poForm.supplierId) {
        const s = suppliers.find(sup => sup._id === poForm.supplierId);
        if (s) initialSuppliers.push({ supplierId: s._id, supplierName: s.company });
      } else if (creatingItemForPi && piForm.supplierId) {
        const s = suppliers.find(sup => sup._id === piForm.supplierId);
        if (s) initialSuppliers.push({ supplierId: s._id, supplierName: s.company });
      }
      const defaultBranch = isCompanyAdmin ? [] : (userBranch ? [userBranch] : []);
      setItemFormRows([{ company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: initialSuppliers, branch_name: defaultBranch, isCompanyDropdownOpen: false, isSupplierDropdownOpen: false, isBranchDropdownOpen: false }]);
    }
  }, [editingItem, creatingItemForPo, creatingItemForPi, poForm.supplierId, piForm.supplierId, suppliers, isCompanyAdmin, userBranch]);
  useEffect(() => {
    if (editingSupplier) {
      setSupplierForm({ ...editingSupplier, contacts: editingSupplier.contacts || [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }] });
    } else {
      setSupplierForm({
        company: '',
        code: '',

        group: '',
        branch_name: isCompanyAdmin ? [] : (userBranch ? [userBranch] : []),
        isBranchDropdownOpen: false,
        country: '',
        currency: '',
        taxId: '',
        taxCategory: '',
        taxWithholdingCategory: '',
        contacts: [{ contactPerson: '', whatsapp: '', phone: '', email: '', address: '' }],
        paymentMode: '',
        paymentTerms: '',
        creditLimit: 0,
        paymentTermsOverride: '',
        bankDetails: '',
        website: '',
        onTimeDelivery: 0,
        defectRate: 0,
        lastPurchaseDate: '',
        lastPurchaseValue: 0
      });
    }
  }, [editingSupplier, isCompanyAdmin, userBranch]);
  // Auto-load item-wise report when tab is clicked
  useEffect(() => {
    if (activeReport === 'itemwise') {
      fetchItemWiseReport();
    }
  }, [activeReport]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks on navigation tabs and landing buttons to prevent conflicts
      const isNavClick = event.target.closest('.purchase-nav-tabs') || 
                        event.target.closest('.purchase-landing-buttons');

      if (!isNavClick && 
          !event.target.closest('.purchase-branch-filter-container') && 
          !event.target.closest('.purchase-global-search') &&
          !event.target.closest('.purchase-branch-dropdown') &&
          !event.target.closest('.purchase-custom-multiselect') &&
          !event.target.closest('.purchase-dropdown-options')) {
        
        setIsBranchDropdownOpen(false);
        setItemFormRows(prev => prev.map(row => ({
          ...row,
          isTargetCompanyDropdownOpen: false,
          isCompanyDropdownOpen: false,
          isBranchDropdownOpen: false,
          isSupplierDropdownOpen: false
        })));
        setSupplierForm(prev => ({
          ...prev,
          isBranchDropdownOpen: false,
          isTargetCompanyDropdownOpen: false
        }));
        setPoForm(prev => ({ ...prev, isBranchDropdownOpen: false, isCompanyDropdownOpen: false }));
        setPrForm(prev => ({ ...prev, isBranchDropdownOpen: false, isCompanyDropdownOpen: false }));
        setPiForm(prev => ({ ...prev, isBranchDropdownOpen: false, isCompanyDropdownOpen: false }));
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (suppliers.length > 0) {
      if (creatingSupplierForPo) {
        const newSupplier = suppliers[suppliers.length - 1];
        const contact = newSupplier.contacts[0] || { address: '', phone: '', email: '' };
        
        // --- RESOLVE SUPPLIER GROUP NAME ---
        const groupRecord = supplierGroups.find(g => g._id === newSupplier.group || g.group_name === newSupplier.group);
        const groupName = groupRecord ? groupRecord.group_name : (newSupplier.group || '');

        setPoForm(prev => ({
          ...prev,
          supplierId: newSupplier._id,
          supplierCode: newSupplier.code,
          supplierGroup: groupName,
          address: contact.address,
          phone: contact.phone,
          email: contact.email,
          currency: newSupplier.currency || prev.currency
        }));
        setCurrentPoSupplier(newSupplier);
        setActiveTab('order');
        setCreatingSupplierForPo(false);
      } else if (creatingSupplierForPi) {
        const newSupplier = suppliers[suppliers.length - 1];
        const contact = newSupplier.contacts[0] || { address: '', phone: '', email: '' };

        // --- RESOLVE SUPPLIER GROUP NAME ---
        const groupRecord = supplierGroups.find(g => g._id === newSupplier.group || g.group_name === newSupplier.group);
        const groupName = groupRecord ? groupRecord.group_name : (newSupplier.group || '');

        setPiForm(prev => ({
          ...prev,
          supplierId: newSupplier._id,
          supplierCode: newSupplier.code,
          supplierGroup: groupName,
          address: contact.address,
          phone: contact.phone,
          email: contact.email
        }));
        setCurrentPiSupplier(newSupplier);
        setActiveTab('invoice');
        setCreatingSupplierForPi(false);
      }
    }
  }, [suppliers]);
  const fetchUoms = async () => {
    try {
      console.info(`[Purchase] Fetching UOMs...`);
      const response = await fetch(`${API_URL}/api/uoms`, { headers: getHeaders() });
      if (response.ok) {
        const uoms = await response.json();
        console.info(`[Purchase] SUCCESS: UOMs fetched: ${uoms.length}`);
        setUomOptions(uoms); // Now full objects
      } else {
        console.error(`[Purchase] ERROR: Failed to fetch UOMs. Status: ${response.status}`);
        setError('Failed to fetch UOMs');
      }
    } catch (err) {
      console.error('[Purchase] FATAL: Error fetching UOMs:', err);
      setError('Failed to fetch UOMs');
    }
  };

  const fetchTaxes = async () => {
    try {
      console.info(`[Purchase] Fetching Taxes...`);
      const response = await fetch(`${API_URL}/api/taxes`, { headers: getHeaders() });
      if (response.ok) {
        const taxesData = await response.json();
        console.info(`[Purchase] SUCCESS: Taxes fetched: ${taxesData.length}`);
        setTaxes(taxesData);
      } else {
        console.error(`[Purchase] ERROR: Failed to fetch taxes. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('[Purchase] FATAL: Error fetching taxes:', err);
    }
  };
  const fetchSupplierGroups = async () => {
    try {
      console.info(`[Purchase] Fetching Supplier Groups...`);
      const response = await fetch(`${API_URL}/api/supplier_groups`, { headers: getHeaders() });
      if (response.ok) {
        const groups = await response.json();
        const sortedGroups = Array.isArray(groups) ? groups.sort((a, b) => (a.group_name || '').localeCompare(b.group_name || '')) : [];
        console.info(`[Purchase] SUCCESS: Supplier Groups fetched: ${sortedGroups.length}`);
        setSupplierGroups(sortedGroups);
      } else {
        console.error(`[Purchase] ERROR: Failed supplier groups fetch. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('[Purchase] FATAL: Error in fetchSupplierGroups:', err);
    }
  };
  const fetchBrands = async () => {
    try {
      console.info(`[Purchase] Fetching Brands...`);
      const response = await fetch(`${API_URL}/api/brands`, { headers: getHeaders() });
      if (response.ok) {
        const brandsData = await response.json();
        console.info(`[Purchase] SUCCESS: Brands fetched: ${brandsData.length}`);
        setBrands(brandsData);
      } else {
        console.error(`[Purchase] ERROR: Failed to fetch brands. Status: ${response.status}`);
        setError('Failed to fetch brands');
      }
    } catch (err) {
      console.error('[Purchase] FATAL: Error fetching brands:', err);
      setError('Failed to fetch brands');
    }
  };
  // NEW: Handle Edit Brand
  const handleEditBrand = (brand) => {
    setEditingBrand(brand._id);
    setEditingBrandName(brand.name);
  };
  // NEW: Handle Update Brand
  const handleUpdateBrand = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/brands/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: editingBrandName })
      });
      if (response.ok) {
        await fetchBrands();
        setMessage('Brand updated successfully');
        setEditingBrand(null);
        setEditingBrandName('');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update brand');
      }
    } catch (err) {
      setError('Failed to update brand');
    }
  };
  // NEW: Delete Brand
  const deleteBrand = async (id) => {
    setShowWarning('Are you sure you want to delete this brand?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/brands/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchBrands();
          setMessage('Brand deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete brand');
        }
      } catch (err) {
        setError('Failed to delete brand');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const fetchItemWiseReport = async () => {
    try {
      const params = new URLSearchParams();
      if (reportItemWiseDateFrom) params.append('dateFrom', reportItemWiseDateFrom);
      if (reportItemWiseDateTo) params.append('dateTo', reportItemWiseDateTo);
      if (reportItemWiseItem) params.append('itemId', reportItemWiseItem);
      if (reportItemWiseSupplier) params.append('supplierId', reportItemWiseSupplier);

      const response = await fetch(`${API_URL}/api/reports/item-wise-purchase?${params.toString()}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setReportItemWiseData(data);
      } else {
        setError('Failed to fetch item-wise report');
      }
    } catch (err) {
      setError('Failed to fetch item-wise report');
    }
  };
  const getNextSeries = () => {
    const prefix = 'PO';
    const matchingPos = purchaseOrders.filter(po => po.series && po.series.startsWith(prefix));
    if (matchingPos.length === 0) return prefix + '0001';
    const numbers = matchingPos.map(po => parseInt(po.series.slice(prefix.length), 10));
    const max = Math.max(...numbers);
    return prefix + (max + 1).toString().padStart(4, '0');
  };
  const getNextPrSeries = () => {
    const prefix = 'PR';
    const matchingPrs = purchaseReceipts.filter(pr => pr.series && pr.series.startsWith(prefix));
    if (matchingPrs.length === 0) return prefix + '0001';
    const numbers = matchingPrs.map(pr => parseInt(pr.series.slice(prefix.length), 10));
    const max = Math.max(...numbers);
    return prefix + (max + 1).toString().padStart(4, '0');
  };
  const getNextPiSeries = () => {
    const prefix = 'PI';
    const matchingPis = purchaseInvoices.filter(pi => pi.series && pi.series.startsWith(prefix));
    if (matchingPis.length === 0) return prefix + '0001';
    const numbers = matchingPis.map(pi => parseInt(pi.series.slice(prefix.length), 10));
    const max = Math.max(...numbers);
    return prefix + (max + 1).toString().padStart(4, '0');
  };
  const fetchItems = async () => {
    try {
      console.info(`[Purchase] Fetching Items...`);
      const response = await fetch(`${API_URL}/api/purchase_items`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map(item => ({...item, name: item.item_name || item.name}));
        console.info(`[Purchase] SUCCESS: Items fetched: ${data.length}`);
        setItems(mappedData);
        return mappedData;
      } else {
        console.error(`[Purchase] ERROR: Failed to fetch items. Status: ${response.status}`);
        setError('Failed to fetch items');
      }
    } catch (err) {
      console.error('[Purchase] FATAL: Error fetching items:', err);
      setError('Failed to fetch items');
    }
    return null;
  };
  const fetchSuppliers = async () => {
    try {
      const headers = getHeaders();
      console.info(`[Purchase] Fetching Suppliers... Headers:`, headers);
      const response = await fetch(`${API_URL}/api/suppliers`, { headers });
      if (response.ok) {
        const data = await response.json();
        console.info(`[Purchase] SUCCESS: Suppliers fetched: ${data.length}`, data);
        setSuppliers(data);
        return data;
      } else {
        console.error(`[Purchase] ERROR: Failed to fetch suppliers. Status: ${response.status}`);
        setError('Failed to fetch suppliers');
      }
    } catch (err) {
      console.error('[Purchase] FATAL: Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
    }
  };
  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_orders`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
        return data;
      } else {
        setError('Failed to fetch purchase orders');
        return [];
      }
    } catch (err) {
      setError('Failed to fetch purchase orders');
      return [];
    }
  };
  const fetchPurchaseReceipts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_receipts`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setPurchaseReceipts(data);
        return data;
      } else {
        setError('Failed to fetch purchase receipts');
        return [];
      }
    } catch (err) {
      setError('Failed to fetch purchase receipts');
      return [];
    }
  };
  const fetchPurchaseInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/purchase_invoices`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setPurchaseInvoices(data);
        return data;
      } else {
        setError('Failed to fetch purchase invoices');
        return [];
      }
    } catch (err) {
      setError('Failed to fetch purchase invoices');
      return [];
    }
  };
  const [fieldErrors, setFieldErrors] = useState({}); // NEW: Field-level errors

  const handleBranchChangeForItem = (index, branch) => {
    const newRows = [...itemFormRows];
    let currentBranches = Array.isArray(newRows[index].branch_name) ? newRows[index].branch_name : [];

    if (branch === 'all') {
      newRows[index].branch_name = [];
    } else if (branch === 'select_all_available') {
      const filtered = availableBranches.filter(b => 
        String(b).toLowerCase().includes((newRows[index].branchSearchTerm || '').toLowerCase())
      );
      const allSelected = filtered.every(b => currentBranches.includes(b));
      
      if (allSelected) {
        newRows[index].branch_name = currentBranches.filter(b => !filtered.includes(b));
      } else {
        newRows[index].branch_name = [...new Set([...currentBranches, ...filtered])];
      }
    } else {
      if (currentBranches.includes(branch)) {
        newRows[index].branch_name = currentBranches.filter(b => b !== branch);
      } else {
        newRows[index].branch_name = [...currentBranches, branch];
      }
    }
    setItemFormRows(newRows);
  };

  const toggleBranchDropdownForItem = (index) => {
    const newRows = [...itemFormRows];
    newRows[index].isBranchDropdownOpen = !newRows[index].isBranchDropdownOpen;
    setItemFormRows(newRows);
  };

  const handleBranchChangeForSupplier = (branch) => {
    let currentBranches = Array.isArray(supplierForm.branch_name) ? supplierForm.branch_name : [];

    if (branch === 'all') {
      // Toggle logic for 'All Branches'
      if (currentBranches.length === 0) {
        // If already 'All', do nothing or maybe reset to none? 
        // For 'Select All' requirement, we'll implement a separate Select All toggle.
        setSupplierForm({ ...supplierForm, branch_name: [] }); 
      } else {
        setSupplierForm({ ...supplierForm, branch_name: [] });
      }
    } else if (branch === 'select_all_visible') {
      // NEW: Select all visible/filtered branches
      const filtered = availableBranches.filter(b => 
        String(b).toLowerCase().includes((supplierForm.branchSearchTerm || '').toLowerCase())
      );
      const allSelected = filtered.every(b => currentBranches.includes(b));
      
      if (allSelected) {
        setSupplierForm({ ...supplierForm, branch_name: currentBranches.filter(b => !filtered.includes(b)) });
      } else {
        setSupplierForm({ ...supplierForm, branch_name: [...new Set([...currentBranches, ...filtered])] });
      }
    } else {
      if (currentBranches.includes(branch)) {
        setSupplierForm({ ...supplierForm, branch_name: currentBranches.filter(b => b !== branch) });
      } else {
        setSupplierForm({ ...supplierForm, branch_name: [...currentBranches, branch] });
      }
    }
  };

  const toggleBranchDropdownForSupplier = () => {
    setSupplierForm({ ...supplierForm, isBranchDropdownOpen: !supplierForm.isBranchDropdownOpen });
  };


  const handleItemFormChange = (index, field, value) => {
    if (['masterUnit', 'outerUnit'].includes(field) && value === 'create_new') {
      setPendingUom({ index, field });
      setShowNewUomModal(true);
      return;
    }
    if (field === 'company' && value === 'create_new') {
      setPendingCompany(index);
      setNewBrandTargetCompanies(itemFormRows[index].target_companies || []);
      setNewBrandTargetBranches(itemFormRows[index].branch_name || []);
      setShowNewCompanyModal(true);
      return;
    }
    const updatedRows = [...itemFormRows];
    updatedRows[index][field] = value;

    // Auto-calculate Total Units per Box
    if (field === 'boxToMaster' || field === 'masterToOuter') {
      const packets = Number(updatedRows[index].boxToMaster) || 0;
      const unitsPerPacket = Number(updatedRows[index].masterToOuter) || 0;
      updatedRows[index].outerToNos = (packets * unitsPerPacket).toString();
    }

    setItemFormRows(updatedRows);

    // Clear field-level error when user types
    if (fieldErrors[`${index}_${field}`]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[`${index}_${field}`];
      setFieldErrors(newErrors);
    }
  };

  const toggleSupplierDropdown = (index) => {
    const updatedRows = [...itemFormRows];
    updatedRows[index].isSupplierDropdownOpen = !updatedRows[index].isSupplierDropdownOpen;
    setItemFormRows(updatedRows);
  };

  const toggleSupplier = (index, supplier) => {
    const updatedRows = [...itemFormRows];
    const currentSuppliers = updatedRows[index].suppliers || [];
    const exists = currentSuppliers.some(s => s.supplierId === supplier._id);

    if (exists) {
      updatedRows[index].suppliers = currentSuppliers.filter(s => s.supplierId !== supplier._id);
    } else {
      updatedRows[index].suppliers = [...currentSuppliers, { supplierId: supplier._id, supplierName: supplier.company }];
    }
    setItemFormRows(updatedRows);
  };
  const handleCreateNewUom = async () => {
    if (newUomName.trim()) {
      try {
        const payload = {
          name: newUomName.trim(),
          company_names: newUomTargetCompanies.length > 0 ? newUomTargetCompanies : undefined,
          branch_names: newUomTargetBranches.length > 0 ? newUomTargetBranches : undefined
        };

        const response = await fetch(`${API_URL}/api/uoms`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const newUom = await response.json();
          await fetchUoms(); // Refresh global list to ensure ID and name are consistent
          handleItemFormChange(pendingUom.index, pendingUom.field, newUom.name);
          setNewUomName('');
          setShowNewUomModal(false);
          setPendingUom(null);
          setMessage('UOM created successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to create new UOM');
        }
      } catch (err) {
        setError('Failed to create new UOM');
      }
    }
  };
  const handleCreateNewCompany = async () => {
    if (newCompanyName.trim()) {
      try {
        const response = await fetch(`${API_URL}/api/brands`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            name: newCompanyName.trim(),
            company_names: newBrandTargetCompanies,
            branch_names: newBrandTargetBranches
          })
        });
        if (response.ok) {
          await fetchBrands(); // Refresh brands list
          handleItemFormChange(pendingCompany, 'company', newCompanyName.trim());
          setMessage('Brand created successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to create brand');
        }
      } catch (err) {
        setError('Failed to create brand');
      }
      setNewCompanyName('');
      setShowNewCompanyModal(false);
      setPendingCompany(null);
    }
  };
  const addItemFormRow = () => {
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : {};
    const defaultBranch = isCompanyAdmin ? [] : (userObj?.branch_name ? [userObj?.branch_name] : []);
    setItemFormRows([...itemFormRows, { company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], branch_name: defaultBranch, target_companies: [], isTargetCompanyDropdownOpen: false, isCompanyDropdownOpen: false, isSupplierDropdownOpen: false, isBranchDropdownOpen: false }]);
  };
  const removeItemFormRow = (index) => {
    if (itemFormRows.length > 1) {
      setItemFormRows(itemFormRows.filter((_, i) => i !== index));
    }
  };
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to add items.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const newFieldErrors = {};
    let hasError = false;

    for (let idx = 0; idx < itemFormRows.length; idx++) {
      const row = itemFormRows[idx];
      const fieldsToCheck = ['company', 'name', 'masterUnit', 'outerUnit', 'nosUnit', 'boxToMaster', 'masterToOuter', 'outerToNos', 'grams'];

      fieldsToCheck.forEach(field => {
        if (isFieldMandatory('Purchase Item', field) && (!row[field] && row[field] !== 0)) {
          newFieldErrors[`${idx}_${field}`] = 'Required';
          hasError = true;
        }
      });

      // Positive number validation
      ['boxToMaster', 'masterToOuter', 'outerToNos', 'grams'].forEach(field => {
        if (row[field] && Number(row[field]) <= 0) {
          newFieldErrors[`${idx}_${field}`] = 'Must be > 0';
          hasError = true;
        }
      });
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      setError('Please correct the errors highlighted below.');
      setLoading(false);
      return;
    }

    for (const row of itemFormRows) {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const newItem = {
        brand: row.company,
        item_name: row.name,
        branch_name: (isCompanyAdmin) ? (row.branch_name && row.branch_name.length > 0 ? row.branch_name : selectedBranchFilter) : (userObj?.branch_name || ''),
        packets_per_box: Number(row.boxToMaster),
        units_per_packet: Number(row.masterToOuter),
        total_units_per_box: Number(row.outerToNos),
        masterUnit: row.masterUnit,
        outerUnit: row.outerUnit,
        nosUnit: row.nosUnit,
        grams: Number(row.grams) || 0,
        suppliers: row.suppliers || []
      };
      try {
        const itemHeaders = getHeaders();
        const payload = { ...newItem };
        if (isGroupAdmin && row.target_companies && row.target_companies.length > 0) {
          itemHeaders['X-Company-Name'] = row.target_companies[0];
          payload.company_names = row.target_companies;
        }
        if ((isGroupAdmin || isCompanyAdmin) && row.branch_name && row.branch_name.length > 0) {
          payload.branch_names = row.branch_name;
        }

        console.info(`[Purchase] Submitting Item:`, payload, `Headers:`, itemHeaders);
        const response = await fetch(`${API_URL}/api/purchase_items`, {
          method: 'POST',
          headers: itemHeaders,
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errData = await response.json();
          console.error(`[Purchase] Failed to add item:`, errData);
          setError(errData.error || 'Failed to add item');
          setLoading(false);
          return;
        }
        const createdItem = await response.json();
        console.info(`[Purchase] SUCCESS: Item added:`, createdItem);
      } catch (err) {
        console.error(`[Purchase] FATAL: Error in handleItemSubmit:`, err);
        setError('Failed to add item');
        setLoading(false);
        return;
      }
    }
    const newItemsList = await fetchItems();

    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : {};
    const defaultBranch = isCompanyAdmin ? [] : (userObj?.branch_name ? [userObj?.branch_name] : []);
    setItemFormRows([{ company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], branch_name: defaultBranch, target_companies: [], isTargetCompanyDropdownOpen: false, isCompanyDropdownOpen: false, isSupplierDropdownOpen: false, isBranchDropdownOpen: false }]);
    setMessage('Item(s) added successfully');
    if (creatingItemForPo && itemFormRows.length === 1 && newItemsList) {
      const newItem = newItemsList.find(item => (item.item_name || item.name || "") === itemFormRows[0].name && (item.brand || item.company || "") === itemFormRows[0].company) || newItemsList[newItemsList.length - 1];
      setPoForm(prev => {
        const updatedItems = [...prev.items];
        updatedItems[creatingItemForPo.rowIndex].itemId = newItem._id;
        const newForm = { ...prev, items: updatedItems };
        return { ...newForm, ...calculatePoTotals(newForm) };
      });
      setActiveTab('order');
      setCreatingItemForPo(null);
    } else if (creatingItemForPr && itemFormRows.length === 1 && newItemsList) {
      const newItem = newItemsList.find(item => (item.item_name || item.name || "") === itemFormRows[0].name && (item.brand || item.company || "") === itemFormRows[0].company) || newItemsList[newItemsList.length - 1];
      setPrForm(prev => {
        const updatedItems = [...prev.items];
        updatedItems[creatingItemForPr.rowIndex].itemId = newItem._id;
        const newForm = { ...prev, items: updatedItems };
        return { ...newForm, ...calculatePrTotals(newForm) };
      });
      setActiveTab('receipt');
      setCreatingItemForPr(null);
    } else if (creatingItemForPi && itemFormRows.length === 1 && newItemsList) {
      const newItem = newItemsList.find(item => (item.item_name || item.name || "") === itemFormRows[0].name && (item.brand || item.company || "") === itemFormRows[0].company) || newItemsList[newItemsList.length - 1];
      setPiForm(prev => {
        const updatedItems = [...prev.items];
        updatedItems[creatingItemForPi.rowIndex].itemId = newItem._id;
        const newForm = { ...prev, items: updatedItems };
        return { ...newForm, ...calculatePiTotals(newForm) };
      });
      setActiveTab('invoice');
      setCreatingItemForPi(null);
    }
    setLoading(false);
  };
  const handleItemUpdate = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to edit items.");
      setShowPermModal(true);
      return;
    }
    const row = itemFormRows[0];
    setLoading(true);
    setMessage('');
    setError(null);
    // Validation checks...
    const fieldsToCheck = ['company', 'name', 'masterUnit', 'outerUnit', 'nosUnit', 'boxToMaster', 'masterToOuter', 'outerToNos', 'grams'];
    let updateHasError = false;
    fieldsToCheck.forEach(field => {
      if (isFieldMandatory('Purchase Item', field) && (!row[field] && row[field] !== 0)) {
        updateHasError = true;
      }
    });

    if (updateHasError) {
      setError('All item fields with * are required and must be positive numbers where applicable.');
      setLoading(false);
      return;
    }
    const conversionFactor = Number(row.masterToOuter) * Number(row.outerToNos);
    const updatedItem = {
      brand: row.company,
      item_name: row.name,
      branch_name: (isCompanyAdmin) ? (row.branch_name && row.branch_name.length > 0 ? row.branch_name : selectedBranchFilter) : (userBranch ? [userBranch] : []),
      packets_per_box: Number(row.boxToMaster),
      units_per_packet: Number(row.masterToOuter),
      total_units_per_box: Number(row.outerToNos),
      masterUnit: row.masterUnit,
      outerUnit: row.outerUnit,
      nosUnit: row.nosUnit,
      grams: Number(row.grams) || 0,
      suppliers: row.suppliers || []
    };
    try {
      const itemHeaders = getHeaders();
      const row = itemFormRows[0];
      const payload = { ...updatedItem };
      if (isGroupAdmin && row.target_companies && row.target_companies.length > 0) {
        itemHeaders['X-Company-Name'] = row.target_companies[0];
        payload.company_names = row.target_companies;
      }
      if ((isGroupAdmin || isCompanyAdmin) && row.branch_name && row.branch_name.length > 0) {
        payload.branch_names = row.branch_name;
      }

      const response = await fetch(`${API_URL}/api/purchase_items/${editingItem._id}`, {
        method: 'PUT',
        headers: itemHeaders,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchItems();
        setMessage('Item updated successfully');
        setEditingItem(null);
        const userStr = localStorage.getItem('user');
        const userObj = userStr ? JSON.parse(userStr) : {};
        const defaultBranch = isCompanyAdmin ? [] : (userObj?.branch_name ? [userObj?.branch_name] : []);
        setItemFormRows([{ company: '', name: '', boxToMaster: '', masterUnit: '', masterToOuter: '', outerUnit: '', outerToNos: '', nosUnit: 'Nos', grams: '', suppliers: [], branch_name: defaultBranch, target_companies: [], isTargetCompanyDropdownOpen: false, isCompanyDropdownOpen: false, isBranchDropdownOpen: false }]);
        if (editingFrom) {
          setActiveTab(editingFrom);
          setEditingFrom(null);
        }
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update item');
      }
    } catch (err) {
      setError('Failed to update item');
    }
    setLoading(false);
  };
  const deleteItem = (id) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete items.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this item?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/purchase_items/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchItems();
          setMessage('Item deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete item');
        }
      } catch (err) {
        setError('Failed to delete item');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const handleEditUom = (uom) => {
    setEditingUom(uom._id);
    setEditingUomName(uom.name);
  };
  const handleUpdateUom = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/uoms/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: editingUomName })
      });
      if (response.ok) {
        await fetchUoms();
        setMessage('UOM updated successfully');
        setEditingUom(null);
        setEditingUomName('');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update UOM');
      }
    } catch (err) {
      setError('Failed to update UOM');
    }
  };
  const deleteUom = async (id) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete UOMs.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this UOM?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/uoms/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchUoms();
          setMessage('UOM deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete UOM');
        }
      } catch (err) {
        setError('Failed to delete UOM');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  // NEW: Handle Create/Update Supplier Group
  const handleSupplierGroupSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to manage supplier groups.");
      setShowPermModal(true);
      return;
    }
    if (!newSupplierGroupName.trim()) {
      setError('Group name is required');
      return;
    }
    setLoading(true);
    
    // RESOLVE URL AND METHOD
    const url = editingSupplierGroup 
      ? `${API_URL}/api/supplier_groups/${editingSupplierGroup._id}` 
      : `${API_URL}/api/supplier_groups`;
    const method = editingSupplierGroup ? 'PUT' : 'POST';

    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : {};
      const payload = {
        group_name: newSupplierGroupName.trim(),
        company_names: newSupplierGroupTargetCompanies.length > 0 ? newSupplierGroupTargetCompanies : undefined,
        branch_names: newSupplierGroupTargetBranches.length > 0 ? newSupplierGroupTargetBranches : undefined
      };

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchSupplierGroups();
        setMessage(editingSupplierGroup ? 'Supplier group updated successfully' : 'Supplier group created successfully');
        
        // AUTO-SELECT for Supplier Form if creating a new one
        if (!editingSupplierGroup && newSupplierGroupName) {
          setSupplierForm(prev => ({ ...prev, group: newSupplierGroupName.trim() }));
        }

        setNewSupplierGroupName('');
        setEditingSupplierGroup(null);
        setShowSupplierGroupModal(false);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save supplier group');
      }
    } catch (err) {
      setError('Failed to save supplier group');
    }
    setLoading(false);
  };
  // NEW: Delete Supplier Group
  const deleteSupplierGroup = (id) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete supplier groups.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this supplier group?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/supplier_groups/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchSupplierGroups();
          setMessage('Supplier group deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete supplier group');
        }
      } catch (err) {
        setError('Failed to delete supplier group');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const addContact = () => {
    setSupplierForm({ ...supplierForm, contacts: [...supplierForm.contacts, { designation: '', contactPerson: '', phoneCode: '+971', phone: '', whatsappCode: '+971', whatsapp: '', email: '', address: '' }] });
  };
  const removeContact = (index) => {
    if (supplierForm.contacts.length > 1) {
      const newContacts = supplierForm.contacts.filter((_, i) => i !== index);
      setSupplierForm({ ...supplierForm, contacts: newContacts });
    }
  };
  const handleContactChange = (index, field, value) => {
    const newContacts = [...supplierForm.contacts];
    // Dynamic validation for phone/whatsapp length
    if (field === 'phone') {
      const code = newContacts[index].phoneCode || '+971';
      const maxLen = digitLengths[code] || 10;
      if (value.length > maxLen) return;
    }
    if (field === 'whatsapp') {
      const code = newContacts[index].whatsappCode || '+971';
      const maxLen = digitLengths[code] || 10;
      if (value.length > maxLen) return;
    }
    newContacts[index][field] = value;
    setSupplierForm({ ...supplierForm, contacts: newContacts });
  };



  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to add suppliers.");
      setShowPermModal(true);
      return;
    }
    const validationError = validateForm(supplierForm, 'supplier');
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const supplierHeaders = getHeaders();
      const payload = { ...supplierForm };
      if (isGroupAdmin && supplierForm.target_companies && supplierForm.target_companies.length > 0) {
        supplierHeaders['X-Company-Name'] = supplierForm.target_companies[0];
        payload.company_names = supplierForm.target_companies;
      }
      if ((isGroupAdmin || isCompanyAdmin) && supplierForm.branch_name && supplierForm.branch_name.length > 0) {
        payload.branch_names = supplierForm.branch_name;
      }

      const response = await fetch(`${API_URL}/api/suppliers`, {
        method: 'POST',
        headers: supplierHeaders,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const newSupplier = await response.json();
        await fetchSuppliers();
        const userStr = localStorage.getItem('user');
        const userObj = userStr ? JSON.parse(userStr) : {};
        const defaultBranch = isCompanyAdmin ? [] : (userObj?.branch_name ? [userObj?.branch_name] : []);
        setSupplierForm({
          company: '', code: '', group: '', branch_name: defaultBranch, target_companies: [], isBranchDropdownOpen: false, isTargetCompanyDropdownOpen: false, country: '', currency: '',
          taxId: '', taxCategory: '', taxWithholdingCategory: '',
          contacts: [{ designation: '', contactPerson: '', phoneCode: '+971', phone: '', whatsappCode: '+971', whatsapp: '', email: '', address: '' }],
          paymentMode: '', paymentTerms: '', creditLimit: 0, paymentTermsOverride: '',
          bankDetails: '', website: '', onTimeDelivery: 0, defectRate: 0,
          lastPurchaseDate: '', lastPurchaseValue: 0
        });
        setMessage('Supplier saved successfully');
        if (creatingSupplierForItem) {
          handleItemFormChange(creatingSupplierForItem.rowIndex, 'suppliers', [{ supplierId: newSupplier._id, supplierName: newSupplier.company }]);
          setActiveTab('item');
          setCreatingSupplierForItem(null);
        }
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save supplier');
      }
    } catch (err) {
      setError('Failed to save supplier');
    }
    setLoading(false);
  };
  const handleSupplierUpdate = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to edit suppliers.");
      setShowPermModal(true);
      return;
    }
    const validationError = validateForm(supplierForm, 'supplier');
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const supplierHeaders = getHeaders();
      const payload = { ...supplierForm };
      if (isGroupAdmin && supplierForm.target_companies && supplierForm.target_companies.length > 0) {
        supplierHeaders['X-Company-Name'] = supplierForm.target_companies[0];
        payload.company_names = supplierForm.target_companies;
      }
      if ((isGroupAdmin || isCompanyAdmin) && supplierForm.branch_name && supplierForm.branch_name.length > 0) {
        payload.branch_names = supplierForm.branch_name;
      }

      const response = await fetch(`${API_URL}/api/suppliers/${editingSupplier._id}`, {
        method: 'PUT',
        headers: supplierHeaders,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchSuppliers();
        setEditingSupplier(null);
        const defaultBranch = isCompanyAdmin ? [] : (userBranch ? [userBranch] : []);
        setSupplierForm({
          company: '', code: '', group: '', branch_name: defaultBranch, target_companies: [], isBranchDropdownOpen: false, isTargetCompanyDropdownOpen: false, country: '', currency: '',
          taxId: '', taxCategory: '', taxWithholdingCategory: '',
          contacts: [{ designation: '', contactPerson: '', phoneCode: '+971', phone: '', whatsappCode: '+971', whatsapp: '', email: '', address: '' }],
          paymentMode: '', paymentTerms: '', creditLimit: 0, paymentTermsOverride: '',
          bankDetails: '', website: '', onTimeDelivery: 0, defectRate: 0,
          lastPurchaseDate: '', lastPurchaseValue: 0
        });
        setMessage('Supplier updated successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to update supplier');
      }
    } catch (err) {
      setError('Failed to update supplier');
    }
    setLoading(false);
  };
  const deleteSupplier = (id) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete suppliers.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this supplier?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/suppliers/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchSuppliers();
          setMessage('Supplier deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete supplier');
        }
      } catch (err) {
        setError('Failed to delete supplier');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const calculatePoTotals = (form) => {
    let subtotal = 0;
    let exciseDuty = 0;
    let totalQuantity = 0;
    let totalQtyInCommon = 0;
    let commonUOM = '';
    let allSameUOM = true;
        const newItems = form.items.map(item => {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      totalQuantity += qty;
      
      const selItem = items.find(i => i._id === item.itemId);
      if (selItem && selItem.excise_applicable) {
         exciseDuty += (amount * (Number(selItem.excise_rate) || 0)) / 100;
      }
      return { ...item, amount };
    });
    if (form.items.length > 0) {
      const firstItemData = items.find(i => i._id === form.items[0].itemId);
      if (firstItemData) {
        const firstUom = form.items[0].uom;
        commonUOM = firstUom === 'master' ? firstItemData.masterUnit : firstUom === 'outer' ? firstItemData.outerUnit : firstUom === 'nos' ? firstItemData.nosUnit : 'Grams';
        allSameUOM = form.items.every(it => it.uom === firstUom);
        if (allSameUOM) {
          totalQtyInCommon = form.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
          // Check if all display UOM are same, assuming units are consistent across items
        } else {
          // Convert to master
          commonUOM = firstItemData.masterUnit || 'Carton';
          totalQtyInCommon = 0;
          form.items.forEach(it => {
            const selItem = items.find(i => i._id === it.itemId);
            if (selItem) {
              let qty = Number(it.quantity || 0);
              if (it.uom === 'master') {
                totalQtyInCommon += qty;
              } else if (it.uom === 'outer') {
                totalQtyInCommon += qty / (selItem.masterToOuter || 1);
              } else if (it.uom === 'nos') {
                totalQtyInCommon += qty / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
              } else if (it.uom === 'grams') {
                if (selItem.grams > 0) {
                  const nos = qty / selItem.grams;
                  totalQtyInCommon += nos / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
                }
              }
            }
          });
        }
      }
    }
        let taxableAmount = subtotal + exciseDuty;
    let totalTaxes = 0;
    const newTaxes = form.taxes.map(tax => {
      const amount = (taxableAmount * Number(tax.taxRate || 0)) / 100;
      totalTaxes += amount;
      return { ...tax, amount, total: taxableAmount + totalTaxes };
    });
    const grandTotal = taxableAmount + totalTaxes;
    return { items: newItems, taxes: newTaxes, subtotal, exciseDuty, taxableAmount, totalQuantity, totalTaxes, grandTotal, totalQtyInCommon, commonUOM };
  };
  const handlePoFormChange = (field, value) => {
    setPoForm(prev => {
      const newForm = { ...prev, [field]: value };
      return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };

  const toggleCompanyDropdownForPo = (e) => {
    if (e) e.stopPropagation();
    setPoForm(prev => ({ ...prev, isCompanyDropdownOpen: !prev.isCompanyDropdownOpen, isBranchDropdownOpen: false }));
  };

  const handleCompanyChangeForPo = (comp) => {
    setPoForm(prev => {
      const current = prev.company || [];
      const newCompanies = current.includes(comp)
        ? current.filter(c => c !== comp)
        : [...current, comp];
      return { ...prev, company: newCompanies };
    });
  };

  const toggleBranchDropdownForPo = (e) => {
    if (e) e.stopPropagation();
    setPoForm(prev => ({ ...prev, isBranchDropdownOpen: !prev.isBranchDropdownOpen, isCompanyDropdownOpen: false }));
  };

  const handleBranchChangeForPo = (branch) => {
    setPoForm(prev => {
      let current = [...(prev.branch_name || [])];
      if (branch === 'all') {
        current = current.length === availableBranches.length ? [] : [...availableBranches];
      } else {
        current = current.includes(branch)
          ? current.filter(b => b !== branch)
          : [...current, branch];
      }
      return { ...prev, branch_name: current };
    });
  };

  const handlePoItemChange = (index, field, value) => {
    if (field === 'itemId' && value === 'create_new') {
      setCreatingItemForPo({ rowIndex: index });
      setActiveTab('item');
      return;
    }
    setPoForm(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const addPoItem = () => {
    setPoForm(prev => {
      const newItems = [...prev.items, { itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }];
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const removePoItem = (index) => {
    if (poForm.items.length > 1) {
      setPoForm(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const newForm = { ...prev, items: newItems };
        return { ...newForm, ...calculatePoTotals(newForm) };
      });
    }
  };
  const handlePoTaxChange = (index, field, value) => {
    setPoForm(prev => {
      const newTaxes = [...prev.taxes];
      newTaxes[index][field] = value;
      const newForm = { ...prev, taxes: newTaxes };
      return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const addPoTax = () => {
    setPoForm(prev => {
      const newTaxes = [...prev.taxes, { tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }];
      const newForm = { ...prev, taxes: newTaxes };
      return { ...newForm, ...calculatePoTotals(newForm) };
    });
  };
  const removePoTax = (index) => {
    if (poForm.taxes.length > 1) {
      setPoForm(prev => {
        const newTaxes = prev.taxes.filter((_, i) => i !== index);
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePoTotals(newForm) };
      });
    }
  };
  const calculatePrTotals = (form) => {
    let subtotal = 0;
    let totalQuantity = 0;
    let exciseDuty = 0;
    let totalQtyInCommon = 0;
    let commonUOM = '';
    let allSameUOM = true;
        const newItems = form.items.map(item => {
      const qty = Number(item.acceptedQuantity || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      totalQuantity += qty;
      
      const selItem = items.find(i => i._id === item.itemId);
      if (selItem && selItem.excise_applicable) {
         exciseDuty += (amount * (Number(selItem.excise_rate) || 0)) / 100;
      }
      return { ...item, amount };
    });
    if (form.items.length > 0) {
      const firstItemData = items.find(i => i._id === form.items[0].itemId);
      if (firstItemData) {
        const firstUom = form.items[0].unit;
        commonUOM = firstUom === 'master' ? firstItemData.masterUnit : firstUom === 'outer' ? firstItemData.outerUnit : firstUom === 'nos' ? firstItemData.nosUnit : 'Grams';
        allSameUOM = form.items.every(it => it.unit === firstUom);
        if (allSameUOM) {
          totalQtyInCommon = form.items.reduce((sum, it) => sum + Number(it.acceptedQuantity || 0), 0);
        } else {
          commonUOM = firstItemData.masterUnit || 'Carton';
          totalQtyInCommon = 0;
          form.items.forEach(it => {
            const selItem = items.find(i => i._id === it.itemId);
            if (selItem) {
              let qty = Number(it.acceptedQuantity || 0);
              if (it.unit === 'master') {
                totalQtyInCommon += qty;
              } else if (it.unit === 'outer') {
                totalQtyInCommon += qty / (selItem.masterToOuter || 1);
              } else if (it.unit === 'nos') {
                totalQtyInCommon += qty / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
              } else if (it.unit === 'grams') {
                if (selItem.grams > 0) {
                  const nos = qty / selItem.grams;
                  totalQtyInCommon += nos / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
                }
              }
            }
          });
        }
      }
    }
        let taxableAmount = subtotal + exciseDuty;
    let totalTaxes = 0;
    const newTaxes = form.taxes.map(tax => {
      const amount = (taxableAmount * Number(tax.taxRate || 0)) / 100;
      totalTaxes += amount;
      return { ...tax, amount, total: taxableAmount + totalTaxes };
    });
    const grandTotal = taxableAmount + totalTaxes;
    return { items: newItems, taxes: newTaxes, subtotal, totalTaxes, grandTotal, totalQtyInCommon, commonUOM };
  };
  const handlePrFormChange = (field, value) => {
    setPrForm(prev => {
      const newForm = { ...prev, [field]: value };
      return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };

  const toggleCompanyDropdownForPr = (e) => {
    if (e) e.stopPropagation();
    setPrForm(prev => ({ ...prev, isCompanyDropdownOpen: !prev.isCompanyDropdownOpen, isBranchDropdownOpen: false }));
  };

  const handleCompanyChangeForPr = (comp) => {
    setPrForm(prev => {
      const current = prev.company || [];
      const newCompanies = current.includes(comp)
        ? current.filter(c => c !== comp)
        : [...current, comp];
      return { ...prev, company: newCompanies };
    });
  };

  const toggleBranchDropdownForPr = (e) => {
    if (e) e.stopPropagation();
    setPrForm(prev => ({ ...prev, isBranchDropdownOpen: !prev.isBranchDropdownOpen, isCompanyDropdownOpen: false }));
  };

  const handleBranchChangeForPr = (branch) => {
    setPrForm(prev => {
      let current = [...(prev.branch_name || [])];
      if (branch === 'all') {
        current = current.length === availableBranches.length ? [] : [...availableBranches];
      } else {
        current = current.includes(branch)
          ? current.filter(b => b !== branch)
          : [...current, branch];
      }
      return { ...prev, branch_name: current };
    });
  };

  const handlePrItemChange = (index, field, value) => {
    if (field === 'itemId' && value === 'create_new') {
      setCreatingItemForPr({ rowIndex: index });
      setActiveTab('item');
      return;
    }
    setPrForm(prev => {
      const newItems = [...prev.items];
      if (field === 'acceptedQuantity' || field === 'rejectedQuantity') {
        const original = newItems[index].originalQuantity || 0;
        let newAccepted = field === 'acceptedQuantity' ? Number(value) : newItems[index].acceptedQuantity;
        let newRejected = field === 'rejectedQuantity' ? Number(value) : newItems[index].rejectedQuantity;
        if (field === 'acceptedQuantity') {
          newRejected = original - newAccepted;
        } else {
          newAccepted = original - newRejected;
        }
        newItems[index].acceptedQuantity = Math.max(0, newAccepted);
        newItems[index].rejectedQuantity = Math.max(0, newRejected);
      } else {
        newItems[index][field] = value;
      }
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const addPrItem = () => {
    setPrForm(prev => {
      const newItems = [...prev.items, { itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }];
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const removePrItem = (index) => {
    if (prForm.items.length > 1) {
      setPrForm(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const newForm = { ...prev, items: newItems };
        return { ...newForm, ...calculatePrTotals(newForm) };
      });
    }
  };
  const handlePrTaxChange = (index, field, value) => {
    setPrForm(prev => {
      const newTaxes = [...prev.taxes];
      newTaxes[index][field] = value;
      const newForm = { ...prev, taxes: newTaxes };
      return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const addPrTax = () => {
    setPrForm(prev => {
      const newTaxes = [...prev.taxes, { tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }];
      const newForm = { ...prev, taxes: newTaxes };
      return { ...newForm, ...calculatePrTotals(newForm) };
    });
  };
  const removePrTax = (index) => {
    if (prForm.taxes.length > 1) {
      setPrForm(prev => {
        const newTaxes = prev.taxes.filter((_, i) => i !== index);
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePrTotals(newForm) };
      });
    }
  };
  const calculatePiTotals = (form) => {
    let subtotal = 0;
    let exciseDuty = 0;
    let totalQuantity = 0;
    let totalQtyInCommon = 0;
    let commonUOM = '';
    let allSameUOM = true;
        const newItems = form.items.map(item => {
      const qty = Number(item.acceptedQuantity || 0);
      const rate = Number(item.rate || 0);
      const amount = qty * rate;
      subtotal += amount;
      totalQuantity += qty;
      
      const selItem = items.find(i => i._id === item.itemId);
      if (selItem && selItem.excise_applicable) {
         exciseDuty += (amount * (Number(selItem.excise_rate) || 0)) / 100;
      }
      return { ...item, amount };
    });
    if (form.items.length > 0) {
      const firstItemData = items.find(i => i._id === form.items[0].itemId);
      if (firstItemData) {
        const firstUom = form.items[0].unit;
        commonUOM = firstUom === 'master' ? firstItemData.masterUnit : firstUom === 'outer' ? firstItemData.outerUnit : firstUom === 'nos' ? firstItemData.nosUnit : 'Grams';
        allSameUOM = form.items.every(it => it.unit === firstUom);
        if (allSameUOM) {
          totalQtyInCommon = form.items.reduce((sum, it) => sum + (form.isDirectPurchase ? Number(it.quantity || 0) : Number(it.acceptedQuantity || 0)), 0);
        } else {
          commonUOM = firstItemData.masterUnit || 'Carton';
          totalQtyInCommon = 0;
          form.items.forEach(it => {
            const selItem = items.find(i => i._id === it.itemId);
            if (selItem) {
              let qty = form.isDirectPurchase ? Number(it.quantity || 0) : Number(it.acceptedQuantity || 0);
              if (it.unit === 'master') {
                totalQtyInCommon += qty;
              } else if (it.unit === 'outer') {
                totalQtyInCommon += qty / (selItem.masterToOuter || 1);
              } else if (it.unit === 'nos') {
                totalQtyInCommon += qty / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
              } else if (it.unit === 'grams') {
                if (selItem.grams > 0) {
                  const nos = qty / selItem.grams;
                  totalQtyInCommon += nos / ((selItem.masterToOuter || 1) * (selItem.outerToNos || 1));
                }
              }
            }
          });
        }
      }
    }
    let taxableAmount = subtotal + exciseDuty;
    let totalTaxes = 0;
    const newTaxes = form.taxes.map(tax => {
      const amount = (taxableAmount * Number(tax.taxRate || 0)) / 100;
      totalTaxes += amount;
      return { ...tax, amount, total: taxableAmount + totalTaxes };
    });
    const grandTotal = taxableAmount + totalTaxes;
    return { items: newItems, taxes: newTaxes, subtotal, exciseDuty, taxableAmount, totalQuantity, totalTaxes, taxesAdded: totalTaxes, grandTotal, totalQtyInCommon, commonUOM };
  };
  const handlePiFormChange = (field, value) => {
    setPiForm(prev => {
      const newForm = { ...prev, [field]: value };
      return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };

  const toggleCompanyDropdownForPi = (e) => {
    if (e) e.stopPropagation();
    setPiForm(prev => ({ ...prev, isCompanyDropdownOpen: !prev.isCompanyDropdownOpen, isBranchDropdownOpen: false }));
  };

  const handleCompanyChangeForPi = (comp) => {
    setPiForm(prev => {
      const current = prev.company || [];
      const newCompanies = current.includes(comp)
        ? current.filter(c => c !== comp)
        : [...current, comp];
      return { ...prev, company: newCompanies };
    });
  };

  const toggleBranchDropdownForPi = (e) => {
    if (e) e.stopPropagation();
    setPiForm(prev => ({ ...prev, isBranchDropdownOpen: !prev.isBranchDropdownOpen, isCompanyDropdownOpen: false }));
  };

  const handleBranchChangeForPi = (branch) => {
    setPiForm(prev => {
      let current = [...(prev.branch_name || [])];
      if (branch === 'all') {
        current = current.length === availableBranches.length ? [] : [...availableBranches];
      } else {
        current = current.includes(branch)
          ? current.filter(b => b !== branch)
          : [...current, branch];
      }
      return { ...prev, branch_name: current };
    });
  };

  const handlePiItemChange = (index, field, value) => {
    if (field === 'itemId' && value === 'create_new') {
      setCreatingItemForPi({ rowIndex: index });
      setActiveTab('item');
      return;
    }
    setPiForm(prev => {
      const newItems = [...prev.items];
      newItems[index][field] = value;
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const addPiItem = () => {
    setPiForm(prev => {
      const newItems = [...prev.items, { itemId: '', acceptedQuantity: 0, quantity: 0, rate: '', amount: 0, unit: '' }];
      const newForm = { ...prev, items: newItems };
      return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const removePiItem = (index) => {
    if (piForm.items.length > 1) {
      setPiForm(prev => {
        const newItems = prev.items.filter((_, i) => i !== index);
        const newForm = { ...prev, items: newItems };
        return { ...newForm, ...calculatePiTotals(newForm) };
      });
    }
  };
  const handlePiTaxChange = (index, field, value) => {
    setPiForm(prev => {
      const newTaxes = [...prev.taxes];
      newTaxes[index][field] = value;
      const newForm = { ...prev, taxes: newTaxes };
      return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const addPiTax = () => {
    setPiForm(prev => {
      const newTaxes = [...prev.taxes, { tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }];
      const newForm = { ...prev, taxes: newTaxes };
      return { ...newForm, ...calculatePiTotals(newForm) };
    });
  };
  const removePiTax = (index) => {
    if (piForm.taxes.length > 1) {
      setPiForm(prev => {
        const newTaxes = prev.taxes.filter((_, i) => i !== index);
        const newForm = { ...prev, taxes: newTaxes };
        return { ...newForm, ...calculatePiTotals(newForm) };
      });
    }
  };
  const validateForm = (form, type) => {
    if (type === 'supplier') {
      return null;
    } else if (type === 'po') {
      if (!form.series) return 'Series is required';
      if (!form.date) return 'Date is required';
      if (isGroupAdmin && (!form.company || form.company.length === 0)) return 'Company is required';
      if (!form.supplierId) return 'Supplier is required';
      for (const [index, item] of form.items.entries()) {
        if (isFieldMandatory('Purchase Order Item', 'item_code') && !item.itemId) return `In item ${index + 1}: Item must be selected`;
        if (isFieldMandatory('Purchase Order Item', 'quantity') && (!item.quantity || Number(item.quantity) <= 0)) return `In item ${index + 1}: Quantity must be positive`;
        if (isFieldMandatory('Purchase Order Item', 'rate') && (item.rate && Number(item.rate) < 0)) return `In item ${index + 1}: Rate cannot be negative`;
      }
      for (const [index, tax] of form.taxes.entries()) {
        if (isFieldMandatory('Purchase Taxes and Charges', 'type') && !tax.type) return `In tax ${index + 1}: Type must be selected`;
        if (isFieldMandatory('Purchase Taxes and Charges', 'taxRate') && (tax.taxRate === '' || Number(tax.taxRate) < 0)) return `In tax ${index + 1}: Tax rate must be non-negative`;
      }
    } else if (type === 'pr') {
      if (!form.series) return 'Series is required';
      if (!form.date) return 'Date is required';
      if (isGroupAdmin && (!form.company || form.company.length === 0)) return 'Company is required';
      if (!form.poId) return 'Purchase Order is required';
      for (const [index, item] of form.items.entries()) {
        if (isFieldMandatory('Purchase Order Item', 'item_code') && !item.itemId) return `In item ${index + 1}: Item must be selected`;
        if (isFieldMandatory('Purchase Receipt Item', 'quantity') && (item.acceptedQuantity === '' || Number(item.acceptedQuantity) < 0)) return `In item ${index + 1}: Accepted Quantity must be non-negative`;
        if (isFieldMandatory('Purchase Receipt Item', 'rejected_quantity') && (item.rejectedQuantity === '' || Number(item.rejectedQuantity) < 0)) return `In item ${index + 1}: Rejected Quantity must be non-negative`;
        if (isFieldMandatory('Purchase Order Item', 'rate') && (item.rate && Number(item.rate) < 0)) return `In item ${index + 1}: Rate cannot be negative`;
      }
      for (const [index, tax] of form.taxes.entries()) {
        if (isFieldMandatory('Purchase Taxes and Charges', 'type') && !tax.type) return `In tax ${index + 1}: Type must be selected`;
        if (isFieldMandatory('Purchase Taxes and Charges', 'taxRate') && (tax.taxRate === '' || Number(tax.taxRate) < 0)) return `In tax ${index + 1}: Tax rate must be non-negative`;
      }
    } else if (type === 'pi') {
      if (!form.series) return 'Series is required';
      if (!form.date) return 'Date is required';
      if (isGroupAdmin && !form.company) return 'Company is required';

      if (!form.isDirectPurchase && !form.prId) return 'Purchase Receipt is required';
      if (form.isDirectPurchase && !form.supplierId) return 'Supplier is required';

      for (const [index, item] of form.items.entries()) {
        if (isFieldMandatory('Purchase Order Item', 'item_code') && !item.itemId) return `In item ${index + 1}: Item must be selected`;

        const qty = form.isDirectPurchase ? item.quantity : item.acceptedQuantity;
        if (!qty || Number(qty) <= 0) return `In item ${index + 1}: Quantity must be positive`;

        if (isFieldMandatory('Purchase Order Item', 'rate') && (item.rate && Number(item.rate) < 0)) return `In item ${index + 1}: Rate cannot be negative`;
      }
      for (const [index, tax] of form.taxes.entries()) {
        if (isFieldMandatory('Purchase Taxes and Charges', 'type') && !tax.type) return `In tax ${index + 1}: Type must be selected`;
        if (isFieldMandatory('Purchase Taxes and Charges', 'taxRate') && (tax.taxRate === '' || Number(tax.taxRate) < 0)) return `In tax ${index + 1}: Tax rate must be non-negative`;
      }
    }
    return null;
  };
  const handlePoSave = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to save purchase orders.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(poForm, 'po');
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    const formWithStatus = { 
      ...poForm, 
      status: 'Draft', 
      targetWarehouse: 'Default',
      company: Array.isArray(poForm.company) ? poForm.company.join(',') : poForm.company,
      branch_name: Array.isArray(poForm.branch_name) ? poForm.branch_name.join(',') : poForm.branch_name
    };
    try {
      let response;
      if (editingPoId) {
        response = await fetch(`${API_URL}/api/purchase_orders/${editingPoId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      } else {
        response = await fetch(`${API_URL}/api/purchase_orders`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      }
      if (response.ok) {
        const savedData = await response.json().catch(() => ({}));
        const savedId = savedData._id || savedData.id || editingPoId;
        if (savedId && !editingPoId) setEditingPoId(savedId);
        setPoForm(prev => ({ ...prev, status: 'Draft' }));
        setMessage('Purchase Order draft saved');
      } else {
        const errData = await response.json();
        console.error("[Purchase] Draft Save Error:", errData);
        setError(errData.error || 'Failed to save purchase order');
      }
    } catch (err) {
      console.error("[Purchase] Draft Save Request Error:", err);
      setError('Failed to save purchase order');
    }
    setLoading(false);
  };
  const handlePoSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to submit purchase orders.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(poForm, 'po');
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    const formWithStatus = { 
      ...poForm, 
      status: 'Submitted', 
      targetWarehouse: 'Default',
      company: Array.isArray(poForm.company) ? poForm.company.join(',') : poForm.company,
      branch_name: Array.isArray(poForm.branch_name) ? poForm.branch_name.join(',') : poForm.branch_name
    };
    try {
      let response;
      if (editingPoId) {
        response = await fetch(`${API_URL}/api/purchase_orders/${editingPoId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      } else {
        response = await fetch(`${API_URL}/api/purchase_orders`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      }
      if (response.ok) {
        const updatedOrders = await fetchPurchaseOrders();
        // Calculate next series immediately
        const prefix = 'PO';
        const matchingPos = updatedOrders.filter(po => po.series && po.series.startsWith(prefix));
        let nextSeries = prefix + '0001';
        if (matchingPos.length > 0) {
          const numbers = matchingPos.map(po => parseInt(po.series.slice(prefix.length), 10));
          const max = Math.max(...numbers);
          nextSeries = prefix + (max + 1).toString().padStart(4, '0');
        }

        setEditingPoId(null);
        setPoForm({
          series: nextSeries, date: new Date().toISOString().slice(0, 10), company: getFormCompany(), supplierId: '', supplierCode: '',
          supplierGroup: '', address: '', phone: '', email: '', currency: '', items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }], taxes: [{ tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }], subtotal: 0, totalQuantity: 0, totalTaxes: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: ''
        });
        setCurrentPoSupplier(null);
        setMessage('Purchase Order submitted successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit purchase order');
      }
    } catch (err) {
      setError('Failed to submit purchase order');
    }
    setLoading(false);
  };
  const submitPo = async (id) => {
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/purchase_orders/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'Submitted' })
      });
      if (response.ok) {
        await fetchPurchaseOrders();
        setMessage('Purchase Order submitted successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit purchase order');
      }
    } catch (err) {
      setError('Failed to submit purchase order');
    }
    setLoading(false);
  };
  const editPo = (id) => {
    const po = purchaseOrders.find(p => p._id === id);
    if (po) {
      const form = { ...po, date: po.date.slice(0, 10), grandTotal: po.grandTotal || po.subtotal };
      const totals = calculatePoTotals(form);
      setPoForm({ ...form, ...totals });
      setCurrentPoSupplier(suppliers.find(s => s._id === po.supplierId));
      setEditingPoId(id);
      setActiveTab('order');
    }
  };
  const handlePrSave = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to save purchase receipts.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(prForm, 'pr');
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    const formWithStatus = { 
      ...prForm, 
      status: 'Draft',
      company: Array.isArray(prForm.company) ? prForm.company.join(',') : prForm.company,
      branch_name: Array.isArray(prForm.branch_name) ? prForm.branch_name.join(',') : prForm.branch_name
    };
    try {
      let response;
      if (editingPrId) {
        response = await fetch(`${API_URL}/api/purchase_receipts/${editingPrId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      } else {
        response = await fetch(`${API_URL}/api/purchase_receipts`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      }
      if (response.ok) {
        const savedData = await response.json().catch(() => ({}));
        const savedId = savedData.series || editingPrId;
        if (savedId && !editingPrId) setEditingPrId(savedId);
        setPrForm(prev => ({ ...prev, status: 'Draft' }));
        setMessage('Purchase Receipt draft saved');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save purchase receipt');
      }
    } catch (err) {
      setError('Failed to save purchase receipt');
    }
    setLoading(false);
  };
  const handlePrSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to submit purchase receipts.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(prForm, 'pr');
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    const formWithStatus = { 
      ...prForm, 
      status: 'Submitted',
      company: Array.isArray(prForm.company) ? prForm.company.join(',') : prForm.company,
      branch_name: Array.isArray(prForm.branch_name) ? prForm.branch_name.join(',') : prForm.branch_name
    };
    try {
      let response;
      if (editingPrId) {
        response = await fetch(`${API_URL}/api/purchase_receipts/${editingPrId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      } else {
        response = await fetch(`${API_URL}/api/purchase_receipts`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      }
      if (response.ok) {
        const updatedReceipts = await fetchPurchaseReceipts();
        await fetchItems();

        // Calculate next series immediately
        const prefix = 'PR';
        const matchingPrs = updatedReceipts.filter(pr => pr.series && pr.series.startsWith(prefix));
        let nextSeries = prefix + '0001';
        if (matchingPrs.length > 0) {
          const numbers = matchingPrs.map(pr => parseInt(pr.series.slice(prefix.length), 10));
          const max = Math.max(...numbers);
          nextSeries = prefix + (max + 1).toString().padStart(4, '0');
        }

        setEditingPrId(null);
        setPrForm({
          series: nextSeries, date: new Date().toISOString().slice(0, 10), company: getFormCompany(), poId: '', supplierId: '', supplierCode: '',
          supplierGroup: '', address: '', phone: '', email: '', currency: '', items: [{ itemId: '', originalQuantity: 0, acceptedQuantity: '', rejectedQuantity: '', rate: '', amount: 0, unit: 'master' }], taxes: [{ tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }], subtotal: 0, totalTaxes: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: ''
        });
        setCurrentPrSupplier(null);
        setMessage('Purchase Receipt submitted successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit purchase receipt');
      }
    } catch (err) {
      setError('Failed to submit purchase receipt');
    }
    setLoading(false);
  };
  const submitPr = async (series) => {
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/purchase_receipts/${series}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'Submitted' })
      });
      if (response.ok) {
        await fetchPurchaseReceipts();
        await fetchItems();
        setMessage('Purchase Receipt submitted successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit purchase receipt');
      }
    } catch (err) {
      setError('Failed to submit purchase receipt');
    }
    setLoading(false);
  };
  const editPr = (series) => {
    const pr = purchaseReceipts.find(p => p.series === series);
    if (pr) {
      const form = {
        ...pr,
        date: pr.date.slice(0, 10),
        items: pr.items.map(item => ({ ...item, originalQuantity: item.acceptedQuantity + item.rejectedQuantity }))
      };
      const totals = calculatePrTotals(form);
      setPrForm({ ...form, ...totals });
      setCurrentPrSupplier(suppliers.find(s => s._id === pr.supplierId));
      setEditingPrId(pr.series);
      setActiveTab('receipt');
    }
  };
  const handlePiSave = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to save purchase invoices.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(piForm, 'pi');
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    const formWithStatus = { 
      ...piForm, 
      status: 'Draft',
      company: Array.isArray(piForm.company) ? piForm.company.join(',') : piForm.company,
      branch_name: Array.isArray(piForm.branch_name) ? piForm.branch_name.join(',') : piForm.branch_name
    };
    try {
      let response;
      if (editingPiId) {
        response = await fetch(`${API_URL}/api/purchase_invoices/${editingPiId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      } else {
        response = await fetch(`${API_URL}/api/purchase_invoices`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      }
      if (response.ok) {
        const savedData = await response.json().catch(() => ({}));
        const savedId = savedData.series || editingPiId;
        if (savedId && !editingPiId) setEditingPiId(savedId);
        setPiForm(prev => ({ ...prev, status: 'Draft' }));
        setMessage('Purchase Invoice draft saved');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save purchase invoice');
      }
    } catch (err) {
      setError('Failed to save purchase invoice');
    }
    setLoading(false);
  };
  const handlePiSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) {
      setPermModalMsg("You do not have permission to submit purchase invoices.");
      setShowPermModal(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setError(null);
    const validationError = validateForm(piForm, 'pi');
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    const formWithStatus = { 
      ...piForm, 
      status: 'Submitted',
      company: Array.isArray(piForm.company) ? piForm.company.join(',') : piForm.company,
      branch_name: Array.isArray(piForm.branch_name) ? piForm.branch_name.join(',') : piForm.branch_name
    };
    try {
      let response;
      if (editingPiId) {
        response = await fetch(`${API_URL}/api/purchase_invoices/${editingPiId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      } else {
        response = await fetch(`${API_URL}/api/purchase_invoices`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formWithStatus)
        });
      }
      if (response.ok) {
        await fetchPurchaseInvoices();
        await fetchSuppliers();
        setEditingPiId(null);
        setPiForm({
          isDirectPurchase: piForm.isDirectPurchase, // NEW: Preserve Direct Purchase mode
          series: '', date: new Date().toISOString().slice(0, 10), company: getFormCompany(),
          supplierId: '', supplierCode: '',
          supplierGroup: '', address: '', phone: '', email: '',
          poId: '', prId: '', currency: '',
          items: [{ itemId: '', acceptedQuantity: 0, quantity: 0, rate: '', amount: 0, unit: '' }],
          taxes: [{ tax_template: '', tax_type: '', taxRate: 0, amount: 0, total: 0 }],
          totalQuantity: 0, subtotal: 0, taxesAdded: 0, grandTotal: 0, totalQtyInCommon: 0, commonUOM: ''
        });
        setCurrentPiSupplier(null);
        setMessage('Purchase Invoice submitted successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit purchase invoice');
      }
    } catch (err) {
      setError('Failed to submit purchase invoice');
    }
    setLoading(false);
  };
  const submitPi = async (series) => {
    setLoading(true);
    setMessage('');
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/purchase_invoices/${series}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'Submitted' })
      });
      if (response.ok) {
        await fetchPurchaseInvoices();
        await fetchSuppliers();
        setMessage('Purchase Invoice submitted successfully');
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to submit purchase invoice');
      }
    } catch (err) {
      setError('Failed to submit purchase invoice');
    }
    setLoading(false);
  };
  const editPi = (series) => {
    const pi = purchaseInvoices.find(p => p.series === series);
    if (pi) {
      const form = { ...pi, date: pi.date.slice(0, 10) };
      const totals = calculatePiTotals(form);
      setPiForm({ ...form, ...totals });
      setCurrentPiSupplier(suppliers.find(s => s._id === pi.supplierId));
      setEditingPiId(series);
      setActiveTab('invoice');
    }
  };
  const deletePo = (id) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete purchase orders.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this purchase order?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/purchase_orders/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchPurchaseOrders();
          setMessage('Purchase Order deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete purchase order');
        }
      } catch (err) {
        setError('Failed to delete purchase order');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const deletePr = (series) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete purchase receipts.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this purchase receipt?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/purchase_receipts/${series}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchPurchaseReceipts();
          await fetchItems();
          setMessage('Purchase Receipt deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete purchase receipt');
        }
      } catch (err) {
        setError('Failed to delete purchase receipt');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const deletePi = (series) => {
    if (!canDelete) {
      setPermModalMsg("You do not have permission to delete purchase invoices.");
      setShowPermModal(true);
      return;
    }
    setShowWarning('Are you sure you want to delete this purchase invoice?');
    setWarningAction(() => async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/purchase_invoices/${series}`, { method: 'DELETE', headers: getHeaders() });
        if (response.ok) {
          await fetchPurchaseInvoices();
          await fetchSuppliers();
          setMessage('Purchase Invoice deleted successfully');
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to delete purchase invoice');
        }
      } catch (err) {
        setError('Failed to delete purchase invoice');
      }
      setLoading(false);
      setShowWarning(null);
      setWarningAction(null);
    });
  };
  const handlePrintRow = (type, data) => {
    let htmlContent;
    if (type === 'po') htmlContent = generatePoHtml(data);
    else if (type === 'pr') htmlContent = generatePrHtml(data);
    else if (type === 'pi') htmlContent = generatePiHtml(data);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };
  const handlePrintTable = (type) => {
    let data;
    let title;
    let headers = [];
    let rows = [];
    let currency = 'USD'; // Default
    if (type === 'po') {
      data = filteredPurchaseOrdersReport;
      title = 'Purchase Orders Report';
      headers = ['PO Number', 'Date', 'Supplier Name', 'Items', 'Total Amount', 'Taxes', 'Grand Total', 'Status'];
      rows = data.map(po => {
        const totalAmount = po.grandTotal || 0;
        const taxes = po.totalTaxes || 0;
        const subtotal = po.subtotal || (totalAmount - taxes);
        return [
          po.series,
          new Date(po.date).toLocaleDateString(),
          po.name,
          po.items.map(item => renderItemQuantity(item, 'po')).join(', '),
          `${po.currency} ${subtotal.toFixed(2)}`,
          `${po.currency} ${taxes.toFixed(2)}`,
          `${po.currency} ${totalAmount.toFixed(2)}`,
          po.status
        ];
      });
      currency = data[0]?.currency || currency;
    } else if (type === 'pr') {
      data = filteredPurchaseReceiptsReport;
      title = 'Purchase Receipts Report';
      headers = ['PR Number', 'PO Reference', 'Date', 'Supplier Name', 'Items', 'Total Amount', 'Taxes', 'Grand Total', 'Status'];
      rows = data.map(pr => {
        const totalAmount = pr.grandTotal || 0;
        const taxes = pr.totalTaxes || 0;
        const subtotal = pr.subtotal || (totalAmount - taxes);
        return [
          pr.series,
          pr.poId,
          new Date(pr.date).toLocaleDateString(),
          pr.name,
          pr.items.map(item => renderItemQuantity(item, 'pr')).join(', '),
          `${pr.currency} ${subtotal.toFixed(2)}`,
          `${pr.currency} ${taxes.toFixed(2)}`,
          `${pr.currency} ${totalAmount.toFixed(2)}`,
          pr.status
        ];
      });
      currency = data[0]?.currency || currency;
    } else if (type === 'pi') {
      data = filteredPurchaseInvoicesReport;
      title = 'Purchase Invoices Report';
      headers = ['PI Number', 'Date', 'Supplier Name', 'PO Reference', 'PR Reference', 'Total Amount', 'Taxes', 'Grand Total', 'Status'];
      rows = data.map(pi => {
        const totalAmount = pi.grandTotal || 0;
        const taxes = pi.taxesAdded || pi.totalTaxes || 0;
        const subtotal = pi.subtotal || (totalAmount - taxes);
        return [
          pi.series,
          new Date(pi.date).toLocaleDateString(),
          pi.name,
          pi.poId,
          pi.prId,
          `${pi.currency} ${subtotal.toFixed(2)}`,
          `${pi.currency} ${taxes.toFixed(2)}`,
          `${pi.currency} ${totalAmount.toFixed(2)}`,
          pi.status
        ];
      });
      currency = data[0]?.currency || currency;
    } else if (type === 'supplier') {
      data = filteredSuppliersReport;
      title = 'Suppliers Report';
      headers = ['Code', 'Company Name', 'Group', 'Country', 'Currency', 'Tax ID', 'Contacts', 'Last Purchase Date'];
      rows = data.map(s => [
        s.code,
        s.company,

        s.group,
        s.country,
        s.currency,
        s.taxId,
        Array.isArray(s.contacts) ? s.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : '',
        s.lastPurchaseDate ? new Date(s.lastPurchaseDate).toLocaleDateString() : '-'
      ]);
    }
    const htmlContent = generateReportHtml(title, headers, rows, currency, type);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };
  const generateReportHtml = (title, headers, rows, currency, type) => {
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const bodyRows = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    let totalRow = '';
    if (type !== 'supplier') {
      const totalAmountIndex = headers.indexOf('Grand Total');
      if (totalAmountIndex !== -1) {
        const grandTotal = rows.reduce((sum, row) => {
          const amountString = row[totalAmountIndex] || '';
          const numericString = amountString.replace(/[^0-9.-]+/g, "");
          const numericValue = parseFloat(numericString);
          return sum + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
        totalRow = `
                <tfoot>
                    <tr>
                        <td colspan="${totalAmountIndex}" style="text-align: right; font-weight: bold;">Grand Total</td>
                        <td style="font-weight: bold;">${currency} ${grandTotal.toFixed(2)}</td>
                        <td colspan="${headers.length - totalAmountIndex - 1}"></td>
                    </tr>
                </tfoot>
            `;
      }
    } else {
      totalRow = '<tfoot></tfoot>';
    }
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tfoot tr td { border: none; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <table>
                <thead><tr>${headerRow}</tr></thead>
                <tbody>${bodyRows}</tbody>
                ${totalRow}
            </table>
        </body>
        </html>
    `;
  };
  const handleExportCSV = (type) => {
    let data;
    let filename;
    let headers = [];
    if (type === 'po') {
      data = filteredPurchaseOrdersReport;
      filename = 'purchase_orders.csv';
      headers = ['PO Number', 'Date', 'Supplier Name', 'Items', 'Subtotal', 'Taxes', 'Grand Total', 'Status'];
      data = data.map(po => {
        const totalAmount = po.grandTotal || 0;
        const taxes = po.totalTaxes || 0;
        const subtotal = po.subtotal || (totalAmount - taxes);
        return [
          po.series,
          new Date(po.date).toLocaleDateString(),
          po.name,
          po.items.map(item => renderItemQuantity(item, 'po')).join('; '),
          `${po.currency} ${subtotal.toFixed(2)}`,
          `${po.currency} ${taxes.toFixed(2)}`,
          `${po.currency} ${totalAmount.toFixed(2)}`,
          po.status
        ];
      });
    } else if (type === 'pr') {
      data = filteredPurchaseReceiptsReport;
      filename = 'purchase_receipts.csv';
      headers = ['PR Number', 'PO Reference', 'Date', 'Supplier Name', 'Items', 'Subtotal', 'Taxes', 'Grand Total', 'Status'];
      data = data.map(pr => {
        const totalAmount = pr.grandTotal || 0;
        const taxes = pr.totalTaxes || 0;
        const subtotal = pr.subtotal || (totalAmount - taxes);
        return [
          pr.series,
          pr.poId,
          new Date(pr.date).toLocaleDateString(),
          pr.name,
          pr.items.map(item => renderItemQuantity(item, 'pr')).join('; '),
          `${pr.currency} ${subtotal.toFixed(2)}`,
          `${pr.currency} ${taxes.toFixed(2)}`,
          `${pr.currency} ${totalAmount.toFixed(2)}`,
          pr.status
        ];
      });
    } else if (type === 'pi') {
      data = filteredPurchaseInvoicesReport;
      filename = 'purchase_invoices.csv';
      headers = ['PI Number', 'Date', 'Supplier Name', 'PO Reference', 'PR Reference', 'Subtotal', 'Taxes', 'Grand Total', 'Status'];
      data = data.map(pi => {
        const totalAmount = pi.grandTotal || 0;
        const taxes = pi.taxesAdded || pi.totalTaxes || 0;
        const subtotal = pi.subtotal || (totalAmount - taxes);
        return [
          pi.series,
          new Date(pi.date).toLocaleDateString(),
          pi.name,
          pi.poId,
          pi.prId,
          `${pi.currency} ${subtotal.toFixed(2)}`,
          `${pi.currency} ${taxes.toFixed(2)}`,
          `${pi.currency} ${totalAmount.toFixed(2)}`,
          pi.status
        ];
      });
    } else if (type === 'supplier') {
      data = filteredSuppliersReport;
      filename = 'suppliers.csv';
      headers = ['Code', 'Company Name', 'Group', 'Country', 'Currency', 'Tax ID', 'Contacts', 'Last Purchase Date'];
      data = data.map(s => [
        s.code,
        s.company,

        s.group,
        s.country,
        s.currency,
        s.taxId,
        Array.isArray(s.contacts) ? s.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : '',
        s.lastPurchaseDate ? new Date(s.lastPurchaseDate).toLocaleDateString() : '-'
      ]);
    }
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };
  // Helper function to convert number to words
  const toWords = (num) => {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty ', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };
  const generatePoHtml = (po) => {
    const supplier = suppliers.find(s => s._id === po.supplierId) || {};
    const supplierContact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : {};
    const itemRows = po.items.map((item, index) => {
      const itemData = items.find(i => i._id === item.itemId) || { name: 'Unknown', masterUnit: 'Master', outerUnit: 'Outer', nosUnit: 'Nos' };
      const amount = Number(item.quantity) * Number(item.rate);
      const taxRate = (po.taxes && po.taxes.length > 0) ? Number(po.taxes[0].taxRate || 0) : 0;
      const taxAmount = (amount * taxRate) / 100;
      const uomDisplay = item.uom === 'master' ? itemData.masterUnit : item.uom === 'outer' ? itemData.outerUnit : item.uom === 'nos' ? itemData.nosUnit : 'Grams';
      return `
            <tr>
                <td>${index + 1}</td>
                <td>${(itemData.item_name || itemData.name || "")}</td>
                <td>${item.quantity}</td>
                <td>${uomDisplay}</td>
                <td>${po.currency} ${Number(item.rate).toFixed(2)}</td>
                <td>${po.currency} ${amount.toFixed(2)}</td>
                <td>${taxRate.toFixed(2)}%</td>
                <td>${po.currency} ${taxAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    const taxSummary = po.taxes.map(tax => {
      return `
            <tr>
                <td class="label"><strong>VAT ${tax.taxRate}% @ ${tax.taxRate}</strong></td>
                <td class="value">${po.currency} ${(tax.amount || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Order ${po.series || 'Undefined'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                .header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #000; font-weight: bold; }
                .header-right { text-align: right; }
                .header-right p { margin: 0; font-size: 16px; font-weight: bold; color: #000; }
                .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
                .details-left, .details-right { width: 48%; }
                .details-left p, .details-right p { margin: 5px 0; }
                .details-left .label, .details-right .label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; padding: 4px 8px; }
                .totals-table .label { font-weight: bold; text-align: left; }
                .totals-table .value { text-align: right; }
                .grand-total { border-top: 1px solid #ccc; font-weight: bold; }
                .in-words { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PURCHASE ORDER</h1>
                <div class="header-right"><p>${po.series || 'Undefined'}</p></div>
            </div>
            <div class="details-container">
                <div class="details-left">
                    <p><span class="label">Supplier Name:</span>${po.name || 'Undefined'}</p>
                    <p><span class="label">Supplier Company:</span>${po.supplierCompany || 'Undefined'}</p>
                    <p><span class="label">Address:</span>${(supplierContact.address || po.address || '').replace(/\n/g, '<br>')}</p>
                    <p><span class="label">Phone:</span>${supplierContact.phone || po.phone || ''}</p>
                </div>
                <div class="details-right">
                    <p><span class="label">Date:</span>${po.date ? new Date(po.date).toLocaleDateString('en-GB') : 'Undefined'}</p>
                    <p><span class="label">Company TRN:</span>${supplier.taxId || 'N/A'}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th><th>Item</th><th>Quantity</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Tax Rate</th><th>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td class="label">Total Quantity:</td><td class="value">${po.totalQuantity || 0}</td></tr>
                        <tr><td class="label">Total</td><td class="value">${po.currency} ${(po.subtotal || 0).toFixed(2)}</td></tr>
                        ${taxSummary}
                        <tr class="grand-total"><td class="label">Grand Total:</td><td class="value">${po.currency} ${(po.grandTotal || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="in-words"><p><strong>In Words:</strong> ${po.currency} ${toWords(Math.floor(po.grandTotal))} Only.</p></div>
        </body>
        </html>
    `;
  };
  const generatePrHtml = (pr) => {
    const supplier = suppliers.find(s => s._id === pr.supplierId) || {};
    const supplierContact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : {};
    const currency = pr.currency || 'INR'; // Default
    const taxRate = (pr.taxes && pr.taxes.length > 0) ? Number(pr.taxes[0].taxRate || 0) : 0;
    let totalAcceptedQuantity = 0;
    const itemRows = pr.items.map((item, index) => {
      const itemData = items.find(i => i._id === item.itemId) || { name: 'Unknown', masterUnit: 'Master', outerUnit: 'Outer', nosUnit: 'Nos' };
      const amount = Number(item.acceptedQuantity) * Number(item.rate);
      const itemTaxAmount = (amount * taxRate) / 100;
      totalAcceptedQuantity += Number(item.acceptedQuantity);
      const uomDisplay = item.unit === 'master' ? itemData.masterUnit : item.unit === 'outer' ? itemData.outerUnit : item.unit === 'nos' ? itemData.nosUnit : 'Grams';
      return `
            <tr>
                <td>${index + 1}</td>
                <td>${(itemData.item_name || itemData.name || "")}</td>
                <td>${item.acceptedQuantity}</td>
                <td>${item.rejectedQuantity}</td>
                <td>${uomDisplay}</td>
                <td>${currency} ${Number(item.rate).toFixed(2)}</td>
                <td>${currency} ${amount.toFixed(2)}</td>
                <td>${taxRate.toFixed(2)}%</td>
                <td>${currency} ${itemTaxAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    const taxSummary = pr.taxes.map(tax => {
      return `
            <tr>
                <td class="label"><strong>VAT ${tax.taxRate}% @ ${tax.taxRate}</strong></td>
                <td class="value">${currency} ${(tax.amount || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Receipt ${pr.series || 'Undefined'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                .header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #000; font-weight: bold; }
                .header-right { text-align: right; }
                .header-right p { margin: 0; font-size: 16px; font-weight: bold; color: #000; }
                .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
                .details-left, .details-right { width: 48%; }
                .details-left p, .details-right p { margin: 5px 0; }
                .details-left .label, .details-right .label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; padding: 4px 8px; }
                .totals-table .label { font-weight: bold; text-align: left; }
                .totals-table .value { text-align: right; }
                .grand-total { border-top: 1px solid #ccc; font-weight: bold; }
                .in-words { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PURCHASE RECEIPT</h1>
                <div class="header-right"><p>${pr.series || 'Undefined'}</p></div>
            </div>
            <div class="details-container">
                <div class="details-left">
                    <p><span class="label">Supplier Name:</span>${pr.name || 'Undefined'}</p>
                    <p><span class="label">Supplier Company:</span>${pr.supplierCompany || 'Undefined'}</p>
                    <p><span class="label">Address:</span>${(supplierContact.address || pr.address || '').replace(/\n/g, '<br>')}</p>
                    <p><span class="label">Phone:</span>${supplierContact.phone || pr.phone || ''}</p>
                </div>
                <div class="details-right">
                    <p><span class="label">Date:</span>${pr.date ? new Date(pr.date).toLocaleDateString('en-GB') : 'Undefined'}</p>
                    <p><span class="label">Company TRN:</span>${supplier.taxId || 'N/A'}</p>
                </div>
            </div>
            <p>PO Reference: ${pr.poId || 'Undefined'}</p>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th><th>Item</th><th>Accepted Quantity</th><th>Rejected Quantity</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Tax Rate</th><th>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td class="label">Total Quantity:</td><td class="value">${totalAcceptedQuantity}</td></tr>
                        <tr><td class="label">Total</td><td class="value">${currency} ${(pr.subtotal || 0).toFixed(2)}</td></tr>
                        ${taxSummary}
                        <tr class="grand-total"><td class="label">Grand Total:</td><td class="value">${currency} ${(pr.grandTotal || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="in-words"><p><strong>In Words:</strong> ${currency} ${toWords(Math.floor(pr.grandTotal))} Only.</p></div>
        </body>
        </html>
    `;
  };
  const generatePiHtml = (pi) => {
    const supplier = suppliers.find(s => s._id === pi.supplierId) || {};
    const supplierContact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : {};
    const currency = pi.currency || 'INR';
    const taxRate = (pi.taxes && pi.taxes.length > 0) ? Number(pi.taxes[0].taxRate || 0) : 0;
    const itemRows = pi.items.map((item, index) => {
      const itemData = items.find(i => i._id === item.itemId) || { name: 'Unknown', masterUnit: 'Master', outerUnit: 'Outer', nosUnit: 'Nos' };
      const amount = Number(item.acceptedQuantity) * Number(item.rate);
      const itemTaxAmount = (amount * taxRate) / 100;
      const uomDisplay = item.unit === 'master' ? itemData.masterUnit : item.unit === 'outer' ? itemData.outerUnit : item.unit === 'nos' ? itemData.nosUnit : 'Grams';
      return `
            <tr>
                <td>${index + 1}</td>
                <td>${(itemData.item_name || itemData.name || "")}</td>
                <td>${item.acceptedQuantity}</td>
                <td>${uomDisplay}</td>
                <td>${currency} ${Number(item.rate).toFixed(2)}</td>
                <td>${currency} ${amount.toFixed(2)}</td>
                <td>${taxRate.toFixed(2)}%</td>
                <td>${currency} ${itemTaxAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    const taxSummary = pi.taxes.map(tax => {
      return `
            <tr>
                <td class="label"><strong>VAT ${tax.taxRate}% @ ${tax.taxRate}</strong></td>
                <td class="value">${currency} ${(tax.amount || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Invoice ${pi.series || 'Undefined'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; font-size: 14px; }
                .header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 10px; border-bottom: 2px solid #000; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 24px; color: #000; font-weight: bold; }
                .header-right { text-align: right; }
                .header-right p { margin: 0; font-size: 16px; font-weight: bold; color: #000; }
                .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
                .details-left, .details-right { width: 48%; }
                .details-left p, .details-right p { margin: 5px 0; }
                .details-left .label, .details-right .label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { border: none; padding: 4px 8px; }
                .totals-table .label { font-weight: bold; text-align: left; }
                .totals-table .value { text-align: right; }
                .grand-total { border-top: 1px solid #ccc; font-weight: bold; }
                .in-words { margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PURCHASE INVOICE</h1>
                <div class="header-right"><p>${pi.series || 'Undefined'}</p></div>
            </div>
            <div class="details-container">
                <div class="details-left">
                    <p><span class="label">Supplier Name:</span>${pi.name || 'Undefined'}</p>
                    <p><span class="label">Supplier Company:</span>${pi.supplierCompany || 'Undefined'}</p>
                    <p><span class="label">Address:</span>${(supplierContact.address || pi.address || '').replace(/\n/g, '<br>')}</p>
                    <p><span class="label">Phone:</span>${supplierContact.phone || pi.phone || ''}</p>
                </div>
                <div class="details-right">
                    <p><span class="label">Date:</span>${pi.date ? new Date(pi.date).toLocaleDateString('en-GB') : 'Undefined'}</p>
                    <p><span class="label">Company TRN:</span>${supplier.taxId || 'N/A'}</p>
                </div>
            </div>
            <p>PO Reference: ${pi.poId || 'Undefined'}</p>
            <p>PR Reference: ${pi.prId || 'Undefined'}</p>
            <table>
                <thead>
                    <tr>
                        <th>Sr</th><th>Item</th><th>Quantity</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Tax Rate</th><th>Tax Amount</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td class="label">Total Quantity:</td><td class="value">${pi.totalQuantity || 0}</td></tr>
                        <tr><td class="label">Total</td><td class="value">${currency} ${(pi.subtotal || 0).toFixed(2)}</td></tr>
                        ${taxSummary}
                        <tr class="grand-total"><td class="label">Grand Total:</td><td class="value">${currency} ${(pi.grandTotal || 0).toFixed(2)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="in-words"><p><strong>In Words:</strong> ${currency} ${toWords(Math.floor(pi.grandTotal))} Only.</p></div>
        </body>
        </html>
    `;
  };
  const getSupplierDisplay = (supplierId, type = 'company') => {
    const supplier = suppliers.find(s => s._id === supplierId);
    if (!supplier) return 'N/A';
    if (type === 'names') {
      return (supplier.supplier_names && supplier.supplier_names.length > 0)
        ? supplier.supplier_names.join(', ')
        : supplier.company;
    }
    return supplier.company;
  };
  const renderItemQuantity = (item, type) => {
    const itemData = items.find(i => i._id === item.itemId);
    if (!itemData) return 'Unknown Item';
    if (type === 'po') {
      return `${(itemData.item_name || itemData.name || "")}: ${item.quantity} ${item.uom}`;
    }
    // For PR and others
    return `${(itemData.item_name || itemData.name || "")}: Accepted ${item.acceptedQuantity || 0}, Rejected ${item.rejectedQuantity || 0}`;
  };
  // Helper: match a value against an array of aliases (case-insensitive)
  const matchesAlias = (itemVal, aliases) => {
    if (!itemVal) return false;
    const vals = Array.isArray(itemVal) ? itemVal : [itemVal];
    return vals.some(v => aliases.some(a => a && v && String(a).toLowerCase() === String(v).toLowerCase()));
  };

  const filteredItems = items.filter(item => {
    // 1. Name search
    const nameMatch = (item.item_name || item.name || "").toLowerCase().includes(itemSearch.toLowerCase());
    if (!nameMatch) return false;

    // 2. Company filter: if a specific company is selected, only show items for that company
    const activeCompany = (selectedCompanyFilter && selectedCompanyFilter !== 'All Companies' && selectedCompanyFilter !== 'All')
      ? selectedCompanyFilter : null;
    if (activeCompany) {
      const itemCompanies = [
        ...(Array.isArray(item.company_names) ? item.company_names : []),
        item.company_name,
        item.company
      ].filter(Boolean);
      const companyMatch = itemCompanies.some(c =>
        String(c).toLowerCase() === String(activeCompany).toLowerCase()
      );
      if (!companyMatch) return false;
    }

    // 3. Branch filter: if a specific branch is selected, only show items for THAT branch
    //    Items with "All Branches" should NOT show when filtering by a specific branch
    const activeBranch = Array.isArray(selectedBranchFilter)
      ? selectedBranchFilter[0]
      : selectedBranchFilter;
    const isSpecificBranch = activeBranch && activeBranch !== 'All Branches' && activeBranch !== 'All' && activeBranch !== '';
    if (isSpecificBranch) {
      const itemBranches = [
        ...(Array.isArray(item.branch_names) ? item.branch_names : []),
        item.branch_name,
        item.branch
      ].filter(Boolean);
      // Strictly match only items whose branch equals the selected branch
      const branchMatch = itemBranches.some(b =>
        String(b).toLowerCase() === String(activeBranch).toLowerCase()
      );
      if (!branchMatch) return false;
    }

    return true;
  });
  const filteredSuppliers = suppliers.filter(supplier =>
    supplierSearch ? (supplier.company.toLowerCase().includes(supplierSearch.toLowerCase()) || supplier.supplier_names.some(name => name.toLowerCase().includes(supplierSearch.toLowerCase()))) : true
  );
  const filteredPurchaseOrders = purchaseOrders.filter(order => {
    const dateCondition = (!poDateFrom || new Date(order.date) >= new Date(poDateFrom)) &&
      (!poDateTo || new Date(order.date) <= new Date(poDateTo));
    const supplierCondition = !poSelectedSupplier || order.supplierId === poSelectedSupplier;
    const itemCondition = !poSelectedItem || order.items.some(item => item.itemId === poSelectedItem);
    return dateCondition && supplierCondition && itemCondition;
  });
  const filteredPurchaseReceipts = purchaseReceipts.filter(receipt => {
    const dateCondition = (!prDateFrom || new Date(receipt.date) >= new Date(prDateFrom)) &&
      (!prDateTo || new Date(receipt.date) <= new Date(prDateTo));
    const supplierCondition = !prSelectedSupplier || receipt.supplierId === prSelectedSupplier;
    const itemCondition = !prSelectedItem || receipt.items.some(item => item.itemId === prSelectedItem);
    return dateCondition && supplierCondition && itemCondition;
  });
  const filteredPurchaseInvoices = purchaseInvoices.filter(invoice => {
    const dateCondition = (!piDateFrom || new Date(invoice.date) >= new Date(piDateFrom)) &&
      (!piDateTo || new Date(invoice.date) <= new Date(piDateTo));
    const supplierCondition = !piSelectedSupplier || invoice.supplierId === piSelectedSupplier;
    const itemCondition = !piSelectedItem || invoice.items.some(item => item.itemId === piSelectedItem);
    return dateCondition && supplierCondition && itemCondition;
  });
  const filteredReportItems = items.filter(item =>
    (item.item_name || item.name || "").toLowerCase().includes(reportSearch.toLowerCase())
  );
  const filteredPurchaseOrdersReport = purchaseOrders.filter(order => {
    const dateCondition = (!reportPoDateFrom || new Date(order.date) >= new Date(reportPoDateFrom)) &&
      (!reportPoDateTo || new Date(order.date) <= new Date(reportPoDateTo));
    const supplierCondition = !reportPoSupplier || order.supplierId === reportPoSupplier;
    const statusCondition = !reportPoStatus || order.status === reportPoStatus;
    const searchCondition = !reportPoSearch || order.series.toLowerCase().includes(reportPoSearch.toLowerCase());
    const itemCondition = !reportPoItem || (order.items && order.items.some(it => it.itemId === reportPoItem));
    return dateCondition && supplierCondition && statusCondition && searchCondition && itemCondition;
  });
  const filteredPurchaseReceiptsReport = purchaseReceipts.filter(receipt => {
    const dateCondition = (!reportPrDateFrom || new Date(receipt.date) >= new Date(reportPrDateFrom)) &&
      (!reportPrDateTo || new Date(receipt.date) <= new Date(reportPrDateTo));
    const supplierCondition = !reportPrSupplier || receipt.supplierId === reportPrSupplier;
    const statusCondition = !reportPrStatus || receipt.status === reportPrStatus;
    const searchCondition = !reportPrSearch || receipt.series.toLowerCase().includes(reportPrSearch.toLowerCase());
    const itemCondition = !reportPrItem || (receipt.items && receipt.items.some(it => it.itemId === reportPrItem));
    return dateCondition && supplierCondition && statusCondition && searchCondition && itemCondition;
  });
  const filteredPurchaseInvoicesReport = purchaseInvoices.filter(invoice => {
    const dateCondition = (!reportPiDateFrom || new Date(invoice.date) >= new Date(reportPiDateFrom)) &&
      (!reportPiDateTo || new Date(invoice.date) <= new Date(reportPiDateTo));
    const supplierCondition = !reportPiSupplier || invoice.supplierId === reportPiSupplier;
    const statusCondition = !reportPiStatus || invoice.status === reportPiStatus;
    const searchCondition = !reportPiSearch || invoice.series.toLowerCase().includes(reportPiSearch.toLowerCase());
    const itemCondition = !reportPiItem || (invoice.items && invoice.items.some(it => it.itemId === reportPiItem));
    return dateCondition && supplierCondition && statusCondition && searchCondition && itemCondition;
  });
  const filteredSuppliersReport = suppliers.filter(supplier => {
    const groupCondition = !reportSupplierGroup || supplier.group.toLowerCase().includes(reportSupplierGroup.toLowerCase());
    const countryCondition = !reportSupplierCountry || supplier.country.toLowerCase().includes(reportSupplierCountry.toLowerCase());
    const searchCondition = !reportSupplierSearch || supplier.company.toLowerCase().includes(reportSupplierSearch.toLowerCase()) ||
      (supplier.code && supplier.code.toLowerCase().includes(reportSupplierSearch.toLowerCase())) ||
      supplier.supplier_names.some(name => name.toLowerCase().includes(reportSupplierSearch.toLowerCase()));
    return groupCondition && countryCondition && searchCondition;
  });
  const calculateGrandTotal = (data, field = 'grandTotal') => {
    return data.reduce((sum, item) => sum + (item[field] || 0), 0);
  };
  const handleTopSave = (e) => {
    if (editingSupplier) {
      handleSupplierUpdate(e);
    } else {
      handleSupplierSubmit(e);
    }
  };
  const handleRecordSale = async (itemId) => {
    const rawQuantity = Number(saleQuantities[itemId]);
    const uom = saleUoms[itemId] || 'nos';
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    let quantity_in_nos = rawQuantity;
    if (uom === 'master') {
      quantity_in_nos *= (item.units_per_packet || item.masterToOuter || "") * (item.total_units_per_box || item.outerToNos || "");
    } else if (uom === 'outer') {
      quantity_in_nos *= (item.total_units_per_box || item.outerToNos || "");
    }
    if (isNaN(quantity_in_nos) || quantity_in_nos <= 0) {
      setError('Valid quantity required for sale');
      return;
    }
    if (quantity_in_nos > item.totalStock) {
      setError('Insufficient stock');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/purchase_sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ itemId, quantity: quantity_in_nos })
      });
      if (response.ok) {
        await fetchItems();
        setMessage('Sale recorded successfully');
        setSaleQuantities({ ...saleQuantities, [itemId]: '' });
        setSaleUoms({ ...saleUoms, [itemId]: 'nos' });
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to record sale');
      }
    } catch (err) {
      setError('Failed to record sale');
    }
  };
  // NEW: Handle global search click
  const handleGlobalSearchClick = (tabKey) => {
    if (tabKey === 'supplier_group_list') {
      setShowSupplierGroupListModal(true);
      setGlobalSearch('');
      return;
    }
    setActiveTab(tabKey);
    setGlobalSearch('');
  };

  if (permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div style={{ textAlign: 'center', color: '#2c3e50', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <FaShoppingCart style={{ fontSize: '3rem', marginBottom: '20px', color: '#3498db' }} />
          <p>Loading Permissions...</p>
        </div>
      </div>
    );
  }

  const userStr = localStorage.getItem('user');
  const userObj = userStr ? JSON.parse(userStr) : {};
  const isAdminRole = checkIsAdmin(userObj);

  const handleGlobalSubmit = (e) => {
    switch (activeTab) {
      case 'order': handlePoSubmit(e); break;
      case 'receipt': handlePrSubmit(e); break;
      case 'invoice': handlePiSubmit(e); break;
      default: break;
    }
  };

  const handleGlobalSave = (e) => {
    switch (activeTab) {
      case 'item':
        if (editingItem) handleItemUpdate(e);
        else handleItemSubmit(e);
        break;
      case 'supplier':
        if (editingSupplier) handleSupplierUpdate(e);
        else handleSupplierSubmit(e);
        break;
      case 'order':
        handlePoSave(e);
        break;
      case 'receipt':
        handlePrSave(e);
        break;
      case 'invoice':
        handlePiSave(e);
        break;
      default:
        break;
    }
  };

  handleKeyDownRef.current = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault(); // Prevent browser save
        let isDraft = false;
        if (activeTab === 'order') {
          isDraft = poForm.status === 'Draft' && editingPoId;
        } else if (activeTab === 'receipt') {
          isDraft = prForm.status === 'Draft' && editingPrId;
        } else if (activeTab === 'invoice') {
          isDraft = piForm.status === 'Draft' && editingPiId;
        }
  
        if (isDraft) {
          handleGlobalSubmit(e);
        } else {
          handleGlobalSave(e);
        }
      }
    };

  if (!canRead && !isAdminRole && !permsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>Access Denied</h2>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>You do not have permission to view the Purchase Module.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '20px', borderRadius: '50px', padding: '10px 30px', background: '#3498db', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div style={{
      height: '100vh',
      overflowY: 'auto',
      background: 'transparent',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Centered Permission Denied Modal */}
      {showPermModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '30px', borderRadius: '15px', textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '400px', width: '90%'
          }}>
            <div style={{ color: '#e74c3c', fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Permission Denied</h3>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>{permModalMsg}</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowPermModal(false)}
              style={{ background: '#3498db', border: 'none', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold', color: '#fff', cursor: 'pointer' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Auto-closing Popup Modal for Messages and Errors */}
      {(message || error) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10001, backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '36px 32px', borderRadius: '18px', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)', maxWidth: '380px', width: '90%'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
               {error ? '⚠️' : '✅'}
            </div>
            <h3 style={{ marginBottom: '10px', color: '#1a202c', fontWeight: 700, fontSize: '1.2rem' }}>
              {error ? 'Warning / Error' : 'Success!'}
            </h3>
            <p style={{ color: error ? '#e53e3e' : '#4a5568', marginBottom: '24px', fontSize: '1.05rem', fontWeight: 600 }}>
              {error || message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { setMessage(''); setError(null); }}
                style={{
                  background: error ? 'linear-gradient(135deg, #e53e3e, #c53030)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '11px 36px', fontWeight: 700, fontSize: '15px',
                  cursor: 'pointer', boxShadow: error ? '0 4px 12px rgba(229,62,62,0.3)' : '0 4px 12px rgba(59,130,246,0.3)',
                  transition: 'transform 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Fixed Back Button in Top-Left Corner - Styled like EmployeeList, but label changes based on activeTab */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'transparent',
          border: '2px solid #3498db',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '50px',
          fontSize: '16px',
          fontWeight: '600',
          boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.color = '#ffffff';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <FaArrowLeft /> {activeTab === 'landing' ? 'Back to Admin' : 'Back to Purchase Module'}
      </button>

      {/* Global Top Right Action Buttons */}
      {activeTab !== 'landing' && (
        <div style={{ position: 'fixed', top: '15px', right: '30px', zIndex: 1050, display: 'flex', gap: '15px', alignItems: 'center' }}>
          {['item', 'supplier', 'order', 'receipt', 'invoice', 'report'].includes(activeTab) && (
            <button 
              type="button"
              className="customize-btn" 
              onClick={() => setShowCustomizeModal(true)}
              style={{
                background: 'rgb(46, 204, 113)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0 24px',
                height: '40px',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              <FaCogs /> Customize
            </button>
          )}
          {['item', 'supplier', 'order', 'receipt', 'invoice'].includes(activeTab) && (
            (() => {
              const isDocumentSaved = (
                (activeTab === 'order' && !!editingPoId) ||
                (activeTab === 'receipt' && !!editingPrId) ||
                (activeTab === 'invoice' && !!editingPiId)
              );
              const isDraft = (
                (activeTab === 'order' && poForm.status === 'Draft') ||
                (activeTab === 'receipt' && prForm.status === 'Draft') ||
                (activeTab === 'invoice' && piForm.status === 'Draft')
              );

              return (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex' }}>
                  <button 
                    type="button"
                    className={`purchase-button ${isDraft ? 'submit' : 'save'}`}
                    onClick={isDraft ? handleGlobalSubmit : handleGlobalSave}
                    style={{
                      background: isDraft ? '#22c55e' : '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '0 20px',
                      height: '40px',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: isDraft ? '0 4px 6px rgba(34, 197, 94, 0.2)' : '0 4px 6px rgba(59, 130, 246, 0.2)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isDraft ? <><FaCheck /> Submit (Ctrl+S)</> : <><FaSave /> Save (Ctrl+S)</>}
                  </button>
                </div>
              </div>
              );
            })()
          )}
        </div>
      )}

      <div className="purchase-content">

          {/* NEW: Fixed Top Navbar Filter */}
            
      <div style={{
        position: "fixed",
        top: "15px",
        left: "50%",
        transform: "translateX(-50%)",
        width: isCompanyAdmin ? "50%" : "40%",
        maxWidth: isCompanyAdmin ? "700px" : "500px",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: "30px",
        padding: "5px 15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0",
        transition: "all 0.3s ease",
        gap: "10px"
      }}>
        {isGroupAdmin && (
          <select
            value={selectedCompanyFilter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCompanyFilter(val);
              localStorage.setItem('active_company', val === 'All Companies' ? 'All' : val);
              
              setSelectedBranchFilter(['All Branches']);
              localStorage.setItem('active_branch', 'All Branches');
            }}
            style={{
              width: "auto",
              minWidth: "160px",
              border: "none",
              borderRight: "1px solid #e0e0e0",
              borderRadius: "0",
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "#2c3e50",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px top 50%",
              backgroundSize: "10px auto",
              paddingRight: "30px"
            }}
          >
            <option value="All Companies">All Companies</option>
            {assignedCompanies.map((comp, idx) => (
              <option key={idx} value={comp}>{comp}</option>
            ))}
          </select>
        )}
        
        {(showBranchSelector) && (() => {
          return availableBranches.length > 0;
        })() && (
          <select
            value={Array.isArray(selectedBranchFilter) ? selectedBranchFilter[0] : selectedBranchFilter}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBranchFilter([val]);
              localStorage.setItem('active_branch', val === 'All Branches' ? 'All Branches' : val);
            }}
            style={{
              width: "auto",
              minWidth: "160px",
              border: "none",
              borderRight: "1px solid #e0e0e0",
              borderRadius: "0",
              backgroundColor: "transparent",
              boxShadow: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "#2c3e50",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23475569%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px top 50%",
              backgroundSize: "10px auto",
              paddingRight: "30px"
            }}
          >
            <option value="All Branches">All Branches</option>
            {availableBranches.map((branch, idx) => (
              <option key={idx} value={branch}>{branch}</option>
            ))}
          </select>
        )}
        <div className="purchase-global-search" style={{ width: '100%', minWidth: '300px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Search modules (Items, Suppliers, etc.)..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onClick={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            style={{
              border: "none",
              backgroundColor: "transparent",
              boxShadow: "none",
              fontSize: "15px",
              padding: "8px 10px",
              color: "#333",
              width: "100%",
              outline: "none"
            }}
          />
          {showDropdown && (
            <div className="purchase-search-dropdown" style={{
              position: 'absolute',
              top: '120%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              maxHeight: '250px',
              overflowY: 'auto',
              zIndex: 2000
            }}>
              {tabOptions
                .filter(tab => tab.name.toLowerCase().includes(globalSearch.toLowerCase()))
                .map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleGlobalSearchClick(tab.key)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      color: '#2d3748',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#f7fafc'}
                    onMouseOut={(e) => e.target.style.background = 'none'}
                  >
                    {tab.name}
                  </button>
                ))}
              {tabOptions.filter(tab => tab.name.toLowerCase().includes(globalSearch.toLowerCase())).length === 0 && (
                <div style={{ padding: '15px', color: '#a0aec0', textAlign: 'center' }}>No modules found</div>
              )}
            </div>
          )}
        </div>
      </div>
    


          </div>

          {activeTab === 'landing' ? (
            <div className="purchase-landing">
              <h1>Purchase Module</h1>
              <div className="purchase-landing-buttons">
                {centeredTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="purchase-landing-button"
                  >
                    {tab.icon}
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '10px' }}>
                <h2 style={{ margin: 0 }}>{tabHeadings[activeTab] || 'Purchase Module'}</h2>
              </div>
              {/* Removed: purchase-nav-tabs as per user request */}
              {/* Top Tabs Hidden in Details View */}
              {loading && <p className="purchase-loading">Loading...</p>}

              {showNewUomModal && (
                <div className="purchase-modal-overlay" onClick={() => { setShowNewUomModal(false); setNewUomName(''); setPendingUom(null); setNewUomTargetCompanies([]); setNewUomTargetBranches([]); }}>
                  <div className="purchase-modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <button className="purchase-modal-close" onClick={() => { setShowNewUomModal(false); setNewUomName(''); setPendingUom(null); setNewUomTargetCompanies([]); setNewUomTargetBranches([]); }}>
                      <FaTimes />
                    </button>
                    <h3>Create New UOM</h3>
                    <label className="purchase-label">UOM Name <span className="mandatory-star">*</span></label>
                    <input
                      type="text"
                      value={newUomName}
                      onChange={(e) => setNewUomName(e.target.value)}
                      placeholder="Enter new UOM name"
                      className="purchase-input"
                    />

                    {isGroupAdmin && (
                      <div className="purchase-form-field" style={{ marginTop: '15px' }}>
                        <label className="purchase-label">Target Companies <span className="mandatory-star">*</span></label>
                        <div className="purchase-branch-filter-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                          {assignedCompanies.map((comp, cIdx) => (
                            <label key={cIdx} className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newUomTargetCompanies.includes(comp)}
                                onChange={(e) => {
                                  if (newUomTargetCompanies.includes(comp)) {
                                    setNewUomTargetCompanies(newUomTargetCompanies.filter(c => c !== comp));
                                  } else {
                                    setNewUomTargetCompanies([...newUomTargetCompanies, comp]);
                                  }
                                }}
                              />
                              <span>{comp}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {(showBranchSelector) && (
                      <div className="purchase-form-field" style={{ marginTop: '15px' }}>
                        <label className="purchase-label">Branches <span className="mandatory-star">*</span></label>
                        <div className="purchase-branch-filter-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                          <label className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <input
                              type="checkbox"
                              checked={newUomTargetBranches.includes('All Branches')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUomTargetBranches([...newUomAvailableBranches.filter(b => b !== 'All Branches'), 'All Branches']);
                                } else {
                                  setNewUomTargetBranches([]);
                                }
                              }}
                            />
                            <span>Select All Branches</span>
                          </label>
                          <div style={{ height: '1px', background: '#eee', margin: '4px 0' }}></div>
                          {newUomAvailableBranches.filter(b => b !== 'All Branches').map((br, bIdx) => (
                            <label key={bIdx} className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newUomTargetBranches.includes(br)}
                                onChange={(e) => {
                                  if (newUomTargetBranches.includes(br)) {
                                    setNewUomTargetBranches(newUomTargetBranches.filter(b => b !== br && b !== 'All Branches'));
                                  } else {
                                    setNewUomTargetBranches([...newUomTargetBranches, br]);
                                  }
                                }}
                              />
                              <span>{br}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="purchase-form-buttons" style={{ marginTop: '20px' }}>
                      <button onClick={handleCreateNewUom} className="purchase-button submit">Create</button>
                      <button onClick={() => { setShowNewUomModal(false); setNewUomName(''); setPendingUom(null); setNewUomTargetCompanies([]); setNewUomTargetBranches([]); }} className="purchase-button cancel">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {showNewCompanyModal && (
                <div className="purchase-modal-overlay" onClick={() => { setShowNewCompanyModal(false); setNewCompanyName(''); setPendingCompany(null); setNewBrandTargetCompanies([]); setNewBrandTargetBranches([]); }}>
                  <div className="purchase-modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <button className="purchase-modal-close" onClick={() => { setShowNewCompanyModal(false); setNewCompanyName(''); setPendingCompany(null); setNewBrandTargetCompanies([]); setNewBrandTargetBranches([]); }}>
                      <FaTimes />
                    </button>
                    <h3>Create New Brand</h3>
                    <label className="purchase-label">Brand Name {isFieldMandatory('Brand', 'name') && <span className="mandatory-star">*</span>}</label>
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Enter new brand name"
                      className="purchase-input"
                    />
                    
                    {isGroupAdmin && (
                      <div className="purchase-form-field" style={{ marginTop: '15px' }}>
                        <label className="purchase-label">Target Companies <span className="mandatory-star">*</span></label>
                        <div className="purchase-branch-filter-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                          {assignedCompanies.map((comp, cIdx) => (
                            <label key={cIdx} className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newBrandTargetCompanies.includes(comp)}
                                onChange={(e) => {
                                  if (newBrandTargetCompanies.includes(comp)) {
                                    setNewBrandTargetCompanies(newBrandTargetCompanies.filter(c => c !== comp));
                                  } else {
                                    setNewBrandTargetCompanies([...newBrandTargetCompanies, comp]);
                                  }
                                }}
                              />
                              <span>{comp}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {(showBranchSelector) && (
                      <div className="purchase-form-field" style={{ marginTop: '15px' }}>
                        <label className="purchase-label">Branches <span className="mandatory-star">*</span></label>
                        <div className="purchase-branch-filter-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                          <label className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <input
                              type="checkbox"
                              checked={newBrandTargetBranches.includes('All Branches')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewBrandTargetBranches([...newBrandAvailableBranches.filter(b => b !== 'All Branches'), 'All Branches']);
                                } else {
                                  setNewBrandTargetBranches([]);
                                }
                              }}
                            />
                            <span>Select All Branches</span>
                          </label>
                          <div style={{ height: '1px', background: '#eee', margin: '4px 0' }}></div>
                          {newBrandAvailableBranches.filter(b => b !== 'All Branches').map((br, bIdx) => (
                            <label key={bIdx} className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newBrandTargetBranches.includes(br)}
                                onChange={(e) => {
                                  if (newBrandTargetBranches.includes(br)) {
                                    setNewBrandTargetBranches(newBrandTargetBranches.filter(b => b !== br && b !== 'All Branches'));
                                  } else {
                                    setNewBrandTargetBranches([...newBrandTargetBranches, br]);
                                  }
                                }}
                              />
                              <span>{br}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="purchase-form-buttons" style={{ marginTop: '20px' }}>
                      <button onClick={handleCreateNewCompany} className="purchase-button submit">Create</button>
                      <button onClick={() => { setShowNewCompanyModal(false); setNewCompanyName(''); setPendingCompany(null); setNewBrandTargetCompanies([]); setNewBrandTargetBranches([]); }} className="purchase-button cancel">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {showUomListModal && (
                <div className="purchase-modal-overlay" onClick={() => setShowUomListModal(false)}>
                  <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="purchase-modal-close" onClick={() => setShowUomListModal(false)}>
                      <FaTimes />
                    </button>
                    <h3>UOM List</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          {(showBranchSelector) && <th>Target Companies</th>}
                          {(showBranchSelector) && <th>Target Branches</th>}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uomOptions.map(uom => (
                          <tr key={uom._id}>
                            <td>
                              {editingUom === uom._id ? (
                                <input
                                  type="text"
                                  value={editingUomName}
                                  onChange={(e) => setEditingUomName(e.target.value)}
                                  className="purchase-input"
                                />
                              ) : (
                                uom.name
                              )}
                            </td>
                            {(showBranchSelector) && (
                              <td>
                                {uom.company_names ? uom.company_names.join(', ') : uom.company_name || uom.company || '-'}
                              </td>
                            )}
                            {(showBranchSelector) && (
                              <td>
                                {uom.branch_names ? uom.branch_names.join(', ') : uom.branch_name || '-'}
                              </td>
                            )}
                            <td>
                              {editingUom === uom._id ? (
                                <>
                                  <button onClick={() => handleUpdateUom(uom._id)} className="purchase-button submit">
                                    <FaCheck /> Save
                                  </button>
                                  <button onClick={() => setEditingUom(null)} className="purchase-button cancel">
                                    <FaTimes /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleEditUom(uom)} className="purchase-button edit">
                                    <FaEdit /> Edit
                                  </button>
                                  <button onClick={() => deleteUom(uom._id)} className="purchase-button delete">
                                    <FaTrash /> Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* NEW: Brand List Modal */}
              {showBrandListModal && (
                <div className="purchase-modal-overlay" onClick={() => setShowBrandListModal(false)}>
                  <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="purchase-modal-close" onClick={() => setShowBrandListModal(false)}>
                      <FaTimes />
                    </button>
                    <h3>Brand List</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          {(showBranchSelector) && <th>Target Companies</th>}
                          {(showBranchSelector) && <th>Target Branches</th>}
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brands.map(brand => (
                          <tr key={brand._id}>
                            <td>
                              {editingBrand === brand._id ? (
                                <input
                                  type="text"
                                  value={editingBrandName}
                                  onChange={(e) => setEditingBrandName(e.target.value)}
                                  className="purchase-input"
                                />
                              ) : (
                                brand.name
                              )}
                            </td>
                            {(showBranchSelector) && (
                              <td>
                                {brand.company_names ? brand.company_names.join(', ') : brand.company_name || '-'}
                              </td>
                            )}
                            {(showBranchSelector) && (
                              <td>
                                {brand.branch_names ? brand.branch_names.join(', ') : brand.branch_name || '-'}
                              </td>
                            )}
                            <td>
                              {editingBrand === brand._id ? (
                                <>
                                  <button onClick={() => handleUpdateBrand(brand._id)} className="purchase-button submit">
                                    <FaCheck /> Save
                                  </button>
                                  <button onClick={() => setEditingBrand(null)} className="purchase-button cancel">
                                    <FaTimes /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleEditBrand(brand)} className="purchase-button edit">
                                    <FaEdit /> Edit
                                  </button>
                                  <button onClick={() => deleteBrand(brand._id)} className="purchase-button delete">
                                    <FaTrash /> Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* NEW: Supplier Group Modal */}
              {showSupplierGroupModal && (
                <div className="purchase-modal-overlay" onClick={() => { setShowSupplierGroupModal(false); setNewSupplierGroupName(''); setEditingSupplierGroup(null); setNewSupplierGroupTargetCompanies([]); setNewSupplierGroupTargetBranches([]); }}>
                  <div className="purchase-modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <button className="purchase-modal-close" onClick={() => { setShowSupplierGroupModal(false); setNewSupplierGroupName(''); setEditingSupplierGroup(null); setNewSupplierGroupTargetCompanies([]); setNewSupplierGroupTargetBranches([]); }}>
                      <FaTimes />
                    </button>
                    <h3>{editingSupplierGroup ? 'Edit Supplier Group' : 'Create New Supplier Group'}</h3>
                    <label className="purchase-label">Supplier Group Name <span className="mandatory-star">*</span></label>
                    <input
                      type="text"
                      value={newSupplierGroupName}
                      onChange={(e) => setNewSupplierGroupName(e.target.value)}
                      placeholder="Enter supplier group name"
                      className="purchase-input"
                    />

                    {isGroupAdmin && (
                      <div className="purchase-form-field" style={{ marginTop: '15px' }}>
                        <label className="purchase-label">Target Companies <span className="mandatory-star">*</span></label>
                        <div className="purchase-branch-filter-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                          {assignedCompanies.map((comp, cIdx) => (
                            <label key={cIdx} className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newSupplierGroupTargetCompanies.includes(comp)}
                                onChange={(e) => {
                                  if (newSupplierGroupTargetCompanies.includes(comp)) {
                                    setNewSupplierGroupTargetCompanies(newSupplierGroupTargetCompanies.filter(c => c !== comp));
                                  } else {
                                    setNewSupplierGroupTargetCompanies([...newSupplierGroupTargetCompanies, comp]);
                                  }
                                }}
                              />
                              <span>{comp}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {(showBranchSelector) && (
                      <div className="purchase-form-field" style={{ marginTop: '15px' }}>
                        <label className="purchase-label">Branches <span className="mandatory-star">*</span></label>
                        <div className="purchase-branch-filter-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '5px' }}>
                          <label className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <input
                              type="checkbox"
                              checked={newSupplierGroupTargetBranches.includes('All Branches')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewSupplierGroupTargetBranches([...newSupplierGroupAvailableBranches.filter(b => b !== 'All Branches'), 'All Branches']);
                                } else {
                                  setNewSupplierGroupTargetBranches([]);
                                }
                              }}
                            />
                            <span>Select All Branches</span>
                          </label>
                          <div style={{ height: '1px', background: '#eee', margin: '4px 0' }}></div>
                          {newSupplierGroupAvailableBranches.filter(b => b !== 'All Branches').map((br, bIdx) => (
                            <label key={bIdx} className="purchase-branch-option" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={newSupplierGroupTargetBranches.includes(br)}
                                onChange={(e) => {
                                  if (newSupplierGroupTargetBranches.includes(br)) {
                                    setNewSupplierGroupTargetBranches(newSupplierGroupTargetBranches.filter(b => b !== br && b !== 'All Branches'));
                                  } else {
                                    setNewSupplierGroupTargetBranches([...newSupplierGroupTargetBranches, br]);
                                  }
                                }}
                              />
                              <span>{br}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="purchase-form-buttons" style={{ marginTop: '20px' }}>
                      <button onClick={handleSupplierGroupSubmit} className="purchase-button submit">
                        {editingSupplierGroup ? 'Update' : 'Create'}
                      </button>
                      <button onClick={() => { setShowSupplierGroupModal(false); setNewSupplierGroupName(''); setEditingSupplierGroup(null); setNewSupplierGroupTargetCompanies([]); setNewSupplierGroupTargetBranches([]); }} className="purchase-button cancel">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {/* NEW: Supplier Group List Modal */}
              {showSupplierGroupListModal && (
                <div className="purchase-modal-overlay" onClick={() => setShowSupplierGroupListModal(false)}>
                  <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="purchase-modal-close" onClick={() => setShowSupplierGroupListModal(false)}>
                      <FaTimes />
                    </button>
                    <h3>Supplier Groups List</h3>
                    <div className="purchase-filter-group-right" style={{ marginBottom: '15px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowSupplierGroupModal(true)} className="purchase-button filter">
                        Create Supplier Group
                      </button>
                    </div>
                    <div className="purchase-table-wrapper">
                      <table className="purchase-table">
                        <thead>
                          <tr>
                            <th>Group Name</th>
                            {(showBranchSelector) && <th>Target Companies</th>}
                            {(showBranchSelector) && <th>Target Branches</th>}
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierGroups.map(group => (
                            <tr key={group._id}>
                              <td>{group.group_name}</td>
                              {(showBranchSelector) && (
                                <td>
                                  {group.company_names ? group.company_names.join(', ') : group.company_name || group.company || '-'}
                                </td>
                              )}
                              {(showBranchSelector) && (
                                <td>
                                  {group.branch_names ? group.branch_names.join(', ') : group.branch_name || '-'}
                                </td>
                              )}
                              <td>
                                <button onClick={() => { setEditingSupplierGroup(group); setNewSupplierGroupName(group.group_name); setShowSupplierGroupModal(true); }} className="purchase-button edit">
                                  <FaEdit /> Edit
                                </button>
                                <button onClick={() => deleteSupplierGroup(group._id)} className="purchase-button delete">
                                  <FaTrash /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'item' && (
                <div className="purchase-section">
                  <div className="purchase-header">
                    <h3>Manage Items</h3>
                    <div className="purchase-filter-group-center">
                      <input
                        type="text"
                        placeholder="Search items by name"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="purchase-input"
                      />
                    </div>
                    <div className="purchase-filter-group-right">
                      {editingItem && (
                        <button type="button" onClick={() => setEditingItem(null)} className="purchase-button cancel">
                          Cancel
                        </button>
                      )}
                      <button type="button" onClick={() => setShowBrandListModal(true)} className="purchase-button filter">
                        View Brands
                      </button>
                      <button type="button" onClick={() => setShowUomListModal(true)} className="purchase-button filter">
                        View UOMs
                      </button>
                    </div>
                  </div>
                  <div className="purchase-form">
                    <div className="purchase-item-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {itemFormRows.map((row, idx) => (
                        <div key={idx} className="purchase-item-card" style={{
                          background: '#fff',
                          padding: '20px',
                          borderRadius: '10px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          border: '1px solid #eee',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '15px'
                        }}>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '5px' }}>
                            <h4 style={{ margin: 0, color: '#2c3e50' }}>Item #{idx + 1}</h4>
                            {!editingItem && (
                              <button type="button" onClick={() => removeItemFormRow(idx)} className="purchase-button delete" disabled={itemFormRows.length === 1} style={{ padding: '5px 10px', fontSize: '12px' }}>
                                <FaTrash /> Remove
                              </button>
                            )}
                          </div>

                          {isFieldVisible('Purchase Item', 'company') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">{getFieldLabel('Purchase Item', 'company', 'Brand')} {isFieldMandatory('Purchase Item', 'company') && <span className="mandatory-star">*</span>}</label>
                            <select
                              value={row.company}
                              onChange={(e) => handleItemFormChange(idx, 'company', e.target.value)}
                              className="purchase-input select"
                              required={isFieldMandatory('Purchase Item', 'company')}
                            >
                              <option value="">Select Brand</option>
                              {brands.map(brand => (
                                <option key={brand._id} value={brand.name}>
                                  {brand.name}
                                </option>
                              ))}
                              <option value="create_new">Create New Brand</option>
                            </select>
                            {fieldErrors[`${idx}_company`] && <span className="purchase-field-error">{fieldErrors[`${idx}_company`]}</span>}
                          </div>
                          )}

                          {isGroupAdmin && (
                            <div className="purchase-form-field">
                              <label className="purchase-label">Target Companies <span className="mandatory-star">*</span></label>
                              <div className="purchase-branch-filter-container">
                                <div
                                  className={`purchase-branch-filter-trigger ${row.isTargetCompanyDropdownOpen ? 'active' : ''}`}
                                  onClick={() => {
                                    const updatedRows = [...itemFormRows];
                                    updatedRows[idx].isTargetCompanyDropdownOpen = !updatedRows[idx].isTargetCompanyDropdownOpen;
                                    setItemFormRows(updatedRows);
                                  }}
                                >
                                  <span>
                                    {(!row.target_companies || row.target_companies.length === 0)
                                      ? 'Select Companies'
                                      : row.target_companies.length === 1
                                        ? row.target_companies[0]
                                        : `${row.target_companies.length} Companies`}
                                  </span>
                                  <span style={{ fontSize: '10px' }}>{row.isTargetCompanyDropdownOpen ? '▲' : '▼'}</span>
                                </div>
                                {row.isTargetCompanyDropdownOpen && (
                                  <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }}>
                                    <div className="purchase-branch-dropdown-header">
                                      <span>Select Companies</span>
                                      <button type="button" onClick={() => {
                                        const updatedRows = [...itemFormRows];
                                        updatedRows[idx].isTargetCompanyDropdownOpen = false;
                                        setItemFormRows(updatedRows);
                                      }}><FaTimes /></button>
                                    </div>
                                    <div className="purchase-branch-search">
                                      <input
                                        type="text"
                                        placeholder="Search companies..."
                                        className="purchase-branch-search-input"
                                        value={row.companySearchTerm || ''}
                                        onChange={(e) => {
                                          const updatedRows = [...itemFormRows];
                                          updatedRows[idx].companySearchTerm = e.target.value;
                                          setItemFormRows(updatedRows);
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                    <div className="purchase-branch-options">
                                      <label className="purchase-branch-option">
                                        <input
                                          type="checkbox"
                                          checked={assignedCompanies.length > 0 && assignedCompanies.every(c => (row.target_companies || []).includes(c))}
                                          onChange={() => {
                                            const updatedRows = [...itemFormRows];
                                            const current = row.target_companies || [];
                                            const allSelected = assignedCompanies.every(c => current.includes(c));
                                            
                                            if (allSelected) {
                                              updatedRows[idx].target_companies = [];
                                            } else {
                                              updatedRows[idx].target_companies = [...assignedCompanies];
                                            }
                                            setItemFormRows(updatedRows);
                                          }}
                                        />
                                        <span>Select All Companies</span>
                                      </label>
                                      <div className="purchase-branch-divider"></div>
                                      {assignedCompanies
                                        .filter(comp => String(comp).toLowerCase().includes((row.companySearchTerm || '').toLowerCase()))
                                        .map((comp, cIdx) => (
                                          <label key={cIdx} className="purchase-branch-option">
                                            <input
                                              type="checkbox"
                                              checked={row.target_companies && row.target_companies.includes(comp)}
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                const updatedRows = [...itemFormRows];
                                                const current = row.target_companies || [];
                                                if (current.includes(comp)) {
                                                  updatedRows[idx].target_companies = current.filter(c => c !== comp);
                                                } else {
                                                  updatedRows[idx].target_companies = [...current, comp];
                                                }
                                                setItemFormRows(updatedRows);
                                              }}
                                            />
                                            <span>{comp}</span>
                                          </label>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {fieldErrors[`${idx}_target_companies`] && <span className="purchase-field-error">{fieldErrors[`${idx}_target_companies`]}</span>}
                            </div>
                          )}
                          {(showBranchSelector) && (
                            <div className="purchase-form-field">
                              <label className="purchase-label">Branch <span className="mandatory-star">*</span></label>
                              <div className="purchase-branch-filter-container">
                                <div
                                  className={`purchase-branch-filter-trigger ${row.isBranchDropdownOpen ? 'active' : ''}`}
                                  onClick={() => toggleBranchDropdownForItem(idx)}
                                >
                                  <span>
                                    {(!row.branch_name || row.branch_name.length === 0)
                                      ? 'All Branches'
                                      : row.branch_name.length === 1
                                        ? row.branch_name[0]
                                        : `${row.branch_name.length} Branches`}
                                  </span>
                                  <span style={{ fontSize: '10px' }}>{row.isBranchDropdownOpen ? '▲' : '▼'}</span>
                                </div>
                                {row.isBranchDropdownOpen && (
                                  <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }}>
                                    <div className="purchase-branch-dropdown-header">
                                      <span>Select Branches</span>
                                      <button type="button" onClick={() => toggleBranchDropdownForItem(idx)}><FaTimes /></button>
                                    </div>
                                    <div className="purchase-branch-search">
                                      <input
                                        type="text"
                                        placeholder="Search branches..."
                                        className="purchase-branch-search-input"
                                        value={row.branchSearchTerm || ''}
                                        onChange={(e) => {
                                          const updatedRows = [...itemFormRows];
                                          updatedRows[idx].branchSearchTerm = e.target.value;
                                          setItemFormRows(updatedRows);
                                        }}
                                        autoFocus
                                      />
                                    </div>
                                    <div className="purchase-branch-options">
                                      <label className="purchase-branch-option">
                                        <input
                                          type="checkbox"
                                          checked={!row.branch_name || row.branch_name.length === 0}
                                          onChange={() => handleBranchChangeForItem(idx, 'all')}
                                        />
                                        <span>All Branches (Global)</span>
                                      </label>
                                      <label className="purchase-branch-option">
                                        <input
                                          type="checkbox"
                                          checked={availableBranches.length > 0 && availableBranches.every(br => (row.branch_name || []).includes(br))}
                                          onChange={() => handleBranchChangeForItem(idx, 'select_all_available')}
                                        />
                                        <span>Select All Available</span>
                                      </label>
                                      <div className="purchase-branch-divider"></div>
                                      {availableBranches
                                        .filter(br => String(br).toLowerCase().includes((row.branchSearchTerm || '').toLowerCase()))
                                        .map((br, bIdx) => (
                                          <label key={bIdx} className="purchase-branch-option">
                                            <input
                                              type="checkbox"
                                              checked={row.branch_name && row.branch_name.includes(br)}
                                              onChange={() => handleBranchChangeForItem(idx, br)}
                                            />
                                            <span>{br}</span>
                                          </label>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {fieldErrors[`${idx}_branch_name`] && <span className="purchase-field-error">{fieldErrors[`${idx}_branch_name`]}</span>}
                            </div>
                          )}

                          {isFieldVisible('Purchase Item', 'name') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">{getFieldLabel('Purchase Item', 'name', 'Item Name')} {isFieldMandatory('Purchase Item', 'name') && <span className="mandatory-star">*</span>}</label>
                            <input type="text" value={row.name} onChange={(e) => handleItemFormChange(idx, 'name', e.target.value)} placeholder="Item name" className="purchase-input" required={isFieldMandatory('Purchase Item', 'name')} />
                            {fieldErrors[`${idx}_name`] && <span className="purchase-field-error">{fieldErrors[`${idx}_name`]}</span>}
                          </div>
                          )}

                          {isFieldVisible('Purchase Item', 'grams') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">{getFieldLabel('Purchase Item', 'grams', 'Grams')} {isFieldMandatory('Purchase Item', 'grams') && <span className="mandatory-star">*</span>}</label>
                            <input type="number" value={row.grams} onChange={(e) => handleItemFormChange(idx, 'grams', e.target.value)} placeholder="Grams" className="purchase-input" required={isFieldMandatory('Purchase Item', 'grams')} />
                            {fieldErrors[`${idx}_grams`] && <span className="purchase-field-error">{fieldErrors[`${idx}_grams`]}</span>}
                          </div>
                          )}

                          {isFieldVisible('Purchase Item', 'boxToMaster') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">{getFieldLabel('Purchase Item', 'boxToMaster', 'Packets per Box')} {isFieldMandatory('Purchase Item', 'boxToMaster') && <span className="mandatory-star">*</span>}</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input type="number" value={row.boxToMaster} onChange={(e) => handleItemFormChange(idx, 'boxToMaster', e.target.value)} placeholder="Nos" className="purchase-input" style={{ flex: 1 }} required={isFieldMandatory('Purchase Item', 'boxToMaster')} />
                              {isFieldVisible('Purchase Item', 'masterUnit') && (
                              <select value={row.masterUnit} onChange={(e) => handleItemFormChange(idx, 'masterUnit', e.target.value)} className="purchase-input select" style={{ width: '120px' }} required={isFieldMandatory('Purchase Item', 'masterUnit')}>
                                <option value="">Unit</option>
                                {uomOptions.map(uom => (<option key={uom._id} value={uom.name}>{uom.name}</option>))}
                                <option value="create_new">Create New</option>
                              </select>
                              )}
                            </div>
                            {fieldErrors[`${idx}_boxToMaster`] && <span className="purchase-field-error">{fieldErrors[`${idx}_boxToMaster`]}</span>}
                            {fieldErrors[`${idx}_masterUnit`] && <span className="purchase-field-error">{fieldErrors[`${idx}_masterUnit`]}</span>}
                          </div>
                          )}

                          {isFieldVisible('Purchase Item', 'masterToOuter') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">{getFieldLabel('Purchase Item', 'masterToOuter', 'Units per Packet')} {isFieldMandatory('Purchase Item', 'masterToOuter') && <span className="mandatory-star">*</span>}</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input type="number" value={row.masterToOuter} onChange={(e) => handleItemFormChange(idx, 'masterToOuter', e.target.value)} placeholder="Nos" className="purchase-input" style={{ flex: 1 }} required={isFieldMandatory('Purchase Item', 'masterToOuter')} />
                              {isFieldVisible('Purchase Item', 'outerUnit') && (
                              <select value={row.outerUnit} onChange={(e) => handleItemFormChange(idx, 'outerUnit', e.target.value)} className="purchase-input select" style={{ width: '120px' }} required={isFieldMandatory('Purchase Item', 'outerUnit')}>
                                <option value="">Unit</option>
                                {uomOptions.map(uom => (<option key={uom._id} value={uom.name}>{uom.name}</option>))}
                                <option value="create_new">Create New</option>
                              </select>
                              )}
                            </div>
                            {fieldErrors[`${idx}_masterToOuter`] && <span className="purchase-field-error">{fieldErrors[`${idx}_masterToOuter`]}</span>}
                            {fieldErrors[`${idx}_outerUnit`] && <span className="purchase-field-error">{fieldErrors[`${idx}_outerUnit`]}</span>}
                          </div>
                          )}

                          {isFieldVisible('Purchase Item', 'outerToNos') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">{getFieldLabel('Purchase Item', 'outerToNos', 'Total Units per Box')} {isFieldMandatory('Purchase Item', 'outerToNos') && <span className="mandatory-star">*</span>}</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <input type="number" value={row.outerToNos} onChange={(e) => handleItemFormChange(idx, 'outerToNos', e.target.value)} placeholder="Nos" className="purchase-input" style={{ flex: 1 }} required={isFieldMandatory('Purchase Item', 'outerToNos')} />
                              {isFieldVisible('Purchase Item', 'nosUnit') && (
                              <input type="text" value={row.nosUnit} onChange={(e) => handleItemFormChange(idx, 'nosUnit', e.target.value)} placeholder="Unit (e.g. Patty)" className="purchase-input" style={{ width: '120px' }} required={isFieldMandatory('Purchase Item', 'nosUnit')} />
                              )}
                            </div>
                            {fieldErrors[`${idx}_outerToNos`] && <span className="purchase-field-error">{fieldErrors[`${idx}_outerToNos`]}</span>}
                            {fieldErrors[`${idx}_nosUnit`] && <span className="purchase-field-error">{fieldErrors[`${idx}_nosUnit`]}</span>}
                          </div>
                          )}

                          {isFieldVisible('Purchase Item', 'suppliers') && (
                          <div className="purchase-form-field">
                            <label className="purchase-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{getFieldLabel('Purchase Item', 'suppliers', 'Supplier')}</span>
                              <button 
                                type="button" 
                                onClick={() => { setCreatingSupplierForItem({ rowIndex: idx }); setActiveTab('supplier'); }} 
                                className="purchase-button add-row" 
                                style={{ margin: 0, padding: '2px 10px', fontSize: '11px', height: '24px', background: '#3498db', color: '#fff' }}
                              >
                                <FaPlus /> Create Supplier
                              </button>
                            </label>

                            <div className="purchase-custom-multiselect" style={{ position: 'relative' }}>
                              <div
                                className="purchase-input"
                                onClick={(e) => { e.stopPropagation(); toggleSupplierDropdown(idx); }}
                                style={{
                                  cursor: 'pointer',
                                  minHeight: '38px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '5px',
                                  background: '#fff'
                                }}
                              >
                                {row.suppliers && row.suppliers.length > 0 ? (
                                  row.suppliers.map(s => (
                                    <span key={s.supplierId} style={{ background: '#e0e0e0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                      {s.supplierName}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: '#aaa' }}>Select Suppliers</span>
                                )}
                              </div>
                              {row.isSupplierDropdownOpen && (
                                <div className="purchase-dropdown-options" onClick={(e) => e.stopPropagation()} style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  width: '100%',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  background: '#fff',
                                  border: '1px solid #ccc',
                                  zIndex: 1000,
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }}>
                                  <div
                                    className="purchase-dropdown-option"
                                    onClick={() => {
                                      setCreatingSupplierForItem({ rowIndex: idx });
                                      setActiveTab('supplier');
                                    }}
                                    style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee', color: '#007bff', fontWeight: 'bold' }}
                                  >
                                    + Create New Supplier
                                  </div>
                                  {suppliers.map(supplier => {
                                    const isSelected = row.suppliers && row.suppliers.some(s => s.supplierId === supplier._id);
                                    return (
                                      <div
                                        key={supplier._id}
                                        onClick={(e) => { e.stopPropagation(); toggleSupplier(idx, supplier); }}
                                        style={{
                                          padding: '8px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          background: isSelected ? '#f0f8ff' : '#fff'
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected || false}
                                          readOnly
                                          style={{ marginRight: '8px' }}
                                        />
                                        {supplier.company}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {/* Overlay to close dropdown when clicking outside */}
                            {row.isSupplierDropdownOpen && (
                              <div
                                style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }}
                                onClick={() => toggleSupplierDropdown(idx)}
                              />
                            )}
                          </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="purchase-form-buttons">
                      {!editingItem && (
                        <button type="button" onClick={addItemFormRow} className="purchase-button add-row">
                          <FaPlus /> Add Row
                        </button>
                      )}
                    </div>
                  </div>
                  <h3>Items List</h3>
                  <table className="purchase-table">
                    <thead>
                      <tr>
                      {renderDynamicHeaders('Purchase Item', (
                        <>
                          <th>Brand</th>
                          <th>Name</th>
                          <th>Grams</th>
                          <th>Packets per Box</th>
                          <th>Units per Packet</th>
                          <th>Total Units per Box</th>
                          <th>Total Purchased</th>
                          <th>Total Stock</th>
                          <th>Suppliers</th>
                          <th>Actions</th>
                        </>
                      ), {}, false)}
                    </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => {
                        const remainingPatties = item.totalStock;

                        const supplierNamesList = (item.suppliers && Array.isArray(item.suppliers))
                          ? item.suppliers.map(s => s.supplierName).join(', ')
                          : 'N/A';
                        return (
                          <tr key={item._id}>
                            {isFieldVisible('Purchase Item', 'company') && <td>{(item.brand || item.company || "") || item.company_name || (Array.isArray(item.company_names) ? item.company_names[0] : item.company_names) || '-'}</td>}
                            {isFieldVisible('Purchase Item', 'name') && <td>{(item.item_name || item.name || "")}</td>}
                            {isFieldVisible('Purchase Item', 'grams') && <td>{item.grams || '-'}</td>}
                            {isFieldVisible('Purchase Item', 'boxToMaster') && <td>{item.packets_per_box || item.boxToMaster || ""}</td>}
                            {isFieldVisible('Purchase Item', 'masterUnit') && <td>{item.masterUnit || ""}</td>}
                            {isFieldVisible('Purchase Item', 'masterToOuter') && <td>{item.units_per_packet || item.masterToOuter || ""}</td>}
                            {isFieldVisible('Purchase Item', 'outerUnit') && <td>{item.outerUnit || ""}</td>}
                            {isFieldVisible('Purchase Item', 'outerToNos') && <td>{item.total_units_per_box || item.outerToNos || ""}</td>}
                            {isFieldVisible('Purchase Item', 'nosUnit') && <td>{item.nosUnit || ""}</td>}
                            {isFieldVisible('Purchase Item', 'suppliers') && <td>{supplierNamesList}</td>}
                            <td className="purchase-action-buttons">
                              <button onClick={() => setEditingItem(item)} className="purchase-button edit"><FaEdit /> Edit</button>
                              <button onClick={() => deleteItem(item._id)} className="purchase-button delete"><FaTrash /> Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'supplier' && (
                <div className="purchase-section">
                  <div className="purchase-header">
                    <h3>Manage Suppliers</h3>
                    <div className="purchase-filter-group-center">
                      <input
                        type="text"
                        placeholder="Search suppliers by name or phone"
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="purchase-input"
                      />
                    </div>
                    <div className="purchase-filter-group-right">
                      {creatingSupplierForItem && (
                        <button onClick={() => { setCreatingSupplierForItem(null); setActiveTab('item'); }} className="purchase-button cancel">
                          Back to Item Entry
                        </button>
                      )}
                      {creatingSupplierForPo && (
                        <button onClick={() => { setCreatingSupplierForPo(false); setActiveTab('order'); }} className="purchase-button cancel">
                          Back to PO
                        </button>
                      )}
                      {creatingSupplierForPi && (
                        <button onClick={() => { setCreatingSupplierForPi(false); setActiveTab('invoice'); }} className="purchase-button cancel">
                          Back to PI
                        </button>
                      )}
                      <button onClick={() => setShowSupplierModal(true)} className="purchase-button filter">
                        View Suppliers List
                      </button>
                      {editingSupplier && (
                        <button type="button" onClick={() => setEditingSupplier(null)} className="purchase-button cancel">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="purchase-form">
                    <div className="purchase-supplier-tabs">
                      <div className={`purchase-supplier-tab ${activeSection === 'details' ? 'active' : ''}`} onClick={() => setActiveSection('details')}>Details</div>
                      <div className={`purchase-supplier-tab ${activeSection === 'tax' ? 'active' : ''}`} onClick={() => setActiveSection('tax')}>Tax</div>
                      <div className={`purchase-supplier-tab ${activeSection === 'address_contact' ? 'active' : ''}`} onClick={() => setActiveSection('address_contact')}>Address & Contact</div>
                      <div className={`purchase-supplier-tab ${activeSection === 'accounting' ? 'active' : ''}`} onClick={() => setActiveSection('accounting')}>Accounting</div>
                      <div className={`purchase-supplier-tab ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => setActiveSection('settings')}>Settings</div>
                    </div>
                    {activeSection === 'details' && (
                      <div className="purchase-supplier-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="purchase-form-field"><label className="purchase-label">Company Name / Trade Name</label><input type="text" value={supplierForm.company} onChange={(e) => setSupplierForm({ ...supplierForm, company: e.target.value })} className="purchase-input" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Supplier Code / Short Name</label><input type="text" value={supplierForm.code} onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })} className="purchase-input" /></div>
                        <div className="purchase-form-field">
                          <label className="purchase-label">Supplier group/Category</label>
                          <select
                            value={supplierForm.group}
                            onChange={(e) => {
                              if (e.target.value === 'create_new') {
                                setShowSupplierGroupModal(true);
                              } else {
                                setSupplierForm({ ...supplierForm, group: e.target.value });
                              }
                            }}
                            className="purchase-input select"
                          >
                            <option value="">Select Group</option>
                            {supplierGroups.map(group => (
                              <option key={group._id} value={group.group_name}>{group.group_name}</option>
                            ))}
                            <option value="create_new">+ Create New Supplier Group</option>
                          </select>
                        </div>
                                              <div className="purchase-form-field">
                        <label className="purchase-label">Country</label>
                        <SearchableSelect
                          options={countryList}
                          value={supplierForm.country}
                          onChange={(val) => setSupplierForm({ ...supplierForm, country: val })}
                          placeholder="Search Country"
                        />
                      </div>
                        {isGroupAdmin && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">Target Companies <span className="mandatory-star">*</span></label>
                            <div className="purchase-branch-filter-container">
                              <div
                                className={`purchase-branch-filter-trigger ${supplierForm.isTargetCompanyDropdownOpen ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); setSupplierForm({ ...supplierForm, isTargetCompanyDropdownOpen: !supplierForm.isTargetCompanyDropdownOpen }); }}
                              >
                                <span>
                                  {(!supplierForm.target_companies || supplierForm.target_companies.length === 0)
                                    ? 'Select Companies'
                                    : supplierForm.target_companies.length === 1
                                      ? supplierForm.target_companies[0]
                                      : `${supplierForm.target_companies.length} Companies`}
                                </span>
                                <span style={{ fontSize: '10px' }}>{supplierForm.isTargetCompanyDropdownOpen ? '▲' : '▼'}</span>
                              </div>
                              {supplierForm.isTargetCompanyDropdownOpen && (
                                <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                  <div className="purchase-branch-dropdown-header">
                                    <span>Select Companies</span>
                                    <button type="button" onClick={() => setSupplierForm({ ...supplierForm, isTargetCompanyDropdownOpen: false })}><FaTimes /></button>
                                  </div>
                                  <div className="purchase-branch-search">
                                    <input
                                      type="text"
                                      placeholder="Search companies..."
                                      value={supplierForm.companySearchTerm || ''}
                                      onChange={(e) => setSupplierForm({ ...supplierForm, companySearchTerm: e.target.value })}
                                      className="purchase-branch-search-input"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="purchase-branch-options">
                                    <label className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={assignedCompanies.length > 0 && assignedCompanies.every(c => (supplierForm.target_companies || []).includes(c))}
                                        onChange={() => {
                                          const allSelected = assignedCompanies.every(c => (supplierForm.target_companies || []).includes(c));
                                          setSupplierForm({ 
                                            ...supplierForm, 
                                            target_companies: allSelected ? [] : [...assignedCompanies] 
                                          });
                                        }}
                                      />
                                      <span>Select All Companies</span>
                                    </label>
                                    <div className="purchase-branch-divider"></div>
                                    {assignedCompanies
                                      .filter(comp => String(comp).toLowerCase().includes((supplierForm.companySearchTerm || '').toLowerCase()))
                                      .map((comp, cIdx) => (
                                      <label key={cIdx} className="purchase-branch-option">
                                        <input
                                          type="checkbox"
                                          checked={supplierForm.target_companies && supplierForm.target_companies.includes(comp)}
                                          onChange={() => {
                                            const current = supplierForm.target_companies || [];
                                            if (current.includes(comp)) {
                                              setSupplierForm({ ...supplierForm, target_companies: current.filter(c => c !== comp) });
                                            } else {
                                              setSupplierForm({ ...supplierForm, target_companies: [...current, comp] });
                                            }
                                          }}
                                        />
                                        <span>{comp}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {(showBranchSelector) && (
                          <div className="purchase-form-field">
                            <label className="purchase-label">Branch <span className="mandatory-star">*</span></label>
                            <div className="purchase-branch-filter-container">
                              <div
                                className={`purchase-branch-filter-trigger ${supplierForm.isBranchDropdownOpen ? 'active' : ''}`}
                                onClick={toggleBranchDropdownForSupplier}
                              >
                                <span>
                                  {(!supplierForm.branch_name || supplierForm.branch_name.length === 0)
                                    ? 'All Branches'
                                    : supplierForm.branch_name.length === 1
                                      ? supplierForm.branch_name[0]
                                      : `${supplierForm.branch_name.length} Branches`}
                                </span>
                                <span style={{ fontSize: '10px' }}>{supplierForm.isBranchDropdownOpen ? '▲' : '▼'}</span>
                              </div>
                              {supplierForm.isBranchDropdownOpen && (
                                <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                  <div className="purchase-branch-dropdown-header">
                                    <span>Select Branches</span>
                                    <button type="button" onClick={toggleBranchDropdownForSupplier}><FaTimes /></button>
                                  </div>
                                  <div className="purchase-branch-search">
                                    <input
                                      type="text"
                                      placeholder="Search branches..."
                                      value={supplierForm.branchSearchTerm || ''}
                                      onChange={(e) => setSupplierForm({ ...supplierForm, branchSearchTerm: e.target.value })}
                                      className="purchase-branch-search-input"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="purchase-branch-options">
                                    <label className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={!supplierForm.branch_name || supplierForm.branch_name.length === 0}
                                        onChange={() => handleBranchChangeForSupplier('all')}
                                      />
                                      <span>All Branches (Global/Generic)</span>
                                    </label>
                                    <label className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={availableBranches.length > 0 && availableBranches.every(br => (supplierForm.branch_name || []).includes(br))}
                                        onChange={() => handleBranchChangeForSupplier('select_all_visible')}
                                      />
                                      <span>Select All Available</span>
                                    </label>
                                    <div className="purchase-branch-divider"></div>
                                    {availableBranches
                                      .filter(br => String(br).toLowerCase().includes((supplierForm.branchSearchTerm || '').toLowerCase()))
                                      .map((br, bIdx) => (
                                      <label key={bIdx} className="purchase-branch-option">
                                        <input
                                          type="checkbox"
                                          checked={supplierForm.branch_name && supplierForm.branch_name.includes(br)}
                                          onChange={() => handleBranchChangeForSupplier(br)}
                                        />
                                        <span>{br}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="purchase-form-field">
                          <label className="purchase-label">Default Currency</label>
                          <SearchableSelect
                            options={currencyOptions.map(c => c.display)}
                            value={currencyOptions.find(c => c.code === supplierForm.currency)?.display || supplierForm.currency}
                            onChange={(val) => {
                              const code = currencyOptions.find(c => c.display === val)?.code || val;
                              setSupplierForm({ ...supplierForm, currency: code });
                            }}
                            placeholder="Search Currency"
                          />
                        </div>
                      </div>
                    )}
                    {activeSection === 'tax' && (
                      <div className="purchase-supplier-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="purchase-form-field"><label className="purchase-label">Tax ID / VAT / TRN</label><input type="text" value={supplierForm.taxId} onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })} className="purchase-input" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Tax Category</label><input type="text" value={supplierForm.taxCategory} onChange={(e) => setSupplierForm({ ...supplierForm, taxCategory: e.target.value })} className="purchase-input" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Tax Withholding Category</label><input type="text" value={supplierForm.taxWithholdingCategory} onChange={(e) => setSupplierForm({ ...supplierForm, taxWithholdingCategory: e.target.value })} className="purchase-input" /></div>
                      </div>
                    )}
                    {activeSection === 'address_contact' && (
                      <div className="purchase-supplier-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {supplierForm.contacts.map((contact, idx) => (
                          <div key={idx} className="purchase-contact-block" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="purchase-form-field"><label className="purchase-label">Contact Person {idx + 1}</label><input type="text" value={contact.contactPerson} onChange={(e) => handleContactChange(idx, 'contactPerson', e.target.value)} className="purchase-input" /></div>
                            <div className="purchase-form-field"><label className="purchase-label">Designation {idx + 1}</label><input type="text" value={contact.designation || ''} onChange={(e) => handleContactChange(idx, 'designation', e.target.value)} className="purchase-input" /></div>
                            <div className="purchase-form-field">
                              <label className="purchase-label">Phone {idx + 1}</label>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <select
                                  value={contact.phoneCode || '+971'}
                                  onChange={(e) => handleContactChange(idx, 'phoneCode', e.target.value)}
                                  className="purchase-input select"
                                  style={{ width: '80px' }}
                                >
                                  {isdCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                                <input type="tel" value={contact.phone} onChange={(e) => handleContactChange(idx, 'phone', e.target.value)} className="purchase-input" style={{ flex: 1 }} />
                              </div>
                            </div>
                            <div className="purchase-form-field">
                              <label className="purchase-label">WhatsApp No. {idx + 1}</label>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <select
                                  value={contact.whatsappCode || '+971'}
                                  onChange={(e) => handleContactChange(idx, 'whatsappCode', e.target.value)}
                                  className="purchase-input select"
                                  style={{ width: '80px' }}
                                >
                                  {isdCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                                <input type="tel" value={contact.whatsapp} onChange={(e) => handleContactChange(idx, 'whatsapp', e.target.value)} className="purchase-input" style={{ flex: 1 }} />
                              </div>
                            </div>
                            <div className="purchase-form-field"><label className="purchase-label">Email {idx + 1}</label><input type="email" value={contact.email} onChange={(e) => handleContactChange(idx, 'email', e.target.value)} className="purchase-input" /></div>
                            <div className="purchase-form-field">
                              <label className="purchase-label">Address {idx + 1}</label>
                              <textarea
                                value={contact.address}
                                onChange={(e) => handleContactChange(idx, 'address', e.target.value)}
                                className="purchase-input textarea"
                                rows="3"
                                style={{ resize: 'vertical' }}
                              />
                            </div>
                            <div className="purchase-form-field" style={{ gridColumn: '1 / -1', justifyContent: 'flex-end', display: 'flex' }}>
                              <button type="button" onClick={() => removeContact(idx)} className="purchase-button delete" disabled={supplierForm.contacts.length === 1}>Remove Contact</button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={addContact} className="purchase-button add-row"><FaPlus /> Add Contact</button>
                      </div>
                    )}
                    {activeSection === 'accounting' && (
                      <div className="purchase-supplier-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="purchase-form-field">
                          <label className="purchase-label">Preferred Payment Mode</label>
                          <select value={supplierForm.paymentMode} onChange={(e) => setSupplierForm({ ...supplierForm, paymentMode: e.target.value })} className="purchase-input select">
                            <option value="">Select Preferred Payment Mode</option>
                            {paymentModeOptions.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                          </select>
                        </div>
                        <div className="purchase-form-field">
                          <label className="purchase-label">Payment Terms</label>
                          <select value={supplierForm.paymentTerms} onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })} className="purchase-input select">
                            <option value="">Select Payment Terms</option>
                            {paymentTermsOptions.map(term => <option key={term} value={term}>{term}</option>)}
                          </select>
                        </div>
                        <div className="purchase-form-field"><label className="purchase-label">Credit Limit</label><input type="number" value={supplierForm.creditLimit} onChange={(e) => setSupplierForm({ ...supplierForm, creditLimit: Number(e.target.value) })} className="purchase-input" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Payment Terms Override</label><input type="text" value={supplierForm.paymentTermsOverride} onChange={(e) => setSupplierForm({ ...supplierForm, paymentTermsOverride: e.target.value })} className="purchase-input" /></div>
                      </div>
                    )}
                    {activeSection === 'settings' && (
                      <div className="purchase-supplier-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="purchase-form-field"><label className="purchase-label">Bank Details (Account No., IBAN, SWIFT)</label><textarea value={supplierForm.bankDetails} onChange={(e) => setSupplierForm({ ...supplierForm, bankDetails: e.target.value })} className="purchase-input textarea" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Website</label><input type="url" value={supplierForm.website} onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })} className="purchase-input" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">On-Time Delivery %</label><input type="number" value={supplierForm.onTimeDelivery} onChange={(e) => setSupplierForm({ ...supplierForm, onTimeDelivery: Number(e.target.value) })} className="purchase-input" min="0" max="100" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Defect Rate %</label><input type="number" value={supplierForm.defectRate} onChange={(e) => setSupplierForm({ ...supplierForm, defectRate: Number(e.target.value) })} className="purchase-input" min="0" max="100" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Last Purchase Date</label><input type="date" value={supplierForm.lastPurchaseDate} onChange={(e) => setSupplierForm({ ...supplierForm, lastPurchaseDate: e.target.value })} className="purchase-input" /></div>
                        <div className="purchase-form-field"><label className="purchase-label">Last Purchase Value</label><input type="number" value={supplierForm.lastPurchaseValue} onChange={(e) => setSupplierForm({ ...supplierForm, lastPurchaseValue: Number(e.target.value) })} className="purchase-input" /></div>
                      </div>
                    )}
                  </div>
                  {showSupplierModal && (
                    <div className="purchase-modal-overlay" onClick={() => setShowSupplierModal(false)}>
                      <div className="purchase-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="purchase-modal-close" onClick={() => setShowSupplierModal(false)}><FaTimes /></button>
                        <h3>Suppliers List</h3>
                        <div className="purchase-table-wrapper">
                          <table className="purchase-table">
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Company Name</th>

                                <th>Group</th>
                                <th>Country</th>
                                <th>Currency</th>
                                <th>Tax ID</th>
                                <th>Contacts</th>
                                <th>Last Purchase Date</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredSuppliers.map(supplier => (
                                <tr key={supplier._id}>
                                  <td>{supplier.code}</td>
                                  <td>{supplier.company}</td>

                                  <td>{supplier.group}</td>
                                  <td>{supplier.country}</td>
                                  <td>{supplier.currency}</td>
                                  <td>{supplier.taxId}</td>
                                  <td>{Array.isArray(supplier.contacts) ? supplier.contacts.map(c => `${c.contactPerson} (${c.designation ? c.designation + ', ' : ''}${c.phoneCode || ''} ${c.phone}, ${c.address})`).join(', ') : ''}</td>
                                  <td>{supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : '-'}</td>
                                  <td className="purchase-action-buttons">
                                    <button onClick={() => {
                                      setEditingSupplier(supplier);
                                      setShowSupplierModal(false);
                                    }} className="purchase-button edit"><FaEdit /> Edit</button>
                                    <button onClick={() => deleteSupplier(supplier._id)} className="purchase-button delete"><FaTrash /> Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'order' && (
                <div className="purchase-section">
                  <div className="purchase-header">
                    <h3>Purchase Order</h3>
                    <div className="purchase-filter-group-right">
                    </div>
                  </div>
                  <div className="purchase-main">
                    <div className="purchase-form-grid">
                      <div className="purchase-form-field">
                        <label className="purchase-label">Serial No *</label>
                        <input
                          type="text"
                          value={poForm.series}
                          onChange={(e) => handlePoFormChange('series', e.target.value)}
                          className="purchase-input"
                          required
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Date *</label>
                        <input
                          type="date"
                          value={poForm.date}
                          onChange={(e) => handlePoFormChange('date', e.target.value)}
                          className="purchase-input"
                          required
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Supplier *</label>
                        <select
                          value={poForm.supplierId}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'create_new') {
                              setCreatingSupplierForPo(true);
                              setActiveTab('supplier');
                              return;
                            }
                            const supplier = suppliers.find(s => s._id === value);
                            if (supplier) {
                              const contact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' };
                              setCurrentPoSupplier(supplier);
                              
                              // --- RESOLVE SUPPLIER GROUP NAME ---
                              const groupRecord = supplierGroups.find(g => g._id === supplier.group || g.group_name === supplier.group);
                              const groupName = groupRecord ? groupRecord.group_name : (supplier.group || '');

                              setPoForm(prev => ({
                                ...prev,
                                supplierId: value,
                                supplierCode: supplier.code,
                                supplierGroup: groupName, 
                                name: supplier.company,
                                supplierCompany: supplier.company,
                                address: contact.address,
                                phone: contact.phone,
                                email: contact.email,
                                currency: supplier.currency,
                                items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }]
                              }));
                            } else {
                              setCurrentPoSupplier(null);
                              setPoForm(prev => ({
                                ...prev,
                                supplierId: '',
                                supplierCode: '',
                                supplierGroup: '',
                                name: '',
                                supplierCompany: '',
                                address: '',
                                phone: '',
                                email: '',
                                items: [{ itemId: '', quantity: '', uom: 'master', rate: '', amount: 0 }]
                              }));
                            }
                          }}
                          className="purchase-input select"
                          required
                          disabled={poForm.items.some(i => i.itemId)}
                        >
                          <option value="">Select Supplier</option>
                          {suppliers
                            .filter(s => !poForm.supplierGroup || s.group === poForm.supplierGroup)
                            .map(s => (
                              <option key={s._id} value={s._id}>{s.company} ({s.code})</option>
                            ))
                          }
                          <option value="create_new">Create New Supplier</option>
                        </select>
                      </div>
                      <div className="purchase-form-field" style={{ display: isFieldVisible("Purchase Order", "supplierCode") ? "" : "none" }}><label className="purchase-label">{getFieldLabel("Purchase Order", "supplierCode", "Supplier Code")}</label><input type="text" value={poForm.supplierCode} disabled className="purchase-input" /></div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Currency</label>
                        <SearchableSelect
                          options={currencyOptions.map(c => c.display)}
                          value={currencyOptions.find(c => c.code === poForm.currency)?.display || poForm.currency}
                          onChange={(val) => {
                            const code = currencyOptions.find(c => c.display === val)?.code || val;
                            setPoForm(prev => ({ ...prev, currency: code }));
                          }}
                          placeholder="Search Currency"
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Supplier Group</label>
                        <select
                          value={poForm.supplierGroup}
                          onChange={(e) => {
                            const groupName = e.target.value;
                            if (groupName === 'create_new') {
                              setShowSupplierGroupModal(true);
                              return;
                            }
                            // Reset supplier when group changes
                            setPoForm(prev => ({
                              ...prev,
                              supplierGroup: groupName,
                              supplierId: '',
                              supplierCode: '',
                              name: '',
                              supplierCompany: '',
                              address: '',
                              phone: '',
                              email: ''
                            }));
                            setCurrentPoSupplier(null);
                          }}
                          className="purchase-input select"
                        >
                          <option value="">All Groups</option>
                          {supplierGroups.map(group => (
                            <option key={group._id} value={group.group_name}>{group.group_name}</option>
                          ))}
                          <option value="create_new">+ Create New Supplier Group</option>
                        </select>
                      </div>
                      {isGroupAdmin && (
                        <div className="purchase-form-field">
                          <label className="purchase-label">Company <span className="mandatory-star">*</span></label>
                          <div className="purchase-branch-filter-container">
                            <div
                              className={`purchase-branch-filter-trigger ${poForm.isCompanyDropdownOpen ? 'active' : ''}`}
                              onClick={toggleCompanyDropdownForPo}
                            >
                              <span>
                                {(!poForm.company || (Array.isArray(poForm.company) ? poForm.company.length === 0 : !poForm.company))
                                  ? 'Select Company'
                                  : Array.isArray(poForm.company)
                                    ? poForm.company.length === 1
                                      ? poForm.company[0]
                                      : 'Companies'
                                    : poForm.company}
                              </span>
                              <span style={{ fontSize: '10px' }}>{poForm.isCompanyDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {poForm.isCompanyDropdownOpen && (
                              <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div className="purchase-branch-dropdown-header">
                                  <span>Select Company</span>
                                  <button type="button" onClick={toggleCompanyDropdownForPo}><FaTimes /></button>
                                </div>
                                <div className="purchase-branch-options">
                                  {assignedCompanies.map((comp, cIdx) => (
                                    <label key={cIdx} className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(poForm.company) ? poForm.company.includes(comp) : poForm.company === comp}
                                        onChange={() => handleCompanyChangeForPo(comp)}
                                      />
                                      <span>{comp}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(isGroupAdmin || !isGroupAdmin) && (
                        <div className="purchase-form-field">
                          <label className="purchase-label">Branch <span className="mandatory-star">*</span></label>
                          <div className="purchase-branch-filter-container">
                            <div
                              className={`purchase-branch-filter-trigger ${poForm.isBranchDropdownOpen ? 'active' : ''}`}
                              onClick={toggleBranchDropdownForPo}
                            >
                              <span>
                                {(!poForm.branch_name || (Array.isArray(poForm.branch_name) ? poForm.branch_name.length === 0 : !poForm.branch_name))
                                  ? 'Select Branch'
                                  : Array.isArray(poForm.branch_name)
                                    ? poForm.branch_name.length === 1
                                      ? poForm.branch_name[0]
                                      : `${poForm.branch_name.length} Branches`
                                    : poForm.branch_name}
                              </span>
                              <span style={{ fontSize: '10px' }}>{poForm.isBranchDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {poForm.isBranchDropdownOpen && (
                              <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div className="purchase-branch-dropdown-header">
                                  <span>Select Branch</span>
                                  <button type="button" onClick={toggleBranchDropdownForPo}><FaTimes /></button>
                                </div>
                                <div className="purchase-branch-options">
                                  <label className="purchase-branch-option select-all">
                                    <input
                                      type="checkbox"
                                      checked={availableBranches.length > 0 && availableBranches.every(br => (poForm.branch_name || []).includes(br))}
                                      onChange={() => handleBranchChangeForPo('all')}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  {availableBranches.map((br, bIdx) => (
                                    <label key={bIdx} className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(poForm.branch_name) ? poForm.branch_name.includes(br) : poForm.branch_name === br}
                                        onChange={() => handleBranchChangeForPo(br)}
                                      />
                                      <span>{br}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <h3>Items</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          {renderDynamicHeaders('Purchase Order Item', (
                            <>
                              <th>No</th>
                              <th>Item Code *</th>
                              <th>Quantity *</th>
                              <th>UOM *</th>
                              <th>Rate (${poForm.currency})</th>
                              <th>Amount (${poForm.currency})</th>
                              <th>Actions</th>
                            </>
                          ), { currency: poForm.currency })}
                        </tr>
                      </thead>
                      <tbody>
                        {poForm.items.map((item, index) => {
                          const selectedItem = items.find(i => i._id === item.itemId);
                          const uomDisplay = item.uom === 'master' ? (selectedItem ? selectedItem.masterUnit : 'Master') :
                            item.uom === 'outer' ? (selectedItem ? selectedItem.outerUnit : 'Outer') :
                              item.uom === 'nos' ? (selectedItem ? selectedItem.nosUnit : 'Nos') : 'Grams';
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Order Item'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'itemId' }, { id: 'quantity' }, { id: 'uom' }, { id: 'rate' }, { id: 'amount' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'itemId':
                                    case 'item_code':
                                      return (
                                        <td key={f.id}>
                                          <div className="purchase-item-select">
                                            <select
                                              value={item.itemId}
                                              onChange={(e) => handlePoItemChange(index, 'itemId', e.target.value)}
                                              className="purchase-input select"
                                              required={isFieldMandatory('Purchase Order Item', f.id)}
                                              disabled={!poForm.supplierId}
                                            >
                                              <option value="">Select Item</option>
                                              {items
                                                .filter(i => {
                                                  if (!poForm.supplierId) return false;
                                                  const assignedSuppliers = i.suppliers || [];
                                                  if (assignedSuppliers.length === 0) return true; // Allow items without assigned suppliers
                                                  return assignedSuppliers.some(s =>
                                                    s.supplierId === poForm.supplierId ||
                                                    s.supplierName === poForm.supplierCompany
                                                  );
                                                })
                                                .map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                                              <option value="create_new">Create New Item</option>
                                            </select>
                                            {item.itemId && (
                                              <button onClick={() => {
                                                setEditingItem(selectedItem);
                                                setEditingFrom('order');
                                                setActiveTab('item');
                                              }} className="purchase-button edit">
                                                <FaEdit />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    case 'quantity':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handlePoItemChange(index, 'quantity', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Order Item', 'quantity')}
                                          />
                                        </td>
                                      );
                                    case 'uom':
                                      return (
                                        <td key={f.id}>
                                          <select
                                            value={item.uom}
                                            onChange={(e) => handlePoItemChange(index, 'uom', e.target.value)}
                                            className="purchase-input select"
                                            required={isFieldMandatory('Purchase Order Item', 'uom')}
                                          >
                                            <option value="master">{selectedItem ? selectedItem.masterUnit : 'Master'}</option>
                                            <option value="outer">{selectedItem ? selectedItem.outerUnit : 'Outer'}</option>
                                            <option value="nos">{selectedItem ? selectedItem.nosUnit : 'Nos'}</option>
                                            <option value="grams">Grams</option>
                                          </select>
                                        </td>
                                      );
                                    case 'rate':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={item.rate === 0 ? '' : item.rate}
                                            onChange={(e) => handlePoItemChange(index, 'rate', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Order Item', 'rate')}
                                          />
                                        </td>
                                      );
                                    case 'amount':
                                      return (
                                        <td key={f.id} className="purchase-calculated">
                                          {poForm.currency} {(item.amount || 0).toFixed(2)}
                                        </td>
                                      );
                                    default:
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type={f.type === 'Number' ? 'number' : 'text'}
                                            value={item[f.id] || ''}
                                            onChange={(e) => handlePoItemChange(index, f.id, e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Order Item', f.id)}
                                          />
                                        </td>
                                      );
                                  }
                                });
                              })()}
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removePoItem(index)}
                                  className="purchase-button delete"
                                  disabled={poForm.items.length === 1}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="purchase-form-buttons">
                      <button type="button" onClick={addPoItem} className="purchase-button add-row">
                        Add Row
                      </button>
                    </div>
                    <div className="purchase-totals">
                      <div>Total Quantity: {poForm.totalQuantity}</div>
                    </div>
                    <h3>Purchase Taxes and Charges</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          {renderDynamicHeaders('Purchase Taxes and Charges', (
                            <>
                              <th>No.</th>
                              <th>Type *</th>
                              <th>Tax Rate</th>
                              <th>Amount (${poForm.currency})</th>
                              <th>Total (${poForm.currency})</th>
                              <th>Actions</th>
                            </>
                          ), { currency: poForm.currency })}
                        </tr>
                      </thead>
                      <tbody>
                        {poForm.taxes.length === 0 ? (
                          <tr>
                            <td colSpan="5">No Data</td>
                          </tr>
                        ) : (
                          poForm.taxes.map((tax, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Taxes and Charges'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'type' }, { id: 'taxRate' }, { id: 'amount' }, { id: 'total' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'tax_template':
                                        return (
                                          <td key={f.id}>
                                            <select
                                              value={tax.tax_template || ''}
                                              onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === 'create_new') {
                                                    setShowTaxMasterModal(true);
                                                    return;
                                                  }
                                                  const selTax = taxes.find(t => t._id === val || t.id === val);
                                                if (selTax) {
                                                  handlePoTaxChange(index, 'tax_template', val);
                                                  handlePoTaxChange(index, 'tax_type', selTax.tax_type);
                                                  handlePoTaxChange(index, 'taxRate', selTax.tax_rate);
                                                  } else {
                                                    handlePoTaxChange(index, 'tax_template', val);
                                                    handlePoTaxChange(index, 'tax_type', '');
                                                    handlePoTaxChange(index, 'taxRate', 0);
                                                }
                                              }}
                                              className="purchase-input select"
                                              required={isFieldMandatory('Purchase Taxes and Charges', 'tax_template')}
                                            >
                                              <option value="">Select Tax Template</option>
                                                <option value="create_new" style={{ fontWeight: 'bold', color: '#16a34a' }}>+ Create New</option>
                                              {taxes.map(t => <option key={t._id} value={t._id}>{t.tax_name} ({t.tax_rate}%)</option>)}
                                            </select>
                                          </td>
                                        );
                                      case 'tax_type':
                                        return (
                                          <td key={f.id}>
                                            <input type="text" value={tax.tax_type || ''} readOnly className="purchase-input disabled" />
                                          </td>
                                        );
                                      case 'tax_rate':
                                      case 'taxRate':
                                        return (
                                          <td key={f.id}>
                                            <input
                                              type="number"
                                              value={tax.taxRate === 0 ? '' : tax.taxRate}
                                              onChange={(e) => handlePoTaxChange(index, 'taxRate', e.target.value)}
                                              className="purchase-input"
                                              required={isFieldMandatory('Purchase Taxes and Charges', 'tax_rate')}
                                            />
                                          </td>
                                        );
                                      case 'tax_amount':
                                      case 'amount':
                                        return (
                                          <td key={f.id} className="purchase-calculated">
                                            {poForm.currency} {(tax.amount || 0).toFixed(2)}
                                          </td>
                                        );
                                      default:
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type={f.type === 'Number' ? 'number' : 'text'}
                                            value={tax[f.id] || ''}
                                            onChange={(e) => handlePoTaxChange(index, f.id, e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Taxes and Charges', f.id)}
                                          />
                                        </td>
                                      );
                                  }
                                });
                              })()}
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removePoTax(index)}
                                  className="purchase-button delete"
                                  disabled={poForm.taxes.length === 1}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <div className="purchase-form-buttons">
                      <button type="button" onClick={addPoTax} className="purchase-button add-row">
                        Add Row
                      </button>
                    </div>
                    <div className="purchase-totals">
                      <div>Total Qty {poForm.commonUOM || 'Carton'} {((poForm.totalQtyInCommon || 0)).toFixed(0)}</div>
                      {(() => {
                        const isExciseSelected = poForm.taxes.some(t => t.tax_type === 'Excise Duty' || (t.tax_template && String(t.tax_template).toLowerCase().includes('excise')));
                        const isVatSelected = poForm.taxes.some(t => t.tax_type === 'VAT' || (t.tax_template && String(t.tax_template).toLowerCase().includes('vat')));
                        const showExcise = isExciseSelected && poForm.exciseDuty > 0;
                        const showVat = isVatSelected && poForm.totalTaxes > 0;
                        return (
                          <>
                            <div>Gross Amount ({poForm.currency}): {poForm.currency} {((poForm.subtotal || 0)).toFixed(2)}</div>
                            {showExcise && <div>Excise Duty ({poForm.currency}): {poForm.currency} {((poForm.exciseDuty || 0)).toFixed(2)}</div>}
                            {showExcise && <div>Taxable Amount ({poForm.currency}): {poForm.currency} {((poForm.taxableAmount || 0)).toFixed(2)}</div>}
                            {showVat && <div>VAT (): {poForm.currency} {((poForm.totalTaxes || 0)).toFixed(2)}</div>}
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginTop: '5px' }}>Net Total ({poForm.currency}): {poForm.currency} {((poForm.grandTotal || 0)).toFixed(2)}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'receipt' && (
                <div className="purchase-section">
                  <div className="purchase-header">
                    <h3>Purchase Receipt</h3>
                    <div className="purchase-filter-group-right">
                    </div>
                  </div>
                  <div className="purchase-form">
                    <div className="purchase-form-grid">
                      <div className="purchase-form-field">
                        <label className="purchase-label">Series *</label>
                        <input
                          type="text"
                          value={prForm.series}
                          onChange={(e) => handlePrFormChange('series', e.target.value)}
                          className="purchase-input"
                          required
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Date *</label>
                        <input
                          type="date"
                          value={prForm.date}
                          onChange={(e) => handlePrFormChange('date', e.target.value)}
                          className="purchase-input"
                          required
                        />
                      </div>
                      {isGroupAdmin && (
                        <div className="purchase-form-field">
                          <label className="purchase-label">Company <span className="mandatory-star">*</span></label>
                          <div className="purchase-branch-filter-container">
                            <div
                              className={`purchase-branch-filter-trigger ${prForm.isCompanyDropdownOpen ? 'active' : ''}`}
                              onClick={toggleCompanyDropdownForPr}
                            >
                              <span>
                                {(!prForm.company || (Array.isArray(prForm.company) ? prForm.company.length === 0 : !prForm.company))
                                  ? 'Select Company'
                                  : Array.isArray(prForm.company)
                                    ? prForm.company.length === 1
                                      ? prForm.company[0]
                                      : 'Companies'
                                    : prForm.company}
                              </span>
                              <span style={{ fontSize: '10px' }}>{prForm.isCompanyDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {prForm.isCompanyDropdownOpen && (
                              <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div className="purchase-branch-dropdown-header">
                                  <span>Select Company</span>
                                  <button type="button" onClick={toggleCompanyDropdownForPr}><FaTimes /></button>
                                </div>
                                <div className="purchase-branch-options">
                                  {assignedCompanies.map((comp, cIdx) => (
                                    <label key={cIdx} className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(prForm.company) ? prForm.company.includes(comp) : prForm.company === comp}
                                        onChange={() => handleCompanyChangeForPr(comp)}
                                      />
                                      <span>{comp}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(isGroupAdmin || !isGroupAdmin) && (
                        <div className="purchase-form-field">
                          <label className="purchase-label">Branch <span className="mandatory-star">*</span></label>
                          <div className="purchase-branch-filter-container">
                            <div
                              className={`purchase-branch-filter-trigger ${prForm.isBranchDropdownOpen ? 'active' : ''}`}
                              onClick={toggleBranchDropdownForPr}
                            >
                              <span>
                                {(!prForm.branch_name || (Array.isArray(prForm.branch_name) ? prForm.branch_name.length === 0 : !prForm.branch_name))
                                  ? 'Select Branch'
                                  : Array.isArray(prForm.branch_name)
                                    ? prForm.branch_name.length === 1
                                      ? prForm.branch_name[0]
                                      : `${prForm.branch_name.length} Branches`
                                    : prForm.branch_name}
                              </span>
                              <span style={{ fontSize: '10px' }}>{prForm.isBranchDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {prForm.isBranchDropdownOpen && (
                              <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div className="purchase-branch-dropdown-header">
                                  <span>Select Branch</span>
                                  <button type="button" onClick={toggleBranchDropdownForPr}><FaTimes /></button>
                                </div>
                                <div className="purchase-branch-options">
                                  <label className="purchase-branch-option select-all">
                                    <input
                                      type="checkbox"
                                      checked={availableBranches.length > 0 && availableBranches.every(br => (prForm.branch_name || []).includes(br))}
                                      onChange={() => handleBranchChangeForPr('all')}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  {availableBranches.map((br, bIdx) => (
                                    <label key={bIdx} className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(prForm.branch_name) ? prForm.branch_name.includes(br) : prForm.branch_name === br}
                                        onChange={() => handleBranchChangeForPr(br)}
                                      />
                                      <span>{br}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="purchase-form-field">
                        <label className="purchase-label">Purchase Order *</label>
                        <select
                          value={prForm.poId}
                          onChange={(e) => {
                            const poId = e.target.value;
                            const po = purchaseOrders.find(p => p.series === poId);
                            if (po) {
                              const supplier = suppliers.find(s => s._id === po.supplierId);
                              const contact = supplier ? (supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' }) : { address: '', phone: '', email: '' };
                              const newItems = po.items.map(item => ({
                                itemId: item.itemId,
                                originalQuantity: item.quantity,
                                acceptedQuantity: item.quantity,
                                rejectedQuantity: 0,
                                rate: item.rate,
                                amount: item.quantity * item.rate,
                                unit: item.uom
                              }));
                              setCurrentPrSupplier(supplier);

                              // --- RESOLVE SUPPLIER GROUP NAME ---
                              const groupRecord = supplierGroups.find(g => g._id === po.supplierGroup || g.group_name === po.supplierGroup);
                              const groupName = groupRecord ? groupRecord.group_name : (po.supplierGroup || '');

                              const newForm = {
                                ...prForm,
                                poId,
                                supplierId: po.supplierId,
                                supplierCode: po.supplierCode,
                                supplierGroup: groupName,
                                name: po.name,
                                supplierCompany: po.supplierCompany,
                                address: contact.address || po.address,
                                phone: contact.phone || po.phone,
                                email: contact.email || po.email,
                                items: newItems,
                                taxes: po.taxes,
                                currency: po.currency
                              };
                              setPrForm({ ...newForm, ...calculatePrTotals(newForm) });
                            }
                          }}
                          className="purchase-input select"
                          required
                        >
                          <option value="">Select PO</option>
                          {purchaseOrders
                            .filter(po => po.status === 'Submitted' && (!prForm.supplierGroup || po.supplierGroup === prForm.supplierGroup))
                            .map(po => (
                              <option key={po.series} value={po.series}>{po.series} ({po.supplierCompany})</option>
                            ))
                          }
                        </select>
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Supplier</label>
                        <input
                          type="text"
                          value={suppliers.find(s => s._id === prForm.supplierId)?.company || ''}
                          disabled
                          className="purchase-input"
                        />
                      </div>
                      <div className="purchase-form-field"><label className="purchase-label">Supplier Code</label><input type="text" value={prForm.supplierCode} disabled className="purchase-input" /></div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Currency</label>
                        <SearchableSelect
                          options={currencyOptions.map(c => c.display)}
                          value={currencyOptions.find(c => c.code === prForm.currency)?.display || prForm.currency}
                          onChange={(val) => {
                            const code = currencyOptions.find(c => c.display === val)?.code || val;
                            setPrForm(prev => ({ ...prev, currency: code }));
                          }}
                          placeholder="Search Currency"
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Supplier Group</label>
                        <select
                          value={prForm.supplierGroup}
                          onChange={(e) => {
                            const groupName = e.target.value;
                            if (groupName === 'create_new') {
                              setShowSupplierGroupModal(true);
                              return;
                            }
                            setPrForm(prev => ({
                              ...prev,
                              supplierGroup: groupName,
                              supplierId: '',
                              supplierCode: '',
                              name: '',
                              supplierCompany: '',
                              address: '',
                              phone: '',
                              email: '',
                              poId: '',
                              items: []
                            }));
                            setCurrentPrSupplier(null);
                          }}
                          className="purchase-input select"
                        >
                          <option value="">All Groups</option>
                          {supplierGroups.map(group => (
                            <option key={group._id} value={group.group_name}>{group.group_name}</option>
                          ))}
                          <option value="create_new">+ Create New Supplier Group</option>
                        </select>
                      </div>
                    </div>
                    <h3>Items</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>Item *</th>
                          <th>Accepted Quantity</th>
                          <th>Rejected Q...</th>
                          <th>Rate (${prForm.currency})</th>
                          <th>Amount (${prForm.currency})</th>
                          <th>UOM</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prForm.items.map((item, index) => {
                          const selectedItem = items.find(i => i._id === item.itemId);
                          const uomDisplay = item.unit === 'master' ? (selectedItem ? selectedItem.masterUnit : 'Master') :
                            item.unit === 'outer' ? (selectedItem ? selectedItem.outerUnit : 'Outer') :
                              item.unit === 'nos' ? (selectedItem ? selectedItem.nosUnit : 'Nos') : 'Grams';
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Receipt Item'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'itemId' }, { id: 'acceptedQuantity' }, { id: 'rejectedQuantity' }, { id: 'rate' }, { id: 'amount' }, { id: 'unit' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'itemId':
                                    case 'item_code':
                                      return (
                                        <td key={f.id}>
                                          <div className="purchase-item-select">
                                            <select
                                              value={item.itemId}
                                              onChange={(e) => handlePrItemChange(index, 'itemId', e.target.value)}
                                              className="purchase-input select"
                                              required={isFieldMandatory('Purchase Receipt Item', f.id)}
                                            >
                                              <option value="">Select Item</option>
                                              {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                                              <option value="create_new">Create New Item</option>
                                            </select>
                                            {item.itemId && (
                                              <button onClick={() => {
                                                setEditingItem(selectedItem);
                                                setEditingFrom('receipt');
                                                setActiveTab('item');
                                              }} className="purchase-button edit">
                                                <FaEdit />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    case 'acceptedQuantity':
                                    case 'accepted_quantity':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={item.acceptedQuantity === 0 ? '' : item.acceptedQuantity}
                                            onChange={(e) => handlePrItemChange(index, 'acceptedQuantity', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Receipt Item', f.id)}
                                          />
                                        </td>
                                      );
                                    case 'rejectedQuantity':
                                    case 'rejected_quantity':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={item.rejectedQuantity === 0 ? '' : item.rejectedQuantity}
                                            onChange={(e) => handlePrItemChange(index, 'rejectedQuantity', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Receipt Item', f.id)}
                                          />
                                        </td>
                                      );
                                    case 'rate':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={item.rate === 0 ? '' : item.rate}
                                            onChange={(e) => handlePrItemChange(index, 'rate', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Receipt Item', 'rate')}
                                          />
                                        </td>
                                      );
                                    case 'amount':
                                      return (
                                        <td key={f.id} className="purchase-calculated">
                                          {prForm.currency} {(item.amount || 0).toFixed(2)}
                                        </td>
                                      );
                                    case 'unit':
                                    case 'uom':
                                      return (
                                        <td key={f.id}>
                                          <select
                                            value={item.unit}
                                            onChange={(e) => handlePrItemChange(index, 'unit', e.target.value)}
                                            className="purchase-input select"
                                            required={isFieldMandatory('Purchase Receipt Item', f.id)}
                                          >
                                            <option value="master">{selectedItem ? selectedItem.masterUnit : 'Master'}</option>
                                            <option value="outer">{selectedItem ? selectedItem.outerUnit : 'Outer'}</option>
                                            <option value="nos">{selectedItem ? selectedItem.nosUnit : 'Nos'}</option>
                                            <option value="grams">Grams</option>
                                          </select>
                                        </td>
                                      );
                                    default:
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type={f.type === 'Number' ? 'number' : 'text'}
                                            value={item[f.id] || ''}
                                            onChange={(e) => handlePrItemChange(index, f.id, e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Receipt Item', f.id)}
                                          />
                                        </td>
                                      );
                                  }
                                });
                              })()}
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removePrItem(index)}
                                  className="purchase-button delete"
                                  disabled={prForm.items.length === 1}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="purchase-form-buttons">
                      <button type="button" onClick={addPrItem} className="purchase-button add-row">
                        Add Row
                      </button>
                    </div>
                    <div className="purchase-totals">
                      <div>Net Total (${prForm.currency}): {prForm.currency} {(prForm.subtotal || 0).toFixed(2)}</div>
                    </div>
                    <h3>Purchase Taxes and Charges</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          {renderDynamicHeaders('Purchase Taxes and Charges', (
                            <>
                              <th>No.</th>
                              <th>Type *</th>
                              <th>Tax Rate</th>
                              <th>Amount (${prForm.currency})</th>
                              <th>Total (${prForm.currency})</th>
                              <th>Actions</th>
                            </>
                          ), { currency: prForm.currency })}
                        </tr>
                      </thead>
                      <tbody>
                        {prForm.taxes.map((tax, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            {(() => {
                              const schema = doctypeSchemas['Purchase Taxes and Charges'];
                              const visibleFields = schema && schema.fields
                                ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                : [{ id: 'type' }, { id: 'taxRate' }, { id: 'amount' }, { id: 'total' }];

                              return visibleFields.map(f => {
                                switch (f.id) {
                                  case 'tax_template':
                                        return (
                                          <td key={f.id}>
                                            <select
                                              value={tax.tax_template || ''}
                                              onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === 'create_new') {
                                                    setShowTaxMasterModal(true);
                                                    return;
                                                  }
                                                  const selTax = taxes.find(t => t._id === val || t.id === val);
                                                if (selTax) {
                                                  handlePrTaxChange(index, 'tax_template', val);
                                                  handlePrTaxChange(index, 'tax_type', selTax.tax_type);
                                                  handlePrTaxChange(index, 'taxRate', selTax.tax_rate);
                                                  } else {
                                                    handlePrTaxChange(index, 'tax_template', val);
                                                    handlePrTaxChange(index, 'tax_type', '');
                                                    handlePrTaxChange(index, 'taxRate', 0);
                                                }
                                              }}
                                              className="purchase-input select"
                                              required={isFieldMandatory('Purchase Taxes and Charges', 'tax_template')}
                                            >
                                              <option value="">Select Tax Template</option>
                                                <option value="create_new" style={{ fontWeight: 'bold', color: '#16a34a' }}>+ Create New</option>
                                              {taxes.map(t => <option key={t._id} value={t._id}>{t.tax_name} ({t.tax_rate}%)</option>)}
                                            </select>
                                          </td>
                                        );
                                      case 'tax_type':
                                        return (
                                          <td key={f.id}>
                                            <input type="text" value={tax.tax_type || ''} readOnly className="purchase-input disabled" />
                                          </td>
                                        );
                                      case 'tax_rate':
                                      case 'taxRate':
                                        return (
                                          <td key={f.id}>
                                            <input
                                              type="number"
                                              value={tax.taxRate === 0 ? '' : tax.taxRate}
                                              onChange={(e) => handlePrTaxChange(index, 'taxRate', e.target.value)}
                                              className="purchase-input"
                                              required={isFieldMandatory('Purchase Taxes and Charges', 'tax_rate')}
                                            />
                                          </td>
                                        );
                                      case 'tax_amount':
                                      case 'amount':
                                        return (
                                          <td key={f.id} className="purchase-calculated">
                                            {prForm.currency} {(tax.amount || 0).toFixed(2)}
                                          </td>
                                        );
                                      default:
                                    return (
                                      <td key={f.id}>
                                        <input
                                          type={f.type === 'Number' ? 'number' : 'text'}
                                          value={tax[f.id] || ''}
                                          onChange={(e) => handlePrTaxChange(index, f.id, e.target.value)}
                                          className="purchase-input"
                                          required={isFieldMandatory('Purchase Taxes and Charges', f.id)}
                                        />
                                      </td>
                                    );
                                }
                              });
                            })()}
                            <td>
                              <button
                                type="button"
                                onClick={() => removePrTax(index)}
                                className="purchase-button delete"
                                disabled={prForm.taxes.length === 1}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="purchase-form-buttons">
                      <button type="button" onClick={addPrTax} className="purchase-button add-row">
                        Add Row
                      </button>
                    </div>
                    <div className="purchase-totals">
                      <div>Total Qty {prForm.commonUOM || 'Carton'} {((prForm.totalQtyInCommon || 0)).toFixed(0)}</div>
                      {(() => {
                        const isExciseSelected = prForm.taxes.some(t => t.tax_type === 'Excise Duty' || (t.tax_template && String(t.tax_template).toLowerCase().includes('excise')));
                        const isVatSelected = prForm.taxes.some(t => t.tax_type === 'VAT' || (t.tax_template && String(t.tax_template).toLowerCase().includes('vat')));
                        const showExcise = isExciseSelected && prForm.exciseDuty > 0;
                        const showVat = isVatSelected && prForm.totalTaxes > 0;
                        return (
                          <>
                            <div>Gross Amount ({prForm.currency}): {prForm.currency} {((prForm.subtotal || 0)).toFixed(2)}</div>
                            {showExcise && <div>Excise Duty ({prForm.currency}): {prForm.currency} {((prForm.exciseDuty || 0)).toFixed(2)}</div>}
                            {showExcise && <div>Taxable Amount ({prForm.currency}): {prForm.currency} {((prForm.taxableAmount || 0)).toFixed(2)}</div>}
                            {showVat && <div>VAT (): {prForm.currency} {((prForm.totalTaxes || 0)).toFixed(2)}</div>}
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginTop: '5px' }}>Net Total ({prForm.currency}): {prForm.currency} {((prForm.grandTotal || 0)).toFixed(2)}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'invoice' && (
                <div className="purchase-section">
                  <div className="purchase-header">
                    <h3>Purchase Invoice</h3>
                    <div className="purchase-filter-group-right">
                    </div>
                  </div>
                  <div className="purchase-form">
                    <div className="purchase-form-grid">
                      <div className="purchase-form-field">
                        <label className="purchase-toggle">
                          <input
                            type="checkbox"
                            checked={piForm.isDirectPurchase}
                            onChange={(e) => {
                              const isDirect = e.target.checked;
                              setPiForm(prev => ({
                                ...prev,
                                isDirectPurchase: isDirect,
                                series: !prev.series ? getNextPiSeries() : prev.series, // Ensure series is set
                                items: [{ itemId: '', acceptedQuantity: 0, quantity: 0, rate: '', amount: 0, unit: 'master' }]
                              }));
                            }}
                          />
                          Direct Purchase Invoice
                        </label>
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Series *</label>
                        <input
                          type="text"
                          value={piForm.series}
                          onChange={(e) => handlePiFormChange('series', e.target.value)}
                          className="purchase-input"
                          required
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Date *</label>
                        <input
                          type="date"
                          value={piForm.date}
                          onChange={(e) => handlePiFormChange('date', e.target.value)}
                          className="purchase-input"
                          required
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Supplier *</label>
                        <select
                          value={piForm.supplierId}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'create_new') {
                              setCreatingSupplierForPi(true);
                              setActiveTab('supplier');
                              return;
                            }
                            const supplier = suppliers.find(s => s._id === value);
                            if (supplier) {
                              const contact = supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' }; // Fallback
                              setCurrentPiSupplier(supplier);

                              // --- RESOLVE SUPPLIER GROUP NAME ---
                              const groupRecord = supplierGroups.find(g => g._id === supplier.group || g.group_name === supplier.group);
                              const groupName = groupRecord ? groupRecord.group_name : (supplier.group || '');

                              setPiForm(prev => ({
                                ...prev,
                                supplierId: value,
                                supplierCode: supplier.code,
                                supplierGroup: groupName,
                                name: supplier.company,
                                supplierCompany: supplier.company,
                                address: contact.address,
                                phone: contact.phone,
                                email: contact.email,
                                items: [{ itemId: '', acceptedQuantity: 0, quantity: 0, rate: '', amount: 0, unit: 'master' }]
                              }));
                            } else {
                              setCurrentPiSupplier(null);
                              setPiForm(prev => ({
                                ...prev,
                                supplierId: '',
                                supplierCode: '',
                                supplierGroup: '',
                                name: '',
                                supplierCompany: '',
                                address: '',
                                phone: '',
                                email: '',
                                items: [{ itemId: '', acceptedQuantity: 0, quantity: 0, rate: '', amount: 0, unit: 'master' }]
                              }));
                            }
                          }}
                          className="purchase-input select"
                          required
                          disabled={(!piForm.isDirectPurchase && !piForm.prId) || (piForm.isDirectPurchase && piForm.items.some(i => i.itemId))}
                        >
                          <option value="">Select Supplier</option>
                          {suppliers.map(s => <option key={s._id} value={s._id}>{s.company}</option>)}
                          <option value="create_new">Create New Supplier</option>
                        </select>
                      </div>
                      <div className="purchase-form-field"><label className="purchase-label">Supplier Code</label><input type="text" value={piForm.supplierCode} disabled className="purchase-input" /></div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Currency</label>
                        <SearchableSelect
                          options={currencyOptions.map(c => c.display)}
                          value={currencyOptions.find(c => c.code === piForm.currency)?.display || piForm.currency}
                          onChange={(val) => {
                            const code = currencyOptions.find(c => c.display === val)?.code || val;
                            setPiForm(prev => ({ ...prev, currency: code }));
                          }}
                          placeholder="Search Currency"
                        />
                      </div>
                      <div className="purchase-form-field">
                        <label className="purchase-label">Supplier Group</label>
                        <select
                          value={piForm.supplierGroup}
                          onChange={(e) => {
                            const groupName = e.target.value;
                            if (groupName === 'create_new') {
                              setShowSupplierGroupModal(true);
                              return;
                            }
                            setPiForm(prev => ({
                              ...prev,
                              supplierGroup: groupName,
                              supplierId: '',
                              supplierCode: '',
                              name: '',
                              supplierCompany: '',
                              address: '',
                              phone: '',
                              email: '',
                              poId: '',
                              prId: '',
                              items: []
                            }));
                            setCurrentPiSupplier(null);
                          }}
                          className="purchase-input select"
                        >
                          <option value="">All Groups</option>
                          {supplierGroups.map(group => (
                            <option key={group._id} value={group.group_name}>{group.group_name}</option>
                          ))}
                          <option value="create_new">+ Create New Supplier Group</option>
                        </select>
                      </div>

                      {!piForm.isDirectPurchase && (
                        <>
                          <div className="purchase-form-field">
                            <label className="purchase-label">Purchase Order</label>
                            <select
                              value={piForm.poId}
                              onChange={(e) => {
                                const poId = e.target.value;
                                const po = purchaseOrders.find(p => p.series === poId);
                                if (po) {
                                  const supplier = suppliers.find(s => s._id === po.supplierId);
                                  const contact = supplier ? (supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' }) : { address: '', phone: '', email: '' };
                                  const newItems = po.items.map(item => ({
                                    itemId: item.itemId,
                                    acceptedQuantity: item.quantity,
                                    quantity: item.quantity,
                                    rate: item.rate,
                                    amount: item.quantity * item.rate,
                                    unit: item.uom || 'master'
                                  }));
                                  setCurrentPiSupplier(supplier);
                                  
                                  // --- RESOLVE SUPPLIER GROUP NAME ---
                                  const groupRecord = supplierGroups.find(g => g._id === po.supplierGroup || g.group_name === po.supplierGroup);
                                  const groupName = groupRecord ? groupRecord.group_name : (po.supplierGroup || '');

                                  const newForm = {
                                    ...piForm,
                                    poId,
                                    prId: '',
                                    supplierId: po.supplierId,
                                    supplierCode: po.supplierCode,
                                    supplierGroup: groupName,
                                    name: po.name,
                                    supplierCompany: po.supplierCompany,
                                    address: contact.address || po.address,
                                    phone: contact.phone || po.phone,
                                    email: contact.email || po.email,
                                    items: newItems,
                                    taxes: po.taxes,
                                    currency: po.currency
                                  };
                                  setPiForm({ ...newForm, ...calculatePiTotals(newForm) });
                                } else {
                                  handlePiFormChange('poId', poId);
                                }
                              }}
                              className="purchase-input select"
                            >
                              <option value="">Select PO</option>
                              {purchaseOrders
                                .filter(po => po.status === 'Submitted' && (!piForm.supplierGroup || po.supplierGroup === piForm.supplierGroup))
                                .map(po => (
                                  <option key={po.series} value={po.series}>{po.series} ({po.supplierCompany})</option>
                                ))
                              }
                            </select>
                          </div>
                          <div className="purchase-form-field">
                            <label className="purchase-label">Purchase Receipt *</label>
                            <select
                              value={piForm.prId}
                              onChange={(e) => {
                                const prId = e.target.value;
                                const pr = purchaseReceipts.find(p => p.series === prId);
                                if (pr) {
                                  const supplier = suppliers.find(s => s._id === pr.supplierId);
                                  const contact = supplier ? (supplier.contacts && supplier.contacts.length > 0 ? supplier.contacts[0] : { address: '', phone: '', email: '' }) : { address: '', phone: '', email: '' };
                                  const newItems = pr.items.map(item => ({
                                    itemId: item.itemId,
                                    acceptedQuantity: item.acceptedQuantity,
                                    rate: item.rate,
                                    amount: item.acceptedQuantity * item.rate,
                                    unit: item.unit
                                  }));
                                  setCurrentPiSupplier(supplier);
                                  
                                  // --- RESOLVE SUPPLIER GROUP NAME ---
                                  const groupRecord = supplierGroups.find(g => g._id === pr.supplierGroup || g.group_name === pr.supplierGroup);
                                  const groupName = groupRecord ? groupRecord.group_name : (pr.supplierGroup || '');

                                  const newForm = {
                                    ...piForm,
                                    prId,
                                    poId: pr.poId,
                                    supplierId: pr.supplierId,
                                    supplierCode: pr.supplierCode,
                                    supplierGroup: groupName,
                                    name: pr.name,
                                    supplierCompany: pr.supplierCompany,
                                    address: contact.address || pr.address,
                                    phone: contact.phone || pr.phone,
                                    email: contact.email || pr.email,
                                    items: newItems,
                                    taxes: pr.taxes,
                                    currency: pr.currency
                                  };
                                  setPiForm({ ...newForm, ...calculatePiTotals(newForm) });
                                }
                              }}
                              className="purchase-input select"
                              required
                            >
                              <option value="">Select PR</option>
                              {purchaseReceipts.filter(pr => pr.status === 'Submitted').map(pr => (
                                <option key={pr.series} value={pr.series}>{pr.series}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                      {isGroupAdmin && (
                        <div className="purchase-form-field">
                          <label className="purchase-label">Company <span className="mandatory-star">*</span></label>
                          <div className="purchase-branch-filter-container">
                            <div
                              className={`purchase-branch-filter-trigger ${piForm.isCompanyDropdownOpen ? 'active' : ''}`}
                              onClick={toggleCompanyDropdownForPi}
                            >
                              <span>
                                {(!piForm.company || (Array.isArray(piForm.company) ? piForm.company.length === 0 : !piForm.company))
                                  ? 'Select Company'
                                  : Array.isArray(piForm.company)
                                    ? piForm.company.length === 1
                                      ? piForm.company[0]
                                      : 'Companies'
                                    : piForm.company}
                              </span>
                              <span style={{ fontSize: '10px' }}>{piForm.isCompanyDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {piForm.isCompanyDropdownOpen && (
                              <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div className="purchase-branch-dropdown-header">
                                  <span>Select Company</span>
                                  <button type="button" onClick={toggleCompanyDropdownForPi}><FaTimes /></button>
                                </div>
                                <div className="purchase-branch-options">
                                  {assignedCompanies.map((comp, cIdx) => (
                                    <label key={cIdx} className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(piForm.company) ? piForm.company.includes(comp) : piForm.company === comp}
                                        onChange={() => handleCompanyChangeForPi(comp)}
                                      />
                                      <span>{comp}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(isGroupAdmin || !isGroupAdmin) && (
                        <div className="purchase-form-field">
                          <label className="purchase-label">Branch <span className="mandatory-star">*</span></label>
                          <div className="purchase-branch-filter-container">
                            <div
                              className={`purchase-branch-filter-trigger ${piForm.isBranchDropdownOpen ? 'active' : ''}`}
                              onClick={toggleBranchDropdownForPi}
                            >
                              <span>
                                {(!piForm.branch_name || (Array.isArray(piForm.branch_name) ? piForm.branch_name.length === 0 : !piForm.branch_name))
                                  ? 'Select Branch'
                                  : Array.isArray(piForm.branch_name)
                                    ? piForm.branch_name.length === 1
                                      ? piForm.branch_name[0]
                                      : `${piForm.branch_name.length} Branches`
                                    : piForm.branch_name}
                              </span>
                              <span style={{ fontSize: '10px' }}>{piForm.isBranchDropdownOpen ? '▲' : '▼'}</span>
                            </div>
                            {piForm.isBranchDropdownOpen && (
                              <div className="purchase-branch-dropdown" style={{ right: 'auto', left: 0, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <div className="purchase-branch-dropdown-header">
                                  <span>Select Branch</span>
                                  <button type="button" onClick={toggleBranchDropdownForPi}><FaTimes /></button>
                                </div>
                                <div className="purchase-branch-options">
                                  <label className="purchase-branch-option select-all">
                                    <input
                                      type="checkbox"
                                      checked={availableBranches.length > 0 && availableBranches.every(br => (piForm.branch_name || []).includes(br))}
                                      onChange={() => handleBranchChangeForPi('all')}
                                    />
                                    <span>Select All</span>
                                  </label>
                                  {availableBranches.map((br, bIdx) => (
                                    <label key={bIdx} className="purchase-branch-option">
                                      <input
                                        type="checkbox"
                                        checked={Array.isArray(piForm.branch_name) ? piForm.branch_name.includes(br) : piForm.branch_name === br}
                                        onChange={() => handleBranchChangeForPi(br)}
                                      />
                                      <span>{br}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <h3>Items</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>Item *</th>
                          <th>Accepted Quantity *</th>
                          <th>UOM</th>
                          <th>Rate (${piForm.currency})</th>
                          <th>Amount (${piForm.currency})</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {piForm.items.map((item, index) => {
                          const selectedItem = items.find(i => i._id === item.itemId);
                          const uomDisplay = item.unit === 'master' ? (selectedItem ? selectedItem.masterUnit : 'Master') :
                            item.unit === 'outer' ? (selectedItem ? selectedItem.outerUnit : 'Outer') :
                              item.unit === 'nos' ? (selectedItem ? selectedItem.nosUnit : 'Nos') : 'Grams';
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Invoice Item'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'itemId' }, { id: 'acceptedQuantity' }, { id: 'unit' }, { id: 'rate' }, { id: 'amount' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'itemId':
                                    case 'item_code':
                                      return (
                                        <td key={f.id}>
                                          <div className="purchase-item-select">
                                            <select
                                              value={item.itemId}
                                              onChange={(e) => handlePiItemChange(index, 'itemId', e.target.value)}
                                              className="purchase-input select"
                                              required={isFieldMandatory('Purchase Invoice Item', f.id)}
                                              disabled={!piForm.isDirectPurchase || !piForm.supplierId}
                                            >
                                              <option value="">Select Item</option>
                                              {items
                                                .filter(i => !piForm.isDirectPurchase || (piForm.supplierId && i.suppliers && Array.isArray(i.suppliers) && i.suppliers.some(s => s.supplierId === piForm.supplierId || s.supplierName === piForm.supplierCompany)))
                                                .map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                                              <option value="create_new">Create New Item</option>
                                            </select>
                                            {item.itemId && (
                                              <button onClick={() => {
                                                setEditingItem(selectedItem);
                                                setEditingFrom('invoice');
                                                setActiveTab('item');
                                              }} className="purchase-button edit">
                                                <FaEdit />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    case 'quantity':
                                    case 'acceptedQuantity':
                                    case 'accepted_quantity':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={piForm.isDirectPurchase ? (item.quantity === 0 ? '' : item.quantity) : (item.acceptedQuantity === 0 ? '' : item.acceptedQuantity)}
                                            onChange={(e) => handlePiItemChange(index, piForm.isDirectPurchase ? 'quantity' : 'acceptedQuantity', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Invoice Item', f.id)}
                                            disabled={!piForm.isDirectPurchase}
                                          />
                                        </td>
                                      );
                                    case 'unit':
                                    case 'uom':
                                      return (
                                        <td key={f.id}>
                                          <select
                                            value={item.unit}
                                            onChange={(e) => handlePiItemChange(index, 'unit', e.target.value)}
                                            className="purchase-input select"
                                            required={isFieldMandatory('Purchase Invoice Item', f.id)}
                                          >
                                            <option value="master">{selectedItem ? selectedItem.masterUnit : 'Master'}</option>
                                            <option value="outer">{selectedItem ? selectedItem.outerUnit : 'Outer'}</option>
                                            <option value="nos">{selectedItem ? selectedItem.nosUnit : 'Nos'}</option>
                                            <option value="grams">Grams</option>
                                          </select>
                                        </td>
                                      );
                                    case 'rate':
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type="number"
                                            value={item.rate === 0 ? '' : item.rate}
                                            onChange={(e) => handlePiItemChange(index, 'rate', e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Invoice Item', 'rate')}
                                          />
                                        </td>
                                      );
                                    case 'amount':
                                      return (
                                        <td key={f.id} className="purchase-calculated">
                                          {piForm.currency} {(item.amount || 0).toFixed(2)}
                                        </td>
                                      );
                                    default:
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type={f.type === 'Number' ? 'number' : 'text'}
                                            value={item[f.id] || ''}
                                            onChange={(e) => handlePiItemChange(index, f.id, e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Invoice Item', f.id)}
                                          />
                                        </td>
                                      );
                                  }
                                });
                              })()}
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removePiItem(index)}
                                  className="purchase-button delete"
                                  disabled={piForm.items.length === 1}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="purchase-form-buttons">
                      <button type="button" onClick={addPiItem} className="purchase-button add-row">
                        Add Row
                      </button>
                    </div>
                    <div className="purchase-totals">
                      <div>Net Total ({piForm.currency}): {piForm.currency} {(piForm.subtotal || 0).toFixed(2)}</div>
                    </div>
                    <h3>Purchase Taxes and Charges</h3>
                    <table className="purchase-table">
                      <thead>
                        <tr>
                          {renderDynamicHeaders('Purchase Taxes and Charges', (
                            <>
                              <th>No.</th>
                              <th>Type *</th>
                              <th>Tax Rate</th>
                              <th>Amount (${piForm.currency})</th>
                              <th>Total (${piForm.currency})</th>
                              <th>Actions</th>
                            </>
                          ), { currency: piForm.currency })}
                        </tr>
                      </thead>
                      <tbody>
                        {piForm.taxes.length === 0 ? (
                          <tr>
                            <td colSpan="5">No Data</td>
                          </tr>
                        ) : (
                          piForm.taxes.map((tax, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Taxes and Charges'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'type' }, { id: 'taxRate' }, { id: 'amount' }, { id: 'total' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'tax_template':
                                        return (
                                          <td key={f.id}>
                                            <select
                                              value={tax.tax_template || ''}
                                              onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === 'create_new') {
                                                    setShowTaxMasterModal(true);
                                                    return;
                                                  }
                                                  const selTax = taxes.find(t => t._id === val || t.id === val);
                                                if (selTax) {
                                                  handlePiTaxChange(index, 'tax_template', val);
                                                  handlePiTaxChange(index, 'tax_type', selTax.tax_type);
                                                  handlePiTaxChange(index, 'taxRate', selTax.tax_rate);
                                                  } else {
                                                    handlePiTaxChange(index, 'tax_template', val);
                                                    handlePiTaxChange(index, 'tax_type', '');
                                                    handlePiTaxChange(index, 'taxRate', 0);
                                                }
                                              }}
                                              className="purchase-input select"
                                              required={isFieldMandatory('Purchase Taxes and Charges', 'tax_template')}
                                            >
                                              <option value="">Select Tax Template</option>
                                                <option value="create_new" style={{ fontWeight: 'bold', color: '#16a34a' }}>+ Create New</option>
                                              {taxes.map(t => <option key={t._id} value={t._id}>{t.tax_name} ({t.tax_rate}%)</option>)}
                                            </select>
                                          </td>
                                        );
                                      case 'tax_type':
                                        return (
                                          <td key={f.id}>
                                            <input type="text" value={tax.tax_type || ''} readOnly className="purchase-input disabled" />
                                          </td>
                                        );
                                      case 'tax_rate':
                                      case 'taxRate':
                                        return (
                                          <td key={f.id}>
                                            <input
                                              type="number"
                                              value={tax.taxRate === 0 ? '' : tax.taxRate}
                                              onChange={(e) => handlePiTaxChange(index, 'taxRate', e.target.value)}
                                              className="purchase-input"
                                              required={isFieldMandatory('Purchase Taxes and Charges', 'tax_rate')}
                                            />
                                          </td>
                                        );
                                      case 'tax_amount':
                                      case 'amount':
                                        return (
                                          <td key={f.id} className="purchase-calculated">
                                            {piForm.currency} {(tax.amount || 0).toFixed(2)}
                                          </td>
                                        );
                                      default:
                                      return (
                                        <td key={f.id}>
                                          <input
                                            type={f.type === 'Number' ? 'number' : 'text'}
                                            value={tax[f.id] || ''}
                                            onChange={(e) => handlePiTaxChange(index, f.id, e.target.value)}
                                            className="purchase-input"
                                            required={isFieldMandatory('Purchase Taxes and Charges', f.id)}
                                          />
                                        </td>
                                      );
                                  }
                                });
                              })()}
                              <td>
                                <button
                                  type="button"
                                  onClick={() => removePiTax(index)}
                                  className="purchase-button delete"
                                  disabled={piForm.taxes.length === 1}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <div className="purchase-form-buttons">
                      <button type="button" onClick={addPiTax} className="purchase-button add-row">
                        Add Row
                      </button>
                    </div>
                    <div className="purchase-totals">
                      <div>Total Qty {piForm.commonUOM || 'Carton'} {((piForm.totalQtyInCommon || 0)).toFixed(0)}</div>
                      {(() => {
                        const isExciseSelected = piForm.taxes.some(t => t.tax_type === 'Excise Duty' || (t.tax_template && String(t.tax_template).toLowerCase().includes('excise')));
                        const isVatSelected = piForm.taxes.some(t => t.tax_type === 'VAT' || (t.tax_template && String(t.tax_template).toLowerCase().includes('vat')));
                        const showExcise = isExciseSelected && piForm.exciseDuty > 0;
                        const showVat = isVatSelected && piForm.totalTaxes > 0;
                        return (
                          <>
                            <div>Gross Amount ({piForm.currency}): {piForm.currency} {((piForm.subtotal || 0)).toFixed(2)}</div>
                            {showExcise && <div>Excise Duty ({piForm.currency}): {piForm.currency} {((piForm.exciseDuty || 0)).toFixed(2)}</div>}
                            {showExcise && <div>Taxable Amount ({piForm.currency}): {piForm.currency} {((piForm.taxableAmount || 0)).toFixed(2)}</div>}
                            {showVat && <div>VAT (): {piForm.currency} {((piForm.totalTaxes || 0)).toFixed(2)}</div>}
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginTop: '5px' }}>Net Total ({piForm.currency}): {piForm.currency} {((piForm.grandTotal || 0)).toFixed(2)}</div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'report' && (
                <div className="purchase-section">
                  <div className="purchase-header">
                    <h3>Reports</h3>
                    {/* NEW: Reports Internal Search */}
                    <div className="purchase-report-search" style={{ width: '300px', marginBottom: '15px' }}>
                      <input
                        type="text"
                        placeholder="Search reports (Purchase Orders, Purchase Receipts, etc.)..."
                        value={reportSearchTerm}
                        onChange={(e) => setReportSearchTerm(e.target.value)}
                        className="purchase-input"
                      />
                    </div>
                    <div className="purchase-report-buttons">
                      {reportTabs
                        .filter(rt => rt.name.toLowerCase().includes(reportSearchTerm.toLowerCase()))
                        .map(rt => (
                          <button
                            key={rt.key}
                            onClick={() => setActiveReport(rt.key)}
                            className={`purchase-button report ${activeReport === rt.key ? 'active' : ''}`}
                          >
                            {rt.name}
                          </button>
                        ))}
                    </div>
                  </div>
                  {activeReport === 'po' && (
                    <>
                        <div className="purchase-report-filters">
                          <label>Search: <input type="text" placeholder="Search by PO Number" value={reportPoSearch} onChange={(e) => setReportPoSearch(e.target.value)} className="purchase-input" /></label>
                          <label>Supplier:
                            <select
                              value={reportPoSupplier}
                              onChange={(e) => setReportPoSupplier(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Suppliers</option>
                              {suppliers.map(s => <option key={s._id} value={s._id}>{s.company}</option>)}
                            </select>
                          </label>
                          <label>Status:
                            <select
                              value={reportPoStatus}
                              onChange={(e) => setReportPoStatus(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Status</option>
                              <option value="Draft">Draft</option>
                              <option value="Submitted">Submitted</option>
                            </select>
                          </label>
                          <label>From: <input type="date" value={reportPoDateFrom} onChange={(e) => setReportPoDateFrom(e.target.value)} className="purchase-input" /></label>
                          <label>To: <input type="date" value={reportPoDateTo} onChange={(e) => setReportPoDateTo(e.target.value)} className="purchase-input" /></label>
                          <label>Item:
                            <select
                              value={reportPoItem}
                              onChange={(e) => setReportPoItem(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Items</option>
                              {items.map(i => <option key={i._id} value={i._id}>{i.item_name || i.name}</option>)}
                            </select>
                          </label>
                          <div className="purchase-report-actions">
                            <button onClick={() => handleExportCSV('po')} className="purchase-button export">
                              <FaFileExcel /> Export CSV
                            </button>
                            <button onClick={() => handlePrintTable('po')} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                          </div>
                        </div>
                      <h4>Purchase Orders Report</h4>
                      <table className="purchase-table">
                        <thead>
                          <tr>
                            {renderDynamicHeaders('Purchase Order Report', (
                              <>
                                <th>PO Number</th>
                                <th>Date</th>
                                <th>Supplier Name</th>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Taxes</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </>
                            ), {}, false, false)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPurchaseOrdersReport.map(po => (
                            <tr key={po._id} onClick={() => editPo(po._id)}>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Order Report'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'series' }, { id: 'date' }, { id: 'supplierId' }, { id: 'items' }, { id: 'subtotal' }, { id: 'totalTaxes' }, { id: 'grandTotal' }, { id: 'status' }, { id: 'actions' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'series': return <td key={f.id}>{po.series}</td>;
                                    case 'date': return <td key={f.id}>{new Date(po.date).toLocaleDateString()}</td>;
                                    case 'supplierId': return <td key={f.id}>{po.name}</td>;
                                    case 'items': return <td key={f.id}>{po.items.map(item => <div key={item.itemId}>{renderItemQuantity(item, 'po')}</div>)}</td>;
                                    case 'subtotal': return <td key={f.id}>{po.currency} {(po.subtotal || (po.grandTotal - (po.totalTaxes || 0)) || 0).toFixed(2)}</td>;
                                    case 'totalTaxes': return <td key={f.id}>{po.currency} {(po.totalTaxes || 0).toFixed(2)}</td>;
                                    case 'grandTotal': return <td key={f.id}>{po.currency} {(po.grandTotal || 0).toFixed(2)}</td>;
                                    case 'status': return <td key={f.id}>{po.status}</td>;
                                    case 'actions': return (
                                      <td key={f.id} className="purchase-action-buttons">
                                        {po.status === 'Draft' && (
                                          <>
                                            <button onClick={(e) => { e.stopPropagation(); editPo(po._id); }} className="purchase-button edit">
                                              <FaEdit /> Edit
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); submitPo(po._id); }} className="purchase-button submit">
                                              <FaCheck /> Submit
                                            </button>
                                          </>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); handlePrintRow('po', po); }} className="purchase-button print">
                                          <FaPrint /> Print
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deletePo(po._id); }} className="purchase-button delete">
                                          <FaTrash /> Delete
                                        </button>
                                      </td>
                                    );
                                    default: return <td key={f.id}>{po[f.id] || '-'}</td>;
                                  }
                                });
                              })()}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="6"><strong>Grand Total</strong></td>
                            <td><strong>{calculateGrandTotal(filteredPurchaseOrdersReport).toFixed(2)}</strong></td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                  {activeReport === 'pr' && (
                    <>
                        <div className="purchase-report-filters">
                          <label>Search: <input type="text" placeholder="Search by PR Number" value={reportPrSearch} onChange={(e) => setReportPrSearch(e.target.value)} className="purchase-input" /></label>
                          <label>Supplier:
                            <select
                              value={reportPrSupplier}
                              onChange={(e) => setReportPrSupplier(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Suppliers</option>
                              {suppliers.map(s => <option key={s._id} value={s._id}>{s.company}</option>)}
                            </select>
                          </label>
                          <label>Status:
                            <select
                              value={reportPrStatus}
                              onChange={(e) => setReportPrStatus(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Status</option>
                              <option value="Draft">Draft</option>
                              <option value="Submitted">Submitted</option>
                            </select>
                          </label>
                          <label>From: <input type="date" value={reportPrDateFrom} onChange={(e) => setReportPrDateFrom(e.target.value)} className="purchase-input" /></label>
                          <label>To: <input type="date" value={reportPrDateTo} onChange={(e) => setReportPrDateTo(e.target.value)} className="purchase-input" /></label>
                          <label>Item:
                            <select
                              value={reportPrItem}
                              onChange={(e) => setReportPrItem(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Items</option>
                              {items.map(i => <option key={i._id} value={i._id}>{i.item_name || i.name}</option>)}
                            </select>
                          </label>
                          <div className="purchase-report-actions">
                            <button onClick={() => handleExportCSV('pr')} className="purchase-button export">
                              <FaFileExcel /> Export CSV
                            </button>
                            <button onClick={() => handlePrintTable('pr')} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                          </div>
                        </div>
                      <h4>Purchase Receipts Report</h4>
                      <table className="purchase-table">
                        <thead>
                          <tr>
                            {renderDynamicHeaders('Purchase Receipt Report', (
                              <>
                                <th>PR Number</th>
                                <th>PO Reference</th>
                                <th>Date</th>
                                <th>Supplier Name</th>
                                <th>Items</th>
                                <th>Total Amount</th>
                                <th>Taxes</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </>
                            ), {}, false, false)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPurchaseReceiptsReport.map(pr => (
                            <tr key={pr.series} onClick={() => editPr(pr.series)}>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Receipt Report'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'series' }, { id: 'poId' }, { id: 'date' }, { id: 'supplierId' }, { id: 'items' }, { id: 'subtotal' }, { id: 'totalTaxes' }, { id: 'grandTotal' }, { id: 'status' }, { id: 'actions' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'series': return <td key={f.id}>{pr.series}</td>;
                                    case 'poId': return <td key={f.id}>{pr.poId}</td>;
                                    case 'date': return <td key={f.id}>{new Date(pr.date).toLocaleDateString()}</td>;
                                    case 'supplierId': return <td key={f.id}>{pr.name}</td>;
                                    case 'items': return <td key={f.id}>{pr.items.map(item => <div key={item.itemId}>{renderItemQuantity(item, 'pr')}</div>)}</td>;
                                    case 'subtotal': return <td key={f.id}>{pr.currency} {(pr.subtotal || (pr.grandTotal - (pr.totalTaxes || 0)) || 0).toFixed(2)}</td>;
                                    case 'totalTaxes': return <td key={f.id}>{pr.currency} {(pr.totalTaxes || 0).toFixed(2)}</td>;
                                    case 'grandTotal': return <td key={f.id}>{pr.currency} {(pr.grandTotal || 0).toFixed(2)}</td>;
                                    case 'status': return <td key={f.id}>{pr.status}</td>;
                                    case 'actions': return (
                                      <td key={f.id} className="purchase-action-buttons">
                                        {pr.status === 'Draft' && (
                                          <>
                                            <button onClick={(e) => { e.stopPropagation(); editPr(pr.series); }} className="purchase-button edit">
                                              <FaEdit /> Edit
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); submitPr(pr.series); }} className="purchase-button submit">
                                              <FaCheck /> Submit
                                            </button>
                                          </>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); handlePrintRow('pr', pr); }} className="purchase-button print">
                                          <FaPrint /> Print
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deletePr(pr.series); }} className="purchase-button delete">
                                          <FaTrash /> Delete
                                        </button>
                                      </td>
                                    );
                                    default: return <td key={f.id}>{pr[f.id] || '-'}</td>;
                                  }
                                });
                              })()}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="7"><strong>Grand Total</strong></td>
                            <td><strong>{calculateGrandTotal(filteredPurchaseReceiptsReport).toFixed(2)}</strong></td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                  {activeReport === 'pi' && (
                    <>
                        <div className="purchase-report-filters">
                          <label>Search: <input type="text" placeholder="Search by PI Number" value={reportPiSearch} onChange={(e) => setReportPiSearch(e.target.value)} className="purchase-input" /></label>
                          <label>Supplier:
                            <select
                              value={reportPiSupplier}
                              onChange={(e) => setReportPiSupplier(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Suppliers</option>
                              {suppliers.map(s => <option key={s._id} value={s._id}>{s.company}</option>)}
                            </select>
                          </label>
                          <label>Status:
                            <select
                              value={reportPiStatus}
                              onChange={(e) => setReportPiStatus(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Status</option>
                              <option value="Draft">Draft</option>
                              <option value="Submitted">Submitted</option>
                            </select>
                          </label>
                          <label>From: <input type="date" value={reportPiDateFrom} onChange={(e) => setReportPiDateFrom(e.target.value)} className="purchase-input" /></label>
                          <label>To: <input type="date" value={reportPiDateTo} onChange={(e) => setReportPiDateTo(e.target.value)} className="purchase-input" /></label>
                          <label>Item:
                            <select
                              value={reportPiItem}
                              onChange={(e) => setReportPiItem(e.target.value)}
                              className="purchase-input select"
                            >
                              <option value="">All Items</option>
                              {items.map(i => <option key={i._id} value={i._id}>{i.item_name || i.name}</option>)}
                            </select>
                          </label>
                          <div className="purchase-report-actions">
                            <button onClick={() => handleExportCSV('pi')} className="purchase-button export">
                              <FaFileExcel /> Export CSV
                            </button>
                            <button onClick={() => handlePrintTable('pi')} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                          </div>
                        </div>
                      <h4>Purchase Invoices Report</h4>
                      <table className="purchase-table">
                        <thead>
                          <tr>
                            {renderDynamicHeaders('Purchase Invoice Report', (
                              <>
                                <th>PI Number</th>
                                <th>Date</th>
                                <th>Supplier Name</th>
                                <th>PO Reference</th>
                                <th>PR Reference</th>
                                <th>Total Amount</th>
                                <th>Taxes</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </>
                            ), {}, false, false)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPurchaseInvoicesReport.map(pi => (
                            <tr key={pi.series} onClick={() => editPi(pi.series)}>
                              {(() => {
                                const schema = doctypeSchemas['Purchase Invoice Report'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'series' }, { id: 'date' }, { id: 'supplierId' }, { id: 'poId' }, { id: 'prId' }, { id: 'subtotal' }, { id: 'totalTaxes' }, { id: 'grandTotal' }, { id: 'status' }, { id: 'actions' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'series': return <td key={f.id}>{pi.series}</td>;
                                    case 'date': return <td key={f.id}>{new Date(pi.date).toLocaleDateString()}</td>;
                                    case 'supplierId': return <td key={f.id}>{pi.name}</td>;
                                    case 'poId': return <td key={f.id}>{pi.poId}</td>;
                                    case 'prId': return <td key={f.id}>{pi.prId}</td>;
                                    case 'subtotal': return <td key={f.id}>{pi.currency} {(pi.subtotal || (pi.grandTotal - (pi.taxesAdded || pi.totalTaxes || 0)) || 0).toFixed(2)}</td>;
                                    case 'totalTaxes': return <td key={f.id}>{pi.currency} {(pi.taxesAdded || pi.totalTaxes || 0).toFixed(2)}</td>;
                                    case 'grandTotal': return <td key={f.id}>{pi.currency} {(pi.grandTotal || 0).toFixed(2)}</td>;
                                    case 'status': return <td key={f.id}>{pi.status}</td>;
                                    case 'actions': return (
                                      <td key={f.id} className="purchase-action-buttons">
                                        {pi.status === 'Draft' && (
                                          <>
                                            <button onClick={(e) => { e.stopPropagation(); editPi(pi.series); }} className="purchase-button edit">
                                              <FaEdit /> Edit
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); submitPi(pi.series); }} className="purchase-button submit">
                                              <FaCheck /> Submit
                                            </button>
                                          </>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); handlePrintRow('pi', pi); }} className="purchase-button print">
                                          <FaPrint /> Print
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deletePi(pi.series); }} className="purchase-button delete">
                                          <FaTrash /> Delete
                                        </button>
                                      </td>
                                    );
                                    default: return <td key={f.id}>{pi[f.id] || '-'}</td>;
                                  }
                                });
                              })()}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="5"><strong>Grand Total</strong></td>
                            <td><strong>{calculateGrandTotal(filteredPurchaseInvoicesReport).toFixed(2)}</strong></td>
                            <td colSpan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                  {activeReport === 'supplier' && (
                    <>
                        <div className="purchase-report-filters">
                          <label>Search: <input type="text" placeholder="Search by Company" value={reportSupplierSearch} onChange={(e) => setReportSupplierSearch(e.target.value)} className="purchase-input" /></label>
                          <div className="purchase-report-actions">
                            <button onClick={() => handleExportCSV('supplier')} className="purchase-button export">
                              <FaFileExcel /> Export CSV
                            </button>
                            <button onClick={() => handlePrintTable('supplier')} className="purchase-button print">
                              <FaPrint /> Print
                            </button>
                          </div>
                        </div>
                      <h4>Suppliers Report</h4>
                      <table className="purchase-table">
                        <thead>
                          <tr>
                            {renderDynamicHeaders('Supplier Report', (
                              <>
                                <th>Code</th>
                                <th>Company Name</th>
                                <th>Group</th>
                                <th>Country</th>
                                <th>Currency</th>
                                <th>Tax ID</th>
                                <th>Contacts</th>
                                <th>Last Purchase Date</th>
                                <th>Actions</th>
                              </>
                            ), {}, false, false)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSuppliersReport.map(supplier => (
                            <tr key={supplier._id} onClick={() => { setEditingSupplier(supplier); setActiveTab('supplier'); }}>
                              {(() => {
                                const schema = doctypeSchemas['Supplier Report'];
                                const visibleFields = schema && schema.fields
                                  ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                  : [{ id: 'code' }, { id: 'company' }, { id: 'group' }, { id: 'country' }, { id: 'currency' }, { id: 'taxId' }, { id: 'contacts' }, { id: 'lastPurchaseDate' }, { id: 'actions' }];

                                return visibleFields.map(f => {
                                  switch (f.id) {
                                    case 'code': return <td key={f.id}>{supplier.code}</td>;
                                    case 'company': return <td key={f.id}>{supplier.company}</td>;
                                    case 'group': return <td key={f.id}>{supplier.group}</td>;
                                    case 'country': return <td key={f.id}>{supplier.country}</td>;
                                    case 'currency': return <td key={f.id}>{supplier.currency}</td>;
                                    case 'taxId': return <td key={f.id}>{supplier.taxId}</td>;
                                    case 'contacts': return <td key={f.id}>{Array.isArray(supplier.contacts) ? supplier.contacts.map(c => `${c.contactPerson} (${c.phone}, ${c.address})`).join(', ') : ''}</td>;
                                    case 'lastPurchaseDate': return <td key={f.id}>{supplier.lastPurchaseDate ? new Date(supplier.lastPurchaseDate).toLocaleDateString() : '-'}</td>;
                                    case 'actions': return (
                                      <td key={f.id} className="purchase-action-buttons">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingSupplier(supplier); setActiveTab('supplier'); }} className="purchase-button edit">
                                          <FaEdit /> Edit
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteSupplier(supplier._id); }} className="purchase-button delete">
                                          <FaTrash /> Delete
                                        </button>
                                      </td>
                                    );
                                    default: return <td key={f.id}>{supplier[f.id] || '-'}</td>;
                                  }
                                });
                              })()}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {/* NEW: Item-wise Purchase Report */}
                  {activeReport === 'itemwise' && (
                    <>
                        <div className="purchase-report-filters">
                          <label>Date From: <input type="date" value={reportItemWiseDateFrom} onChange={(e) => setReportItemWiseDateFrom(e.target.value)} className="purchase-input" /></label>
                          <label>Date To: <input type="date" value={reportItemWiseDateTo} onChange={(e) => setReportItemWiseDateTo(e.target.value)} className="purchase-input" /></label>
                          <label>Item:
                            <select value={reportItemWiseItem} onChange={(e) => setReportItemWiseItem(e.target.value)} className="purchase-input select">
                              <option value="">All Items</option>
                              {items.map(item => <option key={item._id} value={item._id}>{(item.item_name || item.name || "")}</option>)}
                            </select>
                          </label>
                          <label>Supplier:
                            <select value={reportItemWiseSupplier} onChange={(e) => setReportItemWiseSupplier(e.target.value)} className="purchase-input select">
                              <option value="">All Suppliers</option>
                              {suppliers.map(s => <option key={s._id} value={s._id}>{s.company}</option>)}
                            </select>
                          </label>
                          <button onClick={fetchItemWiseReport} className="purchase-button filter">
                            <FaFilter /> Apply
                          </button>
                          <div className="purchase-report-actions">
                            <button onClick={() => {
                              const headers = ['Item Name', 'Brand', 'Grams', 'Total Quantity', 'Total Purchased', 'Rate', 'Total Amount', 'Taxes', 'Grand Total', 'Suppliers'];
                              const rows = reportItemWiseData.map(item => {
                                const originalItem = items.find(i => (i.item_name || i.name) === item.itemName && (i.brand || i.company) === item.brand);
                                const totalPurchased = `${item.totalQuantity.toFixed(0)} ${item.uom || (originalItem ? originalItem.nosUnit : '')}`;
                                const uomDisplay = item.uom || item.unit || (originalItem ? originalItem.masterUnit : '');
                                const rawTotal = Object.values(item.rawQuantities || {}).reduce((a, b) => a + b, 0);
                                const rateDivisor = rawTotal > 0 ? rawTotal : item.totalQuantity;
                                const averageRate = rateDivisor > 0 ? (item.totalAmount / rateDivisor) : 0;
                                const grams = originalItem && originalItem.grams ? originalItem.grams : '-';
                                return [
                                  item.itemName,
                                  item.brand,
                                  grams,
                                  item.rawDisplay || `${item.totalQuantity.toFixed(2)} ${uomDisplay}`,
                                  totalPurchased,
                                  `${item.currency} ${averageRate.toFixed(2)}`,
                                  `${item.currency} ${item.totalAmount.toFixed(2)}`,
                                  `${item.currency} ${(item.totalTaxes || 0).toFixed(2)}`,
                                  `${item.currency} ${(item.grandTotal || 0).toFixed(2)}`,
                                  item.suppliers.map(s => s.displayText ? s.displayText : `${s.supplierName} (Qty: ${s.quantity.toFixed(2)} ${uomDisplay}, Amt: ${item.currency} ${s.amount.toFixed(2)})`).join('; ')
                                ];
                              });
                              const html = generateReportHtml('Item-wise Purchase Report', headers, rows, reportItemWiseData[0]?.currency || 'AED', 'itemwise');
                              const printWindow = window.open('', '_blank');
                              printWindow.document.write(html);
                              printWindow.document.close();
                              printWindow.print();
                            }} className="purchase-button print" disabled={reportItemWiseData.length === 0}>
                              <FaPrint /> Print
                            </button>
                          </div>
                        </div>
                      <table className="purchase-table">
                        <thead>
                          <tr>
                            {renderDynamicHeaders('Purchase Item Report', (
                              <>
                                <th>Item Name</th>
                                <th>Brand</th>
                                <th>Grams</th>
                                <th>Total Quantity</th>
                                <th>Total Purchased</th>
                                <th>Rate</th>
                                <th>Total Amount</th>
                                <th>Taxes</th>
                                <th>Grand Total</th>
                                <th>Suppliers</th>
                              </>
                            ), {}, false, false)}
                          </tr>
                        </thead>
                        <tbody>
                          {reportItemWiseData.map((item, idx) => {
                            const originalItem = items.find(i => (i.item_name || i.name) === item.itemName && (i.brand || i.company) === item.brand);
                            const rawTotal = Object.values(item.rawQuantities || {}).reduce((a, b) => a + b, 0);
                            const rateDivisor = rawTotal > 0 ? rawTotal : item.totalQuantity;
                            const averageRate = rateDivisor > 0 ? (item.totalAmount / rateDivisor) : 0;
                            return (
                              <tr key={idx}>
                                {(() => {
                                  const schema = doctypeSchemas['Purchase Item Report'];
                                  const visibleFields = schema && schema.fields
                                    ? schema.fields.filter(f => !f.hidden && f.type !== 'Section Break' && f.type !== 'Column Break')
                                    : [{ id: 'name' }, { id: 'company' }, { id: 'grams' }, { id: 'totalQuantity' }, { id: 'totalPurchased' }, { id: 'rate' }, { id: 'totalAmount' }, { id: 'totalTaxes' }, { id: 'grandTotal' }, { id: 'suppliers' }];

                                  return visibleFields.map(f => {
                                    switch (f.id) {
                                      case 'name': return <td key={f.id}>{item.itemName}</td>;
                                      case 'company': return <td key={f.id}>{item.brand}</td>;
                                      case 'grams': return <td key={f.id}>{originalItem && originalItem.grams ? originalItem.grams : '-'}</td>;
                                      case 'totalQuantity': return <td key={f.id}>{item.rawDisplay || `${item.totalQuantity.toFixed(2)} ${item.uom || ''}`}</td>;
                                      case 'totalPurchased': return <td key={f.id}>{item.totalQuantity.toFixed(0)} {item.uom || (originalItem ? originalItem.nosUnit : '')}</td>;
                                      case 'rate': return <td key={f.id}>{item.currency} {averageRate.toFixed(2)}</td>;
                                      case 'totalAmount': return <td key={f.id}>{item.currency} {item.totalAmount.toFixed(2)}</td>;
                                      case 'totalTaxes': return <td key={f.id}>{item.currency} {(item.totalTaxes || 0).toFixed(2)}</td>;
                                      case 'grandTotal': return <td key={f.id}>{item.currency} {(item.grandTotal || 0).toFixed(2)}</td>;
                                      case 'suppliers': return (
                                        <td key={f.id} style={{ whiteSpace: 'pre-wrap' }}>
                                          {item.suppliers && item.suppliers.length > 0 ? (
                                            item.suppliers.map((supplier, sIdx) => (
                                              <div key={sIdx} style={{ marginBottom: '8px', fontSize: '13px' }}>
                                                {supplier.displayText || `${supplier.supplierName}: Qty: ${supplier.quantity.toFixed(2)} ${item.uom || ''}, Amt: ${item.currency} ${supplier.amount.toFixed(2)}`}
                                              </div>
                                            ))
                                          ) : '-'}
                                        </td>
                                      );
                                      default: return <td key={f.id}>{originalItem ? originalItem[f.id] || '-' : '-'}</td>;
                                    }
                                  });
                                })()}
                              </tr>
                            );
                          })}
                          {reportItemWiseData.length === 0 && (
                            <tr>
                              <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                <div style={{ fontSize: '15px', marginBottom: '6px' }}>📦 No item data found.</div>
                                <div style={{ fontSize: '13px' }}>Create a Purchase Order, Purchase Receipt, or Purchase Invoice and then click <strong>Apply</strong> to load the report.</div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {showWarning && (
            <WarningMessage
              message={showWarning}
              onConfirm={warningAction}
              onCancel={() => { setShowWarning(null); setWarningAction(null); }}
            />
          )}

      </div>
      {showTaxMasterModal && (
        <div className="purchase-modal-overlay" style={{ zIndex: 1050, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#fff' }}>
          <div style={{ width: '100%', height: '100%', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <TaxMaster isModal={true} onClose={() => {
              setShowTaxMasterModal(false);
              // Refresh taxes to load the newly created tax
              fetchTaxes();
            }} />
          </div>
        </div>
      )}
      <CustomerCustomizationModal 
        isOpen={showCustomizeModal}
        onClose={() => {
          setShowCustomizeModal(false);
        }}
        onRefresh={() => {
        }}
        targetDocType={
          activeTab === 'item' ? 'Purchase Item' :
          activeTab === 'supplier' ? 'Supplier' :
          activeTab === 'order' ? 'Purchase Order' :
          activeTab === 'receipt' ? 'Purchase Receipt' :
          activeTab === 'invoice' ? 'Purchase Invoice' :
          activeTab === 'report' ? (
            activeReport === 'po' ? 'Purchase Order Report' :
            activeReport === 'pr' ? 'Purchase Receipt Report' :
            activeReport === 'pi' ? 'Purchase Invoice Report' :
            activeReport === 'itemwise' ? 'Purchase Item Report' :
            activeReport === 'supplier' ? 'Supplier Report' : 'Purchase Order Report'
          ) : 'Purchase Order'
        }
      />
    </>
  );
}
export default Purchase;
