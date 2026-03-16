import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Spin, Button, Empty, Input } from 'antd';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTeacherCourses } from '../../api/teacherApi';
import { getCourseById } from '../../api/coursesApi';
import './TeacherPages.css';

/** Chuẩn hóa một item khóa học từ API (GET /courses/my-courses – CourseDtoRes: courseId, title, description, isPublic) */
const normalizeCourse = (c) => {
  if (!c || typeof c !== 'object') return null;
  const courseId = c.courseId ?? c.id ?? c.course_id;
  const title = c.title ?? c.name ?? c.courseName ?? '';
  const description = c.description ?? c.courseDescription ?? '';
  const isPublic = c.public === true || c.isPublic === true;
  const imageUrl = c.imageUrl ?? c.image_url ?? c.coverImage ?? '';
  return { courseId, title, description, isPublic, imageUrl, raw: c };
};

/**
 * Trang "Khóa học của tôi" – hiển thị theo API GET /courses/my-courses.
 * Nội dung card (tên khóa học, mô tả) lấy từ API, bấm card → chi tiết khóa học.
 */
function TeacherMyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseSearch, setCourseSearch] = useState('');

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const t = (c.title ?? '').toLowerCase();
      const d = (c.description ?? '').toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [courses, courseSearch]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getTeacherCourses()
      .then(async (data) => {
        // BE GET /courses/my-courses trả về { totalCourses, courses: CourseDtoRes[] }
        const raw = Array.isArray(data)
          ? data
          : Array.isArray(data?.courses)
            ? data.courses
            : Array.isArray(data?.content)
              ? data.content
              : Array.isArray(data?.data)
                ? data.data
                : [];
        
        let list = raw.map(normalizeCourse).filter((c) => c && c.isPublic);
        
        // Lấy thêm ảnh nếu thiếu (do BE trả thiếu `imageUrl`)
        list = await Promise.all(
          list.map(async (c) => {
            let imageUrl = c.imageUrl;
            if (!imageUrl && c.courseId) {
              try {
                const courseDetail = await getCourseById(c.courseId);
                imageUrl = courseDetail?.imageUrl ?? courseDetail?.image_url ?? courseDetail?.coverImage ?? '';
              } catch {
                // Ignore error if course image cannot be fetched
              }
            }
            return { ...c, imageUrl };
          })
        );
        
        if (!cancelled) setCourses(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? err?.message ?? 'Không thể tải danh sách khóa học.');
          setCourses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="teacher-page-wrap teacher-tmc-wrap">
        <h1 className="teacher-page-title">Khóa học của tôi</h1>
        <p className="teacher-page-desc">Chỉ hiển thị các khóa học đã được gán cho bạn và đã xuất bản bởi quản lý. Nhấn vào khóa học để xem chương và bài học.</p>
        <Card className="teacher-tmc-content-card" bordered={false}>
          <div className="teacher-tmc-loading">
            <Spin size="large" />
            <p>Đang tải khóa học...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-page-wrap teacher-tmc-wrap">
        <h1 className="teacher-page-title">Khóa học của tôi</h1>
        <p className="teacher-page-desc">Chỉ hiển thị các khóa học đã được gán cho bạn và đã xuất bản bởi quản lý. Nhấn vào khóa học để xem chương và bài học.</p>
        <Card className="teacher-tmc-error-card">
          <Empty description={error} />
        </Card>
      </div>
    );
  }

  return (
    <div className="teacher-page-wrap teacher-tmc-wrap">
      <h1 className="teacher-page-title">Khóa học của tôi</h1>
      <p className="teacher-page-desc">Chỉ hiển thị các khóa học đã được gán cho bạn và đã xuất bản bởi quản lý. Nhấn vào khóa học để xem chương và bài học.</p>

      <Card className="teacher-tmc-content-card" bordered={false}>
        {courses.length > 0 && (
          <div className="teacher-tmc-search-wrap">
            <Search size={18} className="teacher-tmc-search-icon" />
            <Input
              placeholder="Tìm khóa học theo tên, mô tả..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              allowClear
              className="teacher-tmc-search-input"
              aria-label="Tìm khóa học"
            />
          </div>
        )}

        <div className="teacher-tmc-list-scroll">
          {filteredCourses.length === 0 ? (
            <Empty
              description={
                courseSearch.trim()
                  ? `Không có khóa học nào khớp với "${courseSearch.trim()}".`
                  : 'Chưa có khóa học nào được gán cho bạn.'
              }
            />
          ) : (
            <Row gutter={[20, 20]} className="teacher-tmc-grid">
              {filteredCourses.map((course) => {
                const courseId = course.courseId;
                const title = course.title || 'Khóa học';
                const description = course.description || '';
                return (
                  <Col xs={24} sm={24} md={12} lg={8} xl={6} key={courseId}>
                    <Card
                      className="teacher-tmc-card"
                      hoverable
                      actions={[
                        <Button
                          type="link"
                          key="view"
                          icon={<ChevronRight size={18} />}
                          iconPosition="end"
                          onClick={() => navigate(`/teacher-page/courses/${courseId}`)}
                        >
                          Xem chi tiết
                        </Button>,
                      ]}
                    >
                      {course.imageUrl ? (
                        <div className="teacher-tmc-card-cover">
                          <img src={course.imageUrl} alt={title} />
                        </div>
                      ) : (
                        <div className="teacher-tmc-card-icon">
                          <BookOpen size={28} strokeWidth={1.8} />
                        </div>
                      )}
                      <Card.Meta
                        title={title}
                        description={
                          description
                            ? (description.length > 100 ? `${description.slice(0, 100)}...` : description)
                            : 'Không có mô tả'
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>
      </Card>
    </div>
  );
}

export default TeacherMyCourses;
