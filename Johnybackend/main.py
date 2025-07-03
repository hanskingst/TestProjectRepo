from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from typing import List,Annotated,Optional
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from Database.database import engine,get_db,Base,sessionLocal
from Database.schema import User,Notification
from Models.notification import notificationCreate, notificationResponse
from Models.user import userResponse,createUser,Token,LocationUpdate
from datetime import timedelta, datetime
import requests
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from config import ACCESS_TOKEN_EXPIRE_MINUTE,OPEN_WEATHER_API_KEY,SECRETE_KEY,ALGORITHM
from cachetools import TTLCache

app = FastAPI()

Base.metadata.create_all(bind = engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db_dependency = Annotated[Session, Depends(get_db)]

pwd_context = CryptContext(schemes=['bcrypt'], deprecated= 'auto')

Oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

 #defining the sytem notification types
notification_types = {'significant_precipitation': {'codes':['rain','thunderstorm'], 'min_rainfall':2.5}}

def hash_password(plain_password):
    hashed_password = pwd_context.hash(plain_password)
    return hashed_password

def verify_password(password, hashed_password):
    return pwd_context.verify(password, hashed_password)

def create_access_token(data:dict, expire_delta:Optional[timedelta] = None):
    data_to_encode = data.copy()
    
    if expire_delta:
        expire_time = datetime.now() + expire_delta
    else:
        expire_time = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)
    
    data_to_encode.update({'exp':expire_time})
    
    jwt_token = jwt.encode(data_to_encode,SECRETE_KEY, algorithm=ALGORITHM)
    
    return jwt_token

async def get_current_user(db:db_dependency, token:str = Depends(Oauth2_scheme)):
    Httpcredentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="invalid username or password",
        headers={"WWW-Authenticate":"Bearer"}
  )
    
    try:
        payload = jwt.decode(token, SECRETE_KEY, algorithms=ALGORITHM)
        user_name :str = payload.get("sub")
        if user_name is None:
            raise Httpcredentials
    except JWTError:
        raise Httpcredentials
    db_user = db.query(User).filter(User.user_name == user_name).first()
    if db_user is None:
        raise Httpcredentials
    return db_user

@app.post("/signup", response_model=userResponse)
async def usercreate(db:db_dependency, user:createUser = Body(...)):
    db_user = db.query(User).filter(User.user_email == user.user_email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already existing")
    hashed_password = hash_password(user.user_password)
    
    db_user = User(user_name = user.user_name, user_email = user.user_email, password_hash = hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login", response_model=Token)
async def user_login(db:db_dependency, form_data :OAuth2PasswordRequestForm = Depends()):
    db_user = db.query(User).filter(User.user_name == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail= "User not found or invalid credentials", headers={"WWW-Authenticate":"Bearer"})
    expire_time = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)
    
    access_token = create_access_token(data={'sub':form_data.username}, expire_delta=expire_time)
    return {"access_token": access_token, "token_type":"bearer"}

@app.get('/me', response_model=userResponse)
async def get_current_user_endpoint(current_user:User = Depends(get_current_user)):
    return current_user

@app.patch('/users/{user_id}/location', response_model=dict)
async def updateLocation(user_id:int, location:LocationUpdate, db:db_dependency, current_user:User = Depends(get_current_user)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="not found")
    if user.user_id != current_user.user_id:
        raise HTTPException(status_code=401,detail="Unauthorized access")
    user.location = f"lat:{location.lat},lon:{location.lon}"
    db.commit()
    return{"status":"Location updated"}
 
def parse_location(location:str):
    if not location or not isinstance(location,str):
        raise ValueError("Location must not be empty")
    try:
        location_parts = location.split(",")
        if len(location_parts) != 2:
            raise ValueError("Invalid location format. Expected 'lat:<value>,lon:<value>")
        lat = location_parts[0].split(":")[1]
        lon = location_parts[1].split(":")[1]
        return lat,lon
    except (IndexError,ValueError) as e:
        raise ValueError(f"Invalid location format: {location}") from e

async def check_weather_notifications():
    db_gen = get_db()
    db:Session = next(db_gen)
    try:
        users = db.query(User).all()
        for user in users:
            if user.location:
                try:
                    lat,lon = parse_location(user.location)
                except ValueError as e:
                    raise ValueError (f'error parsing location for user {user.user_id}:{e}')
                response = requests.get(f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPEN_WEATHER_API_KEY}")
                if response.status_code != 200:
                    raise ValueError(f"Failed to fetch weather data:{response.status_code}")
                data = response.json()
                
                if data.get('rain',{}).get('1h',0) >= notification_types["significant_precipitation"]["min_rainfall"]:
                    db_notification = Notification( 
                        user_id = user.user_id, 
                        message = f"Heavy rain at {data['name']}", 
                        is_read= False,
                        location = data["name"]
                    )
                    db.add(db_notification)
                    db.commit()
                    db.refresh(db_notification)
    finally:
        db_gen.close()
    

scheduler = AsyncIOScheduler()
scheduler.add_job(check_weather_notifications,"interval", misfire_grace_time=30)
scheduler.start()
   
@app.get("/weather/city", response_model=dict)
async def get_city_weather(q: str):
    response = requests.get(
        f"https://api.openweathermap.org/data/2.5/weather?q={q}&units=metric&appid={OPEN_WEATHER_API_KEY}"
    )
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="City not found")
    return response.json()
         

