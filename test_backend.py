#!/usr/bin/env python3
"""
Test script to verify the Flask backend API
"""

import sys
import os
import subprocess
import time
import requests

def test_backend_startup():
    """Test if the Flask backend can start successfully"""
    try:
        print("Testing backend startup...")
        
        # Start backend in background
        backend_process = subprocess.Popen([
            sys.executable, "src/main.py", "--dev", "--port", "5001"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Wait for backend to start
        time.sleep(2)
        
        # Check if process is still running
        if backend_process.poll() is not None:
            stdout, stderr = backend_process.communicate(timeout=1)
            print(f"❌ Backend failed to start:")
            print(f"   stdout: {stdout}")
            print(f"   stderr: {stderr}")
            return False
        
        # Test basic API endpoint
        try:
            response = requests.get("http://localhost:5001/api/patches", timeout=5)
            if response.status_code == 200:
                print("✅ Backend API test passed")
                data = response.json()
                print(f"   - API response: {data.get('success', False)}")
                print(f"   - Number of patches: {len(data.get('data', []))}")
            else:
                print(f"❌ API request failed with status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
        
        except requests.exceptions.RequestException as e:
            print(f"❌ API connection failed: {str(e)}")
            return False
        
        finally:
            # Terminate the backend process
            backend_process.terminate()
            try:
                backend_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                backend_process.kill()
        
        return True
        
    except Exception as e:
        print(f"❌ Backend startup test failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def test_data_directory_creation():
    """Test if data directories are created properly"""
    try:
        print("Testing data directory creation...")
        
        from src.backend.patch_manager import PatchManager
        
        manager = PatchManager()
        
        # Check if data directories exist
        data_dir = manager.data_dir
        patches_dir = manager.patches_dir
        
        directories_exist = all(dir_path.exists() for dir_path in [data_dir, patches_dir])
        
        if directories_exist:
            print("✅ Data directories created successfully")
            print(f"   - Data dir: {data_dir}")
            print(f"   - Patches dir: {patches_dir}")
        else:
            print("❌ Data directories not created properly")
            if not data_dir.exists():
                print(f"   - Data dir {data_dir} does not exist")
            if not patches_dir.exists():
                print(f"   - Patches dir {patches_dir} does not exist")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Data directory test failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def test_library_initialization():
    """Test if patch library is initialized correctly"""
    try:
        print("Testing patch library initialization...")
        
        from src.backend.patch_manager import PatchManager
        
        manager = PatchManager()
        
        # Check library file existence
        if manager.library_file.exists():
            print("✅ Patch library initialized successfully")
            print(f"   - Library file: {manager.library_file}")
            print(f"   - Current patches: {len(manager.patches)}")
        else:
            print("❌ Library file not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Library initialization test failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def test_midi_controller_import():
    """Test if MIDI controller can be imported"""
    try:
        print("Testing MIDI controller import...")
        
        from src.backend.midi_controller import MIDIController
        
        controller = MIDIController()
        print("✅ MIDI controller imported successfully")
        print(f"   - Connected: {controller.connected}")
        
        # Test getting available MIDI devices (should handle errors gracefully)
        devices = controller.get_available_devices()
        print(f"   - Input devices: {len(devices['inputs'])}")
        print(f"   - Output devices: {len(devices['outputs'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ MIDI controller test failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def main():
    """Run all backend tests"""
    print("Testing Patchify backend API...")
    print("=" * 50)
    
    tests = [
        test_data_directory_creation,
        test_library_initialization,
        test_midi_controller_import,
        test_backend_startup
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
            print()  # Empty line for readability
        except Exception as e:
            print(f"❌ Test failed unexpectedly: {str(e)}")
            import traceback
            print(traceback.format_exc())
            results.append(False)
    
    print("=" * 50)
    print(f"Test Results: {sum(results)} out of {len(results)} passed")
    
    if all(results):
        print("\n✅ All backend tests passed! The API is ready to use")
    else:
        print("\n❌ Some tests failed. Please check the error messages.")
    
    return sum(results) == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
