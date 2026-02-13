import { useGlobalError } from "../../context/GlobalErrorContext";

const GlobalErrorBanner = () => {
  const { error, clearError } = useGlobalError();

  if (!error) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "#ff4d4f",
        color: "white",
        padding: "12px 16px",
        zIndex: 9999,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "sans-serif"
      }}
    >
      <span>{error.message}</span>
      <button
        onClick={clearError}
        style={{
          background: "transparent",
          border: "1px solid white",
          color: "white",
          cursor: "pointer"
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

export default GlobalErrorBanner;
