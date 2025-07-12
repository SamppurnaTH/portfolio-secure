"use client";

import { useEffect, useRef } from "react";

// Define a type for particle properties for better readability and type safety
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string; // Pre-calculated color string including opacity
}

// Define props for customization, making the component highly reusable
interface ParticleBackgroundProps {
  particleCount?: number;
  particleSizeMin?: number;
  particleSizeMax?: number;
  particleSpeed?: number; // Max speed for vx/vy
  connectionDistance?: number;
  particleColor?: string; // Base RGB values (e.g., "34, 211, 238" for cyan-400)
  lineColor?: string; // Base RGB values for lines (e.g., "34, 211, 238")
  particleOpacityMin?: number;
  particleOpacityMax?: number;
  lineWidth?: number;
}

export default function ParticleBackground({
  particleCount = 50,
  particleSizeMin = 1,
  particleSizeMax = 3,
  particleSpeed = 0.5,
  connectionDistance = 100,
  particleColor = "34, 211, 238", // Default: cyan-400 RGB
  lineColor = "34, 211, 238", // Default: cyan-400 RGB
  particleOpacityMin = 0.1,
  particleOpacityMax = 0.5,
  lineWidth = 0.5,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Ref to store the animation frame ID for proper cleanup
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    // Function to set canvas size to fill the window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initial resize and add event listener for future resizes
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: Particle[] = [];

    // Helper function to create a single particle with random properties within defined ranges
    const createParticle = (): Particle => {
      const opacity = Math.random() * (particleOpacityMax - particleOpacityMin) + particleOpacityMin;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * particleSpeed, // Random velocity between -speed/2 and +speed/2
        vy: (Math.random() - 0.5) * particleSpeed,
        size: Math.random() * (particleSizeMax - particleSizeMin) + particleSizeMin,
        opacity: opacity,
        // Pre-calculate the full color string including individual particle opacity
        color: `rgba(${particleColor}, ${opacity})`,
      };
    };

    // Initialize all particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

      particles.forEach((particle, index) => {
        // 1. Update Particle Position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap particles around the edges of the canvas
        if (particle.x < 0) particle.x = canvas.width;
        else if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        else if (particle.y > canvas.height) particle.y = 0;

        // 2. Draw Particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color; // Use the pre-calculated color string
        ctx.fill();

        // 3. Draw Connections to other particles
        // Start the inner loop from 'index + 1' to avoid drawing duplicate lines (A-B vs B-A)
        // and to avoid drawing a line from a particle to itself.
        for (let i = index + 1; i < particles.length; i++) {
          const otherParticle = particles[i];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Draw a line if particles are within the connection distance
          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            // Calculate line opacity based on distance: fades out as distance increases
            const lineOpacity = lineWidth * (1 - distance / connectionDistance);
            ctx.strokeStyle = `rgba(${lineColor}, ${lineOpacity})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      });

      // Request the next animation frame
      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Start the animation
    animate();

    // Cleanup function: remove event listener and cancel animation frame on component unmount
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [
    // Effect dependencies: re-run this effect if any of these props change
    particleCount,
    particleSizeMin,
    particleSizeMax,
    particleSpeed,
    connectionDistance,
    particleColor,
    lineColor,
    particleOpacityMin,
    particleOpacityMax,
    lineWidth,
  ]);

  return (
    // Render the canvas element, making sure it's positioned correctly
    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full -z-10" />
  );
}