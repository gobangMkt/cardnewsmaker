# 카드뉴스 생성 워크플로우

URL → 슬라이드 HTML → PNG 추출.

## 1. 콘텐츠 읽기
WebFetch로 URL 접속. 프롬프트: "제목, H2/H3 소제목, 본문 단락을 요약하지 말고 원문 문장 그대로 최대한 길게 추출해줘. 맥락·이유·배경·예시·수치·리스트 전부 포함."

## 2. 슬라이드 기획

- **장수**: cover 포함 최대 10장. closing 없음.
- **구조**: 1장 cover → 2장 `text-notitle` 인트로(본문 첫 단락 원문) → 3장~ H2 단락 기준 1~2장씩.
- **콘텐츠 원칙**: 수치 나열 금지. 독자가 "왜?", "그래서 나는 어떻게?" 를 느낄 수 있게 맥락·의미·행동 유도까지 담는다. 슬라이드 한 장이 그 자체로 유익해야 한다.
- **이미지 사용 원칙**: 제공된 이미지는 **전부** 사용. 이미지 1개당 이미지 템플릿(`text-cell` 또는 `img-list`) 슬라이드 1장 이상 배정. 이미지 3개 → 이미지 슬라이드 최소 3장.
- **타이틀**: 1줄 이내, **항상 해요체**.
- **분량**: 텍스트가 슬라이드 영역(top 115px ~ bottom 128px)을 벗어나지 않을 만큼 최대한 풍부하게. 글자 수 제한 없음.
- **이모지**: `templates/gobang-시리즈픽/EMOJI-GUIDE.md` 참고.

**템플릿 선택** (내용에 가장 잘 맞는 것):
| 템플릿 | 용도 |
|---|---|
| `cover` | 1장 전용 |
| `text-notitle` | 2장 인트로 전용 |
| `text` | callout 포함 텍스트 |
| `text-normal` | 순수 텍스트 |
| `list` | 순위/목록 (rank-badge ± 불릿) |
| `text-cell` | 텍스트 + 이미지 |
| `img-list` | 이미지 + 순위 |
| `table` | 구분-내용 매핑 표 |

## 3. HTML 생성

`core/templates/gobang-시리즈픽/` CSS **그대로 복사** — 폰트 크기·여백·색상 변경 금지.
저장 위치: `core/output/{슬러그}/slides/slide-0N.html`

---

## 템플릿별 작성 규칙

### cover.html
- `{{BG_IMAGE_URL}}`: **사용자 제공 URL 또는 og:image만** (AI 생성 금지)
- `{{HEADLINE}}`: 2줄 이내, 강한 후킹·어그로·밈 적극 사용
  ```html
  <div class="hl-line">첫 줄 (흰색)</div>
  <div class="hl-line"><span class="key">두 번째 줄 (#00FFFF)</span></div>
  ```
  글자에 `-webkit-text-stroke:4px #000000; paint-order:stroke fill` 아웃라인.
- 다크 오버레이/카테고리 뱃지/부제목 라벨 **금지**
- 그라디언트 dark만: `linear-gradient(180deg, rgba(30,33,36,1) 8.3%, rgba(30,33,36,0) 65%)` + `transform:rotate(-180deg)`
- letter-spacing: `-0.05em` (커버만)
- **선택**: `<div class="bubble" style="top:Xpx;right:Ypx;">예시…</div>` — 부연 설명 필요 시. 헤드라인과 겹치지 않게.

### text-notitle.html (2장 인트로)
- `{{BODY_HTML}}`: `<p class="body-text">` 2~3개. 본문 첫 단락 원문.
- **마지막 단락은 전환문 필수** (예: "오늘은 …까지 깔끔하게 정리해볼게요.")
- 타이틀·아이콘·구분선 없음.

