import time
import sys
import random
import re
import urllib.parse
import webbrowser

# Dependencies check
try:
    import requests
    from bs4 import BeautifulSoup
    import pyautogui
    import pyperclip
except ImportError as e:
    print("필요한 라이브러리가 설치되지 않았습니다.")
    print("다음 명령어를 실행하여 설치해주세요:")
    print("pip install requests beautifulsoup4 pyautogui pyperclip")
    sys.exit(1)

def search_google(query, num_results=20):
    """
    구글 검색을 통해 링크를 수집합니다.
    """
    print(f"[*] 구글에서 '{query}' 검색 중...")
    results = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    # Google Search URL
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&num={num_results}"

    try:
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')

        # 검색 결과 파싱 (구글 HTML 구조는 자주 바뀌므로 일반적인 a 태그 href 검사)
        for a in soup.find_all('a', href=True):
            href = a['href']
            # 실제 링크 추출 (구글 리다이렉트 제거)
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
    """
    카카오톡 오픈채팅방의 참여자 수를 확인합니다.
    (OG 태그 또는 페이지 내용을 기반으로 추정)
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')

        # OG Description에서 정보 추출 시도
        og_desc = soup.find("meta", property="og:description")
        if og_desc:
            content = og_desc.get("content", "")
            # 예: "멤버 300명" 또는 "Participants: 300" 등의 패턴 찾기
            # 단순화를 위해 숫자만 추출해서 로깅
            numbers = re.findall(r'\d+', content)
            if numbers:
                # 가장 큰 숫자를 멤버 수로 가정 (위험하지만 간단한 방법)
                return max(map(int, numbers))
    except:
        pass
    return 0

def run_bot():
    print("=== 홍보 자동화 봇 (RPA) ===")
    print("주의: 이 프로그램은 사용자의 키보드와 마우스를 제어합니다.")
    print("실행 중에는 마우스 사용을 멈춰주세요. (중단하려면 마우스를 화면 모서리로 빠르게 이동하세요 - PyAutoGUI FailSafe)")
    print("==============================\n")

    keyword = input("검색할 키워드를 입력하세요 (예: 주식, 코인): ")
    msg = input("전송할 홍보 메시지를 입력하세요 (엔터 두 번으로 입력 종료):\n")

    # 멀티라인 입력 처리
    lines = []
    while True:
        line = sys.stdin.readline()
        if not line or line.strip() == "":
            break
        lines.append(line.strip())

    full_message = msg + "\n" + "\n".join(lines)

    # 1. 링크 수집
    kakao_query = f"site:open.kakao.com {keyword}"
    telegram_query = f"site:t.me {keyword}"

    links = []
    links.extend(search_google(kakao_query))
    links.extend(search_google(telegram_query))

    # 중복 제거
    links = list(set(links))

    if not links:
        print("검색된 방이 없습니다. 키워드를 변경해보세요.")
        return

    print(f"\n총 {len(links)}개의 방을 찾았습니다.")

    # 2. 필터링 (선택사항)
    print("참여자 수 정보를 확인하고 필터링 하시겠습니까? (시간이 소요됩니다)")
    use_filter = input("300명 이상만 필터링? (y/n): ").lower() == 'y'

    targets = []
    for link in links:
        if 'open.kakao.com' in link and use_filter:
            count = get_kakao_member_count(link)
            print(f"Checking {link}... 예상 멤버 수: {count}")
            if count >= 300:
                targets.append(link)
        else:
            # 텔레그램이나 필터 안 하는 경우 그냥 추가
            targets.append(link)

    print(f"\n최종 전송 대상: {len(targets)}개")
    if not targets:
        return

    start = input("자동 전송을 시작하시겠습니까? (y/n): ")
    if start.lower() != 'y':
        return

    print("5초 뒤 시작합니다. 카카오톡/텔레그램이 설치되어 있어야 합니다.")
    time.sleep(5)

    # 메시지 클립보드 복사
    pyperclip.copy(full_message)

    for i, link in enumerate(targets):
        print(f"[{i+1}/{len(targets)}] {link} 접속 중...")

        # 브라우저로 링크 열기 (외부 앱 실행 유도)
        webbrowser.open(link)

        # 앱이 뜰 때까지 대기 (PC 성능에 따라 조절 필요)
        time.sleep(5)

        # 붙여넣기 및 전송
        # 1. 채팅방이 활성화되었다고 가정하고 붙여넣기
        # 주의: 일부 앱은 '참여하기' 버튼을 눌러야 할 수 있음.
        # RPA의 한계로 단순히 '접속 -> 붙여넣기 -> 엔터' 시도

        pyautogui.hotkey('ctrl', 'v')
        time.sleep(1)
        pyautogui.press('enter')
        time.sleep(1)

        # 창 닫기 (Ctrl+W는 브라우저 탭 닫기, Alt+F4는 앱 닫기)
        # 상황에 따라 다르므로 여기서는 브라우저 탭만 닫기 시도
        pyautogui.hotkey('ctrl', 'w')

        # 다음 작업을 위한 딜레이
        delay = random.uniform(3, 6)
        print(f"대기 {delay:.1f}초...")
        time.sleep(delay)

    print("작업 완료!")

if __name__ == "__main__":
    run_bot()
