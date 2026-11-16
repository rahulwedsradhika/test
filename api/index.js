import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dispatch = require('../server/api_server.cjs');

// Reuse the verified local Node HTTP API without starting a TCP listener.
export default function handler(req, res) {
  return dispatch(req, res);
}
