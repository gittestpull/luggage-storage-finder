from playwright.sync_api import sync_playwright

def verify_marketing_page_mock_auth():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})

        # We need to inject the token before navigation.
        # But we can't easily access localStorage before a page loads on that domain.
        # Strategy: Go to login page, evaluate script to set token, then go to marketing page.

        page = context.new_page()
        page.goto("http://localhost:3000/mgmt-secure/login")

        # Inject mock token
        page.evaluate("localStorage.setItem('adminToken', 'mock-token-for-verification')")

        # Navigate to marketing page
        page.goto("http://localhost:3000/mgmt-secure/marketing")
        page.wait_for_timeout(2000) # Wait for client-side redirect logic to pass

        print(f"Current URL: {page.url}")

        # Screenshot
        page.screenshot(path="verification/marketing_page_mock_auth.png")
        browser.close()

if __name__ == "__main__":
    verify_marketing_page_mock_auth()
