# AfriCoin Application Flow Diagrams (Flowcharts)

This document contains Mermaid flowchart diagrams for all major application flows.

---

## 1. Backend Application Flow

```mermaid
flowchart TD
    A["🔌 User Request<br/>REST API / USSD / Webhook"] --> B{Request Type?}
    
    B -->|Authentication| C["🔐 Auth Endpoint<br/>POST /auth/register<br/>POST /auth/login"]
    C --> C1["Hash PIN<br/>Create JWT Token<br/>Create Wallet"]
    C1 --> C2["Save to DB<br/>Assign Tier 0<br/>Set limits"]
    C2 --> D["✅ Return Token<br/>& Wallet Address"]
    
    B -->|Send Transfer| E["💸 Transfer Endpoint<br/>POST /transfers/send"]
    E --> E1["Get User from DB<br/>Check KYC Tier"]
    E1 --> E2{Tier Limits OK?}
    E2 -->|No| E3["❌ Return Error<br/>Limit Exceeded<br/>Upgrade prompt"]
    E2 -->|Yes| E4["Validate PIN<br/>Check Balance"]
    E4 --> E5{Balance Sufficient?}
    E5 -->|No| E6["❌ Return Error<br/>Insufficient Funds"]
    E5 -->|Yes| E7["Call Smart Contract<br/>transfer()"]
    E7 --> E8["Save Transaction<br/>Update Limits"]
    E8 --> E9["✅ Return Success<br/>Receipt"]
    
    B -->|Deposit| F["💰 Deposit Endpoint<br/>POST /deposits/initiate"]
    F --> F1["Check Tier Limit<br/>Validate amount"]
    F1 --> F2{Amount OK?}
    F2 -->|No| F3["❌ Return Error"]
    F2 -->|Yes| F4["Create Deposit Record<br/>Generate Etegram Link"]
    F4 --> F5["✅ Return Payment Link<br/>User redirected"]
    F5 --> F6["⏳ User Pays<br/>M-Pesa/Bank/Card"]
    F6 --> F7["Etegram Webhook<br/>deposit_confirmed"]
    F7 --> F8["Validate HMAC Signature"]
    F8 --> F9{Signature Valid?}
    F9 -->|No| F10["🚫 Reject Webhook"]
    F9 -->|Yes| F11["Call Smart Contract<br/>mint()"]
    F11 --> F12["Update User Balance<br/>Record in Ledger"]
    F12 --> F13["📱 Send SMS<br/>Deposit confirmed"]
    
    B -->|KYC| G["📋 KYC Endpoint<br/>POST /kyc/initiate"]
    G --> G1["Get User<br/>Check current tier"]
    G1 --> G2["Call Trulioo API<br/>Initiate verification"]
    G2 --> G3["Return Trulioo Link<br/>User verified"]
    G3 --> G4["⏳ Waiting for<br/>Trulioo webhook"]
    G4 --> G5["Trulioo Webhook<br/>kyc_verified"]
    G5 --> G6["Validate Webhook<br/>Check riskScore"]
    G6 --> G7{Risk OK?}
    G7 -->|High Risk| G8["⚠️ Flag for review"]
    G7 -->|OK| G9["Update kyc.tier<br/>kyc.status = verified"]
    G9 --> G10["Update Limits<br/>Daily/Monthly"]
    G10 --> G11["📱 Send SMS<br/>KYC approved<br/>Limits increased"]
    
    B -->|USSD| H["☎️ USSD Endpoint<br/>POST /ussd/callback"]
    H --> H1["Parse Menu Input<br/>Get Session State"]
    H1 --> H2{Menu Selection?}
    H2 -->|Register| H3["Collect: Phone,<br/>Name, PIN"]
    H3 --> H4["Same as Auth Flow"]
    H2 -->|Balance| H5["Get User Balance<br/>From DB/Blockchain"]
    H5 --> H6["Return USSD Text<br/>Balance: X AFRI"]
    H2 -->|Send| H7["Collect: Recipient,<br/>Amount, PIN"]
    H7 --> H8["Same as Transfer Flow"]
    H2 -->|Deposit| H9["Return Instructions<br/>Bank account details"]
    
    B -->|Voice| I["🎙️ Voice Endpoint<br/>POST /voice/intent"]
    I --> I1["Get Swahili Text<br/>From speech-to-text"]
    I1 --> I2["Call Hugging Face<br/>Intent Classification"]
    I2 --> I3["Parse intent + entities<br/>Extract: action,<br/>amount, recipient"]
    I3 --> I4{Intent OK?}
    I4 -->|Unknown| I5["❌ Ask user<br/>to repeat"]
    I4 -->|OK| I6["Execute Intent<br/>E.g. transfer()"]
    I6 --> I7["Return Result<br/>Text-to-speech"]
    
    C2 --> D
    E9 --> J["Log Event<br/>Update metrics"]
    F13 --> J
    G11 --> J
    H6 --> J
    I7 --> J
    
    J --> K["✅ Request Complete<br/>Response sent"]
    
    style A fill:#e3f2fd
    style D fill:#c8e6c9
    style E3 fill:#ffccbc
    style E9 fill:#c8e6c9
    style F13 fill:#c8e6c9
    style G11 fill:#c8e6c9
    style H6 fill:#c8e6c9
    style I7 fill:#c8e6c9
    style K fill:#fff9c4
```

