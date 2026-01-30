import axios from 'axios';

// MyMemory Translation API - Miễn phí, không cần API key
// Giới hạn: 10,000 ký tự/ngày (free tier)
// https://mymemory.translated.net/
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

/**
 * Dịch văn bản sử dụng MyMemory Translation API (miễn phí)
 * @param {string} text - Văn bản cần dịch
 * @param {string} sourceLang - Ngôn ngữ nguồn (vi, ja)
 * @param {string} targetLang - Ngôn ngữ đích (vi, ja)
 * @returns {Promise<string>} - Văn bản đã dịch
 */
export const translateText = async (text, sourceLang = 'auto', targetLang = 'vi') => {
  if (!text || text.trim() === '') {
    return '';
  }

  // Chuyển đổi mã ngôn ngữ
  const langMap = {
    'ja': 'ja',
    'vi': 'vi',
    'en': 'en',
    'auto': 'auto'
  };

  const source = langMap[sourceLang] || sourceLang;
  const target = langMap[targetLang] || targetLang;

  // Nếu là auto-detect, thử phát hiện ngôn ngữ
  let finalSource = source;
  if (source === 'auto') {
    // Thử phát hiện: nếu có ký tự Hiragana/Katakana/Kanji thì là tiếng Nhật
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const englishRegex = /^[a-zA-Z\s,.'-]+$/;
    
    if (japaneseRegex.test(text)) {
      finalSource = 'ja';
    } else if (englishRegex.test(text.trim())) {
      finalSource = 'en';
    } else {
      finalSource = 'vi';
    }
  }

  try {
    const response = await axios.get(MYMEMORY_API_URL, {
      params: {
        q: text,
        langpair: `${finalSource}|${target}`,
      },
      timeout: 10000, // 10 giây timeout
    });

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }

    throw new Error('Không nhận được kết quả dịch từ API');
  } catch (error) {
    console.error('Translation error:', error);
    
    if (error.response) {
      // Lỗi từ API
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.statusText;
      
      if (status === 429) {
        throw new Error('Đã vượt quá giới hạn dịch miễn phí (10,000 ký tự/ngày). Vui lòng thử lại sau.');
      } else if (status === 400) {
        throw new Error('Yêu cầu không hợp lệ: ' + message);
      }
      
      throw new Error(`Lỗi API: ${status} - ${message}`);
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Không thể kết nối đến dịch vụ dịch thuật. Vui lòng kiểm tra kết nối internet.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Yêu cầu dịch thuật quá thời gian. Vui lòng thử lại.');
    }
    
    throw error;
  }
};

/**
 * Phát hiện ngôn ngữ tự động (dựa trên ký tự)
 * @param {string} text - Văn bản cần phát hiện
 * @returns {string} - Mã ngôn ngữ (vi, ja, auto)
 */
export const detectLanguage = (text) => {
  if (!text || text.trim() === '') {
    return 'vi';
  }

  // Phát hiện tiếng Nhật: có ký tự Hiragana, Katakana, hoặc Kanji
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  if (japaneseRegex.test(text)) {
    return 'ja';
  }

  // Mặc định là tiếng Việt
  return 'vi';
};

/**
 * Dịch từ tiếng Nhật sang tiếng Việt
 */
export const translateJapaneseToVietnamese = async (text) => {
  return translateText(text, 'ja', 'vi');
};

/**
 * Dịch từ tiếng Việt sang tiếng Nhật
 */
export const translateVietnameseToJapanese = async (text) => {
  return translateText(text, 'vi', 'ja');
};

/**
 * Dịch từ tiếng Anh sang tiếng Việt
 */
export const translateEnglishToVietnamese = async (text) => {
  return translateText(text, 'en', 'vi');
};
