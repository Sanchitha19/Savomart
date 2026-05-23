import httpx
import json

base_url = "http://localhost:8001"
client = httpx.Client(base_url=base_url)
token = ""
headers = {}

def run_tests():
    global token, headers
    print("BACKEND VERIFICATION")
    print("====================")
    
    # TEST 1 - Health
    res = client.get("/health")
    if res.status_code == 200 and res.json() == {"status": "ok"}:
        print("TEST 1  Health Check         [ PASS ]")
    else:
        print(f"TEST 1  Health Check         [ FAIL ] {res.text}")

    # TEST 2 - Request OTP
    res = client.post("/api/auth/request-otp", json={"phone_number": "9999999999"})
    if res.status_code == 200 and "demo_otp" in res.json():
        print("TEST 2  Request OTP          [ PASS ]")
        otp = res.json()["demo_otp"]
    else:
        print(f"TEST 2  Request OTP          [ FAIL ] {res.text}")
        otp = "000000"

    # TEST 3 - Verify OTP
    res = client.post("/api/auth/verify-otp", json={"phone_number": "9999999999", "otp": otp})
    if res.status_code == 200 and "access_token" in res.json():
        print("TEST 3  Verify OTP           [ PASS ]")
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
    else:
        print(f"TEST 3  Verify OTP           [ FAIL ] {res.text}")

    # TEST 4 - Get Profile
    res = client.get("/api/users/me", headers=headers)
    if res.status_code == 200 and "name" in res.json():
        print("TEST 4  Get Profile          [ PASS ]")
    else:
        print(f"TEST 4  Get Profile          [ FAIL ] {res.text}")

    # TEST 5 - Get Stats
    res = client.get("/api/users/me/stats", headers=headers)
    if res.status_code == 200 and "points_balance" in res.json():
        print("TEST 5  Get Stats            [ PASS ]")
    else:
        print(f"TEST 5  Get Stats            [ FAIL ] {res.text}")

    # TEST 6 - Get Coupons
    res = client.get("/api/users/me/coupons", headers=headers)
    if res.status_code == 200 and isinstance(res.json(), list) and len(res.json()) >= 2:
        print("TEST 6  Get Coupons          [ PASS ]")
    else:
        print(f"TEST 6  Get Coupons          [ FAIL ] {res.text}")

    # TEST 7 - Points History
    res = client.get("/api/users/me/points-history", headers=headers)
    if res.status_code == 200 and isinstance(res.json(), list) and len(res.json()) >= 5:
        print("TEST 7  Points History       [ PASS ]")
    else:
        print(f"TEST 7  Points History       [ FAIL ] {res.text}")

    # TEST 8 - All Offers
    res = client.get("/api/offers", headers=headers)
    if res.status_code == 200 and isinstance(res.json(), list) and len(res.json()) == 10:
        print("TEST 8  All Offers           [ PASS ]")
    else:
        print(f"TEST 8  All Offers           [ FAIL ] {res.text}")

    # TEST 9 - Filter Offers
    res = client.get("/api/offers?category=Dairy", headers=headers)
    if res.status_code == 200 and isinstance(res.json(), list):
        print("TEST 9  Filter Offers        [ PASS ]")
    else:
        print(f"TEST 9  Filter Offers        [ FAIL ] {res.text}")

    # TEST 10 - Get Stores
    res = client.get("/api/stores", headers=headers)
    if res.status_code == 200 and isinstance(res.json(), list):
        print("TEST 10 Get Stores           [ PASS ]")
    else:
        print(f"TEST 10 Get Stores           [ FAIL ] {res.text}")

    # TEST 11 - Nearest Stores
    res = client.get("/api/stores/nearest?lat=12.9352&lng=77.6245", headers=headers)
    if res.status_code == 200 and isinstance(res.json(), list):
        print("TEST 11 Nearest Stores       [ PASS ]")
    else:
        print(f"TEST 11 Nearest Stores       [ FAIL ] {res.text}")

    # TEST 12 - Support Request
    req_body = {
        "name": "Test User",
        "phone": "9999999999",
        "email": "test@test.com",
        "issue_category": "Points Issue",
        "description": "My points were not credited after purchase worth Rs 500"
    }
    res = client.post("/api/support/request", headers=headers, json=req_body)
    if res.status_code == 200 and "ticket_id" in res.json():
        print("TEST 12 Support Request      [ PASS ]")
    else:
        print(f"TEST 12 Support Request      [ FAIL ] {res.text}")

    # TEST 13 - AI Chat Step 1
    chat_body1 = {
        "message": "Hi I need help",
        "session_id": "test-001",
        "history": []
    }
    res = client.post("/api/support/chat", headers=headers, json=chat_body1)
    if res.status_code == 200 and "name" in res.json().get("response", "").lower():
        print("TEST 13 AI Chat Step 1       [ PASS ]")
    else:
        print(f"TEST 13 AI Chat Step 1       [ FAIL ] {res.text}")

    # TEST 14 - AI Chat Step 2
    chat_body2 = {
        "message": "My name is Raj",
        "session_id": "test-001",
        "history": [{"role":"user","content":"Hi I need help"}]
    }
    res = client.post("/api/support/chat", headers=headers, json=chat_body2)
    if res.status_code == 200 and "phone" in res.json().get("response", "").lower():
        print("TEST 14 AI Chat Step 2       [ PASS ]")
    else:
        print(f"TEST 14 AI Chat Step 2       [ FAIL ] {res.text}")

    print("====================")

if __name__ == '__main__':
    run_tests()
