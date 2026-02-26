#!/usr/bin/env python3
"""
Test script to verify Open-microKORG functionality
"""

import sys
import os
import traceback
from pathlib import Path

# Add Open-microKORG to Python path
sys.path.insert(0, str(Path(__file__).parent / "Open-microKORG"))

def test_open_microkorg_import():
    """Test importing the Open-microKORG library"""
    try:
        import microkorg
        from microkorg.synthesizer import Program
        from microkorg.filetypes import Prg, SysEx
        
        print("✅ Open-microKORG library imported successfully")
        print(f"   - microkorg module version: {getattr(microkorg, '__version__', 'Unknown')}")
        print(f"   - Program class available: {Program is not None}")
        print(f"   - File handlers available: Prg={Prg is not None}, SysEx={SysEx is not None}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to import Open-microKORG: {str(e)}")
        print(traceback.format_exc())
        return False

def test_file_reading():
    """Test reading sample patch files"""
    try:
        from microkorg.filetypes import Prg, SysEx
        from microkorg import filetypes
        
        # Test PRG file reading
        prg_path = Path(__file__).parent / "Open-microKORG" / "dumps" / "stranger_things.prg"
        if prg_path.exists():
            prg_files = Prg().read(prg_path)
            if prg_files:
                program = prg_files[0]
                print("✅ PRG file reading tested successfully")
                print(f"   - Patch name: {program.name}")
                print(f"   - Voice mode: {program.voice_mode}")
        
        # Test SYSEX file reading
        sysex_path = Path(__file__).parent / "Open-microKORG" / "dumps" / "original-p_a11.syx"
        if sysex_path.exists():
            sysex_files = SysEx().read(sysex_path)
            if sysex_files:
                program = sysex_files[0]
                print("✅ SYSEX file reading tested successfully")
                print(f"   - Patch name: {program.name}")
                print(f"   - Voice mode: {program.voice_mode}")
        
        return True
    except Exception as e:
        print(f"❌ File reading test failed: {str(e)}")
        print(traceback.format_exc())
        return False

def test_program_encoding_decoding():
    """Test encoding and decoding patches"""
    try:
        from microkorg.synthesizer import Program
        from microkorg.filetypes import Text
        
        # Create a new program instance
        program = Program()
        
        # Modify some parameters
        program.name = "Test Patch"
        program.voice_mode = 0  # Single
        program.kbd_octave = 0
        program.arpeggio_onoff = False
        program.arpeggio_type = 0
        
        # Test converting to text format
        text = Text().encode(program)
        if text:
            print("✅ Program encoding tested successfully")
            print(f"   - Text encoding length: {len(text)} characters")
        
        return True
    except Exception as e:
        print(f"❌ Program encoding test failed: {str(e)}")
        print(traceback.format_exc())
        return False

def test_text_formatting():
    """Test text formatting of patches"""
    try:
        from microkorg.filetypes import Prg, Text
        
        # Read a sample patch
        prg_path = Path(__file__).parent / "Open-microKORG" / "dumps" / "stranger_things.prg"
        if prg_path.exists():
            programs = Prg().read(prg_path)
            if programs:
                program = programs[0]
                text = Text().encode(program)
                print("✅ Text formatting tested successfully")
                print(f"   - Patch preview:\n{text[:200]}...")
        
        return True
    except Exception as e:
        print(f"❌ Text formatting test failed: {str(e)}")
        print(traceback.format_exc())
        return False

def main():
    """Run all tests"""
    print("Testing Open-microKORG integration...")
    print("=" * 50)
    
    tests = [
        test_open_microkorg_import,
        test_file_reading,
        test_program_encoding_decoding,
        test_text_formatting
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed unexpectedly: {str(e)}")
            print(traceback.format_exc())
            results.append(False)
    
    print("\n" + "=" * 50)
    print(f"Test Results: {sum(results)} out of {len(results)} passed")
    
    if all(results):
        print("\n✅ All tests passed! Open-microKORG integration is working correctly")
    else:
        print("\n❌ Some tests failed. Please check the error messages.")
    
    return sum(results) == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
