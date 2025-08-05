const { test, expect } = require('@playwright/test');

test('메인 페이지가 올바르게 로드되는지 확인', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/짐보관소 찾기 서비스/);
});

test('회원가입 폼이 표시되고 제출되는지 확인', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // 회원가입 링크 클릭
  await page.click('#showRegisterForm');

  // 회원가입 폼이 보이는지 확인
  await expect(page.locator('#register')).toBeVisible();

  // 회원가입 정보 입력
  await page.fill('#registerEmail', `testuser-${Date.now()}@example.com`);
  await page.fill('#registerPassword', 'password123');

  // 회원가입 버튼 클릭
  await page.click('#registerForm button[type="submit"]');

  // 성공 메시지 확인 (alert 대화 상자 처리)
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('회원가입 성공! 이제 로그인해주세요.');
    await dialog.accept();
  });

  // 로그인 폼으로 전환되었는지 확인
  await expect(page.locator('#login')).toBeVisible();
});
