import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Dumbbell, Zap, Timer, Brain, TrendingUp, RefreshCw, Gauge, Award, BarChart3, Layers } from 'lucide-react';
import { Card } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';

interface EducationCard {
  id: number;
  icon: typeof BookOpen;
  title: string;
  summary: string;
  content: string[];  // Paragrafen
  practical: string[];
  source: string;
}

const CARDS: EducationCard[] = [
  {
    id: 1,
    icon: Dumbbell,
    title: 'Hoe Spieren Groeien — De 3 Mechanismen',
    summary: 'Spiergroei wordt aangedreven door mechanische spanning, metabole stress en spierschade.',
    content: [
      'Mechanische spanning is veruit de belangrijkste driver. Dit is de kracht die je spier moet leveren tegen weerstand. Hoe zwaarder de belasting en hoe langer de spier onder spanning staat, hoe sterker het signaal: "bouw deze spier groter." Op celniveau activeert mechanische spanning het mTOR-signaalpad — de moleculaire schakelaar die eiwitsynthese aanzet.',
      'Metabole stress is de "burn" bij hogere herhalingen. Afvalstoffen (lactaat, waterstofionen) hopen zich op. Dit creëert een anabole omgeving: groeihormoon stijgt, cellen zwellen op, en satelietcellen worden geactiveerd.',
      'Spierschade (microtrauma) zijn kleine scheurtjes in spiervezels. Je lichaam repareert die en bouwt ze sterker terug — supercompensatie. Meer schade ≠ meer groei. Gecontroleerde schade via excentrische controle is effectiever dan "kapot trainen."',
    ],
    practical: [
      'Train in het 6-12 rep bereik voor de optimale combinatie van spanning + metabole stress',
      'Gebruik tempo 3-1-1-0 (3 sec excentrisch) voor meer time under tension',
      'Ga niet tot falen — RPE 7-9 is de sweet spot (1-3 reps in reserve)',
    ],
    source: 'Schoenfeld (2010) "The Mechanisms of Muscle Hypertrophy and Their Application to Resistance Training"',
  },
  {
    id: 2,
    icon: Zap,
    title: 'Trainen voor Kracht — Waarom Weinig Reps Werken',
    summary: 'Kracht gaat over je zenuwstelsel leren om meer spiervezels tegelijk aan te sturen.',
    content: [
      'Bij 1-5 reps met zwaar gewicht (>85% 1RM) train je primair je zenuwstelsel. Motor unit recruitment: je lichaam leert om méér motor units tegelijk te activeren. Rate coding: de frequentie van zenuwsignalen gaat omhoog.',
      'Intermusculaire coördinatie verbetert — spiergroepen werken beter samen. Daarom worden beginners snel sterker zonder groter te worden.',
      'Golgi peesorgaan desensitisatie: je pezen hebben een ingebouwde "noodrem" die voorkomt dat je te veel kracht levert. Krachttraining maakt deze rem minder gevoelig.',
      'Waarom lange rust (3-5 min)? Je zenuwstelsel herstelt langzamer dan je spieren. Korte rust = CZS nog moe = minder kracht = minder effectieve set.',
    ],
    practical: [
      '1-5 reps per set, RPE 8-9.5',
      '3-5 minuten rust (ja, echt zo lang)',
      'Focus op grote lifts: squat, bench, deadlift, overhead press, row',
      'Progressie = meer gewicht op de stang',
    ],
    source: 'NSCA Essentials (4th ed.), Suchomel et al. (2018)',
  },
  {
    id: 3,
    icon: BarChart3,
    title: 'Trainen voor Spiergroei — Volume is de Sleutel',
    summary: 'Je totale trainingsvolume per spiergroep per week is belangrijker dan hoe zwaar je traint.',
    content: [
      'Volume = sets × reps × gewicht. Het aantal "harde sets" per spiergroep per week is de beste maatstaf. Een "harde set" is een set bij RPE 7-9.',
      'De dose-response relatie (Schoenfeld 2017): < 10 sets/week: minimale groei. 10-20 sets/week: optimaal. > 20 sets/week: marginaal extra.',
      'Tempo ertoe doet: 3-1-1-0 = ~5 sec per rep. Bij 10 reps = 50 sec time under tension. Precies de range (40-70 sec) voor maximale hypertrofie.',
    ],
    practical: [
      '12-20 harde sets per spiergroep per week',
      '6-12 reps per set, RPE 7-9',
      'Tempo 3-1-1-0',
      'Progressie: eerst meer reps (8→12), dan gewicht omhoog, terug naar 8',
    ],
    source: 'Schoenfeld et al. (2017), Krieger (2010), Wernbom et al. (2007)',
  },
  {
    id: 4,
    icon: Timer,
    title: 'Trainen voor Uithoudingsvermogen',
    summary: 'Hoge herhalingen met korte rust trainen je spieren om langer vol te houden.',
    content: [
      'Bij 12-20+ reps met korte rust verschuift de aanpassing naar musculair uithoudingsvermogen. Mitochondriale dichtheid stijgt: meer aerobe energie = langer werken.',
      'Capillarisatie: meer bloedvaatjes rond de spier. Buffercapaciteit verbetert: je spier neutraliseert waterstofionen beter.',
      'Type I vezelhypertrofie: hoge reps trainen langzame spiervezels die bij zware sets minder gestimuleerd worden.',
    ],
    practical: [
      '12-20+ reps, RPE 6-8',
      '30-90 sec rust',
      'Tempo 2-0-1-0',
      'Goed voor: gewrichtsgezondheid, werkcapaciteit, basis voor kracht/hypertrofie blokken',
    ],
    source: 'ACSM Guidelines (11th ed.), Wilson et al. (2012)',
  },
  {
    id: 5,
    icon: Brain,
    title: 'RPE — Train Slim, Niet Tot je Erbij Neervalt',
    summary: 'RPE meet hoe zwaar een set voelt op een schaal van 1-10.',
    content: [
      'RPE 10 = 0 RIR (Spierfalen). RPE 9 = 1 RIR. RPE 8 = 2 RIR. RPE 7 = 3 RIR. RPE 6 = 4 RIR (Deload). RPE 5 = 5+ RIR (Opwarming).',
      'Tot falen levert NIET significant meer groei op dan RPE 8-9. Het verdubbelt je hersteltijd en vergroot blessurerisico.',
      'De sweet spot: RPE 7-9 voor spiergroei, RPE 8-9.5 voor kracht. Door NIET tot falen te gaan kun je meer sets doen per week = meer totale groei.',
    ],
    practical: [
      'Log RPE na laatste set van elke oefening',
      'Spiergroei: RPE 7-9 (meeste sets rond 8)',
      'Kracht: RPE 8-9.5',
      'Elke set RPE 10? Te zwaar. Elke set RPE 6? Te licht.',
    ],
    source: 'Helms et al. (2014), Zourdos et al. (2016)',
  },
  {
    id: 6,
    icon: TrendingUp,
    title: 'Progressieve Overload — De Enige Regel Die Ertoe Doet',
    summary: 'Spieren groeien alleen als je ze systematisch meer vraagt dan vorige keer.',
    content: [
      'Double progression: je krijgt een rep-bereik (bijv. 8-12). Start met ~8 reps. Elke training: probeer meer reps. Alle sets op 12? Gewicht omhoog. Terug naar ~8. Herhaal.',
      'Voorbeeld: Week 1: 80kg × 8,8,7. Week 3: 80kg × 10,10,9. Week 5: 80kg × 12,12,12 ✓. Week 6: 82.5kg × 8,8,8 (reset).',
      'Andere vormen als gewicht verhogen niet lukt: meer reps, meer sets, beter tempo, betere techniek.',
    ],
    practical: [
      'Gebruik de app om altijd je vorige gewicht en reps te zien',
      'Focus op kleine, consistente verbeteringen',
      'Geduld — lineaire progressie gaat maanden door als beginner',
    ],
    source: 'ACSM Guidelines, Kraemer & Ratamess (2004)',
  },
  {
    id: 7,
    icon: RefreshCw,
    title: 'Deloaden — Waarom Minder Doen Meer Oplevert',
    summary: 'Na 4-6 weken hard trainen bouw je vermoeidheid op die prestaties onderdrukt.',
    content: [
      'Het fitness-fatigue model: elke training levert fitness (positief) en vermoeidheid (negatief). Prestatie = fitness minus vermoeidheid.',
      'Na weken hard trainen stijgt vermoeidheid soms sneller dan fitness. Een deload laat vermoeidheid verdwijnen terwijl fitness nauwelijks daalt.',
      'Ogasawara et al. (2013) toonde aan dat spiergroei na een deload SNELLER gaat dan doortrainen zonder pauze.',
      'Signalen voor deload: reps gaan achteruit, gewrichten stijf, motivatie weg, slechte slaap, resting hartslag hoger.',
    ],
    practical: [
      'Zelfde oefeningen, zelfde gewicht, 40-50% minder sets',
      'RPE 5-6 (moet makkelijk voelen)',
      'NIET gewicht verlagen',
      'Na 4-6 weken hard trainen',
    ],
    source: 'Ogasawara et al. (2013), Pritchard et al. (2015)',
  },
  {
    id: 8,
    icon: Gauge,
    title: 'Tempo — Waarom Snelheid Ertoe Doet',
    summary: 'De snelheid waarmee je een rep uitvoert bepaalt hoeveel spanning je spier ervaart.',
    content: [
      'De 4 tempo-cijfers (bijv. 3-1-1-0): 3 sec excentrisch (neerlaten, meeste spierschade), 1 sec pauze onderaan (maximale spanning), 1 sec concentrisch (omhoog, explosief), 0 sec pauze boven.',
      'Je spier kan ~20-40% meer kracht leveren excentrisch dan concentrisch. Langzaam excentrisch = meer spanning per rep, rekruteert meer Type II spiervezels.',
      'Sweet spot: 2-4 sec excentrisch. Bij >5 sec moet je zoveel gewicht verlagen dat de absolute spanning weer daalt.',
    ],
    practical: [
      'Kracht: 2-0-1-1 (snel, gecontroleerd)',
      'Spiergroei: 3-1-1-0 (langzaam excentrisch, explosief omhoog)',
      'Uithoudingsvermogen: 2-0-1-0 (vlot, focus op reps)',
    ],
    source: 'Schoenfeld et al. (2015), Wernbom et al. (2007)',
  },
  {
    id: 9,
    icon: Award,
    title: 'Het Tier Systeem — Niet Alle Oefeningen Zijn Gelijk',
    summary: 'Oefeningen zijn gerangschikt van S+ tot F op basis van vier wetenschappelijke criteria.',
    content: [
      'De 4 criteria (Jeff Nippard): EMG-activatie (hoeveel activeert de oefening de doelspier?), spanningscurve (is de oefening het zwaarst in de uitgerekte positie?), progressieve overload potentie, en blessurerisico.',
      'S+: beste keuze, hoogste activatie. S: uitstekend. A: zeer goed. B: goed, prima voor variatie. C: matig, er zijn betere opties. D/F: niet aanbevolen.',
      'Belangrijk: een B-tier oefening die je LEUK vindt en consistent doet, is beter dan een S-tier die je skipt.',
    ],
    practical: [
      'De app selecteert automatisch de hoogste beschikbare tiers',
      'D/F-tier worden nooit automatisch gekozen',
      'Je kunt altijd handmatig wisselen in het programma overzicht',
    ],
    source: 'Jeff Nippard, Contreras EMG studies, Schoenfeld',
  },
  {
    id: 10,
    icon: Layers,
    title: 'Compounds vs Isolatie — Wanneer Gebruik Je Wat?',
    summary: 'Compound oefeningen zijn de basis. Isolatie vult de gaten.',
    content: [
      'Compounds (squat, bench, deadlift, row): meerdere spiergroepen tegelijk, hogere belasting, grotere hormonale respons, beter voor kracht.',
      'Isolatie (curls, lateral raises, leg extensions): één specifieke spier, minder systemische vermoeidheid, essentieel voor achterblijvende spiergroepen, veiliger bij zware belasting.',
      'Volgorde: start met 1-2 compounds (zwaarst, meeste coördinatie = doe dit fris). Vul aan met 2-4 isolatie (minder coördinatie, veilig bij vermoeidheid).',
    ],
    practical: [
      'Begin elke training met je zwaarste compound',
      'Zijdeltoïden worden nauwelijks geraakt door pressing — voeg lateral raises toe',
      'Lange kop triceps heeft isolatie nodig (overhead extensions)',
    ],
    source: 'Gentil et al. (2017), Schoenfeld et al. (2016)',
  },
];

