import React from 'react';
import { Empty } from 'antd';
import './SubmissionDetail.css';

/**
 * Hiển thị theo cặp: Card "Câu hỏi N" ngay trên Card "Bài làm câu N".
 * Câu hỏi 1 → Bài làm 1, Câu hỏi 2 → Bài làm 2, ...
 */
function StudentAnswer({ content, questionsWithAnswers = [] }) {
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
          <React.Fragment key={item.order}>
            <div className="submission-detail-card submission-detail-card-question">
              <h3 className="submission-detail-section-title">Câu hỏi {item.order}</h3>
              <div className="submission-detail-content-box">
                <div className="submission-detail-question-text">{item.questionText}</div>
              </div>
            </div>
            <div className="submission-detail-card submission-detail-card-answer">
              <h3 className="submission-detail-section-title">Bài làm câu {item.order}</h3>
              <div className="submission-detail-content-box">
                <div className="submission-detail-answer-text">{item.answerText || '—'}</div>
              </div>
            </div>
          </React.Fragment>
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

export default StudentAnswer;
