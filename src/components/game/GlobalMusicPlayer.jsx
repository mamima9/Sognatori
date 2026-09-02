import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  {
    name: "Dream Arena",
    url: "/audio/002Sognatori - Dream Arena.mp3",
  },
  {
    name: "Sognatori Awakes",
    url: "/audio/Sognatori Awakes.mp3",
  },
  {
    name: "Sognatori Overture",
    url: "/audio/Sognatori Overture.mp3",
  },
  {
    name: "Dream Creature Path",
    url: "/audio/Dream Creature Path.mp3",
  },
  {
    name: "Lantern Deer",
    url: "/audio/Lantern Deer.mp3",
  },
  {
    name: "Arrivederci Roma",
    url: "/audio/001 Sognatori - Arrivederci Roma.mp3",
  },
];

export default function GlobalMusicPlayer() {
  const [trackIdx, setTrackIdx] = useState(
    () => Math.floor(Math.random() * TRACKS.length)
  );
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const audioRef = useRef(null);
  const playingRef = useRef(false);

  const current = TRACKS[trackIdx];

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Create audio element when track changes
  // Auto-advance to next track when the current one ends
  useEffect(() => {
    const audio = new Audio(current.url);

    audio.loop = false;
    audio.volume = volume;

    audio.onended = () => {
      setTrackIdx((i) => (i + 1) % TRACKS.length);
    };

    audioRef.current = audio;

    // Continue playing automatically when changing track
    if (playingRef.current) {
      audio.play().catch(() => setPlaying(false));
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      audioRef.current = null;
    };

    // eslint-disable-next-line
  }, [trackIdx]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  const selectTrack = (idx) => {
    setTrackIdx(idx);
    setShowPlaylist(false);
  };

  return (
    <div className="w-full flex justify-center px-4 py-4">
      <div className="relative">
        {/* PLAYLIST */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.95,
              }}
              className="
                absolute
                bottom-full
                left-1/2
                -translate-x-1/2
                mb-2
                w-64
                max-w-[calc(100vw-2rem)]
                rounded-2xl
                bg-slate-900/95
                backdrop-blur
                border
                border-white/10
                shadow-2xl
                overflow-hidden
                z-50
              "
            >
              {/* PLAYLIST TITLE */}
              <div
                className="
                  px-3
                  py-2
                  border-b
                  border-white/10
                  text-xs
                  font-bold
                  text-amber-400
                  uppercase
                  tracking-wider
                "
              >
                Playlist
              </div>

              {/* TRACK LIST */}
              <div className="max-h-60 overflow-y-auto">
                {TRACKS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => selectTrack(i)}
                    className={`
                      w-full
                      text-left
                      px-3
                      py-2.5
                      flex
                      items-center
                      gap-2
                      text-sm
                      transition
                      hover:bg-white/10
                      ${
                        i === trackIdx
                          ? "bg-amber-500/10 text-amber-400"
                          : "text-slate-300"
                      }
                    `}
                  >
                    <span className="text-xs">
                      {i === trackIdx && playing ? "▶" : "♪"}
                    </span>

                    <span className="truncate flex-1">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* VOLUME */}
              <div
                className="
                  px-3
                  py-2
                  border-t
                  border-white/10
                  flex
                  items-center
                  gap-2
                "
              >
                <span className="text-[10px] text-slate-400">
                  Vol
                </span>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) =>
                    setVolume(parseFloat(e.target.value))
                  }
                  className="flex-1 h-1 accent-amber-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MUSIC PLAYER */}
        <div
          className="
            flex
            items-center
            gap-1
            rounded-full
            bg-slate-900/95
            backdrop-blur
            border
            border-white/10
            shadow-lg
            px-2
            py-1.5
            max-w-full
          "
        >
          {/* PREVIOUS */}
          <button
            onClick={() =>
              setTrackIdx(
                (i) => (i - 1 + TRACKS.length) % TRACKS.length
              )
            }
            className="
              w-7
              h-7
              flex-shrink-0
              rounded-full
              hover:bg-white/10
              flex
              items-center
              justify-center
              text-xs
              text-slate-300
              transition
            "
            aria-label="Brano precedente"
          >
            ⏮
          </button>

          {/* PLAY / PAUSE */}
          <button
            onClick={togglePlay}
            className="
              w-8
              h-8
              flex-shrink-0
              rounded-full
              bg-gradient-to-r
              from-amber-500
              to-orange-500
              flex
              items-center
              justify-center
              text-sm
              hover:brightness-110
              transition
            "
            aria-label={playing ? "Pausa" : "Riproduci"}
          >
            {playing ? "⏸" : "▶"}
          </button>

          {/* NEXT */}
          <button
            onClick={() =>
              setTrackIdx(
                (i) => (i + 1) % TRACKS.length
              )
            }
            className="
              w-7
              h-7
              flex-shrink-0
              rounded-full
              hover:bg-white/10
              flex
              items-center
              justify-center
              text-xs
              text-slate-300
              transition
            "
            aria-label="Brano successivo"
          >
            ⏭
          </button>

          {/* CURRENT TRACK / PLAYLIST */}
          <button
            onClick={() => setShowPlaylist((s) => !s)}
            className="
              ml-1
              px-2
              h-7
              min-w-0
              max-w-[150px]
              rounded-full
              hover:bg-white/10
              flex
              items-center
              justify-center
              gap-1
              text-xs
              text-slate-300
              transition
            "
            aria-label="Apri playlist"
          >
            <span className="truncate">
              {current.name}
            </span>

            <span className="text-[8px] flex-shrink-0">
              ▾
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}