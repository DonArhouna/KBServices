// Import de l'instance Prisma depuis supabase.ts (qui est maintenant Prisma uniquement)
import { supabase } from './supabase';
import { PrismaClient } from '@prisma/client';

// Exporter l'instance Prisma pour la compatibilité
export const prisma = supabase as PrismaClient;

// Fonction pour vérifier la configuration Prisma
export const isPrismaConfigured = (): boolean => {
  try {
    // Dans le navigateur, on ne peut pas accéder à process.env directement
    // On vérifie plutôt si l'instance Prisma est disponible
    return Boolean(prisma);
  } catch (error) {
    console.error('Erreur lors de la vérification de la configuration Prisma:', error);
    return false;
  }
};

// Fonction pour vérifier si les tables existent via l'API
export async function checkPrismaTablesExist(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/health/tables');
    if (!response.ok) {
      console.error('Erreur lors de la vérification des tables:', response.statusText);
      return false;
    }

    const results = await response.json();
    console.log('=== VÉRIFICATION DES TABLES PRISMA ===');
    console.log(results);

    // Vérifier que toutes les tables existent
    const requiredTables = [
      'categories', 'products', 'stock_movements', 'stock_alerts',
      'orders', 'order_items', 'site_content', 'invoices',
      'invoice_items', 'quotes', 'quote_items', 'services'
    ];

    for (const table of requiredTables) {
      if (!results[table] || !results[table].exists) {
        console.log(`❌ Table ${table} manquante`);
        return false;
      }
      console.log(`✅ Table ${table} existe (${results[table].count} enregistrements)`);
    }

    console.log('=============================');
    return true;
  } catch (error) {
    console.error('❌ Exception lors de la vérification des tables:', error);
    return false;
  }
}

// Fonction pour vérifier si une table spécifique existe
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/health/tables');
    if (!response.ok) {
      return false;
    }

    const results = await response.json();
    return results[tableName] && results[tableName].exists;
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification de la table ${tableName}:`, error);
    return false;
  }
}
