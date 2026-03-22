import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';
import PlanCard from '../components/PlanCard';

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365];

function getStreakMilestoneMessage(streak: number): string | null {
  if (STREAK_MILESTONES.includes(streak)) {
    if (streak === 7) return `🎉 שבוע ברצף! מדהים!`;
    if (streak === 14) return `⭐ שבועיים ברצף! לא מפסיקים!`;
    if (streak === 30) return `🏆 חודש ברצף! כל הכבוד!`;
    if (streak === 60) return `👑 חודשיים ברצף! מלך!`;
    if (streak === 100) return `💯 100 ימים ברצף! מדהים!`;
    if (streak === 180) return `🔥 חצי שנה ברצף! לא יאמן!`;
    if (streak === 365) return `🌟 שנה שלמה ברצף! חיד"א גאה!`;
  }
  return null;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { plans, streak, lastStreakDate } = usePlanStore();

  const activePlans = plans.filter((p) => p.subPrograms.some(sp => !sp.isCompleted));
  const completedPlans = plans.filter((p) => p.subPrograms.every(sp => sp.isCompleted));

  const today = new Date().toISOString().split('T')[0];
  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  const learnedToday = lastStreakDate === today;
  const streakAtRisk = !learnedToday && lastStreakDate === yesterday && streak > 0;
  const milestoneMessage = getStreakMilestoneMessage(streak);

  if (plans.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-parchment-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10 text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-primary-800 mb-3">
          ברוכים הבאים!
        </h2>
        <p className="text-gray-600 mb-8 max-w-xs mx-auto">
          התחל לימוד יומי - משנה, גמרא או רמב"ם. צור תוכנית לימוד מותאמת אישית.
        </p>
        <button
          onClick={() => navigate('/new-plan')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          צור תוכנית לימוד
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Streak banner */}
      {streak > 0 && (
        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
          learnedToday
            ? 'bg-orange-50 border border-orange-200'
            : streakAtRisk
              ? 'bg-red-50 border border-red-200'
              : 'bg-parchment-50 border border-parchment-200'
        }`}>
          <span className="text-3xl">{learnedToday ? '🔥' : streakAtRisk ? '⚠️' : '🔥'}</span>
          <div className="flex-1">
            <p className={`font-bold text-lg ${
              learnedToday ? 'text-orange-700' : streakAtRisk ? 'text-red-700' : 'text-gray-600'
            }`}>
              {streak} {streak === 1 ? 'יום' : 'ימים'} ברצף
            </p>
            {learnedToday && (
              <p className="text-xs text-orange-500">למדת היום - המשך כך!</p>
            )}
            {streakAtRisk && (
              <p className="text-xs text-red-500">לא למדת היום - הרצף בסכנה! 😬</p>
            )}
          </div>
          {streak >= 7 && (
            <div className="bg-orange-100 rounded-xl px-2 py-1">
              <span className="text-xs font-bold text-orange-600">
                {streak >= 365 ? '🌟' : streak >= 100 ? '👑' : streak >= 30 ? '🏆' : '⭐'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Milestone message */}
      {milestoneMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-center">
          <p className="font-bold text-yellow-800 text-sm">{milestoneMessage}</p>
        </div>
      )}

      {/* Active plans */}
      {activePlans.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-primary-800 mb-3">
            תוכניות פעילות
          </h2>
          <div className="space-y-3">
            {activePlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Completed plans */}
      {completedPlans.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-primary-800 mb-3">
            תוכניות שהושלמו
          </h2>
          <div className="space-y-3">
            {completedPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>
      )}

      {/* Add new plan button */}
      <button
        onClick={() => navigate('/new-plan')}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        תוכנית חדשה
      </button>
    </div>
  );
}
