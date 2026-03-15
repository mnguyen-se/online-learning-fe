import { useState, useEffect, useRef } from 'react'
import { Layout } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/header'
import { useAuth } from '../../hooks'
import Footer from '../../components/Footer/footer'
import { getMyCourses } from '../../api/enrollmentApi'
import { getTeacherCourses } from '../../api/teacherApi'
import './homepage.css'

const { Content } = Layout

const FALLBACK_THUMB = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80'

function Homepages() {
  const [activeSlide, setActiveSlide] = useState(0)
  const navigate = useNavigate()
  const { role, isStaff, isLoggedIn, getDashboardPath } = useAuth()
  const innerRef = useRef(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [teacherCourses, setTeacherCourses] = useState([])
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [loadingTeacher, setLoadingTeacher] = useState(false)

  useEffect(() => {
    if (role === 'STUDENT') {
      setLoadingStudent(true)
      getMyCourses()
        .then((data) => setStudentCourses(Array.isArray(data) ? data : []))
        .catch(() => setStudentCourses([]))
        .finally(() => setLoadingStudent(false))
    }
  }, [role])

  useEffect(() => {
    if (role === 'TEACHER') {
      setLoadingTeacher(true)
      getTeacherCourses()
        .then((data) => setTeacherCourses(Array.isArray(data) ? data : []))
        .catch(() => setTeacherCourses([]))
        .finally(() => setLoadingTeacher(false))
    }
  }, [role])

  useEffect(() => {
    const container = innerRef.current
    if (!container) return
    const revealEls = container.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.08 }
    )
    revealEls.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleGoToDashboard = () => {
    const path = getDashboardPath()
    navigate(path === '/login' ? '/' : path)
  }

  return (
    <Layout className="homepage-layout">
      {/* Decorative background – floating shapes (WaniKani-style) */}
      <div className="homepage-bg-deco" aria-hidden="true">
        <div className="homepage-bg-dots" />
        <div className="float-shape float-shape-1" />
        <div className="float-shape float-shape-2" />
        <div className="float-shape float-shape-3" />
        <div className="float-shape float-shape-4" />
        <div className="float-shape float-shape-5" />
      </div>

      <Layout className="homepage-main-layout">
        <Header />

        <Content className="homepage-content">
          <div className="homepage-inner" ref={innerRef}>
            {/* Hero Banner – Ryugo */}
            <section className="hero-banner">
              <div className="hero-content">
                <div className="hero-text">
                  <h1 className="hero-title">
                    Trung tâm Nhật ngữ <span className="hero-title-accent">Ryugo</span>
                  </h1>
                  <p className="hero-description">
                    Học tiếng Nhật trực tuyến với lộ trình rõ ràng – review bài tập, lịch học cố định và tương tác với giảng viên. Phù hợp sinh viên và người đi làm, đồng hành cùng bạn chinh phục JLPT.
                  </p>
                  <div className="hero-buttons">
                    {!isLoggedIn && (
                      <button type="button" className="hero-button">NHẬN LỘ TRÌNH TIẾNG NHẬT</button>
                    )}
                    {isStaff && (
                      <button type="button" className="hero-button hero-button-dashboard" onClick={handleGoToDashboard}>
                        Go to Dashboard
                      </button>
                    )}
                  </div>
                </div>
                <div className="hero-image">
                  <div className="hero-image-wrapper">
                    <img
                      src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"
                      alt="Văn hóa Nhật Bản – đền chùa và cảnh sắc Nhật"
                      className="hero-illustration hero-illustration-img"
                    />
                  </div>
                </div>
              </div>
              <div className="hero-indicators">
                <span className={activeSlide === 0 ? 'active' : ''} onClick={() => setActiveSlide(0)} aria-label="Slide 1" />
                <span className={activeSlide === 1 ? 'active' : ''} onClick={() => setActiveSlide(1)} aria-label="Slide 2" />
                <span className={activeSlide === 2 ? 'active' : ''} onClick={() => setActiveSlide(2)} aria-label="Slide 3" />
              </div>
            </section>

            {/* Stats strip – số liệu nổi bật (WaniKani-style) */}
            <section className="homepage-stats reveal">
              <div className="homepage-stats-inner">
                <div className="stat-item">
                  <span className="stat-icon" aria-hidden="true">日</span>
                  <span className="stat-value">2,000+</span>
                  <span className="stat-label">Từ vựng</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon" aria-hidden="true">書</span>
                  <span className="stat-value">500+</span>
                  <span className="stat-label">Chữ Kanji</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon" aria-hidden="true">課</span>
                  <span className="stat-value">100+</span>
                  <span className="stat-label">Bài học</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon" aria-hidden="true">級</span>
                  <span className="stat-value">N5→N2</span>
                  <span className="stat-label">Lộ trình JLPT</span>
                </div>
              </div>
            </section>

            {/* Tại sao chọn Ryugo – feature cards + ảnh/icon */}
            <section className="homepage-features reveal">
              <h2 className="features-title">Tại sao chọn Ryugo?</h2>
              <p className="features-subtitle">Lộ trình khoa học, ôn tập thông minh, đồng hành đến khi bạn đạt mục tiêu.</p>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-card-icon-wrap">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Lộ trình rõ ràng</h3>
                  <p className="feature-card-desc">Từ N5 đến N2, bài bản theo chuẩn JLPT, học đúng thứ tự dễ nhớ.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon-wrap">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Ôn tập đúng lúc</h3>
                  <p className="feature-card-desc">Hệ thống gợi ý ôn tập theo thời điểm vàng, không quên từ vựng.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon-wrap">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Giảng viên hỗ trợ</h3>
                  <p className="feature-card-desc">Review bài tập, giải đáp thắc mắc và động viên trong suốt khóa học.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon-wrap">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Học mọi lúc mọi nơi</h3>
                  <p className="feature-card-desc">Video bài giảng, bài test trên web, học trên điện thoại hoặc máy tính.</p>
                </div>
              </div>
            </section>

            {/* FAQ – Giải đáp thắc mắc */}
            <section className="homepage-faq reveal">
              <div className="homepage-faq-header">
                <p className="homepage-faq-kicker">FAQ</p>
                <h2 className="homepage-faq-title">Giải đáp thắc mắc của bạn</h2>
                <p className="homepage-faq-subtitle">
                  Những câu hỏi phổ biến về khóa học tiếng Nhật tại Ryugo. Nếu bạn vẫn còn băn khoăn, hãy liên hệ đội ngũ tư vấn để được hỗ trợ chi tiết.
                </p>
              </div>
              <div className="homepage-faq-list">
                <details className="faq-item" open>
                  <summary className="faq-summary">
                    <span className="faq-question">1. Khóa N5 sẽ được học những gì?</span>
                    <span className="faq-toggle" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-content">
                    <p>
                      Bạn sẽ được học đầy đủ bảng chữ cái, từ vựng, ngữ pháp, đọc hiểu và luyện nghe – tương ứng trình độ JLPT N5.
                      Lộ trình được chia theo tuần, có bài tập và bài kiểm tra định kỳ.
                    </p>
                  </div>
                </details>

                <details className="faq-item">
                  <summary className="faq-summary">
                    <span className="faq-question">2. Có thầy cô kèm trực tiếp không ạ?</span>
                    <span className="faq-toggle" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-content">
                    <p>
                      Giảng viên sẽ hỗ trợ bạn qua hệ thống bài tập, chấm bài viết, phản hồi nhận xét và giải đáp thắc mắc qua nền tảng.
                    </p>
                  </div>
                </details>

                <details className="faq-item">
                  <summary className="faq-summary">
                    <span className="faq-question">3. Em muốn học thì sẽ phải đăng ký như thế nào?</span>
                    <span className="faq-toggle" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-content">
                    <p>
                      Bạn chỉ cần tạo tài khoản, chọn khóa học mong muốn và hoàn tất đăng ký. Hệ thống sẽ tự động mở lộ trình học cho bạn.
                    </p>
                  </div>
                </details>

                <details className="faq-item">
                  <summary className="faq-summary">
                    <span className="faq-question">4. Tại sao học phí tại Nhật lại khác so với ở Việt Nam?</span>
                    <span className="faq-toggle" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-content">
                    <p>
                      Mức học phí được xây dựng dựa trên chi phí vận hành, chất lượng giảng viên và nội dung bài học.
                      Ryugo luôn cố gắng tối ưu chi phí nhưng vẫn đảm bảo chất lượng.
                    </p>
                  </div>
                </details>

                <details className="faq-item">
                  <summary className="faq-summary">
                    <span className="faq-question">5. Em có được hỗ trợ lộ trình JLPT dài hạn không?</span>
                    <span className="faq-toggle" aria-hidden="true">+</span>
                  </summary>
                  <div className="faq-content">
                    <p>
                      Có. Bạn sẽ được tư vấn lộ trình từ N5 đến các cấp độ cao hơn và theo dõi tiến độ học tập trong hệ thống Ryugo.
                    </p>
                  </div>
                </details>
              </div>
            </section>

            {/* Nội dung theo role: Guest / Admin / Manager (hình ảnh + CTA), Student (khóa đang học), Teacher (khóa đang dạy) */}
            <section className="homepage-role-section reveal">
              {/* Guest: khám phá khóa học + hình ảnh */}
              {!isLoggedIn ? (
                <div className="role-banner role-banner-guest">
                  <div className="role-banner-image">
                    <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80" alt="Học tiếng Nhật tại Ryugo" />
                  </div>
                  <div className="role-banner-content">
                    <h2 className="role-banner-title">Khám phá khóa học tiếng Nhật</h2>
                    <p className="role-banner-desc">Đăng nhập hoặc đăng ký để xem lộ trình và đăng ký khóa học phù hợp với bạn.</p>
                    <div className="role-banner-actions">
                      <button type="button" className="role-banner-btn primary" onClick={() => navigate('/login')}>Đăng nhập</button>
                      <button type="button" className="role-banner-btn secondary" onClick={() => navigate('/register')}>Đăng ký</button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Admin: quản trị hệ thống + hình ảnh */}
              {role === 'ADMIN' ? (
                <div className="role-banner role-banner-admin">
                  <div className="role-banner-image">
                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Quản trị hệ thống" />
                  </div>
                  <div className="role-banner-content">
                    <h2 className="role-banner-title">Quản trị hệ thống</h2>
                    <p className="role-banner-desc">Quản lý người dùng, khóa học và cấu hình toàn hệ thống Ryugo.</p>
                    <button type="button" className="role-banner-btn primary" onClick={() => navigate('/dashboard-admin')}>Vào Dashboard Admin</button>
                  </div>
                </div>
              ) : null}

              {/* Manager: quản lý khóa học + hình ảnh */}
              {role === 'COURSE_MANAGER' ? (
                <div className="role-banner role-banner-manager">
                  <div className="role-banner-image">
                    <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80" alt="Quản lý khóa học" />
                  </div>
                  <div className="role-banner-content">
                    <h2 className="role-banner-title">Quản lý khóa học</h2>
                    <p className="role-banner-desc">Tạo và chỉnh sửa khóa học, chương trình, bài học cho nền tảng Ryugo.</p>
                    <button type="button" className="role-banner-btn primary" onClick={() => navigate('/dashboard-manager')}>Vào Dashboard Manager</button>
                  </div>
                </div>
              ) : null}

              {/* Student: khóa học đang học */}
              {role === 'STUDENT' ? (
                <div className="role-courses-block">
                  <div className="role-courses-header">
                    <h2 className="role-courses-title">Khóa học đang học</h2>
                    <p className="role-courses-subtitle">Các khóa học bạn đã đăng ký</p>
                    <Link to="/my-courses" className="role-courses-link">Xem tất cả →</Link>
                  </div>
                  {loadingStudent ? (
                    <div className="role-courses-loading">Đang tải khóa học...</div>
                  ) : studentCourses.length === 0 ? (
                    <div className="role-courses-empty">
                      <p>Bạn chưa đăng ký khóa học nào.</p>
                      <button type="button" className="role-banner-btn primary" onClick={() => navigate('/')}>Khám phá khóa học</button>
                    </div>
                  ) : (
                    <div className="role-courses-grid">
                      {studentCourses.slice(0, 6).map((course) => (
                        <Link to="/my-courses" className="role-course-card role-course-card-student" key={course.enrollmentId}>
                          <div className="role-course-card-image">
                            <img src={course.thumbnailUrl || FALLBACK_THUMB} alt={course.courseTitle} />
                            <span className={`role-course-badge ${course.enrollmentStatus === 'COMPLETED' ? 'completed' : 'active'}`}>
                              {course.enrollmentStatus === 'COMPLETED' ? 'Hoàn thành' : 'Đang học'}
                            </span>
                          </div>
                          <div className="role-course-card-body">
                            <h3 className="role-course-card-title">{course.courseTitle}</h3>
                            <p className="role-course-card-progress">Tiến độ: {course.progress ?? 0}%</p>
                            <div className="role-course-progress-bar">
                              <div className="role-course-progress-fill" style={{ width: `${course.progress ?? 0}%` }} />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Teacher: khóa học đang dạy */}
              {role === 'TEACHER' ? (
                <div className="role-courses-block">
                  <div className="role-courses-header">
                    <h2 className="role-courses-title">Khóa học đang dạy</h2>
                    <p className="role-courses-subtitle">Danh sách khóa học bạn phụ trách giảng dạy</p>
                    <Link to="/teacher-page/courses" className="role-courses-link">Xem tất cả →</Link>
                  </div>
                  {loadingTeacher ? (
                    <div className="role-courses-loading">Đang tải khóa học...</div>
                  ) : teacherCourses.length === 0 ? (
                    <div className="role-courses-empty">
                      <p>Bạn chưa được gán khóa học nào.</p>
                      <button type="button" className="role-banner-btn primary" onClick={() => navigate('/teacher-page')}>Vào trang Giảng viên</button>
                    </div>
                  ) : (
                    <div className="role-courses-grid">
                      {teacherCourses.slice(0, 6).map((course) => {
                        const courseId = course.courseId ?? course.id ?? course.course_id
                        const title = course.title ?? course.name ?? course.courseName ?? 'Khóa học'
                        const thumb = course.thumbnailUrl ?? course.thumbnail ?? FALLBACK_THUMB
                        return (
                          <Link to="/teacher-page/courses" className="role-course-card role-course-card-teacher" key={courseId ?? title}>
                            <div className="role-course-card-image">
                              <img src={thumb} alt={title} />
                            </div>
                            <div className="role-course-card-body">
                              <h3 className="role-course-card-title">{title}</h3>
                              <p className="role-course-card-meta">Khóa giảng dạy</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </section>

          </div>

          <div className="homepage-bottom-bar">
            <div className="homepage-bottom-bar-inner">
              <div className="bottom-bar-buttons">
                <button
                  type="button"
                  className="bottom-bar-btn primary"
                  onClick={() => navigate('/quiz-placement')}
                >
                  Kiểm tra trình độ · Nhận tài liệu
                </button>
                <button
                  type="button"
                  className="bottom-bar-btn"
                  onClick={() => navigate('/contact')}
                >
                  Tư vấn
                </button>
                <button
                  type="button"
                  className="bottom-bar-btn"
                  onClick={() => navigate('/schedule')}
                >
                  Lịch khai giảng
                </button>
                <button
                  type="button"
                  className="bottom-bar-btn"
                  onClick={() => navigate('/testimonials')}
                >
                  Cảm nhận học viên
                </button>
                <button
                  type="button"
                  className="bottom-bar-btn"
                  onClick={() => navigate('/resources')}
                >
                  Kho tài liệu
                </button>
              </div>
              <p className="bottom-bar-note">
                Chọn một mục bên trên để bắt đầu hành trình của bạn với Ryugo.
              </p>
            </div>
          </div>

          <Footer />
        </Content>
      </Layout>
    </Layout>
  )
}

export default Homepages
