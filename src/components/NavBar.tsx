import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBook,
  faClock,
  faUndo,
  faClipboardList,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "./Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contextApi/ContextApi";
import {
  Avatar,
  Box,
  Button as MuiButton,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";

// interface ButtonProps {
//   children: React.ReactNode;
//   variant?: "primary" | "secondary";
//   className?: string;
//   onClick?: () => void;
// }

// export const Button: React.FC<ButtonProps> = ({
//   children,
//   variant = "primary",
//   className = "",
//   onClick,
// }) => {
//   const baseStyles =
//     "px-11 py-3 text-base tracking-normal text-center border border-solid min-w-[148px] rounded-[200px]";
//   const variantStyles = {
//     primary: "text-white bg-yellow-500 border-yellow-500",
//     secondary: "text-white bg-cyan-600 border-cyan-600",
//   };

//   return (
//     <button
//       onClick={onClick}
//       className={`${baseStyles} ${variantStyles[variant]} ${className}`}
//     >
//       {children}
//     </button>
//   );
// };

const settings = ["Profile", "Account", "Dashboard", "Logout"];
const TabsConfig = [
  { tabName: "Home", path: "/" },
  { tabName: "My Books", path: "/my-books" },
  { tabName: "Borrowed Books", path: "/borrowed-books" },
  { tabName: "Returned Books", path: "/returned-books" },
  { tabName: "Waiting List", path: "/waiting-list" },
];

const Tab: React.FC<{ tabName: string; path: string }> = ({
  tabName,
  path,
}) => {
  const location = useLocation();
  const { pathname } = location;
  return (
    <li>
      <Link to={path}>
        <MuiButton
          size="medium"
          autoCapitalize="off"
          className={`font-bold hover:bg-gray-300 rounded-2xl font-sans ${
            pathname === path ? "bg-gray-300" : ""
          }`}
          color="inherit"
        >
          {tabName}
        </MuiButton>
      </Link>
    </li>
  );
};

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { isUserAuthenticated, removeToken } = useAuth();

  // const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );

  // const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
  //   setAnchorElNav(event.currentTarget);
  // };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleLogout = () => {
    removeToken();
    handleCloseUserMenu();
    navigate("/login");
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  if (["/login", "/register"].includes(pathname)) {
    return null;
  }

  const handleClick = () => {
    navigate("/login");
  };

  return (
    <nav className="flex flex-wrap gap-10 py-3 w-full bg-white bg-opacity-20 max-md:px-5">
      <div className="flex gap-3.5 py-3 my-auto min-h-[70px]">
        <a href="/" className="w-[72px]">
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/fdb135f9d2b04a4eb3c5b8f756dcd3c8/f1f1b97b63c041970218c61c5a54d6e6a68bf6faec4b3b9b7765ff9f7b984790"
            className="object-contain aspect-[1.5] w-[72px]"
            alt="SBN Logo"
          />
        </a>
        <h1 className="flex items-center text-xl font-bold tracking-normal leading-none whitespace-nowrap text-neutral-800">
          SBN
        </h1>
      </div>

      <div className="flex-auto max-md:max-w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="w-[78%] max-md:ml-0 max-md:w-full">
            <ul className="flex flex-wrap gap-5 justify-center items-start px-5 py-10 text-base font-bold tracking-normal text-neutral-800 max-md:mt-1.5 max-md:max-w-full">
              {TabsConfig.map((tabConfig) => (
                <Tab {...tabConfig} />
              ))}
            </ul>
          </div>
          <div className="flex gap-5 justify-end ml-5 w-[22%] max-md:ml-0 max-md:w-full">
            {!isUserAuthenticated && (
              <Button
                onClick={handleClick}
                className="my-auto cursor-pointer max-md:mt-10"
              >
                Join Now
              </Button>
            )}

            <Box className={"flex items-center"}>
              <Typography variant="body1" className="font-bold">
                Welcome Shahfahed!
              </Typography>
            </Box>

            {/* <!-- Profile dropdown --> */}
            <Box sx={{ flexGrow: 0 }} className={"flex items-center"}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem
                    key={setting}
                    onClick={
                      setting === "Logout" ? handleLogout : handleCloseUserMenu
                    }
                  >
                    <Typography sx={{ textAlign: "center" }}>
                      {setting}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
