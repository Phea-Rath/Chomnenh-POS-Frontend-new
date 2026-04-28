// src/components/OtpVerification.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import logo from "../../assets/logo.jpg";

const OtpVerification = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        if (!phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        try {
            const response = await axios.post('http://your-laravel-app/api/send-otp', {
                phone_number: phoneNumber
            });

            setShowOtpField(true);
            setCountdown(120); // 2 minutes countdown
            toast.success('OTP sent successfully!');
            console.log('OTP (for testing):', response.data.otp); // Remove in production
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            await axios.post('http://your-laravel-app/api/verify-otp', {
                phone_number: phoneNumber,
                otp: otp
            });

            setIsVerified(true);
            toast.success('Phone number verified successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'OTP verification failed');
        }
    };

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div
            style={{
                width: "100%",
                maxWidth: "360px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
                overflow: "hidden",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
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
                <h2
                    style={{
                        margin: "0 0 18px",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1e3a5f",
                        textAlign: "center"
                    }}
                >
                    OTP Verification
                </h2>

                {isVerified ? (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <svg
                            style={{ margin: "0 auto", height: "48px", width: "48px", color: "#10B981" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p style={{ marginTop: "16px", fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                            Phone number verified successfully!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                            <PhoneInput
                                international
                                defaultCountry="US"
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                                disabled={showOtpField}
                                style={{
                                    width: "100%",
                                    fontSize: "13px",
                                    color: "#111827",
                                }}
                                className="custom-phone-input"
                            />
                        </div>

                        {showOtpField && (
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
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    placeholder="123456"
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
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                                    {countdown > 0 ? (
                                        <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>
                                            Expires in: {formatCountdown(countdown)}
                                        </p>
                                    ) : (
                                        <button
                                            onClick={handleSendOtp}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                padding: 0,
                                                fontSize: "11px",
                                                color: "#1e3a5f",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                textDecoration: "underline"
                                            }}
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={!showOtpField ? handleSendOtp : handleVerifyOtp}
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
                                transition: "background-color 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                letterSpacing: "0.3px",
                                marginTop: "8px"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#163057"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#1e3a5f"}
                        >
                            {!showOtpField ? "Send OTP" : "Verify OTP"}
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                .custom-phone-input input {
                    width: 100%;
                    padding: 9px 12px;
                    font-size: 13px;
                    background-color: #f8fafc;
                    border: 1px solid #cbd5e1;
                    border-radius: 7px;
                    outline: none;
                }
                .custom-phone-input input:focus {
                    border-color: #1e3a5f;
                }
            `}</style>
        </div>
    );
};

export default OtpVerification;