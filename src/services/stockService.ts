const API_BASE_URL = 'http://localhost:3001/api';

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  product_name?: string;
}

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock';
  current_quantity: number;
  threshold_quantity: number;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
  product_name?: string;
}

export interface ProductStock {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  price: number;
  category_name?: string;
}

// Récupérer tous les mouvements de stock
export const getStockMovements = async (): Promise<StockMovement[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/stock-movements`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des mouvements de stock');
    }
    const data = await response.json();

    return data.map((movement: any) => ({
      id: movement.id,
      product_id: movement.productId,
      movement_type: movement.movementType as 'in' | 'out' | 'adjustment',
      quantity: movement.quantity,
      reason: movement.reason,
      reference_number: movement.referenceNumber,
      notes: movement.notes,
      created_at: movement.createdAt,
      created_by: movement.createdBy,
      product_name: movement.product?.name
    }));
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return [];
  }
};

// Créer un mouvement de stock
export const createStockMovement = async (movement: Omit<StockMovement, 'id' | 'created_at' | 'created_by'>): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/stock-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movement),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création du mouvement de stock');
    }

    return true;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    throw error;
  }
};

// Récupérer toutes les alertes de stock
export const getStockAlerts = async (): Promise<StockAlert[]> => {
  // TODO: Implement with Prisma API when needed
  return [];
};

// Marquer une alerte comme résolue
export const resolveStockAlert = async (alertId: string): Promise<boolean> => {
  // TODO: Implement with Prisma API when needed
  return true;
};

// Récupérer l'état du stock de tous les produits
export const getProductsStock = async (): Promise<ProductStock[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }
    const products = await response.json();

    return products.map((product: any) => ({
      id: product.id,
      name: product.name,
      stock_quantity: product.stockQuantity || 0,
      min_stock_level: product.minStockLevel || 5,
      stock_status: product.stockStatus || 'in_stock',
      price: Number(product.price),
      category_name: product.category?.name
    }));
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return [];
  }
};

// Mettre à jour les paramètres de stock d'un produit
export const updateProductStockSettings = async (
  productId: string,
  minStockLevel: number
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: productId,
        min_stock_level: minStockLevel
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour des paramètres de stock');
    }

    return true;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return false;
  }
};
