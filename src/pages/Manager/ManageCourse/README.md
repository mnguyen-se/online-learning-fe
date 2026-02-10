# Course Management - Refactored Structure

File `CourseManagement.jsx` đã được tách thành nhiều component UI nhỏ hơn để dễ quản lý. Logic vẫn được giữ trong file chính.

## Cấu trúc thư mục

```
ManageCourse/
├── CourseManagement.jsx          # Component chính (chứa toàn bộ logic)
├── components/                   # Các component UI
│   ├── CourseCard.jsx           # Component hiển thị từng card khóa học
│   ├── CourseList.jsx            # Component danh sách khóa học
│   ├── CourseInitForm.jsx       # Form khởi tạo khóa học
│   ├── CourseContentLayout.jsx  # Layout 2 cột (sidebar + main content)
│   ├── CourseContentSidebar.jsx # Sidebar bên trái
│   ├── CourseGeneralConfig.jsx  # Tab cấu hình chung
│   ├── CourseProgram.jsx        # Tab chương trình học
│   └── LessonBlock.jsx          # Component cho từng lesson
```

## Các component

### CourseCard.jsx
- Hiển thị thông tin một khóa học
- Props: `course`, `courseStats`, `courseActiveStates`, `onSelect`, `onToggleActive`, `onEdit`

### CourseList.jsx
- Hiển thị danh sách khóa học với loading và error states
- Props: `courses`, `isLoadingCourses`, `coursesError`, `courseStats`, `courseActiveStates`, `onSelectCourse`, `onToggleActive`, `onEditCourse`

### CourseInitForm.jsx
- Form khởi tạo khóa học (Step 1)
- Props: `courseTitle`, `courseDescription`, `courseError`, `courseSuccess`, `isSavingCourse`, `onTitleChange`, `onDescriptionChange`, `onCancel`, `onContinue`

### CourseContentLayout.jsx
- Layout chính khi soạn nội dung (2 cột)
- Props: `selectedCourse`, `contentTab`, `courseCoverImageUrl`, `lessons`, và các handlers

### CourseContentSidebar.jsx
- Sidebar bên trái với navigation
- Props: `selectedCourse`, `contentTab`, `onTabChange`, `onAddLesson`, `onSaveAndFinish`

### CourseGeneralConfig.jsx
- Tab cấu hình chung (ảnh bìa)
- Props: `courseCoverImageUrl`, `onCoverImageUrlChange`

### CourseProgram.jsx
- Tab chương trình học (danh sách lessons)
- Props: `lessons`, `isLoadingLessons`, `lessonsError`, `lessonError`, và các handlers

### LessonBlock.jsx
- Component cho từng lesson
- Props: `lesson`, `onToggle`, `onUpdate`, `onDelete`, và các handlers cho video/assignment editor

## Logic và State

Tất cả logic và state được quản lý trong `CourseManagement.jsx`:
- State management cho courses, lessons, UI states
- API calls (load, create, update, delete)
- Utility functions (getCourseId, formatCourseId, getCourseIsActive)
- Event handlers

Các utility functions được truyền qua props cho các component cần dùng.

## Lợi ích

1. **Dễ bảo trì**: Mỗi component có trách nhiệm rõ ràng
2. **Tái sử dụng**: Components có thể dùng lại ở nơi khác
3. **Dễ test**: Có thể test từng component riêng biệt
4. **Code ngắn gọn**: File chính giảm từ 1244 → ~420 dòng
5. **Tổ chức tốt**: Logic được tách vào hooks, UI vào components
