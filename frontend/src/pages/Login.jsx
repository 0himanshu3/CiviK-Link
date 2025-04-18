import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { login, resetAuthSlice } from '../redux/slices/authSlice'
import { Eye, EyeOff } from 'lucide-react'

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const { loading, error, message, user, isAuthenticated } = useSelector(state => state.auth)

    const handleLogin = (e) => {
        e.preventDefault()
        const data = {
            email,
            password
        }
        dispatch(login(data))
    }

    useEffect(() => {
        if (message) {
            user?.role === 'Admin' ? navigate("/admin/dashboard") : navigate("/")
        }
        if (error) {
            dispatch(resetAuthSlice())
        }
    }, [dispatch, isAuthenticated, error, loading])

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
                        onClick={() => navigate("/admin/login")}
                        className="w-full mt-3 border border-black text-black py-2 rounded-md hover:bg-black hover:text-white transition"
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
