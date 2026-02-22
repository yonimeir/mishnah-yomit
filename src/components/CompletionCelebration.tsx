import { useEffect, useState } from 'react';
import { Trophy, Star, PartyPopper } from 'lucide-react';

interface CompletionCelebrationProps {
  masechetName: string;
  onClose: () => void;
}

export default function CompletionCelebration({ masechetName, onClose }: CompletionCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  useEffect(() => {
    const colors = ['#d4a843', '#1e3a5f', '#2d8a4e', '#c0392b', '#8e44ad'];
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(items);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Confetti */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${c.left}%`,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="card max-w-sm mx-4 text-center relative z-10 animate-[scaleIn_0.5s_ease-out]">
        <div className="flex justify-center mb-4">
          <div className="bg-gold-400 rounded-full p-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-3">
          <Star className="w-5 h-5 text-gold-500 fill-gold-500" />
          <Star className="w-6 h-6 text-gold-500 fill-gold-500" />
          <Star className="w-5 h-5 text-gold-500 fill-gold-500" />
        </div>

        <h2 className="text-2xl font-bold text-primary-800 mb-2">
          מזל טוב! הדרן עלך!
        </h2>
        <p className="text-lg text-primary-600 mb-1 font-bold">
          מסכת {masechetName}
        </p>
        <p className="text-gray-600 mb-6">
          סיימת את כל המסכת! יישר כוח!
        </p>

        <div className="flex items-center justify-center gap-2 text-gold-600 mb-6">
          <PartyPopper className="w-5 h-5" />
          <span className="font-bold">סיום מסכת!</span>
          <PartyPopper className="w-5 h-5" />
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full"
        >
          המשך
        </button>
      </div>
    </div>
  );
}
