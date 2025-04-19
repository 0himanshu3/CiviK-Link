import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { login, resetAuthSlice } from '../redux/slices/authSlice'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const { loading, error, user, isAuthenticated } = useSelector(state => state.auth)

    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

    const handleLogin = (e) => {
        e.preventDefault()
        dispatch(login({ email, password }))
    }

    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            dispatch(login({ email, password }))
                .unwrap()
                .then((result) => {
                    toast.success('Admin login successful!');
                    setTimeout(() => {
                        navigate('/admin/dashboard');
                    }, 100);
                })
                .catch((error) => {
                    toast.error(error.message || 'Login failed');
                });
        } else {
            toast.error('Invalid admin credentials');
        }
    }

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'NGO') {
                navigate('/ngo-dashboard');
            } else {
                navigate('/dashboard/user-dashboard');
            }
        }
        if (error) {
            dispatch(resetAuthSlice());
        }
    }, [isAuthenticated, user, error, dispatch, navigate]);

    if (isAuthenticated) {
        return <Navigate to="/" />
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                        />
                    </div>
                    <div className="mb-4 relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>
                    <div className="mb-4 text-sm text-right">
                        <Link to="/password/forgot" className="text-gray-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={handleAdminLogin}
                        className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Admin Login
                    </button>
                </form>
                <div className="mt-6 text-sm text-center">
                    New to our platform?{" "}
                    <Link to="/register" className="text-blue-600 hover:underline">
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login
