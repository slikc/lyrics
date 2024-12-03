"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Track } from "@/lib/types";
import SearchCard from "@/components/searchcard";

export default function SpotifySearch() {
  const [songs, setSongs] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchSongs = useCallback(
    debounce(async (query: string) => {
      if (query.trim() === "") {
        setSongs([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setSongs(data.data.tracks.items);
      } catch (error) {
        console.error("Error searching songs:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10 pr-4 py-2 w-full"
          placeholder="Search for songs..."
          onChange={(e) => searchSongs(e.target.value)}
        />
      </div>
      {isLoading && (
        <div className="flex flex-col justify-center items-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
      <AnimatePresence>
        <motion.div
          layout
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {songs.map((song, index) => (
            <SearchCard key={song.id} song={song} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
