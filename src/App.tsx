import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import TopicPlaceholderPage from './pages/TopicPlaceholderPage';
import { ALL_CURRICULUM_ROUTES } from './data/curriculum';

const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="blueprint-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-accent-primary)', fontFamily: 'var(--font-mono)' }}>
            Loading System Design Lab Module...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            {ALL_CURRICULUM_ROUTES.map((route) => (
              <Route
                key={route.id}
                path={route.path}
                element={<TopicPlaceholderPage />}
              />
            ))}
            {/* Catch-all 404 Route */}
            <Route path="*" element={<TopicPlaceholderPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
