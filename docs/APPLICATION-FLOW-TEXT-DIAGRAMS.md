# AfriCoin Application Flow Diagrams (Markdown Standard)

This document contains text-based flowchart diagrams using standard Markdown formatting (no Mermaid required).

---

## 1. Backend Application Flow (Markdown Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND REQUEST HANDLING                            │
└─────────────────────────────────────────────────────────────────────────────┘

USER REQUEST ARRIVES
        │
        ├─ REST API (POST /auth/register)
        ├─ USSD Callback (POST /ussd/callback)
        └─ Webhook (POST /deposits/webhook or /kyc/webhook)
        │
        ▼
┌─────────────────────────────────┐
│   Middleware Processing         │
├─────────────────────────────────┤
│ • Rate Limiting (100 req/min)   │
│ • CORS Validation               │
│ • Request Validation            │
│ • Error Handler                 │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│   Route to Controller           │
├─────────────────────────────────┤
│ • AuthController                │
│ • WalletController              │
│ • TransferController            │
│ • DepositController             │
│ • KYCController                 │
│ • USSDController                │
│ • VoiceController               │
└─────────────────────────────────┘
        │
        ▼
        ├─────────────────────────────────────────────────┐
        │                                                 │
        ▼                                                 ▼
   AUTH FLOW                                      TRANSFER FLOW
   ┌──────────────────────────┐                  ┌──────────────────────────┐
   │ 1. Validate Input        │                  │ 1. Get User from DB      │
   │    • Phone               │                  │    • Check KYC Tier      │
   │    • Name                │                  │                          │
   │    • PIN                 │                  │ 2. Check Limits          │
   │                          │                  │    • Tier 0: $50/tx      │
   │ 2. Create Wallet         │                  │    • Tier 1: $500/tx     │
   │    • Generate address    │                  │    • Tier 2: $5000/tx    │
   │    • Store in DB         │                  │                          │
   │                          │                  │ 3. Validate Amount       │
   │ 3. Hash PIN              │                  │    if amount > limit     │
   │    • bcryptjs (12 rounds)│                  │    → Return Error        │
   │                          │                  │                          │
   │ 4. Create JWT            │                  │ 4. Verify PIN            │
   │    • Token valid 24h     │                  │    • Compare with hash   │
   │                          │                  │                          │
   │ 5. Assign Tier 0         │                  │ 5. Get Recipient Address │
   │    • Limits: $50/tx      │                  │    • Query by phone hash │
   │    • Daily: $200         │                  │                          │
   │    • Monthly: $1000      │                  │ 6. Call Smart Contract   │
   │                          │                  │    • transfer()          │
   │ 6. Save to DB            │                  │    • Pass sender/recip   │
   │    • Return Token        │                  │                          │
   │    • Return Address      │                  │ 7. Wait for TX Hash      │
   │                          │                  │                          │
   │ ✅ SUCCESS               │                  │ 8. Record in Ledger      │
   │    Return JWT + Wallet   │                  │    • Transaction record  │
   │                          │                  │    • Update daily/monthly│
   │                          │                  │    • limits used         │
   │                          │                  │                          │
   │                          │                  │ 9. Send Notification     │
   │                          │                  │    • SMS to both parties │
   │                          │                  │                          │
   │                          │                  │ ✅ SUCCESS               │
   │                          │                  │    Return receipt        │
   └──────────────────────────┘                  └──────────────────────────┘

        │                                              │
        │                                              │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
                      DEPOSIT FLOW
                   ┌──────────────────────────┐
                   │ 1. Validate Amount       │
                   │    • Check Tier Limit    │
                   │      Tier 0: $100/day    │
                   │      Tier 1: $1000/day   │
                   │      Tier 2: unlimited   │
                   │                          │
                   │ 2. Create Deposit Record │
                   │    • Store in DB         │
                   │    • Status: pending     │
                   │                          │
                   │ 3. Generate Payment Link │
                   │    • Call Etegram API    │
                   │    • Return link to user │
                   │                          │
                   │ ⏳ WAITING FOR PAYMENT   │
                   │                          │
                   │ 4. Receive Webhook       │
                   │    • Etegram → POST     │
                   │      /deposits/webhook  │
                   │    • Validate HMAC sig  │
                   │                          │
                   │ 5. If Valid:             │
                   │    • Call mint()         │
                   │    • Create AFRI tokens  │
                   │    • Update balance      │
                   │    • Status: completed   │
                   │                          │
                   │ 6. Send SMS              │
                   │    • "+100 AFRI received"│
                   │                          │
                   │ ✅ SUCCESS               │
                   │    Deposit complete      │
                   │                          │
                   │ ❌ FAILED PAYMENT        │
                   │    Return error message  │
                   │    Status: failed        │
                   └──────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   KYC FLOW             USSD FLOW              VOICE FLOW
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ 1. Initiate      │   │ 1. Parse Menu    │   │ 1. Get Voice     │
│    • Call Trulioo│   │    • User input  │   │    Text input    │
│    • Get link    │   │                  │   │ (from STT)       │
│                  │   │ 2. Get Session   │   │                  │
│ 2. User Verifies │   │    • Track state │   │ 2. Call HF API   │
│    • Email       │   │                  │   │    Intent parser │
│    • Selfie      │   │ 3. Route to      │   │                  │
│    • Liveness    │   │    Action        │   │ 3. Extract       │
│                  │   │    • Register    │   │    Intent        │
│ ⏳ WAITING       │   │    • Balance     │   │    • Action      │
│    2-5 min       │   │    • Send        │   │    • Amount      │
│                  │   │    • Deposit     │   │    • Recipient   │
│ 3. Trulioo       │   │                  │   │                  │
│    Webhook       │   │ 4. Execute       │   │ 4. Validate      │
│    kyc_verified  │   │    Logic         │   │    Intent        │
│                  │   │    • Same as web │   │                  │
│ 4. Update User   │   │      flows       │   │ 5. Execute       │
│    • tier = 1    │   │                  │   │    Action        │
│    • status      │   │ 5. Return USSD   │   │                  │
│      verified    │   │    Response      │   │ 6. Return Result │
│    • Limits:     │   │    • Formatted   │   │    • Text-to-   │
│      $500/tx     │   │      text        │   │      speech      │
│      $2000/day   │   │    • Menu option │   │                  │
│      $10k/month  │   │                  │   │ ✅ SUCCESS       │
│                  │   │ ✅ SUCCESS       │   │    Command exec  │
│ 5. Send SMS      │   │    USSD sent     │   │                  │
│    "Tier 1       │   │                  │   │                  │
│    unlocked!"    │   └──────────────────┘   └──────────────────┘
│                  │
│ ✅ SUCCESS       │
│    KYC complete  │
│                  │
│ ❌ REJECTED      │
│    Show reason   │
└──────────────────┘

        │
        ▼
