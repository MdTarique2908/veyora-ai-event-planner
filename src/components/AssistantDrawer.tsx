import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  HelpCircle,
  Loader2,
  DollarSign,
  CloudRain,
  Music2,
  Users,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Radio,
  FileText,
} from 'lucide-react';
import { EventPlan } from '../types/event';
import { pcmFloat32ToBase64, playPcm24kChunk } from '../utils/audioPcm';
import { VeyoraIcon } from './VeyoraLogo';

interface AssistantDrawerProps {
  plan: EventPlan;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  plan,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'live'>('text');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: `Hello! I'm your Veyora Planning Consultant. I have full context of **${plan.concept.title}** (${plan.input.guestCount} guests in ${plan.input.city}, budget: ${plan.budgetPlan.currency} ${plan.budgetPlan.totalBudget.toLocaleString()}).\n\nAsk me anything in chat, or switch to **Live Voice Call** for real-time hands-free conversation with Gemini 3.8 Live!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live Voice Call State (gemini-3.8-live)
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<
    'idle' | 'connecting' | 'listening' | 'speaking' | 'muted' | 'error'
  >('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Live audio references
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackStateRef = useRef<{
    nextStartTime: number;
    activeSources: AudioBufferSourceNode[];
  }>({
    nextStartTime: 0,
    activeSources: [],
  });

  const isMicMutedRef = useRef(false);
  isMicMutedRef.current = isMicMuted;

  const QUICK_PROMPTS = [
    { label: '💰 Cut 15-20% from Catering', text: 'How can I trim 15-20% from our catering & beverage budget without guests noticing a drop in quality?' },
    { label: '☔ Rain & Weather Contingency', text: 'What is a realistic, step-by-step backup plan if weather turns bad on our celebration date?' },
    { label: '🧊 3 Fun Low-Cost Icebreakers', text: 'Suggest 3 high-energy but non-cringe icebreaker activities suitable for our guests.' },
    { label: '🍸 2 Signature Themed Mocktails', text: 'Give me 2 recipe concepts for signature mocktails that match our event theme and color palette.' },
  ];

  // Stop live call cleanup
  const handleEndCall = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      // Stop ongoing speech
      playbackStateRef.current.activeSources.forEach((s) => {
        try {
          s.stop();
        } catch {}
      });
      playbackStateRef.current.activeSources = [];
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    setIsCallActive(false);
    setCallStatus('idle');
    setAudioLevel(0);
  };

  // Close cleanup
  useEffect(() => {
    return () => {
      handleEndCall();
    };
  }, []);

  // Start Live Voice Call with Gemini 3.8 Live API
  const handleStartCall = async () => {
    setCallError(null);
    setCallStatus('connecting');
    setIsCallActive(true);

    try {
      // 1. Setup AudioContexts (16kHz for mic input, 24kHz for model output)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      playbackStateRef.current = { nextStartTime: 0, activeSources: [] };

      // 2. Request user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 3. Connect to server WebSocket at /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setCallStatus('listening');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            console.error('Live voice error from server:', msg.error);
            setCallError(msg.error);
            setCallStatus('error');
            return;
          }

          // Handle model audio playback (24kHz PCM chunks)
          if (msg.audio && outputAudioCtxRef.current) {
            setCallStatus('speaking');
            playPcm24kChunk(outputAudioCtxRef.current, msg.audio, playbackStateRef.current);
          }

          // Handle user interruption
          if (msg.interrupted) {
            setCallStatus('listening');
            playbackStateRef.current.activeSources.forEach((s) => {
              try {
                s.stop();
              } catch {}
            });
            playbackStateRef.current.activeSources = [];
            if (outputAudioCtxRef.current) {
              playbackStateRef.current.nextStartTime = outputAudioCtxRef.current.currentTime;
            }
          }
        } catch (e) {
          console.error('Error handling live message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('Live voice WebSocket error:', err);
        setCallError('WebSocket connection error to Live voice service.');
        setCallStatus('error');
      };

      ws.onclose = () => {
        setIsCallActive(false);
        setCallStatus('idle');
      };

      // 4. Capture 16kHz PCM audio and send to Live WebSocket
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMicMutedRef.current || ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Simple audio level meter calculation
        let sum = 0;
        for (let i = 0; i < inputData.length; i += 16) {
          sum += Math.abs(inputData[i]);
        }
        const avg = sum / (inputData.length / 16);
        setAudioLevel(Math.min(100, Math.round(avg * 400)));

        // Send 16-bit PCM Linear Base64 to Gemini Live
        const base64PCM = pcmFloat32ToBase64(inputData);
        ws.send(JSON.stringify({ audio: base64PCM }));
      };
    } catch (err: any) {
      console.error('Error starting live voice call:', err);
      setCallError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access.'
          : err?.message || 'Could not connect to microphone.'
      );
      setCallStatus('error');
      setIsCallActive(false);
    }
  };

  // Text message send
  const handleSendMessage = async (textToSend?: string) => {
    const question = textToSend || inputQuestion.trim();
    if (!question || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/plan/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          planContext: {
            title: plan.concept.title,
            eventType: plan.input.eventType,
            guestCount: plan.input.guestCount,
            totalBudget: plan.budgetPlan.totalBudget,
            currency: plan.budgetPlan.currency,
            city: plan.input.city,
            themeStyle: plan.input.themeStyle,
          },
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I am ready to help refine your event plan. Please feel free to ask another question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed getting AI advice', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I could not reach the server right now. Here is a general tip: prioritize spending where guests interact directly (food, music, warmth/seating), and minimize single-use disposable decorations.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-stone-200 shadow-2xl animate-fade-in">
        {/* Drawer Header with Mode Switcher */}
        <div className="border-b border-stone-200 px-5 py-4 bg-stone-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172033] border border-[#E8D4A8]/40 shadow-xs">
                <VeyoraIcon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Veyora Consultant</h3>
                <p className="text-[11px] text-[#8C6D2C] dark:text-[#E8D4A8] font-medium">Every occasion, extraordinary.</p>
              </div>
            </div>

            <button
              onClick={() => {
                handleEndCall();
                onClose();
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
              <span>Chat Advice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className={`h-3.5 w-3.5 ${activeTab === 'live' ? 'text-amber-300 animate-pulse' : 'text-slate-400'}`} />
              <span>Live Voice Call</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TEXT CHAT MODE */}
        {activeTab === 'text' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#faf9f6]">
            {/* Quick Prompts Bar */}
            <div className="border-b border-stone-200 bg-stone-50/80 p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Suggested Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp.text)}
                    disabled={isLoading}
                    className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-900 transition-all text-left truncate max-w-full disabled:opacity-50 shadow-2xs cursor-pointer"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-xs'
                        : 'border border-stone-200 bg-white text-slate-800 rounded-bl-sm whitespace-pre-wrap shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-1 text-[10px] text-slate-400 font-medium px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Consulting planner knowledge base...</span>
                </div>
              )}
            </div>

            {/* Input Field */}
            <div className="border-t border-stone-200 p-4 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ask anything about budget, food, timing..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputQuestion.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE VOICE CALL MODE (gemini-3.8-live) */}
        {activeTab === 'live' && (
          <div className="flex-1 flex flex-col justify-between p-6 space-y-6 overflow-y-auto bg-white">
            {/* Call Status Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs text-indigo-700 font-mono font-semibold">
                <Radio className="h-3 w-3 text-indigo-600 animate-pulse" />
                <span>Gemini 3.8 Live API Audio Stream</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Hands-Free Celebration Consultant
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Brainstorm themes, solve vendor disputes, and talk through logistics in low-latency spoken dialogue.
              </p>
            </div>

            {/* Center Stage: Interactive Voice Sphere Visualizer */}
            <div className="flex flex-col items-center justify-center py-6 space-y-5">
              <div className="relative flex items-center justify-center">
                {/* Pulsing rings when connected */}
                {isCallActive && callStatus !== 'error' && (
                  <>
                    <span
                      className="absolute rounded-full bg-indigo-500/10 transition-all duration-150"
                      style={{
                        width: `${120 + audioLevel * 1.2}px`,
                        height: `${120 + audioLevel * 1.2}px`,
                      }}
                    />
                    <span
                      className="absolute rounded-full bg-indigo-600/5 transition-all duration-150"
                      style={{
                        width: `${160 + audioLevel * 1.8}px`,
                        height: `${160 + audioLevel * 1.8}px`,
                      }}
                    />
                  </>
                )}

                {/* Main Call Action Disc */}
                <div
                  className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full transition-all shadow-md border-2 ${
                    isCallActive
                      ? callStatus === 'speaking'
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-indigo-500/30 ring-4 ring-indigo-100'
                        : 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-stone-200 bg-stone-50 text-slate-400'
                  }`}
                >
                  {isCallActive ? (
                    callStatus === 'speaking' ? (
                      <Volume2 className="h-10 w-10 animate-bounce" />
                    ) : (
                      <Mic className="h-10 w-10 animate-pulse text-indigo-600" />
                    )
                  ) : (
                    <PhoneCall className="h-10 w-10" />
                  )}
                </div>
              </div>

              {/* Dynamic Status Indicator */}
              <div className="text-center space-y-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider block ${
                    callStatus === 'speaking'
                      ? 'text-indigo-700'
                      : callStatus === 'listening'
                      ? 'text-emerald-700'
                      : callStatus === 'connecting'
                      ? 'text-amber-700'
                      : callStatus === 'error'
                      ? 'text-rose-700'
                      : 'text-slate-500'
                  }`}
                >
                  {callStatus === 'speaking'
                    ? '🗣️ Consultant is speaking...'
                    : callStatus === 'listening'
                    ? isMicMuted
                      ? '🔇 Microphone is Muted'
                      : '🎙️ Listening (Speak now)...'
                    : callStatus === 'connecting'
                    ? 'Connecting to Live Voice Stream...'
                    : callStatus === 'error'
                    ? 'Connection Alert'
                    : 'Call Offline'}
                </span>

                {isCallActive && callStatus === 'listening' && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Speak naturally — you can interrupt at any moment
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {callError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                {callError}
              </div>
            )}

            {/* Live Call Control Actions */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              {isCallActive ? (
                <div className="flex items-center justify-center gap-3">
                  {/* Mute Button */}
                  <button
                    type="button"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      isMicMuted
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{isMicMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span>End Call</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Start Live Voice Conversation</span>
                </button>
              )}

              <p className="text-[10px] text-center text-slate-500 font-medium">
                Streams full-duplex 16kHz mic input & 24kHz model speech with interruption support.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
