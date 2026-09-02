import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FACTIONS, FACTION_COLORS } from "@/lib/typeChart";
import { ROSTER } from "@/lib/sognatoriData";
import { FactionBadge } from "@/components/game/HealthBar";
import { useLanguage } from "@/lib/i18n";

const FACTION_ICONS = {
  Demone: "👹",
  Robot: "🤖",
  Natura: "🌿",
  Nuvola: "☁️",
  Umano: "🧍",
  Luce: "🙏",
  Dolce: "🍬",
  Marino: "🌊",
  Orso: "🐻",
  Mago: "🪄",
  Salato: "🧂",
};

const SOGNATORI_LORE = {
  adlimago: {
    it: `Adli è un antico sognatore che custodisce i segreti dell'equilibrio tra potere e conoscenza.

Con i suoi rituali può piegare il flusso del tempo e confondere i suoi avversari.`,
    en: `Adli is an ancient Dreamer who guards the secrets of the balance between power and knowledge.

With his rituals, he can bend the flow of time and confuse his opponents.`,
  },

  aragostino: {
    it: `Aragostino è un sognatore nato nelle profondità degli oceani digitali.

Custodisce valore lontano dal caos, dove il tempo scorre lento e le correnti proteggono ciò che conta.

Quando il mercato si agita, Aragostino si immerge ancora più a fondo seguendo il flusso delle onde.`,
    en: `Aragostino is a Dreamer born in the depths of the digital oceans.

He safeguards value away from chaos, where time flows slowly and currents protect what matters.

When the market becomes turbulent, Aragostino dives even deeper, following the flow of the waves.`,
  },

  cancucc: {
    it: `Cancucc è un sognatore nato tra le preparazioni di una pasticceria.

Colui che stava creando quei dolci era probabilmente goloso fino all'esagerazione.

Cancucc, all'apparenza morbido e ricoperto di pelliccia, è fatto interamente di cioccolata.`,
    en: `Cancucc is a Dreamer born among the creations of a pastry shop.

Whoever was making those sweets was probably extremely greedy.

Soft-looking and covered in fur, Cancucc is made entirely of chocolate.`,
  },

  cenere: {
    it: `Cenere è un sognatore nato tra le fiamme dei mercati in rovina.

Ad ogni crollo riemerge dalle sue ceneri più forte di prima.`,
    en: `Cenere is a Dreamer born among the flames of ruined markets.

With every collapse, he rises from his ashes stronger than before.`,
  },

  cillymbu: {
    it: `Cillymbu nasce tra i fiori di ciliegio di Kyoto.

Non ha un grande udito, ma suona il suo flauto per suscitare emozioni, e se non viene ascoltato ti colpisce con esso.`,
    en: `Cillymbu was born among the cherry blossoms of Kyoto.

He does not have great hearing, but he plays his flute to stir emotions, and if he is not listened to, he strikes you with it.`,
  },

  deb: {
    it: `Deb è nata da una richiesta di aiuto.

È l'assistente del mondo dei sognatori.

È amica di tutti e supporta gli altri sognatori nei loro obiettivi.`,
    en: `Deb was born from a request for help.

She is the assistant of the Dreamers' world.

She is everyone's friend and supports the other Dreamers in achieving their goals.`,
  },

  dragociocco: {
    it: `Dragociocco è un drago di cioccolato nato da un uovo di Pasqua.

Vivono in gruppo e sono molto vivaci e dispettosi.`,
    en: `Dragociocco is a chocolate dragon born from an Easter egg.

They live in groups and are very lively and mischievous.`,
  },

  eroe: {
    it: `Eroe è un piccolo sognatore nato tra le nuvole più alte.

Non combatte per dominare, ma per proteggere i compagni e disperdere le tempeste.

Quando il cielo si oscura Eroe appare tra le nuvole per riportare la luce.`,
    en: `Eroe is a small Dreamer born among the highest clouds.

He does not fight to dominate, but to protect his companions and disperse storms.

When the sky darkens, Eroe appears among the clouds to bring back the light.`,
  },

  fierononno: {
    it: `Fierononno è un sognatore nato da un umano che sognando troppo ha mutato la sua forma.

Continua ad essere un gran brontolone ma adesso protegge gli umani dall'alto.`,
    en: `Fierononno is a Dreamer born from a human who changed his form after dreaming too much.

He is still a great grumbler, but now he protects humans from above.`,
  },

  lari: {
    it: `Lari è una sognatrice nata da una divinità protettrice delle dimore.

In cambio di adorazione protegge i cieli circostanti da fulmini, tornado e inondazioni.

Cambia il colore delle nuvole in base al suo umore.`,
    en: `Lari is a female Dreamer born from a deity who protects homes.

In exchange for worship, she protects the surrounding skies from lightning, tornadoes and floods.

She changes the color of the clouds according to her mood.`,
  },

  long: {
    it: `Long è un sognatore nato in un periodo di forte crescita economica.

Innamorato della vita è ottimista e guarda sempre in alto.

Quando tutto sembra fermarsi, Long continua a salire e volare oltre ogni resistenza.`,
    en: `Long is a Dreamer born during a period of strong economic growth.

In love with life, he is optimistic and always looks upward.

When everything seems to stop, Long continues to rise and fly beyond every resistance.`,
  },

  nina: {
    it: `Nina è una sognatrice nata dalla fedeltà ai propri principi e dalla purezza.

La sua aureola si è formata nel momento in cui ha protetto dei sognatori durante un giorno di eruzioni apocalittiche.

Da allora, la sua presenza è simbolo di protezione e luce.`,
    en: `Nina is a Dreamer born from loyalty to her principles and purity.

Her halo was formed when she protected Dreamers during a day of apocalyptic eruptions.

Since then, her presence has been a symbol of protection and light.`,
  },

  nuvobetta: {
    it: `Nuvobetta è una sognatrice nata dal suono dello spostamento delle nuvole.

Il suo squillo anticipa grandi cambiamenti.`,
    en: `Nuvobetta is a female Dreamer born from the sound of moving clouds.

Her call announces great changes.`,
  },

  scroccospell: {
    it: `Scroccospell è un sognatore nato da tornadi di formule di streghe ed è un grande appassionato dello studio dei contratti magici.`,
    en: `Scroccospell is a Dreamer born from tornadoes of witches' spells and is deeply passionate about studying magical contracts.`,
  },

  sparkly: {
    it: `Sparkly è un umano nato in una sera di stelle cadenti.

Non cerca il potere né la gloria, osserva e si meraviglia del mondo dei Sognatori.`,
    en: `Sparkly is a human born on a night of shooting stars.

He seeks neither power nor glory. He simply observes and marvels at the world of the Dreamers.`,
  },

  spinoff: {
    it: `Spinoff è un sognatore nato dal desiderio della natura di non essere dimenticata.

Ama dondolarsi, e le sue spine ondeggiano leggere nelle sere d'estate.`,
    en: `Spinoff is a Dreamer born from nature's desire not to be forgotten.

He loves to swing, and his spines gently sway on summer evenings.`,
  },

  uesditti: {
    it: `Uesditti nasce per collegare mondi completamente distanti attraverso la sua ancora e dare stabilità ad ognuno di essi.

Si nutre di banconote e lascia monetine lungo il suo cammino.`,
    en: `Uesditti was born to connect completely distant worlds through his anchor and bring stability to each of them.

He feeds on banknotes and leaves coins along his path.`,
  },
};

