import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Track } from "@/lib/types";
import Link from "next/link";

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  show: { opacity: 1, y: 0 },
};

export default function SearchCard({
  song,
  index,
}: {
  song: Track;
  index: number;
}) {
  return (
    <motion.div
      key={song.id}
      variants={itemVariants}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      custom={index}
    >
      <Card className="overflow-hidden cursor-pointer">
        <CardContent className="p-0">
          <Link href={`/play/${song.id}`}>
            <div className="flex items-center space-x-4">
              <img
                src={song.album.images[1].url}
                alt={`${song.name} album cover`}
                className="w-16 h-16 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-bold truncate">{song.name}</p>
                  {song.explicit && (
                    <span className="bg-gray-400 text-white text-xs font-bold px-1 rounded flex items-center justify-center min-w-[1.05rem] h-[1.05rem]">
                      E
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {song.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
