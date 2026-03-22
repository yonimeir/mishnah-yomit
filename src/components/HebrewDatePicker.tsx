import { useState, useMemo } from 'react';
import { HDate, months } from '@hebcal/core';
import { ChevronRight, ChevronLeft, Calendar, Pencil, Check } from 'lucide-react';

interface HebrewDatePickerProps {
  value: string; // ISO date string
  onChange: (isoDate: string) => void;
  minDate?: string;
  maxDate?: string;
}

const HEB_MONTH_NAMES: Record<number, string> = {
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: "אדר א'",
  [months.ADAR_II]: "אדר ב'",
};

// Months in Hebrew calendar order (starting from Tishrei)
const MONTH_ORDER = [
  { value: months.TISHREI, label: 'תשרי' },
  { value: months.CHESHVAN, label: 'חשון' },
  { value: months.KISLEV, label: 'כסלו' },
  { value: months.TEVET, label: 'טבת' },
  { value: months.SHVAT, label: 'שבט' },
  { value: months.ADAR_I, label: 'אדר / אדר א\'' },
  { value: months.ADAR_II, label: "אדר ב' (שנה מעוברת)" },
  { value: months.NISAN, label: 'ניסן' },
  { value: months.IYYAR, label: 'אייר' },
  { value: months.SIVAN, label: 'סיון' },
  { value: months.TAMUZ, label: 'תמוז' },
  { value: months.AV, label: 'אב' },
  { value: months.ELUL, label: 'אלול' },
];

const HEB_DAY_HEADERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

function getMonthName(month: number, year?: number): string {
  if (month === months.ADAR_I && year !== undefined && !HDate.isLeapYear(year)) {
    return 'אדר';
  }
  return HEB_MONTH_NAMES[month] || `חודש ${month}`;
}

export function formatHebrewNumber(n: number): string {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];

  if (n === 15) return 'ט"ו';
  if (n === 16) return 'ט"ז';

  let result = '';

  if (n >= 100) {
    let h = Math.floor(n / 100);
    while (h > 4) { result += 'ת'; h -= 4; }
    result += hundreds[h];
    n %= 100;
  }

  if (n === 15) { result += 'טו'; }
  else if (n === 16) { result += 'טז'; }
  else { result += tens[Math.floor(n / 10)] + ones[n % 10]; }

  if (result.length > 1) result = result.slice(0, -1) + '"' + result.slice(-1);
  else if (result.length === 1) result += "'";

  return result;
}

export function hebrewYear(hd: HDate): string {
  return formatHebrewNumber(hd.getFullYear() % 1000);
}

function hebrewDayOfMonth(day: number): string {
  return formatHebrewNumber(day);
}

export function formatHebrewDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const hd = new HDate(d);
  return `${hebrewDayOfMonth(hd.getDate())} ${getMonthName(hd.getMonth(), hd.getFullYear())} ${hebrewYear(hd)}`;
}

