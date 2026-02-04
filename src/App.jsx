
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { store, persistor } from './store/store';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/Homepage/Homepage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/register';
import Profile from './pages/Profile/profile';
import Dashboard from './pages/DashBoard-Admin/dashboard';
import CourseManagement from './pages/Manager/ManageCourse/CourseManagement';
import TeacherPage from './pages/Teacher/TeacherPage';
import LessonsView from './pages/Lessons/LessonsView';
import MyCourses from "./pages/MyCourses/MyCourses";

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
      path: '/dashboard-admin',
      element: (
        <PrivateRoute allowedRoles={['ADMIN']} element={<Dashboard />} />
      ),
    },
    {
      path: '/admin',
      element: <Navigate to="/dashboard-admin" replace />,
    },
    {
      path: '/dashboard-manager',
      element: (
        <PrivateRoute allowedRoles={['COURSE_MANAGER']} element={<CourseManagement />} />
      ),
    },
    {
      path: '/manager',
      element: <Navigate to="/dashboard-manager" replace />,
    },
    {
      path: '/teacher-page',
      element: (
        <PrivateRoute allowedRoles={['TEACHER']} element={<TeacherPage />} />
      ),
    },
    {
      path: '/teacher',
      element: <Navigate to="/teacher-page" replace />,
    },
    {
      path: '/lessons',
      element: <LessonsView />,
    },
    { path: "/my-courses", 
      element: <MyCourses /> },
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
