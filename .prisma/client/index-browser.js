// Stub pour .prisma/client/index-browser
console.warn('Prisma client stub loaded - frontend should not use Prisma');

export const PrismaClient = class {
  constructor() {
    console.warn('PrismaClient cannot be used in browser');
    return new Proxy({}, {
      get() { return () => Promise.resolve([]); }
    });
  }
};

export default { PrismaClient };