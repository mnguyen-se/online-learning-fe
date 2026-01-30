import React from 'react';

const CourseGeneralConfig = ({ courseCoverImageUrl, onCoverImageUrlChange }) => {
  return (
    <div className="course-general-config">
      <div className="course-cover-section">
        <label className="course-label">ẢNH BÌA KHÓA HỌC</label>
        <input
          className="course-cover-url-input"
          type="text"
          placeholder="Nhập URL ảnh bìa..."
          value={courseCoverImageUrl}
          onChange={(e) => onCoverImageUrlChange(e.target.value)}
        />
        <div className="course-cover-preview">
          <img
            src={courseCoverImageUrl || 'https://via.placeholder.com/800x600'}
            alt="Course cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x600';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseGeneralConfig;
