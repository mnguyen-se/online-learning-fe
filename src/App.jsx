import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { store, persistor } from './store/store';
import HomePage from './pages/Homepage/Homepage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/register';
import Profile from './pages/Profile/profile';
import Dashboard from './pages/DashBoard-Admin/dashboard';
import CourseManagement from './pages/Manager/ManageCourse/CourseManagement';
import TeacherPage from './pages/Teacher/teacherPage';
import LessonsView from './pages/Lessons/LessonsView';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomePage />,
    },
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/register',
      element: <RegisterPage />,
    },
    {
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '/dashboard',
      element: <Dashboard />,
    },
    {
      path: '/dashboard-admin',
      element: <Dashboard />,
    },
    {
      path: '/dashboard-manager',
      element: <CourseManagement />,
    },
    {
      path: '/teacher-page',
      element: <TeacherPage />,
    },
    {
      path: '/lessons',
      element: <LessonsView />,
    },
  ]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  );
}

export default App;
