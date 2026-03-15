import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, Bot } from "lucide-react";
import Header from "../../components/Header/header";
import { runWithRetry } from "../../api/requestRetry";
import { getAiLessonQuiz } from "../../api/lessionApi";
import "./LessonsView.css";

function AiQuizPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef(null);

  const handleReturnToCourse = () => {
    navigate(`/course/${courseId}/learn/${lessonId}`);
  };

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
        // Ignore iframe access DOMException when not yet ready
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
          <div 
            className="lesson-quiz-loading"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              paddingTop: "80px", // space for the fixed header
              gap: "1rem",
              color: "#4f46e5", // Indigo color for AI
            }}
          >
            <div style={{ position: "relative" }}>
               <Bot size={64} style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
               <Sparkles size={32} style={{ position: "absolute", top: -10, right: -15, color: "#f59e0b", animation: "bounce 1s infinite" }} />
            </div>
            <div style={{
              fontSize: "1.4rem", 
              fontWeight: "600",
              textAlign: "center",
              background: "linear-gradient(90deg, #4f46e5, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              AI đang tạo câu hỏi, cậu chờ chút nha.......
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="lesson-quiz-error">{error}</div>
        )}
        {html && !loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <iframe
              title="AI Quiz Practice"
              className="lesson-quiz-iframe ai-quiz-iframe-full"
              srcDoc={html}
              style={{ flex: 1, border: 'none' }}
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
            />
            <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <button 
                onClick={handleReturnToCourse}
                className="lesson-complete-btn"
                style={{ cursor: 'pointer', padding: '10px 20px', fontSize: '16px' }}
              >
                Quay về khóa học của tôi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AiQuizPage;

