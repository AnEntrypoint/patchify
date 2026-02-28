import { serve } from 'bun';
import { join } from 'path';
import { storage } from './storage.js';
import { FACTORY_PRESETS } from '../shared/synth-engine.js';
import { parseSysexMessage, buildDumpRequest, hexToBytes } from '../shared/sysex.js';
import { normalize } from '../shared/patch-schema.js';

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = join(process.cwd(), 'frontend');
const SERVER_STARTUP = new Date().toISOString();

// WebSocket connection manager
const wsConnections = new Set();

function broadcastToClients(data) {
  const message = JSON.stringify(data);
  wsConnections.forEach((ws) => {
    try {
      ws.send(message);
    } catch (err) {
      console.error('Failed to send to WebSocket:', err);
    }
  });
}

// Clean up closed WebSocket connections
function cleanupWS() {
  for (const ws of wsConnections) {
    if (ws.readyState !== WebSocket.OPEN) {
      wsConnections.delete(ws);
    }
  }
}

// Define server with Bun's serve
const server = serve({
  port: PORT,
  development: process.env.NODE_ENV === 'development',

  async fetch(req) {
    const url = new URL(req.url);
    console.log('FETCH:', req.method, url.pathname);
    if (url.pathname === '/api/sysex/request') {
      console.log('🚀 API SYSEX REQUEST ENDPOINT HIT');
      return new Response(JSON.stringify({ TEST: 'IMMEDIATE RETURN', marker: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    cleanupWS();

    // API Routes
    if (url.pathname.startsWith('/api')) {
      await Bun.write('/tmp/api-debug.txt', `path=${url.pathname}\nmethod=${req.method}\n`, { append: true });
      try {
        // GET /api/patches - list all user patches
        if (url.pathname === '/api/patches' && req.method === 'GET') {
          const patches = await storage.listPatches();
          return new Response(JSON.stringify({ patches }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // GET /api/patches/:name - get specific patch
        const patchMatch = url.pathname.match(/^\/api\/patches\/([^/]+)$/);
        if (patchMatch && req.method === 'GET') {
          const name = decodeURIComponent(patchMatch[1]);
          const patch = await storage.getPatch(name);
          if (!patch) {
            return new Response(JSON.stringify({ error: 'Patch not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ patch }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // POST /api/patches - create or update patch
        if (url.pathname === '/api/patches' && req.method === 'POST') {
          const body = await req.json();
          if (!body.name) {
            return new Response(JSON.stringify({ error: 'Patch name required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          const normalized = normalize(body);
          const success = await storage.savePatch(normalized);
          if (success) {
            broadcastToClients({ type: 'patch:saved', name: body.name });
            return new Response(JSON.stringify({ success: true, name: body.name }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ error: 'Failed to save patch' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // PUT /api/patches/:name - rename patch
        const putMatch = url.pathname.match(/^\/api\/patches\/([^/]+)$/);
        if (putMatch && req.method === 'PUT') {
          const oldName = decodeURIComponent(putMatch[1]);
          const body = await req.json();
          const newName = body.newName;
          if (!newName) {
            return new Response(JSON.stringify({ error: 'newName required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          const success = await storage.renamePatch(oldName, newName);
          if (success) {
            broadcastToClients({ type: 'patch:renamed', oldName, newName });
            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ error: 'Failed to rename patch' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // DELETE /api/patches/:name
        const deleteMatch = url.pathname.match(/^\/api\/patches\/([^/]+)$/);
        if (deleteMatch && req.method === 'DELETE') {
          const name = decodeURIComponent(deleteMatch[1]);
          const success = await storage.deletePatch(name);
          if (success) {
            broadcastToClients({ type: 'patch:deleted', name });
            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ error: 'Failed to delete patch' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // GET /api/order - get patch order
        if (url.pathname === '/api/order' && req.method === 'GET') {
          const order = await storage.readOrder();
          return new Response(JSON.stringify({ order }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // PUT /api/order - set patch order
        if (url.pathname === '/api/order' && req.method === 'PUT') {
          const body = await req.json();
          const success = await storage.reorderPatches(body.order || []);
          if (success) {
            broadcastToClients({ type: 'order:changed', order: body.order });
            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ error: 'Failed to update order' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // GET /api/presets - list factory presets
        if (url.pathname === '/api/presets' && req.method === 'GET') {
          return new Response(JSON.stringify({ presets: Object.keys(FACTORY_PRESETS) }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // GET /api/preset/:name - get factory preset
        const presetMatch = url.pathname.match(/^\/api\/preset\/([^/]+)$/);
        if (presetMatch && req.method === 'GET') {
          const name = decodeURIComponent(presetMatch[1]);
          const preset = FACTORY_PRESETS[name];
          if (!preset) {
            return new Response(JSON.stringify({ error: 'Preset not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ patch: preset }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // POST /api/sysex/decode - decode SysEx hex string
        if (url.pathname === '/api/sysex/decode' && req.method === 'POST') {
          try {
            const body = await req.json();
            const hex = body.hex || body.data;
            if (!hex) {
              return new Response(JSON.stringify({ error: 'hex data required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            const bytes = hexToBytes(hex);
            const patches = parseSysexMessage(bytes);

            // Handle single patch or array of patches
            if (Array.isArray(patches)) {
              return new Response(JSON.stringify({ patches }), {
                headers: { 'Content-Type': 'application/json' },
              });
            } else {
              return new Response(JSON.stringify({ patch: patches }), {
                headers: { 'Content-Type': 'application/json' },
              });
            }
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }

        // GET /api/sysex/request - get dump request bytes for microKORG S
        if (url.pathname === '/api/sysex/request' && req.method === 'GET') {
          return new Response('INVALID JSON FROM SERVER CODE', {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    }

    // Static file serving (serve frontend/ directly)
    const pathWithoutLeadingSlash = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    let filePath = join(FRONTEND_DIR, url.pathname === '/' ? 'index.html' : pathWithoutLeadingSlash);

    let mimeType = 'application/octet-stream';

    // Set MIME types based on extension
    if (filePath.endsWith('.html')) mimeType = 'text/html';
    else if (filePath.endsWith('.js')) mimeType = 'text/javascript';
    else if (filePath.endsWith('.css')) mimeType = 'text/css';
    else if (filePath.endsWith('.json')) mimeType = 'application/json';

    // Check if file exists
    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        // Add cache-busting headers for JS files
        const headers = { 'Content-Type': mimeType };
        if (filePath.endsWith('.js')) {
          headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          headers['Pragma'] = 'no-cache';
          headers['Expires'] = '0';
        }
        return new Response(file, { headers });
      }
    } catch (err) {
      // Continue to fallback
    }

    // SPA fallback: only serve index.html for non-file routes (no dots in pathname)
    if (!url.pathname.includes('.')) {
      try {
        const indexPath = join(FRONTEND_DIR, 'index.html');
        const indexFile = Bun.file(indexPath);
        if (await indexFile.exists()) {
          return new Response(indexFile, {
            headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
          });
        }
      } catch (err) {
        // Continue
      }
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`💾 PATCHIFY SERVER STARTED ON http://localhost:${PORT}`);
console.log('✅ Timestamp: ' + new Date().toISOString());
console.log('WebSocket endpoint available at ws://localhost:' + PORT + '/ws');
