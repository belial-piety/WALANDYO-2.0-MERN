import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const AppLayout = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-col">
        <Topbar />
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
