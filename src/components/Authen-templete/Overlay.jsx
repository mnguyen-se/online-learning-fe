import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Overlay dùng cho Double Slide, video lấy từ public (bạn đã đặt file mp4 vào public)
export const Overlay = ({ isSignUp, toggleAuth }) => {
  const overlayVariants = {
    initial: { x: 0 },
    animate: { x: isSignUp ? '-100%' : '0%' },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.3, duration: 0.5 },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="absolute top-0 right-0 h-full w-1/2 overflow-hidden z-20 shadow-2xl"
      variants={overlayVariants}
      animate="animate"
      initial="initial"
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Nền mờ đè lên video của thẻ (video nằm trong auth-card, fill 100% thẻ) */}
      <div className="absolute inset-0 w-full h-full bg-slate-900/50 backdrop-blur-[2px]" />

      {/* Content Layer */}
      <div className="relative h-full w-full flex flex-col justify-center items-center text-white p-12 text-center">
        <AnimatePresence mode="wait">
          {isSignUp ? (
            <motion.div
              key="signup-overlay"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              className="flex flex-col items-center"
            >
              <h2 className="text-4xl font-bold mb-4">Chào mừng trở lại!</h2>
              <p className="text-lg text-slate-200 mb-[10px] font-light leading-relaxed">
                Nếu bạn đã có tài khoản, hãy đăng nhập để tiếp tục hành trình
                học tập cùng chúng tôi.
              </p>
              <button
                type="button"
                onClick={toggleAuth}
                className="min-w-[8rem] px-4 py-3 text-base border-2 border-white/70 rounded-full font-semibold text-white hover:bg-white hover:text-slate-900 transition-all duration-300 backdrop-blur-sm min-h-[2.5rem]"
              >
                Đăng nhập
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="signin-overlay"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={textVariants}
              className="flex flex-col items-center"
            >
              <h1 className="text-4xl font-bold mb-4">Xin chào bạn mới!</h1>
              <p className="text-lg text-slate-200 mb-[10px] font-light leading-relaxed">
                Đăng ký ngay để tham gia lớp học.
              </p>
              <button
                type="button"
                onClick={toggleAuth}
                className="min-w-[8rem] px-4 py-3 text-base border-2 border-white/70 rounded-full font-semibold text-white hover:bg-white hover:text-slate-900 transition-all duration-300 backdrop-blur-sm min-h-[2.5rem]"
              >
                Đăng ký
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

