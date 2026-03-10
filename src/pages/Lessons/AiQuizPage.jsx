import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header/header";
import { runWithRetry } from "../../api/requestRetry";
import { getAiLessonQuiz } from "../../api/lessionApi";
import "./LessonsView.css";

function AiQuizPage() {
  const { courseId, lessonId } = useParams();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return;
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError("");
        setHtml("");
        const res = await runWithRetry(() => getAiLessonQuiz(lessonId), {
          retries: 0,
          baseDelayMs: 500,
        });
        setHtml(typeof res === "string" ? res : "");
      } catch (e) {
        const message =
          e?.response?.data?.message ||
          "Không thể tải quiz cho bài học này.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (!html || loading || error) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const applyCompactTopSpacing = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        const body = doc.body;
        if (body) {
          body.style.paddingTop = "8px";
          body.style.marginTop = "0";
        }
        const container = doc.querySelector(".container");
        if (container) {
          container.style.marginTop = "0";
        }
      } catch {
      }
    };

    if (iframe.contentDocument?.readyState === "complete") {
      applyCompactTopSpacing();
    } else {
      iframe.addEventListener("load", applyCompactTopSpacing, { once: true });
    }
  }, [html, loading, error]);

  return (
    <div className="lessons-page ai-quiz-page">
      <Header />
      <div className="lessons-view-container ai-quiz-container">
        {loading && (
          <div className="lesson-quiz-loading">
            AI đang tạo quiz cho bài học này...
          </div>
        )}
        {error && !loading && (
          <div className="lesson-quiz-error">{error}</div>
        )}
        {html && !loading && !error && (
          <iframe
            title="AI Quiz Practice"
            className="lesson-quiz-iframe ai-quiz-iframe-full"
            srcDoc={html}
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

export default AiQuizPage;

