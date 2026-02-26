"""
Utility functions for patch validation, conversion, and format handling
"""

import re
from typing import Dict, Any, List, Optional

def validate_patch_data(patch_data: Dict) -> Dict:
    """Validate and clean patch data"""
    cleaned = {}
    
    # Validate patch name
    if "name" in patch_data:
        name = str(patch_data["name"]).strip()
        # microKORG names can have max 12 characters, no special characters
        if len(name) > 12:
            name = name[:12]
        # Remove any invalid characters (keep only ASCII)
        name = re.sub(r'[^\x00-\x7F]', '', name)
        cleaned["name"] = name or "Unnamed"
    else:
        cleaned["name"] = "Unnamed"
    
    # Validate voice mode
    if "voice_mode" in patch_data:
        voice_mode = str(patch_data["voice_mode"]).lower()
        valid_modes = ["single", "layer", "vocoder"]
        if voice_mode in valid_modes:
            cleaned["voice_mode"] = voice_mode
        else:
            cleaned["voice_mode"] = "single"
    
    # Validate timbres
    if "timbres" in patch_data and isinstance(patch_data["timbres"], list):
        cleaned["timbres"] = []
        for i, timbre in enumerate(patch_data["timbres"]):
            if i >= 2:  # microKORG supports max 2 timbres
                break
            if isinstance(timbre, dict):
                cleaned["timbres"].append(validate_timbre_data(timbre))
    
    # Validate parameters
    if "parameters" in patch_data and isinstance(patch_data["parameters"], dict):
        cleaned["parameters"] = validate_parameters(patch_data["parameters"])
    
    return cleaned

def validate_timbre_data(timbre_data: Dict) -> Dict:
    """Validate and clean timbre data"""
    cleaned = {}
    
    # Validate oscillator settings
    if "osc1" in timbre_data:
        cleaned["osc1"] = validate_oscillator_data(timbre_data["osc1"], 1)
    if "osc2" in timbre_data:
        cleaned["osc2"] = validate_oscillator_data(timbre_data["osc2"], 2)
    
    # Validate filter settings
    if "filter" in timbre_data:
        cleaned["filter"] = validate_filter_data(timbre_data["filter"])
    
    # Validate envelope settings
    if "eg1" in timbre_data:
        cleaned["eg1"] = validate_envelope_data(timbre_data["eg1"])
    if "eg2" in timbre_data:
        cleaned["eg2"] = validate_envelope_data(timbre_data["eg2"])
    
    # Validate LFO settings
    if "lfo1" in timbre_data:
        cleaned["lfo1"] = validate_lfo_data(timbre_data["lfo1"])
    if "lfo2" in timbre_data:
        cleaned["lfo2"] = validate_lfo_data(timbre_data["lfo2"])
    
    return cleaned

def validate_oscillator_data(osc_data: Dict, osc_number: int) -> Dict:
    """Validate and clean oscillator data"""
    cleaned = {}
    
    # Validate waveform
    if "waveform" in osc_data:
        waveform = str(osc_data["waveform"]).lower()
        valid_waveforms = []
        if osc_number == 1:
            valid_waveforms = ["saw", "square", "triangle", "sine", "vox", "dwgs", "noise", "audio"]
        else:  # OSC2 has fewer options
            valid_waveforms = ["saw", "square", "triangle"]
        
        if waveform in valid_waveforms:
            cleaned["waveform"] = waveform
        else:
            cleaned["waveform"] = "saw"
    
    # Validate level (0-127)
    if "level" in osc_data:
        cleaned["level"] = clamp_value(int(osc_data["level"]), 0, 127)
    
    # Validate semitone detune (-24 to +24)
    if "semitone" in osc_data:
        cleaned["semitone"] = clamp_value(int(osc_data["semitone"]), -24, 24)
    
    # Validate fine tune (-63 to +63)
    if "tune" in osc_data:
        cleaned["tune"] = clamp_value(int(osc_data["tune"]), -63, 63)
    
    return cleaned

def validate_filter_data(filter_data: Dict) -> Dict:
    """Validate and clean filter data"""
    cleaned = {}
    
    # Validate filter type
    if "type" in filter_data:
        filter_type = str(filter_data["type"]).lower()
        valid_types = ["24lpf", "12lpf", "12bpf", "12hpf"]
        if filter_type in valid_types:
            cleaned["type"] = filter_type
        else:
            cleaned["type"] = "24lpf"
    
    # Validate cutoff (0-127)
    if "cutoff" in filter_data:
        cleaned["cutoff"] = clamp_value(int(filter_data["cutoff"]), 0, 127)
    
    # Validate resonance (0-127)
    if "resonance" in filter_data:
        cleaned["resonance"] = clamp_value(int(filter_data["resonance"]), 0, 127)
    
    return cleaned

