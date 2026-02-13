import { createContext, useContext, useState, useCallback } from "react";

const GlobalErrorContext = createContext();

export const GlobalErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = useCallback((err) => {
    setError(err);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <GlobalErrorContext.Provider
      value={{
        error,
        showError,
        clearError
      }}
    >
      {children}
    </GlobalErrorContext.Provider>
  );
};

export const useGlobalError = () => {
  return useContext(GlobalErrorContext);
};
