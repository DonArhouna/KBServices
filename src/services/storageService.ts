
import { supabase } from '@/lib/supabase';
import { isLocalDevelopment } from '@/lib/supabase-local';

// Fonction pour convertir base64 en File
export const base64ToFile = async (base64String: string, filename: string): Promise<File | null> => {
  try {
    const response = await fetch(base64String);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error('Erreur lors de la conversion base64 vers File:', error);
    return null;
  }
};

// Fonction pour télécharger une image
export const uploadImage = async (
  file: File,
  bucket: string,
  folder?: string
): Promise<string | null> => {
  try {
    // En développement local, convertir en base64 pour persistance
    if (isLocalDevelopment()) {
      console.log('Mode local détecté - conversion en base64');
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          console.error('Erreur lors de la lecture du fichier');
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    // En production, utiliser Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error('Erreur lors du téléchargement:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    return null;
  }
};

// Fonction pour supprimer une image
export const deleteImage = async (
  bucket: string,
  path: string
): Promise<boolean> => {
  try {
    // En développement local, simuler la suppression
    if (isLocalDevelopment()) {
      console.log('Mode local détecté - simulation de suppression');
      return true;
    }

    // En production, supprimer de Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    return false;
  }
};
