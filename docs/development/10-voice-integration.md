# Voice Integration Guide

**Related Milestone:** [Milestone 3: AI & Advanced Features](../milestones/MILESTONES.md#milestone-3-ai--advanced-features)

## Overview

This document provides a comprehensive guide for integrating voice input and text-to-speech (TTS) capabilities for AfriCoin's voice command feature.

## Table of Contents

1. [Speech-to-Text (STT)](#speech-to-text-stt)
2. [Text-to-Speech (TTS)](#text-to-speech-tts)
3. [Voice Command Flow](#voice-command-flow)
4. [Frontend Integration](#frontend-integration)
5. [Error Handling](#error-handling)

---

## Speech-to-Text (STT)

### Web Speech API

The easiest solution for browser-based STT:

```typescript
// src/services/speechToText.ts
export interface STTResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Set language to Swahili
    this.recognition.lang = "sw-TZ"; // Tanzanian Swahili
    // or "sw-KE" for Kenyan Swahili

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
  }

  public start(
    onResult: (result: STTResult) => void,
    onError: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError("Speech Recognition not supported");
      return;
    }

    this.isListening = true;

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          onResult({
            text: transcript,
            confidence: event.results[i][0].confidence,
            isFinal: true,
          });
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        onResult({
          text: interimTranscript,
          confidence: 0.5,
          isFinal: false,
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError(`Speech recognition error: ${event.error}`);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log("Speech recognition ended");
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError("Failed to start speech recognition");
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }
}
```

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Works well on Android too |
| Firefox | ⚠️ Limited | Experimental feature |
| Safari | ✅ Full | iOS 14.5+ |
| Edge | ✅ Full | Chromium-based |

### Alternative: Google Cloud Speech-to-Text

For production with higher accuracy:

```typescript
// src/services/googleSpeechToText.ts
import * as speech from "@google-cloud/speech";

const client = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

export async function transcribeAudio(audioContent: Buffer): Promise<string> {
  const request = {
    audio: {
      content: audioContent,
    },
    config: {
      encoding: "LINEAR16" as any,
      sampleRateHertz: 16000,
      languageCode: "sw-TZ", // Swahili (Tanzania)
    },
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    ?.map((result) =>
      result.alternatives?.map((alternative) => alternative.transcript).join(" ")
    )
    .join("\n");

  return transcription || "";
}
```

---

## Text-to-Speech (TTS)

### Web Speech API (Simple)

```typescript
// src/services/textToSpeech.ts
export class TextToSpeechService {
  private synth = window.speechSynthesis;

  public speak(
    text: string,
    language: string = "sw-TZ",
    onEnd?: () => void
  ): void {
    if (!this.synth) {
      console.error("Speech Synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1; // Normal speed
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
    };

    this.synth.speak(utterance);
  }

  public stop(): void {
    this.synth.cancel();
  }

  public isSupported(): boolean {
    return !!this.synth;
  }
}
```

### Google Cloud Text-to-Speech

For production-quality voices:

```typescript
// src/services/googleTextToSpeech.ts
import * as textToSpeech from "@google-cloud/text-to-speech";

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const request = {
    input: { text },
    voice: {
      languageCode: "sw-TZ", // Swahili
      name: "sw-TZ-Neural2-A", // Neural voice
      ssmlGender: textToSpeech.protos.google.cloud.texttospeech.v1
        .SsmlVoiceGender.FEMALE,
    },
    audioConfig: {
      audioEncoding:
        textToSpeech.protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent as Buffer;
}
```

---

## Voice Command Flow

### Complete Flow Diagram

```
User presses Voice Button
    ↓
Start listening (STT)
    ↓
User speaks: "Tuma 50 AFRI kwa Amina"
    ↓
STT returns: "Tuma 50 AFRI kwa Amina"
    ↓
Send to backend intent classifier (LLM)
    ↓
Extract intent: SEND_MONEY
Extract entities: amount=50, recipient=Amina
    ↓
Return action to frontend
    ↓
Ask for PIN (optional confirmation)
    ↓
Execute transaction
    ↓
Generate response text
    ↓
Speak response (TTS)
    ↓
Show success message
```

### Implementation

```typescript
// src/services/voiceCommandService.ts
import { SpeechToTextService, STTResult } from "./speechToText";
import { TextToSpeechService } from "./textToSpeech";
import { mapToAction, UserAction } from "./actionMapper";

export class VoiceCommandService {
  private sttService: SpeechToTextService;
  private ttsService: TextToSpeechService;

  constructor() {
    this.sttService = new SpeechToTextService();
    this.ttsService = new TextToSpeechService();
  }

  public async processVoiceCommand(
    onAction: (action: UserAction) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.sttService.isSupported()) {
      onError("Voice commands not supported on this device");
      return;
    }

    let finalTranscript = "";

    this.sttService.start(
      async (result: STTResult) => {
        if (result.isFinal) {
          finalTranscript = result.text;

          try {
            // Map to action using LLM
            const action = await mapToAction(finalTranscript);
            onAction(action);

            // Generate response text
            const responseText = generateResponseText(action);

            // Speak response
            this.ttsService.speak(responseText, "sw-TZ");
          } catch (error) {
            const errorMsg = `Error processing command: ${error}`;
            onError(errorMsg);
            this.ttsService.speak(errorMsg, "sw-TZ");
          }
        } else {
          // Show interim results
          console.log("Interim:", result.text);
        }
      },
      (error) => {
        onError(error);
        this.ttsService.speak("Ndoto kosa. Jaribu tena.", "sw-TZ");
      }
    );

    // Auto-stop after 10 seconds of silence
    setTimeout(() => {
      this.sttService.stop();
    }, 10000);
  }

  public stopListening(): void {
    this.sttService.stop();
  }
}

function generateResponseText(action: UserAction): string {
  switch (action.type) {
    case "SEND_MONEY":
      return `Nitakutuma ${action.params.amount} AFRI kwa ${action.params.recipientPhone}. Thibitisha kwa PIN.`;

    case "CHECK_BALANCE":
      return "Ninatafuta salio lako. Tafadhali subiri.";

    case "SHOW_RECEIVE":
      return "Hii ni namba yako kwa kupokea pesa.";

    case "SHOW_HISTORY":
      return "Inaonyesha historia ya muamala yako.";

    case "UNKNOWN":
      return "Sifahamu amri hiyo. Jaribu tena.";

    default:
      return "Amri ilipata hitilafu. Jaribu tena.";
  }
}
```

---

## Frontend Integration

### Voice Button Component

```typescript
// src/components/VoiceButton.tsx
import React, { useState, useRef } from "react";
import { VoiceCommandService } from "../services/voiceCommandService";
import { useTranslation } from "react-i18next";

export const VoiceButton: React.FC<{
  onAction: (action: any) => void;
}> = ({ onAction }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const voiceServiceRef = useRef<VoiceCommandService | null>(null);

  const handleStartListening = async () => {
    setIsListening(true);
    setTranscript("");
    setError("");

    if (!voiceServiceRef.current) {
      voiceServiceRef.current = new VoiceCommandService();
    }

    try {
      await voiceServiceRef.current.processVoiceCommand(
        (action) => {
          setTranscript(`Processing: ${action.type}`);
          onAction(action);
        },
        (error) => {
          setError(error);
          setIsListening(false);
        }
      );
    } catch (err) {
      setError(`Error: ${err}`);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    setIsListening(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <button
        onClick={isListening ? handleStopListening : handleStartListening}
        className={`px-6 py-3 rounded-full font-bold text-white transition ${
          isListening
            ? "bg-red-500 hover:bg-red-600 animate-pulse"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isListening ? "🎤 Listening..." : "🎤 Start Voice Command"}
      </button>

      {transcript && (
        <div className="text-center">
          <p className="text-gray-600">Heard:</p>
          <p className="text-lg font-semibold">{transcript}</p>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-center">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <p className="text-gray-500 text-sm">
        Example: "Tuma 50 AFRI kwa Amina"
      </p>
    </div>
  );
};
```

### Voice Page

```typescript
// src/pages/Voice.tsx
import React from "react";
import { VoiceButton } from "../components/VoiceButton";
import { useWallet } from "../hooks/useWallet";

export const Voice: React.FC = () => {
  const { sendMoney, checkBalance } = useWallet();

  const handleVoiceAction = async (action: any) => {
    switch (action.type) {
      case "SEND_MONEY":
        // Execute send
        await sendMoney(
          action.params.recipientPhone,
          action.params.amount,
          "" // PIN would be asked separately
        );
        break;

      case "CHECK_BALANCE":
        await checkBalance();
        break;

      // ... handle other actions
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-yellow-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Voice Commands
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Speak in Swahili to control your wallet
        </p>

        <VoiceButton onAction={handleVoiceAction} />

        <div className="mt-8 space-y-2">
          <h3 className="font-bold text-gray-800">Example Commands:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• "Tuma 50 AFRI kwa Amina"</li>
            <li>• "Salio yangu ni nini"</li>
            <li>• "Historia ya muamala"</li>
            <li>• "Nipe namba yangu"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
```

---

## Error Handling

### Common Voice Recognition Errors

```typescript
// src/utils/voiceErrorHandler.ts
export function getVoiceErrorMessage(error: string, language: string = "sw"): string {
  const errorMap: { [key: string]: { sw: string; en: string } } = {
    "no-speech": {
      sw: "Sikia kwa sauti kulikosa. Jaribu tena.",
      en: "No speech detected. Please try again.",
    },
    "network-error": {
      sw: "Kosa la mtandao. Angalia muunganisho.",
      en: "Network error. Check your connection.",
    },
    "audio-capture": {
      sw: "Mikrofoni haipo au haina ruhusa.",
      en: "Microphone not available or permission denied.",
    },
    "service-not-allowed": {
      sw: "Huduma ya sauti hairuhusiwi.",
      en: "Voice service not allowed.",
    },
  };

  return errorMap[error]?.[language] || `Error: ${error}`;
}
```

---

## Testing

### Unit Tests

```typescript
// test/services/voiceCommandService.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { VoiceCommandService } from "../../src/services/voiceCommandService";

describe("VoiceCommandService", () => {
  let service: VoiceCommandService;

  beforeEach(() => {
    service = new VoiceCommandService();
  });

  it("should process voice command", async () => {
    const action = await service.processVoiceCommand();
    expect(action).toBeDefined();
  });

  // More tests...
});
```

---

## Best Practices

1. **Permissions:** Always request microphone permission
2. **Feedback:** Provide visual and audio feedback
3. **Timeout:** Auto-stop after silence
4. **Offline Fallback:** Have text-based alternative
5. **Privacy:** Inform user when recording
6. **Latency:** Aim for <2s response
7. **Testing:** Test with various accents

---

## Next Steps

1. ✅ Implement STT
2. ✅ Implement TTS
3. ✅ Create voice command flow
4. ✅ Test with Swahili speakers
5. Move to [AI Stability Engine](./11-ai-stability-engine.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
