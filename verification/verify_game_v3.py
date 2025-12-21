
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000/fun')

        print('Waiting for page to load...')
        page.wait_for_timeout(10000) # Wait 10s for API
        page.screenshot(path='verification/fun_page_list_v3.png')
        print('Screenshot saved to verification/fun_page_list_v3.png')

        try:
            # Locate the game card with the specific theme color for Bag Tetris
            # Class: bg-slate-900
            card = page.locator('.bg-slate-900').first
            if card.count() > 0:
                print('Found card with bg-slate-900')
                card.click()
                print('Clicked card, waiting for game...')
                page.wait_for_timeout(5000)
                page.screenshot(path='verification/sky_packer_game.png')
                print('Screenshot saved to verification/sky_packer_game.png')
            else:
                print('Card with bg-slate-900 not found')
                # Debug: print all classes of cards
                cards = page.locator('.group.relative.rounded-3xl')
                count = cards.count()
                print(f'Found {count} cards')
                for i in range(count):
                    print(f'Card {i} classes: {cards.nth(i).get_attribute("class")}')

        except Exception as e:
            print(f'Error: {e}')

        browser.close()

if __name__ == '__main__':
    run()
