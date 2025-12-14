'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
    end: number;
    duration?: number;
}

export default function AnimatedCounter({ end, duration = 2000 }: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = timestamp - startTimeRef.current;
            const progressRatio = Math.min(progress / duration, 1);

            // Ease-out expo function for smooth deceleration
            // 1 - Math.pow(2, -10 * progressRatio)

            // Or simple Ease-out Quart
            const easeOutQuart = 1 - Math.pow(1 - progressRatio, 4);

            const nextCount = Math.floor(easeOutQuart * end);

            if (countRef.current !== nextCount) {
                setCount(nextCount);
                countRef.current = nextCount;
            }

            if (progressRatio < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure final value is exact
            }
        };

        if (end > 0) {
            startTimeRef.current = null;
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [end, duration]);

    return <>{count.toLocaleString()}</>;
}
