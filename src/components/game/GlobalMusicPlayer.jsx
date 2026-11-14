import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const MAIN_TRACKS = [
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
    name: "Adli il Mago",
    url: "/audio/Adli il mago.mp3",
  },
  {
    name: "H1CQS",
    url: "/audio/H1CQS.mp3",
  },
];

const BATTLE_TRACKS = [
   {
    name: "Dream Arena",
    url: "/audio/002Sognatori - Dream Arena.mp3",
  },
   {
    name: "Ganbare",
    url: "/audio/ganbare.mp3",
  },
   {
    name: "El Buitre",
    url: "/audio/El Buitre.mp3",
  },
  {
    name: "Arrivederci Roma",
    url: "/audio/001 Sognatori - Arrivederci Roma.mp3",
  },
  {
    name: "Battaglia",
    url: "/audio/Battaglia.mp3",
  },
  {
    name: "Eroica tensione",
    url: "/audio/Eroica tensione.mp3",
  },
    {
    name: "Come gocce di tiglio",
    url: "/audio/Come gocce di tiglio.mp3",
  },
  {
    name: "Dandadan",
    url: "/audio/Dandadan.mp3",
  },
];

let sharedMusicAudio = null;

const ADVENTURE_TRACKS = [
  {
    cityId: "natura",
    city: "Verdelume",
    name: "Verdelume",
    url: "/audio/Verdelume-Nord.mp3",
    northUrl: "/audio/Verdelume-Nord.mp3",
    southUrl: "/audio/Verdelume-Sud.mp3",
  },
  { cityId: "demone", city: "Braciombra", name: "Eroica tensione", url: "/audio/Eroica tensione.mp3" },
  { cityId: "robot", city: "Ferrovia", name: "H1CQS", url: "/audio/H1CQS.mp3" },
  { cityId: "nuvola", city: "Altacielo", name: "Dream Creature Path", url: "/audio/Dream Creature Path.mp3" },
  { cityId: "umano", city: "Crocevia", name: "Motivo Mediterraneo", url: "/audio/Motivo Mediterraneo.mp3" },
  { cityId: "luce", city: "Auroria", name: "Sognatori Overture", url: "/audio/Sognatori Overture.mp3" },
  { cityId: "dolce", city: "Zuccherìa", name: "Come gocce di tiglio", url: "/audio/Come gocce di tiglio.mp3" },
  { cityId: "marino", city: "Marequieto", name: "Arrivederci Roma", url: "/audio/001 Sognatori - Arrivederci Roma.mp3" },
  { cityId: "orso", city: "Zannaforte", name: "El Buitre", url: "/audio/El Buitre.mp3" },
  { cityId: "mago", city: "Arcania", name: "Adli il Mago", url: "/audio/Adli il mago.mp3" },
  { cityId: "salato", city: "Salmastra", name: "Sognatori Awakes", url: "/audio/Sognatori Awakes.mp3" },
];

const AUCTION_TRACKS = [
  {
    name: "Franco",
    url: "/audio/Franco.mp3",
  },
  {
    name: "Motivo Mediterraneo",
    url: "/audio/Motivo Mediterraneo.mp3",
  },
];

/*
 * Cambia la modalità musicale del player globale.
 *
 * mode:
 * "main"
 * "battle"
 * "auction"
 */
export function setMusicMode(mode) {
  window.dispatchEvent(
    new CustomEvent("sognatori-music-mode", {
      detail: { mode },
    })
  );
}

