import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Trophy, ChevronLeft } from 'lucide-react';
import type { LearningPlan } from '../store/usePlanStore';
import { getAmountForPosition } from '../services/scheduler';

interface PlanCardProps {
  plan: LearningPlan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate();
  const progress = Math.round((plan.currentPosition / plan.totalUnits) * 100);
  const todayAmount = getAmountForPosition(plan.currentPosition, plan.calculatedAmountPerDay, plan.distribution);

  return (
    <button
      onClick={() => navigate(`/plan/${plan.id}`)}
      className="card w-full text-right hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <ChevronLeft className="w-5 h-5 text-gray-400 mt-1" />
        <div className="flex items-center gap-2">
          {plan.isCompleted ? (
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
          {plan.mode === 'by_book' ? 'לפי ספר' : 'לפי קצב'}
        </span>
        <span>
          {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'} •{' '}
          {todayAmount} ליום
        </span>
        {plan.masechetIds.length > 1 && (
          <span className="text-xs text-gray-400">{plan.masechetIds.length} מסכתות</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-parchment-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            plan.isCompleted ? 'bg-gold-500' : 'bg-primary-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {plan.currentPosition} / {plan.totalUnits}{' '}
          {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'}
        </span>
        <span className="font-bold text-primary-700">{progress}%</span>
      </div>
    </button>
  );
}
