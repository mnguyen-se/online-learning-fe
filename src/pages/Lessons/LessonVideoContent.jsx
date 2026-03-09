import React from 'react';

const toEmbedVideoUrl = (videoSource) => {
  if (!videoSource) return '';
  if (videoSource.includes('youtube.com/watch') || videoSource.includes('youtu.be/')) {
    const videoId = videoSource.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  return videoSource;
};

function LessonVideoContent({ title, videoSource }) {
  const embedUrl = toEmbedVideoUrl(videoSource);
  return (
    <div className="lesson-content-video">
      {embedUrl ? (
        <iframe
          width="100%"
          height="500"
          src={embedUrl}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={title}
        />
      ) : (
        <div className="lesson-empty-state">
          <div className="lesson-empty-icon">📹</div>
          <h4 className="lesson-empty-title">Bài học chưa có video</h4>
          <p className="lesson-empty-desc">Video sẽ được cập nhật sau.</p>
        </div>
      )}
    </div>
  );
}

export default LessonVideoContent;
