import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Square, BookCopy } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';
import { getLearningItemsForDay, getAmountForPosition, gematriya } from '../services/scheduler';
import { getMasechet, getUnitLabel, formatGemaraItem } from '../data/mishnah-structure';
import MishnahTextDisplay from '../components/MishnahText';

export default function CatchUpPage() {
  const { planId, subProgramId } = useParams<{ planId: string; subProgramId: string }>();
  const navigate = useNavigate();
  const { plans, advancePositionBy, reduceCatchUpUnits } = usePlanStore();

  const plan = plans.find(p => p.id === planId);
  const subProgram = plan?.subPrograms.find(sp => sp.id === subProgramId);

  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);

  if (!plan || !subProgram) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">התוכנית לא נמצאה</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">חזרה</button>
      </div>
    );
  }

  const catchUpUnits = subProgram.catchUpUnits || 0;

  if (catchUpUnits === 0 && !sessionDone) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-primary-800">אין השלמות פתוחות</h2>
        <p className="text-gray-500">כל החומר מעודכן</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-2">חזרה</button>
      </div>
    );
  }

  const ct = subProgram.contentType || 'mishnah';
  const unitLabel = getUnitLabel(ct, subProgram.unit);

  // Batch size = one regular day's worth (or remaining catch-up if less)
  const batchSize = Math.min(
    getAmountForPosition(subProgram.currentPosition, subProgram.calculatedAmountPerDay, subProgram.distribution),
    catchUpUnits
  );

  const items = getLearningItemsForDay(
    subProgram.masechetIds,
    subProgram.unit,
    subProgram.currentPosition,
    batchSize,
    subProgram.preLearnedChapters as any,
  );

  const handleComplete = () => {
    if (items.length === 0) return;

    let unitsCompleted: number;
    if (subProgram.unit === 'perek') {
      unitsCompleted = items.length;
    } else {
      unitsCompleted = items.reduce((sum, item) => sum + (item.toMishnah - item.fromMishnah + 1), 0);
    }

    advancePositionBy(plan.id, subProgram.id, unitsCompleted);
    reduceCatchUpUnits(plan.id, subProgram.id, unitsCompleted);
    setSessionDone(true);
  };

  if (sessionDone) {
    const remaining = Math.max(0, catchUpUnits - batchSize);
    return (
      <div className="text-center py-12 space-y-4 px-4">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-primary-800">סשן השלמה הושלם!</h2>
        <p className="text-gray-500">למדת {batchSize} {unitLabel} נוספות</p>

        {remaining > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-xs mx-auto">
            <p className="text-sm text-blue-700">
              נותרו עוד <span className="font-bold">{remaining} {unitLabel}</span> להשלמה
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-xs mx-auto">
            <p className="text-sm font-bold text-green-700">השלמת את כל הפיגורים! 🎉</p>
          </div>
        )}

        <div className="space-y-2 pt-2 max-w-xs mx-auto w-full">
          {remaining > 0 && (
            <button
              onClick={() => { setSessionDone(false); setCurrentItemIdx(0); }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <BookCopy className="w-5 h-5" />
              סשן השלמה נוסף
            </button>
          )}
          <button
            onClick={() => navigate(`/plan/${plan.id}`)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לתוכנית
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">אין תוכן להשלמה כרגע</p>
        <button onClick={() => navigate(`/plan/${plan.id}`)} className="btn-primary mt-4">חזרה</button>
      </div>
    );
  }

  const currentItem = items[currentItemIdx];
  const isLastItem = currentItemIdx === items.length - 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/plan/${plan.id}`)}
          className="flex items-center gap-1 text-primary-600 hover:text-primary-800"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </button>
        <div className="text-center">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            מצב השלמה
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {currentItemIdx + 1} / {items.length}
        </span>
      </div>

      {/* Catch-up progress banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-blue-600">נותרו להשלמה</span>
        <span className="font-bold text-blue-800 text-sm">
          {catchUpUnits} {unitLabel}
        </span>
      </div>

      {/* Item navigation pills */}
      {items.length > 1 && (
        <div className="flex gap-2 justify-center flex-wrap">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentItemIdx(idx)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                idx === currentItemIdx
                  ? 'bg-blue-600 text-white'
                  : 'bg-parchment-200 text-gray-600'
              }`}
            >
              {subProgram.masechetIds.length > 1 && `${item.masechetName} `}
              {ct === 'gemara' ? (
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
        sefariaRef={ct === 'gemara'
          ? `${currentItem.sefariaName} ${currentItem.chapter}`
          : `${currentItem.sefariaName} ${currentItem.chapter}`}
        sefariaName={currentItem.sefariaName}
        chapter={currentItem.chapter}
        fromMishnah={currentItem.fromMishnah}
        toMishnah={currentItem.toMishnah}
        masechetName={currentItem.masechetName}
        contentType={ct}
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

        <button
          onClick={() => navigate(`/plan/${plan.id}`)}
          className="btn-secondary flex items-center gap-1"
        >
          <Square className="w-4 h-4" />
          עצור
        </button>

        {!isLastItem ? (
          <button
            onClick={() => setCurrentItemIdx(currentItemIdx + 1)}
            className="btn-primary flex items-center gap-1"
          >
            הבא
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Check className="w-5 h-5" />
            סיימתי סשן זה
          </button>
        )}
      </div>
    </div>
  );
}
