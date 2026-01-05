import React, { useRef, useEffect } from 'react';
import { VoiceOrbProps } from '../types';

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ analyser, inputAnalyser, isConnected }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set high resolution
        const dpr = window.devicePixelRatio || 1;
        const updateSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        let animationId: number;
        const aiDataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);
        const textDataArray = new Uint8Array(inputAnalyser ? inputAnalyser.frequencyBinCount : 0); // User Audio

        // Sphere Config
        const particleCount = 600;
        const baseRadius = 140;
        let rotationX = 0;
        let rotationY = 0;

        // Generate initial sphere points (Fibonacci Sphere)
        interface Point3D { x: number; y: number; z: number; baseX: number; baseY: number; baseZ: number; }
        const particles: Point3D[] = [];

        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
        for (let i = 0; i < particleCount; i++) {
            const y = 1 - (i / (particleCount - 1)) * 2; // y goes from 1 to -1
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            particles.push({
                x: x * baseRadius, y: y * baseRadius, z: z * baseRadius,
                baseX: x, baseY: y, baseZ: z
            });
        }

        const draw = () => {
            animationId = requestAnimationFrame(draw);

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const centerX = width / 2;
            const centerY = height / 2;

            // Clear with very slight trails for "neon" blur look
            ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
            ctx.fillRect(0, 0, width, height);

            // 1. Audio Data (AI)
            let aiVolume = 0;
            if (analyser) {
                analyser.getByteFrequencyData(aiDataArray);
                const sum = aiDataArray.reduce((a, b) => a + b, 0);
                aiVolume = sum / aiDataArray.length; // 0 - 255
            }

            // 2. Audio Data (User)
            let userVolume = 0;
            if (inputAnalyser) {
                inputAnalyser.getByteFrequencyData(textDataArray);
                const sumVal = textDataArray.reduce((a, b) => a + b, 0);
                userVolume = sumVal / textDataArray.length;
            }

            // Determine dominant source
            // We mix them so user speaking also disturbs the sphere
            const totalVolume = Math.max(aiVolume, userVolume * 1.5); // Boost user volume slightly
            const isActive = totalVolume > 5;
            const isUserMap = userVolume > aiVolume; // Track who is dominant for color

            const activeScale = isActive ? 1 + (totalVolume / 200) : 1;

            // Rotation speed increases with activity
            rotationY += 0.005 + (isActive ? 0.01 : 0);
            rotationX += 0.002;

            // 3. Draw Particles
            particles.forEach((p, i) => {
                // A. Rotate
                // Rotate around Y
                let x1 = p.baseX * Math.cos(rotationY) - p.baseZ * Math.sin(rotationY);
                let z1 = p.baseX * Math.sin(rotationY) + p.baseZ * Math.cos(rotationY);
                // Rotate around X
                let y1 = p.baseY * Math.cos(rotationX) - z1 * Math.sin(rotationX);
                let z2 = p.baseY * Math.sin(rotationX) + z1 * Math.cos(rotationX);

                // B. Apply Audio Distortion
                // Displace radius based on frequency data
                // We map particle index to frequency bin
                let freqVal = 0;
                if (isUserMap && inputAnalyser) {
                    const idx = i % textDataArray.length;
                    freqVal = textDataArray[idx];
                } else if (analyser) {
                    const idx = i % aiDataArray.length;
                    freqVal = aiDataArray[idx];
                }

                const displacement = (freqVal / 255) * 40 * activeScale;
                const currentRadius = baseRadius + (isActive ? displacement : 0);

                // Final 3D Position
                const x3d = x1 * currentRadius;
                const y3d = y1 * currentRadius;
                const z3d = z2 * currentRadius;

                // C. Project to 2D (Perspective)
                const fov = 300;
                const scale = fov / (fov + z3d + 200); // Add distance to camera
                const x2d = centerX + x3d * scale;
                const y2d = centerY + y3d * scale;

                // D. Draw
                const alpha = (z3d + baseRadius) / (baseRadius * 2); // 0 to 1 based on Z
                const size = Math.max(0.5, 2.5 * scale);

                ctx.beginPath();
                ctx.arc(x2d, y2d, size, 0, Math.PI * 2);

                // Colors: 
                // AI = Pink/Purple/Blue
                // User = Cyan/Blue/White
                if (isActive) {
                    let r, g, bColor;
                    if (isUserMap) {
                        // User Color: Cyan to White
                        r = 100 + (freqVal / 2);
                        g = 200 + (freqVal / 5);
                        bColor = 255;
                    } else {
                        // AI Color: Pink to Purple
                        r = 200 + (freqVal / 5);
                        g = 50 + (freqVal / 2);
                        bColor = 255;
                    }

                    ctx.fillStyle = `rgba(${r}, ${g}, ${bColor}, ${alpha})`;
                    // Only add glow to front particles for performance
                    if (alpha > 0.8) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = `rgba(${r}, ${g}, ${bColor}, 0.5)`;
                    } else {
                        ctx.shadowBlur = 0;
                    }
                } else {
                    ctx.fillStyle = `rgba(100, 180, 255, ${alpha * 0.5})`; // Idle Blue
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
                ctx.shadowBlur = 0; // Reset
            });

        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', updateSize);
        };
    }, [analyser, inputAnalyser, isConnected]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
        />
    );
};
