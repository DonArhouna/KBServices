// Configuration Prisma uniquement - Plus de Supabase
import { PrismaClient, Prisma } from '@prisma/client';

// Instance Prisma globale
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Type for SiteContentDB
export type SiteContentDB = {
  section: string;
  field: string;
  value: string;
};

// Function to check if a table exists
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    await prisma.$queryRaw(Prisma.sql`SELECT 1 FROM ${tableName} LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

// Function to check if error is a PostgrestError (maintenu pour compatibilité)
export function isPostgrestError(error: unknown): error is { code: string; message: string } {
  return error !== null && typeof error === 'object' && 'code' in error && 'message' in error;
}

// Exporter le client Prisma comme 'supabase' pour compatibilité
export const supabase = prisma;

// Log de l'environnement pour debug
console.log('Prisma environment setup:', {
  nodeEnv: process.env.NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  clientUsed: 'Prisma'
});
