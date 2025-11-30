// API client pour remplacer les imports Prisma côté frontend
const API_BASE_URL = '/api';

export const api = {
  async checkHealth() {
    const response = await fetch(`${API_BASE_URL}/health/tables`);
    return response.json();
  },
  
  async getProducts() {
    const response = await fetch(`${API_BASE_URL}/products`);
    return response.json();
  },
  
  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return response.json();
  }
};

// Fonction pour vérifier si une table spécifique existe
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const health = await api.checkHealth();
    return health[tableName]?.exists || false;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de la table ${tableName}:`, error);
    return false;
  }
}

// Fonction pour vérifier la configuration Prisma (toujours true côté frontend)
export const isPrismaConfigured = (): boolean => {
  return true;
};

// Fonction pour vérifier si les tables existent via l'API
export async function checkPrismaTablesExist(): Promise<boolean> {
  try {
    const health = await api.checkHealth();
    console.log('=== VÉRIFICATION DES TABLES VIA API ===');
    console.log(health);

    // Vérifier que toutes les tables existent
    const requiredTables = [
      'categories', 'products', 'stock_movements', 'stock_alerts',
      'orders', 'order_items', 'site_content', 'invoices',
      'invoice_items', 'quotes', 'quote_items', 'services'
    ];

    for (const table of requiredTables) {
      if (!health[table] || !health[table].exists) {
        console.log(`❌ Table ${table} manquante`);
        return false;
      }
      console.log(`✅ Table ${table} existe (${health[table].count} enregistrements)`);
    }

    console.log('=============================');
    return true;
  } catch (error) {
    console.error('❌ Exception lors de la vérification des tables:', error);
    return false;
  }
}