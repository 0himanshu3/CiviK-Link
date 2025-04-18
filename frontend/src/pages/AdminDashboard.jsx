import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaRupeeSign, FaUsers, FaBuilding, FaFilter, FaHandHoldingHeart, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [totalDonations, setTotalDonations] = useState(0);
  const [users, setUsers] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [userCity, setUserCity] = useState('');
  const [ngoCity, setNgoCity] = useState('');
  const [userCities, setUserCities] = useState([]);
  const [ngoCities, setNgoCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNGOs: 0,
    activeUsers: 0,
    activeNGOs: 0
  });

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchTotalDonations = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/admin/total-donations', { withCredentials: true });
      setTotalDonations(res.data.totalDonations || 0);
    } catch (err) {
      console.error('Error fetching total donations:', err);
      setTotalDonations(0);
    }
  };

  const fetchUsers = async (city = '') => {
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/admin/users${city ? `?city=${city}` : ''}`, { withCredentials: true });
      setUsers(res.data.users || []);
      const cities = Array.from(new Set((res.data.users || []).map(u => u.location))).filter(Boolean);
      setUserCities(cities);
      setStats(prev => ({ ...prev, totalUsers: res.data.users.length }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  const fetchNgos = async (city = '') => {
    try {
      const res = await axios.get(`http://localhost:3000/api/v1/admin/ngos${city ? `?city=${city}` : ''}`, { withCredentials: true });
      setNgos(res.data.ngos || []);
      const cities = Array.from(new Set((res.data.ngos || []).map(n => n.location))).filter(Boolean);
      setNgoCities(cities);
      setStats(prev => ({ ...prev, totalNGOs: res.data.ngos.length }));
    } catch (err) {
      console.error('Error fetching NGOs:', err);
      setNgos([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTotalDonations(), fetchUsers(), fetchNgos()]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserCityChange = (e) => {
    setUserCity(e.target.value);
    fetchUsers(e.target.value);
  };
  const handleNgoCityChange = (e) => {
    setNgoCity(e.target.value);
    fetchNgos(e.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-blue-900"
        >
          Admin Dashboard
        </motion.h1>
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 flex items-center rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <FaSignOutAlt className="mr-2" />
          Logout
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Donations"
          value={totalDonations.toLocaleString()}
          icon={<FaRupeeSign className="mr-2" />}
          color="from-blue-600 to-blue-400"
          rightIcon={<FaHandHoldingHeart className="text-4xl opacity-80" />}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<FaUsers className="mr-4" />}
          color="from-green-600 to-green-400"
        />
        <StatCard
          title="Total NGOs"
          value={stats.totalNGOs}
          icon={<FaBuilding className="mr-4" />}
          color="from-purple-600 to-purple-400"
        />
      </div>

      {/* Users Table */}
      <DataTable
        title="All Users"
        icon={<FaUsers className="mr-2" />}
        data={users}
        filterValue={userCity}
        onFilterChange={handleUserCityChange}
        filterOptions={userCities}
        columns={[
          { label: 'Name', key: 'name' },
          { label: 'Email', key: 'email' },
          { label: 'City', key: 'location' }
        ]}
      />

      {/* NGOs Table */}
      <DataTable
        title="All NGOs"
        icon={<FaBuilding className="mr-2" />}
        data={ngos}
        filterValue={ngoCity}
        onFilterChange={handleNgoCityChange}
        filterOptions={ngoCities}
        columns={[
          { label: 'Name', key: 'name' },
          { label: 'Email', key: 'email' },
          { label: 'City', key: 'location' },
          {
            label: 'Total Donations',
            key: 'totalDonations',
            render: (val) => (
              <div className="flex items-center text-sm text-gray-500">
                <FaRupeeSign className="text-green-500 mr-1" />
                {val?.toLocaleString() || 0}
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

// Reusable Components

const StatCard = ({ title, value, icon, color, rightIcon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-gradient-to-r ${color} text-white rounded-xl shadow-lg p-6`}
  >
    <div className="flex justify-between items-center">
      <div>
        <p className="text-lg font-semibold mb-2">{title}</p>
        <div className="text-3xl font-bold flex items-center">{icon}{value}</div>
      </div>
      {rightIcon && rightIcon}
    </div>
  </motion.div>
);

const DataTable = ({ title, icon, data, filterValue, onFilterChange, filterOptions, columns }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-white rounded-xl shadow-md p-6 mb-10"
  >
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-blue-800 flex items-center">{icon}{title}</h2>
      <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
        <FaFilter className="mr-2 text-gray-500" />
        <select
          value={filterValue}
          onChange={onFilterChange}
          className="bg-transparent border-none focus:outline-none text-gray-700"
        >
          <option value="">All Cities</option>
          {filterOptions.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-left">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(col => (
              <th key={col.key} className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                  {col.render ? col.render(item[col.key]) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

export default AdminDashboard;
