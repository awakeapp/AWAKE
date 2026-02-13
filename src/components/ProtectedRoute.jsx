import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import FullPageLoader from './molecules/FullPageLoader';

const ProtectedRoute = ({ children }) => {
    const { user, authIsReady } = useAuthContext();

    if (!authIsReady) {
        return <FullPageLoader />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
