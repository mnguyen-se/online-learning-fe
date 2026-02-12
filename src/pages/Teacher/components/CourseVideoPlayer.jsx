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

function CourseVideoPlayer({ lesson }) {
  const videoUrl = lesson?.videoUrl || lesson?.contentUrl || '';
  const title = lesson?.title || 'Bài học';

  if (!lesson) {
    return (
      <div className="tcd-video-placeholder">
        <p>Chọn một bài học bên phải để xem video.</p>
      </div>
    );
  }

  if (isYoutube(videoUrl)) {
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

  if (videoUrl && (videoUrl.endsWith('.mp4') || videoUrl.includes('mp4'))) {
    return (
      <div className="tcd-video-wrap">
        <video src={videoUrl} controls className="tcd-video-el" title={title}>
          Trình duyệt không hỗ trợ video.
        </video>
      </div>
    );
  }

  return (
    <div className="tcd-video-placeholder">
      <p>Chưa có video cho bài này.</p>
    </div>
  );
}

export default CourseVideoPlayer;