---

## 2. Frontend Application Flow

```mermaid
flowchart TD
    Start["🚀 User Visits<br/>africoin.app"] --> CheckAuth{Logged In?}
    
    CheckAuth -->|No| SignupOrLogin{New User?}
    SignupOrLogin -->|New| Signup["📝 Signup Page"]
    Signup --> S1["Enter Phone Number"]
    S1 --> S2["Enter Full Name"]
    S2 --> S3["Create 4-digit PIN"]
    S3 --> S4["🔐 Call /auth/register"]
    S4 --> S5{Success?}
    S5 -->|Error| S6["❌ Show error<br/>Retry"]
    S6 --> S1
    S5 -->|Success| S7["✅ Wallet Created<br/>Tier = 0"]
    S7 --> S8["📋 Post-Signup KYC Popup<br/>Verify ID?<br/>Optional with Dismiss"]
    S8 --> S9{User Action?}
    S9 -->|Dismiss| Dashboard["📊 Dashboard<br/>Tier 0 limits"]
    S9 -->|Verify| KYCFlow
    
    SignupOrLogin -->|Existing| Login["🔓 Login Page"]
    Login --> L1["Enter Phone Number"]
    L1 --> L2["Enter PIN"]
    L2 --> L3["🔐 Call /auth/login"]
    L3 --> L4{Success?}
    L4 -->|Error| L5["❌ Invalid PIN<br/>Try again"]
    L5 --> L2
    L4 -->|Success| Dashboard
    
    CheckAuth -->|Yes| Dashboard
    
    Dashboard --> DashShow["Display:<br/>✓ Balance (real-time)<br/>✓ KYC Tier<br/>✓ Current Limits<br/>✓ Recent Txns"]
    DashShow --> Menu{User Action?}
    
    Menu -->|Send Money| SendFlow["💸 Send Money<br/>Flow"]
    SendFlow --> Send1["Enter Recipient<br/>Phone Number"]
    Send1 --> Send2["Enter Amount<br/>AFRI"]
    Send2 --> Send3{Amount ≤<br/>Tier Limit?}
    Send3 -->|No| Send4["⚠️ Show:<br/>Limit: $50/tx<br/>Upgrade Tier 1?"]
    Send4 --> S9
    Send3 -->|Yes| Send5["Enter PIN<br/>Confirmation"]
    Send5 --> Send6["🔐 Call /transfers/send"]
    Send6 --> Send7{Success?}
    Send7 -->|Error| Send8["❌ Show error<br/>Possible reasons"]
    Send8 --> Dashboard
    Send7 -->|Success| Send9["✅ Transfer Complete<br/>Show receipt<br/>Recipient phone,<br/>Amount, Txn ID"]
    Send9 --> Dashboard
    
    Menu -->|Deposit| DepositFlow["💰 Deposit<br/>Flow"]
    DepositFlow --> Dep1["Select Currency<br/>NGN / KES / ZAR"]
    Dep1 --> Dep2["Enter Amount"]
    Dep2 --> Dep3{Amount ≤<br/>Tier Limit?}
    Dep3 -->|No| Dep4["⚠️ Limit exceeded<br/>Upgrade Tier?"]
    Dep4 --> S9
    Dep3 -->|Yes| Dep5["🔐 Call /deposits/initiate"]
    Dep5 --> Dep6["🏧 Redirect to<br/>Etegram Payment<br/>M-Pesa / Bank / Card"]
    Dep6 --> Dep7["User Completes<br/>Payment"]
    Dep7 --> Dep8["⏳ Polling for<br/>Confirmation<br/>2-5 minutes"]
    Dep8 --> Dep9{Confirmed?}
    Dep9 -->|Timeout| Dep10["⚠️ Still processing<br/>Check later"]
    Dep10 --> Dashboard
    Dep9 -->|Success| Dep11["✅ AFRI Received!<br/>Balance updated"]
    Dep11 --> Dashboard
    
    Menu -->|Verify ID| KYCFlow["🆔 KYC Verification<br/>Flow"]
    KYCFlow --> KYC1["Show current tier<br/>Limits"]
    KYC1 --> KYC2["Click 'Upgrade'"]
    KYC2 --> KYC3["🔐 Call /kyc/initiate"]
    KYC3 --> KYC4["Redirect to<br/>Trulioo Popup"]
    KYC4 --> KYC5["📸 Take Selfie<br/>Liveness Check"]
    KYC5 --> KYC6["✉️ Verify Email"]
    KYC6 --> KYC7["⏳ Waiting for<br/>Approval<br/>2-5 minutes"]
    KYC7 --> KYC8{Approved?}
    KYC8 -->|Rejected| KYC9["❌ Verification Failed<br/>Reason shown<br/>Retry option"]
    KYC9 --> KYC2
    KYC8 -->|Success| KYC10["✅ Tier 1 Unlocked!<br/>New Limits:<br/>$500/tx<br/>$2,000/day<br/>$10,000/month"]
    KYC10 --> Dashboard
    
    Menu -->|Settings| Settings["⚙️ Settings Page"]
    Settings --> Set1["View KYC Tier<br/>& Status"]
    Set1 --> Set2["View Current Limits<br/>& Usage"]
    Set2 --> Set3["View Transaction<br/>History"]
    Set3 --> Set4["Change PIN<br/>Security options"]
    Set4 --> Dashboard
    
    Menu -->|USSD| USSD["☎️ Switch to USSD<br/>*888# Mode"]
    USSD --> Dashboard
    
    Menu -->|Voice| Voice["🎙️ Voice Commands<br/>Swahili"]
    Voice --> V1["Click Mic Icon"]
    V1 --> V2["🎤 Record Voice<br/>Swahili command"]
    V2 --> V3["Example:<br/>Tuma 100 AFRI<br/>kwa John"]
    V3 --> V4["🔐 Call /voice/intent"]
    V4 --> V5["Parse intent<br/>Extract: send, 100, John"]
    V5 --> V6{Intent OK?}
    V6 -->|Error| V7["❌ Didn't understand<br/>Try again"]
    V7 --> V1
    V6 -->|Success| V8["✅ Show Intent<br/>Confirm?<br/>Send 100 AFRI to John"]
    V8 --> V9["User Confirms<br/>Enter PIN"]
    V9 --> V10["Execute Transfer<br/>Same as Send Flow"]
    V10 --> Dashboard
    
    Menu -->|Logout| Logout["🚪 Logout<br/>Clear token<br/>Redirect to login"]
    Logout --> Start
    
    style Start fill:#e3f2fd
    style Dashboard fill:#f3e5f5
    style Send9 fill:#c8e6c9
    style Dep11 fill:#c8e6c9
    style KYC10 fill:#c8e6c9
    style Send4 fill:#fff59d
    style Dep4 fill:#fff59d
    style KYC9 fill:#ffccbc
```

