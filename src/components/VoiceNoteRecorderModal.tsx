import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Check,
  Plus,
  X,
  AlertCircle,
  Clock,
  Tag,
  ListTodo,
  RefreshCw,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventPlan, TimelineTask, TaskPhase, PriorityLevel } from '../types/event';
import { blobToBase64 } from '../utils/audioPcm';

interface VoiceNoteRecorderModalProps {
  plan: EventPlan;
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (newTask: TimelineTask) => void;
}

interface TranscribedResult {
  transcript: string;
  suggestedTask?: {
    title: string;
    category: string;
    duePhase: TaskPhase;
    priority: PriorityLevel;
    description: string;
  };
}

export const VoiceNoteRecorderModal: React.FC<VoiceNoteRecorderModalProps> = ({
  plan,
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<TranscribedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer counter
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Clean stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration upon close
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element inside modal
    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const visibleFocusables = (Array.from(focusables) as HTMLElement[]).filter((el) => el.offsetParent !== null);
        if (visibleFocusables.length > 0) {
          visibleFocusables[0].focus();
        }
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const visibleFocusables = (Array.from(focusables) as HTMLElement[]).filter((el) => el.offsetParent !== null);

        if (visibleFocusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = visibleFocusables[0];
        const lastElement = visibleFocusables[visibleFocusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Start recording microphone
  const startRecording = async () => {
    setErrorMessage(null);
    setResult(null);
    setIsAdded(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        handleTranscribeBlob(audioBlob, mimeType);
        // Stop stream tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : 'Could not access microphone.'
      );
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Transcribe audio using server endpoint (gemini-3.5-transcribe)
  const handleTranscribeBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const audioBase64 = await blobToBase64(blob);

      const response = await fetch('/api/voice/transcribe-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          eventContext: {
            title: plan.concept.title,
            city: plan.input.city,
            eventDate: plan.input.eventDate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: TranscribedResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error transcribing audio:', err);
      setErrorMessage(err?.message || 'Failed to transcribe voice note.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Add extracted task to checklist
  const handleCommitTask = () => {
    if (!result?.suggestedTask) return;

    const task: TimelineTask = {
      id: `task-voice-${Date.now()}`,
      title: result.suggestedTask.title || 'Voice Note Task',
      description: result.suggestedTask.description || result.transcript,
      category: result.suggestedTask.category || 'Operations',
      duePhase: result.suggestedTask.duePhase || '1 Week Before',
      priority: result.suggestedTask.priority || 'medium',
      isCompleted: false,
    };

    onAddTask(task);
    setIsAdded(true);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
    >
      <div ref={modalRef} className="relative w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="voice-modal-title" className="text-base font-bold text-slate-900">Voice Memo & Notes</h3>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-700 border border-indigo-100">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dictate ideas, supplier phone calls, or checklist follow-ups
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recording Center Stage */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-6 text-center space-y-4 shadow-xs">
          {/* Animated Mic Ring */}
          <div className="relative inline-flex items-center justify-center">
            {isRecording && (
              <span className="absolute h-24 w-24 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-md active:scale-95 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-rose-600/30 ring-4 ring-rose-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/25'
              }`}
            >
              {isRecording ? (
                <Square className="h-7 w-7 fill-white" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
          </div>

          {/* Status Label & Timer */}
          <div>
            {isRecording ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-rose-600 animate-pulse flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                  Recording Audio...
                </p>
                <p className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                  {formatTimer(recordingSeconds)}
                </p>
                <p className="text-xs text-slate-500">
                  Tap the square button when done speaking
                </p>
              </div>
            ) : isTranscribing ? (
              <div className="space-y-2 py-2">
                <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-900">
                  Transcribing & Analyzing with Gemini...
                </p>
                <p className="text-xs text-slate-500">
                  Extracting actionable event tasks from speech
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  Tap to Start Recording Voice Memo
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Example: "Just spoke with floral vendor, centerpieces will have white roses and eucalyptus, arrival at 11 AM."
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transcribed Results & Actionable Task Card */}
        {result && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Transcript Quote */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 text-xs">
              <span className="font-semibold text-slate-600 block mb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-600" />
                Audio Transcript:
              </span>
              <p className="text-slate-800 italic leading-relaxed">
                "{result.transcript}"
              </p>
            </div>

            {/* Extracted Task Preview Card */}
            {result.suggestedTask && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    AI-Extracted Checklist Task
                  </span>
                  <span className="rounded-md bg-white border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 shadow-2xs">
                    {result.suggestedTask.category}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {result.suggestedTask.title}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {result.suggestedTask.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>{result.suggestedTask.duePhase}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="capitalize">{result.suggestedTask.priority} priority</span>
                  </div>
                </div>

                {/* Add to Checklist Button */}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-end">
                  {isAdded ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <Check className="h-4 w-4" />
                      <span>Added to Checklist!</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCommitTask}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add to Checklist</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Processed securely with Gemini Audio AI</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