@app.post('/notification', response_model=notificationResponse)
async def create_notification(db:db_dependency, notification:notificationCreate, current_user:User = Depends(get_current_user)):
   
    db_notification = Notification(
        user_id = current_user.user_id, 
        message = notification.message, 
        is_read= notification.is_read,
        location = notification.location
        )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@app.patch('/notifread', response_model=notificationResponse)
async def mark_all_as_read(db:db_dependency,current_user: User = Depends(get_current_user)):
    db_noti = db.query(Notification).filter(Notification.user_id == current_user.user_id).all()
    if not db_noti:
        raise HTTPException(status_code=404, detail="No notification found")
    db.query(Notification).filter(Notification.user_id == current_user.user_id).update({"is_read":True})
    db.commit()
     
    for notifications in db_noti:
         db.refresh(notifications)
    
    return notifications

@app.delete('/noitifdel', response_model=dict)
async def delete_all_notifications(db:db_dependency,current_user:User = Depends(get_current_user)):
    delete_count = db.query(Notification).filter(Notification.user_id == current_user.user_id
                    ).delete(synchronize_session=False)
    db.commit()
    return {"status":"Deleted", "detail":f"{delete_count} notifications deleted"}

@app.get('/notifications', response_model= List[notificationResponse])
async def read_notifications(db:db_dependency, current_user: User = Depends(get_current_user)):
    db_notification = db.query(Notification).filter(Notification.user_id == current_user.user_id
                      ).order_by(Notification.created_at.desc()).all()
   
    return db_notification

@app.get('/notificount', response_model=dict)
async def get_unread_notification_count(db:db_dependency, current_user:User = Depends(get_current_user)):
    db_notif = db.query(Notification).filter(Notification.user_id == current_user.user_id).count()
    
    return {"unread_notification_count": db_notif}

weather_cache = TTLCache(maxsize=100, ttl=300)

@app.get("/weather/current", response_model=dict)
async def get_current_weather(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.location:
        raise HTTPException(status_code=400, detail="User location not set")
    try:
        lat, lon = parse_location(current_user.location)
        cache_key = f"current:{lat}:{lon}"
        if cache_key in weather_cache:
            print(f"Cache hit for {cache_key}")
            return weather_cache[cache_key]
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPEN_WEATHER_API_KEY}"
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch weather data")
        data = response.json()
        weather_cache[cache_key] = data
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/weather/forecast", response_model=dict)
async def get_weather_forecast(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.location:
        raise HTTPException(status_code=400, detail="User location not set")
    try:
        lat, lon = parse_location(current_user.location)
        cache_key = f"forecast:{lat}:{lon}"
        if cache_key in weather_cache:
            print(f"Cache hit for {cache_key}")
            return weather_cache[cache_key]
        response = requests.get(
            f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={OPEN_WEATHER_API_KEY}"
        )
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch weather data")
        data = response.json()
        weather_cache[cache_key] = data
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
