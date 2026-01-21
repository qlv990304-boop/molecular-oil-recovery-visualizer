import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  videoUrl: string | null;
  isLoading: boolean;
  progressMessage: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, isLoading, progressMessage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  return (
    <div className="w-full aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-900/5 relative group">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-slate-300 font-medium animate-pulse">{progressMessage}</p>
          <p className="text-xs text-slate-500 max-w-xs">Generating high-quality video with Veo. This may take a minute...</p>
        </div>
      ) : videoUrl ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded border border-white/10">
            AI Generated Animation
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-slate-600 bg-slate-100/50">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Video preview area</p>
          </div>
        </div>
      )}
    </div>
  );
};