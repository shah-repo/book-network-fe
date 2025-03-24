import React from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuth } from "../../../contextApi/ContextApi";

interface LoginFormInputs {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const { token, setToken } = useAuth();

  const navigate = useNavigate();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    console.log("Login Data:", data);

    try {
      const { data: response } = await api.post(
        "/api/v1/auth/authenticate",
        data
      );
      reset();
      console.log("Form Data:", { response, data });
      localStorage.setItem("JWT_TOKEN", JSON.stringify(response.token));
      setToken(response.token);
      toast.success("Login Successfull!");
    } catch (error) {
      toast.error("error");
      console.log({ error });
    }
  };

  if (token) {
    return <Navigate to={"/"} />;
  }

  return (
    <div className="flex items-center justify-center min-h-[91vh] bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent>
          <Typography variant="h5" className="text-center font-bold mb-4">
            Login to Your Account
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Input */}
            <div className="mb-4">
              <TextField
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                {...register("email", { required: "Email is required" })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <TextField
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                {...register("password", { required: "Password is required" })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Login
            </Button>
          </form>

          {/* Registration Link */}
          <Typography className="text-center mt-4 text-sm">
            Don't have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Register here
            </span>
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