┌─────────────────────────────┐
│   Logging & Monitoring      │
├─────────────────────────────┤
│ • Log to Sentry (errors)    │
│ • Log to CloudWatch (all)   │
│ • Update metrics            │
│ • Send alerts if needed     │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   Send HTTP Response        │
├─────────────────────────────┤
│ • 200 OK (success)          │
│ • 400 Bad Request           │
│ • 401 Unauthorized          │
│ • 429 Too Many Requests     │
│ • 500 Server Error          │
└─────────────────────────────┘
        │
        ▼
USER RECEIVES RESPONSE
```

---

## 2. Frontend Application Flow (Markdown Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────────────────┘

START: USER VISITS africoin.app
        │
        ▼
┌─────────────────────────────┐
│   Check Authentication      │
├─────────────────────────────┤
│ • Token in localStorage?    │
│ • Token still valid?        │
└─────────────────────────────┘
        │
        ├─── YES ──────────────────────────────┐
        │                                      │
        └─── NO ───────────────────────────────┤
                                               │
        ┌──────────────────────────────────────┴──────────┐
        │                                                 │
        ▼                                                 ▼
   LOGGED IN                                        NOT LOGGED IN
   ┌──────────────┐                                ┌──────────────────┐
   │  Dashboard   │                                │ New or Existing? │
   │   Page       │                                └──────────────────┘
   └──────────────┘                                        │
                                                    ┌──────┴──────┐
                                                    │             │
                                                    ▼             ▼
                                                NEW USER      EXISTING USER
                                              ┌──────────┐    ┌──────────┐
                                              │ SIGNUP   │    │ LOGIN    │
                                              │ FLOW     │    │ FLOW     │
                                              └──────────┘    └──────────┘

SIGNUP FLOW                                  LOGIN FLOW
┌────────────────────────────────┐         ┌────────────────────────────────┐
│ 1. SIGNUP PAGE                 │         │ 1. LOGIN PAGE                  │
│    Input Fields:               │         │    Input Fields:               │
│    ├─ Phone Number             │         │    ├─ Phone Number             │
│    ├─ Full Name                │         │    └─ 4-digit PIN              │
│    └─ 4-digit PIN              │         │                                │
│                                │         │ 2. VALIDATION                  │
│ 2. CLIENT VALIDATION           │         │    ├─ Phone format?            │
│    ├─ Phone format valid?      │         │    └─ PIN length?              │
│    ├─ Name not empty?          │         │                                │
│    └─ PIN is 4 digits?         │         │ 3. CALL /auth/login            │
│                                │         │    ├─ Send phone + PIN         │
│ 3. CALL /auth/register         │         │    └─ Wait for response        │
│    ├─ Send phone + name + PIN  │         │                                │
│    └─ Wait for response        │         │ 4. CHECK RESPONSE              │
│                                │         │    ├─ Success?                 │
│ 4. CHECK RESPONSE              │         │    │  ├─ Save JWT token        │
│    ├─ Success?                 │         │    │  ├─ Redirect to Dashboard  │
│    │  ├─ Save JWT token        │         │    │  └─ Load user data         │
│    │  ├─ Save wallet address   │         │    │                            │
│    │  ├─ Set tier = 0          │         │    └─ Error?                   │
│    │  ├─ Set limits:           │         │       ├─ Invalid PIN           │
│    │  │  $50/tx, $200/day,     │         │       └─ Show error message    │
│    │  │  $1000/month           │         │          Try again             │
│    │  └─ Proceed to KYC popup  │         └────────────────────────────────┘
│    │                            │
│    └─ Error?                   │
│       ├─ Phone exists          │                      │
│       └─ Show error, retry     │                      │
│                                │                      │
│ 5. KYC POPUP (POST-SIGNUP)     │                      │
│                                │                      │
│    ┌──────────────────────────┐│                      │
│    │ 📋 VERIFY ID?            ││                      │
│    │                          ││                      │
│    │ "Unlock higher limits"   ││                      │
│    │                          ││                      │
│    │ [Dismiss] [Verify Now]   ││                      │
│    └──────────────────────────┘│                      │
│    │                           │                      │
│    ├─── DISMISS ──────────────────────┐              │
│    │    Continue with Tier 0           │              │
│    │                                   │              │
│    └─── VERIFY NOW ────────────────────┤              │
│         Redirect to Trulioo popup      │              │
│         ├─ Email verification         │              │
│         ├─ Selfie capture             │              │
│         └─ Liveness check             │              │
│         Status: In Progress            │              │
│         Wait 2-5 minutes               │              │
│         ├─ Approved?                   │              │
│         │  └─ tier = 1                 │              │
│         │     limits: $500/tx          │              │
│         │     $2000/day                │              │
│         │     $10k/month               │              │
│         │     ✅ Success message       │              │
│         │                              │              │
│         └─ Rejected?                   │              │
│            └─ Show reason              │              │
│               Retry allowed            │              │
│                                        │              │
└────────────────────────────────────────┴──────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  DASHBOARD PAGE      │
                    ├──────────────────────┤
                    │ Display:             │
                    │ ├─ Balance (AFRI)    │
                    │ ├─ KYC Tier          │
                    │ ├─ Current Limits    │
                    │ ├─ Recent Txns       │
                    │ └─ Menu Options      │
                    └──────────────────────┘
                               │
                ┌──────────────┼──────────────┬──────────────┬──────────────┐
                │              │              │              │              │
                ▼              ▼              ▼              ▼              ▼
          SEND MONEY      DEPOSIT        VERIFY ID     SETTINGS        USSD/VOICE
          ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐   ┌──────────┐
          │ 1. Form  │   │ 1. Form  │   │ 1. Form  │  │ 1. View  │   │ 1. Dial  │
          │    Input │   │    Input │   │    Input │  │    Tier  │   │    *888# │
          │  ├─ Recip│   │  ├─ Curr │   │  ├─ Type │  │ 2. View  │   │ OR       │
          │  │ phone │   │  │ ency   │   │  │ (ID)  │  │    Limits│   │ 2. Record│
          │  ├─ Amnt │   │  ├─ Amnt │   │  ├─ Image│  │ 3. View  │   │    voice │
          │  └─ PIN  │   │  └─ PIN  │   │  └─ Doc  │  │    Txns  │   │ 3. Exec  │
          │          │   │          │   │          │  │ 4. Change│   │    action│
          │ 2. Check │   │ 2. Check │   │ 2. Call  │  │    PIN   │   │          │
          │    Limit │   │    Limit │   │    /kyc  │  │          │   │ ✅ Done  │
          │ ├─ Amount   │ ├─ Amount   │   │    /init│  │ ✅ Done  │   └──────────┘
          │ │   > Tier? │ │   > Tier? │   │          │  │          │
          │ │ $50/tx    │ │ $100/day  │   │ 3. Wait │  │          │
          │ │ $200/day  │ │ $500/mth  │   │    for  │  │          │
          │ │ $1k/mth   │ │          │   │    Truli│  │          │
          │ │           │ │ 3. Call  │   │    oo   │  │          │
          │ │ ✗ Exceed? │ │    /deposi│   │         │  │          │
          │ │ ├─ Show   │ │    /init │   │ 4. Popup│  │          │
          │ │ │  upgrade│ │    (amt) │   │    resu│  │          │
          │ │ │  prompt │ │         │   │    lt  │  │          │
          │ │ │ ✓ OK    │ │ 4. Redir│   │ ├─ Appro│  │          │
          │ │ │         │ │    to   │   │ │ ved   │  │          │
          │ │ └─ Within?│ │    Etegs│   │ │ tier=1│  │          │
          │ │   ✓ OK    │ │    ram  │   │ │       │  │          │
          │ │           │ │    Pay  │   │ ├─ Rejec│  │          │
          │ │ 3. Call   │ │    Page │   │ │ ted   │  │          │
          │ │    /trans │ │    (via │   │ │ retry │  │          │
          │ │    fer/   │ │    Mopa │   │ │       │  │          │
          │ │    send   │ │    sa/  │   │ └─ In P │  │          │
          │ │    (recip,│   │    Bank)   │    rogr│  │          │
          │ │    amnt,  │   │         │   │    ess │  │          │
          │ │    pin)   │   │ 5. User│   │         │  │          │
          │ │           │   │    Pays│   │ 5. SMS  │  │          │
          │ │ 4. Wait   │   │    Real│   │    notif│  │          │
          │ │    for    │   │    $$$ │   │    ictn│  │          │
          │ │    Resp   │   │         │   │         │  │          │
          │ │           │   │ 6. Poll│   │ ✅ Done │  │          │
          │ │ 5. Success│   │    for │   │         │  │          │
          │ │    ├─ Recip│   │    Conf│   │         │  │          │
          │ │    │ phone │   │    irm │   │         │  │          │
          │ │    ├─ Amnt │   │    2-5 │   │         │  │          │
          │ │    ├─ TxID │   │    min │   │         │  │          │
          │ │    └─ SMS  │   │         │   │         │  │          │
          │ │            │   │ 7. Conf│   │         │  │          │
          │ │ ✅ Back to │   │    irmed│   │         │  │          │
          │ │    Dashbrd │   │    ├─ +X  │         │  │          │
          │ │            │   │    │ AFRI│         │  │          │
          │ │ ✗ Error    │   │    ├─ SMS │         │  │          │
          │ │ ├─ Insuff  │   │    └─ Back│         │  │          │
          │ │ │ Balance  │   │    Dashbo│         │  │          │
          │ │ ├─ Invalid │   │    ard    │         │  │          │
          │ │ │ Recip    │   │           │         │  │          │
          │ │ └─ Retry   │   │ ✅ Success│         │  │          │
          │ │            │   │           │         │  │          │
          │ └──────────┘   │ ✗ Error    │         │  │          │
          └──────────┘     │ ├─ Timeout │         │  │          │
                           │ ├─ Rejected│         │  │          │
                           │ └─ Retry   │         │  │          │
                           └──────────┘         │  │          │
                                               │  │          │
                                               ▼  ▼          ▼
                                          BACK TO DASHBOARD
```

