from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import User, Coupon, PointsTransaction
from schemas import UserResponse, CouponResponse, PointsTransactionResponse, UserProfileUpdate, PaginatedPointsHistory
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

@router.get("/me/points-history", response_model=PaginatedPointsHistory)
def read_user_points_history(limit: int = 10, skip: int = 0, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch points earned/redeemed transaction history for the authenticated user."""
    query = db.query(PointsTransaction).filter(PointsTransaction.user_id == current_user.id).order_by(PointsTransaction.created_at.desc())
    total = query.count()
    transactions = query.offset(skip).limit(limit).all()
    pages = (total + limit - 1) // limit if limit > 0 else 1
    page = (skip // limit) + 1 if limit > 0 else 1
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/me/stats")
def read_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch user stats including tier progress, active coupons, and total points earned."""
    points_balance = current_user.points_balance
    tier = current_user.tier
    
    if points_balance <= 2000:
        tier = "Silver"
        next_tier = "Gold"
        points_to_next = max(0, 2001 - points_balance)
        tier_progress = (points_balance / 2000) * 100
    elif points_balance <= 5000:
        tier = "Gold"
        next_tier = "Platinum"
        points_to_next = max(0, 5001 - points_balance)
        tier_progress = ((points_balance - 2001) / 2999) * 100
    else:
        tier = "Platinum"
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
