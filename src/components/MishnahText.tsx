import { useState, useEffect } from 'react';
import { fetchChapter, fetchCommentary, type MishnahText as MishnahTextType, getCommentatorsForType } from '../services/sefaria';
import { gematriya } from '../services/scheduler';
import { Loader2, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import type { ContentType } from '../data/mishnah-structure';

interface MishnahTextProps {
  sefariaRef: string;
  sefariaName: string;
  chapter: number;
  fromMishnah: number;
  toMishnah: number;
  masechetName: string;
  contentType?: ContentType;
}

interface MishnahCommentaries {
  [commentatorId: string]: {
    [mishnahIndex: number]: string[];
  };
}

export default function MishnahTextDisplay({
  sefariaRef,
  sefariaName,
  chapter,
  fromMishnah,
  toMishnah,
  masechetName,
  contentType = 'mishnah',
}: MishnahTextProps) {
  const commentators = getCommentatorsForType(contentType);
  const [text, setText] = useState<MishnahTextType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-mishnah commentary state: { mishnahIdx: commentatorId | null }
  const [openCommentary, setOpenCommentary] = useState<Record<number, string | null>>({});
  const [commentaries, setCommentaries] = useState<MishnahCommentaries>({});
  const [loadingCommentary, setLoadingCommentary] = useState<Record<string, boolean>>({});

  const chapterRef = sefariaRef.includes(':')
    ? sefariaRef.split(':')[0]
    : sefariaRef;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOpenCommentary({});
    setCommentaries({});

    fetchChapter(chapterRef)
      .then((data) => {
        if (!cancelled) {
          setText(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [chapterRef]);

  const toggleCommentary = async (mishnahIdx: number, commentatorId: string, commentatorSefariaName: string) => {
    // If already open with this commentator, close it
    if (openCommentary[mishnahIdx] === commentatorId) {
      setOpenCommentary(prev => ({ ...prev, [mishnahIdx]: null }));
      return;
    }

    // Open this commentator for this mishnah
    setOpenCommentary(prev => ({ ...prev, [mishnahIdx]: commentatorId }));

    // Check if already loaded
    const cacheKey = `${commentatorId}_${mishnahIdx}`;
    if (commentaries[commentatorId]?.[mishnahIdx]) return;

    // Fetch commentary for this specific mishnah
    setLoadingCommentary(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const mishnahRef = `${sefariaName} ${chapter}:${mishnahIdx + 1}`;
      const data = await fetchCommentary(mishnahRef, commentatorSefariaName);
      const texts = Array.isArray(data.hebrew)
        ? data.hebrew.flat().map(t => String(t))
        : [String(data.hebrew)];

      setCommentaries(prev => ({
        ...prev,
        [commentatorId]: {
          ...prev[commentatorId],
          [mishnahIdx]: texts,
        },
      }));
    } catch {
      setCommentaries(prev => ({
        ...prev,
        [commentatorId]: {
          ...prev[commentatorId],
          [mishnahIdx]: [],
        },
      }));
    } finally {
      setLoadingCommentary(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="mr-3 text-gray-600">טוען טקסט...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200 text-center py-8">
        <p className="text-danger font-bold mb-2">שגיאה בטעינת הטקסט</p>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!text || text.hebrew.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">לא נמצא טקסט</p>
      </div>
    );
  }

  const mishnayot = text.hebrew.slice(fromMishnah - 1, toMishnah);

  return (
    <div className="space-y-4">
      {/* Chapter title */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-primary-800 font-serif-hebrew">
          {contentType === 'rambam' ? 'הלכות' : contentType === 'gemara' ? 'מסכת' : 'מסכת'} {masechetName}{' '}
          {contentType === 'gemara' ? `דף ${chapter + 1}` : `פרק ${gematriya(chapter)}`}
        </h2>
        {contentType !== 'gemara' && fromMishnah !== toMishnah && (
          <p className="text-sm text-gray-500 mt-1">
            {contentType === 'rambam' ? 'הלכות' : 'משניות'} {gematriya(fromMishnah)} - {gematriya(toMishnah)}
          </p>
        )}
      </div>

      {/* Mishnayot with clickable commentary */}
      {mishnayot.map((mishnahHtml, idx) => {
        const mishnahNum = fromMishnah + idx;       // 1-based
        const mishnahIdx = mishnahNum - 1;           // 0-based for Sefaria
        const activeCommentator = openCommentary[mishnahIdx];

        return (
          <div key={idx} className="card overflow-hidden">
            {/* Mishnah text */}
            <div className="flex items-start gap-3 mb-3">
              <span className="bg-primary-100 text-primary-700 rounded-lg px-2 py-1 text-sm font-bold shrink-0">
                {gematriya(mishnahNum)}
              </span>
              <div
                className="font-serif-hebrew text-lg leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: stripHtmlTags(mishnahHtml) }}
              />
            </div>

            {/* Commentary selector row */}
            <div className="flex items-center gap-2 border-t border-parchment-200 pt-2">
              <MessageCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {commentators.map((c) => {
                const isActive = activeCommentator === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCommentary(mishnahIdx, c.id, c.sefariaName)}
                    className={`
                      px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1
                      ${isActive
                        ? 'bg-primary-700 text-white'
                        : 'bg-parchment-100 text-primary-600 hover:bg-parchment-200'
                      }
                    `}
                  >
                    {c.name}
                    {isActive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>

            {/* Commentary content (inline, below this mishnah) */}
            {activeCommentator && (
              <div className="mt-3 border-t border-parchment-200 pt-3">
                {loadingCommentary[`${activeCommentator}_${mishnahIdx}`] ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    <span className="mr-2 text-sm text-gray-500">טוען פירוש...</span>
                  </div>
                ) : commentaries[activeCommentator]?.[mishnahIdx]?.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-primary-600 mb-1">
                      {commentators.find(c => c.id === activeCommentator)?.name}
                    </p>
                    {commentaries[activeCommentator][mishnahIdx].map((text, cidx) => (
                      <div
                        key={cidx}
                        className="bg-parchment-50 rounded-xl p-3 font-serif-hebrew text-base leading-relaxed text-gray-700 border border-parchment-200"
                        dangerouslySetInnerHTML={{ __html: stripHtmlTags(text) }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">
                    אין פירוש זמין למשנה זו
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n/g, '<br/>');
}
