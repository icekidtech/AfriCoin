import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Mail, Phone, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Help = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const faqs = [
    {
      question: "How do I send money?",
      answer: "Use the Send button on the dashboard and enter the recipient's phone number.",
    },
    {
      question: "What are the transaction fees?",
      answer: "Transactions within Africa are free. International transfers have a small fee.",
    },
    {
      question: "How do I top up my wallet?",
      answer: "Use the Top Up button and select M-Pesa or bank transfer.",
    },
    {
      question: "Is my money safe?",
      answer: "Yes! We use bank-level security and your funds are protected.",
    },
    {
      question: "How do I change my PIN?",
      answer: "Go to Security & PIN in the menu to update your security settings.",
    },
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: () => toast({ title: "Live Chat", description: "Chat feature coming soon!" }),
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@africoin.app",
      action: () => (window.location.href = "mailto:support@africoin.app"),
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+254 700 000 000",
      action: () => (window.location.href = "tel:+254700000000"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Help & Support</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Contact Options */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
          {contactOptions.map((option, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:shadow-medium transition-smooth"
              onClick={option.action}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <option.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-2">{faq.question}</p>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Resources */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <h3 className="font-semibold mb-3">Additional Resources</h3>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                User Guide
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                Terms of Service
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <FileText className="w-4 h-4 mr-2" />
                Privacy Policy
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Help;
