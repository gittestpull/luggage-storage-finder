
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/fun')

        # Wait for the specific text of the game which might be rendered
        try:
            # wait for text "Sky Packer" or "스카이 패커"
            # If tofu, we might not match.
            # But the backend sends JSON with text.

            # Let's dump page content to see what's rendered
            page.wait_for_timeout(5000)
            content = page.content()
            print(f'Page content length: {len(content)}')
            if 'Sky Packer' in content:
                print('Found "Sky Packer" in content!')
            elif 'bag-tetris' in content:
                print('Found "bag-tetris" in content!')
            else:
                print('Game text not found in content.')

            page.screenshot(path='verification/fun_page_debug.png')

        except Exception as e:
            print(f'Error: {e}')

        browser.close()

if __name__ == '__main__':
    run()