---

## 3. Smart Contract Flow

```mermaid
flowchart TD
    A["⛓️ Smart Contract<br/>Interaction"] --> B{Function Call?}
    
    B -->|Mint| Mint["📝 mint(to, amount)<br/>Only callable by<br/>Backend Service"]
    Mint --> M1["Check caller<br/>is authorized<br/>backend address"]
    M1 --> M2{Auth OK?}
    M2 -->|No| M3["❌ Revert<br/>Unauthorized"]
    M2 -->|Yes| M4["Increase totalSupply<br/>by amount"]
    M4 --> M5["Add amount to<br/>user balance"]
    M5 --> M6["Emit Mint event"]
    M6 --> M7["✅ Return success<br/>Balance updated"]
    M7 --> EventLog1["Event: Mint<br/>to: address<br/>amount: uint"]
    
    B -->|Burn| Burn["🔥 burn(amount)<br/>Remove tokens<br/>from circulation"]
    Burn --> Bu1["Check caller<br/>has balance"]
    Bu1 --> Bu2{Balance OK?}
    Bu2 -->|No| Bu3["❌ Revert<br/>Insufficient balance"]
    Bu2 -->|Yes| Bu4["Decrease totalSupply<br/>by amount"]
    Bu4 --> Bu5["Subtract from<br/>user balance"]
    Bu5 --> Bu6["Emit Burn event"]
    Bu6 --> Bu7["✅ Return success<br/>Tokens removed"]
    Bu7 --> EventLog2["Event: Burn<br/>from: address<br/>amount: uint"]
    
    B -->|Transfer| Transfer["💸 transfer(to, amount)<br/>Send AFRI to<br/>another user"]
    Transfer --> T1["Check caller<br/>has balance"]
    T1 --> T2{Balance OK?}
    T2 -->|No| T3["❌ Revert<br/>Insufficient balance"]
    T2 -->|Yes| T4["Check to address<br/>is valid"]
    T4 --> T5{To address OK?}
    T5 -->|No| T6["❌ Revert<br/>Invalid address"]
    T5 -->|Yes| T7["Subtract from<br/>sender balance"]
    T7 --> T8["Add to<br/>recipient balance"]
    T8 --> T9["Emit Transfer event"]
    T9 --> T10["✅ Return success<br/>Tokens transferred"]
    T10 --> EventLog3["Event: Transfer<br/>from: address<br/>to: address<br/>amount: uint"]
    
    B -->|BalanceOf| BalanceOf["👤 balanceOf(account)<br/>Get account<br/>balance"]
    BalanceOf --> BO1["Look up account<br/>in balances mapping"]
    BO1 --> BO2["Return balance<br/>or 0 if not found"]
    BO2 --> BO3["✅ Return uint balance"]
    
    B -->|TotalSupply| TotalSupply["📊 totalSupply()<br/>Get total<br/>AFRI tokens"]
    TotalSupply --> TS1["Return totalSupply<br/>variable"]
    TS1 --> TS2["✅ Return uint<br/>total"]
    
    B -->|GetFXRate| GetFXRate["💱 getFXRate(pair)<br/>Get price from<br/>MockOracle"]
    GetFXRate --> FX1["Call oracle<br/>contract"]
    FX1 --> FX2{Pair valid?}
    FX2 -->|No| FX3["❌ Return 0<br/>or revert"]
    FX2 -->|Yes| FX3a["Return exchange<br/>rate<br/>e.g. ETH/USD"]
    FX3a --> FX4["✅ Return uint<br/>rate"]
    
    EventLog1 --> Listener["🔔 Backend Event<br/>Listener Watching"]
    EventLog2 --> Listener
    EventLog3 --> Listener
    
    Listener --> L1["Receive event<br/>from blockchain"]
    L1 --> L2{Event Type?}
    L2 -->|Mint| L3["User received AFRI<br/>Update DB balance<br/>Send SMS notification"]
    L2 -->|Transfer| L4["Funds moved<br/>Update DB ledger<br/>Send notifications"]
    L2 -->|Burn| L5["Tokens removed<br/>Update DB balance<br/>Record withdrawal"]
    
    L3 --> L6["DB updated<br/>Balance reconciled"]
    L4 --> L6
    L5 --> L6
    
    L6 --> L7["✅ Event processed<br/>All systems synced"]
    
    style A fill:#bbdefb
    style Mint fill:#c8e6c9
    style Burn fill:#ffccbc
    style Transfer fill:#f0f4c3
    style M7 fill:#c8e6c9
    style T10 fill:#c8e6c9
    style BO3 fill:#c8e6c9
    style Listener fill:#fce4ec
    style L7 fill:#c8e6c9
```

