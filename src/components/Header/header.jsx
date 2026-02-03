import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { translateJapaneseToVietnamese, translateVietnameseToJapanese } from '../../api/translateApi';
import { lookupKanji } from '../../api/kanjiApi';
import './header.css';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('translate'); // 'translate' hoặc 'kanji'
  const [translateText, setTranslateText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateDirection, setTranslateDirection] = useState('ja-vi'); // 'ja-vi' hoặc 'vi-ja'
  const [kanjiInput, setKanjiInput] = useState('');
  const [kanjiInfo, setKanjiInfo] = useState(null);
  const [isLookingUpKanji, setIsLookingUpKanji] = useState(false);
  const dropdownRef = useRef(null);
  const translateDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (translateDropdownRef.current && !translateDropdownRef.current.contains(event.target)) {
        setShowTranslateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTranslate = async () => {
    if (!translateText.trim()) {
      toast.warning('Vui lòng nhập văn bản cần dịch');
      return;
    }

    setIsTranslating(true);
    setTranslatedText('');

    try {
      let result;
      if (translateDirection === 'ja-vi') {
        result = await translateJapaneseToVietnamese(translateText);
      } else {
        result = await translateVietnameseToJapanese(translateText);
      }
      setTranslatedText(result);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi dịch. Vui lòng thử lại.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = translateText;
    setTranslateText(translatedText);
    setTranslatedText(temp);
    setTranslateDirection(translateDirection === 'ja-vi' ? 'vi-ja' : 'ja-vi');
  };

  const handleClear = () => {
    setTranslateText('');
    setTranslatedText('');
  };

  const handleLookupKanji = async () => {
    if (!kanjiInput.trim()) {
      toast.warning('Vui lòng nhập chữ kanji cần tra cứu');
      return;
    }

    setIsLookingUpKanji(true);
    setKanjiInfo(null);

    try {
      const result = await lookupKanji(kanjiInput);
      setKanjiInfo(result);
    } catch (error) {
      console.error('Kanji lookup error:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tra cứu kanji. Vui lòng thử lại.');
      setKanjiInfo(null);
    } finally {
      setIsLookingUpKanji(false);
    }
  };

  const handleClearKanji = () => {
    setKanjiInput('');
    setKanjiInfo(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rememberMe');
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate('/');
    window.location.reload(); // Reload để cập nhật header
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="#FF6B4A"/>
              <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">日</text>
            </svg>
          </div>
          <h2>Học Tiếng Nhật Để Đi Làm</h2>
        </div>

        {/* Search Bar */}
        <div className="header-search-section">
          <div className="search-bar">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Tìm kiếm khóa học, bài viết, video, ..." />
          </div>
          
          {/* Translate Button */}
          <div className="translate-dropdown" ref={translateDropdownRef}>
            <button 
              className="translate-icon-btn"
              onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
              aria-label="Dịch từ điển"
              title="Dịch từ điển"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>
            {showTranslateDropdown && (
              <div className="translate-dropdown-menu">
                <div className="translate-header">
                  <h3>Dịch từ điển</h3>
                  <button className="close-btn" onClick={() => setShowTranslateDropdown(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="dictionary-tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'translate' ? 'active' : ''}`}
                    onClick={() => setActiveTab('translate')}
                  >
                    Dịch thuật
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'kanji' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kanji')}
                  >
                    Tra cứu Kanji
                  </button>
                </div>
                {activeTab === 'translate' ? (
                  <>
                <div className="translate-direction">
                  <button 
                    className={`direction-btn ${translateDirection === 'ja-vi' ? 'active' : ''}`}
                    onClick={() => setTranslateDirection('ja-vi')}
                  >
                    <span>🇯🇵 Tiếng Nhật</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span>🇻🇳 Tiếng Việt</span>
                  </button>
                  <button 
                    className={`direction-btn ${translateDirection === 'vi-ja' ? 'active' : ''}`}
                    onClick={() => setTranslateDirection('vi-ja')}
                  >
                    <span>🇻🇳 Tiếng Việt</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span>🇯🇵 Tiếng Nhật</span>
                  </button>
                </div>
                <div className="translate-input-section">
                  <textarea
                    className="translate-input"
                    placeholder={translateDirection === 'ja-vi' ? 'Nhập văn bản tiếng Nhật...' : 'Nhập văn bản tiếng Việt...'}
                    value={translateText}
                    onChange={(e) => setTranslateText(e.target.value)}
                    rows="4"
                  />
                  <div className="translate-actions">
                    <button 
                      className="swap-btn"
                      onClick={handleSwapLanguages}
                      title="Đổi chiều dịch"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 16l7-7"/>
                      </svg>
                    </button>
                    <button 
                      className="translate-action-btn"
                      onClick={handleTranslate}
                      disabled={isTranslating || !translateText.trim()}
                    >
                      {isTranslating ? 'Đang dịch...' : 'Dịch'}
                    </button>
                    {translateText && (
                      <button 
                        className="clear-btn"
                        onClick={handleClear}
                        title="Xóa"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="translate-output-section">
                  <textarea
                    className="translate-output"
                    placeholder="Kết quả dịch sẽ hiển thị ở đây..."
                    value={translatedText}
                    readOnly
                    rows="4"
                  />
                  {translatedText && (
                    <button 
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(translatedText);
                        toast.success('Đã sao chép vào clipboard');
                      }}
                      title="Sao chép"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  )}
                </div>
                  </>
                ) : (
                  <div className="kanji-lookup-section">
                    <div className="kanji-input-section">
                      <input
                        type="text"
                        className="kanji-input"
                        placeholder="Nhập chữ kanji cần tra cứu (ví dụ: 日, 月, 水)..."
                        value={kanjiInput}
                        onChange={(e) => setKanjiInput(e.target.value)}
                        maxLength={1}
                      />
                      <div className="kanji-actions">
                        <button 
                          className="kanji-lookup-btn"
                          onClick={handleLookupKanji}
                          disabled={isLookingUpKanji || !kanjiInput.trim()}
                        >
                          {isLookingUpKanji ? 'Đang tra cứu...' : 'Tra cứu'}
                        </button>
                        {kanjiInput && (
                          <button 
                            className="clear-btn"
                            onClick={handleClearKanji}
                            title="Xóa"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {kanjiInfo && (
                      <div className="kanji-result">
                        <div className="kanji-display">
                          <div className="kanji-char">{kanjiInfo.kanji}</div>
                          <div className="kanji-badges">
                            {kanjiInfo.jlpt && (
                              <span className="kanji-jlpt">JLPT N{kanjiInfo.jlpt}</span>
                            )}
                            {kanjiInfo.grade && (
                              <span className="kanji-grade">Lớp {kanjiInfo.grade}</span>
                            )}
                            {kanjiInfo.strokeCount && (
                              <span className="kanji-strokes">{kanjiInfo.strokeCount} nét</span>
                            )}
                          </div>
                        </div>
                        <div className="kanji-details">
                          {kanjiInfo.meaningsVi && kanjiInfo.meaningsVi.length > 0 && (
                            <div className="kanji-section">
                              <h4>Nghĩa (Tiếng Việt):</h4>
                              <div className="kanji-meanings">
                                {kanjiInfo.meaningsVi.map((meaning, index) => (
                                  <span key={index} className="kanji-meaning vi-meaning">{meaning}</span>
                                ))}
                              </div>
                              {kanjiInfo.meanings && kanjiInfo.meanings.length > 0 && (
                                <div className="kanji-meanings-en">
                                  <span className="en-label">(Tiếng Anh: </span>
                                  {kanjiInfo.meanings.map((meaning, index) => (
                                    <span key={index}>
                                      <span className="kanji-meaning-en">{meaning}</span>
                                      {index < kanjiInfo.meanings.length - 1 && <span>, </span>}
                                    </span>
                                  ))}
                                  <span>)</span>
                                </div>
                              )}
                            </div>
                          )}
                          {(!kanjiInfo.meaningsVi || kanjiInfo.meaningsVi.length === 0) && kanjiInfo.meanings && kanjiInfo.meanings.length > 0 && (
                            <div className="kanji-section">
                              <h4>Nghĩa (Tiếng Anh):</h4>
                              <div className="kanji-meanings">
                                {kanjiInfo.meanings.map((meaning, index) => (
                                  <span key={index} className="kanji-meaning">{meaning}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {kanjiInfo.readings.onyomi && kanjiInfo.readings.onyomi.length > 0 && (
                            <div className="kanji-section">
                              <h4>Âm On (音読み):</h4>
                              <div className="kanji-readings">
                                {kanjiInfo.readings.onyomi.map((reading, index) => (
                                  <span key={index} className="kanji-reading onyomi">{reading}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {kanjiInfo.readings.kunyomi && kanjiInfo.readings.kunyomi.length > 0 && (
                            <div className="kanji-section">
                              <h4>Âm Kun (訓読み):</h4>
                              <div className="kanji-readings">
                                {kanjiInfo.readings.kunyomi.map((reading, index) => (
                                  <span key={index} className="kanji-reading kunyomi">{reading}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {kanjiInfo.radical && (
                            <div className="kanji-section">
                              <h4>Bộ thủ:</h4>
                              <span className="kanji-radical">{kanjiInfo.radical}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-actions">
          {isLoggedIn ? (
            <div className="profile-dropdown" ref={dropdownRef}>
              <button 
                className="profile-icon-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Menu người dùng"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </button>
              {showDropdown && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Trang cá nhân</span>
                  </Link>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/register" className="btn-register">Đăng ký</a>
              <a href="/login" className="btn-login">Đăng nhập</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
