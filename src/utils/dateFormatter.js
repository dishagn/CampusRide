/**
 * Date and time helper utilities
 */

export function formatTime(dateOrIso) {
  if (!dateOrIso) return '--:--';
  const d = new Date(dateOrIso);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(dateOrIso) {
  if (!dateOrIso) return '--';
  const d = new Date(dateOrIso);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateOrIso) {
  if (!dateOrIso) return '--';
  return `${formatDate(dateOrIso)} at ${formatTime(dateOrIso)}`;
}

/**
 * Checks if current time is within or past the 10-minute cutoff prior to scheduled arrival.
 * 
 * @param {string} scheduledTimeString e.g. "07:45 AM" or ISO string or "07:45"
 * @param {number} cutoffMinutes Default 10
 * @returns {Object} { isPastCutoff: boolean, minutesRemaining: number, formattedCutoffTime: string }
 */
export function evaluateCheckinCutoff(scheduledTimeString, cutoffMinutes = 10) {
  const now = new Date();
  const scheduledTime = parseTodayTime(scheduledTimeString);
  
  if (!scheduledTime) {
    return { isPastCutoff: false, minutesRemaining: 999, formattedCutoffTime: '--' };
  }

  // Cutoff is scheduledTime minus cutoffMinutes
  const cutoffTime = new Date(scheduledTime.getTime() - cutoffMinutes * 60 * 1000);
  const diffMs = cutoffTime.getTime() - now.getTime();
  const minutesRemaining = Math.round(diffMs / (60 * 1000));

  return {
    isPastCutoff: now >= cutoffTime,
    minutesRemaining,
    formattedCutoffTime: formatTime(cutoffTime),
    scheduledTimeFormatted: formatTime(scheduledTime),
  };
}

/**
 * Parses a string like "07:45 AM" or "14:30" into a Date object for today.
 */
export function parseTodayTime(timeStr) {
  if (!timeStr) return null;
  const now = new Date();
  
  // If ISO string
  if (timeStr.includes('T') || timeStr.includes('-')) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  return date;
}

/**
 * Determines whether a GPS coordinate is stale based on last update timestamp.
 * 
 * @param {string|number|Date} lastUpdated 
 * @param {number} thresholdSeconds Default 120 (2 minutes)
 * @returns {boolean} True if stale (> thresholdSeconds)
 */
export function isTelemetryStale(lastUpdated, thresholdSeconds = 120) {
  if (!lastUpdated) return true;
  const lastTime = new Date(lastUpdated).getTime();
  if (isNaN(lastTime)) return true;
  const now = Date.now();
  const diffSeconds = (now - lastTime) / 1000;
  return diffSeconds > thresholdSeconds;
}

/**
 * Calculates delay in minutes between estimated arrival and scheduled arrival.
 * Delay = Estimated Arrival - Scheduled Time
 */
export function calculateDelayMinutes(estimatedArrivalStr, scheduledTimeStr) {
  const est = parseTodayTime(estimatedArrivalStr);
  const sched = parseTodayTime(scheduledTimeStr);
  if (!est || !sched) return 0;
  
  const diffMs = est.getTime() - sched.getTime();
  return Math.round(diffMs / (60 * 1000));
}

