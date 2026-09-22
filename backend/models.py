from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user")


class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_no = Column(String(50), nullable=False, index=True)
    source_stop = Column(String(100), nullable=False, index=True)
    destination_stop = Column(String(100), nullable=False, index=True)
    duration_mins = Column(Integer, nullable=False)
    fare = Column(Float, nullable=False)

    bookings = relationship("Booking", back_populates="route")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("bus_routes.id"), nullable=False)
    ticket_code = Column(String(100), unique=True, nullable=False)
    status = Column(String(50), default="Confirmed")
    booked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    route = relationship("BusRoute", back_populates="bookings")

class BusStop(Base):
    __tablename__ = "bus_stops"
    
    id = Column(Integer, primary_key=True, index=True)
    stop_name = Column(String(255), unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)   

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from database import Base
import datetime

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(50), unique=True, index=True)
    user_email = Column(String(100))
    route_no = Column(String(20))
    source = Column(String(100))
    destination = Column(String(100))
    fare = Column(Float)
    status = Column(String(30), default="PAID") # PAID, CHECKED_IN, COMPLETED
    booked_at = Column(DateTime, default=datetime.datetime.utcnow)
    entry_time = Column(DateTime, nullable=True)
    exit_time = Column(DateTime, nullable=True) 