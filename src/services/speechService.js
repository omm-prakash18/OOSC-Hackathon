/**
 * LokVani AI — Browser-Native Web Speech API Service
 * Robust, production-grade Speech-to-Text (STT) and Text-to-Speech (TTS)
 * with multi-clause transcript accumulation, continuous listening, silence grace timer,
 * and safe browser auto-restart.
 */

class SpeechService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognitionSupported = !!SpeechRecognition;
    this.synthesisSupported = 'speechSynthesis' in window;
    this.recognition = null;

    // Speech accumulation buffers
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isListeningActive = false;
    this.manuallyStopped = false;
    this.silenceTimer = null;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 5;

    // Callbacks & configuration
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onCompleteCallback = null;
    this.currentLang = 'hi-IN';

    // Cached voices
    this._cachedVoices = [];
    this._voicesLoaded = false;

    if (this.recognitionSupported) {
      this._initRecognition(SpeechRecognition);
    }

    if (this.synthesisSupported) {
      this._loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this._loadVoices();
      };
    }
  }

  _initRecognition(SpeechRecognitionClass) {
    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    } catch (err) {
      console.warn('[SpeechService] SpeechRecognition initialization failed:', err);
    }
  }

  _loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this._cachedVoices = voices;
      this._voicesLoaded = true;
    }
  }

  getVoices() {
    if (!this._voicesLoaded || this._cachedVoices.length === 0) {
      this._loadVoices();
    }
    return this._cachedVoices;
  }

  selectVoice(langCode) {
    const voices = this.getVoices();
    if (!voices.length) return null;

    const langPrefix = langCode.split('-')[0].toLowerCase();
    const exact = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
    if (exact) return exact;

    const family = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    if (family) return family;

    return null;
  }

  _splitIntoChunks(text) {
    if (!text) return [];
    const raw = text.split(/(?<=[।.!?])\s+/);
    const chunks = [];
    let current = '';

    for (const part of raw) {
      if ((current + ' ' + part).trim().length > 200) {
        if (current) chunks.push(current.trim());
        current = part;
      } else {
        current = current ? `${current} ${part}` : part;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text];
  }

  // ─── STT (SPEECH-TO-TEXT) ────────────────────────────────────────────────

  /**
   * Start listening for a complete sentence or thought.
   * @param {function} onResult    Called with { transcript, finalTranscript, isFinal }
   * @param {function} onError     Called with error message
   * @param {function} onComplete  Called with complete captured text when finished
   * @param {string} langCode      BCP-47 locale (e.g. 'hi-IN', 'en-IN')
   */
  startListening(onResult, onError, onComplete, langCode = 'hi-IN') {
    if (!this.recognitionSupported || !this.recognition) {
      if (onError) onError('Voice recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Reset session state
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.isListeningActive = true;
    this.manuallyStopped = false;
    this.restartAttempts = 0;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onCompleteCallback = onComplete;
    this.currentLang = langCode;

    this._clearSilenceTimer();
    this._attachRecognitionHandlers();

    try {
      this.recognition.lang = langCode;
      this.recognition.continuous = true;
      this.recognition.start();
      console.log(`[SpeechService] Recognition started. Language: ${langCode}`);
    } catch (err) {
      // If recognition is already running, stop and retry
      if (err.name === 'InvalidStateError') {
        try {
          this.recognition.stop();
          setTimeout(() => {
            if (this.isListeningActive) this.recognition.start();
          }, 150);
        } catch (_) { /* ignore */ }
      } else {
        console.error('[SpeechService] Start error:', err);
        if (onError) onError('Microphone access denied or busy.');
      }
    }
  }

  _attachRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('[SpeechService] Event: onstart');
    };

    this.recognition.onresult = (event) => {
      this.restartAttempts = 0; // Reset restart counter on active speech
      let newlyFinalized = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          newlyFinalized += text + ' ';
        } else {
          currentInterim += text;
        }
      }

      if (newlyFinalized) {
        this.finalTranscript = (this.finalTranscript + ' ' + newlyFinalized).replace(/\s+/g, ' ').trim();
        this.interimTranscript = '';
      } else {
        this.interimTranscript = currentInterim.trim();
      }

      const combinedTranscript = (this.finalTranscript + ' ' + this.interimTranscript).trim();

      if (this.onResultCallback) {
        this.onResultCallback({
          transcript: combinedTranscript,
          finalTranscript: this.finalTranscript,
          interimTranscript: this.interimTranscript,
          isFinal: false
        });
      }

      // Reset 2.5-second silence grace timer whenever user speaks
      this._resetSilenceTimer();
    };

    this.recognition.onerror = (event) => {
      console.warn('[SpeechService] Event: onerror ->', event.error);
      if (event.error === 'no-speech') {
        // Safe natural silence — do not emit fatal error
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isListeningActive = false;
        if (this.onErrorCallback) this.onErrorCallback('Microphone permission denied.');
      }
    };

    this.recognition.onend = () => {
      console.log('[SpeechService] Event: onend. Active:', this.isListeningActive, 'ManualStop:', this.manuallyStopped);

      // If browser ended recognition automatically while user is still speaking (natural pause or Chrome limit), restart safely!
      if (this.isListeningActive && !this.manuallyStopped) {
        if (this.restartAttempts < this.maxRestartAttempts) {
          this.restartAttempts++;
          console.log(`[SpeechService] Auto-restarting recognition (attempt ${this.restartAttempts}/${this.maxRestartAttempts})...`);
          setTimeout(() => {
            if (this.isListeningActive && !this.manuallyStopped) {
              try {
                this.recognition.lang = this.currentLang;
                this.recognition.start();
              } catch (_) { /* ignore */ }
            }
          }, 200);
          return;
        }
      }

      // Conclude session if manually stopped or silence period expired
      if (!this.isListeningActive || this.manuallyStopped) {
        this._finishSession();
      }
    };
  }

  _resetSilenceTimer() {
    this._clearSilenceTimer();
    // Allow 2.5 seconds of natural pause before concluding complete thought
    this.silenceTimer = setTimeout(() => {
      console.log('[SpeechService] 2.5s silence grace timer elapsed. Concluding complete sentence...');
      this.stopListeningAndSubmit();
    }, 2500);
  }

  _clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  stopListeningAndSubmit() {
    this._clearSilenceTimer();
    this.manuallyStopped = true;
    this.isListeningActive = false;

    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) { /* ignore */ }
    }

    this._finishSession();
  }

  cancelListening() {
    this._clearSilenceTimer();
    this.manuallyStopped = true;
    this.isListeningActive = false;
    this.finalTranscript = '';
    this.interimTranscript = '';

    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) { /* ignore */ }
    }
  }

  _finishSession() {
    this._clearSilenceTimer();
    const completeText = (this.finalTranscript + ' ' + this.interimTranscript).replace(/\s+/g, ' ').trim();

    if (this.onCompleteCallback && completeText) {
      const callback = this.onCompleteCallback;
      this.onCompleteCallback = null; // Guard against duplicate calls
      callback(completeText);
    }
  }

  // ─── TTS (TEXT-TO-SPEECH) ────────────────────────────────────────────────

  speakText(text, langCode = 'hi-IN', onEnd = null, rate = 0.92) {
    if (!this.synthesisSupported) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    if (!text || text.trim() === '') {
      if (onEnd) onEnd();
      return;
    }

    const voice = this.selectVoice(langCode);
    const chunks = this._splitIntoChunks(text);
    let chunkIndex = 0;

    const speakNext = () => {
      if (chunkIndex >= chunks.length) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.lang = langCode;
      utterance.rate = Math.min(Math.max(rate, 0.5), 2.0);
      utterance.pitch = 1.0;

      if (voice) utterance.voice = voice;

      utterance.onend = () => {
        chunkIndex++;
        speakNext();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted') {
          console.warn('[SpeechService] TTS error chunk:', e.error);
        }
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  }

  stopSpeaking() {
    if (this.synthesisSupported) {
      window.speechSynthesis.cancel();
    }
  }

  getSupportStatus() {
    return {
      stt: this.recognitionSupported,
      tts: this.synthesisSupported
    };
  }
}

export const speechService = new SpeechService();