export default function HebrewDatePicker({ value, onChange, minDate, maxDate }: HebrewDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Manual Hebrew input state
  const [manualDay, setManualDay] = useState('');
  const [manualMonth, setManualMonth] = useState<number | ''>('');
  const [manualYear, setManualYear] = useState('');
  const [manualError, setManualError] = useState('');

  // Current view month (Gregorian month/year for navigation)
  const initial = value ? new Date(value + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-based

  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : undefined;
  const maxDateObj = maxDate ? new Date(maxDate + 'T23:59:59') : undefined;

  // Generate calendar days for the current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun

    const today = new Date().toISOString().split('T')[0];
    const selectedIso = value;

    const days: Array<{
      date: Date;
      gregDay: number;
      hebDay: number;
      hebMonthName: string;
      isoStr: string;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    const makeDay = (d: Date, isCurrentMonth: boolean) => {
      const hd = new HDate(d);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isDisabled =
        (minDateObj ? d < minDateObj : false) ||
        (maxDateObj ? d > maxDateObj : false);
      return {
        date: d,
        gregDay: d.getDate(),
        hebDay: hd.getDate(),
        hebMonthName: getMonthName(hd.getMonth(), hd.getFullYear()),
        isoStr: iso,
        isCurrentMonth,
        isDisabled,
        isSelected: iso === selectedIso,
        isToday: iso === today,
      };
    };

    // Previous month fill
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(makeDay(new Date(viewYear, viewMonth, -(startDayOfWeek - 1 - i)), false));
    }
    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(makeDay(new Date(viewYear, viewMonth, day), true));
    }
    // Next month fill
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(makeDay(new Date(viewYear, viewMonth + 1, i), false));
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  // Hebrew month header - show range of Hebrew months for this Gregorian month
  const firstHDate = new HDate(new Date(viewYear, viewMonth, 1));
  const lastHDate = new HDate(new Date(viewYear, viewMonth + 1, 0));
  const firstHMonth = firstHDate.getMonth();
  const lastHMonth = lastHDate.getMonth();
  const firstHYear = firstHDate.getFullYear();

  const headerHebrew = firstHMonth === lastHMonth
    ? `${getMonthName(firstHMonth, firstHYear)} ${hebrewYear(firstHDate)}`
    : `${getMonthName(firstHMonth, firstHYear)} - ${getMonthName(lastHMonth, lastHDate.getFullYear())} ${hebrewYear(firstHDate)}`;

  const gregMonthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ];

  const navigateMonth = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  // Display value
  const displayValue = useMemo(() => {
    if (!value) return 'בחר תאריך';
    const d = new Date(value + 'T12:00:00');
    const hd = new HDate(d);
    const gregStr = d.toLocaleDateString('he-IL');
    const hebStr = `${hebrewDayOfMonth(hd.getDate())} ${getMonthName(hd.getMonth(), hd.getFullYear())} ${hebrewYear(hd)}`;
    return `${hebStr}  (${gregStr})`;
  }, [value]);

  const handleManualApply = () => {
    setManualError('');
    const day = parseInt(manualDay);
    const month = Number(manualMonth);
    const year = parseInt(manualYear);

    if (!manualDay || manualMonth === '' || !manualYear) {
      setManualError('יש למלא את כל השדות');
      return;
    }
    if (isNaN(day) || day < 1 || day > 30) {
      setManualError('יום לא תקין (1-30)');
      return;
    }
    if (isNaN(year) || year < 5700 || year > 6000) {
      setManualError('שנה לא תקינה');
      return;
    }
    try {
      const hd = new HDate(day, month, year);
      const greg = hd.greg();
      const iso = `${greg.getFullYear()}-${String(greg.getMonth() + 1).padStart(2, '0')}-${String(greg.getDate()).padStart(2, '0')}`;

      const d = new Date(iso + 'T12:00:00');
      if (minDateObj && d < minDateObj) { setManualError('תאריך לפני המינימום המותר'); return; }
      if (maxDateObj && d > maxDateObj) { setManualError('תאריך אחרי המקסימום המותר'); return; }

      onChange(iso);
      setShowManualInput(false);
      setManualDay(''); setManualMonth(''); setManualYear('');
    } catch {
      setManualError('תאריך לא תקין');
    }
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setShowManualInput(false); }}
        className="input-field flex items-center justify-between text-right cursor-pointer w-full"
      >
        <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
        <span className={`flex-1 text-right mx-2 ${value ? 'text-primary-800' : 'text-gray-400'}`}>
          {displayValue}
        </span>
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full mt-2 left-0 right-0 z-50 card shadow-xl p-4 min-w-[300px]">

            {/* Manual input toggle */}
            <button
              type="button"
              onClick={() => setShowManualInput(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg mb-3 transition-colors ${showManualInput ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-primary-600 hover:bg-parchment-100'}`}
            >
              <Pencil className="w-3.5 h-3.5" />
              הזן תאריך עברי ידנית
            </button>

            {/* Manual Hebrew input */}
            {showManualInput && (
              <div className="bg-parchment-50 rounded-xl p-3 mb-3 space-y-2 border border-parchment-200">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">יום</label>
                    <input
                      type="number"
                      min="1" max="30"
                      value={manualDay}
                      onChange={e => setManualDay(e.target.value)}
                      placeholder="יום"
                      className="w-full border border-parchment-300 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">חודש</label>
                    <select
                      value={manualMonth}
                      onChange={e => setManualMonth(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-parchment-300 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">חודש</option>
                      {MONTH_ORDER.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">שנה</label>
                    <input
                      type="number"
                      min="5700" max="6000"
                      value={manualYear}
                      onChange={e => setManualYear(e.target.value)}
                      placeholder="שנה"
                      className="w-full border border-parchment-300 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </div>
                </div>
                {manualError && (
                  <p className="text-xs text-red-500">{manualError}</p>
                )}
                <button
                  type="button"
                  onClick={handleManualApply}
                  className="btn-primary w-full text-sm flex items-center justify-center gap-1.5 py-1.5"
                >
                  <Check className="w-4 h-4" />
                  אישור
                </button>
              </div>
            )}

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              {/* RIGHT side in RTL = first in DOM = NEXT month */}
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-1 rounded-lg hover:bg-parchment-200"
                title="החודש הבא"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="font-bold text-primary-800">{headerHebrew}</p>
                <p className="text-xs text-gray-500">{gregMonthNames[viewMonth]} {viewYear}</p>
              </div>
              {/* LEFT side in RTL = last in DOM = PREVIOUS month */}
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-1 rounded-lg hover:bg-parchment-200"
                title="החודש הקודם"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {HEB_DAY_HEADERS.map((day) => (
                <div key={day} className="text-center text-xs font-bold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={day.isDisabled}
                  onClick={() => {
                    if (!day.isDisabled) {
                      onChange(day.isoStr);
                      setIsOpen(false);
                    }
                  }}
                  className={`
                    relative p-1 rounded-lg text-center transition-all min-h-[44px] flex flex-col items-center justify-center
                    ${day.isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary-100 cursor-pointer'}
                    ${!day.isCurrentMonth ? 'opacity-40' : ''}
                    ${day.isSelected ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
                    ${day.isToday && !day.isSelected ? 'ring-2 ring-primary-400' : ''}
                  `}
                >
                  <span className={`text-xs ${day.isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {day.gregDay}
                  </span>
                  <span className={`text-sm font-bold ${day.isSelected ? 'text-white' : 'text-primary-800'}`}>
                    {hebrewDayOfMonth(day.hebDay)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
