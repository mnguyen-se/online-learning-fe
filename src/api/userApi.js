import apiClient from '../config/axios';

export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', {
    username,
    password,
  });
  return response.data;
};

export const getUserInfo = async (username) => {
  const response = await apiClient.get('/users/info', {
    params: {
      username,
    },
  });
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get('/users/getAll');
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await apiClient.put(`/users/${userId}`, userData);
  return response.data;
};

export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post('/users/create', userData);
  return response.data;
};
