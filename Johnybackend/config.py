from dotenv import load_dotenv
import os

load_dotenv()

SECRETE_KEY = os.getenv("SECRET_KEY")
if not SECRETE_KEY:
    raise ValueError('Secret key environment not set')
OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")
if not OPEN_WEATHER_API_KEY:
    raise ValueError("The weather api key environment not set")
ACCESS_TOKEN_EXPIRE_MINUTE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTE", 30))
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Database environment path not found")
ALGORITHM = os.getenv("ALGORITHM","HS256")
if not ALGORITHM:
    raise ValueError("Algorithm environment not set")

