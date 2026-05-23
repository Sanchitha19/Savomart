from pydantic import BaseModel, Field, EmailStr, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    phone_number: Optional[str] = None


# --- OTP Schemas ---
class OTPRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$", description="10-digit Indian phone number")

class OTPVerify(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")
    otp_code: str = Field(None, pattern=r"^\d{6}$", description="6-digit OTP code")
    otp: str = Field(None, pattern=r"^\d{6}$", description="Alias for otp_code")

    @model_validator(mode="after")
    def resolve_otp(self) -> "OTPVerify":
        """Accept either `otp` or `otp_code` field."""
        if self.otp_code is None and self.otp is not None:
            self.otp_code = self.otp
        if self.otp_code is None:
            raise ValueError("Either otp_code or otp must be provided")
        return self


# --- Coupon Schemas ---
class CouponResponse(BaseModel):
    id: int
    user_id: int
    code: str
    title: str
    description: str
    discount_type: str
    discount_value: float
    min_purchase: float
    expiry_date: datetime
    is_used: bool
    applicable_stores: Optional[str] = None

    class Config:
        from_attributes = True


# --- Points Transaction Schemas ---
class PointsTransactionResponse(BaseModel):
    id: int
    user_id: int
    points: int
    description: str
    transaction_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- User Schemas ---
class UserBase(BaseModel):
    phone_number: str
    name: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    pass

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    notification_preferences: Optional[Dict[str, bool]] = None

class UserResponse(UserBase):
    id: int
    points_balance: int
    tier: str
    member_since: datetime
    is_active: bool
    notification_preferences: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# --- Offer Schemas ---
class OfferResponse(BaseModel):
    id: int
    title: str
    description: str
    discount_type: str
    discount_value: float
    category: str
    store_id: Optional[str] = None
    store_name: Optional[str] = None
    valid_from: datetime
    valid_until: datetime
    image_url: Optional[str] = None
    is_active: bool
    min_purchase: float
    max_discount: Optional[float] = None

    class Config:
        from_attributes = True


# --- Support Request Schemas ---
class SupportRequestCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., pattern=r"^\d{10}$")
    email: Optional[EmailStr] = None
    issue_category: str  # Points Issue, Coupon Issue, Store Issue, App Issue, Other
    description: str = Field(..., min_length=10, max_length=1000)

class SupportRequestResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    phone: str
    email: Optional[str] = None
    issue_category: str
    description: str
    created_at: datetime
    status: str
    saved_to_excel: bool

    class Config:
        from_attributes = True


# --- AI Chat Schemas ---
class ChatMessage(BaseModel):
    message: str
    session_id: str
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str
    collected_data: Optional[dict] = {}
    is_complete: bool = False
    ticket_id: Optional[str] = None
    quick_replies: Optional[List[str]] = []


# --- Store Schemas (Static DB or seeded metadata) ---
class StoreResponse(BaseModel):
    id: str
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    phone: str
    email: Optional[str] = None
    opening_time: str
    closing_time: str
    distance: Optional[float] = None  # Calculated in nearest store API
    distance_km: Optional[float] = None  # Alias for distance used in /nearest endpoint
