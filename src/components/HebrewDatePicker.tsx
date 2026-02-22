import { useState, useMemo } from 'react';
import { HDate, months, Locale } from '@hebcal/core';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

interface HebrewDatePickerProps {
  value: string; // ISO date string
  onChange: (isoDate: string) => void;
  minDate?: string;
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
  [months.ADAR_I]: 'אדר א\'',
  [months.ADAR_II]: 'אדר ב\'',
};

const HEB_DAY_HEADERS = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];

function hebrewYear(hd: HDate): string {
  const year = hd.getFullYear();
  return formatHebrewNumber(year % 1000);
}

function formatHebrewNumber(n: number): string {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];

  if (n === 15) return 'ט"ו';
  if (n === 16) return 'ט"ז';

  let result = '';

  if (n >= 100) {
    let h = Math.floor(n / 100);
    while (h > 4) {
      result += 'ת';
      h -= 4;
    }
    result += hundreds[h];
    n %= 100;
  }

  if (n === 15) {
    result += 'טו';
  } else if (n === 16) {
    result += 'טז';
  } else {
    result += tens[Math.floor(n / 10)];
    result += ones[n % 10];
  }

  // Add gershayim
  if (result.length > 1) {
    result = result.slice(0, -1) + '"' + result.slice(-1);
  } else if (result.length === 1) {
    result += '\'';
  }

  return result;
}

function hebrewDayOfMonth(day: number): string {
  return formatHebrewNumber(day);
}

function getMonthName(month: number): string {
  return HEB_MONTH_NAMES[month] || `חודש ${month}`;
}

export default function HebrewDatePicker({ value, onChange, minDate }: HebrewDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Current view month (Gregorian month/year for navigation)
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-based

  const minDateObj = minDate ? new Date(minDate) : undefined;

  // Generate calendar days for the current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun

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

    // Fill days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(viewYear, viewMonth, -(startDayOfWeek - 1 - i));
      const hd = new HDate(d);
      const iso = d.toISOString().split('T')[0];
      days.push({
        date: d,
        gregDay: d.getDate(),
        hebDay: hd.getDate(),
        hebMonthName: getMonthName(hd.getMonth()),
        isoStr: iso,
        isCurrentMonth: false,
        isDisabled: minDateObj ? d < minDateObj : false,
        isSelected: iso === value,
        isToday: iso === new Date().toISOString().split('T')[0],
      });
    }

    // Fill current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(viewYear, viewMonth, day);
      const hd = new HDate(d);
      const iso = d.toISOString().split('T')[0];
      days.push({
        date: d,
        gregDay: day,
        hebDay: hd.getDate(),
        hebMonthName: getMonthName(hd.getMonth()),
        isoStr: iso,
        isCurrentMonth: true,
        isDisabled: minDateObj ? d < minDateObj : false,
        isSelected: iso === value,
        isToday: iso === new Date().toISOString().split('T')[0],
      });
    }

    // Fill remaining to complete the grid
    const remaining = 42 - days.length; // 6 rows × 7 cols
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const hd = new HDate(d);
      const iso = d.toISOString().split('T')[0];
      days.push({
        date: d,
        gregDay: d.getDate(),
        hebDay: hd.getDate(),
        hebMonthName: getMonthName(hd.getMonth()),
        isoStr: iso,
        isCurrentMonth: false,
        isDisabled: minDateObj ? d < minDateObj : false,
        isSelected: iso === value,
        isToday: iso === new Date().toISOString().split('T')[0],
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate]);

  // Hebrew month info for header
  const midMonthDate = new Date(viewYear, viewMonth, 15);
  const midHDate = new HDate(midMonthDate);

  const gregMonthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
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
    const d = new Date(value);
    const hd = new HDate(d);
    const gregStr = d.toLocaleDateString('he-IL');
    const hebStr = `${hebrewDayOfMonth(hd.getDate())} ${getMonthName(hd.getMonth())} ${hebrewYear(hd)}`;
    return `${hebStr}  (${gregStr})`;
  }, [value]);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field flex items-center justify-between text-right cursor-pointer"
      >
        <Calendar className="w-5 h-5 text-gray-400" />
        <span className={value ? 'text-primary-800' : 'text-gray-400'}>
          {displayValue}
        </span>
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full mt-2 left-0 right-0 z-50 card shadow-xl p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-1 rounded-lg hover:bg-parchment-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="font-bold text-primary-800">
                  {getMonthName(midHDate.getMonth())} - {getMonthName(midHDate.getMonth() === 12 ? 1 : midHDate.getMonth() + 1)} {hebrewYear(midHDate)}
                </p>
                <p className="text-xs text-gray-500">
                  {gregMonthNames[viewMonth]} {viewYear}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-1 rounded-lg hover:bg-parchment-200"
              >
                <ChevronRight className="w-5 h-5" />
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
