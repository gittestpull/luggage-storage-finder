'use client';

import { useEffect, useState, useRef } from 'react';

const CODE_SNIPPETS = [
    `#include <iostream>
using namespace std;

class SystemKernal {
    public:
    void init() {
        cout << "Initializing system kernel..." << endl;
        memory_allocate(0xFF0022);
    }
};`,
    `function encrypt(data) {
    let key = 0xAF;
    return data.map(byte => byte ^ key);
}`,
    `SELECT * FROM users WHERE access_level = 'ADMIN';
-- Access Granted`,
    `[root@linux ~]# nmap -sS -O 192.168.1.1
Starting Nmap 7.80
Nmap scan report for gateway (192.168.1.1)
Host is up (0.0012s latency).
Not shown: 997 closed ports`,
    `const matrix = [];
for (let i = 0; i < 100; i++) {
    matrix.push(new Array(100).fill(0));
}
// Matrix loaded`,
    `Downloading payload...
[####################################] 100%
Payload injected successfully.`,
    `import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 8080))
s.send(b'GET / HTTP/1.1\\r\\n')`
];

export default function HackerTyperPage() {
    const [content, setContent] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsVisible(true);
        inputRef.current?.focus();
    }, []);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [content]);

    const handleInteraction = () => {
        // Generate random chunk of code
        const snippet = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
        const chars = snippet.split('');
        const chunkLength = Math.floor(Math.random() * 5) + 3; // Type 3-8 chars at a time

        // Simulating the "typing" effect by just appending chunks of predefined code
        // For a more "hacker typer" feel, we simply append a slice of the current snippet 
        // or just append random snippets. Real hacker typer appends code sequentially.
        // Let's implement a sequential buffer approach for better realism.
    };

    // Better approach: maintain a buffer of code to type
    const codeBufferRef = useRef(CODE_SNIPPETS.join('\n\n\n'));
    const cursorRef = useRef(0);

    const typeCode = () => {
        const charCount = 3; // How many chars to type per keypress
        const nextChars = codeBufferRef.current.slice(cursorRef.current, cursorRef.current + charCount);

        if (cursorRef.current >= codeBufferRef.current.length) {
            cursorRef.current = 0; // Loop
        } else {
            cursorRef.current += charCount;
        }

        setContent(prev => prev + nextChars);
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent | KeyboardEvent) => {
        // Allow F11 to work naturally for browser fullscreen
        if (e.key === 'F11') return;

        if (e.key === 'Escape') {
            // If in browser fullscreen, let browser handle it.
            // If just in our overlay mode, maybe ask confirmation or show exit hint?
            // For now, let's just make sure typing doesn't block escape.
            return;
        }

        typeCode();
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClick = () => {
        inputRef.current?.focus();
        typeCode(); // Also type on click for mobile/easy access
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black text-green-500 font-mono p-4 overflow-hidden cursor-text"
            onClick={handleClick}
        >
            <style jsx global>{`
                /* Hide scrollbar when in this mode to prevent double scrolls */
                body {
                    overflow: hidden;
                }
            `}</style>

            {/* Hidden input for mobile keyboard support */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute top-0 left-0 w-full h-full cursor-none"
                autoFocus
                onChange={() => typeCode()} // Handle mobile virtual keyboard input
            />

            {/* Controls Overlay */}
            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleFullScreen(); }}
                    className="bg-green-900/30 hover:bg-green-900/50 text-green-500 border border-green-500/30 px-3 py-1 text-xs rounded transition-colors"
                >
                    [ FULLSCREEN ]
                </button>
                <a
                    href="/news"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-500 border border-red-500/30 px-3 py-1 text-xs rounded transition-colors no-underline"
                >
                    [ EXIT ]
                </a>
            </div>

            <div className="relative z-10 whitespace-pre-wrap break-words text-lg md:text-xl leading-relaxed h-full overflow-y-auto pb-10" ref={scrollContainerRef}>
                {content}
                <span className="inline-block w-3 h-6 bg-green-500 ml-1 animate-pulse"></span>
                {/* Auto-scroll anchor */}
                <div className="h-4" />
            </div>

            {/* Overlay hint */}
            {!content && (
                <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none text-green-800 opacity-50">
                    <div className="text-6xl mb-4">☠️</div>
                    <p className="text-2xl animate-pulse">PRESS ANY KEY TO HACK</p>
                    <p className="text-sm mt-4 font-mono opacity-70">Access Level: UNRESTRICTED</p>
                </div>
            )}
        </div>
    );
}
