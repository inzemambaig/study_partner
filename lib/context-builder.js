import { getChunksInRange, getLastNSeconds, getFormattedTranscript, getFullTranscript, formatTimestamp } from './transcript-store.js';

const DEFAULT_SYSTEM = 'You are a study assistant helping the user understand a video they are watching. You will be given a transcript excerpt with timestamps in [MM:SS] format. Be concise. Focus on what the video actually said, not general knowledge. If the transcript excerpt does not contain enough information to answer, say so clearly. Do not make up content that is not in the provided transcript.';

export function parseTimestamp(text) {
  const clock = text.match(/\b(\d{1,2}:)?\d{1,2}:\d{2}\b/);
  if (clock) return clock[0].split(':').map(Number).reduce((total, value) => total * 60 + value, 0);
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?)/i);
  if (minutes) return Number(minutes[1]) * 60;
  return null;
}
export function buildPrompt({ userQuery, store, currentVideoTimeSec = 0, settings = {} }) {
  const lower = userQuery.toLowerCase();
  const timestamp = parseTimestamp(userQuery);
  let intent = 'GENERAL_QUESTION'; let chunks;
  const last = lower.match(/last\s+(\d+)\s*(seconds?|secs?|minutes?|mins?)/);
  if (/summarize|summary|what have i learned|key points/.test(lower)) { intent = 'SUMMARIZE'; chunks = store.chunks; }
  else if (last || /what was just said|just now/.test(lower)) { intent = 'LAST_N_SECONDS'; const seconds = last ? Number(last[1]) * (/minute/.test(last[2]) ? 60 : 1) : 30; chunks = getLastNSeconds(currentVideoTimeSec, seconds); }
  else if (timestamp !== null) { intent = 'TIMESTAMP_REFERENCE'; chunks = getChunksInRange(Math.max(0, timestamp - 30), timestamp + 30); }
  else if (/what does|explain|what is/.test(lower)) { intent = 'WORD_EXPLAIN'; chunks = getLastNSeconds(currentVideoTimeSec, 60); }
  else chunks = getLastNSeconds(currentVideoTimeSec, Number(settings.contextWindowSeconds) || 120);
  const formatted = getFormattedTranscript(chunks);
  return { systemPrompt: settings.systemPrompt || DEFAULT_SYSTEM, userMessage: `Video: ${store.videoTitle || 'Current video'}\nCurrent position: ${formatTimestamp(currentVideoTimeSec)}\n\nHere is the relevant transcript excerpt:\n\n---\n${formatted || getFullTranscript() || '(No transcript available yet)'}\n---\n\nUser question: ${userQuery}`, contextMeta: { intent, startTime: chunks[0]?.startTime ?? 0, endTime: chunks.at(-1)?.endTime ?? currentVideoTimeSec, chunkCount: chunks.length } };
}
export { DEFAULT_SYSTEM };
