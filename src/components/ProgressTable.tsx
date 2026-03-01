import {
  getMasechet,
  getMasechetUnits,
  MISHNAH_STRUCTURE,
  type Masechet,
} from '../data/mishnah-structure';
import { gematriya } from '../services/scheduler';
import {
  usePlanStore,
  isChapterSkipped,
  isChapterPreLearned,
  getSkippedInMasechet,
  getPreLearnedInMasechet,
  getSkippedUnitsCount,
  getPreLearnedUnitsCount,
  type LearningPlan,
} from '../store/usePlanStore';
import { Check, Minus, AlertTriangle } from 'lucide-react';

interface ProgressTableProps {
  plan: LearningPlan;
}

type MasechetStatus = 'completed' | 'in_progress' | 'not_started';

interface MasechetInfo {
  masechet: Masechet;
  units: number;
  offset: number;
  status: MasechetStatus;
  posInMasechet: number;
  progress: number;
  skippedCount: number;
  preLearnedCount: number;
}

export default function ProgressTable({ plan }: ProgressTableProps) {
  const totalHoles = getSkippedUnitsCount(plan);
  const totalPreLearned = getPreLearnedUnitsCount(plan);

  const masechtotInfo: MasechetInfo[] = plan.masechetIds.reduce<{ info: MasechetInfo[], offset: number }>((acc, id) => {
    const m = getMasechet(id);
    if (!m) return acc;
    const units = getMasechetUnits(m, plan.unit);
    const offset = acc.offset;

    const masechetEnd = offset + units;
    const posInMasechet = Math.max(0, Math.min(plan.currentPosition - offset, units));
    const status: MasechetStatus =
      plan.currentPosition >= masechetEnd ? 'completed'
        : plan.currentPosition > offset ? 'in_progress'
          : 'not_started';

    acc.info.push({
      masechet: m,
      units,
      offset,
      status,
      posInMasechet,
      progress: Math.round((posInMasechet / units) * 100),
      skippedCount: getSkippedInMasechet(plan, id),
      preLearnedCount: getPreLearnedInMasechet(plan, id),
    });
    acc.offset += units;
    return acc;
  }, { info: [], offset: 0 }).info;

  const isMulti = plan.masechetIds.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {totalHoles > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {totalHoles} {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'} להשלמה
            </span>
          )}
          {totalPreLearned > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {totalPreLearned} {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'} נלמדו מראש
            </span>
          )}
        </div>
        <h3 className="font-bold text-primary-800 text-lg">התקדמות</h3>
      </div>

      {!isMulti ? (
        <MasechetDetail info={masechtotInfo[0]} plan={plan} />
      ) : (
        <MultiMasechetProgress masechtotInfo={masechtotInfo} plan={plan} />
      )}
    </div>
  );
}

// ── Multi-masechet view ──

