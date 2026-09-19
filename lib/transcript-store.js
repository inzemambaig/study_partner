const state = { chunks: [], sessionId: `session_${Date.now()}`, videoTitle: '', videoUrl: '', startedAt: Date.now() };

export function upsertChunk(chunk) {
  const index = state.chunks.findIndex((item) => item.id === chunk.id);
  if (index >= 0) state.chunks[index] = { ...state.chunks[index], ...chunk };
  else state.chunks.push({ ...chunk });
  state.chunks.sort((a, b) => a.startTime - b.startTime);
  return state.chunks.find((item) => item.id === chunk.id);
}
export function getChunksInRange(startSec, endSec) { return state.chunks.filter((chunk) => chunk.endTime >= startSec && chunk.startTime <= endSec); }
export function getLastNSeconds(fromTimeSec, seconds) { return getChunksInRange(Math.max(0, fromTimeSec - seconds), fromTimeSec); }
export function formatTimestamp(seconds) { const total = Math.max(0, Math.floor(seconds || 0)); const hours = Math.floor(total / 3600); const minutes = Math.floor((total % 3600) / 60); const secs = total % 60; return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`; }
export function getFormattedTranscript(chunks = state.chunks) { return chunks.map((chunk) => `[${formatTimestamp(chunk.startTime)}] ${chunk.text}`).join('\n'); }
export function getChunkNearTimestamp(targetSec) { return state.chunks.reduce((closest, chunk) => !closest || Math.abs(chunk.startTime - targetSec) < Math.abs(closest.startTime - targetSec) ? chunk : closest, null); }
export function getFullTranscript() { return getFormattedTranscript(); }
export function clearStore() { state.chunks = []; state.sessionId = `session_${Date.now()}`; state.startedAt = Date.now(); }
export function getState() { return { ...state, chunks: [...state.chunks] }; }
export function setSession(details = {}) { Object.assign(state, details); }
