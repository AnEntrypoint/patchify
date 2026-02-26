#!/usr/bin/env python3
"""
Wait and test API script
"""

import sys
import time
import requests

BASE_URL = "http://localhost:8000/api"

def wait_for_server(timeout=30):
    """Wait for server to become available"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{BASE_URL}/patches", timeout=2)
            if response.status_code == 200:
                return True
        except Exception:
            pass
        time.sleep(2)
    return False

def test_api():
    """Test all API endpoints"""
    print("Testing Patchify API...")
    
    if not wait_for_server():
        print("❌ Server not available")
        return False
    
    print("✅ Server is running")
    
    tests = [
        ("patches", "GET", "/patches"),
        ("search", "GET", "/search?q=test"),
        ("midi devices", "GET", "/midi/devices"),
        ("midi status", "GET", "/midi/status")
    ]
    
    all_passed = True
    for name, method, endpoint in tests:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", timeout=5)
            
            print(f"\n✅ {name}: {response.status_code}")
            if response.text:
                print(f"   Response: {response.text[:200]}")
            
        except Exception as e:
            print(f"\n❌ {name}: {str(e)}")
            all_passed = False
    
    return all_passed

if __name__ == "__main__":
    if test_api():
        print("\n🎉 All API tests passed!")
        print("\n📱 Frontend is available at http://localhost:3000 (run 'cd frontend && npm run dev')")
        print("\n🌐 Backend is available at http://localhost:8000")
    else:
        print("\n❌ Some tests failed")
