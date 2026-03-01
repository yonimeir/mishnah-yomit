import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getMasechet,
  getMasechetUnits,
  type Masechet,
} from '../data/mishnah-structure';
import { gematriya } from '../services/scheduler';
import {
  usePlanStore,
  isChapterPreLearned,
  type LearningPlan,
  type SkippedChapter,
} from '../store/usePlanStore';

interface AlreadyLearnedModalProps {
  plan: LearningPlan;
  onClose: () => void;
}

export default function AlreadyLearnedModal({ plan, onClose }: AlreadyLearnedModalProps) {
  const { addPreLearnedChapters } = usePlanStore();

  // Chapters newly selected in this session
  const [selected, setSelected] = useState<SkippedChapter[]>([]);
  const [expandedMasechtot, setExpandedMasechtot] = useState<Set<string>>(new Set());

  const unitLabel = plan.unit === 'mishnah' ? 'משניות' : 'פרקים';

  // ── Helpers ──

  const isSelected = (masechetId: string, chapter: number) =>
    selected.some(s => s.masechetId === masechetId && s.chapter === chapter);

  const isAlreadyPreLearned = (masechetId: string, chapter: number) =>
    isChapterPreLearned(plan, masechetId, chapter);

  const toggleChapter = (masechetId: string, chapter: number) => {
    if (isAlreadyPreLearned(masechetId, chapter)) return; // Already marked
    setSelected(prev => {
      const exists = prev.some(s => s.masechetId === masechetId && s.chapter === chapter);
      if (exists) return prev.filter(s => !(s.masechetId === masechetId && s.chapter === chapter));
      return [...prev, { masechetId, chapter }];
    });
  };

  const toggleEntireMasechet = (masechetId: string, masechet: Masechet) => {
    const allChapters = masechet.chapters.map((_, idx) => idx + 1);
    const selectableChapters = allChapters.filter(
      ch => !isAlreadyPreLearned(masechetId, ch) && !isBehindPosition(masechetId, ch)
    );
    const allSelected = selectableChapters.every(ch => isSelected(masechetId, ch));

    if (allSelected) {
      setSelected(prev => prev.filter(s => s.masechetId !== masechetId));
    } else {
      setSelected(prev => {
        const without = prev.filter(s => s.masechetId !== masechetId);
        const toAdd = selectableChapters.map(ch => ({ masechetId, chapter: ch }));
        return [...without, ...toAdd];
      });
    }
  };

  const toggleExpanded = (masechetId: string) => {
    setExpandedMasechtot(prev => {
      const next = new Set(prev);
      if (next.has(masechetId)) next.delete(masechetId);
      else next.add(masechetId);
      return next;
    });
  };

  // Is this chapter already behind currentPosition (already passed)?
  const isBehindPosition = (masechetId: string, chapter: number): boolean => {
    let globalOffset = 0;
    for (const mid of plan.masechetIds) {
      const m = getMasechet(mid);
      if (!m) continue;
      if (mid === masechetId) {
        if (plan.unit === 'perek') {
          const chGlobal = globalOffset + chapter - 1;
          return chGlobal < plan.currentPosition;
        } else {
          let localIdx = 0;
          for (let ch = 0; ch < chapter - 1; ch++) localIdx += m.chapters[ch];
          const chEndGlobal = globalOffset + localIdx + m.chapters[chapter - 1];
          return chEndGlobal <= plan.currentPosition;
        }
      }
      globalOffset += getMasechetUnits(m, plan.unit);
    }
    return false;
  };

  // Build masechet info
  const masechetInfos = useMemo(() => {
    return plan.masechetIds.reduce<{
      infos: Array<{ masechet: Masechet; id: string; units: number; fullyPassed: boolean; }>;
      offset: number;
    }>((acc, id) => {
      const m = getMasechet(id);
      if (!m) return acc;
      const units = getMasechetUnits(m, plan.unit);
      const offset = acc.offset;

      const masechetEnd = offset + units;
      const fullyPassed = plan.currentPosition >= masechetEnd;

      acc.infos.push({ masechet: m, id, units, fullyPassed });
      acc.offset += units;
      return acc;
    }, { infos: [], offset: 0 }).infos;
  }, [plan]);

  // Count selected units
  const selectedUnitsCount = useMemo(() => {
    if (plan.unit === 'perek') return selected.length;
    return selected.reduce((sum, s) => {
      const m = getMasechet(s.masechetId);
      if (!m || s.chapter < 1 || s.chapter > m.chapters.length) return sum;
      return sum + m.chapters[s.chapter - 1];
    }, 0);
  }, [selected, plan.unit]);

  const selectedInMasechet = (masechetId: string) =>
    selected.filter(s => s.masechetId === masechetId).length;

  const handleConfirm = () => {
    if (selected.length === 0) return;
    addPreLearnedChapters(plan.id, selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85dvh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-parchment-200">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-parchment-200">
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-lg font-bold text-primary-800">כבר למדתי</h2>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <p className="text-sm text-gray-600 text-center">
            סמן פרקים שכבר למדת — הם יסומנו ירוק וידולגו כשתגיע אליהם
          </p>

          {/* Masechet list */}
          <div className="space-y-2">
            {masechetInfos.map(({ masechet, id, fullyPassed }) => {
              const isExpanded = expandedMasechtot.has(id);
              const numSelected = selectedInMasechet(id);
              const existingPreLearned = (plan.preLearnedChapters || []).filter(
                pl => pl.masechetId === id
              ).length;

              // Fully passed masechtot - show as done
              if (fullyPassed) {
                return (
                  <div key={id} className="flex items-center gap-2 py-2 px-3 rounded-xl bg-green-50 opacity-50">
                    <span className="text-xs text-success">✓</span>
                    <span className="font-bold text-success text-sm flex-1">{masechet.name}</span>
                    <span className="text-xs text-green-400">כבר עברת</span>
                  </div>
                );
              }

              // Selectable chapters in this masechet (ahead of position, not already pre-learned)
              const selectableCount = masechet.chapters.filter(
                (_, idx) => !isBehindPosition(id, idx + 1) && !isAlreadyPreLearned(id, idx + 1)
              ).length;

              return (
                <div key={id} className="rounded-xl border border-parchment-200 overflow-hidden">
                  {/* Masechet header */}
                  <div className="flex items-center gap-2 py-2.5 px-3 bg-parchment-50">
                    {/* Checkbox for entire masechet */}
                    {selectableCount > 0 && (
                      <button
                        onClick={() => toggleEntireMasechet(id, masechet)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${numSelected === selectableCount && selectableCount > 0
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : numSelected > 0
                              ? 'bg-primary-200 border-primary-400'
                              : 'border-gray-300 hover:border-primary-400'
                          }`}
                      >
                        {numSelected === selectableCount && selectableCount > 0 && <span className="text-xs">✓</span>}
                        {numSelected > 0 && numSelected < selectableCount && <span className="text-[10px] text-primary-700">—</span>}
                      </button>
                    )}

                    <span className="font-bold text-primary-800 text-sm flex-1">
                      {masechet.name}
                    </span>

                    {(numSelected > 0 || existingPreLearned > 0) && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-600 font-bold">
                        {numSelected > 0 && `+${numSelected}`}
                        {numSelected > 0 && existingPreLearned > 0 && ' '}
                        {existingPreLearned > 0 && `(${existingPreLearned} קודם)`}
                      </span>
                    )}

                    <button
                      onClick={() => toggleExpanded(id)}
                      className="p-1 rounded hover:bg-parchment-200 transition-colors"
                    >
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>

                  {/* Expanded chapter grid */}
                  {isExpanded && (
                    <div className="px-3 py-2 bg-white">
                      <div className="grid grid-cols-5 gap-1.5">
                        {masechet.chapters.map((_, chIdx) => {
                          const ch = chIdx + 1;
                          const behind = isBehindPosition(id, ch);
                          const alreadyPL = isAlreadyPreLearned(id, ch);
                          const sel = isSelected(id, ch);

                          return (
                            <button
                              key={chIdx}
                              onClick={() => toggleChapter(id, ch)}
                              disabled={behind || alreadyPL}
                              className={`rounded-lg p-1.5 text-center text-xs font-bold transition-all ${behind
                                  ? 'bg-green-100 text-green-400 opacity-50 cursor-default'
                                  : alreadyPL
                                    ? 'bg-green-500 text-white cursor-default'
                                    : sel
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-parchment-100 text-gray-600 hover:bg-parchment-200'
                                }`}
                            >
                              {gematriya(ch)}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex gap-3 justify-center mt-2 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-green-100" /> עברת
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-green-500" /> סומן קודם
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded bg-primary-600" /> סומן עכשיו
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {selected.length > 0 && (
            <div className="card bg-primary-50 border-primary-200">
              <p className="text-sm text-primary-700">
                סימנת <span className="font-bold">{selected.length}</span> פרקים
                {' '}(<span className="font-bold">{selectedUnitsCount}</span> {unitLabel})
              </p>
              <p className="text-xs text-gray-500 mt-1">
                הפרקים האלה יסומנו ירוק וידולגו אוטומטית כשתגיע אליהם
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-parchment-200">
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="btn-primary w-full"
          >
            {selected.length === 0 ? 'בחר פרקים שלמדת' : `סמן ${selected.length} פרקים כנלמדו`}
          </button>
        </div>
      </div>
    </div>
  );
}
