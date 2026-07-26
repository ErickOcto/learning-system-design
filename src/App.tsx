import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import PlaygroundPage from './pages/PlaygroundPage';
import TopicPlaceholderPage from './pages/TopicPlaceholderPage';
import { ALL_CURRICULUM_ROUTES } from './data/curriculum';

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
