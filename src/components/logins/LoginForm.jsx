import React, { useEffect, useState } from "react";
import OtpInput from "./opt-input";
import api from "../../services/api";
import { Link, useNavigate } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetUserLoginQuery } from "../../../app/Features/usersSlice";
import { useGetAllMenuQuery } from "../../../app/Features/menusSlice";
import {
  useGetMenuHomeQuery,
  useGetMenuReportQuery,
  useGetMenuSettingQuery,
  useGetMenuSidebarQuery,
  useGetPermissionByIdQuery,
} from "../../../app/Features/permissionSlice";
import logo from "../../assets/logo.jpg";
import TelegramLogin from "./TelegramLogin";

const LoginForm = () => {
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [Id, setId] = useState(0);
  const { refetch } = useGetUserLoginQuery(
    localStorage.getItem("token")
  );
  const { refetch: refetchSidebar, data: sidebar } = useGetMenuSidebarQuery(
    localStorage.getItem("token")
  );
  const { refetch: refetchSetting, data: setting } = useGetMenuSettingQuery(
    localStorage.getItem("token")
  );
  const { refetch: refetchReport, data: report } = useGetMenuReportQuery(
    localStorage.getItem("token")
  );
  const { refetch: refetchHome, data: home } = useGetMenuHomeQuery(
    localStorage.getItem("token")
  );
  const [alert, setAlert] = useState({ message: "", show: false });
  const [login, setLogin] = useState({ phone_number: "", password: "" });


  const handleTelegramData = async (telegramUser) => {
    setIsLoading(true);
    
    try {
      // Forward the full object (id, first_name, username, auth_date, hash) to Laravel
      const response = await fetch('https://api.chomnenhapp.com/api/telegram-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(telegramUser),
      });

      const data = await response.json();

      const {
        user: { profile_id, id },
      } = data;
      
      console.log(profile_id, id);
      if (data.success) {
        refetchSidebar();
        refetch();
        refetchHome();
        refetchReport();
        refetchSetting();
        const res = await api.get(`/permission/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setId(id);
        localStorage.setItem("profileId", profile_id);
        localStorage.setItem("userId", id);
        localStorage.setItem('token', data.access_token);
        if (res.status == 200) {
          localStorage.setItem("menus", JSON.stringify(res?.data.data));
          localStorage.setItem("menus-sidebar", JSON.stringify(sidebar?.data));
          localStorage.setItem("menus-home", JSON.stringify(home?.data));
          localStorage.setItem("menus-report", JSON.stringify(report?.data));
          localStorage.setItem("menus-setting", JSON.stringify(setting?.data));
          toast.success("Login successful");
          navigate("/dashboard");
        }
      } else {
        alert(`Authentication Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Network or Backend Server Error:', error);
      alert('Could not connect to the authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = (otp) => {
    console.log("Login Successful", otp);
    navigate("/dashboard");
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

      if (response.status === 200) {
        refetchSidebar();
        refetch();
        refetchHome();
        refetchReport();
        refetchSetting();
        const res = await api.get(`/permission/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setId(id);
        localStorage.setItem("profileId", profile_id);
        localStorage.setItem("userId", id);
        localStorage.setItem("token", token);
        if (res.status == 200) {
          localStorage.setItem("menus", JSON.stringify(res?.data.data));
          localStorage.setItem("menus-sidebar", JSON.stringify(sidebar?.data));
          localStorage.setItem("menus-home", JSON.stringify(home?.data));
          localStorage.setItem("menus-report", JSON.stringify(report?.data));
          localStorage.setItem("menus-setting", JSON.stringify(setting?.data));
          toast.success("Login successful");
          id == 1 ? navigate("/dashboard") : navigate("/dashboard");
        }
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        padding: "1rem",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
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

      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* Header stripe */}
        <div
          style={{
            backgroundColor: "#1e3a5f",
            padding: "20px 28px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}
          >
            <img
              src={logo}
              alt="CHOMNECH POS Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
              }}
            >
              CHOMNECH APP
            </h1>
            <p style={{ margin: 0, fontSize: "11px", color: "#93c5fd" }}>
              Point of Sale System
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 20px" }}>
          {/* Sub-heading */}
          <div style={{ marginBottom: "18px" }}>
            <h2
              style={{
                margin: "0 0 2px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1e3a5f",
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
              Enter your credentials to continue
            </p>
          </div>

          {/* Alert */}
          {alert.show && (
            <div
              style={{
                marginBottom: "14px",
                padding: "10px 12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#dc2626",
              }}
            >
              <svg
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 20 20"
                style={{ flexShrink: 0 }}
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {alert.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Phone */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={login.phone_number}
                onChange={(e) =>
                  setLogin({ ...login, phone_number: e.target.value })
                }
                placeholder="e.g. 012 345 678"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13px",
                  color: "#111827",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1e3a5f")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={login.password}
                onChange={(e) =>
                  setLogin({ ...login, password: e.target.value })
                }
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13px",
                  color: "#111827",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1e3a5f")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right" }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "11px",
                  color: "#1e3a5f",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>
            <TelegramLogin 
              botUsername="chomnenh_bot" 
              onAuthSuccess={handleTelegramData} 
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: loading ? "#4a6fa5" : "#1e3a5f",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderRadius: "7px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s, transform 0.1s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#163057";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = "#1e3a5f";
              }}
            >
              {loading ? (
                <>
                  <svg
                    style={{ animation: "spin 1s linear infinite", width: "14px", height: "14px" }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 28px 16px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <p style={{ margin: 0, textAlign: "center", fontSize: "11px", color: "#6b7280" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "#1e3a5f", fontWeight: 600, textDecoration: "none" }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginForm;
