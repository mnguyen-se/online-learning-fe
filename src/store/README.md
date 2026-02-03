# Redux Store - Cấu trúc chung cho toàn bộ dự án

Store Redux được cấu hình để quản lý state cho toàn bộ ứng dụng với redux-persist để lưu trữ state vào localStorage.

## Cấu trúc thư mục

```
store/
├── store.js                    # Redux store configuration + redux-persist setup
└── slices/                     # Các Redux slices
    └── userSlice.js           # Quản lý thông tin người dùng (login, logout, update)
```

## Cấu hình Store

### `store/store.js`
- **configureStore**: Tạo Redux store với tất cả reducers
- **redux-persist**: Cấu hình persist cho từng slice
- **Middleware**: Bỏ qua serializable check cho các action của persist

### Slices hiện có

#### 1. `userSlice.js`
Quản lý thông tin người dùng:
- **State**: `null` (chưa đăng nhập) hoặc object chứa thông tin user
- **Actions**:
  - `login(payload)` - Đăng nhập, lưu thông tin user vào state
  - `logout()` - Đăng xuất, xóa localStorage và reset state về null
  - `updateAvatar(url)` - Cập nhật avatar URL
  - `updateUser(data)` - Cập nhật thông tin user

**Sử dụng:**
```jsx
import { useDispatch, useSelector } from 'react-redux';
import { login, logout, updateUser } from '../../store/slices/userSlice';

// Trong component
const dispatch = useDispatch();
const user = useSelector((state) => state.user);

// Đăng nhập
dispatch(login({ username: 'user1', role: 'STUDENT', ... }));

// Đăng xuất
dispatch(logout());

// Cập nhật thông tin
dispatch(updateUser({ email: 'new@email.com' }));
```

#### 2. `courseManagementSlice.js`
Quản lý courses và lessons:
- **State**: Bao gồm courses, lessons, UI states, form data (viewMode, courseTitle, contentTab, …)
- **Async Thunks** (gọi API, cập nhật state qua `extraReducers`):
  - `fetchCourses()` – load danh sách khóa học
  - `fetchActiveCourses()` – load khóa học đang mở
  - `fetchLessonsForCourse(courseId)` – load lessons theo course
  - `createCourseThunk(data)` – tạo khóa học
  - `updateCourseThunk({ courseId, data })` – cập nhật khóa học
  - `deleteCourseThunk(courseId)` – xóa / đánh dấu inactive
  - `deleteLessonThunk(lessonId)` – xóa lesson
- **Reducers** (cập nhật state đồng bộ từ UI, không gọi API):
  - `setViewMode`, `setCourseTitle`, `setCourseDescription`, `setContentTab`, …
  - `toggleLesson`, `addLesson`, `updateLesson`, `removeLesson`
  - `resetCreateForm`, `resetToList`

##### Reducers dùng để làm gì? Có bắt buộc không?
- **Thunks** = làm việc bất đồng bộ (gọi API). Kết quả xử lý trong `extraReducers` (pending/fulfilled/rejected).
- **Reducers** = cập nhật state **ngay lập tức** khi người dùng thao tác UI (chọn tab, gõ form, mở/đóng lesson, thêm/xóa lesson local, cancel form, quay lại list, …). Không gọi API.

Nếu **không** dùng reducers cho UI (viewMode, form, tab, …), bạn phải giữ các state đó trong `useState` ở component. Khi đó:
- Redux chỉ chứa **dữ liệu từ server** (courses, lessons) và **thunks** để fetch/create/update/delete.
- UI state (màn nào đang hiển thị, form đang gõ gì, …) nằm local trong `CourseManagement.jsx`.

Cách này vẫn chạy được nhưng **khác** với thiết kế hiện tại: toàn bộ state (kể cả UI) nằm trong Redux, dễ đồng bộ giữa các component và persist (vd. nhớ tab, viewMode sau reload).

**Sử dụng:**
```jsx
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, setViewMode, addLesson } from '../../store/slices/courseManagementSlice';

const dispatch = useDispatch();
const { courses, viewMode, lessons } = useSelector((state) => state.courseManagement);

// Load courses
dispatch(fetchCourses());

// Thay đổi view mode
dispatch(setViewMode('content'));

// Thêm lesson
dispatch(addLesson());
```

## Redux Persist

### Cấu hình Persist

- **user**: Persist toàn bộ state (lưu thông tin user sau khi reload)
- **courseManagement**: Persist nhưng blacklist các trường loading/error:
  - `isLoadingCourses`, `coursesError`
  - `isLoadingLessons`, `lessonsError`, `lessonError`
  - `isSavingCourse`, `isSavingLesson`

### Storage
- Sử dụng `localStorage` (redux-persist/lib/storage)
- Key: `user` và `courseManagement`

## Setup trong App.jsx

```jsx
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* Your app content */}
      </PersistGate>
    </Provider>
  );
}
```

## Thêm Slice mới

Để thêm slice mới:

1. Tạo file trong `store/slices/yourSlice.js`:
```jsx
import { createSlice } from '@reduxjs/toolkit';

const yourSlice = createSlice({
  name: 'yourSlice',
  initialState: { /* ... */ },
  reducers: { /* ... */ },
});

export default yourSlice.reducer;
```

2. Thêm vào `store/store.js`:
```jsx
import yourSliceReducer from './slices/yourSlice';

// Cấu hình persist (nếu cần)
const yourSlicePersistConfig = {
  key: 'yourSlice',
  storage,
  blacklist: ['isLoading', 'error'], // nếu cần
};

const persistedYourSlice = persistReducer(yourSlicePersistConfig, yourSliceReducer);

// Thêm vào store
export const store = configureStore({
  reducer: {
    user: persistedUser,
    courseManagement: persistedCourseManagement,
    yourSlice: persistedYourSlice, // Thêm vào đây
  },
  // ...
});
```

## Lợi ích

1. **State tập trung**: Tất cả state được quản lý ở một nơi
2. **Persist tự động**: State được lưu vào localStorage, giữ lại sau khi reload
3. **Dễ mở rộng**: Thêm slice mới rất đơn giản
4. **DevTools**: Có thể debug với Redux DevTools
5. **Tái sử dụng**: State có thể được truy cập từ bất kỳ component nào
