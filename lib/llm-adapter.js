async function streamResponse(response, onStream) {
  if (!response.ok) { const detail = await response.text(); throw new Error(`LLM request failed (${response.status}): ${detail || response.statusText}`); }
  if (!response.body) return '';
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let full = '';
  while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data:')) continue; const data = line.slice(5).trim(); if (data === '[DONE]') continue; try { const json = JSON.parse(data); const token = json.choices?.[0]?.delta?.content || json.message?.content || json.delta?.text || ''; if (token) { full += token; onStream?.(token); } } catch {} } }
  return full;
}
export async function callLLM({ systemPrompt, userMessage, config, onStream }) {
  const provider = config.provider || 'ollama'; const base = (config.baseUrl || (provider === 'ollama' ? 'http://localhost:11434' : provider === 'anthropic' ? 'https://api.anthropic.com' : provider === 'openrouter' ? 'https://openrouter.ai/api' : 'https://api.openai.com')).replace(/\/$/, '');
  const anthropic = provider === 'anthropic'; const url = anthropic ? `${base}/v1/messages` : `${base}/v1/chat/completions`;
  const headers = { 'Content-Type': 'application/json' }; if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`; if (anthropic) { delete headers.Authorization; headers['x-api-key'] = config.apiKey; headers['anthropic-version'] = '2023-06-01'; }
  if (provider === 'openrouter') { headers['HTTP-Referer'] = 'study-partner-extension'; headers['X-Title'] = 'Study Partner'; }
  const body = anthropic ? { model: config.model, max_tokens: config.maxTokens || 1000, system: systemPrompt, messages: [{ role: 'user', content: userMessage }], stream: true } : { model: config.model || 'llama3.2', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], stream: true, ...(provider === 'ollama' ? { options: { temperature: config.temperature ?? 0.3, num_predict: config.maxTokens || 1000 } } : { temperature: config.temperature ?? 0.3, max_tokens: config.maxTokens || 1000 }) };
  try { return await streamResponse(await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }), onStream); } catch (error) { if (provider === 'ollama') throw new Error(`Ollama is unavailable. Start it with "ollama serve". ${error.message}`); throw error; }
}
