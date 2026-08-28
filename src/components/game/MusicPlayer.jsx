import React, { useState, useEffect, useRef } from "react";

const BATTLE_TRACKS =  [
  "/audio/001 Sognatori - Arrivederci Roma.mp3",
  "/audio/002Sognatori - Dream Arena.mp3",
  "/audio/Dream Creature Path.mp3",
  "/audio/Dream Creature Path (1).mp3",
  "/audio/Lantern Deer.mp3",
  "/audio/Lantern Deer (1).mp3",
  "/audio/Sognatori Awakes.mp3",
  "/audio/Sognatori Awakes (1).mp3",
  "/audio/Sognatori Overture.mp3",
  "/audio/Sognatori Overture (1).mp3",
  ];

export default function MusicPlayer() {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const track = BATTLE_TRACKS[Math.floor(Math.random() * BATTLE_TRACKS.length)];
    const audio = new Audio(track);
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;

    const tryPlay = () => {
      audio.play().catch(() => {
        const onInteract = () => {
          audio.play().catch(() => {});
          document.removeEventListener("click", onInteract);
          document.removeEventListener("keydown", onInteract);
        };
        document.addEventListener("click", onInteract);
        document.addEventListener("keydown", onInteract);
      });
    };
    tryPlay();

    return () => { audio.pause(); audio.src = ""; };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  return (
    <button
      onClick={() => setMuted(m => !muted)}
      className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
      title={muted ? "Riattiva musica" : "Silenzia musica"}
    >
      {muted ? "🔇" : "🎵"}
    </button>
  );
}