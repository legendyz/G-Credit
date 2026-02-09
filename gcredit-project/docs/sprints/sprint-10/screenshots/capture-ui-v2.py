"""
Story 10.6a: UI Walkthrough & Screenshot Baseline (v2 - fixed auth timing)
"""
from playwright.sync_api import sync_playwright
import os
import time

BASE_URL = "http://localhost:5173"
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

def login_and_wait(page, role):
    """Login and wait for full page load after redirect"""
    user = USERS[role]
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    
    # Fill login form
    page.fill('input[type="email"]', user["email"])
    page.fill('input[type="password"]', user["password"])
    
    # Submit and wait for redirect
    page.click('button[type="submit"]')
    
    # Wait for URL to change from /login
    page.wait_for_url(lambda url: "/login" not in url, timeout=10000)
    page.wait_for_load_state("networkidle")
    time.sleep(2)  # Extra time for toast to appear and data to load
    
    print(f"  Logged in as {role} -> {page.url}")

def navigate_and_wait(page, path, wait_secs=2):
    """Navigate to a path and wait for content to load"""
    page.goto(f"{BASE_URL}{path}")
    page.wait_for_load_state("domcontentloaded")
    time.sleep(wait_secs)

def main():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # ========================================
        # PUBLIC PAGES
        # ========================================
        print("\n=== PUBLIC PAGES ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "01-login-page")
        
        page.goto(f"{BASE_URL}/nonexistent-page")
        page.wait_for_load_state("domcontentloaded")
        time.sleep(1)
        screenshot(page, "02-404-page")
        
        page.goto(f"{BASE_URL}/verify/550e8400-e29b-41d4-a716-446655440001", timeout=15000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(3)
        screenshot(page, "03-verify-badge-page")
        
        page.goto(f"{BASE_URL}/verify/invalid-id-12345", timeout=15000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(2)
        screenshot(page, "04-verify-badge-not-found")
        
        page.close()
        
        # ========================================
        # ADMIN ROLE
        # ========================================
        print("\n=== ADMIN ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login_and_wait(page, "admin")
        
        # Wait for toast to disappear
        time.sleep(2)
        screenshot(page, "10-admin-dashboard")
        
        navigate_and_wait(page, "/admin/badges", 3)
        screenshot(page, "11-admin-badge-management")
        
        navigate_and_wait(page, "/admin/users", 3)
        screenshot(page, "12-admin-user-management")
        
        navigate_and_wait(page, "/admin/analytics", 3)
        screenshot(page, "13-admin-analytics")
        
        navigate_and_wait(page, "/admin/bulk-issuance", 3)
        screenshot(page, "14-admin-bulk-issuance")
        
        navigate_and_wait(page, "/wallet", 3)
        screenshot(page, "15-admin-wallet")
        
        page.close()
        
        # ========================================
        # ISSUER ROLE
        # ========================================
        print("\n=== ISSUER ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login_and_wait(page, "issuer")
        time.sleep(2)
        screenshot(page, "20-issuer-dashboard")
        
        navigate_and_wait(page, "/admin/badges", 3)
        screenshot(page, "21-issuer-badge-management")
        
        navigate_and_wait(page, "/admin/analytics", 3)
        screenshot(page, "22-issuer-analytics")
        
        navigate_and_wait(page, "/admin/bulk-issuance", 3)
        screenshot(page, "23-issuer-bulk-issuance")
        
        page.close()
        
        # ========================================
        # MANAGER ROLE
        # ========================================
        print("\n=== MANAGER ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login_and_wait(page, "manager")
        time.sleep(2)
        screenshot(page, "30-manager-dashboard")
        
        navigate_and_wait(page, "/wallet", 3)
        screenshot(page, "31-manager-wallet")
        
        page.close()
        
        # ========================================
        # EMPLOYEE ROLE
        # ========================================
        print("\n=== EMPLOYEE ROLE ===")
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        login_and_wait(page, "employee")
        time.sleep(2)
        screenshot(page, "40-employee-dashboard")
        
        navigate_and_wait(page, "/wallet", 3)
        screenshot(page, "41-employee-wallet")
        
        page.close()
        
        # ========================================
        # MOBILE VIEWPORT
        # ========================================
        print("\n=== MOBILE VIEWPORT ===")
        page = browser.new_page(viewport={"width": 375, "height": 812})
        
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        screenshot(page, "50-mobile-login")
        
        page.goto(f"{BASE_URL}/verify/550e8400-e29b-41d4-a716-446655440001", timeout=15000)
        page.wait_for_load_state("domcontentloaded")
        time.sleep(3)
        screenshot(page, "51-mobile-verify")
        
        login_and_wait(page, "employee")
        time.sleep(2)
        screenshot(page, "52-mobile-employee-dashboard")
        
        navigate_and_wait(page, "/wallet", 3)
        screenshot(page, "53-mobile-employee-wallet")
        
        page.close()
        browser.close()
        
    print(f"\n✅ All screenshots saved to: {SCREENSHOT_DIR}")
    print(f"📁 Total: {len([f for f in os.listdir(SCREENSHOT_DIR) if f.endswith('.png')])} PNG files")

if __name__ == "__main__":
    main()
