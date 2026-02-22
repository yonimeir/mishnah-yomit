import { useState, useMemo } from 'react';
import { X, Plus, Minus, ChevronUp, ChevronDown, Trash2, BookOpen } from 'lucide-react';
import {
  MISHNAH_STRUCTURE,
  getMasechet,
  getTotalMishnayot,
  getMultiMasechetTotalUnits,
} from '../data/mishnah-structure';
import type { DistributionInfo } from '../services/scheduler';
import { usePlanStore, type LearningPlan } from '../store/usePlanStore';

interface PlanSettingsModalProps {
  plan: LearningPlan;
  onClose: () => void;
}

type SettingsTab = 'pace' | 'masechtot';

export default function PlanSettingsModal({ plan, onClose }: PlanSettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>('pace');
  const { updatePace, addMasechtot, reorderMasechtot } = usePlanStore();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-parchment-200">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-lg font-bold text-primary-800">הגדרות תוכנית</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-parchment-200">
          <button
            onClick={() => setTab('pace')}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
              tab === 'pace' ? 'text-primary-700 border-b-2 border-primary-500' : 'text-gray-500'
            }`}
          >
            קצב לימוד
          </button>
          <button
            onClick={() => setTab('masechtot')}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
              tab === 'masechtot' ? 'text-primary-700 border-b-2 border-primary-500' : 'text-gray-500'
            }`}
          >
            מסכתות וסדר
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {tab === 'pace' && (
            <PaceSettings plan={plan} updatePace={updatePace} onClose={onClose} />
          )}
          {tab === 'masechtot' && (
            <MasechtotSettings
              plan={plan}
              addMasechtot={addMasechtot}
              reorderMasechtot={reorderMasechtot}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pace Settings Tab ──

function PaceSettings({
  plan,
  updatePace,
  onClose,
}: {
  plan: LearningPlan;
  updatePace: (planId: string, amount: number, dist?: DistributionInfo & { strategy: 'even' | 'tapered' }) => void;
  onClose: () => void;
}) {
  const [newAmount, setNewAmount] = useState(plan.calculatedAmountPerDay);

  const unitLabel = plan.unit === 'mishnah' ? 'משניות' : 'פרקים';
  const remaining = plan.totalUnits - plan.currentPosition;

  const newEstimate = useMemo(() => {
    if (remaining <= 0) return null;
    return Math.ceil(remaining / newAmount);
  }, [newAmount, remaining]);

  const hasChanged = newAmount !== plan.calculatedAmountPerDay;

  const handleSave = () => {
    // Clear distribution when manually changing pace
    updatePace(plan.id, newAmount, undefined);
    onClose();
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 text-center">
        שנה את כמות הלימוד היומית
      </p>

      {/* Amount adjuster */}
      <div className="card bg-parchment-50">
        <label className="block font-bold text-primary-700 mb-3 text-center">
          {unitLabel} ביום לימוד
        </label>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setNewAmount(Math.max(1, newAmount - 1))}
            className="bg-parchment-200 rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-parchment-300 transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          <span className="text-4xl font-bold text-primary-800 w-16 text-center">{newAmount}</span>
          <button
            onClick={() => setNewAmount(newAmount + 1)}
            className="bg-parchment-200 rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl hover:bg-parchment-300 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Current vs. new comparison */}
        {hasChanged && (
          <div className="mt-4 text-center space-y-1">
            <p className="text-sm text-gray-500">
              כמות נוכחית: <span className="line-through">{plan.calculatedAmountPerDay}</span> → <span className="font-bold text-primary-700">{newAmount}</span> {unitLabel}
            </p>
            {newEstimate && (
              <p className="text-xs text-gray-400">
                עוד כ-{newEstimate} ימי לימוד לסיום ({remaining} {unitLabel} נותרו)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick presets */}
      <div>
        <label className="block text-sm font-bold text-primary-700 mb-2 text-center">קצב מהיר</label>
        <div className="flex gap-2 justify-center flex-wrap">
          {[1, 2, 3, 5, 7, 10].filter(n => n !== plan.calculatedAmountPerDay).map(n => (
            <button
              key={n}
              onClick={() => setNewAmount(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                newAmount === n
                  ? 'bg-primary-600 text-white'
                  : 'bg-parchment-200 text-gray-600 hover:bg-parchment-300'
              }`}
            >
              {n} {unitLabel}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!hasChanged}
        className="btn-primary w-full"
      >
        {hasChanged ? 'שמור קצב חדש' : 'לא שונה'}
      </button>
    </div>
  );
}

// ── Masechtot Settings Tab ──

function MasechtotSettings({
  plan,
  addMasechtot,
  reorderMasechtot,
  onClose,
}: {
  plan: LearningPlan;
  addMasechtot: (planId: string, ids: string[], insertAt?: number) => void;
  reorderMasechtot: (planId: string, newOrder: string[]) => void;
  onClose: () => void;
}) {
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [order, setOrder] = useState(plan.masechetIds);
  const [hasReordered, setHasReordered] = useState(false);

  // Masechtot already completed (their global offset + units <= currentPosition)
  const completedMasechtot = useMemo(() => {
    const completed = new Set<string>();
    let offset = 0;
    for (const id of order) {
      const m = getMasechet(id);
      if (!m) continue;
      const units = plan.unit === 'mishnah'
        ? m.chapters.reduce((s, c) => s + c, 0)
        : m.chapters.length;
      if (plan.currentPosition >= offset + units) {
        completed.add(id);
      }
      offset += units;
    }
    return completed;
  }, [order, plan.currentPosition, plan.unit]);

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    // Don't allow moving above completed masechtot
    if (completedMasechtot.has(order[idx - 1])) return;
    const newOrder = [...order];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setOrder(newOrder);
    setHasReordered(true);
  };

  const moveDown = (idx: number) => {
    if (idx >= order.length - 1) return;
    // Don't allow moving a completed masechet below uncompleted
    if (completedMasechtot.has(order[idx])) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setOrder(newOrder);
    setHasReordered(true);
  };

  const removeMasechet = (id: string) => {
    if (order.length <= 1) return;
    if (completedMasechtot.has(id)) return; // Can't remove completed
    const newOrder = order.filter(m => m !== id);
    setOrder(newOrder);
    setHasReordered(true);
  };

  const toggleAddMasechet = (id: string) => {
    setSelectedToAdd(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleAddSelected = () => {
    if (selectedToAdd.length === 0) return;
    addMasechtot(plan.id, selectedToAdd);
    setOrder(prev => [...prev, ...selectedToAdd.filter(id => !prev.includes(id))]);
    setSelectedToAdd([]);
    setShowAddPicker(false);
  };

  const handleSaveOrder = () => {
    reorderMasechtot(plan.id, order);
    setHasReordered(false);
  };

  return (
    <div className="space-y-4">
      {/* Current masechtot list with reorder controls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowAddPicker(!showAddPicker)}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            הוסף מסכת
          </button>
          <h3 className="font-bold text-primary-700 text-sm">
            מסכתות בתוכנית ({order.length})
          </h3>
        </div>

        <div className="space-y-1.5">
          {order.map((id, idx) => {
            const m = getMasechet(id);
            if (!m) return null;
            const isCompleted = completedMasechtot.has(id);
            const units = plan.unit === 'mishnah'
              ? m.chapters.reduce((s, c) => s + c, 0)
              : m.chapters.length;

            return (
              <div
                key={id}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all ${
                  isCompleted ? 'bg-green-50 opacity-60' : 'bg-parchment-50'
                }`}
              >
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0 || isCompleted || completedMasechtot.has(order[idx - 1])}
                    className="p-0.5 rounded hover:bg-parchment-200 disabled:opacity-20"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === order.length - 1 || isCompleted}
                    className="p-0.5 rounded hover:bg-parchment-200 disabled:opacity-20"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>

                {/* Position number */}
                <span className="w-6 h-6 rounded-full bg-parchment-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {idx + 1}
                </span>

                {/* Name */}
                <div className="flex-1 text-right">
                  <span className="font-bold text-primary-800 text-sm">{m.name}</span>
                  <span className="text-xs text-gray-400 mr-2">
                    {units} {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'}
                  </span>
                  {isCompleted && <span className="text-xs text-success mr-1">✓</span>}
                </div>

                {/* Remove */}
                {!isCompleted && order.length > 1 && (
                  <button
                    onClick={() => removeMasechet(id)}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-danger transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {hasReordered && (
          <button
            onClick={handleSaveOrder}
            className="btn-primary w-full mt-3 text-sm"
          >
            שמור סדר חדש
          </button>
        )}
      </div>

      {/* Add masechet picker */}
      {showAddPicker && (
        <div className="card border-primary-200">
          <h4 className="font-bold text-primary-700 text-sm mb-3 text-center">הוסף מסכתות</h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {MISHNAH_STRUCTURE.map((seder) => {
              const availableMasechtot = seder.masechtot.filter(
                m => !order.includes(m.id)
              );
              if (availableMasechtot.length === 0) return null;
              return (
                <div key={seder.id}>
                  <p className="text-xs font-bold text-primary-500 mb-1">סדר {seder.name}</p>
                  {availableMasechtot.map(m => {
                    const isSelected = selectedToAdd.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleAddMasechet(m.id)}
                        className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-sm transition-all ${
                          isSelected
                            ? 'bg-primary-100 text-primary-800'
                            : 'hover:bg-parchment-100 text-gray-700'
                        }`}
                      >
                        <span className="text-xs text-gray-400">
                          {getTotalMishnayot(m)} משניות
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-primary-700' : ''}`}>
                          {isSelected && '✓ '}{m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {selectedToAdd.length > 0 && (
            <button
              onClick={handleAddSelected}
              className="btn-primary w-full mt-3 text-sm"
            >
              הוסף {selectedToAdd.length} מסכתות
            </button>
          )}
        </div>
      )}

      {/* Tip */}
      <p className="text-xs text-gray-400 text-center">
        השתמש בחצים כדי לשנות את סדר המסכתות.
        {'\n'}מסכתות שכבר נלמדו לא ניתנות להזזה.
      </p>
    </div>
  );
}
