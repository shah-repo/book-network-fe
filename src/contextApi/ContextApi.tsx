import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export interface AuthType {
  token: string;
  setToken: React.SetStateAction<Dispatch<string>>;
  removeToken: () => void;
  isUserAuthenticated: boolean;
}

export const ContextApi = createContext<AuthType>({} as AuthType);

const ContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const getToken = localStorage.getItem("JWT_TOKEN")
    ? JSON.parse(localStorage.getItem("JWT_TOKEN") ?? "")
    : null;
  const [token, setToken] = useState(getToken);
  const isUserAuthenticated = Boolean(token);

  const removeToken = () => {
    setToken("");
    localStorage.removeItem("JWT_TOKEN");
  };

  const authData = {
    token,
    setToken,
    removeToken,
    isUserAuthenticated,
  };
  return <ContextApi.Provider value={authData}>{children}</ContextApi.Provider>;
};

export default ContextProvider;

export const useAuth = () => {
  const authContext = useContext(ContextApi);

  return authContext;
};