---

## 3. Smart Contract Application Flow (Markdown Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SMART CONTRACT EXECUTION FLOW                          │
│                              (Base Sepolia)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

BLOCKCHAIN FUNCTION CALL
        │
        ▼
┌─────────────────────────────────┐
│   Which Function?               │
├─────────────────────────────────┤
│ • mint(to, amount)              │
│ • burn(amount)                  │
│ • transfer(to, amount)          │
│ • balanceOf(account)            │
│ • totalSupply()                 │
│ • getFXRate(pair)               │
└─────────────────────────────────┘
        │
        ├─────────────────────────────────────────────┐
        │                                             │
        ▼                                             ▼
    WRITE FUNCTION                               READ FUNCTION
    (State Change)                                (No state change)
    ┌────────────────┐                          ┌────────────────┐
    │ • mint()       │                          │ • balanceOf()  │
    │ • burn()       │                          │ • totalSupply()│
    │ • transfer()   │                          │ • getFXRate()  │
    └────────────────┘                          └────────────────┘
        │                                             │
        ▼                                             ▼
   REQUIRES GAS                                  NO GAS NEEDED
   (Costs money)                                (Free read)
        │                                             │
        ▼                                             ▼
   EMIT EVENTS                                  RETURN VALUE
        │                                             │
        ▼                                             ▼
   WAIT FOR                                    INSTANT
   CONFIRMATION                                RESULT
        │                                             │
        └─────────────────────┬───────────────────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ FUNCTION FLOW      │
                    └────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
    MINT FLOW            BURN FLOW            TRANSFER FLOW
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 1. VERIFY AUTH   │  │ 1. GET BALANCE   │  │ 1. SENDER CHECK  │
│ ├─ Only backend  │  │ ├─ Caller balance│  │ ├─ Has enough?   │
│ │ address can    │  │ │ >= amount?     │  │ │ (balances[from])
│ │ call this      │  │ │                │  │ │                │
│ │ → msg.sender ==│  │ └─ No? REVERT    │  │ └─ No? REVERT    │
│ │   backendAddr  │  │                  │  │                  │
│ │                │  │ 2. DECREASE      │  │ 2. TO VALIDATION │
│ │ └─ No? REVERT  │  │    BALANCE       │  │ ├─ Valid address?│
│ │                │  │ ├─ Sub from      │  │ │ (not zero addr)│
│ │ 2. INCREASE    │  │ │   balances[msg │  │ └─ No? REVERT    │
│ │    TOTAL SUPPLY│  │ │   .sender]     │  │                  │
│ │ ├─ Add amount  │  │ │                │  │ 3. TRANSFER      │
│ │ │ to           │  │ │ 3. DECREASE    │  │    FUNDS         │
│ │ │ totalSupply  │  │ │    TOTAL       │  │ ├─ Subtract from │
│ │ │              │  │ │    SUPPLY      │  │ │   sender       │
│ │ │ totalSupply  │  │ ├─ Sub amount    │  │ │   balance[from] │
│ │ │ += amount    │  │ │ from           │  │ │   -= amount     │
│ │ │              │  │ │ totalSupply    │  │ │                │
│ │ │              │  │ │                │  │ ├─ Add to        │
│ │ └─ Result OK   │  │ │ 4. EMIT EVENT  │  │ │   recipient     │
│ │                │  │ ├─ Burn(msg.     │  │ │   balance[to]   │
│ │ 3. INCREASE    │  │ │     sender,    │  │ │   += amount     │
│ │    USER BALANCE│  │ │     amount)    │  │ │                │
│ │ ├─ Add to      │  │ │                │  │ │ 4. EMIT EVENT  │
│ │ │ user balance │  │ │ 5. RETURN      │  │ ├─ Transfer(     │
│ │ │ balances[to] │  │ │    TRUE        │  │ │   from: addr,   │
│ │ │ += amount    │  │ │                │  │ │   to: addr,     │
│ │ │              │  │ │ ✅ BURN        │  │ │   value: amount)│
│ │ │ 4. EMIT EVENT│  │ │    COMPLETE    │  │ │                │
│ │ ├─ Mint(to:    │  │ └──────────────────┘ │ │ 5. RETURN      │
│ │ │   address,   │                         │ │    TRUE        │
│ │ │   amount:    │                         │ │                │
│ │ │   uint)      │                         │ │ ✅ TRANSFER    │
│ │ │              │                         │ │    COMPLETE    │
│ │ │ 5. RETURN    │                         │ └──────────────────┘
│ │    TRUE        │                         │
│ │                │                         │
│ │ ✅ MINT        │
│ │    COMPLETE    │
│ └──────────────────┘
│
│ EVENTS EMITTED TO BLOCKCHAIN WATCHERS
│
├─────────────────────────────────────────────────┐
│                                                 │
▼                                                 ▼
EVENT: Mint                                   EVENT: Burn
├─ Indexed: to (user address)                 ├─ Indexed: from (burner)
├─ Indexed: amount (AFRI created)             ├─ Indexed: amount (AFRI burned)
└─ BlockNumber, TxHash, LogIndex              └─ BlockNumber, TxHash, LogIndex

