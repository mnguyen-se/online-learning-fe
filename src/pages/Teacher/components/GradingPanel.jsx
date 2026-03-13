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
  /** Cho phép truyền loading riêng cho nút điểm (ưu tiên hơn submitting nếu có) */
  scoreLoading,
  /** Cho phép truyền loading riêng cho nút gửi nhận xét (ưu tiên hơn submitting nếu có) */
  feedbackLoading,
  /** Disable cố định nút điểm (ví dụ sau khi đã công bố/hiển thị 1 lần) */
  scoreDisabled = false,
  /** Disable cố định nút gửi nhận xét (ví dụ sau khi đã gửi 1 lần) */
  feedbackDisabled = false,
  /** Quiz: true = điểm tự động theo BE, chỉ nút công bố điểm */
  isQuiz = false,
  /** Quiz: điểm hiển thị (đã chấm từ BE hoặc tính từ đáp án) */
  displayScore = null,
  /** Quiz: gọi khi bấm "Mở điểm cho học sinh xem" */
  onPublishScore,
}) {
  const showScoreReadOnly = isQuiz && (displayScore != null || onPublishScore != null);
  const scoreValue = showScoreReadOnly ? (displayScore ?? '—') : (score === '' ? undefined : Number(score));
  const effectiveScoreLoading =
    typeof scoreLoading === 'boolean'
      ? scoreLoading
      : submitting;
  const effectiveFeedbackLoading =
    typeof feedbackLoading === 'boolean'
      ? feedbackLoading
      : submitting;

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
          <Button
            type="primary"
            size="large"
            icon={<Eye size={18} />}
            onClick={onPublishScore}
            loading={effectiveScoreLoading}
            disabled={effectiveScoreLoading || scoreDisabled}
            className="submission-detail-btn submission-detail-btn-publish"
          >
            Mở điểm cho học sinh xem
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            icon={<Eye size={18} />}
            onClick={onSaveScore}
            loading={effectiveScoreLoading}
            disabled={effectiveScoreLoading || scoreDisabled}
            className="submission-detail-btn submission-detail-btn-save"
          >
            Hiển thị điểm cho học sinh
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
            loading={effectiveFeedbackLoading}
            disabled={effectiveFeedbackLoading || feedbackDisabled}
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
