// src/components/PasswordFortress.jsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 5);
}

export default function PasswordFortress({ onBack, isMuted }) {
  const [password, setPassword] = useState("");
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [attackLog, setAttackLog] = useState([]);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [round, setRound] = useState(1);
  const maxRounds = 5;
  const successRef = useRef(null);
  const failRef = useRef(null);

  useEffect(() => {
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

  const checkPassword = () => {
    const strength = getStrength(password);
    const newAttackLog = [...attackLog];
    
    if (strength < 3) {
      const damage = 40 - (strength * 10);
      setHealth(h => {
        const newHealth = Math.max(0, h - damage);
        if (newHealth <= 0) {
          handleGameOver();
        }
        return newHealth;
      });
      
      newAttackLog.unshift(`🚨 Round ${round}: Weak password! Fortress took ${damage} damage`);
      
      if (!isMuted) {
        try {
          failRef.current.currentTime = 0;
          failRef.current.play().catch(console.error);
        } catch (e) {
          console.warn("Play error (fail):", e);
        }
      }
    } else {
      // Strong password - show protection animation
      setIsProtected(true);
      setTimeout(() => setIsProtected(false), 1500);
      
      newAttackLog.unshift(`✅ Round ${round}: Strong password! No damage taken`);
      
      if (!isMuted) {
        try {
          successRef.current.currentTime = 0;
          successRef.current.play().catch(console.error);
        } catch (e) {
          console.warn("Play error (success):", e);
        }
      }
    }
    
    // Check if all rounds are completed
    if (round >= maxRounds && health > 0) {
      setGameWon(true);
    } else {
      setRound(r => r + 1);
    }
    
    setAttackLog(newAttackLog.slice(0, 5));
    setPassword("");
  };

  const handleGameOver = () => {
    setIsCollapsing(true);
    setTimeout(() => {
      setGameOver(true);
      setIsCollapsing(false);
    }, 2000);
  };

  const reset = () => {
    setPassword("");
    setHealth(100);
    setGameOver(false);
    setGameWon(false);
    setAttackLog([]);
    setRound(1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-700 text-white p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-500/5 animate-float"
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
      
      <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent z-10">🏰 Password Fortress</h1>
      <p className="text-slate-300 mb-2 z-10">Defend against {maxRounds} attacks!</p>
      <p className="text-slate-400 mb-6 z-10">Round: {round}/{maxRounds}</p>

      {gameOver ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-slate-800/80 p-8 rounded-2xl border border-red-500/30 shadow-xl max-w-md w-full z-10 backdrop-blur-sm"
        >
          <p className="text-3xl font-bold mb-4 text-red-400">💀 Fortress Breached!</p>
          <p className="mb-6 text-slate-300">Your password wasn't strong enough to withstand the attack.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={reset}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-xl font-bold transition-colors"
            >
              Main Menu
            </button>
          </div>
        </motion.div>
      ) : gameWon ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-slate-800/80 p-8 rounded-2xl border border-green-500/30 shadow-xl max-w-md w-full z-10 backdrop-blur-sm"
        >
          <p className="text-3xl font-bold mb-4 text-green-400">🏆 Victory!</p>
          <p className="mb-6 text-slate-300">You successfully defended your fortress with strong passwords!</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={reset}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl font-bold transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-xl font-bold transition-colors"
            >
              Main Menu
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 p-8 rounded-2xl border border-amber-500/30 shadow-xl max-w-md w-full z-10 backdrop-blur-sm"
        >
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Fortress Health:</span>
              <span className={`font-bold ${health > 70 ? 'text-green-400' : health > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                {health}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4 mb-6 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  health > 70 ? 'bg-green-500' : health > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${health}%` }}
              />
            </div>
          </div>
          
          <AnimatePresence>
            {isCollapsing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-red-500/20 flex items-center justify-center z-20"
              >
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.2, rotate: 5 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl"
                >
                  💥
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute text-4xl font-bold text-red-500"
                >
                  COLLAPSING!
                </motion.div>
              </motion.div>
            )}
            
            {isProtected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-green-500/20 flex items-center justify-center z-20"
              >
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl"
                >
                  🛡️
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute text-3xl font-bold text-green-500"
                >
                  PROTECTED!
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-600 rounded-lg p-3 w-full mb-3 text-black focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder={`Create password for round ${round}...`}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
            />
          </div>
          
          <button
            onClick={checkPassword}
            disabled={password.length === 0}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {round === maxRounds ? "Final Defense!" : "Defend Fortress"}
          </button>
          
          <div className="mt-8">
            <h3 className="font-bold text-amber-400 mb-2">🔒 Password Tips:</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Use at least 12 characters</li>
              <li>• Mix uppercase and lowercase letters</li>
              <li>• Include numbers and special characters</li>
              <li>• Avoid common words and patterns</li>
            </ul>
          </div>
          
          {attackLog.length > 0 && (
            <div className="mt-6 p-4 bg-slate-900/70 rounded-lg">
              <h4 className="font-bold mb-2">Attack Log:</h4>
              <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                {attackLog.map((log, i) => (
                  <div key={i} className="font-mono">{log}</div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

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