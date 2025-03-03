'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  baseRadius: number;
  radius: number;
  speed: number;
  angle: number;
  angleSpeed: number;
  opacity: number;
  pulseOffset: number;
}

const AGIThoughtBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Memoize particle count calculation
  const particleCount = useMemo(() => {
    return Math.max(150, Math.floor((dimensions.width * dimensions.height) / 10000));
  }, [dimensions]);

  // Optimized particle creation
  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = new Array(particleCount).fill(null).map(() => {
      const baseRadius = Math.random() * 2 + 1;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius,
        radius: baseRadius,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.5 + 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });
    particlesRef.current = particles;
  }, [particleCount]);

  // Optimized resize handler
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    
    const { clientWidth, clientHeight } = document.documentElement;
    canvasRef.current.width = clientWidth;
    canvasRef.current.height = clientHeight;
    setDimensions({ width: clientWidth, height: clientHeight });
    createParticles(clientWidth, clientHeight);
  }, [createParticles]);

  // Optimized drawing function
  const drawParticles = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const connections: [number, number, number][] = [];

    // Update and draw particles
    particles.forEach((particle, i) => {
      // Update particle position
      particle.angle += particle.angleSpeed;
      particle.x += Math.cos(particle.angle) * particle.speed;
      particle.y += Math.sin(particle.angle) * particle.speed;

      // Optimized pulsation
      particle.radius = particle.baseRadius * (Math.sin(time * 0.002 + particle.pulseOffset) * 0.2 + 1);

      // Optimized edge wrapping
      particle.x = (particle.x + canvas.width) % canvas.width;
      particle.y = (particle.y + canvas.height) % canvas.height;

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80, 129, 217, ${particle.opacity})`;
      ctx.fill();

      // Store potential connections
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particle.x - particles[j].x;
        const dy = particle.y - particles[j].y;
        const distance = dx * dx + dy * dy; // Optimized distance calculation
        if (distance < 10000) { // Square of 100
          connections.push([particle.x, particle.y, j]);
        }
      }
    });

    // Batch draw connections
    if (connections.length > 0) {
      ctx.strokeStyle = 'rgba(80, 129, 217, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      connections.forEach(([x, y, j]) => {
        ctx.moveTo(x, y);
        ctx.lineTo(particles[j].x, particles[j].y);
      });
      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(drawParticles);
  }, []);

  // Setup effect
  useEffect(() => {
    handleResize();
    drawParticles(0);

    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleResize, drawParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-[100vw] h-[100vh] -z-10"
      style={{ touchAction: 'none' }}
    />
  );
};

// Utility function for debouncing
function debounce(fn: Function, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), ms);
  };
}

export default AGIThoughtBackground;
