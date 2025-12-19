from playwright.sync_api import sync_playwright

def verify_marketing_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a mobile-like viewport or standard desktop
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Assuming the app is running on port 3000
        # Accessing the marketing page directly
        # Note: Since this is an admin page, it usually requires login.
        # However, for verification, I will try to access it.
        # If it redirects to login, I might need to simulate login or just verify the login page redirection.
        # But wait, I am the developer, I can probably bypass auth for test or just see if the page renders (if I can mock auth).
        # Actually, let's just try to hit the page.

        # NOTE: In a real scenario, I would need to set the adminToken in localStorage.
        # I will try to inject the token if I knew a valid one, but I don't.
        # I will try to simulate the component mounting by navigating.
        # If I get redirected to login, I will take a screenshot of that too.

        page.goto("http://localhost:3000/mgmt-secure/marketing")

        # Wait a bit for redirects or load
        page.wait_for_timeout(3000)

        # Check if we are on the marketing page or login page
        print(f"Current URL: {page.url}")

        # If redirected to login, I will try to login quickly with a mock token if the frontend allows simple bypassing
        # The Sidebar.tsx code checks for 'adminToken' in localStorage for logout,
        # but the middleware probably protects the route.
        # Let's see if we can set localStorage before navigation or during.

        # Screenshot
        page.screenshot(path="verification/marketing_page_attempt.png")
        browser.close()

if __name__ == "__main__":
    verify_marketing_page()
