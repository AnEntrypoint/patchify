#!/usr/bin/env python3
"""
Minimal Flask app for testing on different port
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return "Patchify API"

@app.route("/api/test")
def test():
    return jsonify({"success": True, "message": "API is working!"})

@app.route("/api/patches")
def patches():
    return jsonify({"success": True, "data": []})

if __name__ == "__main__":
    print("Starting minimal API server on port 8080...")
    app.run(host="127.0.0.1", port=8080, debug=True)
