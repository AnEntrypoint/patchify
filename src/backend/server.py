"""
Patchify Backend Server

Provides RESTful API endpoints for patch management and MIDI communication
with the microKORG synthesizer.
"""

import os
import logging
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from .patch_manager import PatchManager
from .midi_controller import MIDIController
from .utils import validate_patch_data

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
    CORS(app)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger(__name__)
    
    # Initialize managers
    patch_manager = PatchManager()
    midi_controller = MIDIController()
    
    # Create data directories
    patch_manager.ensure_data_directories()
    
    # ============================
    # API ENDPOINTS
    # ============================
    
    @app.route("/api/patches", methods=["GET"])
    def get_patches():
        """Get all patches in the library"""
        try:
            patches = patch_manager.get_all_patches()
            return jsonify({"success": True, "data": patches})
        except Exception as e:
            logger.error(f"Error getting patches: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/<int:patch_id>", methods=["GET"])
    def get_patch(patch_id):
        """Get a single patch by ID"""
        try:
            patch = patch_manager.get_patch(patch_id)
            if not patch:
                return jsonify({"success": False, "error": "Patch not found"}), 404
            return jsonify({"success": True, "data": patch})
        except Exception as e:
            logger.error(f"Error getting patch {patch_id}: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches", methods=["POST"])
    def create_patch():
        """Create a new patch"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "No patch data provided"}), 400
            
            patch = patch_manager.create_patch(data)
            return jsonify({"success": True, "data": patch}), 201
        except Exception as e:
            logger.error(f"Error creating patch: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/<int:patch_id>", methods=["PUT"])
    def update_patch(patch_id):
        """Update an existing patch"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"success": False, "error": "No patch data provided"}), 400
            
            patch = patch_manager.update_patch(patch_id, data)
            if not patch:
                return jsonify({"success": False, "error": "Patch not found"}), 404
            return jsonify({"success": True, "data": patch})
        except Exception as e:
            logger.error(f"Error updating patch {patch_id}: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/<int:patch_id>", methods=["DELETE"])
    def delete_patch(patch_id):
        """Delete a patch"""
        try:
            success = patch_manager.delete_patch(patch_id)
            if not success:
                return jsonify({"success": False, "error": "Patch not found"}), 404
            return jsonify({"success": True, "message": "Patch deleted successfully"})
        except Exception as e:
            logger.error(f"Error deleting patch {patch_id}: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/import", methods=["POST"])
    def import_patches():
        """Import patches from microKORG via MIDI"""
        try:
            count = midi_controller.import_patches()
            if count > 0:
                patch_manager.refresh()
                return jsonify({"success": True, "message": f"Imported {count} patches from microKORG"})
            else:
                return jsonify({"success": False, "error": "No patches imported"}), 500
        except Exception as e:
            logger.error(f"Error importing patches: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/export", methods=["POST"])
    def export_patches():
        """Export patches to microKORG via MIDI"""
        try:
            data = request.get_json()
            patch_ids = data.get("patch_ids", [])
            
            if not patch_ids:
                return jsonify({"success": False, "error": "No patch IDs provided"}), 400
            
            count = midi_controller.export_patches(patch_ids)
            return jsonify({"success": True, "message": f"Exported {count} patches to microKORG"})
        except Exception as e:
            logger.error(f"Error exporting patches: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/export/file", methods=["POST"])
    def export_to_file():
        """Export patches to file"""
        try:
            data = request.get_json()
            patch_ids = data.get("patch_ids", [])
            file_format = data.get("format", "sysex")
            file_path = data.get("file_path")
            
            if not patch_ids:
                return jsonify({"success": False, "error": "No patch IDs provided"}), 400
            
            success = patch_manager.export_patches_to_file(patch_ids, file_format, file_path)
            if success:
                return jsonify({"success": True, "message": "Patches exported successfully"})
            else:
                return jsonify({"success": False, "error": "Export failed"}), 500
        except Exception as e:
            logger.error(f"Error exporting patches to file: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/patches/import/file", methods=["POST"])
    def import_from_file():
        """Import patches from file"""
        try:
            if "file" not in request.files:
                return jsonify({"success": False, "error": "No file provided"}), 400
            
            file = request.files["file"]
            count = patch_manager.import_patches_from_file(file)
            patch_manager.refresh()
            
            return jsonify({"success": True, "message": f"Imported {count} patches from file"})
        except Exception as e:
            logger.error(f"Error importing patches from file: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/midi/devices", methods=["GET"])
    def get_midi_devices():
        """Get available MIDI devices"""
        try:
            devices = midi_controller.get_available_devices()
            return jsonify({"success": True, "data": devices})
        except Exception as e:
            logger.error(f"Error getting MIDI devices: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/midi/connect", methods=["POST"])
    def connect_midi():
        """Connect to microKORG via MIDI"""
        try:
            data = request.get_json()
            input_device = data.get("input_device")
            output_device = data.get("output_device")
            
            success = midi_controller.connect(input_device, output_device)
            if success:
                return jsonify({"success": True, "message": "Connected to microKORG"})
            else:
                return jsonify({"success": False, "error": "Connection failed"}), 500
        except Exception as e:
            logger.error(f"Error connecting to MIDI: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/midi/disconnect", methods=["POST"])
    def disconnect_midi():
        """Disconnect from MIDI"""
        try:
            midi_controller.disconnect()
            return jsonify({"success": True, "message": "Disconnected from MIDI"})
        except Exception as e:
            logger.error(f"Error disconnecting from MIDI: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/midi/status", methods=["GET"])
    def get_midi_status():
        """Get MIDI connection status"""
        try:
            status = midi_controller.get_status()
            return jsonify({"success": True, "data": status})
        except Exception as e:
            logger.error(f"Error getting MIDI status: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/search", methods=["GET"])
    def search_patches():
        """Search patches by name or parameter"""
        try:
            query = request.args.get("q", "")
            field = request.args.get("field", "name")
            
            patches = patch_manager.search_patches(query, field)
            return jsonify({"success": True, "data": patches})
        except Exception as e:
            logger.error(f"Error searching patches: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/sort", methods=["POST"])
    def sort_patches():
        """Sort patches by field"""
        try:
            data = request.get_json()
            field = data.get("field", "name")
            direction = data.get("direction", "asc")
            
            patches = patch_manager.sort_patches(field, direction)
            return jsonify({"success": True, "data": patches})
        except Exception as e:
            logger.error(f"Error sorting patches: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    @app.route("/api/filter", methods=["POST"])
    def filter_patches():
        """Filter patches by parameters"""
        try:
            data = request.get_json()
            filters = data.get("filters", [])
            
            patches = patch_manager.filter_patches(filters)
            return jsonify({"success": True, "data": patches})
        except Exception as e:
            logger.error(f"Error filtering patches: {str(e)}")
            return jsonify({"success": False, "error": str(e)}), 500
    
    # ============================
    # STATIC FILES
    # ============================
    
    @app.route("/")
    def index():
        """Serve the main frontend file"""
        return send_from_directory(app.static_folder, "index.html")
    
    @app.route("/<path:path>")
    def static_files(path):
        """Serve static files"""
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")
    
    logger.info("Flask app created and configured")
    return app
