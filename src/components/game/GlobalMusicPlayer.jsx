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

const DEFAULT_POSITION = {
  x: 50,
  y: 82,
};

export default function GlobalMusicPlayer() {
  const [trackIdx, setTrackIdx] = useState(
    () => Math.floor(Math.random() * TRACKS.length)
  );
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);

  const [showPlaylist, setShowPlaylist] = useState(false);

  const [playlistPosition, setPlaylistPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "sognatori-playlist-position"
      );

      return saved
        ? JSON.parse(saved)
        : DEFAULT_POSITION;
    } catch {
      return DEFAULT_POSITION;
    }
  });

  const audioRef = useRef(null);
  const playingRef = useRef(false);

  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({
    x: 0,
    y: 0,
  });

  const current = TRACKS[trackIdx];

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // AUDIO
  useEffect(() => {
    const audio = new Audio(current.url);

    audio.loop = false;
    audio.volume = volume;

    audio.onended = () => {
      setTrackIdx(
        (i) => (i + 1) % TRACKS.length
      );
    };

    audioRef.current = audio;

    if (playingRef.current) {
      audio.play().catch(() =>
        setPlaying(false)
      );
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
      audioRef.current = null;
    };

    // eslint-disable-next-line
  }, [trackIdx]);

  // VOLUME
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // PLAY / PAUSE
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

  // SELECT TRACK
  const selectTrack = (idx) => {
    setTrackIdx(idx);
    setShowPlaylist(false);
  };

  // START DRAG
  const handlePointerDown = (e) => {
    e.preventDefault();

    draggingRef.current = true;

    const rect =
      e.currentTarget.getBoundingClientRect();

    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    e.currentTarget.setPointerCapture?.(
      e.pointerId
    );
  };

  // DRAG
  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;

    const x =
      e.clientX -
      dragOffsetRef.current.x;

    const y =
      e.clientY -
      dragOffsetRef.current.y;

    const maxX =
      window.innerWidth -
      e.currentTarget.offsetWidth;

    const maxY =
      window.innerHeight -
      e.currentTarget.offsetHeight;

    const boundedX = Math.max(
      0,
      Math.min(x, maxX)
    );

    const boundedY = Math.max(
      0,
      Math.min(y, maxY)
    );

    const newPosition = {
      x: boundedX,
      y: boundedY,
    };

    setPlaylistPosition(newPosition);

    localStorage.setItem(
      "sognatori-playlist-position",
      JSON.stringify(newPosition)
    );
  };

  // END DRAG
  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  return (
    <>
      {/* =========================
          PLAYLIST MOVIBILE
      ========================== */}

      <div
        className="fixed z-[101]"
        style={{
          left: playlistPosition.x,
          top: playlistPosition.y,
          touchAction: "none",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <button
          onPointerDown={handlePointerDown}
          onClick={() =>
            !draggingRef.current &&
            setShowPlaylist((s) => !s)
          }
          className="
            px-3
            h-8
            rounded-full
            bg-slate-900/95
            backdrop-blur
            border
            border-white/10
            shadow-lg
            hover:bg-slate-800
            flex
            items-center
            justify-center
            gap-1.5
            text-xs
            text-slate-300
            cursor-grab
            active:cursor-grabbing
            select-none
          "
          aria-label="Apri playlist"
        >
          <span className="truncate max-w-[120px]">
            {current.name}
          </span>

          <span className="text-[8px]">
            ▾
          </span>
        </button>

        {/* PLAYLIST MENU */}
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
                rounded-2xl
                bg-slate-900/95
                backdrop-blur
                border
                border-white/10
                shadow-2xl
                overflow-hidden
              "
            >
              {/* TITLE */}
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

              {/* TRACKS */}
              <div className="max-h-60 overflow-y-auto">
                {TRACKS.map((t, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      selectTrack(i)
                    }
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
                      {i === trackIdx && playing
                        ? "▶"
                        : "♪"}
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
                    setVolume(
                      parseFloat(e.target.value)
                    )
                  }
                  className="flex-1 h-1 accent-amber-400"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* =========================
          MUSIC CONTROLS
      ========================== */}

      <div
        className="
          fixed
          bottom-2
          left-1/2
          -translate-x-1/2
          z-[100]
          flex
          items-center
          gap-1
          rounded-full
          bg-slate-900/90
          backdrop-blur
          border
          border-white/10
          shadow-lg
          px-2
          py-1.5
        "
      >
        {/* PREVIOUS */}
        <button
          onClick={() =>
            setTrackIdx(
              (i) =>
                (i - 1 + TRACKS.length) %
                TRACKS.length
            )
          }
          className="
            w-7
            h-7
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
          aria-label={
            playing
              ? "Pausa"
              : "Riproduci"
          }
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* NEXT */}
        <button
          onClick={() =>
            setTrackIdx(
              (i) =>
                (i + 1) % TRACKS.length
            )
          }
          className="
            w-7
            h-7
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
      </div>
    </>
  );
}