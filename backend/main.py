from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from anthropic import Anthropic
import os
from dotenv import load_dotenv
import logging
import sys

# Configuration logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Zyron AI")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client - SIMPLE
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    logger.error("❌ ANTHROPIC_API_KEY not found in .env")
    raise ValueError("ANTHROPIC_API_KEY is required")

client = Anthropic(api_key=api_key)
logger.info("✅ Anthropic client initialized")

@app.get("/")
def root():
    return {"status": "Zyron AI is alive"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/chat")
async def chat(message: dict):
    user_message = message.get("message", "")
    logger.info(f"📨 Received chat request: {user_message}")

    def generate():
        logger.info("🚀 Starting stream generator")
        try:
            with client.messages.stream(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": user_message}]
            ) as stream:
                logger.info("✅ Stream created successfully")
                chunk_count = 0
                for text in stream.text_stream:
                    chunk_count += 1
                    logger.info(f"📦 Chunk {chunk_count}: {text[:20]}...")
                    yield f"data: {text}\n\n"
                logger.info(f"✅ Stream completed with {chunk_count} chunks")
        except Exception as e:
            logger.error(f"❌ Stream error: {str(e)}", exc_info=True)
            yield f"data: Error: {str(e)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 
# Railway port configuration
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