export default function Lore() {
  const { t, lang } = useLanguage();
  const [selectedSognatore, setSelectedSognatore] = useState(null);

  const selectedLore = selectedSognatore
    ? SOGNATORI_LORE[selectedSognatore.id]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="text-sm text-slate-400 hover:text-white transition"
          >
            {t("lore.back")}
          </Link>

          <img
            src="/images/bannerLOGOSOGNATORI.png"
            alt="Sognatori"
            className="h-10 object-contain"
          />

          <div className="w-16" />
        </div>

        {/* GENESIS */}
        <Section title={t("lore.genesis")}>
          <p className="text-sm text-slate-300 leading-relaxed">
            {t("lore.genesisP1")}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed mt-2">
            {t("lore.genesisP2")}
          </p>
        </Section>

        {/* FACTIONS */}
        <Section title={t("lore.factions")}>
          <div className="grid sm:grid-cols-2 gap-2">
            {FACTIONS.map((f) => (
              <div
                key={f}
                className="rounded-xl p-3 border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${FACTION_COLORS[f]}22, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    {FACTION_ICONS[f]}
                  </span>

                  <FactionBadge type={f} />
                </div>

                <div className="text-xs font-bold text-white">
                  {t(`lore.faction.${f}.title`)}
                </div>

                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t(`lore.faction.${f}.desc`)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* SOGNATORI */}
        <Section title={t("lore.sognatori")}>
          <div className="grid sm:grid-cols-2 gap-3">
            {ROSTER.map((s, i) => {
              const hasLore = Boolean(SOGNATORI_LORE[s.id]);

              return (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (hasLore) {
                      setSelectedSognatore(s);
                    }
                  }}
                  whileHover={hasLore ? { scale: 1.02 } : undefined}
                  whileTap={hasLore ? { scale: 0.98 } : undefined}
                  className="text-left w-full rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">

                    <div className="text-[10px] text-slate-500 w-5">
                      {i + 1}
                    </div>

                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                      <img
                        src={s.img}
                        alt={s.nome}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">
                          {s.nome}
                        </span>

                        <FactionBadge type={s.tipo} />
                      </div>

                      <div className="text-[10px] text-slate-400 mt-1">
                        {hasLore
                          ? lang === "en"
                            ? "Discover their story →"
                            : "Scopri la sua storia →"
                          : lang === "en"
                            ? "Lore coming soon..."
                            : "Lore in arrivo..."}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </Section>

        {/* FOOTER */}
        <div className="text-center text-[11px] text-slate-500 mt-8 mb-4 italic">
          {t("lore.footer")}
        </div>
      </div>

      {/* MODAL LORE */}
      <AnimatePresence>
        {selectedSognatore && selectedLore && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSognatore(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-slate-950 shadow-2xl"
            >

              {/* CHIUDI */}
              <button
                type="button"
                onClick={() => setSelectedSognatore(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-white/20 text-white text-lg transition"
                aria-label={lang === "en" ? "Close" : "Chiudi"}
              >
                ×
              </button>

              {/* IMMAGINE */}
              <div className="bg-white/5 p-6 flex justify-center">
                <img
                  src={selectedSognatore.img}
                  alt={selectedSognatore.nome}
                  className="w-full max-h-80 object-contain"
                />
              </div>

              {/* CONTENUTO */}
              <div className="p-5">

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h2 className="text-2xl font-black">
                    {selectedSognatore.nome}
                  </h2>

                  <FactionBadge type={selectedSognatore.tipo} />
                </div>

                {/* STATISTICHE */}
                <div className="text-xs text-slate-500 mb-4">
                  {selectedSognatore.att} ATT ·{" "}
                  {selectedSognatore.dif} DIF ·{" "}
                  {selectedSognatore.vel} VEL
                </div>

                {/* LORE */}
                <div className="border-t border-white/10 pt-4">

                  <h3 className="text-sm font-bold text-amber-400 mb-3">
                    {lang === "en"
                      ? "Their story"
                      : "La sua storia"}
                  </h3>

                  <div className="text-sm text-slate-300 leading-7 whitespace-pre-line">
                    {lang === "en"
                      ? selectedLore.en
                      : selectedLore.it}
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      <h2 className="text-lg font-bold text-amber-400 mb-3">
        {title}
      </h2>

      {children}
    </motion.div>
  );
}