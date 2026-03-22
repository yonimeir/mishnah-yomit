import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, BookOpen, Square } from 'lucide-react';
import { usePlanStore, getPreLearnedUnitsCount } from '../store/usePlanStore';
import { getLearningItemsForDay, getAmountForPosition, gematriya, getTodaySubPrograms } from '../services/scheduler';
import { getMasechet, getMasechetUnits, globalToLocal, formatGemaraItem, getUnitLabel } from '../data/mishnah-structure';
import MishnahTextDisplay from '../components/MishnahText';
import CompletionCelebration from '../components/CompletionCelebration';
import NextMasechetModal from '../components/NextMasechetModal';

export default function LearningPage() {
  const { planId, subProgramId } = useParams<{ planId: string; subProgramId?: string }>();
  const navigate = useNavigate();
  const { plans, markDayComplete, reorderMasechtot, advancePositionBy } = usePlanStore();

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
  const [showContinuation, setShowContinuation] = useState(false);

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

  const handleStartContinuation = () => {
    setShowDayComplete(false);
    setShowContinuation(true);
  };

  const handleContinuationMark = () => {
    if (continuationItems.length === 0) return;
    const item = continuationItems[0];
    const units = subProgram.unit === 'perek' ? 1 : (item.toMishnah - item.fromMishnah + 1);
    advancePositionBy(plan.id, subProgram.id, units);
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

  // Continuation mode: get 1 unit at a time from current plan position
  const continuationItems = showContinuation
    ? getLearningItemsForDay(
        subProgram.masechetIds,
        subProgram.unit,
        subProgram.currentPosition,
        1,
        subProgram.preLearnedChapters as any,
      )
    : [];

  const unitLabel = getUnitLabel(subProgram.contentType || 'mishnah', subProgram.unit);
  const preLearnedCount = getPreLearnedUnitsCount(subProgram);
  const remainingAfterToday = Math.max(0, subProgram.totalUnits - subProgram.currentPosition - preLearnedCount);

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

            {remainingAfterToday > 0 && (
              <div className="bg-parchment-50 rounded-xl px-4 py-2 text-sm text-primary-700">
                נותרו עוד <span className="font-bold">{remainingAfterToday}</span> {unitLabel} לסיום התוכנית
              </div>
            )}

            <div className="space-y-3 pt-2">
              {!subProgram.isCompleted && (
                <button
                  onClick={handleStartContinuation}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  <BookOpen className="w-5 h-5" />
                  המשך ללמוד עוד
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

      {showContinuation && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-parchment-200">
            <button
              onClick={() => { setShowContinuation(false); navigate(`/plan/${plan.id}`); }}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-800"
            >
              <ArrowRight className="w-4 h-4" />
              סיום
            </button>
            <div className="text-sm text-gray-500">
              {remainingAfterToday > 0
                ? `נותרו ${remainingAfterToday} ${unitLabel}`
                : 'סיום התוכנית!'}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {continuationItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-5xl">🎉</div>
                <p className="text-xl font-bold text-primary-800">הדרן עלך!</p>
                <p className="text-gray-500">סיימת את כל התוכנית</p>
                <button
                  onClick={() => { setShowContinuation(false); navigate(`/plan/${plan.id}`); }}
                  className="btn-primary mt-4"
                >
                  חזרה לתוכנית
                </button>
              </div>
            ) : (
              <>
                <MishnahTextDisplay
                  sefariaRef={`${continuationItems[0].sefariaName} ${continuationItems[0].chapter}`}
                  sefariaName={continuationItems[0].sefariaName}
                  chapter={continuationItems[0].chapter}
                  fromMishnah={continuationItems[0].fromMishnah}
                  toMishnah={continuationItems[0].toMishnah}
                  masechetName={continuationItems[0].masechetName}
                  contentType={subProgram.contentType || 'mishnah'}
                  masechetId={continuationItems[0].masechetId}
                />

                <div className="flex gap-3 pt-2 border-t border-parchment-200">
                  <button
                    onClick={() => { setShowContinuation(false); navigate(`/plan/${plan.id}`); }}
                    className="btn-secondary flex items-center gap-2 flex-1"
                  >
                    <Square className="w-4 h-4" />
                    עצור
                  </button>
                  <button
                    onClick={handleContinuationMark}
                    className="btn-primary flex items-center gap-2 flex-1 bg-success hover:bg-green-700"
                  >
                    <Check className="w-5 h-5" />
                    סמן כנלמד והמשך
                  </button>
                </div>
              </>
            )}
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
