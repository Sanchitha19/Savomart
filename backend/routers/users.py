from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import User, Coupon, PointsTransaction
from schemas import UserResponse, CouponResponse, PointsTransactionResponse, UserProfileUpdate
from auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """Fetch current logged-in user profile details."""
    return current_user

@router.get("/me/coupons", response_model=List[CouponResponse])
def read_user_coupons(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve coupons applicable to the currently authenticated user."""
    coupons = db.query(Coupon).filter(Coupon.user_id == current_user.id).order_by(Coupon.is_used.asc(), Coupon.expiry_date.asc()).all()
    return coupons

@router.get("/me/points-history", response_model=List[PointsTransactionResponse])
def read_user_points_history(limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch points earned/redeemed transaction history for the authenticated user."""
    transactions = db.query(PointsTransaction).filter(PointsTransaction.user_id == current_user.id).order_by(PointsTransaction.created_at.desc()).limit(limit).all()
    return transactions

@router.get("/me/stats")
def read_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch user stats including tier progress, active coupons, and total points earned."""
    points_balance = current_user.points_balance
    tier = current_user.tier
    
    if tier == "Silver":
        next_tier = "Gold"
        points_to_next = max(0, 1000 - points_balance)
        tier_progress = (points_balance / 1000) * 100 if points_balance < 1000 else 100
    elif tier == "Gold":
        next_tier = "Platinum"
        points_to_next = max(0, 5000 - points_balance)
        tier_progress = ((points_balance - 1000) / 4000) * 100 if points_balance < 5000 else 100
    else:
        next_tier = "None"
        points_to_next = 0
        tier_progress = 100

    now = datetime.utcnow()
    member_since_days = max(0, (now - current_user.member_since).days)

    active_coupons = db.query(Coupon).filter(
        Coupon.user_id == current_user.id,
        Coupon.is_used == False,
        Coupon.expiry_date > now
    ).count()

    total_earned_rows = db.query(PointsTransaction).filter(
        PointsTransaction.user_id == current_user.id,
        PointsTransaction.points > 0
    ).all()
    total_earned = sum(tx.points for tx in total_earned_rows)

    return {
        "points_balance": points_balance,
        "tier": tier,
        "tier_progress": round(tier_progress),
        "next_tier": next_tier,
        "points_to_next_tier": points_to_next,
        "coupons_count": active_coupons,
        "member_since_days": member_since_days,
        "total_points_earned": total_earned
    }

@router.put("/me", response_model=UserResponse)
def update_user_me(update_data: UserProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update current user profile info and notification preferences."""
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.email is not None:
        current_user.email = update_data.email
    if update_data.notification_preferences is not None:
        current_user.notification_preferences = update_data.notification_preferences
    
    db.commit()
    db.refresh(current_user)
    return current_user
