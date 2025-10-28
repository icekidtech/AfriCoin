import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Country {
  code: string;
  name: string;
  dial_code: string;
  flag: string;
}

// List of all African countries with their dial codes and flags  
const COUNTRIES: Country[] = [
  { code: "AO", name: "Angola", dial_code: "+244", flag: "🇦🇴" },
  { code: "DZ", name: "Algeria", dial_code: "+213", flag: "🇩🇿" },
  { code: "BJ", name: "Benin", dial_code: "+229", flag: "🇧🇯" },
  { code: "BW", name: "Botswana", dial_code: "+267", flag: "🇧🇼" },
  { code: "BF", name: "Burkina Faso", dial_code: "+226", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", dial_code: "+257", flag: "🇧🇮" },
  { code: "CV", name: "Cabo Verde", dial_code: "+238", flag: "🇨🇻" },
  { code: "CM", name: "Cameroon", dial_code: "+237", flag: "🇨🇲" },
  { code: "CF", name: "Central African Republic", dial_code: "+236", flag: "🇨🇫" },
  { code: "TD", name: "Chad", dial_code: "+235", flag: "🇹🇩" },
  { code: "KM", name: "Comoros", dial_code: "+269", flag: "🇰🇲" },
  { code: "CD", name: "Congo (DRC)", dial_code: "+243", flag: "🇨🇩" },
  { code: "CG", name: "Congo (Republic)", dial_code: "+242", flag: "🇨🇬" },
  { code: "CI", name: "Côte d'Ivoire", dial_code: "+225", flag: "🇨🇮" },
  { code: "DJ", name: "Djibouti", dial_code: "+253", flag: "🇩🇯" },
  { code: "EG", name: "Egypt", dial_code: "+20", flag: "🇪🇬" },
  { code: "GQ", name: "Equatorial Guinea", dial_code: "+240", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", dial_code: "+291", flag: "🇪🇷" },
  { code: "SZ", name: "Eswatini", dial_code: "+268", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", dial_code: "+251", flag: "🇪🇹" },
  { code: "GA", name: "Gabon", dial_code: "+241", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", dial_code: "+220", flag: "🇬🇲" },
  { code: "GH", name: "Ghana", dial_code: "+233", flag: "🇬🇭" },
  { code: "GN", name: "Guinea", dial_code: "+224", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", dial_code: "+245", flag: "🇬🇼" },
  { code: "KE", name: "Kenya", dial_code: "+254", flag: "🇰🇪" },
  { code: "LS", name: "Lesotho", dial_code: "+266", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", dial_code: "+231", flag: "🇱🇷" },
  { code: "LY", name: "Libya", dial_code: "+218", flag: "🇱🇾" },
  { code: "MG", name: "Madagascar", dial_code: "+261", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", dial_code: "+265", flag: "🇲🇼" },
  { code: "ML", name: "Mali", dial_code: "+223", flag: "🇲🇱" },
  { code: "MR", name: "Mauritania", dial_code: "+222", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", dial_code: "+230", flag: "🇲🇺" },
  { code: "MA", name: "Morocco", dial_code: "+212", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", dial_code: "+258", flag: "🇲🇿" },
  { code: "NA", name: "Namibia", dial_code: "+264", flag: "🇳🇦" },
  { code: "NE", name: "Niger", dial_code: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", dial_code: "+234", flag: "🇳🇬" },
  { code: "RW", name: "Rwanda", dial_code: "+250", flag: "🇷🇼" },
  { code: "ST", name: "São Tomé and Príncipe", dial_code: "+239", flag: "🇸🇹" },
  { code: "SN", name: "Senegal", dial_code: "+221", flag: "🇸🇳" },
  { code: "SC", name: "Seychelles", dial_code: "+248", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", dial_code: "+232", flag: "🇸🇱" },
  { code: "SO", name: "Somalia", dial_code: "+252", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", dial_code: "+27", flag: "🇿🇦" },
  { code: "SS", name: "South Sudan", dial_code: "+211", flag: "🇸🇸" },
  { code: "SD", name: "Sudan", dial_code: "+249", flag: "🇸🇩" },
  { code: "TZ", name: "Tanzania", dial_code: "+255", flag: "🇹🇿" },
  { code: "TG", name: "Togo", dial_code: "+228", flag: "🇹🇬" },
  { code: "TN", name: "Tunisia", dial_code: "+216", flag: "🇹🇳" },
  { code: "UG", name: "Uganda", dial_code: "+256", flag: "🇺🇬" },
  { code: "EH", name: "Western Sahara", dial_code: "+212", flag: "🇪🇭" },
  { code: "ZM", name: "Zambia", dial_code: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", dial_code: "+263", flag: "🇿🇼" },
];

interface CountryCodeSelectorProps {
  value: string;
  onCountryChange: (dialCode: string) => void;
  onPhoneChange: (phone: string) => void;
}

export const CountryCodeSelector = ({
  value,
  onCountryChange,
  onPhoneChange,
}: CountryCodeSelectorProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[38]); // Nigeria by default
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleCountrySelect = (countryCode: string) => {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      onCountryChange(country.dial_code);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, "");
    setPhoneNumber(phone);
    onPhoneChange(selectedCountry.dial_code + phone);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Phone Number</label>
      <div className="flex gap-2 items-center">
        {/* Country Code Selector - Compact (Flag + Dial Code Only) */}
        <Select value={selectedCountry.code} onValueChange={handleCountrySelect}>
          <SelectTrigger className="w-28 border-r-0 rounded-r-none">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="font-mono text-sm font-semibold">{selectedCountry.dial_code}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-48 w-80">
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium min-w-[150px]">{country.name}</span>
                  <span className="text-muted-foreground font-mono">{country.dial_code}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Input - Takes ALL remaining space */}
        <Input
          type="tel"
          placeholder="712345678"
          value={phoneNumber}
          onChange={handlePhoneChange}
          className="flex-1 rounded-l-none border-l-0"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Full number: {selectedCountry.dial_code}{phoneNumber}
      </p>
    </div>
  );
};