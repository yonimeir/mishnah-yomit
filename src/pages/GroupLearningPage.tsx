import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listenToGroupProgress, markGroupUnitComplete, getLearningGroup, type LearningGroup } from '../services/collaborative';
import { globalToLocal, getContentTypeLabels, formatGemaraPoint } from '../data/mishnah-structure';
import { Users, CheckCircle, ArrowRight, Share2, BookOpen } from 'lucide-react';
import { gematriya } from '../services/scheduler';

export default function GroupLearningPage() {
  const { groupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<LearningGroup | null>(null);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    
    getLearningGroup(groupId)
      .then(g => {
        if (!g) {
          setError('הקבוצה לא נמצאה');
        } else {
          setGroup(g);
        }
      })
      .catch((e) => {
        console.error(e);
        setError('שגיאה בטעינת הקבוצה');
      });

    const unsubscribe = listenToGroupProgress(groupId, (newProgress) => {
      setGroup(prev => prev ? { ...prev, progress: newProgress } : null);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `הצטרפו ללימוד המשותף: ${group?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק ללוח!');
    }
  };

  const handleUnitClick = async (globalPos: number) => {
    if (!group || !groupId) return;
    if (group.progress[globalPos]) return; // Already completed
    
    if (!isJoined || !userName.trim()) {
      alert('נא להזין שם לפני שמסמנים לימוד!');
      return;
    }

    try {
      await markGroupUnitComplete(groupId, globalPos, userName.trim());
    } catch (e) {
      alert('שגיאה בשמירת ההתקדמות');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <Users className="w-8 h-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{error}</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary-600 font-bold">בחזרה למסך הראשי</button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const ctLabels = getContentTypeLabels(group.contentType);
  const unitsCompleted = Object.keys(group.progress).length;
  const progressPercent = Math.round((unitsCompleted / group.totalUnits) * 100);

  // Generate an array representing all units to click on
  const unitItems = Array.from({ length: group.totalUnits }, (_, i) => i);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -mr-2 text-primary-600 hover:bg-primary-50 rounded-lg">
          <ArrowRight className="w-6 h-6" />
        </button>
        <button onClick={handleShare} className="p-2 -ml-2 text-primary-600 hover:bg-primary-50 rounded-lg">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center space-y-2">
        <div className="bg-primary-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-primary-800">{group.name}</h1>
        <p className="text-gray-600 text-sm">לימוד משותף - {ctLabels.allName}</p>
      </div>

      {!isJoined ? (
        <div className="card space-y-4">
          <h2 className="font-bold text-primary-800 text-center">הצטרף ללימוד</h2>
          <p className="text-sm text-gray-600 text-center">הכנס את שמך כדי לקחת חלק ולסמן יחידות נלמדות.</p>
          <input 
            type="text" 
            placeholder="השם שלך..." 
            className="select-field w-full"
            value={userName}
            onChange={e => setUserName(e.target.value)}
          />
          <button 
            className="btn-primary w-full"
            disabled={!userName.trim()}
            onClick={() => setIsJoined(true)}
          >
            היכנס לקבוצה
          </button>
        </div>
      ) : (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
           <span className="font-bold text-primary-800">שלום, {userName}</span>
           <button onClick={() => setIsJoined(false)} className="text-xs text-primary-600 font-bold bg-white px-2 py-1 rounded">שינוי שם</button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="font-bold text-primary-800 text-sm">התקדמות הקבוצה</span>
          <span className="text-sm font-bold text-primary-600">{progressPercent}%</span>
        </div>
        <div className="h-3 bg-parchment-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">
          הושלמו {unitsCompleted} מתוך {group.totalUnits} {subProgramUnitLabel(group)}
        </p>
      </div>

      {/* Grid of Units */}
      <div className="card space-y-4">
        <h2 className="font-bold text-primary-800 text-center">מסמנים ולומדים ביחד</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {unitItems.map(globalPos => {
            const loc = globalToLocal(group.masechetIds, globalPos, group.unit);
            if (!loc) return null;
            
            const isCompleted = !!group.progress[globalPos];
            const completedBy = isCompleted ? group.progress[globalPos].completedBy : null;
            
            // Format labels
            let displayLabel = "";
            let shortLabel = "";
            
            if (group.contentType === 'gemara' && group.unit === 'mishnah') { // 'mishnah' unit for gemara actually means Amud
              displayLabel = `${loc.masechet.name} ${formatGemaraPoint(loc.masechet, loc.positionInMasechet)}`;
              shortLabel = loc.positionInMasechet.toString(); // Very simplified
            } else {
              displayLabel = `${loc.masechet.name} ${gematriya(loc.positionInMasechet + 1)}`;
              shortLabel = gematriya(loc.positionInMasechet + 1);
            }

            return (
              <button
                key={globalPos}
                onClick={() => handleUnitClick(globalPos)}
                disabled={isCompleted}
                title={displayLabel}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all w-24 h-24 ${
                  isCompleted 
                    ? 'bg-success/10 border-success/30 cursor-not-allowed' 
                    : 'bg-white border-parchment-200 hover:border-primary-400 hover:shadow-md cursor-pointer'
                }`}
              >
                {isCompleted ? (
                   <>
                     <CheckCircle className="w-6 h-6 text-success mb-1" />
                     <span className="text-[10px] text-gray-500 leading-tight">נקרא ע"י</span>
                     <span className="text-xs font-bold text-success truncate w-full text-center">{completedBy}</span>
                   </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-primary-800 text-center leading-tight">
                       {loc.masechet.name}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">
                      {group.unit === 'perek' ? 'פרק ' : ''}{shortLabel}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function subProgramUnitLabel(group: LearningGroup) {
  const lbl = getContentTypeLabels(group.contentType);
  return group.unit === 'mishnah' ? lbl.unitPlural : lbl.chapterPlural;
}
