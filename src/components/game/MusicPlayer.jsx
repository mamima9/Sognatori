import React, { useState, useEffect, useRef } from "react";

const BATTLE_TRACKS = [
  "https://media.base44.com/files/public/6a88c0790ad6d8971067dd2b/485504222_002Sognatori-DreamArena.mp3",
  "https://media.base44.com/files/public/6a88c0790ad6d8971067dd2b/d4c4fcd75_SognatoriAwakes.mp3",
  "https://media.base44.com/files/public/6a88c0790ad6d8971067dd2b/c0f7fd73e_SognatoriOverture.mp3",
  "https://media.base44.com/files/public/6a88c0790ad6d8971067dd2b/f2aec43ba_DreamCreaturePath.mp3",
  "https://media.base44.com/files/public/6a88c0790ad6d8971067dd2b/7ec7a8548_LanternDeer.mp3",
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