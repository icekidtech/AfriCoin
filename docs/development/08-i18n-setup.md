# Internationalization (i18n) Setup

**Related Milestone:** [Milestone 2: Core Features & PWA](../milestones/MILESTONES.md#milestone-2-core-features--pwa)

## Overview

This document provides a comprehensive guide for implementing multi-language support in AfriCoin with focus on Swahili accessibility.

## Table of Contents

1. [i18next Setup](#i18next-setup)
2. [Translation Structure](#translation-structure)
3. [Language Files](#language-files)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Considerations](#backend-considerations)

---

## i18next Setup

### Installation

```bash
cd apps/frontend

npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

### Configuration

```typescript
// src/i18n/config.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

import enTranslations from "./locales/en.json";
import swTranslations from "./locales/sw.json";
import frTranslations from "./locales/fr.json";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    // Resources for local loading (fallback if HTTP fails)
    resources: {
      en: { translation: enTranslations },
      sw: { translation: swTranslations },
      fr: { translation: frTranslations },
    },

    // Language detection
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },

    // Namespaces for better organization
    ns: ["translation"],
    defaultNS: "translation",

    // Backend for loading translations
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  });

export default i18n;
```

### Initialize in main.tsx

```typescript
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n/config";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Translation Structure

### File Organization

```
apps/frontend/
├── src/
│   ├── locales/
│   │   ├── en.json                 # English
│   │   ├── sw.json                 # Swahili
│   │   └── fr.json                 # French
│   ├── i18n/
│   │   ├── config.ts               # i18next configuration
│   │   └── index.ts                # Export i18n instance
│   └── ...
└── public/
    └── locales/
        ├── en/
        │   └── translation.json
        ├── sw/
        │   └── translation.json
        └── fr/
            └── translation.json
```

### Translation Keys Naming Convention

```
<feature>.<component>.<element>
<feature>.<action>.<result>

Examples:
- wallet.card.balance
- wallet.card.currency
- transfer.form.recipientLabel
- transfer.form.amountPlaceholder
- auth.login.success
- auth.login.error
```

---

## Language Files

### English Translations (en.json)

```json
{
  "app": {
    "title": "AfriCoin",
    "description": "Pan-African Digital Stablecoin",
    "tagline": "One economy. One African currency. One borderless digital wallet."
  },
  "navigation": {
    "dashboard": "Dashboard",
    "send": "Send",
    "receive": "Receive",
    "history": "History",
    "settings": "Settings",
    "logout": "Logout"
  },
  "wallet": {
    "balance": "Balance",
    "currency": "AFRI",
    "title": "My Wallet",
    "card": {
      "balance": "Total Balance",
      "recent": "Recent Activity"
    }
  },
  "transfer": {
    "send": {
      "title": "Send Money",
      "recipientLabel": "Recipient Phone",
      "recipientPlaceholder": "Enter phone (+country code)",
      "amountLabel": "Amount",
      "amountPlaceholder": "0.00",
      "submit": "Send",
      "success": "Money sent successfully!",
      "error": "Failed to send money. Please try again."
    },
    "receive": {
      "title": "Receive Money",
      "yourPhone": "Your Phone Number",
      "share": "Share this number with sender",
      "qrCode": "Or share this QR code"
    }
  },
  "auth": {
    "onboarding": {
      "title": "Create Your Wallet",
      "phonePlaceholder": "Phone number",
      "nameLabel": "Full Name",
      "namePlaceholder": "John Doe",
      "pinLabel": "4-Digit PIN",
      "pinPlaceholder": "****",
      "confirmPinLabel": "Confirm PIN",
      "createWallet": "Create Wallet",
      "success": "Wallet created successfully!",
      "error": "Failed to create wallet"
    },
    "login": {
      "welcome": "Welcome back",
      "loginButton": "Login",
      "logoutButton": "Logout"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "ok": "OK",
    "yes": "Yes",
    "no": "No",
    "back": "Back",
    "next": "Next",
    "close": "Close"
  },
  "errors": {
    "phoneInvalid": "Please enter a valid phone number",
    "pinMismatch": "PINs do not match",
    "pinInvalid": "PIN must be 4 digits",
    "amountInvalid": "Please enter a valid amount",
    "networkError": "Network error. Please check your connection."
  }
}
```

### Swahili Translations (sw.json)

```json
{
  "app": {
    "title": "AfriCoin",
    "description": "Sarafu ya Kidijitali ya Afrika Panoja",
    "tagline": "Uchumi mmoja. Sarafu moja ya Afrika. Behewa moja bila hudud."
  },
  "navigation": {
    "dashboard": "Dashibodi",
    "send": "Tuma",
    "receive": "Pokea",
    "history": "Historia",
    "settings": "Mipangilio",
    "logout": "Ondoka"
  },
  "wallet": {
    "balance": "Salio",
    "currency": "AFRI",
    "title": "Mkoba Wangu",
    "card": {
      "balance": "Jumla ya Salio",
      "recent": "Shughuli za Karibuni"
    }
  },
  "transfer": {
    "send": {
      "title": "Tuma Pesa",
      "recipientLabel": "Simu ya Mpokeaji",
      "recipientPlaceholder": "Ingiza simu (+nchi)",
      "amountLabel": "Kiasi",
      "amountPlaceholder": "0.00",
      "submit": "Tuma",
      "success": "Pesa zimtumwa sawa!",
      "error": "Kumtuma pesa kulikosa. Jaribu tena."
    },
    "receive": {
      "title": "Pokea Pesa",
      "yourPhone": "Namba Yako ya Simu",
      "share": "Sambaza namba hii kwa mtumaji",
      "qrCode": "Au sambaza QR code hii"
    }
  },
  "auth": {
    "onboarding": {
      "title": "Fungua Mkoba Wako",
      "phonePlaceholder": "Namba ya simu",
      "nameLabel": "Jina Lako Kamili",
      "namePlaceholder": "Juma Doe",
      "pinLabel": "Nambari Siri ya Tarakimu 4",
      "pinPlaceholder": "****",
      "confirmPinLabel": "Thibitisha Nambari Siri",
      "createWallet": "Fungua Mkoba",
      "success": "Mkoba ulifunguliwa sawa!",
      "error": "Kumfungua mkoba kulikosa"
    },
    "login": {
      "welcome": "Karibu tena",
      "loginButton": "Ingia",
      "logoutButton": "Ondoka"
    }
  },
  "common": {
    "loading": "Inapakia...",
    "error": "Kosa lilitokea",
    "success": "Sawa",
    "cancel": "Ghairi",
    "confirm": "Thibitisha",
    "ok": "Sawa",
    "yes": "Ndiyo",
    "no": "Hapana",
    "back": "Rudi",
    "next": "Inayofuata",
    "close": "Funga"
  },
  "errors": {
    "phoneInvalid": "Tafadhali ingiza namba sahihi",
    "pinMismatch": "Nambari siri hazilingani",
    "pinInvalid": "Nambari siri lazima iwe na tarakimu 4",
    "amountInvalid": "Tafadhali ingiza kiasi sahihi",
    "networkError": "Kosa la mtandao. Angalia muunganisho wako."
  }
}
```

### French Translations (fr.json)

```json
{
  "app": {
    "title": "AfriCoin",
    "description": "Monnaie numérique panafricaine stable",
    "tagline": "Une économie. Une monnaie africaine. Un portefeuille numérique sans frontières."
  },
  "navigation": {
    "dashboard": "Tableau de bord",
    "send": "Envoyer",
    "receive": "Recevoir",
    "history": "Historique",
    "settings": "Paramètres",
    "logout": "Déconnexion"
  },
  "wallet": {
    "balance": "Solde",
    "currency": "AFRI",
    "title": "Mon portefeuille",
    "card": {
      "balance": "Solde total",
      "recent": "Activité récente"
    }
  },
  "transfer": {
    "send": {
      "title": "Envoyer de l'argent",
      "recipientLabel": "Téléphone du destinataire",
      "recipientPlaceholder": "Entrez le téléphone (+pays)",
      "amountLabel": "Montant",
      "amountPlaceholder": "0,00",
      "submit": "Envoyer",
      "success": "Argent envoyé avec succès!",
      "error": "Échec de l'envoi. Veuillez réessayer."
    },
    "receive": {
      "title": "Recevoir de l'argent",
      "yourPhone": "Votre numéro de téléphone",
      "share": "Partagez ce numéro avec l'expéditeur",
      "qrCode": "Ou partagez ce code QR"
    }
  }
}
```

---

## Frontend Implementation

### Language Selector Component

```typescript
// src/components/LanguageSelector.tsx
import React from "react";
import { useTranslation } from "react-i18next";

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: "en", name: "English" },
    { code: "sw", name: "Kiswahili" },
    { code: "fr", name: "Français" },
  ];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-1 rounded ${
            i18n.language === lang.code
              ? "bg-orange-500 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};
```

### Using Translations in Components

```typescript
// src/pages/Dashboard.tsx
import React from "react";
import { useTranslation } from "react-i18next";

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("wallet.title")}</h1>
      <p>{t("wallet.card.balance")}</p>

      {/* Using with parameters */}
      <p>{t("common.loading")}</p>

      {/* Conditional translation */}
      <div>
        {t("auth.login.welcome")} {/* Shows "Welcome back" or "Karibu tena" */}
      </div>
    </div>
  );
};
```

### Pluralization Support

```json
{
  "transfer": {
    "history": {
      "transactions_one": "1 transaction",
      "transactions_other": "{{count}} transactions"
    }
  }
}
```

```typescript
const { t } = useTranslation();

<p>{t("transfer.history.transactions", { count: 5 })}</p>
// Output: "5 transactions"
```

---

## Backend Considerations

### Language in API Responses

```typescript
// src/middleware/languageMiddleware.ts
export const languageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const language = req.query.lang || req.headers["accept-language"] || "en";
  req.language = language as string;
  next();
};
```

### Translating Backend Messages

```typescript
// src/utils/messages.ts
const messages: { [key: string]: { [key: string]: string } } = {
  en: {
    user_not_found: "User not found",
    invalid_pin: "Invalid PIN",
    transaction_sent: "Transaction sent successfully",
  },
  sw: {
    user_not_found: "Mtumiaji hapatikani",
    invalid_pin: "Nambari siri sio sahihi",
    transaction_sent: "Muamala utumwa sawa",
  },
  fr: {
    user_not_found: "Utilisateur non trouvé",
    invalid_pin: "Code PIN invalide",
    transaction_sent: "Transaction envoyée avec succès",
  },
};

export function getMessage(key: string, language: string = "en"): string {
  return messages[language]?.[key] || messages.en[key] || key;
}
```

---

## Best Practices

1. **Consistent Keys:** Use hierarchical, descriptive key names
2. **Complete Translations:** Translate all keys to all supported languages
3. **Context:** Provide context for translators on string meaning
4. **Avoid Hardcoding:** Never hardcode text that should be translated
5. **RTL Support:** Consider RTL languages for future expansion
6. **Testing:** Test with real translators or native speakers
7. **Key Extraction:** Use tools to extract and manage translation keys

---

## Testing Translations

### Component Test Example

```typescript
// test/Dashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../src/i18n/config";
import { Dashboard } from "../src/pages/Dashboard";

describe("Dashboard Translations", () => {
  it("should display translated title in English", () => {
    i18n.changeLanguage("en");
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );

    expect(screen.getByText("My Wallet")).toBeInTheDocument();
  });

  it("should display translated title in Swahili", () => {
    i18n.changeLanguage("sw");
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );

    expect(screen.getByText("Mkoba Wangu")).toBeInTheDocument();
  });
});
```

---

## Resources for Translation

1. **Swahili Translation Partners:**
   - Nairobi-based translation agencies
   - East African universities
   - Community contributors

2. **Tools:**
   - [i18next-scanner](https://github.com/i18next/i18next-scanner) - Extract keys
   - [Crowdin](https://crowdin.com/) - Collaborative translation platform
   - [Weblate](https://weblate.org/) - Open-source translation management

---

## Next Steps

1. ✅ Setup i18next
2. ✅ Create translation files
3. ✅ Implement language selector
4. ✅ Update all components to use translations
5. Move to [LLM Integration Guide](./09-llm-integration.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
