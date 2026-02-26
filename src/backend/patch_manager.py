"""
Patch Manager - Handles patch library management

Responsible for:
- Loading/saving patches from/to disk
- Importing/exporting patches from/to files
- Organizing patches in the library
- Searching and filtering patches
- Patch validation and conversion
"""

import os
import json
import logging
import hashlib
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any

class PatchManager:
    """Manager for patch library operations"""
    
    def __init__(self):
        """Initialize the patch manager"""
        self.logger = logging.getLogger(__name__)
        self.base_dir = Path(__file__).parent.parent.parent
        self.data_dir = self.base_dir / "data"
        self.patches_dir = self.data_dir / "patches"
        self.library_file = self.data_dir / "library.json"
        
        # Load patch library
        self.patches: List[Dict] = []
        self.refresh()
    
    def ensure_data_directories(self):
        """Ensure data directories exist"""
        for directory in [self.data_dir, self.patches_dir]:
            directory.mkdir(exist_ok=True)
        
        if not self.library_file.exists():
            self.logger.info("Creating initial patch library file")
            with open(self.library_file, "w") as f:
                json.dump([], f, indent=2)
    
    def refresh(self):
        """Refresh the patch library from disk"""
        self.ensure_data_directories()
        
        try:
            with open(self.library_file, "r") as f:
                self.patches = json.load(f)
            self.logger.info(f"Loaded {len(self.patches)} patches from library")
        except Exception as e:
            self.logger.error(f"Error loading patch library: {str(e)}")
            self.patches = []
    
    def save_library(self):
        """Save the patch library to disk"""
        try:
            with open(self.library_file, "w") as f:
                json.dump(self.patches, f, indent=2, default=str)
            self.logger.info(f"Library saved with {len(self.patches)} patches")
        except Exception as e:
            self.logger.error(f"Error saving patch library: {str(e)}")
            raise
    
    def get_all_patches(self) -> List[Dict]:
        """Get all patches in the library"""
        return self.patches
    
    def get_patch(self, patch_id: int) -> Optional[Dict]:
        """Get a single patch by ID"""
        for patch in self.patches:
            if patch.get("id") == patch_id:
                return patch
        return None
    
    def create_patch(self, patch_data: Dict) -> Dict:
        """Create a new patch"""
        patch = self._validate_and_clean_patch_data(patch_data)
        
        # Generate unique ID
        patch_id = self._generate_patch_id(patch)
        
        # Add metadata
        patch.update({
            "id": patch_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "file_path": self._get_patch_file_path(patch_id)
        })
        
        # Save patch file
        self._save_patch_file(patch_id, patch)
        
        # Add to library
        self.patches.append(patch)
        self.save_library()
        
        self.logger.info(f"Created patch: {patch.get('name', 'Unnamed')} (ID: {patch_id})")
        return patch
    
    def update_patch(self, patch_id: int, patch_data: Dict) -> Optional[Dict]:
        """Update an existing patch"""
        patch = self.get_patch(patch_id)
        if not patch:
            return None
        
        # Update patch data
        updated_data = self._validate_and_clean_patch_data(patch_data)
        patch.update(updated_data)
        patch["updated_at"] = datetime.now().isoformat()
        
        # Save patch file
        self._save_patch_file(patch_id, patch)
        
        # Update library
        self.save_library()
        
        self.logger.info(f"Updated patch: {patch.get('name', 'Unnamed')} (ID: {patch_id})")
        return patch
    
    def delete_patch(self, patch_id: int) -> bool:
        """Delete a patch"""
        patch = self.get_patch(patch_id)
        if not patch:
            return False
        
        # Remove patch file
        file_path = Path(patch.get("file_path"))
        if file_path.exists():
            file_path.unlink()
        
        # Remove from library
        self.patches = [p for p in self.patches if p.get("id") != patch_id]
        self.save_library()
        
        self.logger.info(f"Deleted patch: {patch.get('name', 'Unnamed')} (ID: {patch_id})")
        return True
    
    def search_patches(self, query: str, field: str = "name") -> List[Dict]:
        """Search patches by name or parameter"""
        if not query:
            return self.patches
        
        query = query.lower()
        results = []
        
        for patch in self.patches:
            if field == "name":
                if query in patch.get("name", "").lower():
                    results.append(patch)
            else:
                # Search in specific parameter fields
                value = patch.get(field, "")
                if query in str(value).lower():
                    results.append(patch)
        
        return results
    
    def sort_patches(self, field: str = "name", direction: str = "asc") -> List[Dict]:
        """Sort patches by field"""
        if field == "name":
            sorted_patches = sorted(
                self.patches,
                key=lambda x: x.get("name", "").lower(),
                reverse=(direction == "desc")
            )
        elif field == "created_at" or field == "updated_at":
            sorted_patches = sorted(
                self.patches,
                key=lambda x: x.get(field, ""),
                reverse=(direction == "desc")
            )
        else:
            # Sort by numeric parameter
            sorted_patches = sorted(
                self.patches,
                key=lambda x: x.get(field, 0),
                reverse=(direction == "desc")
            )
        
        return sorted_patches
    
    def filter_patches(self, filters: List[Dict]) -> List[Dict]:
        """Filter patches by parameters"""
        if not filters:
            return self.patches
        
        filtered = self.patches
        
        for filter_spec in filters:
            field = filter_spec.get("field")
            operator = filter_spec.get("operator", "equals")
            value = filter_spec.get("value")
            
            if not field or value is None:
                continue
            
            filtered = [
                patch for patch in filtered
                if self._match_filter(patch, field, operator, value)
            ]
        
        return filtered
    
    def import_patches_from_file(self, file) -> int:
        """Import patches from a file"""
        count = 0
        file_format = self._detect_file_format(file)
        
        if file_format == "sysex":
            count = self._import_sysex_file(file)
        elif file_format == "prg":
            count = self._import_prg_file(file)
        elif file_format == "json":
            count = self._import_json_file(file)
        else:
            self.logger.error(f"Unsupported file format for import")
            raise Exception("Unsupported file format")
        
        self.save_library()
        return count
    
    def export_patches_to_file(self, patch_ids: List[int], file_format: str = "sysex", 
                              file_path: Optional[str] = None) -> bool:
        """Export patches to a file"""
        patches_to_export = [p for p in self.patches if p.get("id") in patch_ids]
        
        if not file_path:
            file_path = self._generate_export_file_path(file_format)
        
        if file_format == "sysex":
            self._export_sysex_file(patches_to_export, file_path)
        elif file_format == "prg":
            self._export_prg_file(patches_to_export, file_path)
        elif file_format == "json":
            self._export_json_file(patches_to_export, file_path)
        else:
            self.logger.error(f"Unsupported file format for export")
            return False
        
        return True
    
    # ============================
    # Internal Helper Methods
    # ============================
    
    def _validate_and_clean_patch_data(self, patch_data: Dict) -> Dict:
        """Validate and clean patch data"""
        cleaned = {}
        
        # Ensure required fields exist
        if "name" not in patch_data or not patch_data["name"]:
            cleaned["name"] = "Unnamed"
        else:
            cleaned["name"] = str(patch_data["name"])[:12]  # microKORG names are max 12 chars
        
        # Copy parameters
        if "parameters" in patch_data:
            cleaned["parameters"] = patch_data["parameters"]
        
        # Copy timbres
        if "timbres" in patch_data:
            cleaned["timbres"] = patch_data["timbres"]
        
        # Copy voice mode
        if "voice_mode" in patch_data:
            cleaned["voice_mode"] = patch_data["voice_mode"]
        
        return cleaned
    
    def _generate_patch_id(self, patch_data: Dict) -> int:
        """Generate unique patch ID from patch data"""
        # Create a unique identifier based on patch name and parameters
        name = patch_data.get("name", "unnamed")
        params_hash = hashlib.md5(
            json.dumps(patch_data.get("parameters", {}), sort_keys=True).encode()
        ).hexdigest()
        
        unique_str = f"{name}:{params_hash}"
        return int(hashlib.sha256(unique_str.encode()).hexdigest(), 16) % 1000000
    
    def _get_patch_file_path(self, patch_id: int) -> str:
        """Get file path for patch storage"""
        return str(self.patches_dir / f"{patch_id}.json")
    
    def _save_patch_file(self, patch_id: int, patch_data: Dict):
        """Save patch data to JSON file"""
        file_path = self._get_patch_file_path(patch_id)
        with open(file_path, "w") as f:
            json.dump(patch_data, f, indent=2, default=str)
    
    def _match_filter(self, patch: Dict, field: str, operator: str, value: Any) -> bool:
        """Match patch against filter"""
        patch_value = patch.get(field, None)
        
        if patch_value is None:
            return False
        
        if operator == "equals":
            return patch_value == value
        elif operator == "contains":
            return value in str(patch_value)
        elif operator == "greater":
            return isinstance(patch_value, (int, float)) and patch_value > value
        elif operator == "less":
            return isinstance(patch_value, (int, float)) and patch_value < value
        elif operator == "range":
            if not isinstance(value, list) or len(value) != 2:
                return False
            return isinstance(patch_value, (int, float)) and (value[0] <= patch_value <= value[1])
        
        return False
    
    def _detect_file_format(self, file) -> str:
        """Detect file format from content"""
        # Read first few bytes to detect format
        try:
            header = file.read(4)
            file.seek(0)  # Reset file pointer
            
            if header[:1] == b'\xf0':  # SYSEX files start with F0
                return "sysex"
            elif b"MThd" in header:  # PRG files are MIDI files with MThd header
                return "prg"
            else:
                return "json"
        except Exception as e:
            self.logger.error(f"Error detecting file format: {str(e)}")
            return "json"
    
    def _import_sysex_file(self, file) -> int:
        """Import patches from SYSEX file using Open-microKORG"""
        pass  # Implementation using Open-microKORG
    
    def _import_prg_file(self, file) -> int:
        """Import patches from PRG file using Open-microKORG"""
        pass  # Implementation using Open-microKORG
    
    def _import_json_file(self, file) -> int:
        """Import patches from JSON file"""
        try:
            data = json.load(file)
            if isinstance(data, list):
                for patch in data:
                    self.create_patch(patch)
                return len(data)
            elif isinstance(data, dict):
                self.create_patch(data)
                return 1
            return 0
        except Exception as e:
            self.logger.error(f"Error importing JSON file: {str(e)}")
            return 0
    
    def _export_sysex_file(self, patches: List[Dict], file_path: str):
        """Export patches to SYSEX file using Open-microKORG"""
        pass  # Implementation using Open-microKORG
    
    def _export_prg_file(self, patches: List[Dict], file_path: str):
        """Export patches to PRG file using Open-microKORG"""
        pass  # Implementation using Open-microKORG
    
    def _export_json_file(self, patches: List[Dict], file_path: str):
        """Export patches to JSON file"""
        with open(file_path, "w") as f:
            json.dump(patches, f, indent=2, default=str)
    
    def _generate_export_file_path(self, file_format: str) -> str:
        """Generate a default export file path"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"patches_{timestamp}.{file_format}"
        return str(self.data_dir / filename)
