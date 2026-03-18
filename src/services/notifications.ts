/**
 * Service to manage local web notifications and background scheduling.
 * Note: Scheduled notifications rely on experimental Web Push features or active service workers.
 * Fallback to simple timeouts if app is kept open.
 */
import { usePlanStore } from '../store/usePlanStore';

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Schedule a local notification (PWA).
 * Note: For this to work in the background on Android, we typically rely on `showNotification`
 * through the ServiceWorkerRegistration, combined with experimental Scheduled Notifications
 * or periodic sync algorithms.
 * For now, we will send the scheduled times to the service worker to attempt management.
 */
export async function scheduleReminders(plans: { planName: string; reminderTime?: string; id: string }[]) {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;

    if (registration && registration.active) {
        registration.active.postMessage({
            type: 'UPDATE_REMINDERS',
            payload: plans
                .filter(p => p.reminderTime)
                .map(p => ({
                    id: p.id,
                    title: 'הגיע הזמן ללמוד!',
                    body: `התזכורת שלך ללימוד ${p.planName} כאן.`,
                    time: p.reminderTime,
                    url: `/plan/${p.id}`
                }))
        });
    }
}

/**
 * Standard fallback check running in the main JS thread while the app is active.
 * We want to verify `reminderTime` matches the current time and we haven't already sent one recently.
 */
export function startNotificationCheck() {
    if (!('Notification' in window)) return;

    // Check every minute
    setInterval(() => {
        if (Notification.permission !== 'granted') return;

        const plans = usePlanStore.getState().plans;
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${currentHours}:${currentMinutes}`;
        const todayStr = now.toDateString();

        plans.forEach(plan => {
            if (plan.reminderTime === timeString) {
                const storageKey = `notif_sent_${plan.id}_${todayStr}`;
                // Avoid firing multiple times in the same minute or if already fired today
                if (!localStorage.getItem(storageKey)) {
                    // Send notification
                    new Notification('הגיע הזמן ללמוד!', {
                        body: `תזכורת הלימוד שלך עבור ${plan.planName} מחכה לך.`,
                        icon: '/vite.svg',
                        tag: plan.id, // prevents duplicates
                    });

                    localStorage.setItem(storageKey, 'true');
                }
            }
        });
    }, 60000); // 1 minute
}
