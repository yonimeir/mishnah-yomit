import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Trophy, ChevronLeft } from 'lucide-react';
import { type LearningPlan, getSkippedUnitsCount, getPreLearnedUnitsCount } from '../store/usePlanStore';
import { getAmountForPosition } from '../services/scheduler';
import { getUnitLabel, getContentTypeLabels } from '../data/mishnah-structure';

interface PlanCardProps {
  plan: LearningPlan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate();

  let currentPosition = 0;
  let totalUnits = 0;
  let holesCount = 0;
  let preLearnedCount = 0;
  let todayAmount = 0;
  let isCompleted = true;

  const masechetIds = new Set<string>();

  plan.subPrograms.forEach(sp => {
    currentPosition += sp.currentPosition;
    totalUnits += sp.totalUnits;
    holesCount += getSkippedUnitsCount(sp);
    preLearnedCount += getPreLearnedUnitsCount(sp);
    if (!sp.isCompleted) isCompleted = false;
    todayAmount += getAmountForPosition(sp.currentPosition, sp.calculatedAmountPerDay, sp.distribution);
    sp.masechetIds.forEach(id => masechetIds.add(id));
  });

  const effectiveLearned = currentPosition - holesCount + preLearnedCount;
  const progress = totalUnits > 0 ? Math.round((effectiveLearned / totalUnits) * 100) : 0;

  // Assuming first sub-program determines the primary view mode
  const firstSp = plan.subPrograms[0];
  const ct = firstSp.contentType || 'mishnah';
  const unitLabel = getUnitLabel(ct, firstSp.unit);
  const ctLabels = getContentTypeLabels(ct);
  const masechetCount = masechetIds.size;

  return (
    <button
      onClick={() => navigate(`/plan/${plan.id}`)}
      className="card w-full text-right hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <ChevronLeft className="w-5 h-5 text-gray-400 mt-1" />
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Trophy className="w-5 h-5 text-gold-500" />
          ) : (
            <BookOpen className="w-5 h-5 text-primary-600" />
          )}
          <h3 className="text-lg font-bold text-primary-800">
            {plan.planName}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {firstSp.mode === 'by_book' ? 'לפי ספר' : 'לפי קצב'}
        </span>
        <span>
          {unitLabel} •{' '}
          {todayAmount} ליום
        </span>
        {masechetCount > 1 && (
          <span className="text-xs text-gray-400">{masechetCount} {ctLabels.bookPlural}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-parchment-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-gold-500' : 'bg-primary-500'
            }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {currentPosition} / {totalUnits}{' '}
          {unitLabel}
        </span>
        <span className="font-bold text-primary-700">{progress}%</span>
      </div>
    </button>
  );
}
