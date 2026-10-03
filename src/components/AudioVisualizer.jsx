import React, { useEffect, useRef } from 'react';

export default function AudioVisualizer({ audioRef, isPlaying, mode = 'spectrum' }) {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match display size
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = canvas.parentElement?.clientHeight || 200;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      phase += isPlaying ? 0.05 : 0.01;

      if (mode === 'spectrum') {
        // Equalizer Spectrum Bars
        const barCount = 36;
        const barWidth = (width / barCount) - 3;
        const centerX = width / 2;

        for (let i = 0; i < barCount; i++) {
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const factor = Math.cos(distFromCenter * Math.PI * 0.5);

          const freq = (i + 1) * 0.4;
          const amplitude = isPlaying
            ? Math.sin(phase * 2 + freq) * 0.4 + Math.cos(phase * 3 + freq * 0.5) * 0.4 + 0.5
            : 0.1;

          const barHeight = Math.max(6, amplitude * (height * 0.75) * factor);
          const x = i * (barWidth + 3);
          const y = height - barHeight;

          // Gradient color: Cyan to Emerald to Magenta
          const gradient = ctx.createLinearGradient(0, height, 0, y);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
          gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.8)');
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0.95)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Top peak hold point
          if (isPlaying) {
            ctx.fillStyle = '#67e8f9';
            ctx.fillRect(x, Math.max(0, y - 4), barWidth, 2);
          }
        }
      } else if (mode === 'radial') {
        // Circular Waveform Beam
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.31;
        const numPoints = 72;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Draw Outer Beam Glow Ring
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const amp = isPlaying
            ? Math.sin(phase * 3.5 + i * 0.4) * 26 + Math.cos(phase * 2.5 + i * 0.6) * 18
            : 4;
          const r = baseRadius + amp;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const radGradient = ctx.createRadialGradient(0, 0, baseRadius * 0.4, 0, 0, baseRadius + 50);
        radGradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
        radGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.6)');
        radGradient.addColorStop(1, 'rgba(236, 72, 153, 0.9)');

        ctx.strokeStyle = radGradient;
        ctx.lineWidth = isPlaying ? 3.5 : 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = isPlaying ? 22 : 4;
        ctx.stroke();

        // Radiating Pulsing Beam Rays
        if (isPlaying) {
          for (let i = 0; i < numPoints; i += 2) {
            const angle = (i / numPoints) * Math.PI * 2;
            const len = Math.sin(phase * 4 + i * 0.8) * 38 + 15;
            const x1 = Math.cos(angle) * (baseRadius - 5);
            const y1 = Math.sin(angle) * (baseRadius - 5);
            const x2 = Math.cos(angle) * (baseRadius + len + 10);
            const y2 = Math.sin(angle) * (baseRadius + len + 10);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = i % 4 === 0 ? 'rgba(236, 72, 153, 0.85)' : i % 2 === 0 ? 'rgba(6, 182, 212, 0.85)' : 'rgba(52, 211, 153, 0.85)';
            ctx.lineWidth = i % 4 === 0 ? 3 : 2;
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (mode === 'particles') {
        // Floating Audio Starfield/Particles
        const numParticles = 45;
        for (let i = 0; i < numParticles; i++) {
          const speed = isPlaying ? (i % 3 + 1) * 0.8 : 0.2;
          const px = (Math.sin(phase * 0.5 + i * 1.5) * 0.5 + 0.5) * width;
          const py = ((phase * 20 * speed + i * 40) % height);
          const size = (i % 4) + 2;

          ctx.beginPath();
          ctx.arc(px, height - py, size, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(6, 182, 212, 0.7)' : 'rgba(16, 185, 129, 0.8)';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = isPlaying ? 10 : 2;
          ctx.fill();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, mode, audioRef]);

  return (
    <div className="w-full h-full relative overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
