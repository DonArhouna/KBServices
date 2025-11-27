import { getAllProducts, getAllCategories, Product } from './productService';
import { getSiteContent, SiteContent } from './contentService';

export interface ChatbotData {
  products: Product[];
  categories: Array<{ id: string; name: string; slug: string }>;
  siteContent: SiteContent | null;
}

// Cache pour éviter de refaire les appels API à chaque message
let chatbotDataCache: ChatbotData | null = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getChatbotData(): Promise<ChatbotData> {
  const now = Date.now();
  
  // Utiliser le cache si il est encore valide
  if (chatbotDataCache && (now - lastCacheUpdate) < CACHE_DURATION) {
    return chatbotDataCache;
  }

  try {
    const [products, categories, siteContent] = await Promise.all([
      getAllProducts(),
      getAllCategories(),
      getSiteContent()
    ]);

    chatbotDataCache = {
      products,
      categories,
      siteContent
    };
    lastCacheUpdate = now;

    return chatbotDataCache;
  } catch (error) {
    console.error('Erreur lors de la récupération des données du chatbot:', error);
    
    // Retourner le cache même expiré si disponible, sinon des données vides
    return chatbotDataCache || {
      products: [],
      categories: [],
      siteContent: null
    };
  }
}

export function generateProductResponse(products: Product[], query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Recherche de produits spécifiques
  const matchingProducts = products.filter(product => 
    product.name.toLowerCase().includes(lowerQuery) ||
    product.description.toLowerCase().includes(lowerQuery) ||
    (product.categoryName && product.categoryName.toLowerCase().includes(lowerQuery))
  );

  if (matchingProducts.length > 0) {
    if (matchingProducts.length === 1) {
      const product = matchingProducts[0];
      return `Je vous présente notre ${product.name} : ${product.description} Prix : ${product.price} FCFA. ${product.stock_quantity && product.stock_quantity > 0 ? 'Disponible en stock.' : 'Veuillez vérifier la disponibilité.'} Vous pouvez le commander directement depuis notre page produits.`;
    } else {
      const productList = matchingProducts.slice(0, 3).map(p => `• ${p.name} (${p.price} FCFA)`).join('\n');
      return `J'ai trouvé ${matchingProducts.length} produits correspondant à votre recherche :\n${productList}\n\nConsultez notre page 'Produits' pour voir tous les détails et passer commande.`;
    }
  }

  return '';
}

export function generateCategoryResponse(categories: Array<{ id: string; name: string; slug: string }>, products: Product[], query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Recherche de catégories
  const matchingCategory = categories.find(cat => 
    cat.name.toLowerCase().includes(lowerQuery) ||
    cat.slug.toLowerCase().includes(lowerQuery)
  );

  if (matchingCategory) {
    const categoryProducts = products.filter(p => p.category === matchingCategory.id);
    if (categoryProducts.length > 0) {
      const productList = categoryProducts.slice(0, 3).map(p => `• ${p.name} (${p.price} FCFA)`).join('\n');
      return `Voici nos produits dans la catégorie "${matchingCategory.name}" :\n${productList}\n\n${categoryProducts.length > 3 ? `Et ${categoryProducts.length - 3} autres produits. ` : ''}Consultez notre page 'Produits' pour voir toute la gamme.`;
    } else {
      return `Nous avons une catégorie "${matchingCategory.name}" mais aucun produit n'est actuellement disponible. Consultez notre page 'Produits' pour voir nos autres catégories.`;
    }
  }

  return '';
}

export function generatePriceResponse(products: Product[], query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Recherche de prix ou gammes de prix
  const priceMatch = query.match(/(\d+)/);
  if (priceMatch) {
    const targetPrice = parseInt(priceMatch[1]);
    const affordableProducts = products.filter(p => p.price <= targetPrice).slice(0, 3);
    
    if (affordableProducts.length > 0) {
      const productList = affordableProducts.map(p => `• ${p.name} : ${p.price} FCFA`).join('\n');
      return `Voici nos produits dans votre budget (≤ ${targetPrice} FCFA) :\n${productList}\n\nConsultez notre page 'Produits' pour voir tous nos prix.`;
    }
  }

  // Informations générales sur les prix
  if (lowerQuery.includes('prix') || lowerQuery.includes('coût') || lowerQuery.includes('tarif')) {
    const minPrice = Math.min(...products.map(p => p.price));
    const maxPrice = Math.max(...products.map(p => p.price));
    return `Nos prix varient de ${minPrice} FCFA à ${maxPrice} FCFA selon les produits. Consultez notre page 'Produits' pour voir le détail des prix de chaque article.`;
  }

  return '';
}

export function getAvailableCategories(categories: Array<{ id: string; name: string; slug: string }>): string {
  if (categories.length === 0) {
    return "Consultez notre page 'Produits' pour découvrir nos catégories.";
  }
  
  const categoryList = categories.map(cat => cat.name).join(', ');
  return `Nos catégories de produits : ${categoryList}. Consultez notre page 'Produits' pour explorer chaque catégorie.`;
}

export function getProductCount(products: Product[]): string {
  if (products.length === 0) {
    return "Notre catalogue est en cours de mise à jour. Consultez notre page 'Produits' pour les dernières nouveautés.";
  }
  
  return `Nous proposons actuellement ${products.length} produits différents dans notre catalogue. Consultez notre page 'Produits' pour les découvrir tous.`;
}