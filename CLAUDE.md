# 카드뉴스 생성 워크플로우

URL → 슬라이드 HTML → PNG 추출.

## 1. 콘텐츠 읽기
WebFetch로 URL 접속 → 제목, H2/H3, 본문, 핵심 수치, 리스트 파악.

## 2. 슬라이드 기획

- **장수**: cover 포함 최대 10장. closing 없음.
- **구조**: 1장 cover → 2장 `text-notitle` 인트로(본문 첫 단락 원문) → 3장~ H2 단락 기준 1~2장씩.
- **타이틀**: 1줄 이내, **항상 해요체**.
- **분량**: 슬라이드당 한국어 120자 이내. 콘텐츠는 top 115px ~ bottom 128px 안에.
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
- `{{BODY_HTML}}`: `<p class="body-text">` + 선택 `<div class="num-list"><div class="num-item"><b>1. 항목명:&nbsp;</b>설명</div></div>`
- `{{CALLOUT_BLOCK}}` (선택):
  ```html
  <div class="callout">
    <div class="callout-title"><div class="callout-check">✓</div><div class="callout-title-text">제목</div></div>
    <div class="callout-body">내용<br>둘째줄</div>
  </div>
  ```
  callout-title-text=700, callout-body=400.

### text-normal.html
- `{{ICON}}`, `{{HEADLINE_TEXT}}`, `{{BODY_HTML}}` (`body-text` 또는 `body-bold`, 단락 2~4줄).

### text-cell.html
- `{{ICON}}`, `{{HEADLINE_TEXT}}`, `{{BODY_TOP_HTML}}`, `{{IMAGE_URL}}`, `{{BODY_BOTTOM_HTML}}`.

### list.html
- `{{HEADLINE_HTML}}`: `.hl-icon` + `.hl-text` (+ `.hl-badge`). **인라인 뱃지** 가능 — `이번주 [HOT한 공고] 일정 정리`.
- `{{GROUPS_HTML}}`: 각 항목
  ```html
  <div class="paragraph">
    <div class="item-row">
      <div class="rank-badge">1위</div>
      <div class="group-title">제목</div>
    </div>
    <div class="body">설명. <span class="highlight">강조</span>.</div>
  </div>
  ```
  rank-badge + group-title은 같은 item-row.
- **불릿(선택)**: body 대신/다음에
  ```html
  <div class="bullets">
    <div class="bullet-item"><b>모집기간:</b> 11.17 ~ 11.18</div>
  </div>
  ```

### img-list.html
- `{{HEADLINE_HTML}}` (인라인 뱃지 가능), `{{IMAGE_URL}}`, `{{GROUPS_HTML}}` (1~2개 권장, 불릿 동일 지원).

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

## 4. PNG 추출

```bash
node core/extract.js core/output/{슬러그}
```

## 사용법

```
https://gobang.kr/contents/7825 카드뉴스 만들어줘
```
(Claude Code를 `1.인스타자동화/` 루트에서 실행)
