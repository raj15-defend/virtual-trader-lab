import { Navigate } from 'react-router-dom';
import { useTradingContext } from '@/context/TradingContext';

const Index = () => {
  const { isAuthenticated } = useTradingContext();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Index;
