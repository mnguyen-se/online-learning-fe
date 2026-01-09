import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from './pages/home';
import LoginPage from './pages/login/index';
import RegisterPage from './pages/register/index';

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
]);

  return (
    <RouterProvider router={router} />
  )
}

export default App;