from pydantic import BaseModel,Field
from datetime import datetime
from typing import Optional

class notificationCreate(BaseModel):
    message:str
    is_read:bool = False
    location:str

class notificationResponse(BaseModel):
    notification_id:int
    message:str
    is_read:bool = False
    location:str
    created_at:datetime = Field(default_factory=datetime.now)
    
    class config:
        from_attributes = True