"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2 } from "lucide-react";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  progress: number;
  duration: number;
  onSeek: (progress: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onPlayPause,
  progress,
  duration,
  onSeek,
  volume,
  onVolumeChange,
}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const element = document.getElementById("player-controls");
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;

      const distance = Math.abs(e.clientY - centerY);

      // max distance to show controls
      const maxDistance = 200;
      const newOpacity = Math.max(0, 1 - distance / maxDistance);
      setOpacity(newOpacity);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      id="player-controls"
      className="flex items-center justify-between p-4 my-auto"
      style={{
        opacity,
        transition: "opacity 0.2s ease-out",
      }}
    >
      <button onClick={onPlayPause} className="text-foreground">
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>

      <div className="flex-grow mx-4">
        <input
          type="range"
          min={0}
          max={duration}
          value={progress}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center">
        <Volume2 size={18} className="mr-2 text-muted-foreground" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-24"
        />
      </div>
    </motion.div>
  );
};
