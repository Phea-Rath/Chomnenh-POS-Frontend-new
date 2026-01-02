import React, { useEffect, useState } from "react";
import OtpInput from "./opt-input";
import api from "../../services/api";
import { Link, useNavigate } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/shopping-cart.png";
import { useGetUserLoginQuery } from "../../../app/Features/usersSlice";

// Placeholder logo (you can replace this with your actual logo URL)
const LOGO_URL = "https://via.placeholder.com/150x50.png?text=E-STORE";

const LoginForm = () => {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { refetch, isLoading } = useGetUserLoginQuery(localStorage.getItem('token'));
  const [alert, setAlert] = useState({ message: "", show: false });
  const [login, setLogin] = useState({ phone_number: "", password: "" });

  const onOtpSubmit = (otp) => {
    console.log("Login Successful", otp);
    navigate("/dashboard/analystic");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!login.phone_number || !login.password) {
      setAlert({ message: "Please fill in all fields", show: true });
      return;
    }
    setLoading(true);

    try {
      const response = await api.post("/login", login);
      const {
        token,
        user: { profile_id, id },
      } = response.data;

      localStorage.setItem("profileId", profile_id);
      localStorage.setItem("userId", id);
      localStorage.setItem("token", token);
      refetch();
      if (!isLoading) {

        toast.success("Login successful");
        setShowOtpInput(true);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "An error occurred during login"
      );
      setAlert({
        message: err?.response?.data?.message || "Login failed",
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl">
        {/* Logo and Company Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-full p-3 shadow-lg mb-3">
            <img
              src={logo}
              alt="E-STORE Logo"
              className="h-10 sm:h-12 transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            E-STORE
          </h1>
          <p className="text-gray-500 text-sm mt-2">Welcome back</p>
        </div>

        {/* Alert */}
        {alert.show && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {alert.message}
          </div>
        )}

        {/* Login or OTP Form */}
        <div className="space-y-6">
          {showOtpInput ? (
            <div className="space-y-6 flex flex-col items-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Verify Phone Number
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter OTP sent to <span className="font-semibold text-gray-800">{login.phone_number}</span>
                </p>
              </div>
              <OtpInput length={4} onOtpSubmit={onOtpSubmit} />
              <button
                onClick={() => setShowOtpInput(false)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Login to Your Account
                </h2>
                <p className="text-gray-500 text-sm">
                  Enter your credentials to continue
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={login.phone_number}
                      onChange={(e) =>
                        setLogin({ ...login, phone_number: e.target.value })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={login.password}
                      onChange={(e) =>
                        setLogin({ ...login, password: e.target.value })
                      }
                      className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Forgot Password?
                  </Link>
                  <Link
                    to="/signup"
                    className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Don't have an account?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 ${loading
                    ? "bg-blue-400 cursor-not-allowed transform scale-95"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;