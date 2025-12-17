import time
import sys
import os
import random
import re
import urllib.parse
import webbrowser
import json

# Dependencies check
try:
    import requests
    from bs4 import BeautifulSoup
    import pyautogui
    import pyperclip
except ImportError as e:
    print("필요한 라이브러리가 설치되지 않았습니다.")
    print("다음 명령어를 실행하여 설치해주세요:")
    print("pip install requests beautifulsoup4 pyautogui pyperclip pillow")
    sys.exit(1)

# Configuration
TEMPLATE_DIR = "bot_templates"
CONFIG_FILE = "bot_config.json"

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def save_config(config):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=4)

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def capture_template(name, prompt):
    """
    사용자가 화면의 특정 영역을 캡처하도록 유도합니다.
    """
    print(f"\n[설정] '{name}' 버튼 이미지를 캡처합니다.")
    print(f"설명: {prompt}")
    print("1. 해당 버튼이 화면에 보이도록 준비해주세요.")
    print("2. 마우스를 버튼의 **왼쪽 상단**에 위치시키고 엔터를 누르세요.")
    input(">>> (준비되면 엔터)")
    x1, y1 = pyautogui.position()
    print(f"좌상단 좌표: ({x1}, {y1})")

    print("3. 이제 마우스를 버튼의 **오른쪽 하단**으로 이동시키고 엔터를 누르세요.")
    input(">>> (이동 후 엔터)")
    x2, y2 = pyautogui.position()
    print(f"우하단 좌표: ({x2}, {y2})")

    width = x2 - x1
    height = y2 - y1

    if width <= 0 or height <= 0:
        print("좌표가 올바르지 않습니다. 다시 시도해주세요.")
        return False

    try:
        # Screenshot
        filename = os.path.join(TEMPLATE_DIR, f"{name}.png")
        ensure_dir(TEMPLATE_DIR)
        screenshot = pyautogui.screenshot(region=(x1, y1, width, height))
        screenshot.save(filename)
        print(f"이미지 저장 완료: {filename}")
        return True
    except Exception as e:
        print(f"캡처 실패: {e}")
        return False

def calibrate_mode():
    print("\n=== 봇 초기 설정 (이미지 캡처) ===")
    print("이 작업은 사용자의 화면 해상도와 테마에 맞춰 봇을 학습시키는 과정입니다.")
    print("한 번만 진행하면 됩니다.\n")

    steps = [
        ("browser_open_confirm", "브라우저에서 'KakaoTalk 열기' (또는 허용) 팝업 버튼"),
        ("kakao_join_button", "카카오톡 창의 '참여하기' (또는 1:1 채팅) 버튼"),
        ("kakao_profile_confirm", "프로필 선택 창의 '확인' (또는 입장) 버튼"),
        ("kakao_input_area", "채팅방의 메시지 입력창 (빈 공간)"),
        ("kakao_send_button", "채팅방의 '전송' 버튼 (선택사항, 엔터로 대체 가능하면 스킵 가능)")
    ]

    for key, desc in steps:
        while True:
            success = capture_template(key, desc)
            if success:
                break
            retry = input("다시 시도하시겠습니까? (y/n): ")
            if retry.lower() != 'y':
                print(f"'{key}' 설정을 건너뜁니다. (봇 작동이 불안정할 수 있습니다)")
                break

    print("\n설정이 완료되었습니다! 이제 봇을 실행할 수 있습니다.")

def wait_and_click(template_name, timeout=10):
    """
    화면에서 이미지를 찾아 클릭합니다.
    """
    image_path = os.path.join(TEMPLATE_DIR, f"{template_name}.png")
    if not os.path.exists(image_path):
        # print(f"[!] 템플릿 파일이 없습니다: {image_path}")
        return False

    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            location = pyautogui.locateCenterOnScreen(image_path, confidence=0.8)
            if location:
                print(f"[*] '{template_name}' 발견! 클릭합니다.")
                pyautogui.click(location)
                return True
        except Exception:
            pass
        time.sleep(0.5)

    print(f"[-] '{template_name}'을(를) 찾을 수 없습니다. (Timeout)")
    return False

def search_google(query, num_results=20):
    print(f"[*] 구글에서 '{query}' 검색 중...")
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&num={num_results}"

    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.startswith('/url?q='):
                href = href.split('/url?q=')[1].split('&')[0]
            if 'open.kakao.com/o/' in href or 't.me/' in href:
                if href not in results:
                    results.append(href)
        print(f"[*] {len(results)}개의 잠재적 링크를 발견했습니다.")
        return results
    except Exception as e:
        print(f"[!] 검색 중 오류 발생: {e}")
        return []

