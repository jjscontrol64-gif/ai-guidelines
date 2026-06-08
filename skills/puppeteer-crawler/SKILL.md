---
name: puppeteer-crawler
description: 웹사이트에서 데이터를 배치 추출하는 크롤러를 만들 때 사용한다. puppeteer를 켜기 전에 원본 JSON/API 엔드포인트부터 찾고, JS로 렌더링되는 콘텐츠일 때만 헤드리스 브라우저를 쓴다. 재실행 가능한 Node 스크립트를 산출물로 남긴다.
---

# Puppeteer Crawler Skill — 배치 크롤링 지침

## 1. 목적

웹사이트에서 데이터를 추출하는 **재실행 가능한 크롤러 스크립트**를 만들기 위한 지침이다.
산출물은 대화가 아니라 **버전관리·재실행 가능한 코드 아티팩트**여야 한다.

이 스킬은 인터랙티브 브라우저 조작이 아니라 **배치 크롤링**에 최적화되어 있다.

---

## 2. 제1원칙 — puppeteer를 켜기 전에 멈춰라

**브라우저 자동화는 무겁고 깨지기 쉽다.** 켜기 전에 반드시 더 단순한 경로를 먼저 확인한다.

### 단계별 판단 (위에서부터 순서대로)

1. **원본 JSON/API 엔드포인트가 있는가?**
   - 많은 사이트가 데이터를 별도 JSON으로 내려준다.
   - 확인법: 네트워크 탭 / 흔한 패턴 추측 (`/{path}.json`, `/api/...`, `__NEXT_DATA__`)
   - 예: `roadmap.sh/backend` → `roadmap.sh/backend.json` 으로 225개 노드 전부 획득. puppeteer 불필요.
   - **있으면 → `curl` + JSON 파싱으로 끝. 여기서 멈춘다.**

2. **SSR HTML에 데이터가 들어있는가?**
   - `curl`로 받은 HTML에 목표 데이터가 이미 있으면 → HTML 파서(cheerio 등)로 충분.
   - 확인법: `curl -s URL | grep "목표 텍스트"` — 텍스트가 보이면 SSR.

3. **JS로 렌더링되는가? → 그때만 puppeteer를 쓴다.**
   - SSR HTML엔 없고 브라우저에서만 보이는 콘텐츠 (SPA, 동적 SVG 등).
   - **이 경우에만** 아래 표준 스크립트로 진행한다.

> ⚠️ 습관처럼 puppeteer부터 켜지 마라. 단순함이 항상 최선이었다.

---

## 3. puppeteer 표준 스크립트 규칙

`scripts/crawl-template.js`를 복사해 사이트별로 변형한다. 반드시 지킬 것:

- **`waitForSelector`로 대기** — `goto` 직후 DOM이 준비됐다고 가정하지 마라. 타깃 셀렉터를 명시적으로 기다린다.
- **`$$eval`로 추출** — 노드 라벨 등은 페이지 컨텍스트에서 한 번에 직렬화해 가져온다. ElementHandle을 Node로 들고 나오지 마라(직렬화 불가).
- **에러처리 + `finally`에서 `browser.close()`** — 예외가 나도 브라우저 프로세스가 남지 않게 한다.
- **결과는 파일로 저장** — `JSON.stringify`로 `output/*.json`에 쓴다. 콘솔 출력만으로 끝내지 마라.
- **handle 누수 방지** — `page.$`로 받은 ElementHandle은 다 쓰면 `dispose()`. 대량 루프 시 특히.
- **헤드리스 기본** — `headless: 'new'`. 디버깅 시에만 `headless: false`.
- **차단 회피는 최소·정중하게** — `userAgent` 설정, 요청 간 지연. 공격적 우회/대량 타깃팅 금지.

---

## 4. 작업 흐름

1. **엔드포인트 탐색** (§2) — JSON/API/SSR 먼저. 되면 거기서 끝.
2. **렌더링 방식 확정** — JS 렌더링 확인되면 puppeteer로 진행.
3. **스크립트 작성** — 템플릿 복사 → 셀렉터/추출 로직만 교체.
4. **실행·검증** — 추출 건수와 샘플을 직접 확인 (추측 금지, 근거 기반).
5. **산출물 정리** — 스크립트 + `output/*.json` 남기고 보고.

---

## 5. 환경 메모

- Node 설치 후 `npm i puppeteer` (Chromium 자동 다운로드, ~수백 MB).
- 가벼운 환경/CI는 `puppeteer-core` + 시스템 Chrome 경로 지정 고려.
- Windows: 경로에 공백 있으면 따옴표. PowerShell/Bash 모두 가능.
