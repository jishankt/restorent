import unittest
import json
import uuid
from datetime import datetime, timezone
import app1  # Import app module to get access to database/app configuration

class TestSaaSFlow(unittest.TestCase):
    def setUp(self):
        self.app = app1.app.test_client()
        self.app.testing = True

    def test_otp_and_onboarding(self):
        # 1. Request OTP
        test_email = f"testowner_{uuid.uuid4().hex[:6]}@gmail.com"
        res = self.app.post('/api/auth/request-otp', json={"email": test_email})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("debug_otp", data)
        otp = data["debug_otp"]

        # 2. Verify OTP
        res = self.app.post('/api/auth/verify-otp', json={"email": test_email, "otp": otp})
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("token", data)

        # 3. Onboard Organization
        tenant_name = f"Test Restaurant Group {uuid.uuid4().hex[:6]}"
        onboard_payload = {
            "tenant": {
                "tenant_name": tenant_name,
                "country": "UAE",
                "state": "Dubai",
                "city": "Dubai",
                "address": "Downtown Dubai",
                "phone": "+971500000000",
                "email": test_email,
                "admin_email": test_email,
                "subscription_plan": "Silver",
                "admin_username": "testadmin",
                "admin_password": "ownerpassword123"
            },
            "companies": [
                {
                    "company_name": f"{tenant_name} HQ",
                    "company_code": "TRG-HQ",
                    "phone": "+971501111111",
                    "email": "hq@testrest.com",
                    "address": "HQ Office",
                    "admin_email": f"hqadmin_{uuid.uuid4().hex[:4]}@testrest.com",
                    "admin_password": "hqpassword123"
                }
            ],
            "branches": [
                {
                    "company_name": f"{tenant_name} HQ",
                    "branch_name": f"{tenant_name} Dubai Mall",
                    "branch_code": "TRG-DM",
                    "phone": "+971502222222",
                    "email": "dm@testrest.com",
                    "address": "Dubai Mall",
                    "admin_email": f"dmadmin_{uuid.uuid4().hex[:4]}@testrest.com",
                    "admin_password": "dmpassword123"
                }
            ],
            "survey_responses": {
                "operation_type": "Cafe",
                "goal": "Speed up billing & checkout",
                "daily_orders": "200 - 500",
                "dine_in": "Yes"
            },
            "modules_enabled": ["items", "sales", "tables", "kot"],
            "compliance_docs": [
                {
                    "doc_type": "GST/VAT",
                    "reg_number": "VAT-99999",
                    "expiry_date": "2028-12-31"
                },
                {
                    "doc_type": "FSSAI",
                    "reg_number": "FSSAI-88888",
                    "expiry_date": "2027-06-30"
                }
            ]
        }

        res = self.app.post('/api/onboard-organization', json=onboard_payload)
        self.assertEqual(res.status_code, 201, msg=f"Onboard failed: {res.data}")

        # 4. Super Admin Login & Dashboard Check
        # Hardcoded credentials bypass
        login_res = self.app.post('/api/login', json={"email": "admin@kylesolution.com", "password": "admin123"})
        self.assertEqual(login_res.status_code, 200)
        login_data = json.loads(login_res.data)
        token = login_data["token"]

        # Call Dashboard API
        headers = {
            "Authorization": f"Bearer {token}",
            "X-User-Context": json.dumps(login_data["user"])
        }
        res = self.app.get('/api/superadmin/dashboard', headers=headers)
        self.assertEqual(res.status_code, 200)
        dash_data = json.loads(res.data)
        self.assertGreaterEqual(dash_data["total_tenants"], 1)
        self.assertGreaterEqual(dash_data["total_companies"], 1)
        
        # Verify compliance alerts exist
        self.assertTrue(len(dash_data["compliance_alerts"]) > 0)

        # 5. User Invitation & Activation Flow
        # Use company admin context to invite a user
        comp_admin_email = onboard_payload["companies"][0]["admin_email"]
        comp_admin_user = app1.users_collection.find_one({"email": comp_admin_email})
        self.assertIsNotNone(comp_admin_user)
        generated_comp_pwd = comp_admin_user.get("plain_password")
        
        comp_admin_login_res = self.app.post('/api/login', json={"email": comp_admin_email, "password": generated_comp_pwd})
        self.assertEqual(comp_admin_login_res.status_code, 200)
        comp_admin_data = json.loads(comp_admin_login_res.data)
        comp_admin_token = comp_admin_data["token"]
        comp_admin_headers = {
            "Authorization": f"Bearer {comp_admin_token}",
            "X-User-Context": json.dumps(comp_admin_data["user"])
        }

        invite_email = f"waiter_{uuid.uuid4().hex[:4]}@testrest.com"
        invite_res = self.app.post('/api/users/invite', json={
            "email": invite_email,
            "name": "John Waiter",
            "phone": "+971509999999",
            "role": "Waiter"
        }, headers=comp_admin_headers)
        self.assertEqual(invite_res.status_code, 201)
        invite_data = json.loads(invite_res.data)
        self.assertIn("activation_link", invite_data)
        
        # Extract token from link
        link = invite_data["activation_link"]
        invite_token = link.split("inviteToken=")[-1]

        # Activate the user
        activate_res = self.app.post('/api/users/activate', json={
            "token": invite_token,
            "password": "waiterpassword123"
        })
        self.assertEqual(activate_res.status_code, 200)

        # Login as the activated user
        waiter_login_res = self.app.post('/api/login', json={"email": invite_email, "password": "waiterpassword123"})
        self.assertEqual(waiter_login_res.status_code, 200)
        waiter_data = json.loads(waiter_login_res.data)
        self.assertEqual(waiter_data["user"]["role"], "Waiter")

if __name__ == '__main__':
    unittest.main()
