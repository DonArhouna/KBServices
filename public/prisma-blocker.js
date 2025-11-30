// Bloquer complètement Prisma au niveau du navigateur
(function() {
  'use strict';
  
  // Intercepter les imports ES6
  const originalImport = window.import || function() {};
  window.import = function(specifier) {
    if (specifier && specifier.includes('prisma')) {
      console.warn('Blocked Prisma import:', specifier);
      return Promise.resolve({});
    }
    return originalImport.apply(this, arguments);
  };
  
  // Intercepter require si présent
  if (typeof require !== 'undefined') {
    const originalRequire = require;
    require = function(id) {
      if (id && id.includes('prisma')) {
        console.warn('Blocked Prisma require:', id);
        return {};
      }
      return originalRequire.apply(this, arguments);
    };
  }
  
  console.log('Prisma blocker loaded');
})();