---

## 4. Complete Application Flow (End-to-End)

```mermaid
flowchart LR
    User["👤 User<br/>Feature/Smartphone"]
    
    subgraph "User Interfaces"
        PWA["📱 PWA<br/>React App<br/>Modern phone"]
        USSD["☎️ USSD<br/>*888#<br/>Feature phone"]
        Voice["🎙️ Voice<br/>Swahili<br/>Speech input"]
    end
    
    subgraph "API Gateway"
        API["🔌 Express API<br/>REST endpoints<br/>Request validation<br/>Rate limiting"]
    end
    
    subgraph "Backend Services"
        Auth["🔐 Auth Service<br/>JWT, PIN<br/>Registration, Login"]
        Transfer["💸 Transfer Service<br/>Send/Receive<br/>Blockchain calls<br/>Limit checks"]
        Deposit["💰 Deposit Service<br/>Etegram integration<br/>Webhook handler<br/>AFRI minting"]
        KYC["📋 KYC Service<br/>Trulioo integration<br/>Tier management<br/>Limit updates"]
    end
    
    subgraph "Data Layer"
        PostgreSQL["🗄️ PostgreSQL<br/>Users<br/>Transactions<br/>KYC records<br/>Limits"]
        Redis["⚡ Redis<br/>Cache<br/>OTP storage<br/>Sessions<br/>Rate limits"]
    end
    
    subgraph "Blockchain"
        Base["⛓️ Base Sepolia<br/>AfriCoin.sol<br/>MockOracle.sol"]
        Events["🔔 Events<br/>Mint, Burn, Transfer"]
        Listener["📡 Event Listener<br/>Watches chain<br/>Updates DB"]
    end
    
    subgraph "External Integrations"
        Etegram["🏦 Etegram<br/>Fiat deposits<br/>Webhooks<br/>Payment processing"]
        Trulioo["🆔 Trulioo<br/>Identity verification<br/>Selfie + ID<br/>Webhooks"]
        ATI["📲 Africa's Talking<br/>USSD gateway<br/>SMS notifications"]
        HF["🤖 Hugging Face<br/>Swahili NLU<br/>Intent parsing"]
    end
    
    subgraph "Monitoring"
        Sentry["📊 Sentry<br/>Error tracking"]
        CloudWatch["📈 CloudWatch<br/>Logs & metrics"]
    end
    
    User -->|Interacts| PWA
    User -->|Dials *888#| USSD
    User -->|Speaks Swahili| Voice
    
    PWA -->|HTTP| API
    USSD -->|POST| API
    Voice -->|POST| API
    
    API --> Auth
    API --> Transfer
    API --> Deposit
    API --> KYC
    
    Auth -->|Read/Write| PostgreSQL
    Auth -->|Cache| Redis
    Transfer -->|Read/Write| PostgreSQL
    Transfer -->|Cache| Redis
    Transfer -->|Call| Base
    Deposit -->|Read/Write| PostgreSQL
    Deposit -->|Call| Base
    KYC -->|Read/Write| PostgreSQL
    
    Base --> Events
    Events --> Listener
    Listener -->|Update| PostgreSQL
    Listener -->|Cache| Redis
    
    Transfer -->|Call| Etegram
    Deposit -->|Receive webhook| Etegram
    Deposit -->|Call| Base
    
    KYC -->|Call| Trulioo
    Trulioo -->|Webhook| KYC
    
    USSD -->|API| ATI
    ATI -->|SMS| User
    
    Voice -->|Inference| HF
    HF -->|Intent| API
    
    Auth -->|Log| Sentry
    Transfer -->|Log| Sentry
    Deposit -->|Log| Sentry
    KYC -->|Log| Sentry
    
    Auth -->|Metrics| CloudWatch
    Transfer -->|Metrics| CloudWatch
    
    Transfer -->|Update| PWA
    Deposit -->|Notify| PWA
    KYC -->|Notify| PWA
    
    style User fill:#e3f2fd
    style PWA fill:#e3f2fd
    style USSD fill:#e3f2fd
    style Voice fill:#e3f2fd
    style API fill:#f3e5f5
    style Auth fill:#c8e6c9
    style Transfer fill:#c8e6c9
    style Deposit fill:#c8e6c9
    style KYC fill:#c8e6c9
    style PostgreSQL fill:#fff9c4
    style Redis fill:#fff9c4
    style Base fill:#d1c4e9
    style Etegram fill:#ffe0b2
    style Trulioo fill:#ffe0b2
    style ATI fill:#ffe0b2
    style HF fill:#ffe0b2
    style Sentry fill:#ffccbc
    style CloudWatch fill:#ffccbc
```