function MultiMasechetProgress({ masechtotInfo, plan }: { masechtotInfo: MasechetInfo[]; plan: LearningPlan }) {
  const groups: Array<
    | { type: 'single'; info: MasechetInfo }
    | { type: 'seder_group'; sederName: string; masechtot: MasechetInfo[]; totalUnits: number }
  > = [];

  let i = 0;
  while (i < masechtotInfo.length) {
    const info = masechtotInfo[i];
    // Only group not-started masechtot with NO pre-learned chapters
    if (info.status === 'not_started' && info.preLearnedCount === 0) {
      const seder = MISHNAH_STRUCTURE.find(s => s.masechtot.some(m => m.id === info.masechet.id));
      const sederName = seder ? seder.name : '';
      const batch: MasechetInfo[] = [info];
      let j = i + 1;
      while (j < masechtotInfo.length && masechtotInfo[j].status === 'not_started' && masechtotInfo[j].preLearnedCount === 0) {
        const nextSeder = MISHNAH_STRUCTURE.find(s => s.masechtot.some(m => m.id === masechtotInfo[j].masechet.id));
        if (nextSeder && nextSeder.name === sederName) {
          batch.push(masechtotInfo[j]);
          j++;
        } else break;
      }
      if (batch.length >= 3) {
        groups.push({ type: 'seder_group', sederName, masechtot: batch, totalUnits: batch.reduce((s, b) => s + b.units, 0) });
      } else {
        batch.forEach(b => groups.push({ type: 'single', info: b }));
      }
      i = j;
    } else {
      groups.push({ type: 'single', info });
      i++;
    }
  }

  return (
    <div className="space-y-2">
      {groups.map((group, idx) => {
        if (group.type === 'seder_group') {
          return (
            <div key={idx} className="card py-3 px-4 bg-parchment-50 opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {group.masechtot.length} מסכתות • {group.totalUnits} {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'}
                </span>
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-gray-300" />
                  <span className="font-bold text-gray-500">סדר {group.sederName}</span>
                </div>
              </div>
            </div>
          );
        }

        const { info } = group;

        // Completed masechet
        if (info.status === 'completed') {
          const hasHoles = info.skippedCount > 0;
          return (
            <div key={idx} className={`card py-3 px-4 ${hasHoles ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasHoles ? (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-700 font-bold">
                      {info.skippedCount} חורים
                    </span>
                  ) : (
                    <Check className="w-4 h-4 text-success" />
                  )}
                </div>
                <span className={`font-bold ${hasHoles ? 'text-amber-700' : 'text-success'}`}>
                  מסכת {info.masechet.name}
                </span>
              </div>
            </div>
          );
        }

        // Not-started masechet - check for pre-learned chapters
        if (info.status === 'not_started') {
          if (info.preLearnedCount > 0) {
            // Has some pre-learned chapters - show with detail
            return (
              <div key={idx} className="card py-3 px-4 bg-parchment-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold">
                    {info.preLearnedCount}/{info.masechet.chapters.length} נלמדו
                  </span>
                  <span className="font-bold text-gray-600">מסכת {info.masechet.name}</span>
                </div>
                <MasechetDetail info={info} plan={plan} />
              </div>
            );
          }
          return (
            <div key={idx} className="card py-3 px-4 bg-parchment-50 opacity-60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {info.units} {plan.unit === 'mishnah' ? 'משניות' : 'פרקים'}
                </span>
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-gray-300" />
                  <span className="font-bold text-gray-500">מסכת {info.masechet.name}</span>
                </div>
              </div>
            </div>
          );
        }

        // In-progress masechet
        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-primary-600">{info.progress}%</span>
                {info.skippedCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-700 font-bold">
                    {info.skippedCount} חורים
                  </span>
                )}
              </div>
              <h4 className="font-bold text-primary-700">מסכת {info.masechet.name}</h4>
            </div>
            <div className="w-full bg-parchment-200 rounded-full h-2 mb-1">
              <div className="h-2 rounded-full bg-primary-400 transition-all" style={{ width: `${info.progress}%` }} />
            </div>
            <MasechetDetail info={info} plan={plan} />
          </div>
        );
      })}
    </div>
  );
}

// ── Single masechet detail ──

function MasechetDetail({ info, plan }: { info: MasechetInfo; plan: LearningPlan }) {
  if (!info) return null;
  const { masechet, offset, posInMasechet } = info;

  if (plan.unit === 'perek') {
    return <PerekGrid masechet={masechet} offset={offset} currentPosition={offset + posInMasechet} plan={plan} />;
  }
  return <SmartMishnahGrid masechet={masechet} offset={offset} currentPosition={offset + posInMasechet} plan={plan} />;
}

// ── Perek mode grid ──

function PerekGrid({
  masechet, offset, currentPosition, plan,
}: {
  masechet: Masechet; offset: number; currentPosition: number; plan: LearningPlan;
}) {
  const { toggleSkippedChapter } = usePlanStore();

  return (
    <div className="grid grid-cols-6 gap-2">
      {masechet.chapters.map((_, idx) => {
        const globalIdx = offset + idx;
        const isCompleted = globalIdx < currentPosition;
        const isCurrent = globalIdx === currentPosition;
        const isSkipped = isCompleted && isChapterSkipped(plan, masechet.id, idx + 1);
        const isPreLearned = !isCompleted && isChapterPreLearned(plan, masechet.id, idx + 1);

        return (
          <button
            key={idx}
            onClick={() => {
              if (isCompleted) toggleSkippedChapter(plan.id, masechet.id, idx + 1);
            }}
            disabled={!isCompleted && !isPreLearned}
            className={`rounded-xl p-2 text-center text-sm font-bold transition-all ${isSkipped
                ? 'bg-amber-400 text-white ring-2 ring-amber-300 ring-offset-1'
                : isPreLearned
                  ? 'bg-success/80 text-white ring-1 ring-green-300'
                  : isCompleted
                    ? 'bg-success text-white hover:bg-green-600 cursor-pointer'
                    : isCurrent
                      ? 'bg-primary-500 text-white ring-2 ring-primary-300 ring-offset-2'
                      : 'bg-parchment-200 text-gray-600'
              }`}
          >
            {gematriya(idx + 1)}
          </button>
        );
      })}
    </div>
  );
}

// ── Smart mishnah grid ──

function SmartMishnahGrid({
  masechet, offset, currentPosition, plan,
}: {
  masechet: Masechet; offset: number; currentPosition: number; plan: LearningPlan;
}) {
  const { toggleSkippedChapter } = usePlanStore();
  return (
    <div className="space-y-2">
      {masechet.chapters.map((count, chIdx) => {
        const chapterLocalStart = masechet.chapters.slice(0, chIdx).reduce((a, b) => a + b, 0);
        const chapterStartGlobal = offset + chapterLocalStart;
        const chapterEndGlobal = chapterStartGlobal + count;
        const chapterCompleted = currentPosition >= chapterEndGlobal;
        const chapterNotStarted = currentPosition <= chapterStartGlobal;
        const isSkipped = chapterCompleted && isChapterSkipped(plan, masechet.id, chIdx + 1);
        const isPreLearned = !chapterCompleted && isChapterPreLearned(plan, masechet.id, chIdx + 1);

        // ── Completed chapter (tappable to toggle hole) ──
        if (chapterCompleted) {
          return (
            <button
              key={chIdx}
              onClick={() => toggleSkippedChapter(plan.id, masechet.id, chIdx + 1)}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xl w-full text-right transition-all ${isSkipped
                  ? 'bg-amber-100 hover:bg-amber-200 border border-amber-300'
                  : 'bg-green-50 hover:bg-green-100'
                }`}
            >
              {isSkipped ? (
                <>
                  <span className="text-xs text-amber-600">⚠</span>
                  <span className="font-bold text-amber-700 text-sm">פרק {gematriya(chIdx + 1)}</span>
                  <span className="text-xs text-amber-500 mr-auto">להשלמה • {count} משניות</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-success">✓</span>
                  <span className="font-bold text-success text-sm">פרק {gematriya(chIdx + 1)}</span>
                  <span className="text-xs text-green-400 mr-auto">{count} משניות</span>
                </>
              )}
            </button>
          );
        }

        // ── Pre-learned chapter (ahead of position, already done) ──
        if (isPreLearned) {
          return (
            <div key={chIdx} className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-green-50 border border-green-200">
              <span className="text-xs text-success">✓</span>
              <span className="font-bold text-success text-sm">פרק {gematriya(chIdx + 1)}</span>
              <span className="text-xs text-green-400 mr-auto">נלמד • ידולג</span>
            </div>
          );
        }

        // ── Not-started chapter ──
        if (chapterNotStarted) {
          return (
            <div key={chIdx} className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-parchment-100 opacity-60">
              <span className="font-bold text-gray-500 text-sm">פרק {gematriya(chIdx + 1)}</span>
              <span className="text-xs text-gray-400 mr-auto">{count} משניות</span>
            </div>
          );
        }

        // ── In-progress chapter: expanded ──
        const items = [];
        for (let m = 0; m < count; m++) {
          const globalIdx = offset + chapterLocalStart + m;
          const isCompleted = globalIdx < currentPosition;
          const isCurrent = globalIdx === currentPosition;
          items.push(
            <div
              key={m}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${isCompleted
                  ? 'bg-success text-white'
                  : isCurrent
                    ? 'bg-primary-500 text-white ring-2 ring-primary-300 ring-offset-1 scale-110'
                    : 'bg-parchment-200 text-gray-500'
                }`}
            >
              {gematriya(m + 1)}
            </div>
          );
        }

        const completedInChapter = currentPosition - chapterStartGlobal;

        return (
          <div key={chIdx} className="card border-primary-200 bg-primary-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-primary-600">
                {completedInChapter}/{count}
              </span>
              <h4 className="font-bold text-primary-700">פרק {gematriya(chIdx + 1)}</h4>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {items}
            </div>
          </div>
        );
      })}
    </div>
  );
}
