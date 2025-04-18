import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useParams } from 'react-router-dom'
import { otpVerification, resetAuthSlice } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
function OTP() {

    const {email}=useParams();
    const [otp, setOtp] = React.useState("");
    const dispatch = useDispatch();

    const {
        loading,error,message,user,isAuthenticated}=useSelector((state)=>state.auth);
      
    const handleOtpVerification=(e)=>{
        e.preventDefault();
        dispatch(otpVerification(email,otp))
    }

    useEffect(() => {
        if (message) {
            toast.success(message);
        }
        if (error) {
            toast.error(error);
            dispatch(resetAuthSlice());
        }
    }, [dispatch, isAuthenticated, error, loading]);
    
    if (isAuthenticated) {
        return <Navigate to="/" />;
    }
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 relative">
            <Link
              to="/register"
              className="absolute top-4 left-4 text-sm text-gray-600 hover:underline"
            >
              ← Back
            </Link>
    
            <h1 className="text-2xl font-semibold text-center mb-4">
              Check your Mailbox
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Please enter the OTP to proceed
            </p>
    
            <form onSubmit={handleOtpVerification}>
              <input
                type="number"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none mb-6"
              />
              <button
                type="submit"
                className="w-full bg-black text-white font-medium py-3 rounded-md hover:bg-gray-900 transition"
              >
                VERIFY
              </button>
            </form>
          </div>
        </div>
      </>
    );    
}

export default OTP