export default function Education() {
  const [searchParams] = useSearchParams();
  const cardParam = searchParams.get('card');
  const [expandedId, setExpandedId] = useState<number | null>(cardParam ? parseInt(cardParam) : null);

  // Auto-scroll naar geopende kaart
  useEffect(() => {
    if (cardParam) {
      setTimeout(() => {
        document.getElementById(`edu-card-${cardParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [cardParam]);

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader title="Leren" />

      <div className="px-4 pt-2">
        <p className="text-text-secondary text-sm mb-4">
          Begrijp het waarom achter je training. Gebaseerd op sportwetenschap.
        </p>

        <div className="flex flex-col gap-3">
          {CARDS.map(card => {
            const isExpanded = expandedId === card.id;
            const Icon = card.icon;

            return (
              <Card key={card.id} padding={false} id={`edu-card-${card.id}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : card.id)}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{card.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{card.summary}</p>
                  </div>
                  {isExpanded
                    ? <ChevronUp size={16} className="text-text-muted shrink-0 mt-1" />
                    : <ChevronDown size={16} className="text-text-muted shrink-0 mt-1" />
                  }
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        {/* Content paragraphs */}
                        <div className="flex flex-col gap-3 mb-4">
                          {card.content.map((p, i) => (
                            <p key={i} className="text-sm text-text-secondary leading-relaxed">{p}</p>
                          ))}
                        </div>

                        {/* Practical tips */}
                        <div className="p-3 bg-accent-muted/50 rounded-xl mb-3">
                          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Praktisch</p>
                          <ul className="text-sm text-text-secondary space-y-1">
                            {card.practical.map((tip, i) => (
                              <li key={i}>• {tip}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Source */}
                        <p className="text-[10px] text-text-muted">
                          Bron: {card.source}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
