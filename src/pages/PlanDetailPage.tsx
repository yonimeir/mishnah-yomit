import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, RotateCcw, Play, CheckCheck, AlertTriangle, Settings, Plus } from 'lucide-react';
import { usePlanStore, getSkippedUnitsCount, getPreLearnedUnitsCount, type SubProgram, type LearningPlan } from '../store/usePlanStore';
import { globalToLocal, indexToRef, getUnitLabel, getContentTypeLabels, getMasechet, formatGemaraPoint, formatGemaraItem } from '../data/mishnah-structure';
import { gematriya, getLearningItemsForDay, getAmountForPosition } from '../services/scheduler';
import ProgressTable from '../components/ProgressTable';
import AlreadyLearnedModal from '../components/AlreadyLearnedModal';
import PlanSettingsModal from '../components/PlanSettingsModal';

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plans, removePlan } = usePlanStore();

  const plan = plans.find((p) => p.id === planId);

  if (!plan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">התוכנית לא נמצאה</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">חזרה לדף הבית</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Plan Header */}
      <div className="flex items-center justify-between pb-4 border-b border-parchment-200">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">{plan.planName}</h1>
          <p className="text-sm text-gray-500">{plan.subPrograms.length} מסלולי לימוד בתוכנית זו</p>
        </div>
        <button
          onClick={() => {
            if (confirm('האם אתה בטוח שברצונך למחוק את התוכנית כולה?')) {
              removePlan(plan.id);
              navigate('/');
            }
          }}
          className="p-2 bg-red-50 text-danger rounded-xl hover:bg-red-100 transition-colors"
          title="מחק תוכנית"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {plan.subPrograms.map((sp) => (
        <SubProgramSection key={sp.id} plan={plan} subProgram={sp} />
      ))}

      {/* Button to add a new sub-program to this plan (optional enhancement) */}
      <div className="pt-4 flex justify-center border-t border-parchment-200">
        <button
          onClick={() => navigate(`/plan/${plan.id}/add-subprogram`)}
          className="btn-secondary flex items-center justify-center gap-2 text-sm max-w-sm w-full"
        >
          <Plus className="w-4 h-4" />
          הוסף מסלול לימוד חדש לתוכנית
        </button>
      </div>
    </div>
  );
}

