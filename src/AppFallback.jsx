import { HashRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext";
import { VehicleContextProvider } from "./context/VehicleContext";

function AppFallback() {
  return (
    <HashRouter>
      <AuthContextProvider>
        <VehicleContextProvider>
          <div style={{ padding: 40 }}>
            VEHICLE TEST FALLBACK
          </div>
        </VehicleContextProvider>
      </AuthContextProvider>
    </HashRouter>
  );
}

export default AppFallback;
