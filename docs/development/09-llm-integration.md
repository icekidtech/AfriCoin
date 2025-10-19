# Swahili LLM Integration Guide

**Related Milestone:** [Milestone 3: AI & Advanced Features](../milestones/MILESTONES.md#milestone-3-ai--advanced-features)

## Overview

This document provides a comprehensive guide for integrating a Swahili-fine-tuned LLM for voice commands and natural language processing in AfriCoin.

## Table of Contents

1. [LLM Selection](#llm-selection)
2. [Hugging Face Integration](#hugging-face-integration)
3. [Intent Recognition](#intent-recognition)
4. [Entity Extraction](#entity-extraction)
5. [Testing & Evaluation](#testing--evaluation)

---

## LLM Selection

### Recommended Models

#### 1. Mistral 7B (Swahili Fine-tuned)

**Why:**
- Smaller, faster inference (7B parameters)
- Can run on edge devices
- Good Swahili performance with fine-tuning
- Open-source

**Inference:** ~500ms per request on CPU

#### 2. OpenAI GPT-3.5-turbo with Fine-tuning

**Why:**
- Most accurate
- Easy to fine-tune
- Proven Swahili capabilities
- Managed infrastructure

**Cost:** ~$0.002 per 1K tokens

#### 3. Llama 2 (Meta)

**Why:**
- Open-source, run locally
- Swahili support improving
- Fine-tuning friendly

**Recommendation for MVP:** Use Hugging Face API with Mistral 7B or OpenAI GPT-3.5-turbo

---

## Hugging Face Integration

### Setup

```bash
npm install @huggingface/inference axios
```

### Configuration

```typescript
// src/config/llm.ts
import { HfInference } from "@huggingface/inference";

export const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// Model endpoints
export const MODELS = {
  swahiliLLM: "mistralai/Mistral-7B-Instruct-v0.1", // or your fine-tuned model
  textGeneration: "bigscience/bloom",
  questionAnswering: "deepset/roberta-base-squad2",
};

// Inference parameters
export const inferenceParams = {
  maxNewTokens: 100,
  temperature: 0.7,
  topP: 0.9,
  topK: 50,
  repetitionPenalty: 1.2,
};
```

### Direct Inference Example

```typescript
// src/services/llmService.ts
import { hf, MODELS, inferenceParams } from "../config/llm";

export async function generateTextWithLLM(prompt: string): Promise<string> {
  try {
    const result = await hf.textGeneration({
      model: MODELS.swahiliLLM,
      inputs: prompt,
      parameters: inferenceParams,
    });

    if (Array.isArray(result)) {
      return result[0].generated_text;
    }

    return result.generated_text || "";
  } catch (error) {
    console.error("LLM generation error:", error);
    throw error;
  }
}
```

---

## Intent Recognition

### Define Intents

```typescript
// src/utils/intents.ts
export enum UserIntent {
  SEND_MONEY = "send_money",
  CHECK_BALANCE = "check_balance",
  RECEIVE_MONEY = "receive_money",
  TRANSACTION_HISTORY = "transaction_history",
  CHANGE_PIN = "change_pin",
  HELP = "help",
  UNKNOWN = "unknown",
}

export interface IntentResult {
  intent: UserIntent;
  confidence: number;
  entities: Record<string, any>;
  rawInput: string;
}

// Training examples for each intent
export const intentExamples: Record<UserIntent, string[]> = {
  [UserIntent.SEND_MONEY]: [
    "Tuma pesa kwa Amina",
    "Nimpea 50 AFRI kwa +254712345678",
    "Tuma 1000 shillingi",
    "Alipiza pesa",
    "Ongeza salio kwenye akaunti",
  ],
  [UserIntent.CHECK_BALANCE]: [
    "Salio yangu ni nini",
    "Nirudi salio",
    "Kuangalia salio",
    "Salio lako",
    "Pesa yangu",
  ],
  [UserIntent.RECEIVE_MONEY]: [
    "Nipe pesa",
    "Akwire salio",
    "Ingiza salio",
    "Fatisha pesa",
    "Pokea pesa",
  ],
  [UserIntent.TRANSACTION_HISTORY]: [
    "Historia ya muamala",
    "Muamala ya awali",
    "Muamala yangu",
    "Taarifa za muamala",
  ],
  [UserIntent.CHANGE_PIN]: [
    "Badili nambari siri",
    "Nambari siri mpya",
    "Badilisha PIN",
  ],
  [UserIntent.HELP]: [
    "Msaada",
    "Kunusura",
    "Ni nini karibu",
    "Karibu",
  ],
};
```

### Intent Classification

```typescript
// src/services/intentClassifier.ts
import { hf } from "../config/llm";
import { UserIntent, IntentResult, intentExamples } from "../utils/intents";

export async function classifyIntent(userInput: string): Promise<IntentResult> {
  try {
    // Prepare classification prompt
    const intentDescriptions = Object.entries(intentExamples)
      .map(([intent, examples]) => `${intent}: ${examples.join(", ")}`)
      .join("\n");

    const prompt = `Classify the following Swahili text into one of these intents:
${intentDescriptions}

User input: "${userInput}"
Intent:`;

    // Call LLM
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      inputs: prompt,
      parameters: { maxNewTokens: 20 },
    });

    const generatedText = Array.isArray(response)
      ? response[0].generated_text
      : response.generated_text;

    // Parse intent from response
    const intent = parseIntent(generatedText);
    const confidence = calculateConfidence(userInput, intent);

    return {
      intent,
      confidence,
      entities: {},
      rawInput: userInput,
    };
  } catch (error) {
    console.error("Intent classification error:", error);
    return {
      intent: UserIntent.UNKNOWN,
      confidence: 0,
      entities: {},
      rawInput: userInput,
    };
  }
}

function parseIntent(text: string): UserIntent {
  const lowerText = text.toLowerCase();

  for (const intent of Object.values(UserIntent)) {
    if (lowerText.includes(intent)) {
      return intent;
    }
  }

  return UserIntent.UNKNOWN;
}

function calculateConfidence(
  userInput: string,
  intent: UserIntent
): number {
  if (intent === UserIntent.UNKNOWN) return 0;

  // Simple confidence based on keyword matches
  const examples = intentExamples[intent as UserIntent] || [];
  const inputLower = userInput.toLowerCase();

  const matches = examples.filter((example) =>
    inputLower.includes(example.toLowerCase())
  ).length;

  return Math.min(1, (matches / examples.length) * 0.8 + 0.2);
}
```

---

## Entity Extraction

### Extract Phone Numbers, Amounts, etc.

```typescript
// src/services/entityExtractor.ts
import { hf } from "../config/llm";

export interface ExtractedEntity {
  type: "phone_number" | "amount" | "currency" | "person_name";
  value: string;
  confidence: number;
}

export async function extractEntities(
  userInput: string
): Promise<ExtractedEntity[]> {
  const entities: ExtractedEntity[] = [];

  // Extract phone numbers (pattern-based)
  const phonePattern = /\+?[\d\s\-()]{10,}/g;
  const phoneMatches = userInput.match(phonePattern);
  if (phoneMatches) {
    entities.push(
      ...phoneMatches.map((phone) => ({
        type: "phone_number" as const,
        value: phone.replace(/\D/g, ""),
        confidence: 0.95,
      }))
    );
  }

  // Extract amounts (pattern-based)
  const amountPattern = /(\d+(?:\.\d{2})?)\s*(AFRI|ETH|pesa|shillingi)?/gi;
  const amountMatches = userInput.matchAll(amountPattern);
  for (const match of amountMatches) {
    entities.push({
      type: "amount",
      value: match[1],
      confidence: 0.9,
    });
  }

  // Extract names using NER with LLM
  const nerEntities = await extractNamesWithLLM(userInput);
  entities.push(...nerEntities);

  return entities;
}

async function extractNamesWithLLM(text: string): Promise<ExtractedEntity[]> {
  try {
    const prompt = `Extract person names from this Swahili text:
"${text}"

Format as: name1, name2, ...
Names:`;

    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      inputs: prompt,
      parameters: { maxNewTokens: 50 },
    });

    const names = (Array.isArray(response) ? response[0].generated_text : response.generated_text)
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    return names.map((name) => ({
      type: "person_name" as const,
      value: name,
      confidence: 0.7,
    }));
  } catch (error) {
    console.error("NER extraction error:", error);
    return [];
  }
}
```

### Action Mapping from Intent + Entities

```typescript
// src/services/actionMapper.ts
import { UserIntent, IntentResult } from "../utils/intents";
import { classifyIntent } from "./intentClassifier";
import { extractEntities } from "./entityExtractor";

export interface UserAction {
  type: string;
  params: Record<string, any>;
}

export async function mapToAction(userInput: string): Promise<UserAction> {
  // Get intent
  const intentResult = await classifyIntent(userInput);

  // Extract entities
  const entities = await extractEntities(userInput);

  // Map to action
  switch (intentResult.intent) {
    case UserIntent.SEND_MONEY: {
      const phoneEntity = entities.find((e) => e.type === "phone_number");
      const amountEntity = entities.find((e) => e.type === "amount");

      return {
        type: "SEND_MONEY",
        params: {
          recipientPhone: phoneEntity?.value,
          amount: amountEntity?.value,
          confidence: intentResult.confidence,
        },
      };
    }

    case UserIntent.CHECK_BALANCE:
      return {
        type: "CHECK_BALANCE",
        params: { confidence: intentResult.confidence },
      };

    case UserIntent.RECEIVE_MONEY:
      return {
        type: "SHOW_RECEIVE",
        params: { confidence: intentResult.confidence },
      };

    case UserIntent.TRANSACTION_HISTORY:
      return {
        type: "SHOW_HISTORY",
        params: { confidence: intentResult.confidence },
      };

    case UserIntent.HELP:
      return {
        type: "SHOW_HELP",
        params: {},
      };

    default:
      return {
        type: "UNKNOWN",
        params: { rawInput: userInput },
      };
  }
}
```

---

## Testing & Evaluation

### Test Dataset

```typescript
// test/data/swahiliTestCases.ts
export const testCases = [
  {
    input: "Tuma 50 AFRI kwa Amina huko Kenya",
    expectedIntent: "send_money",
    expectedEntities: {
      amount: "50",
      recipientName: "Amina",
      destination: "Kenya",
    },
  },
  {
    input: "Salio yangu ni nini leo",
    expectedIntent: "check_balance",
    expectedEntities: {},
  },
  {
    input: "Nimpea pesa kwa +254712345678",
    expectedIntent: "send_money",
    expectedEntities: {
      phone: "+254712345678",
    },
  },
  {
    input: "Historia ya muamala yangu",
    expectedIntent: "transaction_history",
    expectedEntities: {},
  },
];
```

### Evaluation Metrics

```typescript
// test/llm.evaluation.ts
import { classifyIntent } from "../src/services/intentClassifier";
import { testCases } from "./data/swahiliTestCases";

async function evaluateIntentClassification(): Promise<void> {
  let correctCount = 0;
  let totalCount = testCases.length;

  for (const testCase of testCases) {
    const result = await classifyIntent(testCase.input);

    if (result.intent === testCase.expectedIntent && result.confidence > 0.7) {
      correctCount++;
    } else {
      console.warn(
        `Failed: ${testCase.input} -> Expected: ${testCase.expectedIntent}, Got: ${result.intent}`
      );
    }
  }

  const accuracy = (correctCount / totalCount) * 100;
  console.log(`Accuracy: ${accuracy.toFixed(2)}% (${correctCount}/${totalCount})`);

  // Success criteria: >85% accuracy
  if (accuracy >= 85) {
    console.log("✓ LLM accuracy meets requirements");
  } else {
    console.warn("⚠ LLM accuracy below target (85%)");
  }
}

evaluateIntentClassification();
```

### Unit Tests

```typescript
// test/services/intentClassifier.test.ts
import { describe, it, expect } from "vitest";
import { classifyIntent } from "../../src/services/intentClassifier";
import { UserIntent } from "../../src/utils/intents";

describe("Intent Classifier", () => {
  it("should classify send_money intent", async () => {
    const result = await classifyIntent("Tuma pesa kwa Amina");
    expect(result.intent).toBe(UserIntent.SEND_MONEY);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should classify check_balance intent", async () => {
    const result = await classifyIntent("Salio yangu");
    expect(result.intent).toBe(UserIntent.CHECK_BALANCE);
  });

  it("should return UNKNOWN for unrecognized intent", async () => {
    const result = await classifyIntent("Tungo jinga mwendo");
    expect(result.intent).toBe(UserIntent.UNKNOWN);
  });
});
```

---

## Fine-tuning Strategy

### Dataset Preparation

```python
# prepare_dataset.py
import json

training_data = []

# Collect Swahili examples
swahili_examples = [
    ("Tuma 50 kwa Juma", "send_money"),
    ("Salio lako", "check_balance"),
    # ... more examples
]

for text, intent in swahili_examples:
    training_data.append({
        "prompt": f"Intent: {text}\nClassify:",
        "completion": f" {intent}"
    })

# Save as JSONL
with open("training_data.jsonl", "w") as f:
    for item in training_data:
        f.write(json.dumps(item) + "\n")
```

### OpenAI Fine-tuning (Alternative)

```bash
# Upload training data
openai api fine_tunes.create \
  -t training_data.jsonl \
  -m gpt-3.5-turbo

# Use fine-tuned model
openai.ChatCompletion.create(
    model="ft:gpt-3.5-turbo-2023-10-19:...",
    messages=[{"role": "user", "content": "Tuma pesa"}]
)
```

---

## Best Practices

1. **Start Simple:** Use pattern matching before LLM inference
2. **Cache Results:** Cache intent predictions for common phrases
3. **Fallback:** Always have a fallback to simpler UX
4. **Privacy:** Don't send sensitive data to external LLM APIs
5. **Cost:** Monitor API usage to avoid unexpected costs
6. **Latency:** Target <2s response time including TTS
7. **Error Handling:** Gracefully handle LLM failures

---

## Next Steps

1. ✅ Choose LLM provider
2. ✅ Implement intent classification
3. ✅ Extract entities from user input
4. ✅ Test accuracy >85%
5. Move to [Voice Integration Guide](./10-voice-integration.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
