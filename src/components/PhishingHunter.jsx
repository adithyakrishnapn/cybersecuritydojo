// src/components/PhishingHunter.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_LINKS = [
  { text: "paypal-login.com", isPhish: true },
  { text: "google.com", isPhish: false },
  { text: "amaz0n-support.net", isPhish: true },
  { text: "microsoft.com", isPhish: false },
  { text: "bank-secure-login.net", isPhish: true },
  { text: "github.com", isPhish: false },
  { text: "netflix-premium-offer.ru", isPhish: true },
  { text: "apple.com", isPhish: false },
  { text: "facebook-security-alert.xyz", isPhish: true },
  { text: "twitter.com", isPhish: false },
];

const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

export default function PhishingHunter({ onBack, isMuted }) {
  const [links, setLinks] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const successRef = useRef(null);
  const failRef = useRef(null);

  // init links + audio once
  useEffect(() => {
    setLinks(shuffle(SAMPLE_LINKS));
    try {
      if (typeof Audio !== "undefined") {
        successRef.current = new Audio("/success.mp3");
        failRef.current = new Audio("/fail.mp3");
        successRef.current.volume = 0.7;
        failRef.current.volume = 0.7;
      }
    } catch (err) {
      console.warn("Audio init failed:", err);
    }
  }, []);

  // game over conditions
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
    } else if (links.length === 0 && lives > 0) {
      setGameOver(true);
    }
  }, [lives, links]);

  const handleClick = (index) => {
    // Create a copy of the current links array
    const clicked = links[index];
    console.log("Clicked:", clicked);

    if (!clicked) return;

    if (clicked.isPhish) {
      // Correct choice - phishing link
      setScore((s) => s + 1);
      setCombo((c) => {
        const newCombo = c + 1;
        if (newCombo > maxCombo) setMaxCombo(newCombo);
        return newCombo;
      });
      if (!isMuted) {
        try {
          successRef.current.currentTime = 0;
          successRef.current.play().catch(console.error);
        } catch (e) {
          console.warn("Play error (success):", e);
        }
      }
    } else {
      // Wrong choice - legitimate link
      // FIXED: This was reducing lives by 2 instead of 1
      setLives((l) => l - 1); // Now reduces by 1 only
      setCombo(0);
      if (!isMuted) {
        try {
          failRef.current.currentTime = 0;
          failRef.current.play().catch(console.error);
        } catch (e) {
          console.warn("Play error (fail):", e);
        }
      }
    }

    // Remove the clicked link from the list
    setLinks(prevLinks => prevLinks.filter((_, i) => i !== index));
  };

  const reset = () => {
    setLinks(shuffle(SAMPLE_LINKS));
    setScore(0);
    setLives(3);
    setGameOver(false);
    setCombo(0);
    setMaxCombo(0);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-blue-900 text-white p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-500/10 animate-float"
            style={{
              width: Math.random() * 40 + 10 + 'px',
              height: Math.random() * 40 + 10 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>
      
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/70 hover:bg-slate-600 rounded-lg transition-colors z-10"
      >
        ← Back
      </button>
      
      <div className="w-full max-w-xl z-10">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">🐟 Phishing Hunter</h1>
          <p className="text-slate-300 mt-2">Click only suspicious links — you have {lives} lives!</p>
        </header>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-blue-500/30 shadow-lg backdrop-blur-sm">
          {gameOver ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-3xl font-bold">{lives > 0 ? "🎉 You Win!" : "💀 Game Over!"}</div>
              <div className="text-slate-200 text-lg">Final Score: <span className="font-semibold text-cyan-400">{score}</span></div>
              <div className="text-slate-200">Max Combo: <span className="font-semibold text-yellow-400">{maxCombo}</span></div>
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={reset} className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold transition-colors">
                  Play Again
                </button>
                <button onClick={onBack} className="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold transition-colors">
                  Main Menu
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 p-4 bg-slate-900/50 rounded-xl">
                <div className="text-lg">
                  Lives: <span className="font-semibold text-rose-400 text-xl">{'❤️'.repeat(lives)}</span>
                </div>
                <div className="text-lg">
                  Score: <span className="font-semibold text-cyan-400 text-xl">{score}</span>
                </div>
                {combo > 1 && (
                  <motion.div 
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="text-lg"
                  >
                    Combo: <span className="font-semibold text-yellow-400 text-xl">{combo}x!</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <AnimatePresence>
                  {links.map((link, idx) => (
                    <motion.button
                      key={link.text + "-" + idx}
                      onClick={() => handleClick(idx)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="w-full text-left px-5 py-4 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-lg">{link.text}</div>
                        <div className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">click to inspect</div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700">
                <h3 className="font-bold text-cyan-400 mb-2">💡 Cybersecurity Tip:</h3>
                <p className="text-sm text-slate-300">
                  Look for misspellings, unusual domains, and urgency in messages. Legitimate companies rarely use hyphens in their domain names.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}