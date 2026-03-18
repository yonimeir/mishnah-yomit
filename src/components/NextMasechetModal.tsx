import { useMemo } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { getMasechet, getMasechetUnits } from '../data/mishnah-structure';
import type { LearningPlan } from '../store/usePlanStore';

interface NextMasechetModalProps {
  plan: LearningPlan;
  subProgramId: string;
  completedMasechetId: string;
  /** Called with the chosen next masechet ID (or null to keep default order) */
  onChoose: (nextMasechetId: string | null) => void;
}

export default function NextMasechetModal({ plan, subProgramId, completedMasechetId, onChoose }: NextMasechetModalProps) {
  const completedMasechet = getMasechet(completedMasechetId);
  const subProgram = plan.subPrograms.find(sp => sp.id === subProgramId);

  // Get remaining (not yet started) masechtot
  const remainingMasechtot = useMemo(() => {
    if (!subProgram) return [];
    // Figure out which masechtot haven't been completed yet
    let offset = 0;
    const remaining: Array<{ id: string; name: string; units: number; isNext: boolean }> = [];

    for (const mid of subProgram.masechetIds) {
      const m = getMasechet(mid);
      if (!m) continue;
      const units = getMasechetUnits(m, subProgram.unit);
      const masechetEnd = offset + units;

      if (subProgram.currentPosition < masechetEnd && mid !== completedMasechetId) {
        remaining.push({
          id: mid,
          name: m.name,
          units,
          isNext: remaining.length === 0, // First one is the "default next"
        });
      }
      offset += units;
    }
    return remaining;
  }, [subProgram, completedMasechetId]);

  if (!subProgram) return null;

  const defaultNext = remainingMasechtot.find(m => m.isNext);

  if (remainingMasechtot.length === 0) return null;

  // If only one masechet left, no need to ask
  if (remainingMasechtot.length === 1) {
    return null; // Will automatically proceed
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 text-center border-b border-parchment-200">
          <p className="text-2xl mb-2">🎉</p>
          <h2 className="text-lg font-bold text-primary-800">
            הדרן עלך {completedMasechet?.name}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            איזו מסכת תרצה ללמוד עכשיו?
          </p>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {/* Default next option (highlighted) */}
          {defaultNext && (
            <button
              onClick={() => onChoose(null)}
              className="w-full card text-right border-2 border-primary-300 bg-primary-50 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 rounded-xl p-2">
                  <ArrowLeft className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary-200 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                      הבאה בתור
                    </span>
                    <h3 className="font-bold text-primary-800">מסכת {defaultNext.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {defaultNext.units} {subProgram.unit === 'mishnah' ? 'משניות' : 'פרקים'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Other options */}
          {remainingMasechtot.filter(m => !m.isNext).length > 0 && (
            <>
              <p className="text-xs text-gray-400 text-center mt-3 mb-1">או בחר מסכת אחרת:</p>
              {remainingMasechtot.filter(m => !m.isNext).map(m => (
                <button
                  key={m.id}
                  onClick={() => onChoose(m.id)}
                  className="w-full card text-right hover:shadow-md transition-all border-2 border-transparent hover:border-parchment-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-parchment-200 rounded-xl p-2">
                      <BookOpen className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary-800 text-sm">מסכת {m.name}</h3>
                      <p className="text-xs text-gray-500">
                        {m.units} {subProgram.unit === 'mishnah' ? 'משניות' : 'פרקים'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
