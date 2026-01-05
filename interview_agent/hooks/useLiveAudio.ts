import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToArrayBuffer } from '../utils/audioUtils';
import { TranscriptionItem } from '../types';

interface UseLiveAudioReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (instruction: string) => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
  inputAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  transcripts: TranscriptionItem[];
  streamingTranscript: { text: string; sender: 'user' | 'model' } | null;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useLiveAudio(): UseLiveAudioReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [streamingTranscript, setStreamingTranscript] = useState<{ text: string; sender: 'user' | 'model' } | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Audio Contexts and Nodes
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // State for streaming
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // We track the promise to allow cleanup before it resolves
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const currentInputTransRef = useRef<string>("");
  const currentOutputTransRef = useRef<string>("");

  const disconnect = useCallback(async () => {
    // 1. Cleanup Audio Processing (Stop sending data)
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
    }

    // 2. Cleanup Audio Contexts
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      try { await inputAudioContextRef.current.close(); } catch (e) { console.error(e); }
    }
    inputAudioContextRef.current = null;

    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      try { await outputAudioContextRef.current.close(); } catch (e) { console.error(e); }
    }
    outputAudioContextRef.current = null;

    // 3. Cleanup Audio Sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    sourcesRef.current.clear();

    // 4. Cleanup Media Stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 5. Cleanup Gemini Session
    if (sessionPromiseRef.current) {
      const promise = sessionPromiseRef.current;
      sessionPromiseRef.current = null; // Detach immediately

      promise.then(session => {
        try {
          session.close();
          console.log("Session closed successfully");
        } catch (e) {
          console.warn("Error closing session:", e);
        }
      }).catch(e => {
        // If the connection failed, we don't need to close it, but we suppress the unhandled rejection logging here if needed
        console.log("Session promise failed during disconnect:", e);
      });
    }

    // 5. Reset State
    setIsConnected(false);
    setIsConnecting(false);
    setStreamingTranscript(null);
    setIsMuted(false);
    currentInputTransRef.current = "";
    currentOutputTransRef.current = "";
  }, []);

  const toggleMute = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const connect = useCallback(async (instruction: string) => {
    if (!process.env.API_KEY) {
      setError("API Key not found.");
      return;
    }

    // Ensure clean state before starting
    await disconnect();

    try {
      setIsConnecting(true);
      setError(null);

      // Initialize Audio Contexts
      // We use a lower sample rate for input (16kHz) as required by Gemini Live PCM
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Initialize Analysers for Visualizer
      inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
      inputAnalyserRef.current.fftSize = 256;
      inputAnalyserRef.current.smoothingTimeConstant = 0.5; // Smoother

      outputAnalyserRef.current = outputAudioContextRef.current.createAnalyser();
      outputAnalyserRef.current.fftSize = 256;
      outputAnalyserRef.current.smoothingTimeConstant = 0.5;

      // Connect Output Analyser to Destination
      const outputGain = outputAudioContextRef.current.createGain();
      outputGain.connect(outputAnalyserRef.current);
      outputAnalyserRef.current.connect(outputAudioContextRef.current.destination);

      // Initialize Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Resume context if suspended (browser autoplay policy)
      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      // Create Session Promise
      // We store this immediately so we can close it if the user hits "End" while connecting
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: instruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setIsConnected(true);
            setIsConnecting(false);

            if (!inputAudioContextRef.current || !stream) return;

            // Setup Input Pipeline
            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            inputSourceRef.current.connect(inputAnalyserRef.current!);

            // ScriptProcessor for PCM extraction
            // Buffer size 4096 gives ~0.25s latency at 16kHz, good balance for stability vs speed
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);

              // Send to Gemini using the resolved session
              // This ensures we don't use a stale session or one that's being closed
              sessionPromise.then(session => {
                // Only send if this is still the active session reference
                if (sessionPromiseRef.current === sessionPromise) {
                  session.sendRealtimeInput({ media: pcmBlob });
                }
              }).catch(err => {
                // Session might have been closed or connection failed
                // console.debug("Send failed", err);
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;

            // CRITICAL FIX: Commit user transcript immediately when model starts responding
            // preventing the user text from disappearing while model speaks.
            const isModelResponse = serverContent?.modelTurn || serverContent?.outputTranscription;
            if (isModelResponse && currentInputTransRef.current) {
              const userText = currentInputTransRef.current;
              setTranscripts(prev => [...prev, { text: userText, sender: 'user', timestamp: Date.now() }]);
              currentInputTransRef.current = "";

              // If there's no output transcription yet (just audio), clear streaming so it doesn't duplicate
              if (!serverContent?.outputTranscription) {
                setStreamingTranscript(null);
              }
            }

            // Handle Transcriptions
            if (serverContent?.outputTranscription) {
              currentOutputTransRef.current += serverContent.outputTranscription.text;
              setStreamingTranscript({ text: currentOutputTransRef.current, sender: 'model' });
            } else if (serverContent?.inputTranscription) {
              currentInputTransRef.current += serverContent.inputTranscription.text;
              setStreamingTranscript({ text: currentInputTransRef.current, sender: 'user' });
            }

            if (serverContent?.turnComplete) {
              const userText = currentInputTransRef.current;
              const modelText = currentOutputTransRef.current;

              if (userText) {
                setTranscripts(prev => [...prev, { text: userText, sender: 'user', timestamp: Date.now() }]);
                currentInputTransRef.current = "";
              }
              if (modelText) {
                setTranscripts(prev => [...prev, { text: modelText, sender: 'model', timestamp: Date.now() }]);
                currentOutputTransRef.current = "";
              }

              setStreamingTranscript(null);
            }

            // Handle Audio Output
            const base64Audio = serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              // Ensure consistent playback timing
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              const audioBytes = new Uint8Array(base64ToArrayBuffer(base64Audio));
              const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputGain);

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                s.stop();
                sourcesRef.current.delete(s);
              });
              nextStartTimeRef.current = 0;

              if (streamingTranscript?.sender === 'model') {
                setStreamingTranscript(null);
                currentOutputTransRef.current = "";
              }
            }
          },
          onclose: () => {
            console.log("Session Closed");
            setIsConnected(false);
            setStreamingTranscript(null);
          },
          onerror: (e) => {
            console.error("Gemini Live API Error:", e);
            setError("Connection failed. Check network or API Key.");
            setIsConnected(false);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      await sessionPromise;

    } catch (err: any) {
      console.error("Connection Error caught in connect:", err);
      // Only set error if we are still trying to connect (and haven't been disconnected intentionally)
      if (isConnecting) {
        setError(err.message || "Failed to establish connection.");
        setIsConnecting(false);
      }
    }
  }, [disconnect, isConnecting, streamingTranscript]); // streamingTranscript safe to include

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
    inputAnalyser: inputAnalyserRef.current,
    outputAnalyser: outputAnalyserRef.current,
    transcripts,
    streamingTranscript,
    isMuted,
    toggleMute
  };
}