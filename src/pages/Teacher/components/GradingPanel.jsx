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
  maxScore = 100,
  calculatedScore,
  score,
  onScoreChange,
  feedback,
  onFeedbackChange,
  onSaveScore,
  onSendFeedback,
  onBack,
  submitting = false,
  scoreLoading,
  feedbackLoading,
  scoreDisabled = false,
  feedbackDisabled = false,
  isQuiz = false,
  displayScore = null,
  onPublishScore,
}) {
  const showScoreReadOnly = isQuiz && (displayScore != null || onPublishScore != null);
  const useCalculatedScore = calculatedScore !== undefined && calculatedScore !== null;
  const scoreValue = showScoreReadOnly 
    ? (displayScore ?? '—') 
    : useCalculatedScore 
      ? calculatedScore 
      : (score === '' ? undefined : Number(score));
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
          {showScoreReadOnly || useCalculatedScore ? (
            <span className="submission-detail-score-readonly">
              {typeof scoreValue === 'number' ? scoreValue.toFixed(2) : scoreValue}
            </span>
          ) : (
            <InputNumber
              min={0}
              max={maxScore}
              step={maxScore <= 10 ? 0.25 : 1}
              value={scoreValue}
              onChange={(v) => onScoreChange && onScoreChange(v != null ? String(v) : '')}
              placeholder={`0 - ${maxScore}`}
              className="submission-detail-input-score"
              size="large"
            />
          )}
          <span className="submission-detail-score-scale">/ {maxScore}</span>
        </div>

        <label className="submission-detail-grading-label submission-detail-grading-label-feedback">
          NHẬN XÉT CỦA GIÁO VIÊN
        </label>
        <Input.TextArea
          rows={5}
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          placeholder="Nhập nhận xét chi tiết để giúp học sinh tiến bộ..."
          className="submission-detail-textarea"
          disabled={feedbackDisabled}
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
