/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useGetPermissionByIdQuery } from "../../../app/Features/permissionSlice";
import { useGetAllMenuQuery, useGetMenuByIdQuery } from "../../../app/Features/menusSlice";

const OtpInput = ({ length = 4, onOtpSubmit = () => { } }) => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const { data: menuData } = useGetPermissionByIdQuery({ id: userId, token });
  // useGetMenuByIdQuery({ id: userId, token });
  useGetAllMenuQuery(token);
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    localStorage.setItem('menus', JSON.stringify(menuData?.data));
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [menuData]);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // allow only one input
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // submit trigger
    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === length) onOtpSubmit(combinedOtp);

    // Move to next input if current field is filled
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleClick = (index) => {
    inputRefs.current[index].setSelectionRange(1, 1);

    // optional
    if (index > 0 && !otp[index - 1]) {
      inputRefs.current[otp.indexOf("")].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      // Move focus to the previous input field on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      {otp.map((value, index) => {
        return (
          <input
            key={index}
            type="text"
            ref={(input) => (inputRefs.current[index] = input)}
            value={value}
            onChange={(e) => handleChange(index, e)}
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            style={{
              width: "40px",
              height: "45px",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#1e3a5f";
              e.target.style.boxShadow = "0 0 0 2px rgba(30, 58, 95, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.boxShadow = "none";
            }}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;