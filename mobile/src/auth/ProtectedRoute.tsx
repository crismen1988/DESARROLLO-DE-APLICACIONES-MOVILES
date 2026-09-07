import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute: React.FC<RouteProps> = (props) => {
  const { usuario } = useAuth();
  return usuario ? <Route {...props} /> : <Redirect to="/login" />;
};

export default ProtectedRoute;
