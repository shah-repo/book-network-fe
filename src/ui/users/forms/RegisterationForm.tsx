import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import "tailwindcss";
import api from "../../../api/api";
import { toast } from "react-toastify";
import { Card, CardContent, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const RegistrationForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const { data: response } = await api.post("/api/v1/auth/register", data);
      reset();
      console.log("Form Data:", { response, data });
      toast.success("Registration Successfull!");
    } catch (error) {
      toast.error("error");
      console.log({ error });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[91vh] bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

            <div className="mb-4">
              <TextField
                label="First Name"
                fullWidth
                {...register("firstName", {
                  required: "First name is required",
                })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </div>

            <div className="mb-4">
              <TextField
                label="Last Name"
                fullWidth
                {...register("lastName", { required: "Last name is required" })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </div>

            <div className="mb-4">
              <TextField
                label="Email"
                type="email"
                fullWidth
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </div>

            <div className="mb-4">
              <TextField
                label="Password"
                type="password"
                fullWidth
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            </div>

            <Button type="submit" variant="contained" color="primary" fullWidth>
              Register
            </Button>
          </form>

          {/* Login Link */}
          <Typography className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Login here
            </span>
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationForm;
