// Minimal test server - only handles /api/sysex/request
import { serve } from 'bun';

console.log('🧪 TEST SERVER STARTING...');

const server = serve({
  port: 3002,
  async fetch(req) {
    const url = new URL(req.url);
    console.log('📍 Request:', req.method, url.pathname);

    if (url.pathname === '/api/sysex/request' && req.method === 'GET') {
      console.log('✅ Sysex request handled!');
      const response = '{"hex":"F0 42 30 58 41 F7"}';
      console.log('📤 Returning:', response);
      return new Response(response, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'test server ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
});

console.log(`🧪 Test server running on http://localhost:3002`);
