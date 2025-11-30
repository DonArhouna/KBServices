// Stub pour remplacer Prisma côté frontend
console.warn('Prisma import détecté côté frontend - utilisation du stub');

export const PrismaClient = class {
  constructor() {
    console.warn('PrismaClient ne peut pas être utilisé côté frontend');
    return {};
  }
};

// Exports par défaut pour tous les cas possibles
export default {
  PrismaClient
};

// Export nommés pour compatibilité
export * from './prisma-stub';

// Stub pour index-browser spécifiquement
if (typeof window !== 'undefined') {
  console.log('Stub Prisma chargé côté navigateur');
}