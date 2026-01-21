import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/Homepage/Homepage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/register';
import DashboardAdmin from './pages/DashBoard-Admin/dashboard';
import DashboardManager from './pages/DashBoard-Manager/DashboardManager';
import DashboardTeacher from './pages/Dashboard-Teacher/DashboardTeacher';
import Profile from './pages/Profile/profile';

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
    element: <DashboardAdmin />,
  },
  {
    path: "/dashboard-admin",
    element: <DashboardAdmin />,
  },
  {
    path: "/dashboard-manager",
    element: <DashboardManager />,
  },
  {
    path: "/dashboard-teacher",
    element: <DashboardTeacher />,
  }
]);

  return (
    <RouterProvider router={router} />
  )
}

export default App;