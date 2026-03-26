import { useMemo } from 'react';
import { AlertTriangle, X, TrendingUp, Clock, FastForward, BookCopy } from 'lucide-react';
import { usePlanStore, type LearningPlan, type SubProgram } from '../store/usePlanStore';
import { getMissedLearningDays, calcCatchUpPace, calculateByPaceScheduleMulti } from '../services/scheduler';
import { getUnitLabel, getContentTypeLabels } from '../data/mishnah-structure';

interface MissedDaysModalProps {
  plan: LearningPlan;
  subProgram: SubProgram;
  today: string;
  onClose: () => void;
}

export default function MissedDaysModal({ plan, subProgram, today, onClose }: MissedDaysModalProps) {
  const { acknowledgeMissedDays, updatePace, addCatchUpUnits, skipAheadUnits } = usePlanStore();

  const ct = subProgram.contentType || 'mishnah';
  const unitLabel = getUnitLabel(ct, subProgram.unit);
  const ctLabels = getContentTypeLabels(ct);

  const missedDays = useMemo(
    () => getMissedLearningDays(subProgram.lastLearningDate, today, subProgram.frequency),
    [subProgram.lastLearningDate, today, subProgram.frequency]
  );

  const unitsBehind = missedDays * subProgram.calculatedAmountPerDay;
  const remainingUnits = subProgram.totalUnits - subProgram.currentPosition;

  // For by_book: new pace required to still hit the target date
  const catchUpPace = useMemo(() => {
    if (subProgram.mode !== 'by_book' || !subProgram.targetDate) return null;
    return calcCatchUpPace(remainingUnits, subProgram.targetDate, subProgram.frequency);
  }, [subProgram.mode, subProgram.targetDate, remainingUnits, subProgram.frequency]);

  // For by_pace: updated estimated end date from current position
  const newEstimatedEndDate = useMemo(() => {
    if (subProgram.mode !== 'by_pace') return null;
    const result = calculateByPaceScheduleMulti(
      subProgram.masechetIds,
      subProgram.unit,
      subProgram.calculatedAmountPerDay,
      subProgram.frequency,
    );
    return result.estimatedEndDate.toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  }, [subProgram]);

  const targetDateDisplay = subProgram.targetDate
    ? new Date(subProgram.targetDate + 'T12:00:00').toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    : null;

  const lastLearningDisplay = subProgram.lastLearningDate
    ? new Date(subProgram.lastLearningDate + 'T12:00:00').toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long',
    })
    : null;

  const isBehindTargetDate =
    subProgram.mode === 'by_book' &&
    catchUpPace !== null &&
    catchUpPace > subProgram.calculatedAmountPerDay;

  // ── Handlers ──

  const handleDismiss = () => {
    acknowledgeMissedDays(plan.id, subProgram.id, today);
    onClose();
  };

  const handleCatchUpPace = () => {
    if (catchUpPace === null) return;
    updatePace(plan.id, subProgram.id, catchUpPace, undefined);
    acknowledgeMissedDays(plan.id, subProgram.id, today);
    onClose();
  };

  const handleCatchUpLater = () => {
    addCatchUpUnits(plan.id, subProgram.id, unitsBehind, today);
    onClose();
  };

  const handleSkipAhead = () => {
    skipAheadUnits(plan.id, subProgram.id, unitsBehind, today);
    onClose();
  };

  if (missedDays === 0) return null;

  const unitsBehindCapped = Math.min(unitsBehind, remainingUnits);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-4 flex items-start gap-3">
          <div className="bg-amber-100 rounded-xl p-2 mt-0.5 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-amber-900 text-base">פספסת ימי לימוד</h2>
            {lastLearningDisplay && (
              <p className="text-xs text-amber-600 mt-0.5">
                הלימוד האחרון היה ב-{lastLearningDisplay}
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-amber-200 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-parchment-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{missedDays}</p>
              <p className="text-xs text-gray-500">ימי לימוד שפוספסו</p>
            </div>
            <div className="bg-parchment-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{unitsBehindCapped}</p>
              <p className="text-xs text-gray-500">{unitLabel} מאחור</p>
            </div>
          </div>

          {/* Impact on target */}
          {subProgram.mode === 'by_book' && targetDateDisplay && (
            <div className={`mt-3 rounded-xl p-3 border ${
              isBehindTargetDate ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-bold text-gray-600">יעד: {targetDateDisplay}</p>
              </div>
              {isBehindTargetDate ? (
                <p className="text-xs text-red-700">
                  כדי להגיע ליעד צריך{' '}
                  <span className="font-bold">{catchUpPace} {unitLabel}/יום</span>
                  {' '}(במקום {subProgram.calculatedAmountPerDay})
                </p>
              ) : (
                <p className="text-xs text-green-700">עדיין ניתן להגיע ליעד בקצב הנוכחי</p>
              )}
            </div>
          )}

          {subProgram.mode === 'by_pace' && newEstimatedEndDate && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs font-bold text-blue-700">הערכת סיום מעודכנת</p>
              </div>
              <p className="text-xs text-blue-800">
                בהמשך בקצב הנוכחי: <span className="font-bold">{newEstimatedEndDate}</span>
              </p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="px-5 pb-5 pt-3 space-y-2">
          <p className="text-xs font-bold text-gray-500 text-center mb-3">מה תרצה לעשות?</p>

          {/* Option 1: Update pace to meet target (by_book only, when behind) */}
          {isBehindTargetDate && catchUpPace !== null && (
            <button
              onClick={handleCatchUpPace}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors text-right"
            >
              <TrendingUp className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-sm">עדכן קצב לתפוס את היעד</p>
                <p className="text-xs text-primary-200">
                  {catchUpPace} {unitLabel}/יום במקום {subProgram.calculatedAmountPerDay}
                </p>
              </div>
            </button>
          )}

          {/* Option 2: Catch up later (accumulate debt, learn in free time) */}
          {unitsBehindCapped > 0 && (
            <button
              onClick={handleCatchUpLater}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors text-right"
            >
              <BookCopy className="w-5 h-5 shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="font-bold text-sm">השלם בהזדמנות</p>
                <p className="text-xs text-blue-600">
                  שמור {unitsBehindCapped} {unitLabel} להשלמה בלימוד חופשי
                </p>
              </div>
            </button>
          )}

          {/* Option 3: Skip ahead (advance position, lose the content) */}
          {unitsBehindCapped > 0 && (
            <button
              onClick={handleSkipAhead}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-parchment-50 border border-parchment-200 text-gray-700 hover:bg-parchment-100 transition-colors text-right"
            >
              <FastForward className="w-5 h-5 shrink-0 text-gray-500" />
              <div className="flex-1">
                <p className="font-bold text-sm">דלג לנקודה הנוכחית</p>
                <p className="text-xs text-gray-500">
                  קפוץ קדימה {unitsBehindCapped} {unitLabel} — המשך כאילו לא פספסת
                </p>
              </div>
            </button>
          )}

          {/* Option 4: Continue normally */}
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:bg-parchment-100 transition-colors font-bold"
          >
            המשך כרגיל ({subProgram.calculatedAmountPerDay} {unitLabel}/יום)
          </button>
        </div>
      </div>
    </div>
  );
}
