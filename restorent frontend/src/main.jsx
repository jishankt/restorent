import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider } from 'react-redux'
import { persistor, store } from './Redux/store.js'
import axios from 'axios';

// Global Axios interceptor to add company/branch headers
axios.interceptors.request.use((config) => {
  const active_company = localStorage.getItem('active_company');
  const active_branch = localStorage.getItem('active_branch');
  const token = localStorage.getItem('token');
  
  // NEW SAAS TENANCY HEADERS
  const active_tenant_id = localStorage.getItem('active_tenant_id');
  const active_company_id = localStorage.getItem('active_company_id');
  const active_branch_id = localStorage.getItem('active_branch_id');
  const active_tenant_name = localStorage.getItem('active_tenant_name');

  if (active_tenant_id && !config.headers['X-Tenant-Id']) config.headers['X-Tenant-Id'] = active_tenant_id;
  if (active_company_id && !config.headers['X-Company-Id']) config.headers['X-Company-Id'] = active_company_id;
  if (active_branch_id && !config.headers['X-Branch-Id']) config.headers['X-Branch-Id'] = active_branch_id;
  if (active_tenant_name && !config.headers['X-Tenant-Name']) config.headers['X-Tenant-Name'] = active_tenant_name;

  // Multi-Company Scoping: Only set if NOT already provided in the specific request
  if (active_company && !config.headers['X-Company-Name']) {
    config.headers['X-Company-Name'] = active_company;
  } else if (!config.headers['X-Company-Name']) {
    // Fallback: try to see if user object has it if activeContext is not explicitly set
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.company) config.headers['X-Company-Name'] = user.company;
      } catch (e) { }
    }
  }

  if (active_branch && !config.headers['X-Branch-Name']) {
    config.headers['X-Branch-Name'] = active_branch;
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersistGate loading={null} persistor={persistor}>
      <Provider store={store}>
        <App />
      </Provider>
    </PersistGate>
  </React.StrictMode>,
)
