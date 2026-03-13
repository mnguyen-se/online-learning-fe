import * as XLSX from 'xlsx';

/** Các cột bắt buộc trong file Excel QUIZ (theo thứ tự, giống japanese_quiz_100_questions.xlsx) */
export const QUIZ_EXCEL_REQUIRED_HEADERS = ['Câu hỏi', 'A', 'B', 'C', 'D', 'Đáp án đúng'];

/**
 * Kiểm tra file Excel QUIZ có đúng định dạng mẫu hay không.
 * @param {File} file - File Excel
 * @returns {Promise<{ valid: boolean; message?: string; missingColumns?: string[] }>}
 */
export const validateQuizExcelFile = (file) => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) {
      resolve({ valid: false, message: 'Vui lòng chọn file Excel.' });
      return;
    }
    const name = (file.name || '').toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      resolve({ valid: false, message: 'File phải có định dạng .xlsx hoặc .xls.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          resolve({ valid: false, message: 'File trống hoặc không có sheet.' });
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) {
          resolve({ valid: false, message: 'File trống hoặc không có dữ liệu.' });
          return;
        }
        const headers = [];
        for (let c = 0; c < 6; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
          headers.push(cell ? String(cell.v ?? '').trim() : '');
        }
        const missing = QUIZ_EXCEL_REQUIRED_HEADERS.filter(
          (col, idx) => (headers[idx] || '') !== col
        );
        if (missing.length > 0) {
          resolve({
            valid: false,
            message: `File không đúng định dạng mẫu. Vui lòng kiểm tra lại các cột: ${missing.join(', ')}.`,
            missingColumns: missing,
          });
          return;
        }
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const hasData = range.e.r >= 1;
        if (!hasData) {
          resolve({ valid: false, message: 'File không có dữ liệu câu hỏi (chỉ có tiêu đề).' });
          return;
        }
        resolve({ valid: true });
      } catch (err) {
        resolve({ valid: false, message: 'Không thể đọc file. Vui lòng kiểm tra định dạng.' });
      }
    };
    reader.onerror = () => resolve({ valid: false, message: 'Không thể đọc file.' });
    reader.readAsArrayBuffer(file);
  });
};
