import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  MISHNAH_STRUCTURE,
  type Masechet,
} from '../data/mishnah-structure';
import { gematriya } from '../services/scheduler';
import { usePlanStore, isChapterPreLearned } from '../store/usePlanStore';
import MishnahTextDisplay from '../components/MishnahText';

type View = 'sedarim' | 'masechtot' | 'perakim' | 'learning';

export default function FreeLearningPage() {
  const [view, setView] = useState<View>('sedarim');
  const [selectedSederId, setSelectedSederId] = useState<string | null>(null);
  const [selectedMasechet, setSelectedMasechet] = useState<Masechet | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);

  const { plans, addPreLearnedChapters } = usePlanStore();
  const activePlans = plans.filter(p => !p.isCompleted);

  const selectedSeder = MISHNAH_STRUCTURE.find(s => s.id === selectedSederId);

  const isChapterLearnedInAnyPlan = (masechetId: string, chapter: number) =>
    activePlans.some(p =>
      p.masechetIds.includes(masechetId) && isChapterPreLearned(p, masechetId, chapter)
    );

  const markAsLearned = (masechet: Masechet, chapter: number) => {
    const relevantPlans = activePlans.filter(p => p.masechetIds.includes(masechet.id));
    for (const plan of relevantPlans) {
      if (!isChapterPreLearned(plan, masechet.id, chapter)) {
        addPreLearnedChapters(plan.id, [{ masechetId: masechet.id, chapter }]);
      }
    }
  };

  const goBack = () => {
    if (view === 'learning') setView('perakim');
    else if (view === 'perakim') setView('masechtot');
    else if (view === 'masechtot') setView('sedarim');
  };

  return (
    <div className="space-y-4">
      {view !== 'sedarim' && (
        <button onClick={goBack} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </button>
      )}

      {/* Sedarim list */}
      {view === 'sedarim' && (
        <div className="space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-primary-800">לימוד חופשי</h2>
            <p className="text-sm text-gray-500">בחר מה ללמוד - יסומן אוטומטית בתוכניות שלך</p>
          </div>

          {MISHNAH_STRUCTURE.map(seder => (
            <button
              key={seder.id}
              onClick={() => { setSelectedSederId(seder.id); setView('masechtot'); }}
              className="card w-full text-right hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {seder.masechtot.length} מסכתות
                </span>
                <h3 className="text-lg font-bold text-primary-800">סדר {seder.name}</h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Masechtot in selected seder */}
      {view === 'masechtot' && selectedSeder && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-primary-800 text-center">סדר {selectedSeder.name}</h2>

          <div className="grid grid-cols-2 gap-2">
            {selectedSeder.masechtot.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedMasechet(m); setView('perakim'); }}
                className="card text-right py-3 px-4 hover:shadow-md transition-all"
              >
                <span className="font-bold text-primary-800 block">{m.name}</span>
                <span className="text-xs text-gray-500">
                  {m.chapters.length} פרקים
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chapters in selected masechet */}
      {view === 'perakim' && selectedMasechet && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary-800 text-center">מסכת {selectedMasechet.name}</h2>

          <div className="grid grid-cols-4 gap-2">
            {selectedMasechet.chapters.map((mishnaCount, idx) => {
              const ch = idx + 1;
              const learned = isChapterLearnedInAnyPlan(selectedMasechet.id, ch);

              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedChapter(ch); setView('learning'); }}
                  className={`rounded-xl p-3 text-center transition-all ${
                    learned
                      ? 'bg-success text-white'
                      : 'bg-parchment-50 hover:bg-parchment-200 text-primary-800'
                  }`}
                >
                  <span className="block font-bold text-lg">{gematriya(ch)}</span>
                  <span className={`text-xs ${learned ? 'text-white/80' : 'text-gray-400'}`}>
                    {mishnaCount} משניות
                  </span>
                  {learned && <Check className="w-3.5 h-3.5 mx-auto mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Learning view */}
      {view === 'learning' && selectedMasechet && selectedChapter > 0 && (
        <div className="space-y-4">
          {/* Chapter navigation */}
          <div className="flex gap-2 justify-center flex-wrap">
            {selectedMasechet.chapters.map((_, idx) => {
              const ch = idx + 1;
              const isCurrent = ch === selectedChapter;
              const learned = isChapterLearnedInAnyPlan(selectedMasechet.id, ch);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedChapter(ch)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-primary-700 text-white ring-2 ring-primary-300 ring-offset-1'
                      : learned
                        ? 'bg-success text-white'
                        : 'bg-parchment-200 text-gray-600 hover:bg-parchment-300'
                  }`}
                >
                  {gematriya(ch)}
                </button>
              );
            })}
          </div>

          {/* Mishnah text */}
          <MishnahTextDisplay
            sefariaRef={`${selectedMasechet.sefariaName} ${selectedChapter}`}
            sefariaName={selectedMasechet.sefariaName}
            chapter={selectedChapter}
            fromMishnah={1}
            toMishnah={selectedMasechet.chapters[selectedChapter - 1]}
            masechetName={selectedMasechet.name}
          />

          {/* Mark as learned */}
          <div className="sticky bottom-20 bg-parchment-100/95 backdrop-blur-sm py-3">
            {isChapterLearnedInAnyPlan(selectedMasechet.id, selectedChapter) ? (
              <div className="flex items-center justify-center gap-2 text-success font-bold py-3">
                <Check className="w-5 h-5" />
                פרק זה סומן כנלמד
              </div>
            ) : (
              <button
                onClick={() => {
                  markAsLearned(selectedMasechet, selectedChapter);
                }}
                disabled={activePlans.filter(p => p.masechetIds.includes(selectedMasechet.id)).length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700"
              >
                <Check className="w-5 h-5" />
                סמן כנלמד
              </button>
            )}

            {activePlans.filter(p => p.masechetIds.includes(selectedMasechet.id)).length === 0 &&
              !isChapterLearnedInAnyPlan(selectedMasechet.id, selectedChapter) && (
              <p className="text-xs text-gray-400 text-center mt-2">
                אין תוכנית פעילה עם מסכת {selectedMasechet.name} - הפרק יוצג אך לא ייספר
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
