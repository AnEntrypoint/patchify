# Patchify - microKORG Patch Library Editor

A comprehensive tool for managing microKORG patches with intelligent sorting, exporting, and editing capabilities.

## Features

- 🎹 **Import/Export Patches**: Connect to your microKORG via MIDI and import/export patches directly
- 📁 **File Management**: Support for SYSEX, PRG, and JSON file formats
- 🎨 **Patch Editor**: Visual interface for editing all microKORG parameters
- 🔍 **Smart Search**: Search patches by name, category, or parameters
- 📊 **Organization**: Intelligent sorting and filtering of patches
- 🔄 **MIDI Integration**: Real-time communication with microKORG
- 📱 **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## System Requirements

- Windows 10/11, macOS 10.14+, or Linux
- Python 3.8 or higher
- Node.js 16 or higher
- microKORG synthesizer with MIDI interface

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/patchify.git
cd patchify
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Install system dependencies for MIDI support

**Windows:**
- No additional dependencies needed

**macOS:**
```bash
brew install python-rtmidi
```

**Linux:**
```bash
sudo apt-get install libasound2-dev libjack-dev
```

## Usage

### Running in Development Mode

1. Start the backend server:
   ```bash
   python src/main.py --dev
   ```

2. Start the frontend development server in a new terminal:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Running in Production Mode

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

2. Start the production server:
   ```bash
   python src/main.py
   ```

3. Open your browser and navigate to `http://localhost:5000`

## Connecting to microKORG

1. Connect your microKORG to your computer via USB or MIDI interface
2. Turn on the microKORG
3. In Patchify, go to **Settings > MIDI Settings**
4. Select your microKORG as the input and output device
5. Click **Connect**

## Basic Usage

### Importing Patches from microKORG

1. Make sure your microKORG is connected and turned on
2. Go to **Dashboard** or **Library**
3. Click **Import from microKORG**
4. Wait for all patches to be imported

### Exporting Patches to microKORG

1. Select the patches you want to export
2. Click **Export to microKORG**
3. Follow the instructions on your microKORG display

### Creating and Editing Patches

1. Go to **Patch Editor**
2. Select a patch to edit or click **New Patch**
3. Edit parameters in the various tabs
4. Click **Save** to save your changes

### Organizing Patches

- **Search**: Use the search bar to find patches by name
- **Filter**: Filter patches by category or parameters
- **Sort**: Sort patches by name, date created, or parameters
- **Select**: Select multiple patches for export or deletion

## Patch File Formats

### SYSEX Format
- Native microKORG patch format
- Supports single patches or entire banks
- Used for direct MIDI communication

### PRG Format
- MIDI file format containing microKORG patches
- Supported by the microKORG librarian software

### JSON Format
- Human-readable format for patch exchange
- Easy to share and version control

## Project Structure

```
patchify/
├── src/
│   ├── main.py                    # Application entry point
│   ├── backend/
│   │   ├── server.py              # Flask API server
│   │   ├── patch_manager.py       # Patch library management
│   │   ├── midi_controller.py     # MIDI communication
│   │   └── utils.py              # Utility functions
│   └── data/                     # Patch library storage
├── frontend/
│   ├── src/
│   │   ├── main.jsx              # React app entry
│   │   ├── App.jsx              # Main app component
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── services/            # API services
│   │   └── hooks/               # Custom React hooks
│   ├── index.html               # HTML template
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
├── requirements.txt             # Python dependencies
├── package.json                 # Project configuration
└── README.md                    # This file
```

## Architecture

### Backend (Python)
- **Flask**: RESTful API server
- **python-rtmidi**: MIDI communication
- **Open-microKORG**: Patch format decoding/encoding

### Frontend (React)
- **React 18**: UI framework
- **Tailwind CSS**: Styling
- **Vite**: Build tool
- **Lucide React**: Icons

## Development

### Adding New Features

1. Create a new branch: `git checkout -b feature-name`
2. Implement changes in the appropriate directory
3. Test your changes
4. Commit and push to remote repository

### Running Tests

```bash
# Run backend tests
pytest src/tests/

# Run frontend tests
cd frontend
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **Open-microKORG** - For patch format decoding/encoding
- **KORG** - For creating the microKORG synthesizer
- **React** - For the UI framework
- **Tailwind CSS** - For styling

## Support

If you encounter any issues or have questions:

1. Check the **Troubleshooting** section below
2. Search the GitHub Issues
3. Create a new issue with detailed information

## Troubleshooting

### MIDI Connection Issues

1. **Check MIDI Devices**: Ensure your microKORG is recognized by your computer
2. **Restart Devices**: Turn off your microKORG, disconnect USB, and reconnect
3. **Check Drivers**: Install the latest MIDI drivers from KORG's website
4. **Firewall Settings**: Ensure your firewall allows Patchify to access MIDI devices

### Patch Import/Export Issues

1. **Connection Status**: Verify you're connected to your microKORG
2. **Bank Memory**: Ensure your microKORG has available memory
3. **File Formats**: Check that you're using the correct file format
4. **Firmware**: Update your microKORG to the latest firmware version

### Performance Issues

1. **Close Other Apps**: Close resource-intensive applications
2. **MIDI Buffer**: Increase the MIDI buffer size in settings
3. **Update Drivers**: Ensure your MIDI interface drivers are up to date
