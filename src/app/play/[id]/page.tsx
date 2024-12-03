"use client";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Loader2, Play, Volume2 } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { audio } from "framer-motion/client";
import { PlayerControls } from "@/components/controls";

interface Syllable {
  Text: string;
  StartTime: number;
  EndTime: number;
  IsPartOfWord: boolean;
}

interface VocalLine {
  Syllables: Syllable[];
  StartTime: number;
  EndTime: number;
}

interface Content {
  Type: string;
  Lead: VocalLine;
  Background?: VocalLine[];
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [lyrics, setLyrics] = useState<any>(null);
  const [trackId, setTrackId] = useState<string>(id);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentVerse, setCurrentVerse] = useState<string[]>([]);
  const [backgroundText, setBackgroundText] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);
  const [nextVerseTime, setNextVerseTime] = useState<number | null>(null);
  const [nextWordTime, setNextWordTime] = useState<number | null>(null);
  const [isBehindTickRate, setIsBehindTickRate] = useState<boolean>(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSecondStageLoading, setIsSecondStageLoading] =
    useState<boolean>(true);
  const [useTextStart, setUseTextStart] = useState(false);
  const [maxLyricsLength, setMaxLyricsLength] = useState(0);
  const [trackData, setTrackData] = useState<any>(null);
  const [isAlbumMoved, setIsAlbumMoved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const [hasFetchedStream, setHasFetchedStream] = useState(false);

  useEffect(() => {
    const fetchSong = async () => {
      if (!id || hasFetchedStream) return; // dont send twice

      setHasFetchedStream(true); // set to true

      try {
        const cachedData = localStorage.getItem(trackId);
        if (cachedData) {
          const { expires, url } = JSON.parse(cachedData);
          if (expires > Date.now()) {
            setStreamUrl(url);
            setIsLoading(false);
            return;
          }
        }

        const response = await fetch("/api/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await response.json();
        if (data.stream_url) {
          const expires = Date.now() + 6 * 60 * 60 * 1000; // 6 hours in ms
          localStorage.setItem(
            trackId,
            JSON.stringify({ url: data.stream_url, expires })
          );
          setStreamUrl(data.stream_url);
        }
      } catch (error) {
        console.error("Error fetching stream:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchLyrics = async () => {
      if (id) {
        const response = await fetch(`/api/lyrics?id=${trackId}`);
        const data = await response.json();
        if (!data.success) {
          setLyrics(null);
          setIsLoading(false);
        } else {
          setData(data.data);
          setLyrics(data.data);
        }
      }
    };

    const fetchSongData = async () => {
      if (id) {
        const response = await fetch(`/api/track?id=${trackId}`);
        const data = await response.json();
        if (data.success) {
          setTrackData(data.data);
          console.log(data.data);
        }
      }
    };

    fetchSong();
    fetchLyrics();
    fetchSongData();
  }, [id, trackId, hasFetchedStream]);

  useEffect(() => {
    if (streamUrl && audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.load(); // reload audio source to make sure we remove old srcs

      const setupAudioListeners = () => {
        audioRef.current?.addEventListener("play", () =>
          console.log("Audio started playing")
        );
        audioRef.current?.addEventListener("pause", () =>
          console.log("Audio paused")
        );
        audioRef.current?.addEventListener("seeking", () =>
          console.log("Audio seeking")
        );
        audioRef.current?.addEventListener("seeked", () =>
          console.log("Audio seeked")
        );
        audioRef.current?.addEventListener("stalled", () =>
          console.log("Audio stalled")
        );
        audioRef.current?.addEventListener("suspend", () =>
          console.log("Audio suspended")
        );
        audioRef.current?.addEventListener("waiting", () =>
          console.log("Audio waiting")
        );
        audioRef.current?.addEventListener("error", (e) =>
          console.log("Audio error:", e)
        );
      };

      setupAudioListeners();

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current.load();
        }
      };
    }
  }, [streamUrl]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !data) return;

    const updateState = () => {
      if (audioElement.currentTime !== undefined) {
        setCurrentTime(audioElement.currentTime);
        const now = Date.now();
        setIsBehindTickRate(now - lastUpdateTimeRef.current > 50);
        lastUpdateTimeRef.current = now;
      }

      const currentContent = data.Content.find((content: Content) => {
        return (
          content.Lead.StartTime <= audioElement.currentTime &&
          content.Lead.EndTime >= audioElement.currentTime
        );
      });

      if (currentContent) {
        const visibleSyllables = currentContent.Lead.Syllables.filter(
          (syllable: Syllable) => syllable.StartTime <= audioElement.currentTime
        );
        setCurrentVerse(
          visibleSyllables.map(
            (s: Syllable, index: number, arr: Syllable[]) => {
              const text = s.Text.toLowerCase();
              return (
                text + (s.IsPartOfWord && index < arr.length - 1 ? "" : " ")
              );
            }
          )
        );

        if (currentContent.Background && currentContent.Background.length > 0) {
          const visibleBackground =
            currentContent.Background[0].Syllables.filter(
              (syllable: Syllable) =>
                syllable.StartTime <= audioElement.currentTime
            );
          setBackgroundText(
            visibleBackground.map(
              (s: Syllable, index: number, arr: Syllable[]) => {
                const text = s.Text.toLowerCase();
                return (
                  text + (s.IsPartOfWord && index < arr.length - 1 ? "" : " ")
                );
              }
            )
          );
        } else {
          setBackgroundText([]);
        }

        const nextVerseContent = data.Content.find(
          (content: Content) =>
            content.Lead.StartTime > audioElement.currentTime
        );
        setNextVerseTime(
          nextVerseContent
            ? nextVerseContent.Lead.StartTime - audioElement.currentTime
            : null
        );

        const nextWord = currentContent.Lead.Syllables.find(
          (syllable: Syllable) =>
            syllable.StartTime > audioElement.currentTime &&
            syllable.IsPartOfWord
        );
        setNextWordTime(
          nextWord ? nextWord.StartTime - audioElement.currentTime : null
        );
      } else {
        setCurrentVerse([]);
        setBackgroundText([]);
        setNextVerseTime(null);
        setNextWordTime(null);
      }

      animationFrameRef.current = requestAnimationFrame(updateState);
    };

    updateState();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioRef.current) {
        audioRef.current.removeEventListener("play", () =>
          console.log("Audio started playing")
        );
        audioRef.current.removeEventListener("pause", () =>
          console.log("Audio paused")
        );
        audioRef.current.removeEventListener("seeking", () =>
          console.log("Audio seeking")
        );
        audioRef.current.removeEventListener("seeked", () =>
          console.log("Audio seeked")
        );
        audioRef.current.removeEventListener("stalled", () =>
          console.log("Audio stalled")
        );
        audioRef.current.removeEventListener("suspend", () =>
          console.log("Audio suspended")
        );
        audioRef.current.removeEventListener("waiting", () =>
          console.log("Audio waiting")
        );
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [data]);

  useEffect(() => {
    if (data) {
      const maxLength = Math.max(
        ...data.Content.map(
          (content: Content) =>
            content.Lead.Syllables.map((s: Syllable) => s.Text).join("").length
        )
      );
      setMaxLyricsLength(maxLength);
    }
  }, [data]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
    };
  }, []);

  const formatTime = (time: number | null) => {
    if (time === null) return "N/A";
    return time.toFixed(3) + "s";
  };

  const handlePlay = () => {
    setIsSecondStageLoading(false);
    if (audioRef.current) {
      if (!audioRef.current.src) {
        audioRef.current.src = streamUrl || "";
        audioRef.current.load();
      }
      audioRef.current.play().catch((error) => {
        console.log("Playback was prevented:", error);
        // reload audio to fix not supported error
        if (error.name === "NotSupportedError" && audioRef.current) {
          audioRef.current.src = streamUrl || "";
          audioRef.current.load();
          audioRef.current
            .play()
            .catch((e) => console.error("Retry failed:", e));
        }
      });
      setIsPlayingAudio(true);
    }
  };

  const handleSeek = (newProgress: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
      setProgress(newProgress);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // audioRef.current?.pause();
      } else {
        // when becoming visible, ensure the audio source is set
        if (audioRef.current && !audioRef.current.src && streamUrl) {
          audioRef.current.src = streamUrl;
          audioRef.current.load();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [streamUrl]);

  useEffect(() => {
    if ("mediaSession" in navigator && trackData) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackData.name,
        artist: trackData.artists.map((artist: any) => artist.name).join(", "),
        album: "fake spotify",
        artwork: [
          {
            src: trackData.album.images[0]?.url || "default-image.jpg",
            sizes: "300x300",
            type: "image/jpeg",
          },
        ],
      });
    }
  }, [trackData]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative">
      {isLoading && trackData && (
        <div className="flex flex-col my-auto items-center relative">
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <Loader2 className="animate-spin text-white" size={48} />
          </div>
          <Image
            src={trackData?.album.images[0].url}
            width={300}
            height={300}
            alt="Album Art"
            className="rounded-full opacity-50"
          />
        </div>
      )}
      {!isLoading && isSecondStageLoading && trackData && (
        <div className="absolute flex flex-col items-center">
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <button
              onClick={handlePlay}
              className="text-white hover:text-primary-foreground transition-colors"
              aria-label="Play"
            >
              <Play size={48} />
            </button>
          </div>
          <Image
            src={trackData?.album.images[0].url}
            width={300}
            height={300}
            alt="Album Art"
            className="rounded-full album-art"
          />
        </div>
      )}
      <div className="absolute top-4 left-4 text-left text-sm p-2 rounded">
        <div>
          Song Status:{" "}
          {isLoading
            ? "Loading..."
            : isSecondStageLoading
            ? "Ready to Play"
            : isPlayingAudio
            ? "Playing"
            : "Paused"}
        </div>
        <div>time next verse: {formatTime(nextVerseTime)}</div>
        <div>time next word: {formatTime(nextWordTime)}</div>
        <div>current time: {formatTime(currentTime)}</div>
      </div>
      {isPlayingAudio ? (
        <div className={cn("text-center", useTextStart && "text-left")}>
          <div className={cn("text-4xl font-bold mb-4 min-h-[4rem]")}>
            {currentVerse.join("")}
          </div>
          <div className={cn("text-lg text-muted-foreground min-h-[2rem]")}>
            {backgroundText.join("")}
          </div>
        </div>
      ) : (
        <div className={cn("text-center", useTextStart && "text-left")}>
          <div
            className={cn(
              "text-4xl font-bold mb-4 min-h-[4rem] text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground bg-[length:4px_1px] bg-repeat-x [background-position-y:90%]"
            )}
          >
            {currentVerse.join("")}
          </div>
          <div
            className={cn(
              "text-xl min-h-[2rem] text-transparent bg-clip-text bg-gradient-to-r from-muted-foreground to-muted-foreground bg-[length:4px_1px] bg-repeat-x [background-position-y:90%]"
            )}
          >
            {backgroundText.join("")}
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 bg-background">
        <PlayerControls
          isPlaying={isPlayingAudio}
          onPlayPause={() => {
            if (audioRef.current) {
              if (isPlayingAudio) {
                audioRef.current.pause();
              } else {
                audioRef.current.play();
              }
              setIsPlayingAudio(!isPlayingAudio);
            }
          }}
          progress={progress}
          duration={duration}
          onSeek={handleSeek}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      </div>
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
      />
    </div>
  );
}