def validate_envelope_data(eg_data: Dict) -> Dict:
    """Validate and clean envelope data"""
    cleaned = {}
    
    # Validate attack (0-127)
    if "attack" in eg_data:
        cleaned["attack"] = clamp_value(int(eg_data["attack"]), 0, 127)
    
    # Validate decay (0-127)
    if "decay" in eg_data:
        cleaned["decay"] = clamp_value(int(eg_data["decay"]), 0, 127)
    
    # Validate sustain (0-127)
    if "sustain" in eg_data:
        cleaned["sustain"] = clamp_value(int(eg_data["sustain"]), 0, 127)
    
    # Validate release (0-127)
    if "release" in eg_data:
        cleaned["release"] = clamp_value(int(eg_data["release"]), 0, 127)
    
    return cleaned

def validate_lfo_data(lfo_data: Dict) -> Dict:
    """Validate and clean LFO data"""
    cleaned = {}
    
    # Validate waveform
    if "waveform" in lfo_data:
        waveform = str(lfo_data["waveform"]).lower()
        valid_waveforms = ["saw", "square", "triangle", "sh"]
        if waveform in valid_waveforms:
            cleaned["waveform"] = waveform
        else:
            cleaned["waveform"] = "triangle"
    
    # Validate frequency (0-127)
    if "frequency" in lfo_data:
        cleaned["frequency"] = clamp_value(int(lfo_data["frequency"]), 0, 127)
    
    # Validate sync note
    if "sync_note" in lfo_data:
        sync_note = str(lfo_data["sync_note"]).lower()
        valid_notes = ["1/1", "1/2", "1/4", "1/8", "1/12", "1/16", "1/24", "1/32"]
        if sync_note in valid_notes:
            cleaned["sync_note"] = sync_note
    
    return cleaned

def validate_parameters(parameters: Dict) -> Dict:
    """Validate and clean patch parameters"""
    cleaned = {}
    
    valid_parameters = [
        "kbd_octave", "arpeggio_type", "arpeggio_range", "arpeggio_gate",
        "modfx_type", "modfx_depth", "modfx_rate", "delay_type", "delay_time",
        "delay_depth", "eq_low_freq", "eq_low_gain", "eq_high_freq", "eq_high_gain"
    ]
    
    for param_name, param_value in parameters.items():
        if param_name in valid_parameters:
            if isinstance(param_value, int):
                cleaned[param_name] = clamp_value(param_value, 0, 127)
            elif isinstance(param_value, str):
                # Handle string parameters (e.g., waveform types)
                cleaned[param_name] = str(param_value).lower()
    
    return cleaned

def clamp_value(value: int, min_val: int, max_val: int) -> int:
    """Clamp value between min and max"""
    return max(min_val, min(max_val, value))

def convert_parameter_to_midi(value: int, min_val: int, max_val: int) -> int:
    """Convert parameter value to MIDI range (0-127)"""
    if min_val == 0 and max_val == 127:
        return clamp_value(value, 0, 127)
    
    range_length = max_val - min_val
    normalized = (value - min_val) / range_length
    midi_value = int(normalized * 127)
    
    return clamp_value(midi_value, 0, 127)

def convert_midi_to_parameter(midi_value: int, min_val: int, max_val: int) -> int:
    """Convert MIDI value (0-127) to parameter range"""
    if min_val == 0 and max_val == 127:
        return clamp_value(midi_value, 0, 127)
    
    range_length = max_val - min_val
    normalized = midi_value / 127.0
    param_value = int(normalized * range_length + min_val)
    
    return clamp_value(param_value, min_val, max_val)

def convert_patch_to_openmicrokorg(patch: Dict) -> Any:
    """Convert patch to Open-microKORG format"""
    # This function would be implemented to convert our patch format
    # to the format used by the Open-microKORG library
    pass

def convert_openmicrokorg_to_patch(open_patch: Any) -> Dict:
    """Convert Open-microKORG patch format to our internal format"""
    # This function would be implemented to convert Open-microKORG's format
    # to our internal patch format
    pass

def extract_patch_name(raw_patch: Dict) -> str:
    """Extract readable patch name from raw data"""
    if "name" in raw_patch:
        return raw_patch["name"]
    
    if "parameters" in raw_patch and "name" in raw_patch["parameters"]:
        return raw_patch["parameters"]["name"]
    
    return "Unnamed"
