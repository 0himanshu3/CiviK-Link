import { useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'

import NGODashh from './pages/NGODashh'

import UDashBoard from './pages/UDashBoard'
import UserDashboard from './pages/UserDashboard'
import NGODashh from './pages/NGODashh'
import NGODashboard from './pages/NGODashboard'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import OTP from './pages/OTP'
import ResetPassword from './pages/ResetPassword'
import { getUser } from './redux/slices/authSlice'
import PostIssue from './pages/PostIssue'

const App = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getUser());
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/otp-verification/:email" element={<OTP />} />
        <Route path="/password/reset/:token" element={<ResetPassword />} />
        <Route path="/create" element={<PostIssue />} />
       
        <Route path="/dashboard" element={<UDashBoard />}>
          <Route path="user-dashboard" element={<UserDashboard />} />
        </Route>
        <Route path="/ngo-dashboard" element={<NGODashboard />}>
          <Route index element={<NGODashh />} />
        </Route>
      </Routes>
      <ToastContainer />
    </Router>
  );
}

export default App;