export default function GlobalMusicPlayer({ insideAdventureMenu = false } = {}) {
  const location = useLocation();

  const [musicMode, setMusicModeState] = useState("main");
  const [entryDirection, setEntryDirection] = useState("north");

  const [trackIdx, setTrackIdx] = useState(
    () => Math.floor(Math.random() * MAIN_TRACKS.length)
  );

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const audioRef = useRef(null);
  const playingRef = useRef(false);
  const startedRef = useRef(false);

  /*
   * TRACKS ATTUALI
   */
  const tracks =
    musicMode === "battle"
      ? BATTLE_TRACKS
      : musicMode === "auction"
        ? AUCTION_TRACKS
        : musicMode === "adventure"
          ? ADVENTURE_TRACKS.map((track) => ({
              ...track,
              url: track.cityId === "natura"
                ? (entryDirection === "south" ? track.southUrl : track.northUrl)
                : track.url,
            }))
          : MAIN_TRACKS;

  const current = tracks[trackIdx] || tracks[0];

  /*
   * MEMORIZZA STATO PLAY
   */
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  /*
   * CAMBIO MODALITÀ MUSICA
   */
  useEffect(() => {
    const handleMusicMode = (event) => {
      const mode = event.detail?.mode || "main";

      const nextTracks =
        mode === "battle"
          ? BATTLE_TRACKS
          : mode === "auction"
            ? AUCTION_TRACKS
            : mode === "adventure"
              ? ADVENTURE_TRACKS
              : MAIN_TRACKS;

      const cityIndex = mode === "adventure"
        ? nextTracks.findIndex((track) => track.cityId === event.detail?.cityId)
        : -1;
      const nextIndex = cityIndex >= 0
        ? cityIndex
        : Math.floor(Math.random() * nextTracks.length);

      setEntryDirection(event.detail?.entryDirection === "south" ? "south" : "north");
      setMusicModeState(mode);
      setTrackIdx(nextIndex);
    };

    window.addEventListener(
      "sognatori-music-mode",
      handleMusicMode
    );

    return () => {
      window.removeEventListener(
        "sognatori-music-mode",
        handleMusicMode
      );
    };
  }, []);

  /*
   * CREA AUDIO
   */
  useEffect(() => {
    // Un solo elemento audio condiviso: la musica sopravvive
    // ai cambi pagina e agli eventuali remount del player.
    if (!sharedMusicAudio) {
      sharedMusicAudio = new Audio();
      sharedMusicAudio.preload = "auto";
      sharedMusicAudio.loop = false;
    }

    const audio = sharedMusicAudio;
    audioRef.current = audio;
    audio.volume = volume;
    // In Avventura il brano della città resta in ripetizione finché
    // il giocatore non raggiunge un'altra città.
    audio.loop = musicMode === "adventure";

    audio.onended = () => {
      if (musicMode !== "adventure") {
        setTrackIdx((i) => (i + 1) % tracks.length);
      }
    };

    if (current && audio.src !== new URL(current.url, window.location.origin).href) {
      audio.src = current.url;
      audio.load();

      if (playingRef.current) {
        audio.play()
          .then(() => setPlaying(true))
          .catch(() => setPlaying(false));
      }
    }

    // Non mettere in pausa né azzerare l'audio nel cleanup:
    // la riproduzione deve fermarsi solo dal pulsante del player.
    return () => {
      if (audio.onended) audio.onended = null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx, musicMode, entryDirection]);

  /*
   * VOLUME
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /*
   * AUTOPLAY HOME
   *
   * Prova immediatamente.
   * Se il browser blocca l'autoplay,
   * riprova al primo gesto dell'utente.
   */
  useEffect(() => {
    if (location.pathname !== "/") return;

    /*
     * Se siamo già partiti non dobbiamo
     * registrare nuovamente gli eventi.
     */
    if (startedRef.current) return;

    const startMusic = () => {
      const audio = audioRef.current;

      if (!audio || startedRef.current) return;

      audio
        .play()
        .then(() => {
          startedRef.current = true;
          setPlaying(true);

          window.removeEventListener(
            "pointerdown",
            startMusic
          );

          window.removeEventListener(
            "keydown",
            startMusic
          );

          window.removeEventListener(
            "touchstart",
            startMusic
          );
        })
        .catch(() => {
          /*
           * Autoplay bloccato dal browser.
           * Riproveremo al prossimo gesto.
           */
        });
    };

    startMusic();

    window.addEventListener(
      "pointerdown",
      startMusic
    );

    window.addEventListener(
      "keydown",
      startMusic
    );

    window.addEventListener(
      "touchstart",
      startMusic
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        startMusic
      );

      window.removeEventListener(
        "keydown",
        startMusic
      );

      window.removeEventListener(
        "touchstart",
        startMusic
      );
    };
  }, [location.pathname]);

  /*
   * PLAY / PAUSE
   */
  const togglePlay = () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          startedRef.current = true;
          setPlaying(true);
        })
        .catch(() => {
          setPlaying(false);
        });
    }
  };

  /*
   * CAMBIO BRANO
   */
  const selectTrack = (idx) => {
    setTrackIdx(idx);
    setShowPlaylist(false);
  };

  /*
   * BRANO PRECEDENTE
   */
  const previousTrack = () => {
    setTrackIdx(
      (i) =>
        (i - 1 + tracks.length) %
        tracks.length
    );
  };

  /*
   * BRANO SUCCESSIVO
   */
  const nextTrack = () => {
    setTrackIdx(
      (i) => (i + 1) % tracks.length
    );
  };

  if (location.pathname === "/avventura" && !insideAdventureMenu) return null;

  return (
    <div className={insideAdventureMenu ? "w-full flex justify-start px-0 py-3" : "w-full flex justify-center px-4 py-4"}>
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

              {/* TITOLO */}
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
                {musicMode === "battle"
                  ? "Battle"
                  : musicMode === "auction"
                    ? "Asta"
                    : musicMode === "adventure"
                      ? "Avventura · città"
                      : "Playlist"}
              </div>

              {/* BRANI */}
              <div className="max-h-60 overflow-y-auto">
                {tracks.map((t, i) => (
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
                      parseFloat(
                        e.target.value
                      )
                    )
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
            onClick={previousTrack}
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
            onClick={nextTrack}
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

          {/* CURRENT TRACK */}
          <button
            onClick={() =>
              setShowPlaylist(
                (s) => !s
              )
            }
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
              {current?.name || "Musica"}
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