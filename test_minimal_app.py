#!/usr/bin/env python3
"""
Minimal Flask app for testing
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
    print("Starting minimal API server...")
    app.run(host="0.0.0.0", port=8000, debug=True)
