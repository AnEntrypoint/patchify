import { serve } from 'bun';
import { join } from 'path';
import { storage } from './storage.js';
import { FACTORY_PRESETS } from '../shared/synth-engine.js';

const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = join(process.cwd(), 'frontend', 'dist');

const wsConnections = new Set();

function broadcastToClients(data) {
  const message = JSON.stringify(data);
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function cleanupWS() {
  for (const ws of wsConnections) {
    if (ws.readyState !== WebSocket.OPEN) {
      wsConnections.delete(ws);
    }
  }
}

const server = serve({
  port: PORT,
  development: process.env.NODE_ENV === 'development',

  async fetch(req) {
    const url = new URL(req.url);
    cleanupWS();

    if (url.pathname.startsWith('/api')) {
      try {
        if (url.pathname === '/api/patches' && req.method === 'GET') {
          const patches = await storage.listPatches();
          return new Response(JSON.stringify({ patches }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

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

        if (url.pathname === '/api/patches' && req.method === 'POST') {
          const body = await req.json();
          if (!body.name) {
            return new Response(JSON.stringify({ error: 'Patch name required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          const success = await storage.savePatch(body);
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

        if (url.pathname === '/api/presets' && req.method === 'GET') {
          return new Response(JSON.stringify({ presets: Object.keys(FACTORY_PRESETS) }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

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
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    }

    if (url.pathname === '/ws' && req.headers.get('upgrade') === 'websocket') {
      const { socket, response } = req.upgrade();
      wsConnections.add(socket);

      socket.onopen = () => {
        console.log('WebSocket client connected');
        socket.send(JSON.stringify({ type: 'connected', message: 'WebSocket ready' }));
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'midi') {
            console.log('MIDI from browser:', data.midi);
            broadcastToClients({ type: 'midi', midi: data.midi });
          } else if (data.type === 'noteOn' || data.type === 'noteOff') {
            console.log(`Note ${data.type}:`, data.note, data.velocity);
          }
        } catch (err) {
          console.error('Invalid WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        wsConnections.delete(socket);
        console.log('WebSocket client disconnected');
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        wsConnections.delete(socket);
      };

      return response;
    }

    let filePath = join(FRONTEND_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

    try {
      await Bun.file(filePath).stats();
      return Bun.file(filePath);
    } catch {
      const indexPath = join(FRONTEND_DIR, 'index.html');
      try {
        return Bun.file(indexPath);
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }
  },
});

console.log(`Patchify server running on http://localhost:${PORT}`);
console.log('WebSocket endpoint available at ws://localhost:' + PORT + '/ws');