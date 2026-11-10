import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Processing from '@/pages/Processing';
import Analysis from '@/pages/Analysis';
import Library from '@/pages/Library';
import ShareSetup from '@/pages/ShareSetup';
import Settings from '@/pages/Settings';
import SignIn from '@/pages/SignIn';
import Sample from '@/pages/Sample';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return <div className="pt-24 text-center text-midnight-400">Loading...</div>;
  }
  if (!session) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sample" element={<Sample />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/processing/:id" element={<RequireAuth><Processing /></RequireAuth>} />
        <Route path="/analysis/:id" element={<RequireAuth><Analysis /></RequireAuth>} />
        <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
        <Route path="/share-setup" element={<RequireAuth><ShareSetup /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
