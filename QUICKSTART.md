# Patchify - microKORG Patch Library Editor

## Installation and Setup

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Run the Application

#### Development Mode (Recommended for Testing)
```bash
# Terminal 1 - Start the Flask backend
python src/main.py --dev

# Terminal 2 - Start the React frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

#### Production Mode (Full Build)
```bash
# Build the frontend
cd frontend
npm run build
cd ..

# Start the production server
python src/main.py
```

The application will be available at http://localhost:5000

## Features

- **Patch Management**: Create, edit, delete patches
- **MIDI Integration**: Connect to microKORG via MIDI
- **File Import/Export**: Import patches from microKORG or files
- **Library Organization**: Search, sort, and filter patches
- **Patch Editor**: Visual interface for editing all microKORG parameters
- **Multiple File Formats**: Support for SYSEX, PRG, and JSON files

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

## API Endpoints

### Patches
- `GET /api/patches` - Get all patches
- `GET /api/patches/<id>` - Get patch by ID
- `POST /api/patches` - Create new patch
- `PUT /api/patches/<id>` - Update patch
- `DELETE /api/patches/<id>` - Delete patch

### Patch Operations
- `POST /api/patches/import` - Import patches from microKORG
- `POST /api/patches/export` - Export patches to microKORG
- `POST /api/patches/import/file` - Import patches from file
- `POST /api/patches/export/file` - Export patches to file

### Search and Filter
- `GET /api/search` - Search patches
- `POST /api/sort` - Sort patches
- `POST /api/filter` - Filter patches

### MIDI Operations
- `GET /api/midi/devices` - Get available MIDI devices
- `POST /api/midi/connect` - Connect to MIDI
- `POST /api/midi/disconnect` - Disconnect from MIDI
- `GET /api/midi/status` - Get MIDI status

## Technologies

### Backend
- **Flask**: Web framework
- **Flask-CORS**: CORS support
- **python-rtmidi**: MIDI communication
- **Open-microKORG**: Patch decoding/encoding

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Axios**: HTTP client

## Testing

### Run Backend Tests
```bash
python test_backend.py
```

### Run Open-microKORG Tests
```bash
python test_open_microkorg.py
```

### Run Frontend Tests
```bash
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

MIT License
