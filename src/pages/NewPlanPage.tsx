import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, Check, Library, BookMarked, ScrollText, Scale } from 'lucide-react';
import {
  getTotalMishnayot,
  getMultiMasechetTotalUnits,
  getPlanDisplayName,
  getSederMasechetIds,
  getAllMasechetIds,
  getStructureForType,
  getContentTypeLabels,
  getUnitLabel,
  type LearningUnit,
  type ContentType,
} from '../data/mishnah-structure';
import {
  calculateByBookScheduleMulti,
  calculateByPaceScheduleMulti,
  type DistributionInfo,
} from '../services/scheduler';
import type { FrequencyType, ScheduleFrequency } from '../services/scheduler';
import { usePlanStore, generateId, type LearningPlan } from '../store/usePlanStore';
import HebrewDatePicker from '../components/HebrewDatePicker';

type Step = 'content_type' | 'mode' | 'scope' | 'masechet' | 'settings';
type SelectionScope = 'single' | 'multiple' | 'seder' | 'shas';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function NewPlanPage() {
  const navigate = useNavigate();
  const { addPlan } = usePlanStore();

  const [step, setStep] = useState<Step>('content_type');
  const [contentType, setContentType] = useState<ContentType>('mishnah');
  const [mode, setMode] = useState<'by_book' | 'by_pace' | null>(null);
  const [scope, setScope] = useState<SelectionScope>('single');
  const [selectedMasechetIds, setSelectedMasechetIds] = useState<string[]>([]);
  const [selectedSederId, setSelectedSederId] = useState<string>('');
  const [unit, setUnit] = useState<LearningUnit>('mishnah');
  const [targetDate, setTargetDate] = useState('');
  const [amountPerDay, setAmountPerDay] = useState(3);
  const [freqType, setFreqType] = useState<FrequencyType>('days_per_week');
  const [freqValue, setFreqValue] = useState<number>(6);
  const [specificDays, setSpecificDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [reviewEvery, setReviewEvery] = useState<number>(0);
  const [distributionStrategy, setDistributionStrategy] = useState<'even' | 'tapered'>('tapered');

  const frequency: ScheduleFrequency = {
    type: freqType,
    value: freqType === 'specific_days' ? specificDays : freqValue,
    reviewEvery: reviewEvery > 0 ? reviewEvery : undefined,
  };

  const structure = useMemo(() => getStructureForType(contentType), [contentType]);
  const labels = useMemo(() => getContentTypeLabels(contentType), [contentType]);

  const masechetIds = useMemo(() => {
    if (scope === 'shas') return getAllMasechetIds(contentType);
    if (scope === 'seder' && selectedSederId) return getSederMasechetIds(selectedSederId);
    return selectedMasechetIds;
  }, [scope, selectedMasechetIds, selectedSederId, contentType]);

  const totalUnits = useMemo(
    () => masechetIds.length > 0 ? getMultiMasechetTotalUnits(masechetIds, unit) : 0,
    [masechetIds, unit]
  );

  const planName = useMemo(() => getPlanDisplayName(masechetIds), [masechetIds]);

  const toggleMasechet = (id: string) => {
    setSelectedMasechetIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const getPreview = () => {
    if (masechetIds.length === 0) return null;

    if (mode === 'by_book' && targetDate) {
      return calculateByBookScheduleMulti(masechetIds, unit, targetDate, frequency);
    }
    if (mode === 'by_pace') {
      return calculateByPaceScheduleMulti(masechetIds, unit, amountPerDay, frequency);
    }
    return null;
  };

  const handleCreate = () => {
    if (masechetIds.length === 0 || !mode) return;

    let calculatedAmount = amountPerDay;
    let estEndDate: string | undefined;
    let distribution: (DistributionInfo & { strategy: 'even' | 'tapered' }) | undefined;

    if (mode === 'by_book' && targetDate) {
      const result = calculateByBookScheduleMulti(masechetIds, unit, targetDate, frequency);
      calculatedAmount = result.amountPerDay;
      if (!result.distribution.isExact) {
        distribution = { ...result.distribution, strategy: distributionStrategy };
        // For tapered, the "main" amount shown is highAmount (same as ceil)
        calculatedAmount = result.distribution.highAmount;
      }
    } else if (mode === 'by_pace') {
      const result = calculateByPaceScheduleMulti(masechetIds, unit, amountPerDay, frequency);
      estEndDate = result.estimatedEndDate.toISOString().split('T')[0];
    }

    const plan: LearningPlan = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      contentType,
      masechetIds,
      planName,
      mode,
      unit,
      frequency,
      targetDate: mode === 'by_book' ? targetDate : undefined,
      amountPerDay: mode === 'by_pace' ? amountPerDay : undefined,
      calculatedAmountPerDay: calculatedAmount,
      totalUnits,
      estimatedEndDate: estEndDate,
      currentPosition: 0,
      completedDates: [],
      isCompleted: false,
      skippedChapters: [],
      preLearnedChapters: [],
      distribution,
    };

    addPlan(plan);
    navigate(`/plan/${plan.id}`);
  };

  const goBack = () => {
    if (step === 'mode') setStep('content_type');
    else if (step === 'scope') setStep('mode');
    else if (step === 'masechet') setStep('scope');
    else if (step === 'settings') {
      if (scope === 'shas') setStep('scope');
      else setStep('masechet');
    }
  };

  return (
    <div className="space-y-6">
      {step !== 'content_type' && (
        <button onClick={goBack} className="flex items-center gap-1 text-primary-600 hover:text-primary-800 transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </button>
      )}

      {/* ── Step 0: Content Type ── */}
      {step === 'content_type' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary-800 text-center mb-6">מה תרצה ללמוד?</h2>

          <button
            onClick={() => { setContentType('mishnah'); setUnit('mishnah'); setStep('mode'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 rounded-xl p-3 group-hover:bg-primary-200 transition-colors">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-800">משנה</h3>
                <p className="text-sm text-gray-600">ששה סדרי משנה - 63 מסכתות</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setContentType('gemara'); setUnit('perek'); setStep('mode'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 rounded-xl p-3 group-hover:bg-amber-200 transition-colors">
                <ScrollText className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-800">גמרא</h3>
                <p className="text-sm text-gray-600">תלמוד בבלי - 37 מסכתות</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setContentType('rambam'); setUnit('perek'); setStep('mode'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 rounded-xl p-3 group-hover:bg-emerald-200 transition-colors">
                <Scale className="w-8 h-8 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-800">רמב"ם</h3>
                <p className="text-sm text-gray-600">משנה תורה - 83 חלקים, 1,000 פרקים</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Step 1: Mode ── */}
      {step === 'mode' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-primary-800 text-center mb-6">איך תרצה ללמוד?</h2>

          <button
            onClick={() => { setMode('by_book'); setStep('scope'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 rounded-xl p-3 group-hover:bg-primary-200 transition-colors">
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-800">לפי ספר</h3>
                <p className="text-sm text-gray-600">בחר מה ללמוד ותאריך יעד - המערכת תחשב את הקצב</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setMode('by_pace'); setStep('scope'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gold-400/20 rounded-xl p-3 group-hover:bg-gold-400/30 transition-colors">
                <Clock className="w-8 h-8 text-gold-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-800">לפי קצב</h3>
                <p className="text-sm text-gray-600">בחר כמה ללמוד ביום - המערכת תחשב מתי תסיים</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Step 2: Scope ── */}
      {step === 'scope' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary-800 text-center mb-4">מה תרצה ללמוד?</h2>

          {/* Unit selector (not shown for rambam since only perek mode is relevant) */}
          {contentType !== 'rambam' && (
            <div className="flex gap-2 justify-center mb-4">
              <button
                onClick={() => setUnit('mishnah')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${unit === 'mishnah' ? 'bg-primary-700 text-white' : 'bg-parchment-200 text-primary-700'
                  }`}
              >
                לפי {labels.unitPlural}
              </button>
              <button
                onClick={() => setUnit('perek')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${unit === 'perek' ? 'bg-primary-700 text-white' : 'bg-parchment-200 text-primary-700'
                  }`}
              >
                לפי {labels.chapterPlural}
              </button>
            </div>
          )}

          <button
            onClick={() => { setScope('single'); setSelectedMasechetIds([]); setStep('masechet'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-parchment-200 rounded-xl p-3 group-hover:bg-parchment-300 transition-colors">
                <BookMarked className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-primary-800">
                  {contentType === 'rambam' ? 'קובץ הלכות אחד' : `${labels.bookSingular} אחת`}
                </h3>
                <p className="text-sm text-gray-500">
                  {contentType === 'rambam' ? 'בחר קובץ ספציפי' : `בחר ${labels.bookSingular} ספציפית`}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setScope('multiple'); setSelectedMasechetIds([]); setStep('masechet'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-parchment-200 rounded-xl p-3 group-hover:bg-parchment-300 transition-colors">
                <BookOpen className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-primary-800">כמה {labels.bookPlural}</h3>
                <p className="text-sm text-gray-500">
                  בחר {labels.bookPlural} {contentType === 'rambam' ? 'מרובים' : 'מרובות'}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setScope('seder'); setSelectedSederId(''); setStep('masechet'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 rounded-xl p-3 group-hover:bg-primary-200 transition-colors">
                <Library className="w-7 h-7 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-primary-800">{labels.orderSingular} שלם</h3>
                <p className="text-sm text-gray-500">בחר {labels.orderSingular} מתוך {labels.name}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setScope('shas'); setStep('settings'); }}
            className="card w-full text-right hover:shadow-lg transition-shadow group bg-primary-50 border-primary-200"
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary-700 rounded-xl p-3 group-hover:bg-primary-800 transition-colors">
                <Library className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary-800">{labels.allName}</h3>
                <p className="text-sm text-gray-500">כל ה{labels.name} - {structure.flatMap(s => s.masechtot).length} {labels.bookPlural}</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ── Step 3: Masechet Selection ── */}
      {step === 'masechet' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary-800 text-center mb-2">
            {scope === 'seder' ? 'בחר סדר' : scope === 'multiple' ? 'בחר מסכתות' : 'בחר מסכת'}
          </h2>

          {scope === 'multiple' && selectedMasechetIds.length > 0 && (
            <div className="card bg-primary-50 border-primary-200 text-sm">
              <span className="font-bold text-primary-700">נבחרו: </span>
              <span className="text-primary-800">{selectedMasechetIds.length} {labels.bookPlural}</span>
            </div>
          )}

          {/* Seder selection */}
          {scope === 'seder' && (
            <div className="space-y-2">
              {structure.map((seder) => {
                const sederTotal = seder.masechtot.reduce(
                  (sum, m) => sum + (unit === 'mishnah' ? getTotalMishnayot(m) : m.chapters.length), 0
                );
                return (
                  <button
                    key={seder.id}
                    onClick={() => {
                      setSelectedSederId(seder.id);
                      setStep('settings');
                    }}
                    className={`card w-full text-right hover:shadow-md transition-all ${selectedSederId === seder.id ? 'ring-2 ring-primary-500' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {seder.masechtot.length} {labels.bookPlural} • {sederTotal} {getUnitLabel(contentType, unit)}
                      </span>
                      <span className="text-lg font-bold text-primary-800">{labels.orderSingular} {seder.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Masechet selection (single or multiple) */}
          {(scope === 'single' || scope === 'multiple') && (
            <>
              {structure.map((seder) => (
                <div key={seder.id}>
                  {scope === 'multiple' && (
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => {
                          const sederIds = seder.masechtot.map(m => m.id);
                          const allSelected = sederIds.every(id => selectedMasechetIds.includes(id));
                          if (allSelected) {
                            setSelectedMasechetIds(prev => prev.filter(id => !sederIds.includes(id)));
                          } else {
                            setSelectedMasechetIds(prev => [...new Set([...prev, ...sederIds])]);
                          }
                        }}
                        className="text-xs text-primary-500 hover:text-primary-700"
                      >
                        {seder.masechtot.every(m => selectedMasechetIds.includes(m.id)) ? 'הסר הכל' : 'בחר הכל'}
                      </button>
                      <h3 className="font-bold text-primary-600 text-sm">{labels.orderSingular} {seder.name}</h3>
                    </div>
                  )}
                  {scope === 'single' && (
                    <h3 className="font-bold text-primary-600 mb-2 text-sm">{labels.orderSingular} {seder.name}</h3>
                  )}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {seder.masechtot.map((m) => {
                      const isSelected = selectedMasechetIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            if (scope === 'single') {
                              setSelectedMasechetIds([m.id]);
                              setStep('settings');
                            } else {
                              toggleMasechet(m.id);
                            }
                          }}
                          className={`card text-right py-3 px-4 hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary-800">{m.name}</span>
                            {scope === 'multiple' && isSelected && (
                              <Check className="w-4 h-4 text-primary-600" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 block mt-1">
                            {m.chapters.length} {labels.chapterPlural}
                            {contentType === 'mishnah' && ` • ${getTotalMishnayot(m)} משניות`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {scope === 'multiple' && (
                <button
                  onClick={() => setStep('settings')}
                  disabled={selectedMasechetIds.length === 0}
                  className="btn-primary w-full sticky bottom-20"
                >
                  המשך עם {selectedMasechetIds.length} {labels.bookPlural}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Step 4: Settings ── */}
      {step === 'settings' && (
        <div className="space-y-5">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-primary-800">{planName}</h2>
            <p className="text-sm text-gray-500">
              {masechetIds.length} {labels.bookPlural} • {totalUnits} {getUnitLabel(contentType, unit)}
            </p>
          </div>

          {/* Target date (by_book mode) */}
          {mode === 'by_book' && (
            <div className="card">
              <label className="block font-bold text-primary-700 mb-2">תאריך יעד לסיום</label>
              <HebrewDatePicker
                value={targetDate}
                onChange={setTargetDate}
                minDate={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Amount per day (by_pace mode) */}
          {mode === 'by_pace' && (
            <div className="card">
              <label className="block font-bold text-primary-700 mb-2">
                כמות {getUnitLabel(contentType, unit)} ליום
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAmountPerDay(Math.max(1, amountPerDay - 1))}
                  className="bg-parchment-200 rounded-xl w-10 h-10 flex items-center justify-center font-bold text-xl"
                >-</button>
                <span className="text-2xl font-bold text-primary-800 w-12 text-center">{amountPerDay}</span>
                <button
                  onClick={() => setAmountPerDay(amountPerDay + 1)}
                  className="bg-parchment-200 rounded-xl w-10 h-10 flex items-center justify-center font-bold text-xl"
                >+</button>
              </div>
            </div>
          )}

          {/* Frequency */}
          <div className="card">
            <label className="block font-bold text-primary-700 mb-3">תדירות לימוד</label>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {(['days_per_week', 'specific_days', 'days_per_month'] as FrequencyType[]).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setFreqType(ft)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${freqType === ft ? 'bg-primary-700 text-white' : 'bg-parchment-200 text-primary-700'
                      }`}
                  >
                    {ft === 'days_per_week' ? 'ימים בשבוע' : ft === 'specific_days' ? 'ימים ספציפיים' : 'ימים בחודש'}
                  </button>
                ))}
              </div>

              {freqType === 'days_per_week' && (
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="7" value={freqValue} onChange={(e) => setFreqValue(Number(e.target.value))} className="flex-1" />
                  <span className="font-bold text-primary-800 w-20 text-center">{freqValue} ימים</span>
                </div>
              )}

              {freqType === 'days_per_month' && (
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="30" value={freqValue} onChange={(e) => setFreqValue(Number(e.target.value))} className="flex-1" />
                  <span className="font-bold text-primary-800 w-20 text-center">{freqValue} ימים</span>
                </div>
              )}

              {freqType === 'specific_days' && (
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSpecificDays(prev =>
                        prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                      )}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${specificDays.includes(idx) ? 'bg-primary-600 text-white' : 'bg-parchment-200 text-gray-600'
                        }`}
                    >{name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review day */}
          <div className="card">
            <label className="block font-bold text-primary-700 mb-2">יום חזרה</label>
            <p className="text-sm text-gray-500 mb-3">הוסף יום חזרה על החומר כל כמה ימי לימוד</p>
            <select value={reviewEvery} onChange={(e) => setReviewEvery(Number(e.target.value))} className="select-field">
              <option value={0}>בלי יום חזרה</option>
              <option value={6}>כל 6 ימי לימוד</option>
              <option value={5}>כל 5 ימי לימוד</option>
              <option value={4}>כל 4 ימי לימוד</option>
              <option value={3}>כל 3 ימי לימוד</option>
            </select>
          </div>

          {/* Preview */}
          {(() => {
            const preview = getPreview();
            if (!preview) return null;

            const unitLabel = getUnitLabel(contentType, unit);
            const hasDistribution = 'distribution' in preview && preview.distribution && !preview.distribution.isExact;

            return (
              <>
                <div className="card bg-primary-50 border-primary-200">
                  <h3 className="font-bold text-primary-700 mb-2">תצוגה מקדימה</h3>
                  {'amountPerDay' in preview && !hasDistribution && (
                    <p className="text-primary-800">
                      <span className="font-bold text-lg">{preview.amountPerDay}</span>{' '}
                      {unitLabel} ביום לימוד
                    </p>
                  )}
                  {'amountPerDay' in preview && hasDistribution && (
                    <div className="text-primary-800">
                      {distributionStrategy === 'even' ? (
                        <div>
                          <p>
                            <span className="font-bold text-lg">{preview.distribution.highAmount}</span>{' '}
                            {unitLabel} ביום לימוד
                          </p>
                          <p className="text-sm text-amber-600 mt-1">
                            ⚡ תסיים {preview.distribution.earlyFinishDays} ימים לפני היעד
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p>
                            <span className="font-bold text-lg">{preview.distribution.highAmount}</span>{' '}
                            {unitLabel} ב-{preview.distribution.highDays} הימים הראשונים
                          </p>
                          <p className="mt-1">
                            <span className="font-bold text-lg">{preview.distribution.lowAmount}</span>{' '}
                            {unitLabel} ב-{preview.distribution.lowDays} הימים האחרונים
                          </p>
                          <p className="text-sm text-success mt-1">
                            ✓ תסיים בדיוק ביעד
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {'estimatedEndDate' in preview && (
                    <p className="text-primary-800">
                      סיום משוער: <span className="font-bold">{new Date(preview.estimatedEndDate).toLocaleDateString('he-IL')}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    סה"כ {preview.totalUnits} {unitLabel}
                    {masechetIds.length > 1 && ` ב-${masechetIds.length} ${labels.bookPlural}`}
                  </p>
                </div>

                {/* Distribution strategy choice */}
                {hasDistribution && (
                  <div className="card">
                    <label className="block font-bold text-primary-700 mb-3">אופן חלוקת הלימוד</label>
                    <p className="text-sm text-gray-500 mb-3">
                      {preview.totalUnits} {unitLabel} לא מתחלקים בדיוק ב-{('distribution' in preview ? preview.distribution.highDays + preview.distribution.lowDays : 0)} ימים.
                      איך לחלק?
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setDistributionStrategy('tapered')}
                        className={`w-full rounded-xl p-3 text-right transition-all border-2 ${distributionStrategy === 'tapered'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-parchment-200 bg-white hover:border-parchment-300'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${distributionStrategy === 'tapered' ? 'border-primary-500' : 'border-gray-300'
                            }`}>
                            {distributionStrategy === 'tapered' && <div className="w-3 h-3 rounded-full bg-primary-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-primary-800 text-sm">חלוקה לא שווה - סיים בדיוק ביעד</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {preview.distribution.highDays} ימים × {preview.distribution.highAmount} {unitLabel}, אחר כך{' '}
                              {preview.distribution.lowDays} ימים × {preview.distribution.lowAmount} {unitLabel}
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setDistributionStrategy('even')}
                        className={`w-full rounded-xl p-3 text-right transition-all border-2 ${distributionStrategy === 'even'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-parchment-200 bg-white hover:border-parchment-300'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${distributionStrategy === 'even' ? 'border-primary-500' : 'border-gray-300'
                            }`}>
                            {distributionStrategy === 'even' && <div className="w-3 h-3 rounded-full bg-primary-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-primary-800 text-sm">חלוקה שווה - סיים מוקדם</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {preview.distribution.highAmount} {unitLabel} כל יום (תסיים {preview.distribution.earlyFinishDays} ימים לפני)
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          <button
            onClick={handleCreate}
            disabled={mode === 'by_book' && !targetDate}
            className="btn-primary w-full text-lg"
          >
            צור תוכנית לימוד
          </button>
        </div>
      )}
    </div>
  );
}
