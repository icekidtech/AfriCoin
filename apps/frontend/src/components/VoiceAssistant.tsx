import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Volume2, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)", keywords: { balance: ["balance", "how much"], send: ["send", "transfer"], help: ["help", "what can you do"] } },
  { code: "en-GB", name: "English (UK)", keywords: { balance: ["balance", "how much"], send: ["send", "transfer"], help: ["help", "what can you do"] } },
  { code: "fr-FR", name: "Français", keywords: { balance: ["solde", "combien"], send: ["envoyer", "transférer"], help: ["aide", "que peux-tu faire"] } },
  { code: "sw-KE", name: "Kiswahili", keywords: { balance: ["salio", "kiasi gani"], send: ["tuma", "hamisha"], help: ["msaada", "unaweza kufanya nini"] } },
  { code: "ha-NG", name: "Hausa", keywords: { balance: ["ma'auni", "nawa"], send: ["aika", "canja"], help: ["taimako", "me zaka iya yi"] } },
  { code: "yo-NG", name: "Yorùbá", keywords: { balance: ["ìdọgbà", "elo"], send: ["firánṣẹ́", "gbé"], help: ["ìrànlọ́wọ́", "kí ni o lè ṣe"] } },
  { code: "zu-ZA", name: "isiZulu", keywords: { balance: ["ibhalansi", "malini"], send: ["thumela", "dlulisa"], help: ["usizo", "yini ongayenza"] } },
  { code: "af-ZA", name: "Afrikaans", keywords: { balance: ["balans", "hoeveel"], send: ["stuur", "oorplaas"], help: ["hulp", "wat kan jy doen"] } },
  { code: "am-ET", name: "አማርኛ (Amharic)", keywords: { balance: ["ሚዛን", "ስንት"], send: ["ላክ", "አስተላልፍ"], help: ["እገዛ", "ምን ማድረግ ትችላለህ"] } },
  { code: "ar-SA", name: "العربية", keywords: { balance: ["رصيد", "كم"], send: ["إرسال", "تحويل"], help: ["مساعدة", "ماذا يمكنك أن تفعل"] } },
  { code: "pt-PT", name: "Português", keywords: { balance: ["saldo", "quanto"], send: ["enviar", "transferir"], help: ["ajuda", "o que você pode fazer"] } },
];

interface VoiceAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
}

