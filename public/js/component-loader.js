/**
 * component-loader.js
 * HTML 컴포넌트를 동적으로 로드하는 기능을 담당합니다.
 */

document.addEventListener('DOMContentLoaded', function() {
    // 모든 컴포넌트를 로드
    loadAllComponents();
});

// 모든 컴포넌트를 로드하는 함수
async function loadAllComponents() {
    try {
        // 헤더 로드
        await loadComponent('header-container', 'components/header.html');
        
        // 메인 섹션 컴포넌트들 로드
        await Promise.all([
            loadComponent('hero-container', 'components/hero-section.html'),
            loadComponent('search-container', 'components/search-section.html'),
            loadComponent('map-container', 'components/map-section.html'),
            loadComponent('list-container', 'components/list-section.html'),
            loadComponent('login-container', 'components/login-section.html'),
            loadComponent('report-container', 'components/report-section.html'),
            loadComponent('premium-container', 'components/premium-section.html')
        ]);
        
        // 푸터 로드
        await loadComponent('footer-container', 'components/footer.html');

        // 모든 컴포넌트가 로드된 후 이벤트 발생시키기
        window.dispatchEvent(new Event('componentsLoaded'));
    } catch (error) {
        console.error('컴포넌트 로딩 중 오류 발생:', error);
    }
}

// 단일 컴포넌트를 로드하는 함수
async function loadComponent(containerId, componentPath) {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`컨테이너 요소가 없습니다: ${containerId}`);
        }

        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`컴포넌트를 불러오지 못했습니다: ${componentPath}`);
        }

        const html = await response.text();
        container.innerHTML = html;
        
        // 컴포넌트별 로드 완료 이벤트 발생
        const componentName = containerId.replace('-container', '');
        window.dispatchEvent(new CustomEvent(`${componentName}Loaded`));
        
        return true;
    } catch (error) {
        console.error(`${containerId} 로딩 실패:`, error);
        return false;
    }
}

// 단일 컴포넌트 동적 교체 함수 (SPA 구현 시 사용)
async function replaceComponent(containerId, componentPath) {
    const container = document.getElementById(containerId);
    if (!container) return false;
    
    // 페이드 아웃 효과
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s';
    
    // 페이드 아웃 후 내용 교체
    setTimeout(async () => {
        try {
            const response = await fetch(componentPath);
            if (!response.ok) {
                throw new Error(`컴포넌트를 불러오지 못했습니다: ${componentPath}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
            
            // 페이드 인 효과
            container.style.opacity = '1';
            
            // 교체 완료 이벤트 발생
            window.dispatchEvent(new CustomEvent('componentReplaced', { 
                detail: { containerId, componentPath } 
            }));
        } catch (error) {
            console.error(`컴포넌트 교체 실패:`, error);
            container.style.opacity = '1';
        }
    }, 300);
}