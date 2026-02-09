"""
Story 10.6a: UI Walkthrough & Screenshot Baseline
Captures screenshots of all pages across 4 roles.
"""
from playwright.sync_api import sync_playwright
import os
import time

BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:3000"
SCREENSHOT_DIR = r"C:\G_Credit\CODE\gcredit-project\docs\sprints\sprint-10\screenshots"

USERS = {
    "admin": {"email": "admin@gcredit.com", "password": "password123"},
    "issuer": {"email": "issuer@gcredit.com", "password": "password123"},
    "manager": {"email": "manager@gcredit.com", "password": "password123"},
    "employee": {"email": "M365DevAdmin@2wjh85.onmicrosoft.com", "password": "password123"},
}

def screenshot(page, name, full_page=True):
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=full_page)
    print(f"  [OK] {name}.png")

def login(page, role):
    user = USERS[role]
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    
    # Fill login form
    page.fill('input[type="email"], input[name="email"]', user["email"])
    page.fill('input[type="password"], input[name="password"]', user["password"])
    
    # Click login button
    page.click('button[type="submit"]')
    page.wait_for_load_state("networkidle")
    time.sleep(1)  # Wait for redirect

def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # ========================================
        # 1. PUBLIC PAGES (no login required)
        # ========================================
        print("\n=== PUBLIC PAGES ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        # Login page
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        screenshot(page, "01-login-page")
        
        # 404 page
        page.goto(f"{BASE_URL}/nonexistent-page")
        page.wait_for_load_state("networkidle")
        screenshot(page, "02-404-page")
        
        # Verification page (with known badge ID)
        page.goto(f"{BASE_URL}/verify/550e8400-e29b-41d4-a716-446655440001", timeout=15000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(3)
        screenshot(page, "03-verify-badge-page")
        
        # Verification page (invalid ID)
        page.goto(f"{BASE_URL}/verify/invalid-id-12345", timeout=15000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(2)
        screenshot(page, "04-verify-badge-not-found")
        
        page.close()
        
        # ========================================
        # 2. ADMIN ROLE
        # ========================================
        print("\n=== ADMIN ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login(page, "admin")
        screenshot(page, "10-admin-dashboard")
        
        page.goto(f"{BASE_URL}/admin/badges")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "11-admin-badge-management")
        
        page.goto(f"{BASE_URL}/admin/users")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "12-admin-user-management")
        
        page.goto(f"{BASE_URL}/admin/analytics")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "13-admin-analytics")
        
        page.goto(f"{BASE_URL}/admin/bulk-issuance")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "14-admin-bulk-issuance")
        
        page.goto(f"{BASE_URL}/wallet")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "15-admin-wallet")
        
        page.close()
        
        # ========================================
        # 3. ISSUER ROLE
        # ========================================
        print("\n=== ISSUER ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login(page, "issuer")
        screenshot(page, "20-issuer-dashboard")
        
        page.goto(f"{BASE_URL}/admin/badges")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "21-issuer-badge-management")
        
        page.goto(f"{BASE_URL}/admin/analytics")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "22-issuer-analytics")
        
        page.goto(f"{BASE_URL}/admin/bulk-issuance")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "23-issuer-bulk-issuance")
        
        page.close()
        
        # ========================================
        # 4. MANAGER ROLE
        # ========================================
        print("\n=== MANAGER ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login(page, "manager")
        screenshot(page, "30-manager-dashboard")
        
        page.goto(f"{BASE_URL}/wallet")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "31-manager-wallet")
        
        page.close()
        
        # ========================================
        # 5. EMPLOYEE ROLE
        # ========================================
        print("\n=== EMPLOYEE ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login(page, "employee")
        screenshot(page, "40-employee-dashboard")
        
        page.goto(f"{BASE_URL}/wallet")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "41-employee-wallet")
        
        page.close()
        
        # ========================================
        # 6. MOBILE VIEWPORT (375px - key pages)
        # ========================================
        print("\n=== MOBILE VIEWPORT ===")
        page = browser.new_page(viewport={"width": 375, "height": 812})
        
        # Mobile login
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        screenshot(page, "50-mobile-login")
        
        # Mobile verification
        page.goto(f"{BASE_URL}/verify/550e8400-e29b-41d4-a716-446655440001", timeout=15000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(3)
        screenshot(page, "51-mobile-verify")
        
        # Mobile wallet (employee)
        login(page, "employee")
        screenshot(page, "52-mobile-employee-dashboard")
        
        page.goto(f"{BASE_URL}/wallet")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "53-mobile-employee-wallet")
        
        page.close()
        
        browser.close()
        
    print(f"\n✅ All screenshots saved to: {SCREENSHOT_DIR}")
    print(f"📁 Total: {len(os.listdir(SCREENSHOT_DIR))} files")

if __name__ == "__main__":
    main()
