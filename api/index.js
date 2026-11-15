import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const handle = require('../server/api_server.cjs');

export default function handler(req, res) {
  return handle(req, res);
}
