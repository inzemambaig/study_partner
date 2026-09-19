# Study Partner

A Manifest V3 Chrome side-panel study assistant for video transcripts and bring-your-own LLM providers.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Choose Load unpacked and select this `study_partner` folder.
4. Open Settings from the extension options and configure Ollama or another OpenAI-compatible provider.

The first implementation includes the side panel, local settings, transcript store, timestamp-aware context selection, streaming LLM adapters, content-script video controls, and the MV3 offscreen speech-recognition hook.
# study_partner

## Live transcription

Chrome does not allow `webkitSpeechRecognition` to transcribe captured tab audio from an MV3 offscreen document. For videos without captions, use the supported Whisper path:

1. Create a Groq API key at `console.groq.com/keys`.
2. Open the extension Settings page.
3. Set **Transcription mode** to **Whisper via Groq** and enter the key.
4. Reload the extension and the video tab, then press **Start**.

Audio is captured locally by the extension and sent only to Groq for transcription. Caption mode requires no API key and works with supported YouTube or HTML5 caption tracks.
