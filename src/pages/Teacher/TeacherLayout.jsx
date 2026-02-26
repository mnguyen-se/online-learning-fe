import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';

function TeacherLayout() {
  return (
    <DashboardLayout layoutVariant="teacher">
      <div className="teacher-area">
        <Outlet />
      </div>
    </DashboardLayout>
  );
}

export default TeacherLayout;
