import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import {
  MISHNAH_STRUCTURE,
  getMasechet,
  getSederForMasechet,
  type Masechet,
} from '../data/mishnah-structure';
import { gematriya } from '../services/scheduler';
import { usePlanStore, isChapterPreLearned, type LearningPlan } from '../store/usePlanStore';
import MishnahTextDisplay from '../components/MishnahText';

type View = 'sedarim' | 'masechtot' | 'perakim' | 'learning';

interface FreeLearningNavState {
  sederId?: string;
  masechetId?: string;
  chapter?: number;
}

export default function FreeLearningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state as FreeLearningNavState | null;

  const [view, setView] = useState<View>(() => {
    if (navState?.masechetId && navState?.chapter != null) return 'learning';
    return 'sedarim';
  });
  const [selectedSederId, setSelectedSederId] = useState<string | null>(() => {
    if (navState?.sederId) return navState.sederId;
    if (navState?.masechetId) {
      const seder = getSederForMasechet(navState.masechetId);
      return seder?.id ?? null;
    }
    return null;
  });
  const [selectedMasechet, setSelectedMasechet] = useState<Masechet | null>(() => {
    if (navState?.masechetId) return getMasechet(navState.masechetId) ?? null;
    return null;
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(() => navState?.chapter ?? 0);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (navState) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [navState, location.pathname, navigate]);

  const { plans, addPreLearnedChapters } = usePlanStore();
  const activePlans = plans.filter(p => !p.isCompleted);

  const selectedSeder = MISHNAH_STRUCTURE.find(s => s.id === selectedSederId);

  const relevantPlans = useMemo(() => {
    if (!selectedMasechet) return [];
    return activePlans.filter(p => p.masechetIds.includes(selectedMasechet.id));
  }, [activePlans, selectedMasechet]);

  const isChapterLearnedInAnyPlan = (masechetId: string, chapter: number) =>
    activePlans.some(p =>
      p.masechetIds.includes(masechetId) && isChapterPreLearned(p, masechetId, chapter)
    );

  const isChapterLearnedInPlan = (plan: LearningPlan, masechetId: string, chapter: number) =>
    isChapterPreLearned(plan, masechetId, chapter);

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const selectAllPlans = () => {
    setSelectedPlanIds(new Set(relevantPlans.map(p => p.id)));
  };

  const markAsLearned = (masechet: Masechet, chapter: number) => {
    const plansToMark = selectedPlanIds.size > 0
      ? relevantPlans.filter(p => selectedPlanIds.has(p.id))
      : relevantPlans;

    for (const plan of plansToMark) {
      if (!isChapterPreLearned(plan, masechet.id, chapter)) {
        addPreLearnedChapters(plan.id, [{ masechetId: masechet.id, chapter }]);
      }
    }
    setShowPlanPicker(false);
    setSelectedPlanIds(new Set());
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
                  className={`rounded-xl p-3 text-center transition-all ${learned
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
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${isCurrent
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
          <div className="mt-6 py-4 border-t border-parchment-200 space-y-2">
            {isChapterLearnedInAnyPlan(selectedMasechet.id, selectedChapter) ? (
              <>
                <div className="flex items-center justify-center gap-2 text-success font-bold py-2">
                  <Check className="w-5 h-5" />
                  פרק זה סומן כנלמד
                </div>
                {/* Show which plans still don't have it marked */}
                {relevantPlans.some(p => !isChapterLearnedInPlan(p, selectedMasechet.id, selectedChapter)) && (
                  <button
                    onClick={() => {
                      setSelectedPlanIds(new Set(
                        relevantPlans.filter(p => !isChapterLearnedInPlan(p, selectedMasechet.id, selectedChapter)).map(p => p.id)
                      ));
                      setShowPlanPicker(true);
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 w-full text-center"
                  >
                    סמן בתוכניות נוספות
                  </button>
                )}
              </>
            ) : relevantPlans.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                אין תוכנית פעילה עם מסכת {selectedMasechet.name}
              </p>
            ) : relevantPlans.length === 1 ? (
              <button
                onClick={() => markAsLearned(selectedMasechet, selectedChapter)}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700"
              >
                <Check className="w-5 h-5" />
                סמן כנלמד ב{relevantPlans[0].planName}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    selectAllPlans();
                    markAsLearned(selectedMasechet, selectedChapter);
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700"
                >
                  <Check className="w-5 h-5" />
                  סמן כנלמד בכל התוכניות ({relevantPlans.length})
                </button>
                <button
                  onClick={() => {
                    setShowPlanPicker(!showPlanPicker);
                    if (!showPlanPicker) setSelectedPlanIds(new Set());
                  }}
                  className="flex items-center justify-center gap-1 text-sm text-primary-600 hover:text-primary-800 w-full"
                >
                  בחר תוכניות ספציפיות
                  {showPlanPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </>
            )}

            {/* Plan picker */}
            {showPlanPicker && relevantPlans.length > 0 && (
              <div className="card border-primary-200 space-y-2">
                {relevantPlans.map(plan => {
                  const alreadyLearned = isChapterLearnedInPlan(plan, selectedMasechet.id, selectedChapter);
                  const isSelected = selectedPlanIds.has(plan.id);

                  return (
                    <button
                      key={plan.id}
                      onClick={() => !alreadyLearned && togglePlanSelection(plan.id)}
                      disabled={alreadyLearned}
                      className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl text-right transition-all ${alreadyLearned
                        ? 'bg-green-50 opacity-60'
                        : isSelected
                          ? 'bg-primary-100 ring-2 ring-primary-400'
                          : 'bg-parchment-50 hover:bg-parchment-100'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${alreadyLearned
                        ? 'bg-success border-success text-white'
                        : isSelected
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-300'
                        }`}>
                        {(alreadyLearned || isSelected) && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-sm text-primary-800">{plan.planName}</span>
                        {alreadyLearned && <span className="text-xs text-success mr-2">כבר סומן</span>}
                      </div>
                    </button>
                  );
                })}

                {selectedPlanIds.size > 0 && (
                  <button
                    onClick={() => markAsLearned(selectedMasechet, selectedChapter)}
                    className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    סמן ב-{selectedPlanIds.size} תוכניות
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
