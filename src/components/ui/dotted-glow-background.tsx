import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

type Dot = { x: number; y: number; phase: number; speed: number };

export interface DottedGlowBackgroundProps {
  className?: string;
  gap?: number;
  radius?: number;
  color?: string;
  darkColor?: string;
  glowColor?: string;
  darkGlowColor?: string;
  opacity?: number;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
}

/** A lightweight canvas version of Aceternity's Dotted Glow Background. */
export function DottedGlowBackground({
  className,
  gap = 12,
  radius = 2,
  color = "rgba(12, 74, 110, 0.3)",
  darkColor,
  glowColor = "rgba(14, 165, 233, 0.85)",
  darkGlowColor,
  opacity = 0.6,
  backgroundOpacity = 0,
  speedMin = 0.4,
  speedMax = 1.3,
  speedScale = 1
}: DottedGlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let devicePixelRatio = 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.floor(height * devicePixelRatio));
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      dots = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          dots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: speedMin + Math.random() * Math.max(0, speedMax - speedMin)
          });
        }
      }
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      if (backgroundOpacity > 0) {
        const background = context.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.35, Math.max(width, height) * 0.75);
        background.addColorStop(0, `rgba(125, 211, 252, ${backgroundOpacity})`);
        background.addColorStop(1, "rgba(125, 211, 252, 0)");
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
      }

      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const dotColor = isDark && darkColor ? darkColor : color;
      const activeGlowColor = isDark && darkGlowColor ? darkGlowColor : glowColor;
      const seconds = time / 1000;
      dots.forEach((dot) => {
        const pulse = reduceMotion.matches ? 0.28 : 0.25 + (Math.sin(seconds * dot.speed * speedScale + dot.phase) + 1) * 0.32;
        const glowing = pulse > 0.65;
        context.beginPath();
        context.fillStyle = glowing ? activeGlowColor : dotColor;
        context.globalAlpha = Math.min(1, opacity * pulse);
        if (glowing) {
          context.shadowColor = activeGlowColor;
          context.shadowBlur = 8;
        }
        context.arc(dot.x, dot.y, radius * (glowing ? 1.15 : 1), 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });
      context.globalAlpha = 1;
      if (!reduceMotion.matches) frame = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const handleMotionChange = () => {
      cancelAnimationFrame(frame);
      draw(0);
    };
    reduceMotion.addEventListener("change", handleMotionChange);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      reduceMotion.removeEventListener("change", handleMotionChange);
    };
  }, [backgroundOpacity, color, darkColor, darkGlowColor, gap, glowColor, opacity, radius, speedMax, speedMin, speedScale]);

  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}><canvas ref={canvasRef} className="size-full" /></div>;
}
