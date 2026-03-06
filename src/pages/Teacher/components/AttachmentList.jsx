import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import './SubmissionDetail.css';

const getFileBadge = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return { label: 'PDF', className: 'submission-detail-file-badge-pdf' };
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return { label: 'DOCX', className: 'submission-detail-file-badge-docx' };
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return { label: 'XLSX', className: 'submission-detail-file-badge-xlsx' };
  return { label: 'FILE', className: 'submission-detail-file-badge-default' };
};

const formatSize = (size) => {
  if (size == null) return null;
  if (typeof size === 'number') return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return size;
};

/**
 * Danh sách tệp đính kèm – card "TỆP ĐÍNH KÈM", mỗi file: badge (PDF/DOCX), tên, dung lượng, icon tải/xóa.
 */
function AttachmentList({ attachments = [], onDelete }) {
  const list = Array.isArray(attachments) ? attachments : [];

  if (list.length === 0) return null;

  return (
    <div className="submission-detail-card submission-detail-card-attachments">
      <h3 className="submission-detail-section-title">TỆP ĐÍNH KÈM</h3>
      <div className="submission-detail-attachment-grid">
        {list.map((file, idx) => {
          const name = file.name ?? file.fileName ?? file.filename ?? `Tệp ${idx + 1}`;
          const size = formatSize(file.size ?? file.fileSize);
          const url = file.url ?? file.downloadUrl ?? file.link;
          const badge = getFileBadge(name);
          return (
            <div key={idx} className="submission-detail-attachment-item">
              <span className={`submission-detail-file-badge ${badge.className}`}>{badge.label}</span>
              <div className="submission-detail-attachment-info">
                <span className="submission-detail-attachment-name">{name}</span>
                {size != null && <span className="submission-detail-attachment-size">{size}</span>}
              </div>
              <div className="submission-detail-attachment-actions">
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="submission-detail-attachment-btn" title="Tải xuống">
                    <Download size={18} />
                  </a>
                )}
                {typeof onDelete === 'function' && (
                  <button
                    type="button"
                    className="submission-detail-attachment-btn submission-detail-attachment-btn-delete"
                    onClick={() => onDelete(file, idx)}
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AttachmentList;
