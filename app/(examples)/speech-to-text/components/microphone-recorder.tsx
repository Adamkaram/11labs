'use client';

import { Mic, Square } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface MicrophoneRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
}

export function MicrophoneRecorder({ onRecordingComplete, disabled = false }: MicrophoneRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        onRecordingComplete(audioFile);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-6">
      <div
        className={`hover:bg-muted/50 flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
          disabled ? 'cursor-not-allowed opacity-70' : ''
        }`}
      >
        {isRecording ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
            </div>
            <p className="mb-2 text-center text-lg font-medium">Recording... {formatTime(recordingTime)}</p>
            <button
              onClick={stopRecording}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              <span>Stop Recording</span>
            </button>
          </>
        ) : (
          <>
            <Mic className="text-primary/70 mb-4 h-12 w-12" />
            <p className="mb-2 text-center text-lg font-medium">Click to start recording</p>
            <button
              onClick={startRecording}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              <span>Start Recording</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
} 