import React from 'react';

function LessonQuizContent({ quizQuestions }) {
  return (
    <div className="lesson-content-quiz">
      <h3 className="quiz-title">Câu hỏi trắc nghiệm</h3>
      {quizQuestions.length > 0 ? (
        <div className="quiz-questions">
          {quizQuestions.map((question, index) => (
            <div key={question.id || index} className="quiz-question-item">
              <div className="quiz-question-number">Câu {index + 1}</div>
              <div className="quiz-question-text">{question.question || 'Chưa có câu hỏi'}</div>
              <div className="quiz-answers">
                {question.answers && Array.isArray(question.answers) ? (
                  question.answers.map((answer, answerIndex) => (
                    <div
                      key={answerIndex}
                      className={`quiz-answer ${question.correctIndex === answerIndex ? 'correct' : ''}`}
                    >
                      <span className="quiz-answer-label">{String.fromCharCode(65 + answerIndex)}.</span>
                      <span className="quiz-answer-text">{answer || 'Chưa có đáp án'}</span>
                      {question.correctIndex === answerIndex && (
                        <span className="quiz-answer-badge">Đáp án đúng</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p>Chưa có đáp án</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="lesson-content-placeholder">Chưa có câu hỏi trắc nghiệm</p>
      )}
    </div>
  );
}

export default LessonQuizContent;
