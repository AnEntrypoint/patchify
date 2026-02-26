#!/usr/bin/env python3
"""
Simple API test script
"""

import requests
import time

BASE_URL = "http://localhost:8000/api"

def test_api_endpoints():
    """Test all available API endpoints"""
    print("Testing Patchify API endpoints...")
    print("=" * 50)
    
    # Test patches endpoint
    try:
        print("\n1. Testing patches endpoint...")
        response = requests.get(f"{BASE_URL}/patches", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    # Test search endpoint
    try:
        print("\n2. Testing search endpoint...")
        response = requests.get(f"{BASE_URL}/search?q=test", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    # Test MIDI endpoints
    try:
        print("\n3. Testing MIDI endpoints...")
        response = requests.get(f"{BASE_URL}/midi/devices", timeout=5)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Response: Success={data.get('success')}")
        print(f"   Input devices: {len(data.get('data', {}).get('inputs', []))}")
        print(f"   Output devices: {len(data.get('data', {}).get('outputs', []))}")
        assert response.status_code == 200
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    # Test MIDI status
    try:
        print("\n4. Testing MIDI status...")
        response = requests.get(f"{BASE_URL}/midi/status", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        assert response.status_code == 200
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("API testing completed!")

if __name__ == "__main__":
    print("Waiting for server to start...")
    time.sleep(2)
    test_api_endpoints()
