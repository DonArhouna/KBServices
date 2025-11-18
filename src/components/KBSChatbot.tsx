import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const BOT_RESPONSES = [
  { keywords: ["produit", "menu", "que vendez-vous"], text: "Chez KB&S, nous proposons une variété de produits délicieux : snacks, boissons, plats préparés et bien plus encore. Vous pouvez consulter notre catalogue complet sur la page 'Produits' de notre site." },
  { keywords: ["livraison", "livrer", "délai"], text: "Nous proposons deux options : livraison à domicile ou retrait en magasin. Les délais de livraison varient selon votre localisation. Vous pouvez préciser vos préférences lors de votre commande." },
  { keywords: ["paiement", "payer", "prix"], text: "Nous acceptons plusieurs modes de paiement : WhatsApp (recommandé), carte bancaire, Wave, et Orange Money. Vous pouvez choisir votre mode de paiement préféré lors de la finalisation de votre commande." },
  { keywords: ["commande", "commander", "acheter"], text: "Pour passer une commande, ajoutez vos produits au panier depuis notre page 'Produits', puis cliquez sur 'Passer une commande'. Vous pourrez ensuite choisir votre mode de livraison et de paiement." },
  // Note: "adresse" is a keyword for both contact and localisation. The first one will be matched.
  { keywords: ["contact", "téléphone", "adresse"], text: "Vous pouvez nous contacter via notre page 'Contact' où vous trouverez nos coordonnées complètes, ou directement via WhatsApp au +221 77 029 98 21." },
  { keywords: ["horaire", "ouvert", "heure"], text: "Nos horaires d'ouverture et informations de disponibilité sont disponibles sur notre page 'Contact'. N'hésitez pas à nous contacter pour des informations spécifiques." },
  { keywords: ["où", "localisation"], text: "Vous pouvez trouver notre localisation exacte sur la page 'Localisation' de notre site, avec une carte interactive pour nous trouver facilement." },
  { keywords: ["qui êtes-vous", "à propos", "histoire"], text: "KB&S est votre partenaire de confiance pour des produits de qualité. Découvrez notre histoire et nos valeurs sur la page 'À propos' de notre site." },
  { keywords: ["bonjour", "salut", "bonsoir"], text: "Bonjour ! Ravi de vous accueillir chez KB&S. Comment puis-je vous aider aujourd'hui ?" },
  { keywords: ["merci", "merci beaucoup"], text: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions concernant KB&S." }
];

const DEFAULT_RESPONSE = "Je suis spécialisé dans les informations concernant KB&S (produits, commandes, livraison, paiement). Pouvez-vous reformuler votre question en rapport avec nos services ? Ou contactez-nous directement pour une assistance personnalisée.";

const KBSChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message d'accueil
      const welcomeMessage: Message = {
        id: "welcome",
        text: "Bonjour ! Je suis l'assistant virtuel de KB&S. Je peux vous aider avec nos produits, services, livraisons et modes de paiement. Comment puis-je vous aider aujourd'hui ?",
        isBot: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const getKBSResponse = (userMessage: string): string => {
    const lowerCaseMessage = userMessage.toLowerCase();

    for (const response of BOT_RESPONSES) {
      if (response.keywords.some(keyword => lowerCaseMessage.includes(keyword))) {
        return response.text;
      }
    }
    return DEFAULT_RESPONSE;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simuler un délai de réponse
    setTimeout(() => {
      const botResponse: Message = {
        id: crypto.randomUUID(),
        text: getKBSResponse(inputMessage),
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-6 h-14 w-14 rounded-full bg-kbs-green hover:bg-kbs-green/90 shadow-lg z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-8 right-6 w-80 h-96 shadow-xl z-50 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-kbs-green" />
            Assistant KB&S
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              {message.isBot && (
                <div className="w-6 h-6 rounded-full bg-kbs-green flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-2 rounded-lg text-sm ${
                  message.isBot
                    ? 'bg-white text-gray-800 border border-gray-200'
                    : 'bg-kbs-green text-white'
                }`}
              >
                {message.text}
              </div>
              {!message.isBot && (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-kbs-green flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-white p-2 rounded-lg text-sm border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-kbs-green hover:bg-kbs-green/90"
              disabled={!inputMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KBSChatbot;
