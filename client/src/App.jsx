import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { getToken } from './api';

function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
