"""
MIDI Controller - Handles MIDI communication with microKORG

Responsible for:
- Detecting and connecting to MIDI devices
- Importing patches from microKORG via MIDI SYSEX
- Exporting patches to microKORG via MIDI SYSEX
- Managing MIDI connection status
- Handling SYSEX message parsing and construction
"""

import time
import logging
import threading
from typing import List, Dict, Optional, Any
import rtmidi
from rtmidi.midiutil import open_midioutput, open_midiinput

class MIDIController:
    """Controller for MIDI communication with microKORG"""
    
    # microKORG SYSEX constants
    SYSEX_HEADER = [0xF0, 0x42, 0x30, 0x58]
    SYSEX_FOOTER = [0xF7]
    
    # Function codes
    FUNCTIONS = {
        "CURRENT_PROGRAM_REQUEST": 0x10,
        "PROGRAM_REQUEST": 0x1C,
        "GLOBAL_REQUEST": 0x0E,
        "ALL_DATA_REQUEST": 0x0F,
        
        "CURRENT_PROGRAM_DUMP": 0x40,
        "PROGRAM_DUMP": 0x4C,
        "GLOBAL_DUMP": 0x51,
        "ALL_DATA_DUMP": 0x50,
        
        "PROGRAM_WRITE": 0x11
    }
    
    # Program addressing constants
    BANK_SIZE = 64
    PROGRAMS_PER_BANK = 8
    TOTAL_PROGRAMS = 128
    
    def __init__(self):
        """Initialize MIDI controller"""
        self.logger = logging.getLogger(__name__)
        self.input_port = None
        self.output_port = None
        self.input_device = None
        self.output_device = None
        self.connected = False
        self.received_data = []
        self.receive_lock = threading.Lock()
    
    def get_available_devices(self) -> Dict:
        """Get available MIDI input and output devices"""
        try:
            midi_in = rtmidi.MidiIn()
            midi_out = rtmidi.MidiOut()
            
            inputs = []
            for i, name in enumerate(midi_in.get_ports()):
                if "microKORG" in name or "micro KORG" in name:
                    inputs.append({"id": i, "name": name})
            
            outputs = []
            for i, name in enumerate(midi_out.get_ports()):
                if "microKORG" in name or "micro KORG" in name:
                    outputs.append({"id": i, "name": name})
            
            # If no microKORG-specific devices found, return all available
            if not inputs:
                for i, name in enumerate(midi_in.get_ports()):
                    inputs.append({"id": i, "name": name})
            
            if not outputs:
                for i, name in enumerate(midi_out.get_ports()):
                    outputs.append({"id": i, "name": name})
            
            return {"inputs": inputs, "outputs": outputs}
        
        except Exception as e:
            self.logger.error(f"Error getting MIDI devices: {str(e)}")
            return {"inputs": [], "outputs": []}
    
    def connect(self, input_device: int = None, output_device: int = None) -> bool:
        """Connect to MIDI devices"""
        try:
            self.disconnect()  # Disconnect existing connections
            
            devices = self.get_available_devices()
            
            # Auto-detect microKORG devices if not specified
            if input_device is None:
                input_device = devices["inputs"][0]["id"] if devices["inputs"] else None
            
            if output_device is None:
                output_device = devices["outputs"][0]["id"] if devices["outputs"] else None
            
            if input_device is not None:
                self.input_port, self.input_device = open_midiinput(input_device)
                self.input_port.set_callback(self._midi_receive_callback)
                self.logger.info(f"Connected to MIDI input: {self.input_device}")
            
            if output_device is not None:
                self.output_port, self.output_device = open_midioutput(output_device)
                self.logger.info(f"Connected to MIDI output: {self.output_device}")
            
            self.connected = True
            self.logger.info("Successfully connected to microKORG via MIDI")
            return True
        
        except Exception as e:
            self.logger.error(f"MIDI connection failed: {str(e)}")
            self.disconnect()
            return False
    
    def disconnect(self):
        """Disconnect from MIDI devices"""
        try:
            if self.input_port:
                self.input_port.close_port()
                del self.input_port
                self.input_port = None
            
            if self.output_port:
                self.output_port.close_port()
                del self.output_port
                self.output_port = None
            
            self.connected = False
            self.logger.info("Disconnected from MIDI devices")
        
        except Exception as e:
            self.logger.error(f"Error disconnecting from MIDI: {str(e)}")
    
    def get_status(self) -> Dict:
        """Get current MIDI connection status"""
        return {
            "connected": self.connected,
            "input_device": self.input_device,
            "output_device": self.output_device
        }
    
    def import_patches(self) -> int:
        """Import all patches from microKORG"""
        if not self.connected:
            raise Exception("Not connected to MIDI")
        
        patches_imported = 0
        
        try:
            # Import all 128 programs
            for program_index in range(self.TOTAL_PROGRAMS):
                program_code = self._index_to_program_code(program_index)
                patch = self._import_single_patch(program_index)
                
                if patch:
                    patches_imported += 1
                    self.logger.info(f"Imported patch {program_code}")
                
                # Small delay between requests
                time.sleep(0.1)
            
            return patches_imported
        
        except Exception as e:
            self.logger.error(f"Patch import failed: {str(e)}")
            raise
    
    def export_patches(self, patch_ids: List[int]) -> int:
        """Export patches to microKORG"""
        if not self.connected:
            raise Exception("Not connected to MIDI")
        
        patches_exported = 0
        
        try:
            for patch_id in patch_ids:
                # Get patch from library (would implement this)
                patch = self._get_patch_from_library(patch_id)
                
                if patch:
                    program_index = self._get_program_index_for_patch(patch)
                    program_code = self._index_to_program_code(program_index)
                    self._export_single_patch(program_index, patch)
                    patches_exported += 1
                    self.logger.info(f"Exported patch {program_code}")
                
                # Small delay between transfers
                time.sleep(0.1)
            
            return patches_exported
        
        except Exception as e:
            self.logger.error(f"Patch export failed: {str(e)}")
            raise
    
    def _import_single_patch(self, program_index: int) -> Optional[Dict]:
        """Import a single patch from microKORG"""
        # Send program data request
        request_msg = self._create_sysex_message(
            self.FUNCTIONS["PROGRAM_REQUEST"],
            [program_index]
        )
        
        self._send_sysex_message(request_msg)
        
        # Wait for response
        timeout = 5.0
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            with self.receive_lock:
                if self.received_data:
                    # Process received data
                    patch = self._parse_received_data()
                    if patch:
                        return patch
            
            time.sleep(0.1)
        
        self.logger.warning(f"No response from microKORG for program {program_index}")
        return None
    
    def _export_single_patch(self, program_index: int, patch: Dict):
        """Export a single patch to microKORG"""
        # Convert patch to microKORG format using Open-microKORG
        patch_data = self._convert_patch_to_sysex(patch)
        
        # Send program write request
        write_msg = self._create_sysex_message(
            self.FUNCTIONS["PROGRAM_WRITE"],
            [program_index] + patch_data
        )
        
        self._send_sysex_message(write_msg)
        
        # Wait for confirmation (or timeout)
        time.sleep(0.5)
    
    def _create_sysex_message(self, function: int, data: List[int]) -> List[int]:
        """Create a SYSEX message with the given function and data"""
        message = self.SYSEX_HEADER + [function] + data + self.SYSEX_FOOTER
        
        # Validate message format
        if len(message) > 256:  # microKORG has maximum message size
            raise Exception("SYSEX message too long")
        
        return message
    
    def _send_sysex_message(self, message: List[int]):
        """Send SYSEX message to microKORG"""
        if not self.connected or not self.output_port:
            raise Exception("Not connected to MIDI output")
        
        try:
            self.output_port.send_message(message)
            self.logger.debug(f"Sent SYSEX message: {[hex(b) for b in message]}")
        except Exception as e:
            self.logger.error(f"Error sending SYSEX message: {str(e)}")
            raise
    
    def _midi_receive_callback(self, event, data):
        """Callback for received MIDI messages"""
        message, timestamp = event
        
        with self.receive_lock:
            if message and message[0] == 0xF0:  # SYSEX message
                self.received_data.append((message, timestamp))
                self.logger.debug(f"Received SYSEX message: {[hex(b) for b in message]}")
    
    def _parse_received_data(self) -> Optional[Dict]:
        """Parse received SYSEX data into patch format"""
        # This would use Open-microKORG to decode the SYSEX data
        # into our patch format
        
        # For now, create a dummy patch
        with self.receive_lock:
            if self.received_data:
                message, timestamp = self.received_data.pop(0)
                
                try:
                    # Decode using Open-microKORG
                    patch = self._decode_sysex_message(message)
                    return patch
                except Exception as e:
                    self.logger.error(f"Error decoding SYSEX message: {str(e)}")
        
        return None
    
    def _decode_sysex_message(self, sysex_data: List[int]) -> Dict:
        """Decode SYSEX message using Open-microKORG"""
        # Implementation using Open-microKORG library
        # This would be integrated with the patch manager
        pass
    
    def _convert_patch_to_sysex(self, patch: Dict) -> List[int]:
        """Convert patch to SYSEX format using Open-microKORG"""
        # Implementation using Open-microKORG library
        # This would encode our patch format to microKORG's format
        pass
    
    def _index_to_program_code(self, index: int) -> str:
        """Convert program index to microKORG program code (e.g., A11)"""
        side = "A" if index < self.BANK_SIZE else "B"
        bank = 1 + ((index % self.BANK_SIZE) >> 3)  # 8 programs per bank
        program = 1 + (index % self.PROGRAMS_PER_BANK)
        
        return f"{side}{bank}{program}"
    
    def _program_code_to_index(self, program_code: str) -> int:
        """Convert microKORG program code to index"""
        side = program_code[0].upper()
        bank = int(program_code[1])
        program = int(program_code[2])
        
        side_offset = 0 if side == "A" else self.BANK_SIZE
        bank_offset = (bank - 1) * self.PROGRAMS_PER_BANK
        program_offset = program - 1
        
        return side_offset + bank_offset + program_offset
    
    def _get_patch_from_library(self, patch_id: int) -> Optional[Dict]:
        """Get patch from library (would be implemented with patch manager)"""
        # This method will be implemented to retrieve patch data from the library
        pass
    
    def _get_program_index_for_patch(self, patch: Dict) -> int:
        """Get program index for patch (based on existing bank location)"""
        # For now, return the same index if it exists, otherwise find available slot
        if "bank_location" in patch:
            return self._program_code_to_index(patch["bank_location"])
        
        return 0  # Default to first program slot
