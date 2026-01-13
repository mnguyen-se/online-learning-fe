import { useState } from 'react'
import Header from '../../components/Header/header'
import Footer from '../../components/Footer/footer'
import './Homepages.css'

function Homepages() {
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <div className="homepage">
      <Header />
      
      <div className="homepage-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Trang chủ</span>
            </a>
            <a href="#" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <span>Lộ trình</span>
            </a>
            <a href="#" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Bài viết</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Hero Banner */}
          <section className="hero-banner">
            <div className="hero-content">
              <div className="hero-text">
                <h1 className="hero-title">Lớp Tiếng Nhật Online Trực Tuyến JP</h1>
                <p className="hero-description">
                  Học tiếng Nhật trực tuyến qua Zoom, phù hợp nếu bạn muốn được review bài tập, học theo lịch trình có sẵn và tương tác với giảng viên bản ngữ. Giúp học linh hoạt, phù hợp cả sinh viên và người đi làm.
                </p>
                <button className="hero-button">NHẬN LỘ TRÌNH TIẾNG NHẬT</button>
              </div>
              <div className="hero-image">
                <div className="hero-image-placeholder">
                  <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="hero-indicators">
              <span className={activeSlide === 0 ? 'active' : ''}></span>
              <span className={activeSlide === 1 ? 'active' : ''}></span>
              <span className={activeSlide === 2 ? 'active' : ''}></span>
            </div>
          </section>

          {/* Pro Courses Section */}
          <section className="courses-section">
            <div className="section-header">
              <h2 className="section-title">
                Khóa học Pro
                <span className="new-badge">MỚI</span>
              </h2>
            </div>
            <div className="courses-grid pro-courses">
              <div className="course-card n5-card">
                <div className="course-header">
                  <svg className="course-crown" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    <path d="M12 18v4" />
                    <path d="M8 22h8" />
                  </svg>
                  <svg className="course-bookmark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="course-title">Tiếng Nhật N5</h3>
                <p className="course-subtitle">Dành cho người mới bắt đầu</p>
              </div>

              <div className="course-card n4-card">
                <div className="course-header">
                  <svg className="course-crown" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    <path d="M12 18v4" />
                    <path d="M8 22h8" />
                  </svg>
                  <svg className="course-bookmark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="course-title">Tiếng Nhật N4</h3>
                <p className="course-subtitle">Nâng cao kiến thức cơ bản</p>
              </div>

              <div className="course-card n3-card">
                <div className="course-header">
                  <svg className="course-crown" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    <path d="M12 18v4" />
                    <path d="M8 22h8" />
                  </svg>
                  <svg className="course-bookmark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="course-title">Tiếng Nhật N3</h3>
                <p className="course-subtitle">Trung cấp tiếng Nhật</p>
              </div>

              <div className="course-card n2-card">
                <div className="course-header">
                  <svg className="course-crown" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    <path d="M12 18v4" />
                    <path d="M8 22h8" />
                  </svg>
                  <svg className="course-bookmark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="course-title">Tiếng Nhật N2</h3>
                <p className="course-subtitle">Cao cấp - Giao tiếp tự nhiên</p>
              </div>

              <div className="course-card n1-card">
                <div className="course-header">
                  <svg className="course-crown" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                    <path d="M12 18v4" />
                    <path d="M8 22h8" />
                  </svg>
                  <svg className="course-bookmark" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="course-title">Tiếng Nhật N1</h3>
                <p className="course-subtitle">Thành thạo - Lưu loát như người bản ngữ</p>
              </div>
            </div>
          </section>

          {/* Free Courses Section */}
          <section className="courses-section">
            <div className="section-header">
              <h2 className="section-title">Khóa học miễn phí</h2>
            </div>
            <div className="courses-grid free-courses">
              <div className="free-course-card">
                <div className="free-course-icon orange">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <h3 className="free-course-title">Hiragana & Katakana</h3>
                <p className="free-course-subtitle">Học bảng chữ cái Nhật Bản</p>
              </div>

              <div className="free-course-card">
                <div className="free-course-icon green">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <h3 className="free-course-title">Kanji Cơ Bản</h3>
                <p className="free-course-subtitle">300 chữ Hán thông dụng</p>
              </div>

              <div className="free-course-card">
                <div className="free-course-icon blue">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <h3 className="free-course-title">Ngữ Pháp N5</h3>
                <p className="free-course-subtitle">Cấu trúc câu cơ bản</p>
              </div>

              <div className="free-course-card">
                <div className="free-course-icon purple">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="free-course-title">Giao Tiếp Hàng Ngày</h3>
                <p className="free-course-subtitle">Hội thoại thực tế</p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  )
}

export default Homepages
