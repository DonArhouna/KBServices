
// Ce fichier est maintenant adapté pour Prisma au lieu de Supabase local
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Fonction pour déterminer si on est en développement local (toujours true pour Prisma)
export const isLocalDevelopment = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

// Exporter prisma comme client local pour la compatibilité
export const supabaseLocal = prisma;

// Fonction helper pour obtenir le client (toujours Prisma maintenant)
export const getSupabaseClient = () => {
  return prisma;
};
