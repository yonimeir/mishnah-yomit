import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, BookOpen } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';
import { getLearningItemsForDay, getAmountForPosition, gematriya, getTodaySubPrograms } from '../services/scheduler';
import { getMasechet, getMasechetUnits, globalToLocal, getSederForMasechet, formatGemaraItem } from '../data/mishnah-structure';
import MishnahTextDisplay from '../components/MishnahText';
import CompletionCelebration from '../components/CompletionCelebration';
import NextMasechetModal from '../components/NextMasechetModal';

interface ContinueInfo {
  masechetId: string;
  chapter: number;
  contentType: 'mishnah' | 'gemara' | 'rambam';
}

export default function LearningPage() {
  const { planId, subProgramId } = useParams<{ planId: string; subProgramId?: string }>();
  const navigate = useNavigate();
  const { plans, markDayComplete, reorderMasechtot } = usePlanStore();

  const plan = plans.find((p) => p.id === planId);

  // Fallback: if no subProgramId provided, pick the first one that has tasks today
  let subProgram = plan?.subPrograms.find(sp => sp.id === subProgramId);
  if (plan && !subProgram) {
    const todays = getTodaySubPrograms(plan);
    subProgram = todays.length > 0 ? todays[0].subProgram : plan.subPrograms[0];
  }

  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showNextMasechet, setShowNextMasechet] = useState(false);
  const [completedMasechetId, setCompletedMasechetId] = useState<string | null>(null);
  const [showDayComplete, setShowDayComplete] = useState(false);
  const [continueInfo, setContinueInfo] = useState<ContinueInfo | null>(null);

  if (!plan || !subProgram) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">התוכנית לא נמצאה</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">חזרה</button>
      </div>
    );
  }

  const todayAmount = getAmountForPosition(subProgram.currentPosition, subProgram.calculatedAmountPerDay, subProgram.distribution);
  const items = getLearningItemsForDay(
    subProgram.masechetIds,
    subProgram.unit,
    subProgram.currentPosition,
    todayAmount,
    subProgram.preLearnedChapters as any
  );

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">אין לימוד להיום</p>
        <button onClick={() => navigate(`/plan/${plan.id}`)} className="btn-primary mt-4">חזרה לתוכנית</button>
      </div>
    );
  }

  const currentItem = items[currentItemIdx];
  const isLastItem = currentItemIdx === items.length - 1;

  const checkMasechetCompletion = (totalCompleted: number): string | null => {
    if (subProgram.masechetIds.length <= 1) return null;

    const newPosition = subProgram.currentPosition + totalCompleted;

    const currentLoc = globalToLocal(subProgram.masechetIds, subProgram.currentPosition, subProgram.unit);
    if (!currentLoc) return null;

    const newLoc = globalToLocal(subProgram.masechetIds, newPosition, subProgram.unit);
    if (!newLoc) return null;

    if (newLoc.masechet.id !== currentLoc.masechet.id) {
      return currentLoc.masechet.id;
    }

    const m = currentLoc.masechet;
    const masechetUnits = getMasechetUnits(m, subProgram.unit);
    if (currentLoc.positionInMasechet + totalCompleted >= masechetUnits) {
      return m.id;
    }

    return null;
  };

  const computeContinueInfo = (): ContinueInfo | null => {
    const lastItem = items[items.length - 1];
    const ct = subProgram.contentType || 'mishnah';
    const masechet = getMasechet(lastItem.masechetId);
    if (!masechet) return null;

    const nextChapter = lastItem.chapter + 1;
    if (nextChapter <= masechet.chapters.length) {
      return { masechetId: lastItem.masechetId, chapter: nextChapter, contentType: ct };
    }

    const currentMasechetIdx = subProgram.masechetIds.indexOf(lastItem.masechetId);
    if (currentMasechetIdx < subProgram.masechetIds.length - 1) {
      return { masechetId: subProgram.masechetIds[currentMasechetIdx + 1], chapter: 1, contentType: ct };
    }

    return { masechetId: lastItem.masechetId, chapter: 1, contentType: ct };
  };

  const handleComplete = () => {
    let totalCompleted = 0;
    if (subProgram.unit === 'perek') {
      totalCompleted = items.length;
    } else {
      totalCompleted = items.reduce(
        (sum, item) => sum + (item.toMishnah - item.fromMishnah + 1),
        0
      );
    }

    const finishedMasechetId = checkMasechetCompletion(totalCompleted);

    const nextInfo = computeContinueInfo();
    setContinueInfo(nextInfo);

    const today = new Date().toISOString().split('T')[0];
    markDayComplete(plan.id, subProgram.id, today, totalCompleted);

    if (subProgram.currentPosition + totalCompleted >= subProgram.totalUnits) {
      setShowCelebration(true);
      return;
    }

    if (finishedMasechetId && subProgram.masechetIds.length > 2) {
      setCompletedMasechetId(finishedMasechetId);
      setShowNextMasechet(true);
      return;
    }

    setShowDayComplete(true);
  };

  const handleContinueFreeLearning = () => {
    if (!continueInfo) return;
    const masechet = getMasechet(continueInfo.masechetId);
    if (!masechet) return;
    const seder = getSederForMasechet(continueInfo.masechetId);
    navigate('/free', {
      state: {
        contentType: continueInfo.contentType,
        sederId: seder?.id,
        masechetId: continueInfo.masechetId,
        chapter: continueInfo.chapter,
      },
    });
  };

  const handleNextMasechetChoice = (chosenMasechetId: string | null) => {
    if (chosenMasechetId && chosenMasechetId !== null) {
      const currentIdx = subProgram.masechetIds.indexOf(chosenMasechetId);
      if (currentIdx > -1) {
        let firstUncompletedIdx = 0;
        let offset = 0;
        for (let i = 0; i < subProgram.masechetIds.length; i++) {
          const m = getMasechet(subProgram.masechetIds[i]);
          if (!m) continue;
          const units = getMasechetUnits(m, subProgram.unit);
          if (subProgram.currentPosition < offset + units) {
            firstUncompletedIdx = i;
            break;
          }
          offset += units;
        }

        if (currentIdx !== firstUncompletedIdx) {
          const newOrder = [...subProgram.masechetIds];
          const [moved] = newOrder.splice(currentIdx, 1);
          newOrder.splice(firstUncompletedIdx, 0, moved);
          reorderMasechtot(plan.id, subProgram.id, newOrder);
        }
      }
    }
    setShowNextMasechet(false);
    setShowDayComplete(true);
  };

  const chapterRef = `${currentItem.sefariaName} ${currentItem.chapter}`;

  return (
    <div className="space-y-4">
      {showCelebration && (
        <CompletionCelebration
          masechetName={subProgram.name || plan.planName}
          onClose={() => navigate(`/plan/${plan.id}`)}
        />
      )}

      {showNextMasechet && completedMasechetId && (
        <NextMasechetModal
          plan={plan}
          subProgramId={subProgram.id}
          completedMasechetId={completedMasechetId}
          onChoose={handleNextMasechetChoice}
        />
      )}

      {showDayComplete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">כל הכבוד!</h2>
            <p className="text-gray-600">הלימוד היומי הושלם בהצלחה</p>

            <div className="space-y-3 pt-2">
              {continueInfo && (
                <button
                  onClick={handleContinueFreeLearning}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  <BookOpen className="w-5 h-5" />
                  המשך לימוד חופשי
                </button>
              )}
              <button
                onClick={() => navigate(`/plan/${plan.id}`)}
                className="w-full btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <ArrowRight className="w-5 h-5" />
                חזרה לתוכנית
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/plan/${plan.id}`)}
          className="flex items-center gap-1 text-primary-600 hover:text-primary-800"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </button>
        <span className="text-sm text-gray-500">
          {currentItemIdx + 1} / {items.length}
        </span>
      </div>

      {/* Item navigation pills */}
      {items.length > 1 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentItemIdx(idx)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${idx === currentItemIdx
                ? 'bg-primary-700 text-white'
                : 'bg-parchment-200 text-gray-600'
                }`}
            >
              {subProgram.masechetIds.length > 1 && `${item.masechetName} `}
              {subProgram.contentType === 'gemara' ? (
                formatGemaraItem(getMasechet(item.masechetId), item.chapter, item.fromMishnah, item.toMishnah)
              ) : (
                <>
                  {gematriya(item.chapter)}
                  {item.fromMishnah === item.toMishnah ? `:${gematriya(item.fromMishnah)}` : ''}
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Text content */}
      <MishnahTextDisplay
        sefariaRef={chapterRef}
        sefariaName={currentItem.sefariaName}
        chapter={currentItem.chapter}
        fromMishnah={currentItem.fromMishnah}
        toMishnah={currentItem.toMishnah}
        masechetName={currentItem.masechetName}
        contentType={subProgram.contentType || 'mishnah'}
        masechetId={currentItem.masechetId}
      />

      {/* Bottom navigation */}
      <div className="mt-6 py-4 flex gap-3 border-t border-parchment-200">
        {currentItemIdx > 0 && (
          <button
            onClick={() => setCurrentItemIdx(currentItemIdx - 1)}
            className="btn-secondary flex items-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
            הקודם
          </button>
        )}

        <div className="flex-1" />

        {!isLastItem ? (
          <button
            onClick={() => setCurrentItemIdx(currentItemIdx + 1)}
            className="btn-primary flex items-center gap-1"
          >
            הבא
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="btn-primary flex items-center gap-2 bg-success hover:bg-green-700"
          >
            <Check className="w-5 h-5" />
            סיימתי את הלימוד
          </button>
        )}
      </div>
    </div>
  );
}
