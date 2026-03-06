import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Spin, Button, Empty, Input } from 'antd';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTeacherCourses } from '../../api/teacherApi';
import './TeacherPages.css';

/**
 * Trang "Khóa học của tôi" – hiển thị dạng card (Ant Design).
 * Bấm vào card → chuyển đến chi tiết khóa học (2 tab: Nội dung | Danh sách học sinh).
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
      const title = (c?.title ?? c?.name ?? c?.courseName ?? '').toLowerCase();
      const desc = (c?.description ?? c?.courseDescription ?? '').toLowerCase();
      return title.includes(q) || desc.includes(q);
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
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        if (!cancelled) setCourses(raw.filter((c) => c.public === true || c.isPublic === true));
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
        <div className="teacher-tmc-header">
          <h1 className="teacher-tmc-title">Khóa học của tôi</h1>
          </div>
        <div className="teacher-tmc-loading">
          <Spin size="large" />
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-page-wrap teacher-tmc-wrap">
        <div className="teacher-tmc-header">
          <h1 className="teacher-tmc-title">Khóa học của tôi</h1>
        </div>
        <Card className="teacher-tmc-error-card">
          <Empty description={error} />
        </Card>
      </div>
    );
  }

  return (
    <div className="teacher-page-wrap teacher-tmc-wrap">
      <div className="teacher-tmc-header">
        <h1 className="teacher-tmc-title">Khóa học của tôi</h1>
        <p className="teacher-tmc-desc">Chỉ hiển thị các khóa học đã được gán cho bạn và đã xuất bản bởi quản lý. Nhấn vào khóa học để xem chương và bài học.</p>
      </div>

      {!loading && courses.length > 0 && (
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

      {filteredCourses.length === 0 ? (
        <Card className="teacher-tmc-card-wrap">
          <Empty
            description={
              courseSearch.trim()
                ? `Không có khóa học nào khớp với "${courseSearch.trim()}".`
                : 'Chưa có khóa học nào được gán cho bạn.'
            }
          />
        </Card>
      ) : (
        <Row gutter={[20, 20]} className="teacher-tmc-grid">
          {filteredCourses.map((course) => {
            const courseId = course?.courseId ?? course?.id ?? course?.course_id;
            const title = course?.title ?? course?.name ?? course?.courseName ?? 'Khóa học';
            const description = course?.description ?? course?.courseDescription ?? '';
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
                  <div className="teacher-tmc-card-icon">
                    <BookOpen size={28} strokeWidth={1.8} />
                  </div>
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
  );
}

export default TeacherMyCourses;
