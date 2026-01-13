import React from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import HomePage from './pages/home';
import LoginPage from './pages/login/index';
import RegisterPage from './pages/register/index';
import { Header } from './components/layout/header';

function App() {

  const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Header/>
        <Outlet/>
        {/* <Footer/> */}
      </>
    ),
    children: [
      {
        path: "/",
        element: <HomePage/>
      },

    ]
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