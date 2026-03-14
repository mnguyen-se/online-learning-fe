import React from 'react';

function getEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
  if (u.includes('youtube.com/embed/')) return u.split('?')[0];
  return null;
}

function isYoutube(url) {
  return /youtube\.com|youtu\.be/.test(url || '');
}

/** Chuẩn hóa textContent từ API (có thể trả về text_content hoặc textContent) */
function getLessonTextContent(lesson) {
  if (!lesson) return '';
  const raw = lesson.textContent ?? lesson.text_content ?? lesson.content ?? '';
  const s = typeof raw === 'string' ? raw : String(raw ?? '');
  return s.trim();
}

function CourseVideoPlayer({ lesson }) {
  const videoUrl = (lesson?.videoUrl ?? lesson?.video_url ?? lesson?.contentUrl ?? '').trim();
  const title = lesson?.title || 'Bài học';
  const textContent = getLessonTextContent(lesson);
  const hasVideo = videoUrl.length > 0;
  const hasText = textContent.length > 0;

  if (!lesson) {
    return (
      <div className="tcd-video-placeholder">
        <p>Chọn một bài học bên phải để xem video.</p>
      </div>
    );
  }

  if (hasVideo && isYoutube(videoUrl)) {
    const embedUrl = getEmbedUrl(videoUrl);
    if (embedUrl) {
      return (
        <div className="tcd-video-wrap">
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="tcd-video-iframe"
          />
        </div>
      );
    }
  }

  if (hasVideo && (videoUrl.endsWith('.mp4') || videoUrl.includes('mp4'))) {
    return (
      <div className="tcd-video-wrap">
        <video src={videoUrl} controls className="tcd-video-el" title={title}>
          Trình duyệt không hỗ trợ video.
        </video>
      </div>
    );
  }

  if (hasText) {
    return (
      <div className="tcd-reading-container">
        <div
          className="tcd-reading-content"
          dangerouslySetInnerHTML={{
            __html: textContent.replace(/\n/g, '<br />'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="tcd-video-placeholder">
      <p>Chưa có nội dung cho bài học.</p>
    </div>
  );
}

export default CourseVideoPlayer;
