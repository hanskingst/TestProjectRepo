from pydantic import BaseModel,EmailStr,Field
from datetime import datetime
from typing import Optional


class createUser(BaseModel):
    user_name:str = Field(...,min_length=5,description="User name must be atleast 5 characters")
    user_email:EmailStr
    user_password:str = Field(...,min_length=8,description='Password must be atleast 8 characters')
    
class LocationUpdate(BaseModel):
    lon:float
    lat:float
    

class Token(BaseModel):
    access_token:str
    token_type:str


class userResponse(BaseModel):
    user_id:int
    user_name:str
    user_email:EmailStr
    location:Optional[str] = None
    created_at:datetime = Field(default_factory=datetime.now)
    
    class config:
        from_attributes = True