import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTopicStore } from '../../store/useTopicStore';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const loadAllTopics = useTopicStore((state) => state.loadAllTopics);

  useEffect(() => {
    // Hydrate store from IndexedDB on initial mount
    loadAllTopics();
  }, [loadAllTopics]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Container: Sidebar + Route Content Outlet */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onCloseMobile={() => {
            if (window.innerWidth < 768) {
              setSidebarOpen(false);
            }
          }}
        />

        {/* Content Area */}
        <main
          style={{
            flex: 1,
            padding: 'var(--space-xl) var(--space-lg)',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
