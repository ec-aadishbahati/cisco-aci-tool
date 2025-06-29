# Cisco ACI Tool

A modular, offline-capable tool for analyzing Cisco ACI fabric faults and configurations with a modern web interface packaged as a desktop application.

## Architecture

- **Backend**: Python FastAPI for ACI data parsing and analysis
- **Frontend**: Modern web interface (React/TypeScript)
- **Packaging**: Tauri for cross-platform desktop deployment
- **Database**: SQLite for local data persistence

## Features

- 📊 **Multi-Fabric Support** - Upload and analyze multiple ACI fabric configurations
- 🔍 **Fault Analysis** - Comprehensive fault detection and reporting
- 📱 **Tab-Based Interface** - Modular tools in organized tabs
- 💾 **Offline Capability** - No internet connection required
- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support
- 📈 **Interactive Reports** - Charts and visualizations for fault data

## Project Structure

```
cisco-aci-tool/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── modules/        # Analysis modules
│   │   │   ├── fault_analysis/
│   │   │   ├── compliance/
│   │   │   └── fabric_comparison/
│   │   ├── models/         # Data models
│   │   ├── utils/          # Utilities and parsers
│   │   └── database/       # Database operations
│   ├── pyproject.toml      # Python dependencies
│   └── requirements.txt    # Alternative dependency file
├── frontend/               # Web frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── dist/              # Built frontend files
├── src-tauri/             # Tauri configuration
│   ├── tauri.conf.json    # Tauri settings
│   └── src/               # Rust code for Tauri
└── docs/                  # Documentation
```

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Rust (for Tauri)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# or
poetry install
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Run Development
```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start Tauri (desktop app)
npm run tauri dev
```

## Usage

1. **Upload ACI Configurations** - Drag and drop JSON files from ACI fabrics
2. **Select Analysis Module** - Choose from fault analysis, compliance checking, etc.
3. **View Results** - Interactive charts and detailed reports
4. **Export Reports** - Download results as PDF or Excel files

## Modules

### Fault Analysis
- Parse ACI fault JSON files
- Categorize faults by severity and type
- Track fault lifecycle (raised → cleared)
- Identify noisy endpoints and interfaces
- Cross-fabric fault comparison

### Compliance Checking
- Compare configurations against baselines
- Identify policy violations
- Generate compliance reports

### Fabric Comparison
- Compare multiple fabric configurations
- Highlight differences and inconsistencies
- Generate diff reports
