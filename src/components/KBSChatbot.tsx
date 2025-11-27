import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X, Bot, User } from "lucide-react";
import { toast } from "sonner";
import {
  getChatbotData,
  generateProductResponse,
  generateCategoryResponse,
  generatePriceResponse,
  getAvailableCategories,
  getProductCount,
  ChatbotData
} from "@/services/chatbotService";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const BOT_RESPONSES = [
  { keywords: ["produit", "menu", "que vendez-vous", "catalogue"], text: "Chez KB&S, nous proposons des produits authentiques du Sénégal : miel pur, poudre de bouye, beurre de karité, huile de palme rouge, thiakry, pâte d'arachide, et bien plus encore. Vous pouvez consulter notre catalogue complet sur la page 'Produits' de notre site." },
  { keywords: ["miel"], text: "Notre miel pur est 100% naturel, récolté dans les forêts du Sénégal. Un produit de qualité exceptionnelle à 5000 FCFA. Consultez notre page 'Produits' pour le commander." },
  { keywords: ["bouye", "baobab"], text: "Notre poudre de bouye (pain de singe) est riche en vitamines et minéraux, parfaite pour vos boissons et desserts. Prix : 2500 FCFA. Disponible sur notre page 'Produits'." },
  { keywords: ["karité", "beurre"], text: "Notre beurre de karité pur est idéal pour la cuisine et les soins corporels. Un produit naturel à 3500 FCFA. Consultez notre page 'Produits' pour plus de détails." },
  { keywords: ["thiakry"], text: "Nous proposons du thiakry traditionnel à la banane et à la patate douce, des spécialités authentiques à 2000 FCFA chacune. Découvrez-les sur notre page 'Produits'." },
  { keywords: ["arachide", "pâte"], text: "Notre pâte d'arachide naturelle sans additifs est parfaite pour vos sauces traditionnelles. Prix : 1800 FCFA. Disponible sur notre page 'Produits'." },
  { keywords: ["huile", "palme"], text: "Notre huile de palme rouge traditionnelle est riche en vitamine E et caroténoïdes. Un produit authentique à 4000 FCFA. Consultez notre page 'Produits'." },
  { keywords: ["livraison", "livrer", "délai"], text: "Nous proposons deux options : livraison à domicile ou retrait en magasin. Les délais de livraison varient selon votre localisation. Vous pouvez préciser vos préférences lors de votre commande." },
  { keywords: ["paiement", "payer"], text: "Nous acceptons plusieurs modes de paiement : WhatsApp (recommandé), carte bancaire, Wave, et Orange Money. Vous pouvez choisir votre mode de paiement préféré lors de la finalisation de votre commande." },
  { keywords: ["commande", "commander", "acheter"], text: "Pour passer une commande, ajoutez vos produits au panier depuis notre page 'Produits', puis cliquez sur 'Passer une commande'. Vous pourrez ensuite choisir votre mode de livraison et de paiement." },
  { keywords: ["stock", "disponible", "disponibilité"], text: "La disponibilité de nos produits est mise à jour en temps réel sur notre page 'Produits'. Vous pouvez vérifier le stock avant de passer commande." },
  { keywords: ["naturel", "bio", "qualité"], text: "Tous nos produits sont 100% naturels et sans additifs artificiels. Nous sélectionnons avec soin chaque produit pour vous garantir une qualité exceptionnelle." },
  { keywords: ["contact", "téléphone", "adresse"], text: "Vous pouvez nous contacter via notre page 'Contact' où vous trouverez nos coordonnées complètes, ou directement via WhatsApp au +221 77 029 98 21." },
  { keywords: ["horaire", "ouvert", "heure"], text: "Nos horaires d'ouverture et informations de disponibilité sont disponibles sur notre page 'Contact'. N'hésitez pas à nous contacter pour des informations spécifiques." },
  { keywords: ["où", "localisation"], text: "Vous pouvez trouver notre localisation exacte sur la page 'Localisation' de notre site, avec une carte interactive pour nous trouver facilement." },
  { keywords: ["qui êtes-vous", "à propos", "histoire"], text: "KB&S est votre partenaire de confiance pour des produits authentiques du Sénégal. Nous sommes spécialisés dans la transformation de produits agroalimentaires 100% naturels. Découvrez notre histoire et nos valeurs sur la page 'À propos' de notre site." },
  { keywords: ["bonjour", "salut", "bonsoir"], text: "Bonjour ! Ravi de vous accueillir chez KB&S. Comment puis-je vous aider aujourd'hui ?" },
  { keywords: ["merci", "merci beaucoup"], text: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions concernant KB&S." },
  { keywords: ["aide", "help", "assistance"], text: "Je peux vous aider avec nos produits, les commandes, la livraison, les paiements, et toutes vos questions sur KB&S. Que souhaitez-vous savoir ?" }
];

const DEFAULT_RESPONSE = "Je suis spécialisé dans les informations concernant KB&S et nos produits authentiques du Sénégal. Vous pouvez me demander des informations sur nos produits (miel, bouye, karité, thiakry, etc.), les commandes, la livraison, ou les paiements. Pouvez-vous reformuler votre question ? Ou contactez-nous directement au +221 77 029 98 21 pour une assistance personnalisée.";

const KBSChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatbotData, setChatbotData] = useState<ChatbotData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Charger les données du chatbot
      getChatbotData().then(data => {
        setChatbotData(data);
      }).catch(error => {
        console.error('Erreur lors du chargement des données du chatbot:', error);
      });

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

    // Si on a les données du site, essayer de générer des réponses dynamiques
    if (chatbotData) {
      // Recherche de produits spécifiques
      const productResponse = generateProductResponse(chatbotData.products, lowerCaseMessage);
      if (productResponse) return productResponse;

      // Recherche de catégories
      const categoryResponse = generateCategoryResponse(chatbotData.categories, chatbotData.products, lowerCaseMessage);
      if (categoryResponse) return categoryResponse;

      // Recherche de prix
      const priceResponse = generatePriceResponse(chatbotData.products, lowerCaseMessage);
      if (priceResponse) return priceResponse;

      // Questions sur les catégories disponibles
      if (lowerCaseMessage.includes('catégorie') || lowerCaseMessage.includes('type') || lowerCaseMessage.includes('gamme')) {
        return getAvailableCategories(chatbotData.categories);
      }

      // Questions sur le nombre de produits
      if (lowerCaseMessage.includes('combien') && (lowerCaseMessage.includes('produit') || lowerCaseMessage.includes('article'))) {
        return getProductCount(chatbotData.products);
      }
    }

    // Réponses statiques existantes
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
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full bg-kbs-green hover:bg-kbs-green/90 shadow-lg z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-6 w-80 h-96 shadow-xl z-50 bg-white">
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
          <div className="flex gap-2 items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1 min-w-0"
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-kbs-green hover:bg-kbs-green/90 flex-shrink-0 px-3 py-2"
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
