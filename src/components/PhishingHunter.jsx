// src/components/PhishingHunter.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePhishingLinks, generateEducationalContent } from "../utils/geminiClient";

const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

export default function PhishingHunter({ onBack, isMuted, onGameStart }) {
  const [links, setLinks] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [educationalContent, setEducationalContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [totalPhishingLinks, setTotalPhishingLinks] = useState(0);
  const [phishingLinksFound, setPhishingLinksFound] = useState(0);
  const successRef = useRef(null);
  const failRef = useRef(null);
  const victoryRef = useRef(null);
  const defeatRef = useRef(null);

  // Stop any playing SFX when leaving this screen
  useEffect(() => {
    return () => {
      try {
        [successRef, failRef, victoryRef, defeatRef].forEach(ref => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        });
      } catch (e) {}
    };
  }, []);

  // Call onGameStart when component mounts
  useEffect(() => {
    if (onGameStart) {
      onGameStart();
    }
  }, [onGameStart]);

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      setIsLoading(true);
      try {
        const generatedLinks = await generatePhishingLinks(12);
        const shuffledLinks = shuffle(generatedLinks);
        const initialLinks = shuffledLinks.slice(0, 8);
        const phishingCount = initialLinks.filter(link => link.isPhish).length;
        
        setAllLinks(shuffledLinks);
        setLinks(initialLinks);
        setTotalPhishingLinks(phishingCount);
        
        try {
          if (typeof Audio !== "undefined") {
            successRef.current = new Audio("/success.mp3");
            failRef.current = new Audio("/fail.mp3");
            victoryRef.current = new Audio("/victory.mp3");
            defeatRef.current = new Audio("/defeat.mp3");
            successRef.current.volume = 0.7;
            failRef.current.volume = 0.7;
            victoryRef.current.volume = 0.8;
            defeatRef.current.volume = 0.8;
          }
        } catch (err) {
          console.warn("Audio init failed:", err);
        }
      } catch (error) {
        console.error("Error initializing game:", error);
        // Fallback to default links
        const fallbackLinks = [
          { text: "paypal-login.com", isPhish: true, explanation: "Typosquatting - mimics PayPal but wrong domain" },
          { text: "google.com", isPhish: false, explanation: "Legitimate Google domain" },
          { text: "amaz0n-support.net", isPhish: true, explanation: 'Uses "0" instead of "o" and wrong TLD' },
          { text: "microsoft.com", isPhish: false, explanation: "Legitimate Microsoft domain" },
          { text: "bank-secure-login.net", isPhish: true, explanation: "Attempts to mimic bank login with suspicious TLD" },
          { text: "github.com", isPhish: false, explanation: "Legitimate GitHub domain" },
          { text: "apple-verify-account.com", isPhish: true, explanation: "Uses brand name with hyphens for phishing" },
          { text: "netflix.com", isPhish: false, explanation: "Legitimate Netflix domain" },
          { text: "facebook-secure-login.net", isPhish: true, explanation: "Fake Facebook login page" },
          { text: "twitter.com", isPhish: false, explanation: "Legitimate Twitter domain" },
          { text: "whatsapp-verify.com", isPhish: true, explanation: "Phishing site pretending to be WhatsApp" },
          { text: "instagram.com", isPhish: false, explanation: "Legitimate Instagram domain" }
        ];
        const shuffledFallback = shuffle(fallbackLinks);
        const initialFallback = shuffledFallback.slice(0, 8);
        const phishingCount = initialFallback.filter(link => link.isPhish).length;
        
        setAllLinks(shuffledFallback);
        setLinks(initialFallback);
        setTotalPhishingLinks(phishingCount);
      } finally {
        setIsLoading(false);
      }
    };

    initGame();
  }, []);

  // game over conditions
  useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      // Play defeat music
      if (!isMuted && defeatRef.current) {
        try {
          defeatRef.current.currentTime = 0;
          defeatRef.current.play().catch(console.error);
        } catch (e) {
          console.warn("Play error (defeat):", e);
        }
      }
    } else if (phishingLinksFound >= totalPhishingLinks && totalPhishingLinks > 0) {
      setGameWon(true);
      setGameOver(true);
      // Play victory music
      if (!isMuted && victoryRef.current) {
        try {
          victoryRef.current.currentTime = 0;
          victoryRef.current.play().catch(console.error);
        } catch (e) {
          console.warn("Play error (victory):", e);
        }
      }
    }
  }, [lives, phishingLinksFound, totalPhishingLinks, isMuted]);

  // Generate educational content when game ends
  useEffect(() => {
    if (gameOver) {
      const generateContent = async () => {
        const content = await generateEducationalContent("phishing", score, links.length + (3 - lives));
        // Clean HTML content by removing markdown code blocks
        const cleanContent = content.replace(/```html|```/g, '').trim();
        setEducationalContent(cleanContent);
      };
      generateContent();
    }
  }, [gameOver, score, lives]);

  const handleClick = (index) => {
    const clicked = links[index];
    console.log("Clicked:", clicked);

    if (!clicked) return;

    if (clicked.isPhish) {
      setScore((s) => s + 1);
      setPhishingLinksFound((p) => p + 1);
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
      setLives((l) => l - 1);
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

    // Replace the clicked link with a new one from the pool
    const remainingLinks = allLinks.filter(link => !links.includes(link));
    
    if (remainingLinks.length > 0) {
      const newLink = remainingLinks[0];
      const newLinks = [...links];
      newLinks[index] = newLink;
      setLinks(newLinks);
      
      // Remove the used link from the pool
      setAllLinks(prev => prev.filter(link => link !== newLink));
    } else {
      // If no more links, just remove the clicked one
      setLinks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const reset = async () => {
    setIsLoading(true);
    try {
      const generatedLinks = await generatePhishingLinks(12);
      const shuffledLinks = shuffle(generatedLinks);
      const initialLinks = shuffledLinks.slice(0, 8);
      const phishingCount = initialLinks.filter(link => link.isPhish).length;
      
      setAllLinks(shuffledLinks);
      setLinks(initialLinks);
      setTotalPhishingLinks(phishingCount);
    } catch (error) {
      console.error("Error resetting game:", error);
      // Fallback to default links
      const fallbackLinks = [
        { text: "paypal-login.com", isPhish: true, explanation: "Typosquatting - mimics PayPal but wrong domain" },
        { text: "google.com", isPhish: false, explanation: "Legitimate Google domain" },
        { text: "amaz0n-support.net", isPhish: true, explanation: 'Uses "0" instead of "o" and wrong TLD' },
        { text: "microsoft.com", isPhish: false, explanation: "Legitimate Microsoft domain" },
        { text: "bank-secure-login.net", isPhish: true, explanation: "Attempts to mimic bank login with suspicious TLD" },
        { text: "github.com", isPhish: false, explanation: "Legitimate GitHub domain" },
        { text: "apple-verify-account.com", isPhish: true, explanation: "Uses brand name with hyphens for phishing" },
        { text: "netflix.com", isPhish: false, explanation: "Legitimate Netflix domain" },
        { text: "facebook-secure-login.net", isPhish: true, explanation: "Fake Facebook login page" },
        { text: "twitter.com", isPhish: false, explanation: "Legitimate Twitter domain" },
        { text: "whatsapp-verify.com", isPhish: true, explanation: "Phishing site pretending to be WhatsApp" },
        { text: "instagram.com", isPhish: false, explanation: "Legitimate Instagram domain" }
      ];
      const shuffledFallback = shuffle(fallbackLinks);
      const initialFallback = shuffledFallback.slice(0, 8);
      const phishingCount = initialFallback.filter(link => link.isPhish).length;
      
      setAllLinks(shuffledFallback);
      setLinks(initialFallback);
      setTotalPhishingLinks(phishingCount);
    } finally {
      setScore(0);
      setLives(3);
      setGameOver(false);
      setGameWon(false);
      setCombo(0);
      setMaxCombo(0);
      setPhishingLinksFound(0);
      setEducationalContent("");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-blue-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Generating phishing challenges...</p>
        </div>
      </div>
    );
  }

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
          <p className="text-slate-400 text-sm mt-1">
            Found {phishingLinksFound} of {totalPhishingLinks} phishing links
          </p>
        </header>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-blue-500/30 shadow-lg backdrop-blur-sm">
          {gameOver ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-3xl font-bold">
                {gameWon ? "🎉 You Win!" : "💀 Game Over!"}
              </div>
              <div className="text-slate-200 text-lg">
                Final Score: <span className="font-semibold text-cyan-400">{score}</span>
              </div>
              <div className="text-slate-200">
                Phishing Links Found: <span className="font-semibold text-green-400">{phishingLinksFound}/{totalPhishingLinks}</span>
              </div>
              <div className="text-slate-200">
                Max Combo: <span className="font-semibold text-yellow-400">{maxCombo}</span>
              </div>
              
              {/* Educational Content Box */}
              {educationalContent && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-6 bg-slate-800/80 rounded-2xl border border-cyan-500/30 text-left"
                >
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">🎓 Cybersecurity Knowledge</h3>
                  <div 
                    className="text-slate-300 prose prose-invert prose-sm"
                    dangerouslySetInnerHTML={{ __html: educationalContent }}
                  />
                </motion.div>
              )}
              
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                      className="text-left p-4 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-sm md:text-base break-all">{link.text}</div>
                        <div className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded ml-2 flex-shrink-0">click</div>
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