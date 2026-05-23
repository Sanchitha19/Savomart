from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Offer
from schemas import OfferResponse

router = APIRouter(prefix="/offers", tags=["Offers"])

@router.get("", response_model=List[OfferResponse])
def get_offers(
    store_id: Optional[str] = Query(None, description="Filter offers applicable to this store ID"),
    category: Optional[str] = Query(None, description="Filter offers by category"),
    active_only: bool = Query(True, description="Only show active and unexpired offers"),
    db: Session = Depends(get_db)
):
    """Retrieve offers. Filter by store_id, category, or active status."""
    query = db.query(Offer)
    
    if active_only:
        now = datetime.utcnow()
        query = query.filter(
            Offer.is_active == True,
            Offer.valid_from <= now,
            Offer.valid_until >= now
        )
    
    if store_id:
        # Filter for store-specific offers or general offers
        query = query.filter(
            or_(
                Offer.store_id == None,
                Offer.store_id == "",
                Offer.store_id == store_id
            )
        )
        
    if category:
        query = query.filter(Offer.category == category)
        
    return query.order_by(Offer.valid_until.asc()).all()

@router.get("/categories")
def get_offer_categories(db: Session = Depends(get_db)):
    """Retrieve a list of unique offer categories with their counts."""
    now = datetime.utcnow()
    offers = db.query(Offer).filter(
        Offer.is_active == True,
        Offer.valid_from <= now,
        Offer.valid_until >= now
    ).all()
    
    categories = {}
    for offer in offers:
        if offer.category in categories:
            categories[offer.category] += 1
        else:
            categories[offer.category] = 1
            
    return [{"name": k, "count": v} for k, v in categories.items()]

@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer(offer_id: int, db: Session = Depends(get_db)):
    """Retrieve a single offer by ID."""
    from fastapi import HTTPException
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer
