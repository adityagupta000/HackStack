import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [role, setRole] = useState(null);

  const saveAuth = (token, userRole) => {
    setAccessToken(token);
    setRole(userRole);
  };

  const clearAuth = () => {
    setAccessToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, role, saveAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