function SubProgramSection({ plan, subProgram }: { plan: LearningPlan, subProgram: SubProgram }) {
  const navigate = useNavigate();
  const { resetSubProgram, removeSubProgram } = usePlanStore();

  const [showAlreadyLearned, setShowAlreadyLearned] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const holesCount = getSkippedUnitsCount(subProgram);
  const preLearnedCount = getPreLearnedUnitsCount(subProgram);
  const effectiveLearned = subProgram.currentPosition - holesCount + preLearnedCount;
  const effectiveRemaining = subProgram.totalUnits - subProgram.currentPosition - preLearnedCount;
  const progress = Math.round((effectiveLearned / subProgram.totalUnits) * 100);

  // Get current position info
  const currentLoc = !subProgram.isCompleted
    ? globalToLocal(subProgram.masechetIds, subProgram.currentPosition, subProgram.unit)
    : null;

  // Compute today's actual amount (tapered vs even)
  const todayAmount = getAmountForPosition(subProgram.currentPosition, subProgram.calculatedAmountPerDay, subProgram.distribution);

  // Get today's learning items
  const todayItems = subProgram.isCompleted
    ? []
    : getLearningItemsForDay(subProgram.masechetIds, subProgram.unit, subProgram.currentPosition, todayAmount, subProgram.preLearnedChapters as any);

  const ct = subProgram.contentType || 'mishnah';
  const unitLabel = getUnitLabel(ct, subProgram.unit);
  const ctLabels = getContentTypeLabels(ct);

  const displayName = subProgram.name || 'מסלול ראשי';

  return (
    <div className="space-y-4 mb-8">
      {/* Header card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-primary-100 rounded-xl p-3">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-primary-800">{displayName}</h2>
            <p className="text-sm text-gray-500">
              {subProgram.mode === 'by_book' ? 'לפי ספר' : 'לפי קצב'} •{' '}
              {unitLabel}
              {subProgram.masechetIds.length > 1 && ` • ${subProgram.masechetIds.length} ${ctLabels.bookPlural}`}
            </p>
          </div>
          {!subProgram.isCompleted && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl hover:bg-parchment-200 transition-colors"
              title="הגדרות מסלול"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-parchment-200 rounded-full h-4 mb-2 relative overflow-hidden">
          <div
            className={`absolute inset-y-0 right-0 rounded-full transition-all duration-500 ${subProgram.isCompleted ? 'bg-gold-500' : 'bg-primary-500'
              }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-500">
            {effectiveLearned} / {subProgram.totalUnits}
          </span>
          <span className="font-bold text-primary-700">{progress}%</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-parchment-50 rounded-xl py-2">
            <p className="text-lg font-bold text-primary-800">{todayAmount}</p>
            <p className="text-xs text-gray-500">{unitLabel}/יום</p>
          </div>
          <div className="bg-parchment-50 rounded-xl py-2">
            <p className="text-lg font-bold text-primary-800">{subProgram.completedDates.length}</p>
            <p className="text-xs text-gray-500">ימי לימוד</p>
          </div>
          <div className="bg-parchment-50 rounded-xl py-2">
            <p className="text-lg font-bold text-primary-800">{Math.max(0, effectiveRemaining)}</p>
            <p className="text-xs text-gray-500">נותרו</p>
          </div>
        </div>

        {/* Extra info row */}
        {(holesCount > 0 || preLearnedCount > 0) && (
          <div className="flex gap-2 mt-3 justify-center flex-wrap">
            {holesCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
                {holesCount} {unitLabel} להשלמה
              </span>
            )}
            {preLearnedCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                {preLearnedCount} {unitLabel} נלמדו מראש
              </span>
            )}
          </div>
        )}

        {/* Distribution info */}
        {subProgram.distribution && !subProgram.distribution.isExact && subProgram.distribution.strategy === 'tapered' && !subProgram.isCompleted && (
          <div className="bg-parchment-50 rounded-xl px-3 py-2 text-xs text-gray-500 text-center mt-2">
            {subProgram.currentPosition < subProgram.distribution.cutoffPosition ? (
              <span>
                📊 {subProgram.distribution.highAmount} {unitLabel}/יום עכשיו, יירד ל-{subProgram.distribution.lowAmount} בהמשך
              </span>
            ) : (
              <span>
                📊 ירדת ל-{subProgram.distribution.lowAmount} {unitLabel}/יום (סיום בדיוק ביעד)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Holes banner */}
      {holesCount > 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">
                יש {subProgram.skippedChapters.length} פרקים שדילגת עליהם
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                לחץ על פרק כתום בטבלה כדי לסמן כנלמד
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current position */}
      {currentLoc && currentLoc.positionInMasechet < currentLoc.masechet.chapters.reduce((s: number, c: number) => s + c, 0) && (
        <div className="card bg-primary-50 border-primary-200">
          <p className="text-sm text-primary-600 mb-1">המיקום הנוכחי שלך:</p>
          <p className="font-bold text-primary-800">
            {subProgram.masechetIds.length > 1 && `מסכת ${currentLoc.masechet.name} • `}
            {subProgram.contentType === 'gemara'
              ? formatGemaraPoint(currentLoc.masechet, currentLoc.positionInMasechet)
              : (subProgram.unit === 'mishnah'
                ? (() => {
                  const ref = indexToRef(currentLoc.masechet, currentLoc.positionInMasechet);
                  return `פרק ${gematriya(ref.chapter)} משנה ${gematriya(ref.mishnah)}`;
                })()
                : `פרק ${gematriya(currentLoc.positionInMasechet + 1)}`
              )
            }
          </p>
        </div>
      )}

      {/* Today's learning */}
      {!subProgram.isCompleted && todayItems.length > 0 && (
        <div className="card border border-primary-200">
          <h3 className="font-bold text-primary-700 mb-3">הלימוד של היום</h3>
          <div className="space-y-2 mb-4">
            {todayItems.map((item, idx) => (
              <div key={idx} className="bg-parchment-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {item.toMishnah - item.fromMishnah + 1} {unitLabel}
                </span>
                <span className="font-bold text-primary-800">
                  {subProgram.masechetIds.length > 1 && <span className="text-xs text-gray-500 ml-2">{item.masechetName}</span>}
                  {subProgram.contentType === 'gemara' ? (
                    formatGemaraItem(getMasechet(item.masechetId), item.chapter, item.fromMishnah, item.toMishnah)
                  ) : (
                    <>
                      פרק {gematriya(item.chapter)}{' '}
                      {item.fromMishnah === item.toMishnah
                        ? `משנה ${gematriya(item.fromMishnah)}`
                        : `משניות ${gematriya(item.fromMishnah)}-${gematriya(item.toMishnah)}`}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(`/learn/${plan.id}/${subProgram.id}`)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            התחל ללמוד במסלול זה
          </button>
        </div>
      )}

      {/* Completed banner */}
      {subProgram.isCompleted && holesCount === 0 && (
        <div className="card bg-green-50 border-green-200 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-lg font-bold text-success">הדרן עלך!</p>
          <p className="text-sm text-gray-600">סיימת את מסלול {displayName}</p>
        </div>
      )}

      {subProgram.isCompleted && holesCount > 0 && (
        <div className="card bg-amber-50 border-amber-200 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-lg font-bold text-amber-800">כמעט סיימת!</p>
          <p className="text-sm text-amber-600">
            נותרו {holesCount} {unitLabel} להשלמה במסלול
          </p>
        </div>
      )}

      {/* Already learned button */}
      {!subProgram.isCompleted && (
        <button
          onClick={() => setShowAlreadyLearned(true)}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <CheckCheck className="w-5 h-5" />
          כבר למדתי (דילוג על פרקים)
        </button>
      )}

      {/* Already learned modal */}
      {showAlreadyLearned && (
        <AlreadyLearnedModal
          plan={plan}
          subProgram={subProgram}
          onClose={() => setShowAlreadyLearned(false)}
        />
      )}

      {/* Plan settings modal */}
      {showSettings && (
        <PlanSettingsModal
          plan={plan}
          subProgram={subProgram}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Progress table */}
      <ProgressTable plan={plan} subProgram={subProgram} />

      {/* Actions */}
      {plan.subPrograms.length > 1 && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (confirm('האם אתה בטוח שברצונך לאפס את ההתקדמות במסלול זה?')) resetSubProgram(plan.id, subProgram.id);
            }}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            אפס התקדמות
          </button>
          <button
            onClick={() => {
              if (confirm('האם למחוק מסלול זה מסל הקורסים של התוכנית?')) {
                removeSubProgram(plan.id, subProgram.id);
              }
            }}
            className="flex-1 bg-red-50 text-danger px-4 py-3 rounded-xl font-bold border-2 border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            מחק מסלול
          </button>
        </div>
      )}

      {plan.subPrograms.length === 1 && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (confirm('האם אתה בטוח שברצונך לאפס את ההתקדמות בתוכנית?')) {
                resetSubProgram(plan.id, subProgram.id);
              }
            }}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            אפס התקדמות
          </button>
        </div>
      )}
    </div>
  );
}
