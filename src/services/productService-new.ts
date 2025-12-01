// Types locaux pour l'API
type DBProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  stockQuantity: number | null;
  category?: DBCategory;
};

type DBCategory = {
  id: string;
  name: string;
  slug: string;
};

// Conversion du type de la base de données au type de l'application
export const mapProductFromDB = (product: DBProduct & { category?: DBCategory }): Product => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: Number(product.price),
  image: product.imageUrl || '',
  category: product.categoryId || '',
  categoryName: product.category?.name || '',
  stock_quantity: product.stockQuantity || 0,
});

// Type pour l'interface utilisateur
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  categoryName?: string;
  stock_quantity?: number;
};

// URL de base de l'API
const API_BASE_URL = '/api';

// Récupérer tous les produits
export async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }
    const products = await response.json();
    return products.map(mapProductFromDB);
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return [];
  }
}

// Récupérer les produits par catégorie
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products?category=${categoryId}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }
    const products = await response.json();
    return products.map(mapProductFromDB);
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return [];
  }
}

// Ajouter ou mettre à jour un produit
export async function saveProduct(product: Product): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde du produit');
    }

    const savedProduct = await response.json();
    return mapProductFromDB(savedProduct);
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return null;
  }
}

// Supprimer un produit
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du produit');
    }

    return true;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return false;
  }
}

// Récupérer toutes les catégories
export async function getAllCategories(): Promise<DBCategory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des catégories');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return [];
  }
}

// Ajouter ou mettre à jour une catégorie
export async function saveCategory(category: { id?: string; name: string; slug: string }): Promise<DBCategory | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde de la catégorie');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return null;
  }
}

// Supprimer une catégorie
export async function deleteCategory(categoryId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de la catégorie');
    }

    return true;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return false;
  }
}
