import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getSiteContentOptimized, updateSiteContent, getDefaultContent, SiteContent } from "@/services/contentService";
import { uploadImage as uploadImageToServer } from "@/services/imageService";
import { base64ToFile } from "@/services/storageService";
import { isLocalDevelopment } from "@/lib/supabase-local";
import ContentAccordion from "./ContentAccordion";
import SaveButton from "./SaveButton";
import AdminCard from "./AdminCard";

const ContentAdmin = () => {
  const [content, setContent] = useState<SiteContent>(getDefaultContent());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Charger le contenu du site depuis Supabase
  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const siteContent = await getSiteContentOptimized();
      setContent(siteContent);
    } catch (error) {
      toast.error("Erreur lors du chargement du contenu");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Traiter les images base64 en les téléchargeant vers le serveur (ImagesSite)
      const processedContent = { ...content };
      const imageFiles: Record<string, File> = {};
      
      // Pour chaque section et chaque champ qui contient une image
      for (const section of Object.keys(content) as Array<keyof SiteContent>) {
        for (const field of Object.keys(content[section]) as Array<keyof SiteContent[typeof section]>) {
          const value = content[section][field] as string | string[];
          
          // Gérer les tableaux d'images (comme heroImages)
          if (Array.isArray(value)) {
            const processedArray: string[] = [];
            for (const item of value) {
              if (typeof item === 'string') {
                // Uploader toute image en base64
                if (item.startsWith('data:image')) {
                  const file = await base64ToFile(item, `content-${section}-${String(field)}-${Date.now()}.jpg`);
                  if (file) {
                    const uploadedUrl = await uploadImageToServer(file);
                    if (uploadedUrl) {
                      processedArray.push(uploadedUrl);
                    } else {
                      processedArray.push(item);
                    }
                  } else {
                    processedArray.push(item);
                  }
                } else {
                  processedArray.push(item);
                }
              } else {
                processedArray.push(String(item));
              }
            }
            (processedContent[section] as any)[field] = processedArray;
          }
          // Gérer les images individuelles
          else if (typeof value === 'string') {
            if (value.startsWith('data:image')) {
              const file = await base64ToFile(value, `content-${section}-${String(field)}-${Date.now()}.jpg`);
              if (file) {
                const uploadedUrl = await uploadImageToServer(file);
                if (uploadedUrl) {
                  (processedContent[section] as any)[field] = uploadedUrl;
                }
              }
            } else {
              (processedContent[section] as any)[field] = value;
            }
          }
        }
      }
      
      // Enregistrer le contenu
      const success = await updateSiteContent(processedContent);
      
      if (success) {
        setContent(processedContent);
        toast.success("Contenu du site mis à jour avec succès");
        
        // Forcer le rechargement des données sur toutes les pages
        window.dispatchEvent(new CustomEvent('contentUpdated'));
        
        // Recharger le contenu après un court délai pour s'assurer que la BD est à jour
        setTimeout(() => {
          loadContent();
        }, 1000);
      } else {
        toast.error("Erreur lors de la mise à jour du contenu");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: keyof SiteContent, field: string, value: string | string[]) => {
    setContent({
      ...content,
      [section]: {
        ...content[section],
        [field]: value,
      },
    });
  };

  const handleImageSelected = (section: keyof SiteContent, field: string, imageUrl: string) => {
    setContent({
      ...content,
      [section]: {
        ...content[section],
        [field]: imageUrl,
      },
    });
  };

  return (
    <AdminCard title="Administration du contenu">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Chargement du contenu...
        </div>
      ) : (
        <ContentAccordion content={content} onInputChange={handleInputChange} onImageSelected={handleImageSelected} />
      )}

      <div className="mt-4 flex justify-end">
        <SaveButton onClick={handleSaveChanges} isSaving={isSaving} />
      </div>
    </AdminCard>
  );
};

export default ContentAdmin;