export const VoiceAssistant = ({ open, onOpenChange, balance }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!open) {
      setTranscript("");
      setResponse("");
      setIsListening(false);
    }
  }, [open]);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const getLocalizedResponse = (type: 'balance' | 'send' | 'help' | 'unknown') => {
    const responses: Record<string, Record<string, string>> = {
      'en-US': {
        balance: `Your current balance is ${balance.toFixed(2)} AfriCoin, which is approximately ${(balance * 0.01).toFixed(2)} US dollars.`,
        send: "Opening send money page. Please enter the recipient details.",
        help: "I can help you check your balance, send money, or navigate the app. Try saying 'check my balance' or 'send money'.",
        unknown: "I didn't understand that. You can say 'check balance', 'send money', or 'help' for assistance."
      },
      'fr-FR': {
        balance: `Votre solde actuel est de ${balance.toFixed(2)} AfriCoin, soit environ ${(balance * 0.01).toFixed(2)} dollars américains.`,
        send: "Ouverture de la page d'envoi d'argent. Veuillez saisir les détails du destinataire.",
        help: "Je peux vous aider à vérifier votre solde, envoyer de l'argent ou naviguer dans l'application. Essayez de dire 'vérifier mon solde' ou 'envoyer de l'argent'.",
        unknown: "Je n'ai pas compris. Vous pouvez dire 'vérifier le solde', 'envoyer de l'argent' ou 'aide'."
      },
      'sw-KE': {
        balance: `Salio yako ya sasa ni ${balance.toFixed(2)} AfriCoin, ambayo ni takriban ${(balance * 0.01).toFixed(2)} dola za Marekani.`,
        send: "Kufungua ukurasa wa kutuma pesa. Tafadhali weka maelezo ya mpokeaji.",
        help: "Ninaweza kukusaidia kuangalia salio lako, kutuma pesa, au kusogeza programu. Jaribu kusema 'angalia salio langu' au 'tuma pesa'.",
        unknown: "Sikuelewa hiyo. Unaweza kusema 'angalia salio', 'tuma pesa', au 'msaada'."
      },
      'ha-NG': {
        balance: `Ma'aunin ku na yanzu shi ne ${balance.toFixed(2)} AfriCoin, wanda kusan ${(balance * 0.01).toFixed(2)} dalar Amurka ne.`,
        send: "Buɗe shafin aika kuɗi. Da fatan za a shigar da bayanan mai karɓa.",
        help: "Zan iya taimaka muku duba ma'aunin ku, aika kuɗi, ko kewaya app ɗin. Gwada faɗin 'duba ma'aunina' ko 'aika kuɗi'.",
        unknown: "Ban fahimci hakan ba. Kuna iya cewa 'duba ma'auni', 'aika kuɗi', ko 'taimako'."
      },
      'yo-NG': {
        balance: `Ìdọgbà rẹ lọwọlọwọ jẹ ${balance.toFixed(2)} AfriCoin, eyiti o jẹ bii ${(balance * 0.01).toFixed(2)} dọla Amẹrika.`,
        send: "Sisi oju-iwe firanṣẹ owo. Jọwọ tẹ awọn alaye olugba sii.",
        help: "Mo le ran ọ lọwọ lati ṣayẹwo iwọntunwọnsi rẹ, firanṣẹ owo, tabi lilọ kiri app naa. Gbiyanju sọ pe 'ṣayẹwo iwọntunwọnsi mi' tabi 'firanṣẹ owo'.",
        unknown: "Emi ko loye iyẹn. O le sọ pe 'ṣayẹwo iwọntunwọnsi', 'firanṣẹ owo', tabi 'iranlọwọ'."
      },
      'zu-ZA': {
        balance: `Ibhalansi yakho yamanje ngu-${balance.toFixed(2)} AfriCoin, okungaba ngu-${(balance * 0.01).toFixed(2)} amadola ase-US.`,
        send: "Kuvula ikhasi lokuthumela imali. Sicela ufake imininingwane yomamukeli.",
        help: "Ngingakusiza ukuhlola ibhalansi yakho, ukuthumela imali, noma ukuzulazula ku-app. Zama ukusho 'hlola ibhalansi yami' noma 'thumela imali'.",
        unknown: "Angiqondanga lokho. Ungasho ukuthi 'hlola ibhalansi', 'thumela imali', noma 'usizo'."
      },
      'af-ZA': {
        balance: `Jou huidige balans is ${balance.toFixed(2)} AfriCoin, wat ongeveer ${(balance * 0.01).toFixed(2)} Amerikaanse dollar is.`,
        send: "Maak stuur geld bladsy oop. Voer asseblief die ontvanger se besonderhede in.",
        help: "Ek kan jou help om jou balans te kyk, geld te stuur, of die app te navigeer. Probeer sê 'kyk my balans' of 'stuur geld'.",
        unknown: "Ek het dit nie verstaan nie. Jy kan sê 'kyk balans', 'stuur geld', of 'hulp'."
      },
      'am-ET': {
        balance: `የአሁኑ ሚዛንዎ ${balance.toFixed(2)} AfriCoin ነው፣ ይህም በግምት ${(balance * 0.01).toFixed(2)} የአሜሪካ ዶላር ነው።`,
        send: "የገንዘብ መላኪያ ገጽ በመክፈት ላይ። እባክዎ የተቀባዩን ዝርዝሮች ያስገቡ።",
        help: "ሚዛንዎን ለማረጋገጥ፣ ገንዘብ ለመላክ ወይም መተግበሪያውን ለመዳሰስ ልረዳዎ እችላለሁ። 'ሚዛኔን አረጋግጥ' ወይም 'ገንዘብ ላክ' ይበሉ።",
        unknown: "ያንን አልገባኝም። 'ሚዛን አረጋግጥ'፣ 'ገንዘብ ላክ' ወይም 'እገዛ' ማለት ይችላሉ።"
      },
      'ar-SA': {
        balance: `رصيدك الحالي هو ${balance.toFixed(2)} أفريكوين، وهو ما يعادل تقريباً ${(balance * 0.01).toFixed(2)} دولار أمريكي.`,
        send: "فتح صفحة إرسال الأموال. يرجى إدخال تفاصيل المستلم.",
        help: "يمكنني مساعدتك في التحقق من رصيدك، أو إرسال الأموال، أو التنقل في التطبيق. حاول قول 'تحقق من رصيدي' أو 'أرسل المال'.",
        unknown: "لم أفهم ذلك. يمكنك قول 'تحقق من الرصيد' أو 'أرسل المال' أو 'مساعدة'."
      },
      'pt-PT': {
        balance: `O seu saldo atual é de ${balance.toFixed(2)} AfriCoin, o que equivale a aproximadamente ${(balance * 0.01).toFixed(2)} dólares americanos.`,
        send: "A abrir a página de envio de dinheiro. Por favor, insira os detalhes do destinatário.",
        help: "Posso ajudá-lo a verificar o seu saldo, enviar dinheiro ou navegar na aplicação. Tente dizer 'verificar o meu saldo' ou 'enviar dinheiro'.",
        unknown: "Não entendi isso. Pode dizer 'verificar saldo', 'enviar dinheiro' ou 'ajuda'."
      }
    };

    const langCode = selectedLanguage.split('-')[0] + '-' + selectedLanguage.split('-')[1];
    return responses[langCode]?.[type] || responses['en-US'][type];
  };

  const processCommand = (text: string) => {
    const lower = text.toLowerCase();
    const keywords = currentLang.keywords;
    
    // Check balance
    if (keywords.balance.some(kw => lower.includes(kw))) {
      const msg = getLocalizedResponse('balance');
      setResponse(msg);
      speak(msg);
      return;
    }
    
    // Send money
    if (keywords.send.some(kw => lower.includes(kw))) {
      const msg = getLocalizedResponse('send');
      setResponse(msg);
      speak(msg);
      setTimeout(() => {
        onOpenChange(false);
        navigate("/send");
      }, 2000);
      return;
    }
    
    // Help
    if (keywords.help.some(kw => lower.includes(kw))) {
      const msg = getLocalizedResponse('help');
      setResponse(msg);
      speak(msg);
      return;
    }
    
    // Default
    const msg = getLocalizedResponse('unknown');
    setResponse(msg);
    speak(msg);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setResponse("");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Error",
        description: "Could not understand. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Assistant</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Listening Animation */}
          <div className="flex justify-center">
            <button
              onClick={startListening}
              disabled={isListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? "gradient-primary animate-glow" 
                  : "bg-primary hover:scale-110"
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center">
            {isListening ? (
              <p className="text-sm text-primary font-medium animate-pulse">Listening...</p>
            ) : (
              <p className="text-sm text-muted-foreground">Tap the microphone to speak</p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="p-4 rounded-xl bg-muted space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="w-3 h-3" />
                <span>You said:</span>
              </div>
              <p className="text-sm font-medium">{transcript}</p>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="p-4 rounded-xl gradient-primary bg-opacity-10 space-y-1">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Volume2 className="w-3 h-3" />
                <span>Assistant:</span>
              </div>
              <p className="text-sm">{response}</p>
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Try saying:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTranscript("Check my balance");
                  processCommand("Check my balance");
                }}
                className="text-xs"
              >
                Check balance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTranscript("Send money");
                  processCommand("Send money");
                }}
                className="text-xs"
              >
                Send money
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
