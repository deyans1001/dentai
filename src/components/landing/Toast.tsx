"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Toast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 4000);
    const hideTimer = setTimeout(() => setVisible(false), 9000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 sm:right-6 left-4 sm:left-auto z-50 max-w-sm"
        >
          <div className="bg-dark-800 border border-white/12 rounded-xl shadow-2xl shadow-black/40 p-4 flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">🦷</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">
                Клиника в Пловдив се регистрира!
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                Преди 2 минути · Стартов план
              </p>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-slate-500 hover:text-slate-300 flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