### text.html (callout)
- `{{ICON}}`, `{{HEADLINE}}` (해요체)
- **구성 패턴**: 줄글(맥락) → callout(핵심 정리) → 줄글(결론·평가). callout만 단독으로 쓰지 않는다.
  ```html
  <p class="body-text">왜 중요한지 맥락·배경 문장. highlight로 핵심어 강조.</p>
  <div class="callout">
    <div class="callout-title"><div class="callout-check">✓</div><div class="callout-title-text">체크리스트 제목</div></div>
    <div class="callout-body">· 항목 1<br>· 항목 2<br>· 항목 3</div>
  </div>
  <p class="body-text">결론·행동 유도 문장으로 마무리.</p>
  ```
  callout-title-text=700, callout-body=400.

### text-normal.html
- `{{ICON}}`, `{{HEADLINE_TEXT}}`, `{{BODY_HTML}}` (`body-text` 2~3개 단락 + bullets 혼합).

### text-cell.html
- `{{ICON}}`, `{{HEADLINE_TEXT}}`, `{{IMAGE_URL}}`
- **구성 패턴**: 이미지 위 줄글(맥락 1~2문장) → 이미지 → bullets(핵심 항목) → 줄글(결론) 순서. 줄글·bullets 중 하나만 쓰지 않는다.
  ```html
  <!-- BODY_TOP: 이미지 위 맥락 줄글 -->
  <p class="body-text">상황 설명 또는 왜 중요한지 1~2문장.</p>
  <!-- 이미지 -->
  <img class="cell-img" src="{{IMAGE_URL}}" alt="">
  <!-- BODY_BOTTOM: 이미지 아래 bullets + 결론 -->
  <div class="bullets">
    <div class="bullet-item"><b>항목 1:</b> 내용</div>
    <div class="bullet-item"><b>항목 2:</b> 내용</div>
  </div>
  <p class="body-text">결론 또는 행동 유도 문장.</p>
  ```

### list.html
- `{{HEADLINE_HTML}}`: `.hl-icon` + `.hl-text` (+ `.hl-badge`). **인라인 뱃지** 가능.
- **구성 패턴**: 각 항목 안에 `body`(줄글 1~2문장) + `bullets`(세부 항목)를 함께 쓴다. body만 또는 bullets만 단독으로 쓰지 않는다.
  ```html
  <div class="paragraph">
    <div class="item-row">
      <div class="rank-badge">방식 1</div>
      <div class="group-title">항목 제목</div>
    </div>
    <div class="body">이 항목이 왜 중요한지 맥락 줄글. <span class="highlight">핵심어</span> 강조.</div>
    <div class="bullets">
      <div class="bullet-item"><b>세부 항목:</b> 내용</div>
      <div class="bullet-item"><b>세부 항목:</b> 내용</div>
    </div>
  </div>
  ```

### img-list.html
- `{{HEADLINE_HTML}}` (인라인 뱃지 가능), `{{IMAGE_URL}}`
- **구성 패턴**: 각 항목에 `body`(줄글 1~2문장) 포함. rank-badge + group-title + body 기본 세트. 항목 수 1~2개 권장.
  ```html
  <div class="paragraph">
    <div class="item-row">
      <div class="rank-badge">구분</div>
      <div class="group-title">항목 제목</div>
    </div>
    <div class="body">이 항목의 맥락·의미를 1~2문장으로. <span class="highlight">핵심어</span> 강조.</div>
  </div>
  ```

### table.html
- `{{ICON}}`, `{{HEADLINE_TEXT}}`, `{{TOP_BODY_HTML}}` (선택, 전환문 highlight 권장)
- `{{COL1_HEADER}}`/`{{COL2_HEADER}}` (예: `구분`/`내용`)
- `{{ROWS_HTML}}`:
  ```html
  <tr><th>대상</th><td>선순위 임차인 중 퇴거 희망자</td></tr>
  ```
  좌측 `<th>` 200px 굵게, 행 4개 이내 권장.
- `{{BOTTOM_BODY_HTML}}` (선택, 해석·평가 문장 highlight 적극).

---

