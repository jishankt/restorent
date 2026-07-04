import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { FaUsers, FaBox, FaUserTie, FaFileInvoiceDollar, FaBuilding, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, baseUrl } = useContext(UserContext);
  const [activeCompany, setActiveCompany] = useState(() => {
    return localStorage.getItem('active_company') || 'All';
  });
  const [activeBranch, setActiveBranch] = useState(() => {
    return localStorage.getItem('active_branch') || 'All Branches';
  });
  const [branches, setBranches] = useState([]);
  
  const [metrics, setMetrics] = useState({
    customers: 0,
    items: 0,
    employees: 0,
    sales_invoices: 0
  });
  
  const [chartData, setChartData] = useState({ labels: [], data: [], metric: 'sales' });
  const [dateFilter, setDateFilter] = useState('monthly'); // daily, monthly, yearly, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [chartType, setChartType] = useState('line'); // line or bar
  const [activeMetric, setActiveMetric] = useState('sales'); // sales, customers, items, employees
  const [loading, setLoading] = useState(false);

  // Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      if (!activeCompany || activeCompany === 'All') {
        setBranches([]);
        return;
      }
      try {
        const res = await axios.get(`${baseUrl}/api/branches`, { params: { company_name: activeCompany } });
        setBranches(res.data || []);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, [activeCompany, baseUrl]);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const params = {
          company: activeCompany,
          branch: activeBranch,
          date_filter: dateFilter,
          metric_type: activeMetric
        };
        
        if (dateFilter === 'custom') {
          if (!startDate || !endDate) {
            setLoading(false);
            return; // don't fetch if custom is selected but no dates
          }
          params.start_date = startDate;
          params.end_date = endDate;
        }

        const metricsRes = await axios.get(`${baseUrl}/api/admin-dashboard/metrics`, { params });
        setMetrics(metricsRes.data);

        const chartRes = await axios.get(`${baseUrl}/api/admin-dashboard/chart-data`, { params });
        setChartData(chartRes.data);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [activeCompany, activeBranch, dateFilter, activeMetric, startDate, endDate, baseUrl]);

  const handleCompanyChange = (e) => {
    const val = e.target.value;
    setActiveCompany(val);
    localStorage.setItem('active_company', val);
    setActiveBranch('All Branches');
    localStorage.setItem('active_branch', 'All Branches');
  };

  const handleBranchChange = (e) => {
    const val = e.target.value;
    setActiveBranch(val);
    localStorage.setItem('active_branch', val);
  };

  const metricLabels = {
    sales: 'Total Sales ($)',
    customers: 'Customers Created',
    items: 'Items Added',
    employees: 'Employees Hired'
  };

  const metricColors = {
    sales: '#e74c3c',
    customers: '#8e44ad',
    items: '#f39c12',
    employees: '#27ae60'
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14, weight: '600' }, color: '#34495e' } },
      title: {
        display: true,
        text: `${metricLabels[activeMetric]} (${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)})`,
        font: { size: 18, weight: 'bold' },
        color: '#2c3e50',
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(44, 62, 80, 0.9)',
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#7f8c8d', font: { weight: '500' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#7f8c8d', font: { weight: '500' } }
      }
    }
  };

  const cData = {
    labels: chartData.labels,
    datasets: [
      {
        fill: chartType === 'bar', // only fill bar chart
        label: metricLabels[activeMetric],
        data: chartData.data,
        backgroundColor: chartType === 'line' ? 'transparent' : `${metricColors[activeMetric]}CC`,
        borderColor: metricColors[activeMetric],
        borderWidth: chartType === 'line' ? 3 : 2,
        tension: chartType === 'line' ? 0.1 : 0.4, // 0.1 for jagged line like stock charts
        borderRadius: chartType === 'bar' ? 6 : 0,
        pointBackgroundColor: chartType === 'line' ? metricColors[activeMetric] : '#fff',
        pointBorderColor: metricColors[activeMetric],
        pointBorderWidth: 2,
        pointRadius: chartData.data.length === 1 ? 8 : 3,
        pointHoverRadius: chartData.data.length === 1 ? 10 : 6
      },
    ],
  };

  return (
    <div style={{ 
      padding: '30px 20px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header & Filters */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px', 
          flexWrap: 'wrap', 
          gap: '20px',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: '20px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          
          {/* Left: Back Button */}
          <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: '#fff', border: '1px solid rgba(0,0,0,0.05)', 
                padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', 
                color: '#2c3e50', fontWeight: 'bold', fontSize: '1rem', 
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.transform = 'translateX(-3px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; }}
            >
              <FaArrowLeft /> Back
            </button>
          </div>

          {/* Center: Titles */}
          <div style={{ flex: '2', textAlign: 'center', minWidth: '250px' }}>
            <h2 style={{ color: '#2c3e50', margin: 0, fontWeight: '800', fontSize: '2rem', letterSpacing: '-0.5px' }}>Overview Dashboard</h2>
            <p style={{ color: '#7f8c8d', margin: '5px 0 0 0', fontWeight: '500' }}>Monitor your business performance in real-time</p>
          </div>
          
          {/* Right: Filters */}
          <div style={{ flex: '1', display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {/* Company Filter */}
            {(user?.role === 'group_admin' || user?.role === 'superadmin') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '10px 20px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.02)' }}>
                <FaBuilding color="#34495e" size={18} />
                <select 
                  value={activeCompany} 
                  onChange={handleCompanyChange}
                  style={{ border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}
                >
                  {(user?.role === 'group_admin' || user?.role === 'superadmin') && <option value="All">All Companies</option>}
                  {user?.companies?.map((c, i) => {
                      const cName = typeof c === 'object' ? (c.company_name || c.company || c.name) : c;
                      return <option key={i} value={cName}>{cName}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Branch Filter */}
            {activeCompany !== 'All' && (user?.role === 'group_admin' || user?.role === 'superadmin' || user?.role === 'company_admin') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '10px 20px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.02)' }}>
                <select 
                  value={activeBranch} 
                  onChange={handleBranchChange}
                  style={{ border: 'none', outline: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600', color: '#2c3e50', fontSize: '1rem' }}
                >
                  <option value="All Branches">All Branches</option>
                  {branches.map((b, i) => {
                    const bName = b.branch_name || b.branch || b.name || b;
                    return <option key={i} value={bName}>{bName}</option>;
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '35px' }}>
          <MetricCard title="Customers" count={metrics.customers} icon={<FaUsers />} color="#8e44ad" isActive={activeMetric === 'customers'} onClick={() => setActiveMetric('customers')} />
          <MetricCard title="Items" count={metrics.items} icon={<FaBox />} color="#f39c12" isActive={activeMetric === 'items'} onClick={() => setActiveMetric('items')} />
          <MetricCard title="Employees" count={metrics.employees} icon={<FaUserTie />} color="#27ae60" isActive={activeMetric === 'employees'} onClick={() => setActiveMetric('employees')} />
          <MetricCard title="Sales Invoices" count={metrics.sales_invoices} icon={<FaFileInvoiceDollar />} color="#e74c3c" isActive={activeMetric === 'sales'} onClick={() => setActiveMetric('sales')} />
        </div>

        {/* Chart Section */}
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.8)', 
          borderRadius: '24px', 
          padding: '35px', 
          boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <FilterBtn active={dateFilter === 'daily'} onClick={() => setDateFilter('daily')}>Daily</FilterBtn>
              <FilterBtn active={dateFilter === 'monthly'} onClick={() => setDateFilter('monthly')}>Monthly</FilterBtn>
              <FilterBtn active={dateFilter === 'yearly'} onClick={() => setDateFilter('yearly')}>Yearly</FilterBtn>
              <FilterBtn active={dateFilter === 'custom'} onClick={() => setDateFilter('custom')}>Custom Range</FilterBtn>
              
              {dateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: '10px' }}>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInputStyle} />
                  <span style={{color: '#7f8c8d', fontWeight: 'bold'}}>to</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInputStyle} />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <FilterBtn active={chartType === 'line'} onClick={() => setChartType('line')}>Line Chart</FilterBtn>
              <FilterBtn active={chartType === 'bar'} onClick={() => setChartType('bar')}>Bar Chart</FilterBtn>
            </div>
          </div>
          
          <div style={{ height: '500px', width: '100%', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10, borderRadius: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: `4px solid ${metricColors[activeMetric]}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: metricColors[activeMetric] }}>Updating Chart...</span>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            )}
            
            {!loading && cData.datasets[0].data.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)', zIndex: 5, flexDirection: 'column', borderRadius: '15px' }}>
                <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34495e', display: 'block', marginBottom: '10px' }}>No Data Available</span>
                  <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>Try adjusting your date filters or selecting a different company.</span>
                </div>
              </div>
            )}
            
            {chartType === 'line' ? (
              <Line key={activeMetric + '-line'} options={chartOptions} data={cData} />
            ) : (
              <Bar key={activeMetric + '-bar'} options={chartOptions} data={cData} />
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

const MetricCard = ({ title, count, icon, color, isActive, onClick }) => (
  <div 
    onClick={onClick}
    style={{ 
      backgroundColor: isActive ? color : '#fff', 
      borderRadius: '24px', 
      padding: '30px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      boxShadow: isActive ? `0 15px 30px ${color}40` : '0 10px 30px rgba(0,0,0,0.03)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: isActive ? 'none' : '1px solid rgba(0,0,0,0.04)',
      transform: isActive ? 'translateY(-5px)' : 'none'
    }}
    onMouseOver={(e) => {
      if (!isActive) {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.06)';
      }
    }}
    onMouseOut={(e) => {
      if (!isActive) {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.03)';
      }
    }}
  >
    <div style={{ flex: 1 }}>
      <p style={{ color: isActive ? 'rgba(255,255,255,0.9)' : '#95a5a6', fontSize: '1.05rem', fontWeight: '700', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
      <h3 style={{ color: isActive ? '#fff' : '#2c3e50', fontSize: '3.2rem', fontWeight: '900', margin: 0, lineHeight: 1 }}>{count}</h3>
    </div>
    <div style={{ 
      width: '85px', 
      height: '85px', 
      borderRadius: '22px', 
      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${color}15`, 
      color: isActive ? '#fff' : color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: '2.8rem',
      backdropFilter: isActive ? 'blur(5px)' : 'none'
    }}>
      {icon}
    </div>
  </div>
);

const FilterBtn = ({ active, onClick, children }) => (
  <button 
    onClick={onClick}
    style={{
      padding: '10px 22px',
      borderRadius: '12px',
      border: `1px solid ${active ? '#2c3e50' : 'rgba(0,0,0,0.05)'}`,
      backgroundColor: active ? '#2c3e50' : '#fff',
      color: active ? '#fff' : '#7f8c8d',
      fontWeight: '700',
      fontSize: '0.95rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: active ? '0 4px 15px rgba(44, 62, 80, 0.2)' : '0 2px 8px rgba(0,0,0,0.02)'
    }}
  >
    {children}
  </button>
);

const dateInputStyle = {
  padding: '9px 15px',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  outline: 'none',
  fontFamily: 'inherit',
  fontWeight: '600',
  color: '#2c3e50',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
};

export default AdminDashboard;
