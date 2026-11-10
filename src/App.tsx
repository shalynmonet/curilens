import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Processing from '@/pages/Processing';
import Analysis from '@/pages/Analysis';
import Library from '@/pages/Library';
import ShareSetup from '@/pages/ShareSetup';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/processing/:id" element={<Processing />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/library" element={<Library />} />
          <Route path="/share-setup" element={<ShareSetup />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
