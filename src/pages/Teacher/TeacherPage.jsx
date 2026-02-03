import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

function TeacherPage() {
  return (
    <DashboardLayout
      pageTitle="Trang giáo viên"
      pageSubtitle="Quản lý lớp học và bài giảng"
    >
      <div className="teacher-page-content">
        <p>Nội dung trang giáo viên sẽ được bổ sung tại đây.</p>
      </div>
    </DashboardLayout>
  );
}

export default TeacherPage;