EVENT: Transfer
├─ Indexed: from (sender)
├─ Indexed: to (recipient)
├─ Indexed: value (amount)
└─ BlockNumber, TxHash, LogIndex

        │
        ▼
┌───────────────────────────────────────┐
│  BACKEND EVENT LISTENER WATCHING      │
├───────────────────────────────────────┤
│ • Monitors blockchain for events      │
│ • Listens to Web3 provider (RPC)      │
│ • Confirms event legitimacy          │
│ • Updates database                   │
│ • Sends notifications                │
└───────────────────────────────────────┘
        │
        ├─ Mint Event Detected
        │  ├─ Extract: user address, amount
        │  ├─ Update DB: user balance
        │  ├─ Send SMS: "+X AFRI received"
        │  └─ Update metrics
        │
        ├─ Burn Event Detected
        │  ├─ Extract: user address, amount
        │  ├─ Update DB: user balance
        │  ├─ Send SMS: "-X AFRI burned"
        │  └─ Update metrics
        │
        └─ Transfer Event Detected
           ├─ Extract: from, to, amount
           ├─ Update DB: both balances
           ├─ Record ledger entry
           ├─ Send SMS: both parties
           └─ Update metrics

        ▼
┌────────────────────────────────┐
│  DATABASE RECONCILIATION       │
├────────────────────────────────┤
│ • Compare on-chain balance     │
│ • Compare off-chain balance    │
│ • Resolve discrepancies        │
│ • Log audit trail              │
│ • Alert on mismatch            │
└────────────────────────────────┘
        │
        ▼
