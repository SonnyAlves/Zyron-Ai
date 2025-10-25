# Zyron AI Backend

FastAPI backend for the Zyron AI project.

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**

   **On macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

   **On Windows:**
   ```bash
   venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Anthropic API key:
     ```
     ANTHROPIC_API_KEY=your_actual_key_here
     ```

### Running the Server

Start the development server:

```bash
python main.py
```

The server will start at `http://localhost:8000`

### API Endpoints

- **GET `/`** - Root endpoint
  - Returns: `{"status": "Zyron AI is alive"}`

- **GET `/health`** - Health check endpoint
  - Returns: `{"status": "healthy"}`

### Interactive API Documentation

Once the server is running, you can access:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py              # FastAPI application and routes
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
└── README.md           # This file
```

## Development

The server runs with `reload=True` by default, which means it will automatically restart when you make changes to the code.

## Notes

- CORS is configured to allow all origins for development. Remember to restrict this in production.
- The Anthropic API key should be stored securely and never committed to version control.
