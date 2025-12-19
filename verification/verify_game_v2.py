
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/fun')

        page.wait_for_timeout(3000)
        page.screenshot(path='verification/fun_page_list_v2.png')

        try:
            # Locate the game card with the specific theme color for Bag Tetris
            card = page.locator('.bg-slate-900').first
            if card.count() > 0:
                print('Found card with bg-slate-900')
                card.click()
                page.wait_for_timeout(3000)
                page.screenshot(path='verification/sky_packer_game.png')
                print('Screenshot saved to verification/sky_packer_game.png')
            else:
                print('Card with bg-slate-900 not found')
                # Fallback: click the last card
                cards = page.locator('.group.relative.rounded-3xl')
                count = cards.count()
                print(f'Found {count} cards')
                if count > 0:
                   cards.nth(count - 1).click()
                   page.wait_for_timeout(3000)
                   page.screenshot(path='verification/sky_packer_game_fallback.png')
                   print('Screenshot saved to verification/sky_packer_game_fallback.png')

        except Exception as e:
            print(f'Error: {e}')

        browser.close()

if __name__ == '__main__':
    run()
