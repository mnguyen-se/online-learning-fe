import { useState } from 'react'
import { Layout } from 'antd'
import Sidebar from '../../components/Sidebar/Sidebar'
import Header from '../../components/Header/header'
import Footer from '../../components/Footer/footer'
import './homepage.css'

const { Content } = Layout

function Homepages() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout className="homepage-layout">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />

      {/* Main Layout */}
      <Layout className="homepage-main-layout">
        {/* Top Header with Translate feature */}
        <Header />

        {/* Main Content */}
        <Content className="homepage-content">
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
              <div className="hero-image-wrapper">
                <svg width="100%" height="100%" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="400" height="300" rx="16" fill="#E0F2F1"/>
                  <circle cx="100" cy="150" r="30" fill="#FFD700"/>
                  <circle cx="200" cy="150" r="30" fill="#FF6B4A"/>
                  <circle cx="300" cy="150" r="30" fill="#4ECDC4"/>
                  <path d="M50 200 L350 200" stroke="#14B8A6" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 100 L100 250" stroke="#14B8A6" strokeWidth="3"/>
                  <path d="M200 80 L200 270" stroke="#14B8A6" strokeWidth="3"/>
                  <path d="M300 120 L300 280" stroke="#14B8A6" strokeWidth="3"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="hero-indicators">
            <span className={activeSlide === 0 ? 'active' : ''} onClick={() => setActiveSlide(0)}></span>
            <span className={activeSlide === 1 ? 'active' : ''} onClick={() => setActiveSlide(1)}></span>
            <span className={activeSlide === 2 ? 'active' : ''} onClick={() => setActiveSlide(2)}></span>
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
                <svg className="course-crown-filled" width="24" height="24" viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
                <svg className="course-crown-outline" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <h3 className="course-title">Tiếng Nhật N5</h3>
              <p className="course-subtitle">Dành cho người mới bắt đầu</p>
            </div>

            <div className="course-card n4-card">
              <div className="course-header">
                <svg className="course-crown-filled" width="24" height="24" viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
                <svg className="course-crown-outline" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <h3 className="course-title">Tiếng Nhật N4</h3>
              <p className="course-subtitle">Nâng cao kiến thức cơ bản</p>
            </div>

            <div className="course-card n3-card">
              <div className="course-header">
                <svg className="course-crown-filled" width="24" height="24" viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
                <svg className="course-crown-outline" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <h3 className="course-title">Tiếng Nhật N3</h3>
              <p className="course-subtitle">Trung cấp tiếng Nhật</p>
            </div>

            <div className="course-card n2-card">
              <div className="course-header">
                <svg className="course-crown-filled" width="24" height="24" viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
                <svg className="course-crown-outline" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <h3 className="course-title">Tiếng Nhật N2</h3>
              <p className="course-subtitle">Cao cấp - Giao tiếp tự nhiên</p>
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

          <Footer />
        </Content>
      </Layout>
    </Layout>
  )
}

export default Homepages
