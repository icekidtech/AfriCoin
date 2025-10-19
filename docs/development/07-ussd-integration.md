# USSD Integration Guide

**Related Milestone:** [Milestone 2: Core Features & PWA](../milestones/MILESTONES.md#milestone-2-core-features--pwa)

## Overview

This document provides a comprehensive guide for integrating USSD (Unstructured Supplementary Service Data) support for feature phone users without internet access.

## Table of Contents

1. [USSD Overview](#ussd-overview)
2. [Africa's Talking Setup](#africas-talking-setup)
3. [USSD Flow Implementation](#ussd-flow-implementation)
4. [Backend Integration](#backend-integration)
5. [Testing](#testing)

---

## USSD Overview

### Why USSD?

- **Accessibility:** Works on any phone (feature or smartphone)
- **No Internet:** Operates on cellular networks only
- **Low Bandwidth:** Text-based, minimal data usage
- **Ubiquitous:** Available in 200+ countries
- **African Adoption:** High penetration in African markets

### USSD Dial Codes for AfriCoin

```
*888# - Main AfriCoin menu
```

### Common USSD Actions

1. **Check Balance:** Send "1" → Display balance
2. **Send Money:** Send "2" → Input recipient → Input amount → Confirm
3. **Receive Money:** Send "3" → Display phone number and QR code info
4. **Transaction History:** Send "4" → Show recent transactions
5. **Withdraw Cash:** Send "5" → Find partner merchant
6. **Settings:** Send "6" → Change PIN, language preferences

---

## Africa's Talking Setup

### Installation

```bash
cd apps/backend

npm install africastalking
```

### Configuration

```typescript
// src/config/africasTalking.ts
import AfricasTalking from "africastalking";

const africasTalking = AfricasTalking({
  apiKey: process.env.AFRICAS_TALKING_API_KEY || "",
  username: process.env.AFRICAS_TALKING_USERNAME || "",
});

export const ussd = africasTalking.USSD;
export const sms = africasTalking.SMS;
```

### Test Credentials

For development, use Africa's Talking sandbox:

```bash
# .env.development
AFRICAS_TALKING_API_KEY=atsk_sandbox_xxxxxxxxxxxx
AFRICAS_TALKING_USERNAME=sandbox
```

---

## USSD Flow Implementation

### 1. Main Menu Flow

```
Dial *888#
   ↓
Show Main Menu:
1. Check Balance
2. Send Money
3. Receive Money
4. Transaction History
5. Withdraw Cash
6. Settings

User selects option
   ↓
Process based on selection
```

### 2. Send Money Flow

```
User selects: 2 (Send Money)
   ↓
Enter recipient phone number
   ↓
Enter amount (in local currency)
   ↓
Review transaction details
   ↓
Enter PIN to confirm
   ↓
Process transaction on blockchain
   ↓
Show confirmation message
```

### 3. State Machine Implementation

```typescript
// src/utils/ussdStateMachine.ts
export enum USSDState {
  MAIN_MENU = "main_menu",
  SEND_MENU = "send_menu",
  SEND_PHONE = "send_phone",
  SEND_AMOUNT = "send_amount",
  SEND_PIN = "send_pin",
  SEND_CONFIRM = "send_confirm",
  BALANCE_CHECK = "balance_check",
  HISTORY_VIEW = "history_view",
  SETTINGS = "settings",
}

interface USSDSession {
  phoneNumber: string;
  state: USSDState;
  data: {
    recipientPhone?: string;
    amount?: number;
    pin?: string;
    userPhoneHash?: string;
  };
  createdAt: Date;
}

// Session storage (in-memory for MVP, use Redis for production)
const sessions = new Map<string, USSDSession>();

export function getOrCreateSession(phoneNumber: string): USSDSession {
  let session = sessions.get(phoneNumber);

  if (!session) {
    session = {
      phoneNumber,
      state: USSDState.MAIN_MENU,
      data: {},
      createdAt: new Date(),
    };
    sessions.set(phoneNumber, session);
  }

  return session;
}

export function updateSession(phoneNumber: string, updates: Partial<USSDSession>) {
  const session = sessions.get(phoneNumber);
  if (session) {
    Object.assign(session, updates);
  }
}

export function clearSession(phoneNumber: string) {
  sessions.delete(phoneNumber);
}
```

---

## Backend Integration

### 1. USSD Callback Handler

```typescript
// src/routes/ussdRoutes.ts
import express, { Request, Response } from "express";
import { handleUSSDCallback } from "../controllers/ussdController";

const router = express.Router();

router.post("/callback", handleUSSDCallback);

export default router;
```

### 2. USSD Controller

```typescript
// src/controllers/ussdController.ts
import { Request, Response } from "express";
import { getOrCreateSession, updateSession, clearSession } from "../utils/ussdStateMachine";
import { hashPhone } from "../utils/phoneHash";
import { User } from "../models/User";
import { Transfer } from "../models/Transfer";

export const handleUSSDCallback = async (req: Request, res: Response) => {
  try {
    const { sessionId, phoneNumber, text, serviceCode } = req.body;

    // Get or create session
    const session = getOrCreateSession(phoneNumber);

    let response: string;

    // Route based on current state and user input
    switch (session.state) {
      case "main_menu":
        response = handleMainMenu(text, session);
        break;
      case "send_phone":
        response = await handleSendPhone(text, session);
        break;
      case "send_amount":
        response = await handleSendAmount(text, session);
        break;
      case "send_pin":
        response = await handleSendPin(text, session, phoneNumber);
        break;
      case "balance_check":
        response = await handleBalanceCheck(phoneNumber);
        break;
      case "history_view":
        response = await handleHistoryView(phoneNumber);
        break;
      default:
        response = handleMainMenu("", session);
    }

    // Send USSD response
    res.set("Content-Type", "text/plain");
    res.end(response);
  } catch (error) {
    console.error("USSD callback error:", error);
    res.set("Content-Type", "text/plain");
    res.end("END An error occurred. Please try again later.");
  }
};

function handleMainMenu(userInput: string, session: any): string {
  const choice = userInput.trim();

  switch (choice) {
    case "1":
      session.state = "balance_check";
      updateSession(session.phoneNumber, session);
      return "CON Checking balance...\n";

    case "2":
      session.state = "send_phone";
      updateSession(session.phoneNumber, session);
      return "CON Enter recipient phone number:\n";

    case "3":
      return `END Your phone: ${session.phoneNumber}\nShare with sender to receive money.`;

    case "4":
      session.state = "history_view";
      updateSession(session.phoneNumber, session);
      return "CON Loading transaction history...\n";

    case "5":
      return "END Find AfriCoin partner merchants near you.";

    case "6":
      session.state = "settings";
      return "CON 1. Change PIN\n2. Change Language\n3. Back";

    case "0":
      clearSession(session.phoneNumber);
      return "END Thank you for using AfriCoin.";

    default:
      return `CON Welcome to AfriCoin\n1. Check Balance\n2. Send Money\n3. Receive Money\n4. History\n5. Withdraw\n6. Settings\n0. Exit`;
  }
}

async function handleSendPhone(userInput: string, session: any): Promise<string> {
  const phone = userInput.trim();

  if (!phone.startsWith("+") || phone.length < 10) {
    return "CON Please enter valid phone number (+country code):\n";
  }

  session.data.recipientPhone = phone;
  session.state = "send_amount";
  updateSession(session.phoneNumber, session);

  return "CON Enter amount (in local currency):\n";
}

async function handleSendAmount(userInput: string, session: any): Promise<string> {
  const amount = parseFloat(userInput.trim());

  if (isNaN(amount) || amount <= 0) {
    return "CON Please enter valid amount:\n";
  }

  session.data.amount = amount;
  session.state = "send_pin";
  updateSession(session.phoneNumber, session);

  return `CON You are sending ${amount} to ${session.data.recipientPhone}\nEnter your 4-digit PIN:\n`;
}

async function handleSendPin(
  userInput: string,
  session: any,
  senderPhone: string
): Promise<string> {
  const pin = userInput.trim();

  if (pin.length !== 4) {
    return "CON Invalid PIN. Please enter 4-digit PIN:\n";
  }

  try {
    // Verify PIN and process transaction
    const phoneHash = hashPhone(senderPhone);
    const user = await User.findOne({ phoneHash });

    if (!user) {
      return "END User not found. Please use *888# again.";
    }

    // Create transfer transaction
    const transfer = await Transfer.create({
      fromPhoneHash: phoneHash,
      recipientPhone: session.data.recipientPhone,
      amount: session.data.amount,
      pin,
      status: "pending",
    });

    // Clear session
    clearSession(session.phoneNumber);

    return `END Transaction submitted.\nReference: ${transfer._id}\nCheck status via PWA.`;
  } catch (error) {
    console.error("Transaction error:", error);
    clearSession(session.phoneNumber);
    return "END Transaction failed. Please try again later.";
  }
}

async function handleBalanceCheck(phoneNumber: string): Promise<string> {
  try {
    const phoneHash = hashPhone(phoneNumber);
    const user = await User.findOne({ phoneHash });

    if (!user) {
      return "END User not found. Please register via PWA.";
    }

    const balance = user.balance;
    return `END Your balance: ${balance} AFRI`;
  } catch (error) {
    return "END Unable to check balance. Please try again.";
  }
}

async function handleHistoryView(phoneNumber: string): Promise<string> {
  try {
    const phoneHash = hashPhone(phoneNumber);
    const transactions = await Transfer.find({ fromPhoneHash: phoneHash })
      .limit(3)
      .sort({ createdAt: -1 });

    let response = "END Recent transactions:\n";
    transactions.forEach((tx, index) => {
      response += `${index + 1}. ${tx.amount} to ${tx.recipientPhone} (${tx.status})\n`;
    });

    return response;
  } catch (error) {
    return "END Unable to load history. Please try again.";
  }
}
```

### 3. SMS Notifications

```typescript
// src/services/smsService.ts
import { sms } from "../config/africasTalking";

export async function sendTransactionSMS(
  phoneNumber: string,
  type: "sent" | "received",
  amount: string,
  counterparty: string
): Promise<void> {
  try {
    const message =
      type === "sent"
        ? `AfriCoin: You sent ${amount} AFRI to ${counterparty}. Balance: Check via *888#`
        : `AfriCoin: You received ${amount} AFRI from ${counterparty}. Balance: Check via *888#`;

    await sms.send({
      recipients: [phoneNumber],
      message,
    });
  } catch (error) {
    console.error("SMS sending failed:", error);
  }
}
```

---

## Testing

### Local Testing with Africa's Talking Sandbox

```bash
# Start backend server
npm run dev

# Test USSD flow with curl
curl -X POST http://localhost:3000/api/ussd/callback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "phoneNumber": "+254712345678",
    "text": "",
    "serviceCode": "*888#"
  }'
```

### Test Scenarios

1. **Check Balance:**
   ```
   Input: 1
   Expected: Balance display
   ```

2. **Send Money:**
   ```
   Input: 2
   Input: +234701234567
   Input: 100
   Input: 1234
   Expected: Transaction submitted message
   ```

3. **View History:**
   ```
   Input: 4
   Expected: Recent transactions list
   ```

### Integration Testing

```typescript
// test/ussd.test.ts
import { handleUSSDCallback } from "../src/controllers/ussdController";

describe("USSD Integration", () => {
  it("should show main menu on initial call", async () => {
    const response = await handleUSSDCallback({
      body: {
        sessionId: "test",
        phoneNumber: "+254712345678",
        text: "",
        serviceCode: "*888#",
      },
    });

    expect(response).toContain("1. Check Balance");
  });

  it("should process send money flow", async () => {
    // Test full send money flow
    // 1. Start
    // 2. Enter recipient
    // 3. Enter amount
    // 4. Enter PIN
    // 5. Verify transaction created
  });
});
```

---

## Best Practices

1. **Session Timeout:** Expire sessions after 5 minutes
2. **Rate Limiting:** Limit USSD requests per number
3. **Security:** Always verify PIN before transactions
4. **User Feedback:** Clear, concise messages for USSD
5. **Error Recovery:** Graceful handling of invalid inputs
6. **Logging:** Log all USSD interactions for debugging

---

## Deployment

### Africa's Talking Production Setup

1. Create account at https://africastalking.com
2. Setup production API key
3. Register USSD shortcode (*888# or similar)
4. Configure webhook URL in dashboard
5. Test thoroughly before going live

### Production Configuration

```bash
# .env.production
AFRICAS_TALKING_API_KEY=atsk_live_xxxxxxxxxxxxx
AFRICAS_TALKING_USERNAME=africoin_prod
AFRICAS_TALKING_SHORTCODE=888
```

---

## Next Steps

1. ✅ Setup Africa's Talking account
2. ✅ Implement USSD state machine
3. ✅ Create USSD callback handler
4. ✅ Test local USSD flows
5. Move to [Internationalization Setup](./08-i18n-setup.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
