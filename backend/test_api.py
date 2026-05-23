import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8001"
results = {}

def report(name, condition, data=None):
    if condition:
        print(f"PASS - {name}")
        results[name] = "PASS"
    else:
        print(f"FAIL - {name}")
        if data:
            print(f"       Data: {data}")
        results[name] = "FAIL"

# TEST 1 - Health Check
try:
    req = urllib.request.Request(f"{BASE_URL}/health")
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 1 Health Check", data.get("status") == "ok", data)
except Exception as e:
    report("TEST 1 Health Check", False, str(e))

# TEST 2 - Request OTP
otp_val = None
try:
    req = urllib.request.Request(f"{BASE_URL}/api/auth/request-otp", method="POST")
    req.add_header("Content-Type", "application/json")
    body = json.dumps({"phone_number": "9999999999"}).encode('utf-8')
    resp = urllib.request.urlopen(req, data=body)
    data = json.loads(resp.read().decode())
    otp_val = data.get("demo_otp")
    report("TEST 2 Request OTP", bool(otp_val) and data.get("message") == "OTP sent", data)
except Exception as e:
    report("TEST 2 Request OTP", False, str(e))

# TEST 3 - Verify OTP
token = None
if otp_val:
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/auth/verify-otp", method="POST")
        req.add_header("Content-Type", "application/json")
        body = json.dumps({"phone_number": "9999999999", "otp": otp_val}).encode('utf-8')
        resp = urllib.request.urlopen(req, data=body)
        data = json.loads(resp.read().decode())
        token = data.get("access_token")
        report("TEST 3 Verify OTP", bool(token), data)
    except Exception as e:
        report("TEST 3 Verify OTP", False, str(e))
else:
    report("TEST 3 Verify OTP", False, "No OTP from Test 2")

headers = {}
if token:
    headers["Authorization"] = f"Bearer {token}"

# TEST 4 - Get Profile
try:
    req = urllib.request.Request(f"{BASE_URL}/api/users/me", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 4 Get Profile", "name" in data and "points_balance" in data and "tier" in data, data)
except Exception as e:
    report("TEST 4 Get Profile", False, str(e))

# TEST 5 - Get Stats
try:
    req = urllib.request.Request(f"{BASE_URL}/api/users/me/stats", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 5 Get Stats", "points_balance" in data and "tier_progress" in data and "next_tier" in data, data)
except Exception as e:
    report("TEST 5 Get Stats", False, str(e))

# TEST 6 - Get Coupons
try:
    req = urllib.request.Request(f"{BASE_URL}/api/users/me/coupons", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 6 Get Coupons", isinstance(data, list) and len(data) >= 2, data)
except Exception as e:
    report("TEST 6 Get Coupons", False, str(e))

# TEST 7 - Points History
try:
    req = urllib.request.Request(f"{BASE_URL}/api/users/me/points-history", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 7 Points History", isinstance(data, list) and len(data) >= 5, data)
except Exception as e:
    report("TEST 7 Points History", False, str(e))

# TEST 8 - All Offers
try:
    req = urllib.request.Request(f"{BASE_URL}/api/offers", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 8 All Offers", isinstance(data, list) and len(data) == 10, data)
except Exception as e:
    report("TEST 8 All Offers", False, str(e))

# TEST 9 - Filter Offers
try:
    req = urllib.request.Request(f"{BASE_URL}/api/offers?category=Dairy", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    is_valid = isinstance(data, list) and all(d.get("category") == "Dairy" for d in data) and len(data) > 0
    report("TEST 9 Filter Offers", is_valid, data)
except Exception as e:
    report("TEST 9 Filter Offers", False, str(e))

# TEST 10 - Get Stores
try:
    req = urllib.request.Request(f"{BASE_URL}/api/stores", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 10 Get Stores", isinstance(data, list) and len(data) > 0 and "name" in data[0] and "latitude" in data[0] and "longitude" in data[0], data)
except Exception as e:
    report("TEST 10 Get Stores", False, str(e))

# TEST 11 - Nearest Stores
try:
    req = urllib.request.Request(f"{BASE_URL}/api/stores/nearest?lat=12.9352&lng=77.6245", headers=headers)
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode())
    report("TEST 11 Nearest Stores", isinstance(data, list) and len(data) <= 3 and "distance_km" in data[0] if data else False, data)
except Exception as e:
    report("TEST 11 Nearest Stores", False, str(e))

# TEST 12 - Support Request
try:
    req = urllib.request.Request(f"{BASE_URL}/api/support/request", method="POST", headers=headers)
    req.add_header("Content-Type", "application/json")
    body = json.dumps({
        "name": "Test User",
        "phone": "9999999999",
        "email": "test@test.com",
        "issue_category": "Points Issue",
        "description": "My points were not credited after purchase worth Rs 500"
    }).encode('utf-8')
    resp = urllib.request.urlopen(req, data=body)
    data = json.loads(resp.read().decode())
    report("TEST 12 Support Request", "ticket_id" in data and "message" in data, data)
except Exception as e:
    report("TEST 12 Support Request", False, str(e))

# TEST 13 - AI Chat Step 1
try:
    req = urllib.request.Request(f"{BASE_URL}/api/support/chat", method="POST", headers=headers)
    req.add_header("Content-Type", "application/json")
    body = json.dumps({
        "message": "Hi I need help",
        "session_id": "test-001",
        "history": []
    }).encode('utf-8')
    resp = urllib.request.urlopen(req, data=body)
    data = json.loads(resp.read().decode())
    report("TEST 13 AI Chat Step 1", "name" in data.get("reply", "").lower(), data)
except Exception as e:
    report("TEST 13 AI Chat Step 1", False, str(e))

# TEST 14 - AI Chat Step 2
try:
    req = urllib.request.Request(f"{BASE_URL}/api/support/chat", method="POST", headers=headers)
    req.add_header("Content-Type", "application/json")
    body = json.dumps({
        "message": "My name is Raj",
        "session_id": "test-001",
        "history": [{"role": "user", "content": "Hi I need help"}]
    }).encode('utf-8')
    resp = urllib.request.urlopen(req, data=body)
    data = json.loads(resp.read().decode())
    report("TEST 14 AI Chat Step 2", "phone" in data.get("reply", "").lower() or "number" in data.get("reply", "").lower(), data)
except Exception as e:
    report("TEST 14 AI Chat Step 2", False, str(e))

print("====================")
print(f"Backend Score: {list(results.values()).count('PASS')} / 14")
