import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/Homepage/Homepage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/register';
import Profile from './pages/Profile/profile';
import Dashboard from './pages/DashBoard-Admin/dashboard';
import CourseManagement from './pages/Manager/ManageCourse/CourseManagement';
import TeacherPage from './pages/Teacher/teacherPage';

function App() {

  const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage/>,
  },
  {
    path: "/login",
    element: <LoginPage/>,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/dashboard-admin",
    element: <Dashboard />,
  },
  {
    path: "/dashboard-manager",
    element: <CourseManagement />,
  },
  {
    path: "/teacher-page",
    element: <TeacherPage />,
  }
]);

  return (
    <RouterProvider router={router} />
  )
}

export default App;