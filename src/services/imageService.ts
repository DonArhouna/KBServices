/**
 * Service de gestion des images pour l'application KBS
 * Gère l'upload, la suppression et la récupération des images
 */

const API_BASE = '/api';

/**
 * Upload une image vers le serveur
 * @param file - Le fichier image à uploader
 * @returns Promise avec l'URL de l'image uploadée
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de l\'upload de l\'image');
  }

  const result = await response.json();
  // Si l'API renvoie un chemin relatif (ex: /ImagesSite/filename), construire une URL absolue
  const imageUrl: string = result.imageUrl?.startsWith('/')
    ? `${API_BASE}${result.imageUrl}`
    : result.imageUrl;

  return imageUrl;
}

/**
 * Supprime une image du serveur
 * @param filename - Le nom du fichier à supprimer
 * @returns Promise<boolean> - true si la suppression a réussi
 */
export async function deleteImage(filename: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/upload/${filename}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la suppression de l\'image');
  }

  return true;
}

/**
 * Extrait le nom du fichier depuis une URL d'image
 * @param imageUrl - L'URL complète de l'image
 * @returns Le nom du fichier ou null si non trouvé
 */
export function extractFilenameFromUrl(imageUrl: string): string | null {
  if (!imageUrl) return null;

  // Si c'est une URL relative commençant par /ImagesSite/
  if (imageUrl.startsWith('/ImagesSite/')) {
    return imageUrl.replace('/ImagesSite/', '');
  }

  // Si c'est une URL complète, extraire le dernier segment
  try {
    const url = new URL(imageUrl);
    return url.pathname.split('/').pop() || null;
  } catch {
    return null;
  }
}

/**
 * Nettoie les images orphelines (non référencées en base)
 * Utile pour la maintenance périodique
 */
export async function cleanupOrphanedImages(): Promise<void> {
  // Cette fonction pourrait être implémentée plus tard
  // Elle scannerait le dossier ImagesSite et supprimerait les fichiers
  // qui ne sont plus référencés dans la base de données
  console.warn('cleanupOrphanedImages: Fonction non implémentée');
}

/**
 * Valide qu'un fichier est une image
 * @param file - Le fichier à valider
 * @returns boolean
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Obtient la taille formatée d'un fichier
 * @param bytes - Taille en octets
 * @returns Taille formatée (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
