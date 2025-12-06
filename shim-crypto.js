
// Este archivo se ejecuta ANTES que Vite para asegurar que el entorno tenga las funciones criptográficas necesarias.
const crypto = require('crypto');

if (typeof global.crypto === 'undefined') {
  global.crypto = {};
}

if (typeof global.crypto.getRandomValues === 'undefined') {
  global.crypto.getRandomValues = function(arr) {
    return crypto.randomFillSync(arr);
  };
}
