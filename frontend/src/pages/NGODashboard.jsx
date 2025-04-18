import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { Menu, X, Home, ClipboardList, MessageSquare, CheckCircle, Heart, LogOut } from 'lucide-react';
import { FaTrophy } from 'react-icons/fa';
import NGODashh from './NGODashh';

const NGODashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Handle redirection on page refresh
  useEffect(() => {
    // Only redirect if we're not already on the main dashboard
    if (location.pathname !== '/ngo-dashboard') {
      navigate('/ngo-dashboard');
    }
  }, []); // Empty dependency array means this only runs once on mount

  const sections = [
    { name: 'Dashboard', icon: <Home size={18} />, path: '' },
    { name: 'Requests', icon: <ClipboardList size={18} />, path: 'requests' },
    { name: 'Query Section', icon: <MessageSquare size={18} />, path: 'query-section' },
    { name: 'Claimed Issues', icon: <CheckCircle size={18} />, path: 'claimed-issues' },
    { name: 'Donations', icon: <Heart size={18} />, path: 'donations' }
  ];
  
  const handleSectionClick = (section) => {
    navigate(`/ngo-dashboard/${section.path}`);
  };

  const handleLogout = async () => {
    try {
      const success = await dispatch(logout());
      if (success) {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar Toggle Button - Always visible */}
      <button
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-6 flex flex-col transform transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center mb-8 pl-10">
          <h2 className="text-2xl font-bold">NeighBour Net</h2>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {sections.map((section) => {
              const isActive = location.pathname === `/ngo-dashboard/${section.path}` || 
                             (section.path === '' && location.pathname === '/ngo-dashboard');
              
              return (
                <li key={section.name}>
                  <button
                    onClick={() => handleSectionClick(section)}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition ${
                      isActive 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-blue-100 hover:bg-blue-800 hover:bg-opacity-50'
                    }`}
                  >
                    <span className="mr-3">{section.icon}</span>
                    <span>{section.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition"
          >
            <LogOut size={18} className="mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 bg-gray-100 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="mt-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default NGODashboard;