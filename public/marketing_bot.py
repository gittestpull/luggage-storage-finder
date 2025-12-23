import time
import sys
import random
import re
import urllib.parse
import webbrowser
import subprocess

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
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')

        og_desc = soup.find("meta", property="og:description")
        if og_desc:
            content = og_desc.get("content", "")
            numbers = re.findall(r'\d+', content)
            if numbers:
                return max(map(int, numbers))
    except:
        pass
    return 0

def run_bot():
    print("=== 홍보 자동화 봇 (RPA) ===")
    print("주의: 이 프로그램은 사용자의 키보드와 마우스를 제어합니다.")
    print("실행 중에는 마우스 사용을 멈춰주세요. (중단하려면 마우스를 화면 모서리로 빠르게 이동하세요 - PyAutoGUI FailSafe)")
    print("==============================\n")

    print("[모드 선택]")
    print("1. 키워드 검색 후 전송 (다수 방)")
    print("2. 특정 오픈채팅방 전송 (지정 방)")
    
    mode = input("선택 (1/2): ").strip()
    
    targets = []
    
    if mode == '1':
        keyword = input("검색할 키워드를 입력하세요 (예: 주식, 코인): ")
        
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

        for link in links:
            if 'open.kakao.com' in link and use_filter:
                count = get_kakao_member_count(link)
                print(f"Checking {link}... 예상 멤버 수: {count}")
                if count >= 300:
                    targets.append(link)
            else:
                targets.append(link)
                
    elif mode == '2':
        print("\n전송할 오픈채팅방/텔레그램 링크를 입력하세요.")
        print("여러 개일 경우 콤마(,)로 구분해주세요.")
        url_input = input("링크: ")
        targets = [url.strip() for url in url_input.split(',') if url.strip()]
        
        if not targets:
            print("입력된 링크가 없습니다.")
            return
            
    else:
        print("잘못된 선택입니다.")
        return

    print(f"\n최종 전송 대상: {len(targets)}개")
    if not targets:
        return

    # 메시지 입력
    print("\n[메시지 작성]")
    msg_title = input("메시지 첫 줄 입력 (제목): ")
    print("나머지 내용을 입력하세요 (엔터 두 번으로 입력 종료):")
    
    lines = []
    while True:
        line = sys.stdin.readline()
        if not line or line.strip() == "":
            break
        lines.append(line.strip())

    full_message = msg_title + "\n" + "\n".join(lines)

    # 반복 설정
    print("\n[반복 설정]")
    print("0: 1회만 전송")
    print("숫자: 해당 분(minute)마다 반복 전송 (예: 60 -> 1시간마다)")
    try:
        interval = int(input("입력: "))
    except:
        interval = 0

    print("\n" + "="*30)
    print(f"대상: {len(targets)}개 채팅방")
    print(f"반복: {'1회' if interval == 0 else f'{interval}분 마다'}")
    print("="*30)
    
    start = input("자동 전송을 시작하시겠습니까? (y/n): ")
    if start.lower() != 'y':
        return

    count = 1
    while True:
        print(f"\n=== 실행 회차: {count} ===")
        print("5초 뒤 시작합니다. 카카오톡/텔레그램이 설치되어 있어야 합니다.")
        time.sleep(5)

        # OS에 따른 단축키 설정
        ctrl_key = 'command' if sys.platform == 'darwin' else 'ctrl'

        # 메시지 클립보드 복사
        pyperclip.copy(full_message)

        for i, link in enumerate(targets):
            print(f"[{i+1}/{len(targets)}] {link} 접속 중...")

            # 브라우저로 링크 열기 (외부 앱 실행 유도)
            webbrowser.open(link)

            # 앱이 뜰 때까지 대기
            time.sleep(5)

            # [Mac Fix] 브라우저가 포커스를 가로채는 문제 해결을 위해 앱 강제 활성화
            if sys.platform == 'darwin':
                try:
                    target_app = "KakaoTalk" if "kakao.com" in link else "Telegram"
                    # AppleScript로 앱 활성화 (맨 앞으로 가져오기)
                    subprocess.run(
                        ['osascript', '-e', f'tell application "{target_app}" to activate'], 
                        capture_output=True
                    )
                    time.sleep(1) # 포커스 전환 안정화
                except Exception as e:
                    print(f"[!] 앱 포커스 전환 실패: {e}")

            # 붙여넣기 및 전송
            if sys.platform == 'darwin':
                pyautogui.keyDown('command')
                time.sleep(0.2)
                pyautogui.press('v')
                time.sleep(0.2)
                pyautogui.keyUp('command')
            else:
                pyautogui.hotkey('ctrl', 'v')
            
            time.sleep(1)
            pyautogui.press('enter')
            time.sleep(1)

            # [Mac Fix] 메시지 전송 후 다시 브라우저로 포커스를 돌려야 탭을 닫을 수 있음 (Chat App -> Browser)
            if sys.platform == 'darwin':
                try:
                    # Command + Tab으로 이전 앱(브라우저)으로 전환
                    subprocess.run(
                        ['osascript', '-e', 'tell application "System Events" to key code 48 using {command down}'], 
                        capture_output=True
                    )
                    time.sleep(1)
                except Exception as e:
                    print(f"[!] 브라우저 포커스 전환 실패: {e}")

            # 창 닫기 (브라우저 탭 닫기)
            # 카카오톡 PC버전의 경우 Esc로 닫히는 경우가 많음. 상황에 맞게 조정 필요.
            # 여기서는 브라우저 탭 닫기를 가정하여 command+w / ctrl+w 사용
            if sys.platform == 'darwin':
                pyautogui.keyDown('command')
                time.sleep(0.2)
                pyautogui.press('w')
                time.sleep(0.2)
                pyautogui.keyUp('command')
            else:
                pyautogui.hotkey('ctrl', 'w')

            # 다음 작업을 위한 딜레이 (사람처럼 보이기)
            delay = random.uniform(3, 6)
            print(f"대기 {delay:.1f}초...")
            time.sleep(delay)

        if interval == 0:
            print("모든 작업이 완료되었습니다.")
            break
        else:
            print(f"\n작업 완료. {interval}분 대기 후 반복합니다...")
            print(f"(중단하려면 Ctrl+C를 누르세요)")
            time.sleep(interval * 60)
            count += 1

if __name__ == "__main__":
    run_bot()
