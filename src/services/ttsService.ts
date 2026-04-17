import { GoogleGenAI, Modality } from "@google/genai";

class TTSService {
  private ai: GoogleGenAI | null = null;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  private initAI() {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    }
    return this.ai;
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    return this.audioContext;
  }

  async speak(text: string, language: string = 'English') {
    try {
      this.stop();
      const ai = this.initAI();
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const prompt = `Read this in a mature, calm, and older male voice in ${language}: ${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data received from Gemini TTS");
      }

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode PCM data (Gemini TTS returns raw PCM at 24kHz)
      // Actually, the instructions say: "... decode and play audio with sample rate 24000 ..."
      // For raw PCM, we need to create a buffer and copy the data.
      // But wait, is it raw PCM or encoded? 
      // "Unlike TTS and Live (which return raw PCM requiring AudioContext), these models return encoded audio (e.g., WAV)."
      // Wait, the "Generate Music" section says that.
      // The "Generate Speech" section says: "// ... decode and play audio with sample rate 24000 ..."
      // Usually "decode and play" implies it might be encoded (like MP3/WAV) or raw.
      // If it's raw PCM, we need to know the bit depth and channels.
      // Let's assume it's encoded (WAV/MP3) first as it's more common for generateContent.
      // Actually, if it's raw PCM 16-bit Mono 24kHz:
      
      const audioData = bytes.buffer;
      
      // Try decoding as audio data first (works if it's WAV/MP3)
      try {
        // Use a copy because decodeAudioData detaches the buffer
        const audioBuffer = await ctx.decodeAudioData(audioData.slice(0));
        this.currentSource = ctx.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        this.currentSource.connect(ctx.destination);
        this.currentSource.start();
      } catch (e) {
        // If decoding fails, it might be raw PCM
        console.warn("Failed to decode audio data, attempting raw PCM playback", e);
        const pcmData = new Int16Array(audioData);
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0;
        }
        
        const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
        audioBuffer.getChannelData(0).set(floatData);
        
        this.currentSource = ctx.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        this.currentSource.connect(ctx.destination);
        this.currentSource.start();
      }

    } catch (error) {
      console.error("TTS Error:", error);
      // Fallback to browser TTS if Gemini fails
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }

  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {}
      this.currentSource = null;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }
}

export const ttsService = new TTSService();
