import React from "react";
import Alert from "@mui/material/Alert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

interface MessageProps {
  message?: string;
  onButtonClick?: () => void;
}

const Message: React.FC<MessageProps> = ({
  message = "Your activation code has been sent successfully to your email ID. Please check your inbox and follow the instructions to activate your account.",
  onButtonClick,
}) => {
    const navigate = useNavigate(); // Navigation hook

  const handleLoginRedirect = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
        navigate("/login"); // Default navigation
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <Alert
        icon={<CheckCircleIcon fontSize="inherit" />}
        severity="success"
        className="max-w-md p-4 text-lg shadow-lg"
      >
        {message}
      </Alert>
      <Button
        variant="contained"
        color="primary"
        onClick={handleLoginRedirect}
        className="mt-2"
      >
        Go to Login Page
      </Button>
    </div>
  );
};

export default Message;
