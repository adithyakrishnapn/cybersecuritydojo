// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import PhishingHunter from "./components/PhishingHunter";
import PasswordFortress from "./components/PasswordFortress";
import CyberRunner from "./components/CyberRunner"; // Import the CyberRunner component

export default function App() {
  const [game, setGame] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const backgroundMusicRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(true);
  const [isBooting, setIsBooting] = useState(true);
  const preloaderMusicRef = useRef(null);

  useEffect(() => {
    // Initialize background music
    if (typeof Audio !== "undefined") {
      backgroundMusicRef.current = new Audio("/background-music.mp3");
      backgroundMusicRef.current.volume = 0.4;
      backgroundMusicRef.current.loop = true;
      // Preloader music (short loop)
      preloaderMusicRef.current = new Audio("/success.mp3");
      preloaderMusicRef.current.volume = 0.35;
      preloaderMusicRef.current.loop = true;
      
      // Try to play music when user interacts
      const tryPlayMusic = () => {
        if (!isMuted && !isPlaying) {
          backgroundMusicRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.log("Audio play failed:", err);
            });
        }
        // Don't auto-play preloader music during boot - wait for explicit user interaction
      };
      
      // Don't auto-play audio on initial load - wait for user interaction
      
      // Add event listener for user interaction
      document.addEventListener('click', tryPlayMusic, { once: true });
      
      return () => {
        document.removeEventListener('click', tryPlayMusic);
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.pause();
        }
        if (preloaderMusicRef.current) {
          preloaderMusicRef.current.pause();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (backgroundMusicRef.current) {
      if (isMuted) {
        backgroundMusicRef.current.pause();
        setIsPlaying(false);
      } else {
        backgroundMusicRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.log("Audio play failed:", err);
          });
      }
    }
    if (preloaderMusicRef.current) {
      if (isMuted) {
        preloaderMusicRef.current.pause();
      }
      // Remove auto-play of preloader music - only play on user click
    }
  }, [isMuted]);

  // Simulate a short boot/preload
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
      try {
        if (preloaderMusicRef.current) {
          preloaderMusicRef.current.pause();
          preloaderMusicRef.current.currentTime = 0;
        }
      } catch (e) {}
    }, 2200);
    return () => clearTimeout(timer);
  }, []);
  // Preloader screen
  if (isBooting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-cyan-400/10 animate-float"
              style={{
                width: Math.random() * 60 + 10 + 'px',
                height: Math.random() * 60 + 10 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 10 + 10 + 's'
              }}
            />
          ))}
        </div>
        <div className="z-10 text-center">
          <div className="mx-auto mb-6 w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-2xl font-bold">Your gaming platform is loading…</div>
          <div className="text-slate-300 mt-2">Initializing assets and audio</div>
          <div className="mt-6 text-cyan-300 text-sm tracking-widest animate-pulse">PRESS ANYWHERE TO ENABLE SOUND</div>
        </div>
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
            100% { transform: translateY(0) rotate(0deg); }
          }
          .animate-float { animation: float 10s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  if (game === "phishing") return <PhishingHunter onBack={() => {
    setGame(null);
    if (backgroundMusicRef.current && !isMuted) {
      backgroundMusicRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Audio play failed:", err));
    }
  }} isMuted={isMuted} onGameStart={() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      setIsPlaying(false);
    }
  }} />;
  if (game === "password") return <PasswordFortress onBack={() => {
    setGame(null);
    if (backgroundMusicRef.current && !isMuted) {
      backgroundMusicRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Audio play failed:", err));
    }
  }} isMuted={isMuted} onGameStart={() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      setIsPlaying(false);
    }
  }} />;
  if (game === "cyberrunner") return <CyberRunner onBack={() => {
    setGame(null);
    if (backgroundMusicRef.current && !isMuted) {
      backgroundMusicRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Audio play failed:", err));
    }
  }} isMuted={isMuted} onGameStart={() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      setIsPlaying(false);
    }
  }} />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-500/10 animate-float"
            style={{
              width: Math.random() * 50 + 10 + 'px',
              height: Math.random() * 50 + 10 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>
      
      {/* Mute Button */}
      <button 
        onClick={() => {
          if (isMuted) {
            // Unmuting - try to start audio
            setIsMuted(false);
            if (backgroundMusicRef.current && !game) {
              backgroundMusicRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setNeedsAudioUnlock(false);
                })
                .catch(err => console.log("Audio play failed:", err));
            }
          } else {
            // Muting - stop audio
            setIsMuted(true);
          }
        }}
        className="absolute top-4 right-4 p-3 bg-slate-700/70 hover:bg-slate-600 rounded-full transition-colors z-10"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "🔇" : needsAudioUnlock ? "🔈" : "🔊"}
      </button>
      
      <div className="text-center max-w-4xl z-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          🛡️ Cyber Security Dojo
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl text-slate-300 mb-10 max-w-md mx-auto"
        >
          Level up your cybersecurity skills through interactive games
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-slate-800/60 p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all hover:scale-105 cursor-pointer shadow-lg"
            onClick={() => setGame("phishing")}
          >
            <div className="text-5xl mb-4">🐟</div>
            <h2 className="text-2xl font-bold mb-2">Phishing Hunter</h2>
            <p className="text-slate-400 mb-4">Identify suspicious links before they steal your data!</p>
            <div className="mt-4 text-cyan-400 font-semibold text-sm">Learn: URL analysis • Domain recognition</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-slate-800/60 p-6 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all hover:scale-105 cursor-pointer shadow-lg"
            onClick={() => setGame("password")}
          >
            <div className="text-5xl mb-4">🏰</div>
            <h2 className="text-2xl font-bold mb-2">Password Fortress</h2>
            <p className="text-slate-400 mb-4">Defend against attacks with strong password creation!</p>
            <div className="mt-4 text-amber-400 font-semibold text-sm">Learn: Password strength • Security principles</div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-slate-800/60 p-6 rounded-2xl border border-purple-500/30 hover:border-purple-500/60 transition-all hover:scale-105 cursor-pointer shadow-lg"
            onClick={() => setGame("cyberrunner")}
          >
            <div className="text-5xl mb-4">🏃‍♂️</div>
            <h2 className="text-2xl font-bold mb-2">Cyber Runner</h2>
            <p className="text-slate-400 mb-4">Jump over threats and collect security items in this platformer!</p>
            <div className="mt-4 text-purple-400 font-semibold text-sm">Learn: Threat recognition • Security tools</div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 max-w-2xl mx-auto backdrop-blur-sm"
        >
          <h3 className="text-xl font-bold mb-4">🎯 Why Cybersecurity Matters</h3>
          <p className="text-slate-300">
            Every 39 seconds, there's a cyber attack. These games teach practical skills to protect yourself online.
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}