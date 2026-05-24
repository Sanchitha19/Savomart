from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from models import User, Coupon, Offer, PointsTransaction, Admin
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_admin(db: Session):
    """Create a default admin account if none exists."""
    if db.query(Admin).count() == 0:
        admin = Admin(
            email="admin@savomart.in",
            password_hash=pwd_context.hash("Admin@123"),
            name="Savomart Admin"
        )
        db.add(admin)
        db.commit()
        print("Admin created: admin@savomart.in / Admin@123")


def seed_db():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).count() > 0:
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 1. Seed Users
        users_data = [
            {
                "phone_number": "9999999999",
                "name": "Priya Sharma",
                "email": "priya.sharma@example.com",
                "points_balance": 2450,
                "tier": "Gold",
                "member_since": datetime.utcnow() - timedelta(days=120)
            },
            {
                "phone_number": "8888888888",
                "name": "Rahul Mehta",
                "email": "rahul.mehta@example.com",
                "points_balance": 850,
                "tier": "Silver",
                "member_since": datetime.utcnow() - timedelta(days=45)
            },
            {
                "phone_number": "7777777777",
                "name": "Anita Patel",
                "email": "anita.patel@example.com",
                "points_balance": 5200,
                "tier": "Platinum",
                "member_since": datetime.utcnow() - timedelta(days=365)
            }
        ]

        users = []
        for u in users_data:
            user = User(
                phone_number=u["phone_number"],
                name=u["name"],
                email=u["email"],
                points_balance=u["points_balance"],
                tier=u["tier"],
                member_since=u["member_since"],
                is_active=True
            )
            db.add(user)
            users.append(user)
        
        # Flush to get user IDs
        db.flush()
        print("3 users created")

        # 2. Seed Coupons for each user
        # We append user phone number suffix to Coupon code to make it unique per database constraint
        coupons_templates = [
            {
                "code": "SAVE50",
                "title": "Flat ₹50 Off",
                "description": "Get flat ₹50 discount on purchases above ₹300.",
                "discount_type": "flat",
                "discount_value": 50.0,
                "min_purchase": 300.0,
                "valid_days": 30,
                "applicable_stores": None
            },
            {
                "code": "FRESH20",
                "title": "20% Off Fresh Produce",
                "description": "Enjoy 20% off on fresh fruits and vegetables.",
                "discount_type": "percentage",
                "discount_value": 20.0,
                "min_purchase": 150.0,
                "valid_days": 15,
                "applicable_stores": None
            },
            {
                "code": "DAIRY10",
                "title": "10% Off Dairy Range",
                "description": "Get 10% discount on all milk, butter, and cheese products.",
                "discount_type": "percentage",
                "discount_value": 10.0,
                "min_purchase": 100.0,
                "valid_days": 7,
                "applicable_stores": "store_001,store_002"
            },
            {
                "code": "WEEKEND25",
                "title": "25% Weekend Bonanza",
                "description": "Get 25% off on weekend grocery orders.",
                "discount_type": "percentage",
                "discount_value": 25.0,
                "min_purchase": 500.0,
                "valid_days": 60,
                "applicable_stores": None
            }
        ]

        # Add 2-3 coupons to each user
        for idx, user in enumerate(users):
            # Select different subsets of coupons for variety
            if idx == 0:  # Priya
                selected = coupons_templates[:3]
            elif idx == 1:  # Rahul
                selected = [coupons_templates[0], coupons_templates[2]]
            else:  # Anita
                selected = coupons_templates[:]

            for c in selected:
                coupon = Coupon(
                    user_id=user.id,
                    code=f"{c['code']}-{user.phone_number[-4:]}",
                    title=c["title"],
                    description=c["description"],
                    discount_type=c["discount_type"],
                    discount_value=c["discount_value"],
                    min_purchase=c["min_purchase"],
                    expiry_date=datetime.utcnow() + timedelta(days=c["valid_days"]),
                    is_used=False,
                    applicable_stores=c["applicable_stores"]
                )
                db.add(coupon)

        # 3. Seed Offers (10 items across categories)
        offers_data = [
            {
                "title": "Fresh Vegetables 30% Off",
                "description": "Daily harvest organic and fresh vegetables at flat 30% off.",
                "discount_type": "percentage",
                "discount_value": 30.0,
                "category": "Groceries",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=1),
                "valid_until": datetime.utcnow() + timedelta(days=10),
                "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 0.0,
                "max_discount": 200.0
            },
            {
                "title": "Buy 2 Get 1 Free - Dairy",
                "description": "Purchase any 2 Amul or Mother Dairy items and get 1 free.",
                "discount_type": "percentage",
                "discount_value": 33.3,
                "category": "Dairy",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=2),
                "valid_until": datetime.utcnow() + timedelta(days=5),
                "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 200.0,
                "max_discount": None
            },
            {
                "title": "Bakery Items 20% Off after 6PM",
                "description": "Delicious breads, buns, and cakes at 20% discount on evening hours.",
                "discount_type": "percentage",
                "discount_value": 20.0,
                "category": "Bakery",
                "store_id": "store_001",
                "store_name": "Savomart - Indiranagar, Bengaluru",
                "valid_from": datetime.utcnow() - timedelta(days=1),
                "valid_until": datetime.utcnow() + timedelta(days=20),
                "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 100.0,
                "max_discount": 100.0
            },
            {
                "title": "Weekend Special - 15% on Beverages",
                "description": "Stock up on soft drinks, juices, and health drinks with 15% off.",
                "discount_type": "percentage",
                "discount_value": 15.0,
                "category": "Beverages",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=1),
                "valid_until": datetime.utcnow() + timedelta(days=15),
                "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 300.0,
                "max_discount": 150.0
            },
            {
                "title": "New Member Bonus - 500 Points",
                "description": "Earn 500 bonus loyalty points on your first checkout.",
                "discount_type": "flat",
                "discount_value": 500.0,
                "category": "Bonus",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=30),
                "valid_until": datetime.utcnow() + timedelta(days=365),
                "image_url": "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 1000.0,
                "max_discount": None
            },
            {
                "title": "Personal Care 25% Off",
                "description": "Get 25% off on shampoos, soaps, and deodorants.",
                "discount_type": "percentage",
                "discount_value": 25.0,
                "category": "Personal Care",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=3),
                "valid_until": datetime.utcnow() + timedelta(days=8),
                "image_url": "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 400.0,
                "max_discount": 250.0
            },
            {
                "title": "Frozen Foods Clearance 40% Off",
                "description": "Save big! Get 40% discount on frozen peas, fries, and ready-to-eat snacks.",
                "discount_type": "percentage",
                "discount_value": 40.0,
                "category": "Frozen Foods",
                "store_id": "store_002",
                "store_name": "Savomart - Koramangala, Bengaluru",
                "valid_from": datetime.utcnow() - timedelta(days=1),
                "valid_until": datetime.utcnow() + timedelta(days=4),
                "image_url": "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 250.0,
                "max_discount": 300.0
            },
            {
                "title": "Breakfast Combo Deal",
                "description": "Buy bread, eggs, and juice together and save flat ₹60.",
                "discount_type": "flat",
                "discount_value": 60.0,
                "category": "Groceries",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=2),
                "valid_until": datetime.utcnow() + timedelta(days=12),
                "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 350.0,
                "max_discount": None
            },
            {
                "title": "Organic Range 10% Off",
                "description": "Special discount on organic honey, pulses, and brown rice.",
                "discount_type": "percentage",
                "discount_value": 10.0,
                "category": "Groceries",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=5),
                "valid_until": datetime.utcnow() + timedelta(days=15),
                "image_url": "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 500.0,
                "max_discount": 100.0
            },
            {
                "title": "Birthday Month Special - 50% Off",
                "description": "Half price on birthday cakes and celebration snack boxes.",
                "discount_type": "percentage",
                "discount_value": 50.0,
                "category": "Bakery",
                "store_id": None,
                "store_name": "All Stores",
                "valid_from": datetime.utcnow() - timedelta(days=10),
                "valid_until": datetime.utcnow() + timedelta(days=25),
                "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=60",
                "min_purchase": 600.0,
                "max_discount": 500.0
            }
        ]

        for o in offers_data:
            offer = Offer(
                title=o["title"],
                description=o["description"],
                discount_type=o["discount_type"],
                discount_value=o["discount_value"],
                category=o["category"],
                store_id=o["store_id"],
                store_name=o["store_name"],
                valid_from=o["valid_from"],
                valid_until=o["valid_until"],
                image_url=o["image_url"],
                is_active=True,
                min_purchase=o["min_purchase"],
                max_discount=o["max_discount"]
            )
            db.add(offer)

        # Flash sale offer expiring very soon (for countdown timer demo)
        flash_sale = Offer(
            title="⚡ Flash Sale — 50% Off Snacks",
            description="Limited time flash sale on all snacks and namkeen! Grab them before they're gone!",
            discount_type="percentage",
            discount_value=50.0,
            category="Groceries",
            store_id=None,
            store_name="All Stores",
            valid_from=datetime.utcnow() - timedelta(hours=1),
            valid_until=datetime.utcnow() + timedelta(hours=3),
            image_url="https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&auto=format&fit=crop&q=60",
            is_active=True,
            min_purchase=0.0,
            max_discount=200.0
        )
        db.add(flash_sale)

        # 4. Points Transactions (last 10 transactions for each user)
        # Create different transactions that sum up to user's current points balance
        # For simplicity, we create 10 transactions: some positive (earned), some negative (redeemed)
        import random
        
        # Helper to distribute transactions
        def create_transactions_for_user(user, initial_points):
            transactions = []
            
            # Start with a welcome bonus
            t1 = PointsTransaction(
                user_id=user.id,
                points=100,
                description="Welcome Sign-up Bonus",
                transaction_type="bonus",
                created_at=user.member_since + timedelta(minutes=5)
            )
            db.add(t1)
            transactions.append(t1)
            
            running_balance = 100
            
            for i in range(2, 11):
                days_after = int((datetime.utcnow() - user.member_since).days * (i / 10.0))
                tx_date = user.member_since + timedelta(days=days_after)
                
                # Alternate between earn, bonus, and redemption
                if i in [3, 7] and running_balance > 300:
                    # Redeemed
                    pts = -random.choice([100, 200, 300])
                    desc = "Points redeemed for in-store discount"
                    tx_type = "redeemed"
                elif i in [5, 9]:
                    # Bonus
                    pts = random.choice([50, 100, 150])
                    desc = f"Campaign Bonus Points: Festival Week"
                    tx_type = "bonus"
                else:
                    # Earned
                    pts = random.randint(150, 450)
                    desc = f"Earned points on checkout bill #{random.randint(10000, 99999)}"
                    tx_type = "earned"
                    
                # Fix up the last transaction so the sum is exact
                if i == 10:
                    pts = initial_points - running_balance
                    if pts >= 0:
                        desc = f"Earned points on checkout bill #{random.randint(10000, 99999)}"
                        tx_type = "earned"
                    else:
                        desc = "Points redeemed for in-store discount"
                        tx_type = "redeemed"
                
                running_balance += pts
                
                tx = PointsTransaction(
                    user_id=user.id,
                    points=pts,
                    description=desc,
                    transaction_type=tx_type,
                    created_at=tx_date
                )
                db.add(tx)
                transactions.append(tx)
            
            return transactions

        for user in users:
            create_transactions_for_user(user, user.points_balance)

        db.commit()
        print("Seed data inserted")
        print("Database seeded successfully with users, coupons, offers, and transactions!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
