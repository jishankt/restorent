// src/UserRouter.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Route, Routes } from "react-router-dom";
// Import Pages
import TablePage from "../Pages/TablePage";
import FrontPage from "../Pages/FrontPage";
import KitchenRoomPage from "../Pages/KitchenRoomPage";
import BearerPage from "../Pages/BearerPage";
import CashPage from "../Pages/CashPage";
import CardPage from "../Pages/CardPage";
import SavedOrderPage from "../Pages/SavedOrderPage";
import SalesPage from "../Pages/SalesPage";
// Import Components
import FirstTab from "../components/FirstTab/FirstTab";
import AdminPage from "../components/admin/AdminPage";
import SuperAdminPage from "../components/admin/SuperAdminPage";
import RestaurantPlan from "../components/admin/RestaurantPlan";
import MainPage from "../components/Form/MainPage";
import CustomerListPage from "../components/Form/CustomerListPage";
import ItemListPage from "../components/Form/ItemListPage";
import CreateItemsPage from "../components/Form/CreateItemsPage";
import WorkspaceSetup from "../Pages/WorkspaceSetup";
import BearerLoginPage from "../components/BearerLoginPage";
import AddTablePage from "../components/Form/AddTablePage";
import RecordPage from "../components/Form/RecordPage";
import OpeningEntry from "../components/Bearer/OpeningEntry";
import ClosingEntry from "../components/Bearer/ClosingEntry";
import RegisterPage from "../components/Form/RegisterPage";
import OnboardOrganization from "../components/OnboardOrganization";
import BackupPage from "../components/Form/BackupsPage.";
import SystemSettings from "../components/Form/SystemSettings";
import TaxMaster from "../components/Form/TaxMaster";
import ActiveOrders from "../components/Header/ActiveOrders";
import Dashboard from "../components/Dashboard";
import UserList from "../components/Form/UserList";
import AddKitchenPage from "../components/Form/AddKitchenPage";
import AddItemGroupPage from "../components/Form/AddItemGroupPage";
import AddingirdientAndNurion from "../components/Form/AddingirdientAndNurion";
import SalesReport from "../components/Navbar/SalesReport";
import SalesReportPage from "../Pages/SalesReportPage";
import SalesKanban from "../components/Navbar/SalesKanban";
import Booking from "../components/Table/Booking";
import CreateVariant from "../components/Form/CreateVariant";
import Employee from "../components/Form/Employee";
import TripReport from "../components/Header/TripReport";
import PosBalance from "../components/Header/PosBalance";
import EmailSettings from "../components/Form/EmailSettings";
import Purchase from "../components/Form/Purchase";
import PrintSettings from "../components/Form/printsettings";
import ComboOffer from "../components/Form/ComboOffer";
import VatPage from "../components/Form/Vatpage";
import CreateCustomerPage from "../components/Form/CreateCustomerPage";
import CreateCustomerGroup from "../components/Form/CreateCustomerGroup";
import CompanyDetails from "../components/Form/companydetails";
import Hiddenitems from "../components/Form/Hiddenitems";
import AddEmployee from "../components/Form/Addemployee";
import EmployeeList from "../components/Form/employeelist";
import Attendance from "../components/Form/attendance";
import AttendanceView from "../components/Form/attendanceview";
import Working from "../components/Form/working";
import SalarySlip from "../components/Form/salaryslip";
import EmployeeDesignation from "../components/Form/Employeedesignation";
import EmployeeType from "../components/Form/Employeetype";
import EmployeeDepartment from "../components/Form/Employeedepartment";
import ScheduleMaster from "../components/Form/schedulemaster";
import ManageCompanies from "../components/Form/ManageCompanies";
import ManageTenants from "../components/Form/ManageTenants";
import ManageBranches from "../components/Form/ManageBranches";
import ItemGalleryPage from "../components/admin/ItemGalleryPage";
import Manages from "../components/Form/manages";

import ScheduleAssignEmployee from "../components/Form/scheduleassignemployee";
import EmployeeDocType from "../components/Form/employeelistdoctype";
import HolidayDocType from "../components/Form/holidaydoctype";
import ExtendedDocType from "../components/Form/extendeddoctype";
import LeaveType from "../components/Form/leavetype";
import LeaveAllocation from "../components/Form/leaveallocation";
import LeaveApply from "../components/Form/leaveapply";
import SalaryReceiptList from "../components/Form/salaryreceptlist";
import VehicleManagement from "../components/Form/VehicleManagement";
import AddressStructure from "../components/Form/AddressStructure";
import Roaster from "../components/Form/Roaster";
import Voice from "../components/voice.jsx/Voice";
import NotificationPage from "../components/Notification/NotificationPage";
import RoleRoute from "../components/RoleRoute";
import RolePermissionPage from "../components/Form/RolePermissionPage";
import ImportDataPage from "../components/admin/ImportDataPage";
import DocType from "../components/Form/DocType";
import CustomerView from "../components/Form/CustomerView";
import AdminDashboard from "../components/admin/AdminDashboard";

