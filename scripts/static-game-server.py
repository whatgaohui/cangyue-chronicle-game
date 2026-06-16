#!/usr/bin/env python3
"""Lightweight static file server for the game."""
import http.server
import os
from pathlib import Path

# 以脚本所在目录的父目录（项目根）作为基准
BASE_DIR = Path(__file__).resolve().parent.parent
NEXT_STATIC = BASE_DIR / '.next' / 'static'
NEXT_SERVER = BASE_DIR / '.next' / 'server' / 'app'
PUBLIC_DIR = BASE_DIR / 'public'
PORT = 3000

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.map': 'application/json',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
}

class GameHandler(http.server.BaseHTTPRequestHandler):
    def get_content_type(self, filepath):
        ext = Path(filepath).suffix.lower()
        return MIME_TYPES.get(ext, 'application/octet-stream')
    
    def serve_file(self, filepath):
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', self.get_content_type(filepath))
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
        except Exception as e:
            self.send_error(500, str(e))
    
    def do_GET(self):
        path = self.path.split('?')[0]
        
        if path == '/':
            self.serve_file(NEXT_SERVER / 'index.html')
            return
        
        if path.startswith('/_next/static/'):
            filepath = BASE_DIR / '.next' / path.replace('/_next/', '', 1)
            if filepath.exists():
                self.serve_file(filepath)
                return
            self.send_error(404)
            return
        
        if path.startswith('/icons/'):
            filepath = PUBLIC_DIR / path.lstrip('/')
            if filepath.exists():
                self.serve_file(filepath)
                return
        
        if path.startswith('/_next/data/') or path.startswith('/_next/image'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{}')
            return
        
        if path.startswith('/api/'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{}')
            return
        
        if path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        
        if path.startswith('/_next/'):
            filepath = BASE_DIR / '.next' / path.replace('/_next/', '', 1)
            if filepath.exists() and filepath.is_file():
                self.serve_file(filepath)
                return
        
        public_path = PUBLIC_DIR / path.lstrip('/')
        if public_path.exists() and public_path.is_file():
            self.serve_file(public_path)
            return
        
        self.serve_file(NEXT_SERVER / 'index.html')
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), GameHandler)
    print(f'Static game server on port {PORT}')
    server.serve_forever()
