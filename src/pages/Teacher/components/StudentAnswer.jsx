import React, { useState, useEffect } from 'react';
import { Tag, Empty, Button, Switch, InputNumber } from 'antd';
import { CheckCircle2, XCircle, HelpCircle, Eye, EyeOff } from 'lucide-react';
import './SubmissionDetail.css';

/**
 * Hiển thị câu trả lời của học sinh theo từng loại câu hỏi
 * Hỗ trợ: FILL_BLANK, REORDER, MATCHING, ESSAY_WRITING
 */
function StudentAnswer({ content, questionsWithAnswers = [], onUpdateAnswerGrade, answerGrades = {} }) {
  const hasContent = content != null && String(content).trim() !== '';
  const hasQuestions = Array.isArray(questionsWithAnswers) && questionsWithAnswers.length > 0;

  if (!hasContent && !hasQuestions) {
    return (
      <div className="submission-detail-paired-cards">
        <div className="submission-detail-card submission-detail-card-question">
          <h3 className="submission-detail-section-title">CÂU HỎI / ĐỀ BÀI</h3>
          <div className="submission-detail-content-box">
            <Empty description="Chưa có câu hỏi." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </div>
        <div className="submission-detail-card submission-detail-card-answer">
          <h3 className="submission-detail-section-title">BÀI LÀM CỦA HỌC SINH</h3>
          <div className="submission-detail-content-box">
            <Empty description="Chưa có nội dung bài làm." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        </div>
      </div>
    );
  }

  if (hasQuestions) {
    return (
      <div className="submission-detail-paired-cards">
        {questionsWithAnswers.map((item) => (
          <QuestionAnswerPair 
            key={item.order || item.questionId} 
            item={item}
            onUpdateAnswerGrade={onUpdateAnswerGrade}
            answerGrades={answerGrades}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="submission-detail-paired-cards">
      <div className="submission-detail-card submission-detail-card-question">
        <h3 className="submission-detail-section-title">CÂU HỎI / ĐỀ BÀI</h3>
        <div className="submission-detail-content-box">
          <p className="submission-detail-content-text submission-detail-content-muted">(Nội dung chung)</p>
        </div>
      </div>
      <div className="submission-detail-card submission-detail-card-answer">
        <h3 className="submission-detail-section-title">BÀI LÀM CỦA HỌC SINH</h3>
        <div className="submission-detail-content-box">
          <p className="submission-detail-content-text">{String(content || '').trim()}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Component hiển thị một cặp Câu hỏi - Bài làm
 */
function QuestionAnswerPair({ item, onUpdateAnswerGrade, answerGrades = {} }) {
  const { order, questionText, questionType, studentAnswer, sampleAnswer, points, pointsEarned, isCorrect, items, columnA, columnB, answerId } = item;
  const type = (questionType || 'FILL_BLANK').toUpperCase();
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  
  // Lấy giá trị isCorrect đã sửa hoặc giá trị gốc
  const editedGrade = answerId ? answerGrades[answerId] : null;
  const currentIsCorrect = editedGrade?.isCorrect !== undefined ? editedGrade.isCorrect : isCorrect;
  const currentPointsEarned = editedGrade?.pointsEarned !== undefined ? editedGrade.pointsEarned : pointsEarned;
  const [localIsCorrect, setLocalIsCorrect] = useState(currentIsCorrect);
  const [localPointsEarned, setLocalPointsEarned] = useState(currentPointsEarned);

  // Update local state khi giá trị từ props thay đổi
  useEffect(() => {
    setLocalIsCorrect(currentIsCorrect);
    setLocalPointsEarned(currentPointsEarned);
  }, [currentIsCorrect, currentPointsEarned]);

  const handleToggleCorrect = (checked) => {
    setLocalIsCorrect(checked);
    if (onUpdateAnswerGrade && answerId) {
      onUpdateAnswerGrade(answerId, { isCorrect: checked });
    }
  };

  const handlePointsChange = (value) => {
    const newPoints = value === null ? 0 : value;
    setLocalPointsEarned(newPoints);
    
    // Auto-update isCorrect based on points > 0 if desired, or let teacher manually toggle.
    // For now we just sync the points.
    if (onUpdateAnswerGrade && answerId) {
      onUpdateAnswerGrade(answerId, { pointsEarned: newPoints, isCorrect: newPoints > 0 });
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      FILL_BLANK: 'Điền vào chỗ trống',
      REORDER: 'Sắp xếp câu',
      MATCHING: 'Nối đáp án',
      ESSAY_WRITING: 'Viết đoạn văn',
    };
    return labels[type] || type;
  };

  const getQuestionTypeColor = (type) => {
    const colors = {
      FILL_BLANK: 'blue',
      REORDER: 'purple',
      MATCHING: 'green',
      ESSAY_WRITING: 'orange',
    };
    return colors[type] || 'default';
  };

  return (
    <React.Fragment>
      {/* Card Câu hỏi */}
      <div className="submission-detail-card submission-detail-card-question">
        <div className="submission-detail-question-header">
          <h3 className="submission-detail-section-title">Câu hỏi {order}</h3>
          <div className="submission-detail-question-meta">
            <Tag color={getQuestionTypeColor(type)} className="submission-detail-question-type-tag">
              {getQuestionTypeLabel(type)}
            </Tag>
            {points != null && (
              <span className="submission-detail-question-points">
                {points} {points === 1 ? 'điểm' : 'điểm'}
              </span>
            )}
          </div>
        </div>
        <div className="submission-detail-content-box">
          <div className="submission-detail-question-text">{questionText || '—'}</div>
          {sampleAnswer && (
            <div className="submission-detail-sample-answer-toggle">
              <Button
                type="text"
                size="small"
                icon={showSampleAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                className="submission-detail-sample-answer-btn"
              >
                {showSampleAnswer ? 'Ẩn đáp án mẫu' : 'Xem đáp án mẫu'}
              </Button>
              {showSampleAnswer && (
                <div className="submission-detail-sample-answer-popup">
                  <div className="submission-detail-sample-answer-label">
                    <HelpCircle size={14} />
                    <span>Đáp án mẫu:</span>
                  </div>
                  <div className="submission-detail-sample-answer-content">
                    {type === 'MATCHING' ? formatMatchingAnswer(sampleAnswer) : sampleAnswer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Bài làm */}
      <div className="submission-detail-card submission-detail-card-answer">
        <div className="submission-detail-answer-header">
          <h3 className="submission-detail-section-title">Bài làm câu {order}</h3>
          <div className="submission-detail-answer-controls">
            {onUpdateAnswerGrade && answerId && (
              <div className="submission-detail-correct-toggle" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="submission-detail-correct-toggle-label">Điểm:</span>
                  <InputNumber
                    min={0}
                    max={points || 100}
                    value={localPointsEarned}
                    onChange={handlePointsChange}
                    size="small"
                    style={{ width: '70px' }}
                  />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>/ {points}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="submission-detail-correct-toggle-label">Kết quả:</span>
                  <Switch
                    checked={localIsCorrect === true}
                    checkedChildren="Đúng"
                    unCheckedChildren="Sai"
                    onChange={handleToggleCorrect}
                    size="small"
                  />
                </div>
              </div>
            )}
            {(!onUpdateAnswerGrade || !answerId) && localIsCorrect !== null && (
              <div className="submission-detail-answer-status">
                {localIsCorrect ? (
                  <Tag color="green" icon={<CheckCircle2 size={14} />}>
                    Đúng
                  </Tag>
                ) : (
                  <Tag color="red" icon={<XCircle size={14} />}>
                    Sai
                  </Tag>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="submission-detail-content-box">
          <AnswerDisplay
            type={type}
            studentAnswer={studentAnswer}
            sampleAnswer={sampleAnswer}
            questionText={questionText}
            items={items}
            columnA={columnA}
            columnB={columnB}
            isCorrect={localIsCorrect}
            pointsEarned={pointsEarned}
            points={points}
          />
          {localPointsEarned != null && (
            <div className={`submission-detail-points-earned ${localIsCorrect === true ? 'submission-detail-points-earned-correct' : localIsCorrect === false ? 'submission-detail-points-earned-incorrect' : ''}`}>
              Điểm đạt: <strong>{localPointsEarned}</strong> / {points}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}

/**
 * Component hiển thị câu trả lời theo từng loại
 */
function AnswerDisplay({ type, studentAnswer, sampleAnswer, questionText, items, columnA, columnB, isCorrect, pointsEarned, points }) {
  if (!studentAnswer || studentAnswer === '—') {
    return <div className="submission-detail-answer-empty">Chưa có câu trả lời</div>;
  }

  switch (type) {
    case 'FILL_BLANK':
      return <FillBlankAnswer answer={studentAnswer} questionText={questionText} sampleAnswer={sampleAnswer} isCorrect={isCorrect} />;

    case 'REORDER':
      return <ReorderAnswer answer={studentAnswer} items={items} isCorrect={isCorrect} />;

    case 'MATCHING':
      return <MatchingAnswer answer={studentAnswer} sampleAnswer={sampleAnswer} columnA={columnA} columnB={columnB} isCorrect={isCorrect} />;

    case 'ESSAY_WRITING':
      return <EssayAnswer answer={studentAnswer} isCorrect={isCorrect} />;

    default:
      return <div className="submission-detail-answer-text">{studentAnswer}</div>;
  }
}

/**
 * Hiển thị câu trả lời FILL_BLANK
 */
function FillBlankAnswer({ answer, questionText, sampleAnswer, isCorrect }) {
  // Nếu có questionText, thử highlight chỗ trống
  if (questionText && questionText.includes('（') && questionText.includes('）')) {
    const parts = questionText.split('（');
    if (parts.length > 1) {
      const [before, after] = parts;
      const afterParts = after.split('）');
      return (
        <div className="submission-detail-fill-blank">
          <div className="submission-detail-fill-blank-question">
            {before}
            <span className="submission-detail-blank-highlight">{answer || '______'}</span>
            {afterParts[1] || ''}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="submission-detail-fill-blank">
      <div className="submission-detail-fill-blank-answer">
        <span className="submission-detail-answer-label">Câu trả lời:</span>
        <span className="submission-detail-fill-blank-value">{answer}</span>
      </div>
    </div>
  );
}

/**
 * Hiển thị câu trả lời REORDER
 */
function ReorderAnswer({ answer, items = [], isCorrect }) {
  let orderedIds = [];
  
  try {
    // Thử parse JSON array
    if (answer.startsWith('[') && answer.endsWith(']')) {
      orderedIds = JSON.parse(answer);
    } else {
      // Nếu không phải JSON, thử split bằng comma
      orderedIds = answer.split(',').map((item) => item.trim()).filter(Boolean);
    }
  } catch (e) {
    // Nếu parse lỗi, hiển thị raw
    return <div className="submission-detail-answer-text">{answer}</div>;
  }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return <div className="submission-detail-answer-empty">Chưa có câu trả lời</div>;
  }

  // Helper function để tìm text từ ID
  const getItemText = (id) => {
    if (!Array.isArray(items) || items.length === 0) {
      // Nếu không có items, hiển thị ID
      return typeof id === 'string' && id.match(/^item\d+$/i) 
        ? id.replace(/^item/i, 'Item ') 
        : id;
    }
    
    // Nếu id là "item0", "item1", etc.
    const indexMatch = String(id).match(/^item(\d+)$/i);
    if (indexMatch) {
      const itemIndex = parseInt(indexMatch[1], 10);
      if (itemIndex >= 0 && itemIndex < items.length) {
        const item = items[itemIndex];
        // item có thể là string hoặc object với text property
        return typeof item === 'string' ? item : (item?.text ?? item?.itemText ?? item);
      }
    }
    
    // Tìm theo exact match
    const foundItem = items.find((item) => {
      const itemId = item?.id ?? item?.itemId ?? String(item);
      return itemId === id || String(item) === id;
    });
    if (foundItem) {
      return typeof foundItem === 'string' ? foundItem : (foundItem?.text ?? foundItem?.itemText ?? foundItem);
    }
    
    // Fallback: hiển thị ID
    return typeof id === 'string' && id.match(/^item\d+$/i) 
      ? id.replace(/^item/i, 'Item ') 
      : id;
  };

  return (
    <div className="submission-detail-reorder-answer">
      <div className="submission-detail-reorder-label">Thứ tự đã sắp xếp:</div>
      <div className="submission-detail-reorder-items submission-detail-reorder-items-horizontal">
        {orderedIds.map((id, index) => {
          const displayText = getItemText(id);
          
          return (
            <div key={index} className="submission-detail-reorder-item submission-detail-reorder-item-horizontal">
              <span className="submission-detail-reorder-number">{index + 1}</span>
              <span className="submission-detail-reorder-text">{displayText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hiển thị câu trả lời MATCHING
 */
function MatchingAnswer({ answer, sampleAnswer, columnA = [], columnB = [], isCorrect }) {
  let pairs = [];
  
  try {
    // Thử parse JSON array
    if (answer.startsWith('[') && answer.endsWith(']')) {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) {
        pairs = parsed.map((item) => {
          // Hỗ trợ nhiều format: bid/aid, bId/aId, bld/ald
          const aId = item.aid || item.aId || item.ald || item['aId'] || '';
          const bId = item.bid || item.bId || item.bld || item['bld Id'] || item['bId'] || '';
          return { aId, bId };
        }).filter((p) => p.aId && p.bId);
      }
    }
  } catch (e) {
    // Nếu parse lỗi, hiển thị raw
    return <div className="submission-detail-answer-text">{answer}</div>;
  }

  if (pairs.length === 0) {
    return <div className="submission-detail-answer-empty">Chưa có câu trả lời</div>;
  }

  // Helper function để convert ID format
  // A1, A2, A3, A4 → 1, 2, 3, 4
  // B1, B2, B3, B4 → A, B, C, D
  const formatId = (id, column) => {
    if (!id) return id;
    const idStr = String(id).trim().toUpperCase();
    
    // Thử nhiều pattern: A1, A-1, A 1, A_1, etc.
    const patterns = [
      /^([AB])(\d+)$/i,           // A1, B2
      /^([AB])[-\s_]?(\d+)$/i,    // A-1, B 2, A_1
      /^([AB])([A-Z])$/i,         // AA, BB (nếu đã là chữ)
    ];
    
    for (const pattern of patterns) {
      const match = idStr.match(pattern);
      if (match) {
        const prefix = match[1].toUpperCase();
        const numberOrLetter = match[2];
        
        if (prefix === 'A') {
          // Cột A: A1→1, A2→2, A3→3, A4→4
          const num = parseInt(numberOrLetter, 10);
          if (!isNaN(num) && num > 0) {
            return String(num);
          }
        } else if (prefix === 'B') {
          // Cột B: B1→A, B2→B, B3→C, B4→D
          const num = parseInt(numberOrLetter, 10);
          if (!isNaN(num) && num > 0) {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            return letters[num - 1] || String(num);
          }
          // Nếu đã là chữ cái, giữ nguyên
          return numberOrLetter.toUpperCase();
        }
      }
    }
    
    // Nếu không match pattern, thử tìm số trong string
    const numberMatch = idStr.match(/(\d+)/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (column === 'A' && !isNaN(num) && num > 0) {
        return String(num);
      } else if (column === 'B' && !isNaN(num) && num > 0) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return letters[num - 1] || String(num);
      }
    }
    
    // Fallback: trả về ID gốc
    return idStr;
  };

  // Helper function để tìm text từ ID
  const getItemText = (id, column) => {
    const columnItems = column === 'A' ? columnA : columnB;
    if (!Array.isArray(columnItems) || columnItems.length === 0) return '';
    
    const found = columnItems.find((item) => {
      const itemId = item?.id ?? item?.itemId ?? '';
      return itemId === id;
    });
    return found?.text ?? found?.itemText ?? '';
  };

  return (
    <div className="submission-detail-matching-answer">
      <div className="submission-detail-matching-label">Các cặp đã nối:</div>
      <div className="submission-detail-matching-pairs">
        {pairs.map((pair, index) => {
          // Format ID để hiển thị: A1→1, B1→A
          const aFormattedId = formatId(pair.aId, 'A');
          const bFormattedId = formatId(pair.bId, 'B');
          
          // Tìm text từ columnA/columnB bằng ID gốc (không format)
          const aText = getItemText(pair.aId, 'A');
          const bText = getItemText(pair.bId, 'B');
          
          return (
            <div 
              key={index} 
              className={`submission-detail-matching-pair ${isCorrect === true ? 'submission-detail-matching-pair-correct' : isCorrect === false ? 'submission-detail-matching-pair-incorrect' : ''}`}
            >
              <span className="submission-detail-matching-a">
                {aFormattedId}{aText ? `: ${aText}` : ''}
              </span>
              <span className="submission-detail-matching-arrow">→</span>
              <span className="submission-detail-matching-b">
                {bFormattedId}{bText ? `: ${bText}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hiển thị câu trả lời ESSAY_WRITING
 */
function EssayAnswer({ answer, isCorrect }) {
  return (
    <div className="submission-detail-essay-answer">
      <div className="submission-detail-essay-content">{answer}</div>
    </div>
  );
}

/**
 * Format đáp án mẫu cho MATCHING
 */
function formatMatchingAnswer(sampleAnswer) {
  if (!sampleAnswer) return '';
  // Format: "1-B, 2-C, 3-A, 4-D" hoặc tương tự
  return sampleAnswer;
}

export default StudentAnswer;
