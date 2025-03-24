import React, { useState } from "react";
import OTPInput from "react-otp-input";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AccountActivation: React.FC = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (otp.length === 6) {
      api.get("/api/v1/auth/activate-token", {
        params: {
          token: otp,
        },
      });
      toast.success("OTP Verified Successfully!");
      navigate("/login"); // Navigate to the login after activation
    } else {
      alert("Please enter a valid 6-digit OTP.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      {/* OTP Input Field */}
      <OTPInput
        value={otp}
        onChange={setOtp}
        numInputs={6}
        renderSeparator={<span className="mx-2">-</span>}
        renderInput={(props) => (
          <input
            {...props}
            className="w-12 h-12 text-center border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      />

      {/* Submit Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={otp.length !== 6}
        className="mt-4"
      >
        Verify OTP
      </Button>
    </div>
  );
};

export default AccountActivation;
