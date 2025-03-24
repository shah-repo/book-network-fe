import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  onClick,
}) => {
  const baseStyles =
    "px-11 py-3 text-base tracking-normal text-center border border-solid min-w-[148px] rounded-[200px] transition-all duration-300 ease-in-out";
  const variantStyles = {
    primary:
      "text-white bg-yellow-500 border-yellow-500 hover:bg-yellow-600 hover:scale-105",
    secondary:
      "text-white bg-cyan-600 border-cyan-600 hover:bg-cyan-700 hover:scale-105",
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};
