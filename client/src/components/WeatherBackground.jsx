import React, { useEffect, useRef } from 'react';

const WeatherBackground = ({ condition = 'Clear', isNight = false, theme = 'dark' }) => {
  const canvasRef = useRef(null);

  // Normalize condition
  const getCleanCondition = (cond) => {
    if (!cond) return 'clear';
    const c = cond.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return 'rain';
    if (c.includes('snow') || c.includes('ice') || c.includes('hail')) return 'snow';
    if (c.includes('thunder') || c.includes('storm')) return 'thunderstorm';
    if (c.includes('cloud') || c.includes('overcast')) return 'clouds';
    if (c.includes('mist') || c.includes('fog') || c.includes('haze') || c.includes('smoke') || c.includes('dust')) return 'mist';
    return 'clear';
  };

  const cond = getCleanCondition(condition);

  // Combined Gradient Base (Theme + Day/Night + Weather Condition)
  const getGradientClass = () => {
    if (theme === 'dark') {
      // Deep navy/dark blue base as requested for high contrast
      switch (cond) {
        case 'rain':
          return 'from-slate-950 via-slate-900 to-sky-950/60';
        case 'thunderstorm':
          return 'from-slate-950 via-purple-950/50 to-zinc-950';
        case 'snow':
          return 'from-slate-950 via-blue-950/60 to-slate-900';
        case 'clouds':
          return 'from-slate-950 via-slate-900 to-indigo-950/40';
        case 'mist':
          return 'from-zinc-950 via-slate-950 to-indigo-950/20';
        default: // Clear
          return isNight 
            ? 'from-slate-950 via-indigo-950/30 to-slate-950'
            : 'from-slate-950 via-sky-950/50 to-indigo-950/50';
      }
    } else {
      // Light Theme: clear, readable sky/teal/sand colors
      switch (cond) {
        case 'rain':
          return 'from-slate-200 via-sky-200 to-slate-300';
        case 'thunderstorm':
          return 'from-slate-300 via-purple-100 to-zinc-300';
        case 'snow':
          return 'from-blue-50/70 via-sky-100 to-slate-100';
        case 'clouds':
          return 'from-sky-100 via-slate-200 to-zinc-200';
        case 'mist':
          return 'from-zinc-200 via-slate-100 to-zinc-200';
        default: // Clear
          return isNight
            ? 'from-indigo-100 via-sky-150 to-slate-100'
            : 'from-sky-200 via-blue-100 to-amber-50';
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Dynamic particles
    let particles = [];
    const maxParticles = cond === 'rain' ? 120 : cond === 'snow' ? 80 : cond === 'thunderstorm' ? 150 : 50;

    const initParticles = () => {
      particles = [];
      const width = canvas.width;
      const height = canvas.height;

      for (let i = 0; i < maxParticles; i++) {
        if (cond === 'rain' || cond === 'thunderstorm') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            vy: Math.random() * 8 + 10,
            vx: Math.random() * 2 - 1,
            length: Math.random() * 20 + 10,
            opacity: Math.random() * 0.3 + 0.1,
          });
        } else if (cond === 'snow') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vy: Math.random() * 1.5 + 0.5,
            vx: Math.random() * 1.5 - 0.75,
            radius: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.1,
          });
        } else if (isNight && cond === 'clear') {
          // Twinkling stars (only visible at night)
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.2 + 0.2,
            opacity: Math.random() * 0.7 + 0.1,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinkleDir: Math.random() > 0.5 ? 1 : -1,
          });
        } else if (cond === 'clouds') {
          particles.push({
            x: Math.random() * width * 1.5 - width * 0.25,
            y: Math.random() * height * 0.6,
            radius: Math.random() * 150 + 80,
            vx: Math.random() * 0.2 + 0.05,
            opacity: theme === 'dark' ? (Math.random() * 0.04 + 0.01) : (Math.random() * 0.06 + 0.02),
          });
        }
      }
    };
    initParticles();

    let flashOpacity = 0;
    let nextFlash = Math.random() * 300 + 150;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      if (particles.length === 0) initParticles();

      // Render weather effects
      if (cond === 'rain' || cond === 'thunderstorm') {
        ctx.lineWidth = 1.5;
        particles.forEach(p => {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx, p.y + p.length);
          ctx.strokeStyle = theme === 'dark' 
            ? `rgba(156, 163, 175, ${p.opacity})` 
            : `rgba(71, 85, 105, ${p.opacity + 0.1})`;
          ctx.stroke();

          p.y += p.vy;
          p.x += p.vx;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        });

        // Lightning flashes for Thunderstorm
        if (cond === 'thunderstorm') {
          nextFlash--;
          if (nextFlash <= 0) {
            flashOpacity = Math.random() * 0.6 + 0.1;
            nextFlash = Math.random() * 400 + 200;
          }

          if (flashOpacity > 0) {
            ctx.fillStyle = theme === 'dark' 
              ? `rgba(255, 255, 255, ${flashOpacity})`
              : `rgba(255, 255, 255, ${flashOpacity * 0.8})`;
            ctx.fillRect(0, 0, width, height);
            flashOpacity -= 0.08;
          }
        }
      } else if (cond === 'snow') {
        ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.9)';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.vy;
          p.x += p.vx;

          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
          if (p.x > width || p.x < 0) {
            p.x = Math.random() * width;
          }
        });
      } else if (isNight && cond === 'clear') {
        particles.forEach(p => {
          ctx.fillStyle = theme === 'dark' 
            ? `rgba(255, 255, 255, ${p.opacity})`
            : `rgba(15, 23, 42, ${p.opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.opacity += p.twinkleSpeed * p.twinkleDir;
          if (p.opacity >= 0.8) p.twinkleDir = -1;
          if (p.opacity <= 0.1) p.twinkleDir = 1;
        });
      } else if (cond === 'clouds') {
        particles.forEach(p => {
          ctx.fillStyle = theme === 'dark'
            ? `rgba(255, 255, 255, ${p.opacity})`
            : `rgba(15, 23, 42, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.vx;
          if (p.x - p.radius > width) {
            p.x = -p.radius;
            p.y = Math.random() * height * 0.6;
          }
        });
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [cond, isNight, theme]);

  return (
    <div className={`fixed inset-0 z-0 bg-gradient-to-br ${getGradientClass()} bg-transition overflow-hidden`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      {/* Glow aura overlay for Clear/Sunny Day */}
      {!isNight && cond === 'clear' && (
        <div className={`absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full blur-[150px] pointer-events-none animate-pulse-slow ${
          theme === 'dark' ? 'bg-sky-500/5' : 'bg-yellow-300/20'
        }`} />
      )}

      {/* Dimmer overlay for optimal text contrast */}
      <div className={`absolute inset-0 pointer-events-none ${
        theme === 'dark' ? 'bg-slate-950/20 backdrop-brightness-[0.9]' : 'bg-white/5 backdrop-brightness-[0.98]'
      }`} />
    </div>
  );
};

export default WeatherBackground;
