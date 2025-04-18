import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { Menu, User, ClipboardList, Heart, LogOut, Home, PlusCircle, Calendar } from 'lucide-react';

export default function UDashBoard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Add "My Events" to the sections array
  const sections = ['Created Issues', 'Volunteering Oppurtunities', 'User Dashboard', 'Donations', 'PostIssue', 'My Events'];

  const sectionIcons = {
    'Created Issues': <ClipboardList size={18} />, 
    'Volunteering Oppurtunities': <Heart size={18} />, 
    'User Dashboard': <User size={18} />, 
    'Donations': <Heart size={18} />, 
    'PostIssue': <PlusCircle size={18} />,
    'My Events': <Calendar size={18} />
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };
  
  const handleSectionClick = (section) => {
    let slug;
    if (section === 'Donations') {
      slug = 'donations';
    } else if (section === 'My Events') {
      slug = 'my-events';
    } else {
      slug = section.toLowerCase().replace(/\s+/g, '-');
    }
    navigate(`/dashboard/${slug}`);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow hover:bg-blue-700 transition"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-6 flex flex-col transform transition-transform duration-300 ease-in-out z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center mb-8 pl-10">
          <h2 className="text-2xl font-bold">Neighbour Net</h2>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {sections.map((sec) => {
              // Determine if this section is active
              let slug;
              if (sec === 'Donations') {
                slug = 'donations';
              } else if (sec === 'My Events') {
                slug = 'my-events';
              } else {
                slug = sec.toLowerCase().replace(/\s+/g, '-');
              }
              const isActive = window.location.pathname === `/dashboard/${slug}`;
              return (
                <li key={sec}>
                  <button
                    onClick={() => handleSectionClick(sec)}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition font-medium shadow-sm
                      ${isActive ? 'bg-blue-500 text-white shadow-md' : 'text-blue-100 hover:bg-blue-800 hover:bg-opacity-50'}`}
                  >
                    <span className="mr-3">{sectionIcons[sec]}</span>
                    <span>{sec}</span>
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

      {/* Main content area for nested pages */}
      <main className={`flex-1 bg-gray-100 p-6 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to Neighbour Net!</h1>
          <p className="text-gray-600 mt-2">Your one-stop platform to raise issues, volunteer for causes, and make a difference in your neighborhood.</p>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
