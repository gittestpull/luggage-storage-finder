
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Navigate to the games list page
        page.goto('http://localhost:3000/fun')

        # Take a screenshot of the games list
        page.screenshot(path='verification/fun_page_list.png')
        print('Screenshot saved to verification/fun_page_list.png')

        # Click on the new game 'Sky Packer'
        # Since text might be tofu, we look for 'Sky Packer' if rendered, or by index/structure.
        # But we added Korean names. Playwright might see tofu or text code.
        # We can try selecting by text or if not working, by the card container.
        # The card has 'Sky Packer' in name if English or Korean.
        # In code: name: 'Sky Packer (스카이 패커)'

        # Let's try to find the text 'Sky Packer'
        try:
            page.get_by_text('Sky Packer').click()
            page.wait_for_timeout(2000) # Wait for game to load/canvas
            page.screenshot(path='verification/sky_packer_game.png')
            print('Screenshot saved to verification/sky_packer_game.png')
        except Exception as e:
            print(f'Error clicking game: {e}')

        browser.close()

if __name__ == '__main__':
    run()