---

## Flow Legend

| Symbol | Meaning |
|--------|---------|
| 👤 | User/Person |
| 📱 | Mobile/Frontend |
| 🔌 | API/Gateway |
| 🔐 | Security/Auth |
| 💸 | Transfers/Payments |
| 💰 | Deposits/Money in |
| 📋 | KYC/Compliance |
| ☎️ | Phone/USSD |
| 🎙️ | Voice/Audio |
| 🗄️ | Database |
| ⚡ | Cache/Redis |
| ⛓️ | Blockchain |
| 🔔 | Events/Webhooks |
| 🏦 | Financial Integration |
| 🆔 | Identity/Verification |
| 📲 | Messaging |
| 🤖 | AI/ML |
| 📊 | Monitoring |

---

## Usage Guide

### For Developers
- **Backend Flow:** Understand request handling, validation, and business logic
- **Frontend Flow:** Track user journey, UI states, and navigation
- **Smart Contract Flow:** Know how blockchain operations work
- **Complete Flow:** See how all systems interact end-to-end

### For Stakeholders
- **Complete Flow:** Shows the full system architecture and integrations
- **Frontend Flow:** Demonstrates user experience
- **Data Flow:** Understand how information moves through the system

### For Debugging
- **Backend Flow:** Trace request through services
- **Smart Contract Flow:** Check on-chain transaction processing
- **Complete Flow:** Identify where integration breaks occur

---

**Last Updated:** December 14, 2025  
**Status:** Reference Documentation  
**Format:** Mermaid Flowcharts (compatible with GitHub, Notion, Confluence)
