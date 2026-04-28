import React, { useState } from "react";
import {
    RiPhoneLine,
    RiLockPasswordLine,
    RiShieldCheckLine,
    RiArrowRightLine,
    RiCheckFill,
    RiArrowLeftLine
} from "react-icons/ri";
import { toast } from "react-toastify";
import api from "../../services/api";
import { Link, useNavigate } from "react-router";

import logo from "../../assets/logo.jpg";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        phone: "",
        otp: "",
        password: "",
        confirmPassword: ""
    });

    // Validation States
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    // Step 1: Submit Phone Number
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        if (!formData.phone || formData.phone.length < 9) {
            setErrors({ phone: "Please enter a valid phone number" });
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('send-otp', { phone_number: formData.phone });
            if (res.data.status !== 200) {
                toast.error("Failed to send OTP. Please try again.");
                return;
            }
            setStep(2);
            toast.info("OTP sent to your phone");
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (formData.otp.length !== 6) {
            setErrors({ otp: "OTP must be 6 digits" });
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('verify-otp', { phone_number: formData.phone, otp: formData.otp });
            if (res.data.status !== 200) {
                toast.error("Invalid OTP");
                return;
            }
            setStep(3);
        } catch (err) {
            toast.error("Verification failed");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (formData.password.length < 6) newErrors.password = "Min 6 characters required";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('new-password', { phone_number: formData.phone, new_password: formData.password });
            if (res.data.status !== 200) {
                toast.error("Failed to reset password");
                return;
            }
            toast.success("Password reset successfully!");
            navigate(-1);
        } catch (err) {
            toast.error("Error resetting password");
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
                            alt="Logo"
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
                            Account Recovery • Step {step} of 3
                        </p>
                    </div>
                </div>

                <div style={{ padding: "24px 28px 20px" }}>
                    {/* Progress Bar */}
                    <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                style={{
                                    height: "4px",
                                    flex: 1,
                                    borderRadius: "2px",
                                    backgroundColor: s <= step ? "#1e3a5f" : "#e2e8f0",
                                    transition: "background-color 0.3s"
                                }}
                            />
                        ))}
                    </div>

                    {/* STEP 1: PHONE INPUT */}
                    {step === 1 && (
                        <form onSubmit={handlePhoneSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ textAlign: "center", marginBottom: "4px" }}>
                                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#1e3a5f" }}>Forgot Password?</h3>
                                <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>Enter your phone to receive an OTP</p>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "5px", textTransform: "uppercase" }}>Phone Number</label>
                                <div style={{ position: "relative" }}>
                                    <RiPhoneLine style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="012 345 678"
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px 9px 34px",
                                            fontSize: "13px",
                                            backgroundColor: "#f8fafc",
                                            border: errors.phone ? "1px solid #ef4444" : "1px solid #cbd5e1",
                                            borderRadius: "7px",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.phone && <p style={{ color: "#ef4444", fontSize: "10px", margin: "4px 0 0" }}>{errors.phone}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    backgroundColor: "#1e3a5f",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "7px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                {loading ? "Sending..." : "Send OTP"} <RiArrowRightLine />
                            </button>

                            <Link to={-1} style={{ textAlign: "center", fontSize: "11px", color: "#1e3a5f", textDecoration: "none", fontWeight: 500 }}>
                                <RiArrowLeftLine /> Back to Login
                            </Link>
                        </form>
                    )}

                    {/* STEP 2: OTP VERIFICATION */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ textAlign: "center", marginBottom: "4px" }}>
                                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#1e3a5f" }}>Verify Code</h3>
                                <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>Enter 6-digit code sent to your phone</p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    name="otp"
                                    maxLength="6"
                                    placeholder="0 0 0 0 0 0"
                                    style={{
                                        width: "100%",
                                        textAlign: "center",
                                        fontSize: "20px",
                                        letterSpacing: "4px",
                                        fontWeight: "700",
                                        padding: "10px",
                                        backgroundColor: "#f8fafc",
                                        border: errors.otp ? "1px solid #ef4444" : "1px solid #cbd5e1",
                                        borderRadius: "7px",
                                        outline: "none"
                                    }}
                                    value={formData.otp}
                                    onChange={handleChange}
                                />
                                {errors.otp && <p style={{ color: "#ef4444", fontSize: "10px", textAlign: "center", margin: "4px 0 0" }}>{errors.otp}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    backgroundColor: "#1e3a5f",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "7px",
                                    cursor: "pointer"
                                }}
                            >
                                {loading ? "Verifying..." : "Continue"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{ background: "none", border: "none", color: "#6b7280", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}

                    {/* STEP 3: NEW PASSWORD */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ textAlign: "center", marginBottom: "4px" }}>
                                <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#1e3a5f" }}>New Password</h3>
                                <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>Create a strong new password</p>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "5px", textTransform: "uppercase" }}>New Password</label>
                                <div style={{ position: "relative" }}>
                                    <RiLockPasswordLine style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px 9px 34px",
                                            fontSize: "13px",
                                            backgroundColor: "#f8fafc",
                                            border: errors.password ? "1px solid #ef4444" : "1px solid #cbd5e1",
                                            borderRadius: "7px",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.password && <p style={{ color: "#ef4444", fontSize: "10px", margin: "4px 0 0" }}>{errors.password}</p>}
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "5px", textTransform: "uppercase" }}>Confirm Password</label>
                                <div style={{ position: "relative" }}>
                                    <RiLockPasswordLine style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px 9px 34px",
                                            fontSize: "13px",
                                            backgroundColor: "#f8fafc",
                                            border: errors.confirmPassword ? "1px solid #ef4444" : "1px solid #cbd5e1",
                                            borderRadius: "7px",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.confirmPassword && <p style={{ color: "#ef4444", fontSize: "10px", margin: "4px 0 0" }}>{errors.confirmPassword}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    backgroundColor: "#1e3a5f",
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "7px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px"
                                }}
                            >
                                {loading ? "Updating..." : "Reset Password"} <RiCheckFill size={18} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;