#!/usr/bin/env python3
"""
Simple HTTP server test
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/test':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "API is working!"}).encode())
        elif self.path == '/api/patches':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "data": []}).encode())
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "Not found"}).encode())

def run_server():
    server_address = ('127.0.0.1', 8080)
    httpd = HTTPServer(server_address, SimpleHandler)
    print(f"Server running on http://127.0.0.1:8080")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
