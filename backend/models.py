from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import random
import string

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    points_balance = Column(Integer, default=0)
    tier = Column(String, default="Silver")  # Silver, Gold, Platinum
    member_since = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    notification_preferences = Column(JSON, default={
        "offers_alerts": True,
        "points_updates": True,
        "coupon_expiry": True,
        "store_updates": False
    })

    # Relationships
    coupons = relationship("Coupon", back_populates="user", cascade="all, delete-orphan")
    points_transactions = relationship("PointsTransaction", back_populates="user", cascade="all, delete-orphan")
    support_requests = relationship("SupportRequest", back_populates="user", cascade="all, delete-orphan")


class OTPStore(Base):
    __tablename__ = "otpstore"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, nullable=False)
    otp_code = Column(String(6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generate a numeric OTP of given length."""
        return ''.join(random.choices(string.digits, k=length))


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    discount_type = Column(String, nullable=False)  # percentage or flat
    discount_value = Column(Float, nullable=False)
    min_purchase = Column(Float, default=0.0)
    expiry_date = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    applicable_stores = Column(String, nullable=True)  # comma-separated store IDs or null for all

    # Relationships
    user = relationship("User", back_populates="coupons")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    discount_type = Column(String, nullable=False)  # percentage or flat
    discount_value = Column(Float, nullable=False)
    category = Column(String, nullable=False)  # Groceries, Dairy, Bakery, Beverages, Personal Care etc.
    store_id = Column(String, nullable=True)  # null means all stores
    store_name = Column(String, nullable=True)
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, nullable=False)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    min_purchase = Column(Float, default=0.0)
    max_discount = Column(Float, nullable=True)


class SupportRequest(Base):
    __tablename__ = "supportrequests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    issue_category = Column(String, nullable=False)  # Points Issue, Coupon Issue, Store Issue, App Issue, Other
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Open")  # Open, InProgress, Resolved
    saved_to_excel = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="support_requests")


class PointsTransaction(Base):
    __tablename__ = "pointstransactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, nullable=False)  # positive=earned, negative=redeemed
    description = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # earned, redeemed, expired, bonus
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="points_transactions")