const UserRouter = () => {
  const [fontFamily, setFontFamily] = useState("'Dubai Regular', Arial, sans-serif");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/settings");
        if (response.data && response.data.font_family) {
          const selectedFont = response.data.font_family;
          setFontFamily(selectedFont);

          const styleId = "global-font-override";
          const dynamicFontLinkId = "dynamic-google-font";

          // If "System Default" is selected, remove all overrides to restore original code fonts
          if (selectedFont.includes("system-ui")) {
            const styleTag = document.getElementById(styleId);
            if (styleTag) styleTag.remove();

            const linkTag = document.getElementById(dynamicFontLinkId);
            if (linkTag) linkTag.remove();

            return; // Exit early
          }

          // If it's a Google Font, load it dynamically
          if (selectedFont.includes("sans-serif") || selectedFont.includes("serif")) {
            const fontName = selectedFont.split(",")[0].replace(/'/g, "").trim();
            if (fontName !== "Arial" && fontName !== "Georgia" && fontName !== "system-ui") {
              const linkId = "dynamic-google-font";
              let link = document.getElementById(linkId);
              if (!link) {
                link = document.createElement("link");
                link.id = linkId;
                link.rel = "stylesheet";
                document.head.appendChild(link);
              }
              link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;
            }
          }

          // Inject Global Font CSS Override - NUCLEAR PROTECTION FOR ICONS
          let styleTag = document.getElementById(styleId);
          if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
          }

          styleTag.innerHTML = `
            /* 1. Global Base Font */
            html, body, #root {
              font-family: ${selectedFont} !important;
            }

            /* 2. Targeted Text Tags - Apply font only to text elements */
            p, h1, h2, h3, h4, h5, h6, a, label, li, td, th, input, select, textarea {
              font-family: ${selectedFont} !important;
            }

            /* 3. Mixed Use Tags - Use EXCLUSION to avoid hitting icons */
            div:not([class*="fa-"]):not([class*="ri-"]):not([class*="bi-"]):not(.material-icons):not(.material-symbols-outlined):not([class*="icon"]),
            span:not([class*="fa-"]):not([class*="ri-"]):not([class*="bi-"]):not(.material-icons):not(.material-symbols-outlined):not([class*="icon"]),
            button:not([class*="fa-"]):not([class*="ri-"]):not([class*="bi-"]):not(.material-icons):not(.material-symbols-outlined):not([class*="icon"]) {
              font-family: ${selectedFont} !important;
            }

            /* 4. NUCLEAR ICON RESTORATION - Highest Priority */
            i[class*="fa-"], .fa, .fas, .far, .fab, .fa-solid, .fa-regular, .fa-brands, [class^="fa-"], [class*=" fa-"] {
              font-family: "Font Awesome 6 Free", "Font Awesome 6 Solid", "Font Awesome 5 Free", "Font Awesome 5 Solid", "FontAwesome" !important;
              font-weight: 900 !important;
              font-style: normal !important;
            }
            
            /* Restore glyphs for pseudo-elements */
            i[class*="fa-"]::before, i[class*="fa-"]::after,
            .fa::before, .fas::before, .fa-solid::before, [class*="fa-"]::before {
              font-family: inherit !important;
              font-weight: inherit !important;
            }

            /* Material and other Icon Libraries */
            .material-icons, .material-symbols-outlined {
              font-family: 'Material Icons', 'Material Symbols Outlined' !important;
              font-weight: normal !important;
            }
            [class^="ri-"], [class*=" ri-"], [class^="bi-"], [class*=" bi-"] {
              font-family: 'remixicon', 'bootstrap-icons' !important;
            }

            /* SVG Graphic Protection */
            svg, svg * {
                font-family: initial !important;
            }
          `;
        }
      } catch (error) {
        console.error("Error fetching font settings:", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: fontFamily }}>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/" element={<WorkspaceSetup />} />
        <Route path="/login" element={<BearerLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboard-organization" element={<OnboardOrganization />} />
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/item-gallery" element={<ItemGalleryPage />} />
        <Route path="/manage-tenants" element={<ManageTenants />} />
        <Route path="/manage-companies" element={<ManageCompanies />} />
        <Route path="/manage-branches" element={<ManageBranches />} />
        <Route path="/manage-modules/company/:companyName" element={<Manages />} />
        <Route path="/manage-modules/branch/:companyName/:branchName" element={<Manages />} />
        {/* Role Permission Page */}
        <Route path="/role-permissions" element={<RoleRoute pageId="admin"><RolePermissionPage /></RoleRoute>} />
        {/* Main Application Routes */}
        <Route path="/home" element={<RoleRoute pageId="home"><FirstTab /></RoleRoute>} />
        <Route path="/table" element={<RoleRoute pageId="tables"><TablePage /></RoleRoute>} />
        <Route path="/frontpage" element={<RoleRoute pageId="frontpage"><FrontPage /></RoleRoute>} />
        <Route path="/kitchen" element={<RoleRoute pageId="kitchen"><KitchenRoomPage /></RoleRoute>} />
        <Route path="/bearer" element={<RoleRoute pageId="bearer"><BearerPage /></RoleRoute>} />
        <Route path="/cash" element={<RoleRoute pageId="cash"><CashPage /></RoleRoute>} />
        <Route path="/card" element={<RoleRoute pageId="card"><CardPage /></RoleRoute>} />
        <Route path="/savedorders" element={<RoleRoute pageId="saved_orders"><SavedOrderPage /></RoleRoute>} />
        <Route path="/salespage" element={<RoleRoute pageId="pos"><SalesPage /></RoleRoute>} />
        {/* Admin and Management Routes */}
        <Route path="/admin" element={<RoleRoute pageId="admin"><AdminPage /></RoleRoute>} />
        <Route path="/admin/restaurant-plan" element={<RestaurantPlan />} />
        <Route path="/import-data" element={<RoleRoute pageId="admin"><ImportDataPage /></RoleRoute>} />
        <Route path="/main" element={<RoleRoute pageId="dashboard"><MainPage /></RoleRoute>} />
        <Route path="/customers" element={<RoleRoute pageId="customer_list"><CustomerListPage /></RoleRoute>} />
        <Route path="/items" element={<RoleRoute pageId="item_list"><ItemListPage /></RoleRoute>} />
        <Route path="/hidden-items" element={<RoleRoute pageId="hidden_items"><Hiddenitems /></RoleRoute>} />
        <Route path="/create-item" element={<RoleRoute pageId="create_item"><CreateItemsPage /></RoleRoute>} />
        <Route path="/add-table" element={<RoleRoute pageId="add_table"><AddTablePage /></RoleRoute>} />
        <Route path="/record" element={<RoleRoute pageId="admin"><RecordPage /></RoleRoute>} />
        <Route path="/opening-entry" element={<RoleRoute pageId="opening"><OpeningEntry /></RoleRoute>} />
        <Route path="/closing-entry" element={<RoleRoute pageId="closing"><ClosingEntry /></RoleRoute>} />
        <Route path="/purchase" element={<RoleRoute pageId="purchase"><Purchase /></RoleRoute>} />
        <Route path="/combo-offer" element={<RoleRoute pageId="combo_offer"><ComboOffer /></RoleRoute>} />
        <Route path="/company-details" element={<RoleRoute pageId="company_details"><CompanyDetails /></RoleRoute>} />
        <Route path="/working" element={<RoleRoute pageId="system_settings"><Working /></RoleRoute>} />
        <Route path="/add-employee" element={<RoleRoute pageId="add_employee"><AddEmployee /></RoleRoute>} />
        <Route path="/employee-list" element={<RoleRoute pageId="employee_list"><EmployeeList /></RoleRoute>} />
        {/* Employee Details Route */}
        <Route path="/holiday-doctype" element={<RoleRoute pageId="holiday_list"><HolidayDocType /></RoleRoute>} />
        <Route path="/employee-details/:id" element={<RoleRoute pageId="employee_list"><EmployeeDocType /></RoleRoute>} />
        {/* Extended DocType Route */}
        <Route path="/extended-doctype" element={<RoleRoute pageId="extended_doctype"><ExtendedDocType /></RoleRoute>} />
        <Route path="/attendance" element={<RoleRoute pageId="create_attendance"><Attendance /></RoleRoute>} />
        <Route path="/attendance-view" element={<RoleRoute pageId="view_attendance"><AttendanceView /></RoleRoute>} />
        <Route path="/salary-slip" element={<RoleRoute pageId="salary_slip"><SalarySlip /></RoleRoute>} />
        {/* Employee Designation, Type, and Department Routes */}
        <Route path="/employee-designations" element={<RoleRoute pageId="employee_designations"><EmployeeDesignation /></RoleRoute>} />
        <Route path="/employee-types" element={<RoleRoute pageId="employee_types"><EmployeeType /></RoleRoute>} />
        <Route path="/employee-departments" element={<RoleRoute pageId="employee_departments"><EmployeeDepartment /></RoleRoute>} />
        {/* Vehicle Management Route */}
        <Route path="/vehicle-management" element={<RoleRoute pageId="vehicle_management"><VehicleManagement /></RoleRoute>} />
        <Route path="/address-structure" element={<RoleRoute pageId="address_structure"><AddressStructure /></RoleRoute>} />
        {/* Roaster App Route */}
        <Route path="/roaster" element={<RoleRoute pageId="roaster"><Roaster /></RoleRoute>} />
        {/* Schedule Routes */}
        <Route path="/schedule-master" element={<RoleRoute pageId="schedule_master"><ScheduleMaster /></RoleRoute>} />
        <Route path="/schedule-assign-employee" element={<RoleRoute pageId="schedule_assign"><ScheduleAssignEmployee /></RoleRoute>} />
        {/* Leave Management Routes */}
        <Route path="/leave-type" element={<RoleRoute pageId="leave_types"><LeaveType /></RoleRoute>} />
        <Route path="/leave-allocation" element={<RoleRoute pageId="leave_allocation"><LeaveAllocation /></RoleRoute>} />
        <Route path="/leave-apply" element={<RoleRoute pageId="leave_apply"><LeaveApply /></RoleRoute>} />
        {/* Salary Receipt List Route */}
        <Route path="/salary-receipt-list" element={<RoleRoute pageId="salary_list"><SalaryReceiptList /></RoleRoute>} />
        {/* System Configuration Routes */}
        <Route path="/backup" element={<RoleRoute pageId="backup"><BackupPage /></RoleRoute>} />
        <Route path="/system-settings" element={<RoleRoute pageId="system_settings"><SystemSettings /></RoleRoute>} />
        <Route path="/tax-master" element={<RoleRoute pageId="tax_master"><TaxMaster /></RoleRoute>} />
        <Route path="/email-settings" element={<RoleRoute pageId="email_settings"><EmailSettings /></RoleRoute>} />
        <Route path="/print-settings" element={<RoleRoute pageId="print_settings"><PrintSettings /></RoleRoute>} />
        {/* Operational Routes */}
        <Route path="/active-orders" element={<RoleRoute pageId="active_orders"><ActiveOrders /></RoleRoute>} />
        <Route path="/dashboard" element={<RoleRoute pageId="dashboard"><Dashboard /></RoleRoute>} />
        <Route path="/admin-dashboard" element={<RoleRoute pageId="admin_dashboard"><AdminDashboard /></RoleRoute>} />
        <Route path="/users" element={<RoleRoute pageId="user_management"><UserList /></RoleRoute>} />
        <Route path="/add-kitchen" element={<RoleRoute pageId="add_kitchen"><AddKitchenPage /></RoleRoute>} />
        <Route path="/add-item-group" element={<RoleRoute pageId="add_item_group"><AddItemGroupPage /></RoleRoute>} />
        <Route path="/add-ingredients-nutrition" element={<RoleRoute pageId="add_ingredients"><AddingirdientAndNurion /></RoleRoute>} />
        {/* Reporting Routes */}
        <Route path="/sales-reports" element={<RoleRoute pageId="sales_report"><SalesReportPage /></RoleRoute>} />
        <Route path="/sales-kanban" element={<RoleRoute pageId="sales_report"><SalesKanban /></RoleRoute>} />
        <Route path="/trip-report" element={<RoleRoute pageId="trip_report"><TripReport /></RoleRoute>} />
        <Route path="/pos-balance" element={<RoleRoute pageId="pos_balance"><PosBalance /></RoleRoute>} />
        {/* Additional Feature Routes */}
        <Route path="/booking" element={<RoleRoute pageId="tables"><Booking /></RoleRoute>} />
        <Route path="/create-variant" element={<RoleRoute pageId="create_variant"><CreateVariant /></RoleRoute>} />
        <Route path="/employees" element={<RoleRoute pageId="delivery_persons"><Employee /></RoleRoute>} />
        <Route path="/vat" element={<RoleRoute pageId="vat"><VatPage /></RoleRoute>} />
        <Route path="/create-customer" element={<RoleRoute pageId="create_customer"><CreateCustomerPage /></RoleRoute>} />
        <Route path="/edit-customer/:id" element={<RoleRoute pageId="customer_list"><CreateCustomerPage /></RoleRoute>} />
        <Route path="/customer-view/:id" element={<RoleRoute pageId="customer_list"><CustomerView /></RoleRoute>} />
        <Route path="/create-customer-group" element={<RoleRoute pageId="create_customer_group"><CreateCustomerGroup /></RoleRoute>} />
        {/* Notification Route */}
        <Route path="/notifications" element={<RoleRoute pageId="home"><NotificationPage /></RoleRoute>} />
        {/* Voice Notification Route */}
        <Route path="/voice" element={<RoleRoute pageId="home"><Voice /></RoleRoute>} />
        <Route path="/doctype" element={<RoleRoute pageId="doctype"><DocType /></RoleRoute>} />
      </Routes>
    </div>
  );
};

export default UserRouter;