✅ SMART CONTRACT EXECUTION COMPLETE
   • State changed on blockchain
   • Database synchronized
   • Users notified
   • Events logged
```

---

## 4. Complete Application Data Flow (Markdown Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE AFRICOIN SYSTEM DATA FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  USER INTERFACES LAYER                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📱 Web Browser (PWA)          ☎️ Feature Phone (USSD)    🎙️ Voice Commands  │
│  └─ React + Vite              └─ Africa's Talking         └─ Swahili Input   │
│  └─ Tailwind CSS              └─ Menu System              └─ Web Speech API  │
│  └─ Web3Auth integration      └─ SMS Responses           └─ Text Commands   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            REST API Calls    USSD Callbacks   Voice Endpoints
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │  API GATEWAY LAYER                                    │
        ├───────────────────────────────────────────────────────┤
        │                                                       │
        │  🔌 Express.js Server (Port 3000)                    │
        │  ├─ Request Validation                              │
        │  ├─ Rate Limiting (100 req/min)                     │
        │  ├─ CORS Handling                                   │
        │  ├─ Error Handling                                  │
        │  └─ Response Formatting                             │
        │                                                       │
        └───────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │  Auth        │  │  Transfer    │  │  Deposit     │
            │  Service     │  │  Service     │  │  Service     │
            │              │  │              │  │              │
            │  • Register  │  │  • Send      │  │  • Initiate  │
            │  • Login     │  │  • Receive   │  │  • Confirm   │
            │  • JWT       │  │  • History   │  │  • Webhook   │
            │              │  │  • Limits    │  │              │
            └──────────────┘  └──────────────┘  └──────────────┘
                    │               │               │
            ┌───────┼───────────────┼───────────────┼───────┐
            │       │               │               │       │
            ▼       ▼               ▼               ▼       ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  KYC         │  │  USSD        │  │  Voice       │
        │  Service     │  │  Service     │  │  Service     │
        │              │  │              │  │              │
        │  • Initiate  │  │  • Menu      │  │  • Parse     │
        │  • Verify    │  │  • State     │  │  • Intent    │
        │  • Trulioo   │  │  • Response  │  │  • Execute   │
        │  • Tier      │  │              │  │              │
        │  • Limits    │  │              │  │              │
        └──────────────┘  └──────────────┘  └──────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
            ┌───────────────┐  ┌────────────────┐  ┌─────────────────┐
            │  PostgreSQL   │  │  Redis Cache   │  │  Message Queue  │
            │  Database     │  │                │  │  (Bull/Redis)   │
            │               │  │ • Sessions     │  │                 │
            │ Tables:       │  │ • OTP codes    │  │ • Async jobs    │
            │ • Users       │  │ • Rate limits  │  │ • Webhooks      │
            │ • Transactions│  │ • User balance │  │ • Notifications │
            │ • KYC records │  │                │  │                 │
            │ • Ledger      │  │ TTL: 5 min     │  │                 │
            │               │  │   to 24 hours  │  │                 │
            └───────────────┘  └────────────────┘  └─────────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐  ┌─────────────────┐  ┌──────────────────┐
        │  Smart Contracts  │  │  External APIs  │  │  Monitoring      │
        │  (Base Sepolia)   │  │                 │  │                  │
        │                   │  │ • Etegram       │  │ • Sentry         │
        │  AfriCoin.sol:    │  │   (Deposits)    │  │   (Errors)       │
        │  ├─ mint()        │  │ • Trulioo       │  │ • CloudWatch     │
        │  ├─ burn()        │  │   (KYC)         │  │   (Logs)         │
        │  ├─ transfer()    │  │ • Africa's      │  │ • Prometheus     │
        │  ├─ balanceOf()   │  │   Talking       │  │   (Metrics)      │
        │  └─ Events        │  │   (USSD, SMS)   │  │ • PagerDuty      │
        │                   │  │ • Hugging Face  │  │   (Alerts)       │
        │  MockOracle.sol:  │  │   (NLU)         │  │                  │
        │  ├─ getFXRate()   │  │                 │  │                  │
        │  └─ Price feed    │  │                 │  │                  │
        │                   │  │                 │  │                  │
        └───────────────────┘  └─────────────────┘  └──────────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────────┐
                    │  DATA FLOW SUMMARY                    │
                    ├───────────────────────────────────────┤
                    │                                       │
                    │  1. User → UI (PWA/USSD/Voice)       │
                    │                                       │
                    │  2. UI → API Gateway                 │
                    │                                       │
                    │  3. API → Services (Auth/Transfer/)   │
                    │                                       │
                    │  4. Services → DB + Cache + Queue    │
                    │                                       │
                    │  5. Services → Smart Contract        │
                    │                                       │
                    │  6. Services → External APIs         │
                    │                                       │
                    │  7. Webhooks → Services              │
                    │                                       │
                    │  8. Events → Event Listener          │
                    │                                       │
                    │  9. Event Listener → DB Update       │
                    │                                       │
                    │  10. Services → User Notification    │
                    │                                       │
                    │  11. All → Monitoring Stack          │
                    │                                       │
                    └───────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │  SYSTEM STATE SYNCHRONIZED            │
                    │  ✅ All data sources match            │
                    │  ✅ User notified                     │
                    │  ✅ Events logged                     │
                    │  ✅ Metrics updated                   │
                    │  ✅ Alerts issued if needed           │
                    └───────────────────────────────────────┘
```

