// src/components/CyberRunner.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateEducationalContent, generateCyberObjects } from "../utils/geminiClient";

export default function CyberRunner({ onBack, isMuted, onGameStart }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [objects, setObjects] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(3);
  const [educationalContent, setEducationalContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [encounteredKeywords, setEncounteredKeywords] = useState([]);
  const gameRef = useRef(null);
  const jumpRef = useRef(null);
  const collectRef = useRef(null);
  const hitRef = useRef(null);
  const gameOverRef = useRef(null);
  const winRef = useRef(null);
  const jumpVelocityRef = useRef(0);
  const objectPoolRef = useRef([]);
  const poolIndexRef = useRef(0);

  // Refs to avoid stale closures inside timers
  const playerPositionRef = useRef(0);
  const isJumpingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const scoreRef = useRef(0);

  // Game dimensions
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 400;
  const PLAYER_SIZE = 40;
  const OBJECT_SIZE = 44;
  const GROUND_HEIGHT = 50;
  const THREAT_PENALTY = 5; // unused now; retained in case of future tuning
  const COLLISION_PADDING = 6;

  // Stop any playing SFX when leaving this screen
  useEffect(() => {
    return () => {
      try {
        [jumpRef, collectRef, hitRef, gameOverRef, winRef].forEach(ref => {
          if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
          }
        });
      } catch (e) {}
    };
  }, []);

  // Keep refs in sync
  useEffect(() => { playerPositionRef.current = playerPosition; }, [playerPosition]);
  useEffect(() => { isJumpingRef.current = isJumping; }, [isJumping]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { scoreRef.current = score; }, [score]);

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
        const cyberObjects = await generateCyberObjects(20);
        // Normalize objects with runtime fields
        const normalized = cyberObjects.map((o, i) => ({
          id: `${o.name}-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          type: (o.type || '').toString().toLowerCase() === 'security' ? 'security' : 'threat',
          name: o.name,
          description: o.description,
          x: GAME_WIDTH + i * 300, // Start objects off-screen
          y: GROUND_HEIGHT,
          hit: false
        }));
        // Prepare pool for spawning and seed encountered keywords list
        objectPoolRef.current = normalized.map(o => ({ type: o.type, name: o.name, description: o.description }));
        poolIndexRef.current = 0;
        setEncounteredKeywords(prev => {
          const existing = new Set(prev.map(k => k.name));
          const additions = normalized.filter(o => !existing.has(o.name)).map(o => ({ name: o.name, type: o.type, description: o.description }));
          return [...prev, ...additions];
        });
        setObjects(normalized);
        
        try {
          if (typeof Audio !== "undefined") {
            jumpRef.current = new Audio("/jump.mp3");
            collectRef.current = new Audio("/collect.mp3");
            hitRef.current = new Audio("/hit.mp3");
            gameOverRef.current = new Audio("/defeat.mp3");
            winRef.current = new Audio("/victory.mp3");
            jumpRef.current.volume = 0.5;
            collectRef.current.volume = 0.7;
            hitRef.current.volume = 0.7;
            gameOverRef.current.volume = 0.8;
            winRef.current.volume = 0.8;
          }
        } catch (err) {
          console.warn("Audio init failed:", err);
        }
      } catch (error) {
        console.error("Error initializing game:", error);
        // Fallback to default objects
        const fallbackObjects = [
          { type: "threat", name: "Virus", description: "Malicious software that replicates itself" },
          { type: "security", name: "Firewall", description: "Network security system that monitors traffic" },
          { type: "threat", name: "Phishing", description: "Fraudulent attempt to obtain sensitive information" },
          { type: "security", name: "VPN", description: "Virtual Private Network encrypts your connection" },
          { type: "threat", name: "Ransomware", description: "Malware that encrypts files and demands payment" },
          { type: "security", name: "2FA", description: "Two-Factor Authentication adds extra security" },
          { type: "threat", name: "Trojan", description: "Malware disguised as legitimate software" },
          { type: "security", name: "Antivirus", description: "Software designed to detect and destroy viruses" },
          { type: "threat", name: "Keylogger", description: "Malware that records keystrokes" },
          { type: "security", name: "Encryption", description: "Process of encoding information to protect it" },
        ].map((o, i) => ({
          id: `${o.name}-fallback-${i}-${Math.random().toString(36).slice(2)}`,
          ...o,
          type: (o.type || '').toString().toLowerCase() === 'security' ? 'security' : 'threat',
          x: GAME_WIDTH + i * 300,
          y: GROUND_HEIGHT,
          hit: false
        }));
        objectPoolRef.current = fallbackObjects.map(o => ({ type: o.type, name: o.name, description: o.description }));
        poolIndexRef.current = 0;
        setEncounteredKeywords(prev => {
          const existing = new Set(prev.map(k => k.name));
          const additions = fallbackObjects.filter(o => !existing.has(o.name)).map(o => ({ name: o.name, type: o.type, description: o.description }));
          return [...prev, ...additions];
        });
        setObjects(fallbackObjects);
      } finally {
        setIsLoading(false);
      }
    };

    initGame();
  }, []);

  // Game loop (smoothed and with pass-through threats)
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setObjects(prev => {
        // Move objects left and clean off-screen
        let working = prev.map(obj => ({ ...obj, x: obj.x - gameSpeed })).filter(obj => obj.x > -OBJECT_SIZE);

        // Collision handling with current refs
        const playerLeft = 20 + COLLISION_PADDING;
        const playerRight = 20 + PLAYER_SIZE - COLLISION_PADDING;
        const playerBottom = GROUND_HEIGHT + playerPositionRef.current + COLLISION_PADDING;
        const playerTop = GROUND_HEIGHT + playerPositionRef.current + PLAYER_SIZE - COLLISION_PADDING;

        const survivors = [];
        
        for (const obj of working) {
          const objLeft = obj.x + COLLISION_PADDING;
          const objRight = obj.x + OBJECT_SIZE - COLLISION_PADDING;
          const objBottom = obj.y + COLLISION_PADDING;
          const objTop = obj.y + OBJECT_SIZE - COLLISION_PADDING;
          const overlapping = objLeft < playerRight && objRight > playerLeft && objBottom < playerTop && objTop > playerBottom;

          if (overlapping) {
            if (obj.type === "threat") {
              // If player is clearly above, allow clearance; otherwise game over
              const isClearlyAbove = playerBottom >= objTop; // using padded boxes
              if (!isClearlyAbove) {
                if (!isMutedRef.current && hitRef.current) {
                  hitRef.current.currentTime = 0;
                  hitRef.current.play().catch(console.error);
                }
                handleGameOver();
                survivors.push({ ...obj, hit: true });
              } else {
                survivors.push(obj);
              }
            } else {
              // Security item is collectible on contact; never causes game over
              if (!isMutedRef.current && collectRef.current) {
                collectRef.current.currentTime = 0;
                collectRef.current.play().catch(console.error);
              }
              setScore(s => s + 10);
              continue; // remove this object
            }
          } else {
            survivors.push(obj);
          }
        }

        // Security collisions no longer cause game over

        // Maybe add new objects
        if (survivors.length < 8) {
          const last = survivors.length > 0 ? survivors[survivors.length - 1] : null;
          const newX = last ? last.x + 300 + Math.random() * 200 : GAME_WIDTH;
          const pool = objectPoolRef.current;
          let base = null;
          if (pool && pool.length > 0) {
            base = pool[poolIndexRef.current % pool.length];
            poolIndexRef.current += 1;
          }
          const newObject = {
            id: `dyn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: base ? base.type : (Math.random() > 0.5 ? "threat" : "security"),
            name: base ? base.name : (Math.random() > 0.5 ? "Malware" : "Patch"),
            x: newX,
            y: GROUND_HEIGHT,
            description: base ? base.description : (Math.random() > 0.5 ? "Harmful software" : "Protective measure"),
            hit: false
          };
          // Track encountered keywords
          setEncounteredKeywords(prevKw => {
            if (prevKw.some(k => k.name === newObject.name)) return prevKw;
            return [...prevKw, { name: newObject.name, type: newObject.type, description: newObject.description }];
          });
          survivors.push(newObject);
        }

        // Increase speed gradually
        if (scoreRef.current > 0 && scoreRef.current % 100 === 0) {
          setGameSpeed(prev => Math.min(prev + 0.3, 10));
        }

        return survivors;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameSpeed]);

  // Handle jumping
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    let jumpInterval;
    if (isJumping) {
      let position = 0;
      let velocity = 22; // higher initial upward velocity
      const gravity = 1.1; // slightly lower gravity for more hang time
      jumpVelocityRef.current = velocity;

      if (!isMuted && jumpRef.current) {
        jumpRef.current.currentTime = 0;
        jumpRef.current.play().catch(console.error);
      }

      jumpInterval = setInterval(() => {
        position += velocity;
        velocity -= gravity;
        if (position <= 0) {
          position = 0;
          setIsJumping(false);
          clearInterval(jumpInterval);
        }
        jumpVelocityRef.current = velocity;
        setPlayerPosition(position);
      }, 16);
    }

    return () => {
      if (jumpInterval) clearInterval(jumpInterval);
    };
  }, [isJumping, gameStarted, gameOver, isMuted]);

  // Handle key presses
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space" && !isJumping && gameStarted && !gameOver) {
        setIsJumping(true);
      } else if (e.code === "Enter" && !gameStarted) {
        startGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isJumping, gameStarted, gameOver]);

  // Generate educational content when game ends
  useEffect(() => {
    if (gameOver) {
      const generateContent = async () => {
        const content = await generateEducationalContent("cyberrunner", score, objects.length);
        // Clean HTML content by removing markdown code blocks
        const cleanContent = content.replace(/```html|```/g, '').trim();
        setEducationalContent(cleanContent);
      };
      generateContent();
      
      // Play win sound if score is high
      if (score >= 100 && !isMuted && winRef.current) {
        winRef.current.currentTime = 0;
        winRef.current.play().catch(console.error);
      }
    }
  }, [gameOver, score, objects.length, isMuted]);

  const startGame = () => {
    // stop any end sounds when restarting
    try {
      if (gameOverRef.current) {
        gameOverRef.current.pause();
        gameOverRef.current.currentTime = 0;
      }
      if (winRef.current) {
        winRef.current.pause();
        winRef.current.currentTime = 0;
      }
    } catch (e) {}
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setGameSpeed(3);
    setPlayerPosition(0);
    playerPositionRef.current = 0;
    isJumpingRef.current = false;
    scoreRef.current = 0;
    // Initialize with objects off-screen
    const initialObjects = objects.map((obj, i) => ({
      ...obj,
      x: GAME_WIDTH + i * 300,
      hit: false
    }));
    setObjects(initialObjects);
  };

  const handleGameOver = () => {
    setGameOver(true);
    setGameStarted(false);
    if (score > highScore) setHighScore(score);
    
    if (!isMuted && gameOverRef.current) {
      try {
        gameOverRef.current.currentTime = 0;
        gameOverRef.current.play().catch(console.error);
      } catch (e) {
        console.warn("Play error (gameover):", e);
      }
    }
  };

  const reset = async () => {
    setIsLoading(true);
    try {
      const cyberObjects = await generateCyberObjects(20);
      setEncounteredKeywords([]);
      const normalized = cyberObjects.map((o, i) => ({
        id: `${o.name}-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        type: (o.type || '').toString().toLowerCase() === 'security' ? 'security' : 'threat',
        name: o.name,
        description: o.description,
        x: GAME_WIDTH + i * 300,
        y: GROUND_HEIGHT,
        hit: false
      }));
      objectPoolRef.current = normalized.map(o => ({ type: o.type, name: o.name, description: o.description }));
      poolIndexRef.current = 0;
      setObjects(normalized);
    } catch (error) {
      console.error("Error resetting game:", error);
      // Fallback to default objects
      const fallbackObjects = [
        { type: "threat", name: "Virus", description: "Malicious software that replicates itself" },
        { type: "security", name: "Firewall", description: "Network security system that monitors traffic" },
        { type: "threat", name: "Phishing", description: "Fraudulent attempt to obtain sensitive information" },
        { type: "security", name: "VPN", description: "Virtual Private Network encrypts your connection" },
        { type: "threat", name: "Ransomware", description: "Malware that encrypts files and demands payment" },
        { type: "security", name: "2FA", description: "Two-Factor Authentication adds extra security" },
        { type: "threat", name: "Trojan", description: "Malware disguised as legitimate software" },
        { type: "security", name: "Antivirus", description: "Software designed to detect and destroy viruses" },
        { type: "threat", name: "Keylogger", description: "Malware that records keystrokes" },
        { type: "security", name: "Encryption", description: "Process of encoding information to protect it" },
      ].map((o, i) => ({
        id: `${o.name}-fallback-${i}-${Math.random().toString(36).slice(2)}`,
        ...o,
        type: (o.type || '').toString().toLowerCase() === 'security' ? 'security' : 'threat',
        x: GAME_WIDTH + i * 300,
        y: GROUND_HEIGHT,
        hit: false
      }));
      setEncounteredKeywords([]);
      objectPoolRef.current = fallbackObjects.map(o => ({ type: o.type, name: o.name, description: o.description }));
      poolIndexRef.current = 0;
      setObjects(fallbackObjects);
    } finally {
      setIsLoading(false);
      setGameOver(false);
      setScore(0);
      setPlayerPosition(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading cybersecurity challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-purple-900 text-white p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/10 animate-float"
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
        onClick={() => {
          try {
            if (gameOverRef.current) { gameOverRef.current.pause(); gameOverRef.current.currentTime = 0; }
            if (winRef.current) { winRef.current.pause(); winRef.current.currentTime = 0; }
          } catch (e) {}
          onBack && onBack();
        }}
        className="absolute top-4 left-4 px-4 py-2 bg-slate-700/70 hover:bg-slate-600 rounded-lg transition-colors z-10"
      >
        ← Back
      </button>
      
      <div className="w-full max-w-3xl z-10">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">🏃‍♂️ Cyber Runner</h1>
          <p className="text-slate-300 mt-2">Jump over threats and collect security items!</p>
          <p className="text-slate-400 text-sm mt-1">
            Press SPACE to jump, ENTER to start
          </p>
        </header>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-purple-500/30 shadow-lg backdrop-blur-sm">
          {gameOver ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-3xl font-bold">
                {score >= 100 ? "🎉 You Win!" : "💀 Game Over!"}
              </div>
              <div className="text-slate-200 text-lg">
                Score: <span className="font-semibold text-purple-400">{score}</span>
              </div>
              <div className="text-slate-200">
                High Score: <span className="font-semibold text-yellow-400">{highScore}</span>
              </div>
              
              {/* Educational Content Box */}
              {educationalContent && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-6 bg-slate-800/80 rounded-2xl border border-purple-500/30 text-left"
                >
                  <h3 className="text-xl font-bold text-purple-400 mb-4">🎓 Cybersecurity Knowledge</h3>
                  <div 
                    className="text-slate-300 prose prose-invert prose-sm"
                    dangerouslySetInnerHTML={{ __html: educationalContent }}
                  />
                </motion.div>
              )}

              {/* Encountered Keywords meanings */}
              {encounteredKeywords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-6 p-6 bg-slate-800/80 rounded-2xl border border-purple-500/30 text-left"
                >
                  <h3 className="text-xl font-bold text-purple-400 mb-3">📚 Keywords & Meanings</h3>
                  <ul className="space-y-2">
                    {encounteredKeywords.map((k, i) => (
                      <li key={`${k.name}-${i}`} className="text-slate-200">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mr-2 ${k.type === 'threat' ? 'bg-red-600' : 'bg-green-600'}`}>
                          {k.type}
                        </span>
                        <span className="font-semibold">{k.name}:</span> <span className="text-slate-300">{k.description}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
              
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={startGame} className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors">
                  Play Again
                </button>
                <button onClick={() => {
                  try {
                    if (gameOverRef.current) { gameOverRef.current.pause(); gameOverRef.current.currentTime = 0; }
                    if (winRef.current) { winRef.current.pause(); winRef.current.currentTime = 0; }
                  } catch (e) {}
                  onBack && onBack();
                }} className="px-6 py-3 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold transition-colors">
                  Main Menu
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 p-4 bg-slate-900/50 rounded-xl">
                <div className="text-lg">
                  Score: <span className="font-semibold text-purple-400 text-xl">{score}</span>
                </div>
                <div className="text-lg">
                  High Score: <span className="font-semibold text-yellow-400 text-xl">{highScore}</span>
                </div>
                {!gameStarted && (
                  <div className="text-lg text-amber-400">
                    Press ENTER to start
                  </div>
                )}
              </div>

              {/* Game area */}
              <div 
                ref={gameRef}
                className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden w-full"
                style={{ width: '100%', maxWidth: GAME_WIDTH, height: GAME_HEIGHT, margin: '0 auto' }}
              >
                {/* Ground */}
                <div 
                  className="absolute bottom-0 w-full bg-green-700"
                  style={{ height: GROUND_HEIGHT }}
                />
                
                {/* Player */}
                <motion.div
                  className="absolute bottom-0 bg-blue-500 rounded-t-full flex items-center justify-center z-10"
                  style={{ 
                    width: PLAYER_SIZE, 
                    height: PLAYER_SIZE,
                    left: 20,
                    bottom: GROUND_HEIGHT + playerPosition
                  }}
                  animate={{ 
                    rotate: isJumping ? -20 : 0,
                    scale: isJumping ? 1.1 : 1
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-xs font-bold">👨‍💻</span>
                </motion.div>
                
                {/* Objects */}
                <AnimatePresence>
                  {objects.map((obj) => (
                    <motion.div
                      key={obj.id}
                      className={`absolute rounded-lg flex items-center justify-center border-2 ${
                        obj.type === "threat" 
                          ? obj.hit ? "bg-amber-500 border-amber-300" : "bg-red-500 border-red-300" 
                          : "bg-green-500 border-green-300"
                      }`}
                      style={{ 
                        width: OBJECT_SIZE, 
                        height: OBJECT_SIZE,
                        left: obj.x,
                        bottom: obj.y
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <span className="text-xs font-bold text-white px-1 text-center leading-tight overflow-hidden">
                        {obj.name}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700 mt-6">
                <h3 className="font-bold text-purple-400 mb-2">🎮 Game Instructions:</h3>
                <p className="text-sm text-slate-300">
                  Red (threat) boxes end the run on contact unless you clear them by jumping over. Green (security) boxes are collectible on contact for +10.
                  The game gets faster as you progress!
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