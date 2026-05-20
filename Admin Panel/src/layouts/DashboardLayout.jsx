/**
 * Dashboard Layout — responsive shell (sidebar drawer < lg)
 */

import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';
import { useSidebar } from '../context/SidebarContext.jsx';

const DashboardLayout = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-[100dvh] bg-gray-50">
      <Sidebar />

      <div
        className={`ml-0 flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Navbar />

        <main className="flex-1 overflow-x-hidden overflow-y-auto pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
