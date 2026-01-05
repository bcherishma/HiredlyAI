import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Mic, Wifi, WifiOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function OnboardingChatPage() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi there! I'm Hiredly AI assistant. I'm here to help you build a professional profile that stands out. Shall we get started? Begin with your name",
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
    const [userId, setUserId] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Session Initialization
    useEffect(() => {
        const initSession = async () => {
            try {
                // 1. Get or Create User ID
                let storedUserId = localStorage.getItem('user_id');
                if (!storedUserId) {
                    storedUserId = `user-${Date.now()}`;
                    localStorage.setItem('user_id', storedUserId);
                }
                setUserId(storedUserId);

                // 2. Create Session ID
                const newSessionId = `session-${Date.now()}`;
                setSessionId(newSessionId);

                console.log(`[Init] UserID: ${storedUserId}, SessionID: ${newSessionId}`);

                // 3. Create Session on Backend (Proxy)
                const response = await fetch('http://localhost:8000/api/init_session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        appName: "resume_agent",
                        userId: storedUserId,
                        sessionId: newSessionId
                    })
                });

                if (response.ok) {
                    setIsConnected(true);
                    console.log('[Init] Session created successfully');
                } else {
                    console.error('[Init] Failed to create session:', await response.text());
                }
            } catch (error) {
                console.error('[Init] Error creating session:', error);
            }
        };

        initSession();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Your browser does not support speech recognition. Please try Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const handleMicClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessageText = inputValue.trim();
        const newMessage = {
            id: Date.now(),
            text: userMessageText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        if (!isConnected || !userId || !sessionId) {
            console.warn('[Chat] Not connected to agent. Message not sent.');
            const errorMessage = {
                id: Date.now() + 1,
                text: "I'm having trouble connecting to the server. Please try again in a moment.",
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        try {
            console.log('[Chat] Sending message:', userMessageText);
            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessageText,
                    appName: "resume_agent",
                    userId: userId,
                    sessionId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[Chat] Response received:', data);

            // Extract agent response
            // The response is an array, we want the first item's content.parts[0].text
            if (Array.isArray(data) && data.length > 0 && data[0].content && data[0].content.parts && data[0].content.parts.length > 0) {
                let agentText = data[0].content.parts[0].text;

                // Check for completion tag
                if (agentText.includes('[ONBOARDING_COMPLETE]')) {
                    setIsOnboardingComplete(true);
                    agentText = agentText.replace('[ONBOARDING_COMPLETE]', '').trim();
                }

                const aiResponse = {
                    id: Date.now() + 1,
                    text: agentText,
                    sender: 'ai',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, aiResponse]);
            } else {
                console.error('[Chat] Unexpected response format:', data);
            }

        } catch (error) {
            console.error('[Chat] Error sending message:', error);
            const errorResponse = {
                id: Date.now() + 1,
                text: "Sorry, I encountered an error processing your message.",
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorResponse]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col selection:bg-blue-500 selection:text-white">
            <Navbar showAuthButtons={false} />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden pt-20">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[10%] left-[25%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]" />
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-4 py-6 md:px-0 relative z-10 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    {/* Connection Status Indicator */}
                    <div className="absolute top-4 right-4 z-50">
                        {isConnected ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-medium text-green-400">Agent Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full backdrop-blur-md">
                                <WifiOff className="w-3 h-3 text-red-400" />
                                <span className="text-xs font-medium text-red-400">Disconnected</span>
                            </div>
                        )}
                    </div>

                    <div className="max-w-3xl mx-auto space-y-6 pb-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'ai'
                                    ? 'bg-gradient-to-tr from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20'
                                    : 'bg-gray-700'
                                    }`}>
                                    {msg.sender === 'ai' ? (
                                        <Sparkles className="w-5 h-5 text-white" />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-300" />
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed relative ${msg.sender === 'ai'
                                        ? 'bg-gray-800/80 backdrop-blur border border-gray-700/50 text-gray-100 rounded-tl-none'
                                        : 'bg-blue-600/90 text-white shadow-md shadow-blue-500/10 rounded-tr-none'
                                        }`}>
                                        <div className="markdown-content">
                                            <ReactMarkdown
                                                components={{
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-blue-200" {...props} />
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1.5 px-1">{msg.timestamp}</span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 z-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-end gap-3">
                            <form onSubmit={handleSendMessage} className="flex-1 relative flex items-end gap-2 p-2 rounded-2xl bg-gray-800 border border-gray-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-lg">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                    placeholder={isRecording ? "Listening..." : "Type or speak your message here..."}
                                    disabled={isRecording}
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 border-none focus:ring-0 resize-none py-3 max-h-32 min-h-[44px]"
                                    rows="1"
                                />

                                {inputValue.trim() ? (
                                    <button type="submit" className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                                        <Send className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleMicClick}
                                        className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 ${isRecording
                                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse'
                                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
                                            }`}
                                    >
                                        <Mic className={`w-5 h-5 ${isRecording ? 'animate-bounce' : ''}`} />
                                    </button>
                                )}
                            </form>

                            {/* Proceed Button (Inline) */}
                            <button
                                onClick={async () => {
                                    // Send hidden system message to agent to save partial data
                                    try {
                                        await fetch('http://localhost:8000/api/chat', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                message: "SYSTEM_INSTRUCTION: User clicked proceed. Save partial data immediately.",
                                                appName: "resume_agent",
                                                userId: userId,
                                                sessionId: sessionId
                                            })
                                        });
                                    } catch (e) {
                                        console.error("Failed to trigger save", e);
                                    }
                                    navigate('/dashboard');
                                }}
                                className="shrink-0 mb-1 px-6 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all transform hover:scale-105"
                            >
                                <span className="hidden sm:inline">Proceed to Dashboard</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-3">
                            Hiredly AI can make mistakes. Verify important information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Proceed Button */}


        </div>
    );
}

export default OnboardingChatPage;
