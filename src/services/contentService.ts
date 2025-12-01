// Supabase retiré: on bascule sur l'API Node/Express
// import { supabase, SiteContentDB, checkTableExists, isPostgrestError } from '@/lib/supabase';
// import { isLocalDevelopment } from '@/lib/supabase-local';
import { uploadImage, deleteImage, extractFilenameFromUrl } from './imageService';

export type SiteContentDB = {
  section: string;
  field: string;
  value: string | null;
  updated_at?: string;
};

const API_BASE = '/api';

// Type pour le contenu du site sur l'interface utilisateur
export type SiteContent = {
  home: {
    heroImages: string[]; // Changé pour supporter plusieurs images
    heroTitle: string;
    heroSubtitle: string;
    aboutImage: string;
    aboutTitle: string;
    aboutDescription: string;
    featuresTitle: string;
    featuresDescription: string;
    features: Array<{
      title: string;
      description: string;
    }>;
  };
  about: {
    bannerImage: string;
    historyImage: string;
    historyTitle: string;
    historyDescription: string;
    historyContent: string;
    missionTitle: string;
    missionDescription: string;
    missionContent: string;
    visionTitle: string;
    visionDescription: string;
    missionVisionImage: string;
    valuesTitle: string;
    valuesDescription: string;
    servicesTitle: string;
    servicesDescription: string;
  };
  products: {
    bannerImage: string;
    qualityImage: string;
    qualityTitle: string;
    qualityDescription: string;
  };
  contact: {
    bannerImage: string;
  };
};

// Fonction helper pour parser en toute sécurité les valeurs JSON
function safeJsonParse(value: string, fallback: any = []) {
  try {
    const parsed = JSON.parse(value);
    // S'assurer que pour heroImages, on retourne toujours un tableau
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

// Récupérer tout le contenu du site
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_BASE}/api/site-content`);
    if (!res.ok) {
      console.error('Erreur API getSiteContent:', res.status, res.statusText);
      return getDefaultContent();
    }
    const payload = await res.json();
    const items = (payload?.items || []) as SiteContentDB[];

    const content = getDefaultContent();
    items.forEach((typedItem) => {
      if (!typedItem || !typedItem.section || !typedItem.field) return;
      const section = typedItem.section as keyof SiteContent;
      const field = typedItem.field as keyof SiteContent[typeof section];
      if (section && field && typedItem.value != null) {
        if (field === 'heroImages' || field === 'features') {
          (content[section] as any)[field] = safeJsonParse(String(typedItem.value), field === 'heroImages' ? [] : []);
        } else {
          (content[section] as any)[field] = String(typedItem.value);
        }
      }
    });

    return content;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return getDefaultContent();
  }
}

// Mettre à jour le contenu du site avec gestion des conflits
export async function updateSiteContent(content: SiteContent, imageFiles?: Record<string, File>): Promise<boolean> {
  try {
    // Traiter les images d'abord si elles sont fournies
    const processedContent = { ...content };

    if (imageFiles) {
      for (const [fieldPath, file] of Object.entries(imageFiles)) {
        try {
          const imageUrl = await uploadImage(file);
          // Mettre à jour l'URL dans le contenu (fieldPath format: "section.field")
          const [section, field] = fieldPath.split('.');
          if (section && field && processedContent[section as keyof SiteContent]) {
            (processedContent[section as keyof SiteContent] as any)[field] = imageUrl;
          }
        } catch (uploadError) {
          console.error(`Erreur lors de l'upload de l'image ${fieldPath}:`, uploadError);
          return false;
        }
      }
    }

    // Préparer les items à upserter
    const contentItems: Array<SiteContentDB> = [];

    Object.entries(processedContent).forEach(([section, sectionData]) => {
      Object.entries(sectionData as Record<string, any>).forEach(([field, value]) => {
        const serializedValue = Array.isArray(value) ? JSON.stringify(value) : String(value ?? '');
        contentItems.push({
          section,
          field,
          value: serializedValue,
        });
      });
    });

    // Envoyer tous les items en une seule requête pour éviter les limites de taille
    const res = await fetch(`${API_BASE}/api/site-content/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: contentItems })
    });

    if (!res.ok) {
      console.error('Erreur API updateSiteContent:', res.status, await res.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return false;
  }
}

// Valeurs par défaut pour le contenu du site
export function getDefaultContent(): SiteContent {
  return {
    home: {
      heroImages: [], // Maintenant un tableau
      heroTitle: "Bienvenue chez KB&S",
      heroSubtitle: "Découvrez nos produits authentiques du Sénégal",
      aboutImage: "",
      aboutTitle: "À propos de nous",
      aboutDescription: "KB&S est spécialisé dans la transformation de produits agroalimentaires 100% naturels au Sénégal.",
      featuresTitle: "Nos Avantages",
      featuresDescription: "Découvrez ce qui nous distingue",
      features: [
        {
          title: "Qualité Premium",
          description: "Des produits sélectionnés avec soin pour leur qualité exceptionnelle"
        },
        {
          title: "100% Naturel",
          description: "Tous nos produits sont naturels et sans additifs artificiels"
        },
        {
          title: "Livraison Rapide",
          description: "Livraison express dans toute la région de Dakar"
        },
        {
          title: "Service Client",
          description: "Une équipe dédiée pour vous accompagner dans vos achats"
        }
      ]
    },
    about: {
      bannerImage: "",
      historyImage: "",
      historyTitle: "",
      historyDescription: "",
      historyContent: "",
      missionTitle: "",
      missionDescription: "",
      missionContent: "",
      visionTitle: "",
      visionDescription: "",
      missionVisionImage: "",
      valuesTitle: "",
      valuesDescription: "",
      servicesTitle: "",
      servicesDescription: ""
    },
    products: {
      bannerImage: "",
      qualityImage: "",
      qualityTitle: "",
      qualityDescription: ""
    },
    contact: {
      bannerImage: "",
    }
  };
}

// Fonction optimisée pour récupérer le contenu avec cache
export async function getSiteContentOptimized(): Promise<SiteContent> {
  // Délégué à getSiteContent pour centraliser la logique
  return getSiteContent();
}
