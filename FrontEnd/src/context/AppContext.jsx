import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

// Named Export: AppProvider
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ✅ Add the login function
  const login = (userData) => {
    setUser(userData);
    // You can also add localStorage logic here later if you want to stay logged in on refresh
  };

  // ✅ Update logout to clear state
  const logout = () => {
    setUser(null);
  };

  return (
    // ✅ MUST include 'login' in the value object so LoginView can see it
    <AppContext.Provider value={{ user, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

// Named Export: useApp
export const useApp = () => useContext(AppContext);