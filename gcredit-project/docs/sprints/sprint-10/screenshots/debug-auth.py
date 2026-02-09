"""
Diagnostic script: Check auth flow and page rendering issues
"""
from playwright.sync_api import sync_playwright
import os
import time
import json

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = r"C:\G_Credit\CODE\gcredit-project\docs\sprints\sprint-10\screenshots\debug"

def screenshot(page, name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  [SCREENSHOT] {name}.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        # 1. Go to login page
        print("=== STEP 1: Login Page ===")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        screenshot(page, "step1-login-page")
        
        # Check what's on the page
        print(f"  URL: {page.url}")
        print(f"  Title: {page.title()}")
        
        # Find form elements
        email_inputs = page.locator('input[type="email"], input[name="email"], input[id*="email"]').all()
        password_inputs = page.locator('input[type="password"], input[name="password"]').all()
        submit_buttons = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').all()
        
        print(f"  Email inputs found: {len(email_inputs)}")
        print(f"  Password inputs found: {len(password_inputs)}")
        print(f"  Submit buttons found: {len(submit_buttons)}")
        
        # Print all input fields on page
        all_inputs = page.locator('input').all()
        print(f"  All inputs: {len(all_inputs)}")
        for i, inp in enumerate(all_inputs):
            try:
                attrs = page.evaluate("""(el) => {
                    return { type: el.type, name: el.name, id: el.id, placeholder: el.placeholder, class: el.className }
                }""", inp.element_handle())
                print(f"    input[{i}]: {attrs}")
            except:
                print(f"    input[{i}]: (could not read attrs)")
        
        # Print all buttons
        all_buttons = page.locator('button').all()
        print(f"  All buttons: {len(all_buttons)}")
        for i, btn in enumerate(all_buttons):
            try:
                text = btn.inner_text()
                print(f"    button[{i}]: '{text}'")
            except:
                print(f"    button[{i}]: (could not read)")
        
        # 2. Try to fill and submit login
        print("\n=== STEP 2: Attempt Login as Admin ===")
        try:
            # Try different selectors for email
            email_filled = False
            for selector in ['input[type="email"]', 'input[name="email"]', 'input[id*="email"]', 'input:first-of-type']:
                try:
                    page.fill(selector, "admin@gcredit.com", timeout=3000)
                    email_filled = True
                    print(f"  Email filled using: {selector}")
                    break
                except:
                    continue
            
            if not email_filled:
                print("  ERROR: Could not fill email field!")
                # Try to get page HTML for debugging
                html = page.content()
                print(f"  Page HTML length: {len(html)}")
                # Save first 2000 chars
                print(f"  HTML preview: {html[:2000]}")
            
            # Try password
            pwd_filled = False
            for selector in ['input[type="password"]', 'input[name="password"]']:
                try:
                    page.fill(selector, "password123", timeout=3000)
                    pwd_filled = True
                    print(f"  Password filled using: {selector}")
                    break
                except:
                    continue
            
            if not pwd_filled:
                print("  ERROR: Could not fill password field!")
            
            screenshot(page, "step2-form-filled")
            
            # Try submit
            submitted = False
            for selector in ['button[type="submit"]', 'button:has-text("Sign In")', 'button:has-text("Login")', 'button:has-text("Log in")']:
                try:
                    page.click(selector, timeout=3000)
                    submitted = True
                    print(f"  Submitted using: {selector}")
                    break
                except:
                    continue
            
            if not submitted:
                print("  ERROR: Could not find submit button!")
            
        except Exception as e:
            print(f"  Login error: {e}")
        
        # 3. Wait for login result
        print("\n=== STEP 3: Post-Login ===")
        time.sleep(3)
        page.wait_for_load_state("domcontentloaded")
        screenshot(page, "step3-after-login")
        print(f"  URL after login: {page.url}")
        
        # Check localStorage for tokens
        try:
            storage = page.evaluate("""() => {
                const result = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    result[key] = localStorage.getItem(key);
                }
                return result;
            }""")
            print(f"  localStorage keys: {list(storage.keys())}")
            for k, v in storage.items():
                preview = v[:100] if v else 'null'
                print(f"    {k}: {preview}...")
        except Exception as e:
            print(f"  Could not read localStorage: {e}")
        
        # Check console errors
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
        
        # 4. Try navigating to admin dashboard
        print("\n=== STEP 4: Navigate to Dashboard ===")
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("domcontentloaded")
        time.sleep(2)
        screenshot(page, "step4-dashboard")
        print(f"  URL: {page.url}")
        
        # Check page content
        body_text = page.locator('body').inner_text()
        print(f"  Body text preview: {body_text[:500]}")
        
        # 5. Try admin/badges
        print("\n=== STEP 5: Navigate to /admin/badges ===")
        page.goto(f"{BASE_URL}/admin/badges")
        page.wait_for_load_state("domcontentloaded")
        time.sleep(2)
        screenshot(page, "step5-admin-badges")
        print(f"  URL: {page.url}")
        body_text = page.locator('body').inner_text()
        print(f"  Body text preview: {body_text[:500]}")
        
        # Print console messages
        if console_messages:
            print(f"\n  Console messages: {len(console_messages)}")
            for msg in console_messages[-20:]:
                print(f"    {msg}")
        
        browser.close()

if __name__ == "__main__":
    main()
