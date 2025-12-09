import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Proxy entry: load the backend located at ../mrsalad-backend/index.js
require('../mrsalad-backend/index.js');
