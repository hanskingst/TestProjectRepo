from sqlalchemy import Column, Integer, String,ForeignKey,DateTime,Boolean
from datetime import datetime
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    user_name = Column(String(20), unique=True,nullable=False,index=True )
    user_email = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    location = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.now(),nullable=True) 
    
    notification = relationship("Notification", back_populates="user", cascade="all, delete")
    

class Notification(Base):
    __tablename__ = 'notifications'
    Notification_id = Column(Integer, primary_key=True, autoincrement=True,nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(String(50), nullable=False)
    is_read = Column(Boolean, nullable=False)
    location = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.now() ,nullable= False)
    
    user = relationship("User", back_populates="notification")
    

