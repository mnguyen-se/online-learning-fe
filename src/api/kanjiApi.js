import axios from 'axios';
import { translateEnglishToVietnamese } from './translateApi';

// Kanji API - Miễn phí, hỗ trợ CORS, không cần API key

const KANJI_API_BASE = 'https://kanjiapi.dev/v1';

/**
 * Tra cứu kanji từ Kanji API (kanjiapi.dev)
 * @param {string} kanji - Chữ kanji cần tra cứu
 * @returns {Promise<Object>} - Thông tin kanji
 */
export const lookupKanji = async (kanji) => {
  if (!kanji || kanji.trim() === '') {
    throw new Error('Vui lòng nhập chữ kanji cần tra cứu');
  }

  // Lấy ký tự đầu tiên nếu nhập nhiều ký tự
  const kanjiChar = kanji.trim().charAt(0);

  // Kiểm tra xem có phải kanji không
  const kanjiRegex = /[\u4E00-\u9FAF]/;
  if (!kanjiRegex.test(kanjiChar)) {
    throw new Error('Vui lòng nhập một chữ kanji hợp lệ');
  }

  try {
    // Encode kanji character để dùng trong URL
    const encodedKanji = encodeURIComponent(kanjiChar);
    const response = await axios.get(`${KANJI_API_BASE}/kanji/${encodedKanji}`, {
      timeout: 10000,
    });

    if (response.data) {
      const data = response.data;
      
      // Format dữ liệu để hiển thị
      const meanings = data.meanings || [];
      let meaningsVi = [];
      
      // Dịch nghĩa từ tiếng Anh sang tiếng Việt
      if (meanings.length > 0) {
        try {
          // Dịch từng nghĩa riêng lẻ để có kết quả chính xác hơn
          const translationPromises = meanings.map(meaning => 
            translateEnglishToVietnamese(meaning).catch(err => {
              console.warn(`Error translating "${meaning}":`, err);
              return meaning; // Trả về nghĩa gốc nếu dịch lỗi
            })
          );
          
          meaningsVi = await Promise.all(translationPromises);
        } catch (error) {
          console.warn('Error translating meanings:', error);
          // Nếu dịch lỗi, vẫn hiển thị nghĩa tiếng Anh
          meaningsVi = meanings;
        }
      }
      
      const kanjiInfo = {
        kanji: kanjiChar,
        meanings: meanings,
        meaningsVi: meaningsVi, // Nghĩa tiếng Việt
        readings: {
          onyomi: data.on_readings || [],
          kunyomi: data.kun_readings || [],
        },
        strokeCount: data.stroke_count || null,
        grade: data.grade || null, // JLPT level hoặc grade
        jlpt: data.jlpt || null,
        frequency: data.frequency || null,
        radical: data.radical || null,
        parts: data.parts || [],
      };

      return kanjiInfo;
    }

    throw new Error('Không tìm thấy thông tin về kanji này');
  } catch (error) {
    console.error('Kanji lookup error:', error);
    
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error('Không tìm thấy kanji này trong cơ sở dữ liệu');
      } else if (status === 429) {
        throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      }
      throw new Error(`Lỗi API: ${status}`);
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Không thể kết nối đến dịch vụ tra cứu. Vui lòng kiểm tra kết nối internet.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Yêu cầu tra cứu quá thời gian. Vui lòng thử lại.');
    }
    
    throw error;
  }
};

/**
 * Tìm kiếm kanji theo nghĩa (tiếng Anh)
 * @param {string} meaning - Nghĩa cần tìm
 * @returns {Promise<Array>} - Danh sách kanji
 */
export const searchKanjiByMeaning = async (meaning) => {
  if (!meaning || meaning.trim() === '') {
    throw new Error('Vui lòng nhập nghĩa cần tìm');
  }

  try {
    const response = await axios.get(`${KANJI_API_BASE}/search/${encodeURIComponent(meaning.trim())}`, {
      timeout: 10000,
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data.slice(0, 10); // Giới hạn 10 kết quả
    }

    return [];
  } catch (error) {
    console.error('Kanji search error:', error);
    throw error;
  }
};
