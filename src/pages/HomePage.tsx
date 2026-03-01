import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';
import PlanCard from '../components/PlanCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { plans } = usePlanStore();

  const activePlans = plans.filter((p) => !p.isCompleted);
  const completedPlans = plans.filter((p) => p.isCompleted);

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
