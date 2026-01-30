import { createSlice } from '@reduxjs/toolkit';

// @reduxjs/toolkit quản lý trạng thái người dùng user state

const initialState = null; // trạng thái ban đầu của user là null, chưa có người dùng login

export const userSlice = createSlice({
  // tạo nhanh 1 slice của redux store, name là tên slice, initialState là trạng thái ban đầu
  // reducers là các reducer, mỗi reducer là 1 hàm, có 2 tham số là state và action
  // state là trạng thái của slice, action là action của redux
  name: 'user',
  initialState: null,
  reducers: {
    login: (state, action) => {
      // khi người dùng đăng nhập, hành động này sẽ gán toàn bộ thông tin người dùng vào state
      // state = initialState, action = { type: 'user/login', payload: { ... } }
      // payload là thông tin, type là loại hành động
      return action.payload;
    },
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('rememberMe');
      return initialState; // đặt lại state về null
    },
    updateAvatar: (state, action) => {
      // Nếu state null thì không làm gì
      if (state === null) return state;
      return {
        ...state, // copy lại thông tin cũ
        avatarUrl: action.payload, // cập nhật url mới vào state
      };
    },
    updateUser: (state, action) => {
      // Nếu state null thì không làm gì
      if (state === null) return state;
      return {
        ...state, // copy lại thông tin cũ
        ...action.payload, // cập nhật thông tin mới
      };
    },
  },
});

export const { login, logout, updateAvatar, updateUser } = userSlice.actions;

export default userSlice.reducer;
