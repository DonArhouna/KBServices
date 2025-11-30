// Stub pour remplacer Prisma côté frontend
export const PrismaClient = class {
  constructor() {
    throw new Error('Prisma ne peut pas être utilisé côté frontend');
  }
};

export default {
  PrismaClient
};