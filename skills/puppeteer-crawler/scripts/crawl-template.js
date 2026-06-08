/**
 * Puppeteer 배치 크롤러 템플릿
 *
 * 사용 전 확인: 원본 JSON/API 엔드포인트가 없을 때(=JS 렌더링)만 이 스크립트를 쓴다.
 * 사이트별로 TARGET_URL, WAIT_SELECTOR, 추출 로직만 교체하면 된다.
 *
 * 실행: node crawl-template.js
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// ── 사이트별로 교체할 부분 ──────────────────────────────
const TARGET_URL = 'https://example.com';
const WAIT_SELECTOR = 'body';            // 추출 대상이 나타날 때까지 기다릴 셀렉터
const OUTPUT_FILE = path.join(__dirname, 'output', 'result.json');
// ────────────────────────────────────────────────────────

async function extract(page) {
  // 페이지 컨텍스트(Renderer)에서 실행됨. 반환값은 반드시 직렬화 가능해야 한다.
  return page.$$eval(WAIT_SELECTOR, (els) =>
    els.map((el) => ({
      text: el.textContent?.trim() ?? '',
      // 필요한 속성 추가: href: el.getAttribute('href'), id: el.id, ...
    }))
  );
}

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; CrawlerBot/1.0; +batch-extraction)'
    );

    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60_000 });
    await page.waitForSelector(WAIT_SELECTOR, { timeout: 30_000 });

    const data = await extract(page);

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');

    // 근거 기반 검증: 건수와 샘플을 출력해 직접 확인한다.
    console.log(`추출 완료: ${data.length}건 → ${OUTPUT_FILE}`);
    console.log('샘플:', JSON.stringify(data.slice(0, 3), null, 2));
  } catch (err) {
    console.error('크롤링 실패:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close(); // 예외가 나도 브라우저 프로세스를 반드시 정리
  }
}

main();