def get_kakao_member_count(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')

        # Method 1: Meta tags
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            content = og_desc["content"]
            # "멤버 1,234명" or "Participants: 300"
            numbers = re.findall(r'(\d+(?:,\d+)?)', content)
            if numbers:
                # Remove commas and convert to int
                counts = [int(n.replace(',', '')) for n in numbers]
                return max(counts)

        # Method 2: Specific span classes (might change)
        # <span class="num_count">1,234</span>
        count_span = soup.find("span", class_="num_count")
        if count_span:
            return int(count_span.text.replace(',', ''))

    except:
        pass
    return 0

def run_bot():
    print("=== 홍보 자동화 봇 (RPA) v2.0 ===")

    if not os.path.exists(TEMPLATE_DIR) or not os.listdir(TEMPLATE_DIR):
        print("[!] 설정 파일(이미지)이 없습니다.")
        print("처음 실행하시나요? '초기 설정'을 먼저 진행해야 합니다.")
        mode = input("설정을 시작하시겠습니까? (y/n): ")
        if mode.lower() == 'y':
            calibrate_mode()
        else:
            print("설정 없이는 봇이 정확히 동작하지 않을 수 있습니다.")

    print("\n--- 작업 설정 ---")
    keyword = input("1. 검색할 키워드 입력 (예: 주식, 코인): ")
    msg = input("2. 홍보 메시지 입력 (엔터 두 번으로 종료):\n")
    lines = []
    while True:
        line = sys.stdin.readline()
        if not line or line.strip() == "":
            break
        lines.append(line.strip())
    full_message = msg + "\n" + "\n".join(lines)

    # Link Collection
    kakao_query = f"site:open.kakao.com {keyword}"
    links = search_google(kakao_query, num_results=30)
    links = list(set(links))

    if not links:
        print("검색 결과가 없습니다.")
        return

    # Filtering
    print(f"\n총 {len(links)}개의 방 발견. 300명 이상 필터링 시작...")
    targets = []
    for link in links:
        if 'open.kakao.com' in link:
            print(f"분석 중: {link}", end="\r")
            count = get_kakao_member_count(link)
            if count >= 300:
                print(f"분석 중: {link} -> [O] {count}명")
                targets.append(link)
            else:
                # print(f"분석 중: {link} -> [X] {count}명")
                pass
        else:
            targets.append(link)

    print(f"\n\n최종 타겟: {len(targets)}개 채팅방")
    if not targets:
        return

    start = input("자동 입장을 시작하시겠습니까? (y/n): ")
    if start.lower() != 'y':
        return

    print("5초 뒤 시작... 마우스를 건드리지 마세요!")
    time.sleep(5)

    pyperclip.copy(full_message)

    for i, link in enumerate(targets):
        print(f"[{i+1}/{len(targets)}] {link} 처리 중...")

        # 1. Open Browser
        webbrowser.open(link)
        time.sleep(2)

        # 2. Click "Open KakaoTalk" in Browser (if exists)
        wait_and_click("browser_open_confirm", timeout=3)

        # 3. Wait for KakaoTalk App & Click "Join"
        # Give it some time to launch app
        joined = wait_and_click("kakao_join_button", timeout=8)

        if joined:
            time.sleep(1)
            # 4. Confirm Profile (if exists)
            wait_and_click("kakao_profile_confirm", timeout=3)

            # 5. Wait for Chat Room
            time.sleep(3) # Wait for room animation

            # 6. Paste and Enter
            # Try to click input area if defined, else just Paste
            wait_and_click("kakao_input_area", timeout=2)

            pyautogui.hotkey('ctrl', 'v')
            time.sleep(0.5)
            pyautogui.press('enter')
            print("   -> 메시지 전송 시도 완료")

            # 7. Close Window (Optional)
            time.sleep(1)
            pyautogui.hotkey('esc') # Often closes the chat window
        else:
            print("   -> 입장 실패 (이미 참여중이거나 버튼 못 찾음)")
            # Try to close browser tab
            pyautogui.hotkey('ctrl', 'w')

        delay = random.uniform(2, 4)
        time.sleep(delay)

    print("모든 작업이 완료되었습니다.")

if __name__ == "__main__":
    run_bot()
