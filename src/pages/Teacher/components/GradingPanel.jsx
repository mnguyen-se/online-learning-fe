import React from 'react';
import { Card, Button, Input, InputNumber } from 'antd';
import { ArrowLeft, Save, Send, GraduationCap, Eye } from 'lucide-react';
import './SubmissionDetail.css';

/**
 * Panel chấm điểm (cột phải).
 * - Writing: nhập điểm, Lưu điểm, Nhận xét, Gửi nhận xét.
 * - Quiz (isQuiz): chỉ hiển thị điểm theo logic BE, nút "Mở điểm cho học sinh xem".
 */
function GradingPanel({
  maxScore = 10,
  score,
  onScoreChange,
  feedback,
  onFeedbackChange,
  onSaveScore,
  onSendFeedback,
  onBack,
  submitting = false,
  /** Quiz: true = điểm tự động theo BE, chỉ nút công bố điểm */
  isQuiz = false,
  /** Quiz: điểm hiển thị (đã chấm từ BE hoặc tính từ đáp án) */
  displayScore = null,
  /** Quiz: gọi khi bấm "Mở điểm cho học sinh xem" */
  onPublishScore,
}) {
  const showScoreReadOnly = isQuiz && (displayScore != null || onPublishScore != null);
  const scoreValue = showScoreReadOnly ? (displayScore ?? '—') : (score === '' ? undefined : Number(score));

  return (
    <Card className="submission-detail-card submission-detail-card-grading" bordered={false}>
      <div className="submission-detail-grading-head">
        <GraduationCap size={22} className="submission-detail-grading-icon" />
        <h3 className="submission-detail-grading-title">Đánh giá & Chấm điểm</h3>
      </div>

      <div className="submission-detail-grading-body">
        <label className="submission-detail-grading-label">ĐIỂM SỐ (THANG ĐIỂM {maxScore})</label>
        <div className="submission-detail-score-row">
          {showScoreReadOnly ? (
            <span className="submission-detail-score-readonly">
              {typeof scoreValue === 'number' ? scoreValue : scoreValue}
            </span>
          ) : (
            <InputNumber
              min={0}
              max={maxScore}
              step={maxScore <= 10 ? 0.25 : 1}
              value={scoreValue}
              onChange={(v) => onScoreChange(v != null ? String(v) : '')}
              placeholder={`0 - ${maxScore}`}
              className="submission-detail-input-score"
              size="large"
            />
          )}
          <span className="submission-detail-score-scale">/ {maxScore}</span>
        </div>
        {isQuiz ? (
          onPublishScore ? (
            <Button
              type="primary"
              size="large"
              icon={<Eye size={18} />}
              onClick={onPublishScore}
              loading={submitting}
              disabled={submitting}
              className="submission-detail-btn submission-detail-btn-publish"
            >
              Mở điểm cho học sinh xem
            </Button>
          ) : (
            <Button size="large" disabled className="submission-detail-btn submission-detail-btn-publish">
              Đã công bố điểm
            </Button>
          )
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<Save size={18} />}
            onClick={onSaveScore}
            loading={submitting}
            className="submission-detail-btn submission-detail-btn-save"
          >
            Lưu điểm số
          </Button>
        )}

        <label className="submission-detail-grading-label submission-detail-grading-label-feedback">
          NHẬN XÉT CỦA GIÁO VIÊN
        </label>
        <Input.TextArea
          rows={5}
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="Nhập nhận xét chi tiết để giúp học sinh tiến bộ..."
          className="submission-detail-textarea"
        />
        {onSendFeedback && (
          <Button
            type="primary"
            size="large"
            icon={<Send size={18} />}
            onClick={onSendFeedback}
            loading={submitting}
            className="submission-detail-btn submission-detail-btn-feedback"
          >
            Gửi nhận xét
          </Button>
        )}

        {!isQuiz && (
          <Button
            icon={<ArrowLeft size={18} />}
            onClick={onBack}
            className="submission-detail-btn submission-detail-btn-back"
          >
            Quay lại danh sách
          </Button>
        )}
      </div>
    </Card>
  );
}

export default GradingPanel;
