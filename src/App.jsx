import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/Homepage/Homepage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/Register/index';
import Dashboard from './pages/DashBoard/dashboard';
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
    element: <Dashboard />,
  }
]);

  return (
    <RouterProvider router={router} />
  )
}

export default App;