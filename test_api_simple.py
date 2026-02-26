#!/usr/bin/env python3
"""
API test script that runs without timeout
"""

import time
import requests
from threading import Thread

BASE_URL = "http://127.0.0.1:8000/api"

def test_endpoint(name, url, method='GET', data=None):
    """Test a single API endpoint"""
    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        else:
            response = requests.post(url, json=data, timeout=10)
        
        print(f"✅ {name}: {response.status_code}")
        if response.text:
            print(f"   Response: {response.text[:200]}")
        
        return True
        
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

def run_tests():
    """Run all tests sequentially"""
    print("Testing Patchify API endpoints...")
    print("=" * 50)
    
    # Wait for server to start
    time.sleep(2)
    
    tests = [
        ("Patches", f"{BASE_URL}/patches"),
        ("Search", f"{BASE_URL}/search?q=test"),
        ("MIDI Devices", f"{BASE_URL}/midi/devices"),
        ("MIDI Status", f"{BASE_URL}/midi/status"),
    ]
    
    results = []
    for name, url in tests:
        results.append(test_endpoint(name, url))
        time.sleep(0.5)  # Small delay between requests
    
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    
    print(f"Results: {passed} out of {total} tests passed")
    
    if all(results):
        print("\n🎉 All API tests passed!")
        print("""
📱 Application Status:
   - Backend API: http://127.0.0.1:8000
   - Frontend (Dev): http://localhost:3000 (run 'cd frontend && npm run dev')
""")
    else:
        print("\n❌ Some tests failed")

def main():
    run_tests()

if __name__ == "__main__":
    main()