---

## Flow Diagram Legend

### Symbols Used

| Symbol | Meaning |
|--------|---------|
| `┌─ ─┐` | Container/Section |
| `├─` | Item/Process |
| `│` | Vertical connection |
| `─` | Horizontal connection |
| `▼` | Flow downward |
| `▲` | Flow upward |
| `◀` | Flow left |
| `▶` | Flow right |
| `✅` | Success/Complete |
| `❌` | Error/Failed |
| `⏳` | Waiting/In Progress |
| `→` | Direction indicator |
| `?` | Decision point |
| `//` | Comment/Note |

### Color Coding (For Reference)

```
🔐 Security/Auth (Blue)
💸 Transfers/Payments (Green)
💰 Deposits/Money (Orange)
📋 Compliance/KYC (Yellow)
⛓️  Blockchain (Purple)
📱 Frontend/UI (Light Blue)
🗄️  Database (Light Yellow)
⚡ Cache/Speed (Cyan)
🤖 AI/ML (Pink)
```

---

## How to Use These Diagrams

1. **For Developers:** Trace the flow of a specific operation (e.g., "How does a transfer happen?")
2. **For Architects:** Understand system components and their interactions
3. **For PMs/Stakeholders:** See the complete user journey and data movement
4. **For Debugging:** Identify where a failure might occur in the flow
5. **For Documentation:** Reference in technical specs and implementation guides

---

**Last Updated:** December 14, 2025  
**Format:** Standard Markdown with ASCII art  
**Compatibility:** All Markdown viewers (GitHub, GitLab, Notion, Confluence, etc.)
