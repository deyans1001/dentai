"use client";

import { useConversation } from "@11labs/react";
import { useCallback, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceAgentProps {
  agentId: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VoiceAgent({ agentId }: VoiceAgentProps) {
  const [callSeconds, setCallSeconds] = useState(0);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      const interval = setInterval(() => setCallSeconds((s) => s + 1), 1000);
      setTimerRef(interval);
    },
    onDisconnect: () => {
      if (timerRef) clearInterval(timerRef);
      setCallSeconds(0);
      setTimerRef(null);
    },
    onError: (err) => {
      console.error("ElevenLabs error:", err);
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  const startCall = useCallback(async () => {
    setPermissionError(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermissionError(true);
      return;
    }
    await conversation.startSession({ agentId });
  }, [conversation, agentId]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(() => {
    conversation.setVolume({ volume: conversation.isSpeaking ? 0 : 1 });
  }, [conversation]);

  return (
    <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden" style={{ height: 420 }}>
      <AnimatePresence mode="wait">
        {!isConnected && !isConnecting ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full p-8 text-center"
          >
            {/* Анимиран телефон */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                <Phone className="text-brand-green" size={36} />
              </div>
              {/* Пулсиращи кръгове */}
              <span className="absolute inset-0 rounded-2xl border border-green-500/40 animate-ping" />
            </div>

            <h3 className="text-xl font-heading font-bold text-white mb-2">
              AI Рецепционист — Ива
            </h3>
            <p className="text-slate-400 text-sm mb-2 max-w-xs">
              Реален AI глас на български. Говори директно с рецепциониста.
            </p>

            <div className="flex items-center gap-4 mb-6 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                ~100ms латентност
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                Естествен глас
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Български
              </span>
            </div>

            {permissionError && (
              <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs max-w-xs">
                Моля, разрешете достъп до микрофона за да говорите с Ива.
              </div>
            )}

            <button
              onClick={startCall}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-brand-green hover:bg-green-500 text-white font-bold text-base transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95"
            >
              <Phone size={20} />
              Обади се на Ива
            </button>
            <p className="text-xs text-slate-600 mt-3">Нужен е микрофон</p>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-green-500/10 border-b border-green-500/20">
              <div className="flex items-center gap-2.5">
                {isConnecting ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-400 font-semibold text-sm">Свързване...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
                    <span className="text-brand-green font-semibold text-sm">В разговор с Ива</span>
                  </>
                )}
              </div>
              {isConnected && (
                <span className="text-brand-green font-mono text-sm font-bold">
                  {formatTime(callSeconds)}
                </span>
              )}
            </div>

            {/* Visual area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
              {/* Avatar + speaking indicator */}
              <div className="relative">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all duration-300 ${
                  conversation.isSpeaking
                    ? "bg-gradient-to-br from-brand-green/30 to-cyan-500/30 border-2 border-brand-green shadow-lg shadow-green-500/30"
                    : "bg-dark-700 border-2 border-white/10"
                }`}>
                  🦷
                </div>
                {/* Sound waves when speaking */}
                {conversation.isSpeaking && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-brand-green/40 animate-ping" />
                    <span className="absolute -inset-3 rounded-full border border-brand-green/20 animate-ping" style={{ animationDelay: "150ms" }} />
                  </>
                )}
              </div>

              <div className="text-center">
                <p className="text-white font-semibold text-lg">
                  {isConnecting
                    ? "Свързване с Ива..."
                    : conversation.isSpeaking
                    ? "Ива говори..."
                    : "Ива слуша"}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {isConnecting
                    ? "Моля, изчакайте"
                    : "Говорете на глас — тя чува всичко"}
                </p>
              </div>

              {/* Sound bars animation when speaking */}
              {conversation.isSpeaking && (
                <div className="flex items-end gap-1 h-8">
                  {[3, 5, 7, 5, 8, 4, 6, 3, 7, 5].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-brand-green rounded-full animate-pulse"
                      style={{
                        height: `${h * 3}px`,
                        animationDelay: `${i * 80}ms`,
                        animationDuration: `${400 + i * 60}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-center gap-4">
              <button
                onClick={toggleMute}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 rounded-full bg-dark-700 border border-white/10 flex items-center justify-center group-hover:bg-dark-600 transition-colors">
                  {conversation.isSpeaking ? (
                    <Volume2 size={20} className="text-slate-300" />
                  ) : (
                    <VolumeX size={20} className="text-slate-500" />
                  )}
                </div>
                <span className="text-xs text-slate-600">Звук</span>
              </button>

              <button
                onClick={endCall}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all group-hover:scale-105 active:scale-95">
                  <PhoneOff size={24} className="text-white" />
                </div>
                <span className="text-xs text-slate-500">Затвори</span>
              </button>

              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-dark-700 border border-white/10 flex items-center justify-center">
                  {isConnected ? (
                    <Mic size={20} className="text-brand-green" />
                  ) : (
                    <MicOff size={20} className="text-slate-500" />
                  )}
                </div>
                <span className="text-xs text-slate-600">Микрофон</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
