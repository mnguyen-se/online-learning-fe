import React from 'react';
import { Card, Button, Input, InputNumber } from 'antd';
import { ArrowLeft, Save, Send, GraduationCap } from 'lucide-react';
import './SubmissionDetail.css';

/**
 * Panel chấm điểm (cột phải): Điểm số (thang 10), Lưu điểm số, Nhận xét giáo viên, Gửi nhận xét, Quay lại danh sách.
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
}) {
  return (
    <Card className="submission-detail-card submission-detail-card-grading" bordered={false}>
      <div className="submission-detail-grading-head">
        <GraduationCap size={22} className="submission-detail-grading-icon" />
        <h3 className="submission-detail-grading-title">Đánh giá & Chấm điểm</h3>
      </div>

      <div className="submission-detail-grading-body">
        <label className="submission-detail-grading-label">ĐIỂM SỐ (THANG ĐIỂM {maxScore})</label>
        <div className="submission-detail-score-row">
          <InputNumber
            min={0}
            max={maxScore}
            step={maxScore <= 10 ? 0.25 : 1}
            value={score === '' ? undefined : Number(score)}
            onChange={(v) => onScoreChange(v != null ? String(v) : '')}
            placeholder={`0 - ${maxScore}`}
            className="submission-detail-input-score"
            size="large"
          />
          <span className="submission-detail-score-scale">/ {maxScore}</span>
        </div>
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

        <Button
          icon={<ArrowLeft size={18} />}
          onClick={onBack}
          className="submission-detail-btn submission-detail-btn-back"
        >
          Quay lại danh sách
        </Button>
      </div>
    </Card>
  );
}

export default GradingPanel;
