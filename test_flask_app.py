#!/usr/bin/env python3
"""
Test script with correct Python path configuration
"""

import sys
from pathlib import Path

# Add project root and src directory to Python path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "src"))

def test_flask_app():
    """Test creating and running the Flask app"""
    try:
        print("Creating Flask app...")
        from src.backend.server import create_app
        app = create_app()
        
        print("App created successfully!")
        print(f"App name: {app.name}")
        
        # Test app context
        with app.app_context():
            print("App context created successfully")
            
            # Test patch manager
            from src.backend.patch_manager import PatchManager
            pm = PatchManager()
            print(f"Patch manager: {pm}")
            print(f"Library file: {pm.library_file}")
            print(f"Patches count: {len(pm.patches)}")
            
            # Test MIDI controller
            from src.backend.midi_controller import MIDIController
            midi = MIDIController()
            print(f"MIDI controller: {midi}")
            devices = midi.get_available_devices()
            print(f"Input devices: {len(devices['inputs'])}")
            print(f"Output devices: {len(devices['outputs'])}")
        
        print("\n✅ Flask app is working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    test_flask_app()