## 공통 규칙

- 캔버스 **1080×1350px** 고정. `overflow:hidden` + `word-break:keep-all`.
- 외부 CDN: Pretendard 1개만.
- footer는 항상 "시리즈픽".
- letter-spacing `-0.02em` (커버만 `-0.05em`).
- **highlight**: `color:#009AB5; font-weight:700`. 단어/수치가 기본, **표·리스트 전환문 전체 highlight 허용**.
- **badge 배경**: `rgba(0,154,181,0.2)` (rank-badge, hl-badge 동일, **red 금지**).
- 슬라이드 타이틀 항상 해요체.
- 수치·조건은 원문 그대로 (임의 생성 금지).

### 본문 가독성 규칙 (필수)
- **단락 구분**: 본문(`body-text`, `body`)이 2~3줄을 초과하면 **반드시** 단락을 나눈다. 연속된 긴 문단은 절대 허용하지 않는다.
- **줄글 + 개괄식 혼합 필수**: 슬라이드 한 장 안에 줄글과 개괄식이 **반드시 함께** 있어야 한다. 둘 중 하나만 쓰는 슬라이드는 허용하지 않는다(cover·text-notitle 제외).
  - **줄글 역할**: 맥락·이유·배경·결론·행동 유도 → `<p class="body-text">` 또는 `<div class="body">`
  - **개괄식 역할**: 열거 항목·수치·조건·체크리스트 → `bullets` / `callout` / `num-list` 중 택1
- **기본 순서**: 줄글(맥락) → 개괄식(핵심) → 줄글(결론). 단, 이미지가 있으면 줄글 → 이미지 → 개괄식 → 줄글 순서도 허용.
- **개괄식 종류**:
  - 키-값 불릿 → `div.bullets > div.bullet-item` (`<b>키:</b> 값`)
  - 체크리스트 → `callout` (`div.callout-body` 안에 `· 항목<br>`)
  - 순서 목록 → `div.num-list > div.num-item` (`<b>1. 항목명:&nbsp;</b>설명`)

## 4. PNG 추출

```bash
node core/extract.js core/output/{슬러그}
```

## 사용법

```
https://gobang.kr/contents/7825 카드뉴스 만들어줘
```
(Claude Code를 `1.인스타자동화/` 루트에서 실행)

---

## 드라이브 처리 명령

**"드라이브 처리"** 가 입력되면 아래 파이프라인을 즉시 실행한다. 설명·확인 없이 바로 시작.

### 파이프라인 순서

**Step 1 — `node core/drive.js` 실행**
- 구글 드라이브 "대기중" 폴더의 ZIP 파일 다운로드 + 이미지 추출
- 출력에서 `DRIVE_TASK` JSON 파싱 → `url`, `slug`, `outputDir`, `imgDir`, `images` 추출
- ZIP이 없으면 "대기중인 파일 없음" 출력 후 종료

**Step 2 — 각 DRIVE_TASK마다 카드뉴스 생성**
1. WebFetch로 `url` 콘텐츠 읽기 (원문 전체 추출)
2. `imgDir` 안의 이미지 파일 Read로 시각 확인
3. 슬라이드 기획 → HTML 생성 → `core/output/{slug}/slides/slide-0N.html` 저장
   - 이미지 경로: `../img/{파일명}` (상대경로)
   - 슬라이드 기획·작성 규칙은 위 섹션과 동일
4. `node core/extract.js core/output/{slug}` 실행 → PNG 추출

**Step 3 — `node core/drive.js` 재실행**
- PNG 폴더 감지 → result.zip 생성 → 구글 드라이브 "완료" 폴더 업로드
- 원본 ZIP → "대기중/작업완료" 폴더로 이동

### 주의
- DRIVE_TASK가 여러 개면 순서대로 전부 처리
- Step 1 출력의 `===== DRIVE_TASK =====` ~ `===== /DRIVE_TASK =====` 사이 JSON이 작업 정보
