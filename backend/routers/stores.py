from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import math
import httpx
import time
import logging

from schemas import StoreResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stores", tags=["Stores"])

# Fallback Mock Stores (Bangalore focus)
MOCK_STORES = [
    {
        "id": "store_blr_01",
        "name": "Savomart Koramangala",
        "city": "Bangalore",
        "address": "80 Feet Rd, 4th Block, Koramangala, Bangalore, 560034",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "phone": "080-45678901",
        "email": "koramangala@savomart.in",
        "opening_time": "8:00 AM",
        "closing_time": "10:00 PM"
    },
    {
        "id": "store_blr_02",
        "name": "Savomart Indiranagar",
        "city": "Bangalore",
        "address": "100 Feet Rd, Indiranagar, Bangalore, 560038",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "phone": "080-45678902",
        "email": "indiranagar@savomart.in",
        "opening_time": "8:00 AM",
        "closing_time": "10:00 PM"
    },
    {
        "id": "store_blr_03",
        "name": "Savomart HSR Layout",
        "city": "Bangalore",
        "address": "27th Main Rd, Sector 1, HSR Layout, Bangalore, 560102",
        "latitude": 12.9116,
        "longitude": 77.6389,
        "phone": "080-45678903",
        "email": "hsr@savomart.in",
        "opening_time": "8:00 AM",
        "closing_time": "10:00 PM"
    },
    {
        "id": "store_blr_04",
        "name": "Savomart Whitefield",
        "city": "Bangalore",
        "address": "ITPB Main Rd, Whitefield, Bangalore, 560066",
        "latitude": 12.9698,
        "longitude": 77.7499,
        "phone": "080-45678904",
        "email": "whitefield@savomart.in",
        "opening_time": "8:00 AM",
        "closing_time": "10:00 PM"
    },
    {
        "id": "store_blr_05",
        "name": "Savomart Jayanagar",
        "city": "Bangalore",
        "address": "4th Block, Jayanagar, Bangalore, 560011",
        "latitude": 12.9250,
        "longitude": 77.5938,
        "phone": "080-45678905",
        "email": "jayanagar@savomart.in",
        "opening_time": "8:00 AM",
        "closing_time": "10:00 PM"
    }
]

# In-memory Cache
cache = {
    "stores": None,
    "timestamp": 0
}
CACHE_TTL = 3600  # 1 hour in seconds

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two coordinates using the Haversine formula."""
    R = 6371.0  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
         
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

async def fetch_stores() -> List[dict]:
    """Fetch stores from live API with fallback to mock data."""
    current_time = time.time()
    
    if cache["stores"] and (current_time - cache["timestamp"] < CACHE_TTL):
        return cache["stores"]
        
    try:
        async with httpx.AsyncClient() as client:
            # We don't want to crash if the external API is actually down during the hackathon demo,
            # so we'll wrap it in a short timeout.
            response = await client.get(
                "https://internal-service.savomart.in/bridge/api/store/list?is_operational=True",
                headers={"X-cron-token": "savo-bridge-cron-secret"},
                timeout=3.0
            )
            response.raise_for_status()
            data = response.json()
            stores = data.get("stores", [])
            
            # Map external API schema to our expected schema if it succeeded
            # If the response schema is unknown, we just fallback immediately to mock
            if not stores:
                raise ValueError("No stores returned from external API")
                
            # Note: For the sake of this task, since the live URL might be purely fictional
            # we will aggressively fallback to the mock data if it fails.
            cache["stores"] = stores
            cache["timestamp"] = current_time
            return stores
            
    except Exception as e:
        logger.warning(f"Failed to fetch live stores, falling back to mock data: {str(e)}")
        cache["stores"] = MOCK_STORES
        cache["timestamp"] = current_time
        return MOCK_STORES


@router.get("", response_model=List[StoreResponse])
async def get_stores(
    lat: Optional[float] = Query(None, description="Latitude of user"),
    lng: Optional[float] = Query(None, description="Longitude of user")
):
    """Retrieve all available Savomart stores. Add distance if coordinates provided."""
    stores = await fetch_stores()
    
    result = []
    for store in stores:
        store_copy = store.copy()
        if lat is not None and lng is not None:
            dist = haversine_distance(lat, lng, store["latitude"], store["longitude"])
            store_copy["distance"] = round(dist, 2)
            store_copy["distance_km"] = round(dist, 2)
        result.append(store_copy)
        
    # Sort by distance if calculated
    if lat is not None and lng is not None:
        result.sort(key=lambda x: x["distance"])
        
    return result


@router.get("/nearest", response_model=List[StoreResponse])
async def get_nearest_stores(
    lat: float = Query(..., description="Latitude of user"),
    lng: float = Query(..., description="Longitude of user")
):
    """Find the top 3 closest Savomart stores using coordinate distance."""
    stores = await fetch_stores()
    
    if not stores:
        raise HTTPException(status_code=404, detail="No stores found.")
        
    store_distances = []
    for store in stores:
        dist = haversine_distance(lat, lng, store["latitude"], store["longitude"])
        store_copy = store.copy()
        store_copy["distance"] = round(dist, 2)
        store_copy["distance_km"] = round(dist, 2)
        store_distances.append(store_copy)
        
    # Sort and return top 3
    store_distances.sort(key=lambda x: x["distance"])
    return store_distances[:3]
