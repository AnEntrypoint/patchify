#!/usr/bin/env python3
"""
Patchify - microKORG Patch Library Editor

A comprehensive tool for managing microKORG patches:
- Import patches from microKORG via MIDI
- Export patches to microKORG via MIDI
- Organize and edit patches locally
- Save patches as SYSEX or PRG files
- Browse and search patch library
- Intelligent sorting and filtering

Usage:
    python main.py [--dev] [--port PORT] [--host HOST]

Options:
    --dev        Run in development mode
    --port PORT  Port number (default: 5000)
    --host HOST  Host address (default: 127.0.0.1)
"""

import argparse
import os
import sys
import logging
from pathlib import Path

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from backend.server import create_app

def main():
    parser = argparse.ArgumentParser(
        description="Patchify - microKORG Patch Library Editor"
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Run in development mode"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5000,
        help="Port number (default: 5000)"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host address (default: 127.0.0.1)"
    )
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG if args.dev else logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    
    logger = logging.getLogger(__name__)
    logger.info("Starting Patchify...")
    
    # Create and run the Flask app
    app = create_app()
    
    logger.info(f"Server starting on {args.host}:{args.port}")
    logger.info("Visit http://localhost:5000 to access the Patchify web interface")
    
    app.run(
        host=args.host,
        port=args.port,
        debug=args.dev
    )

if __name__ == "__main__":
    main()
