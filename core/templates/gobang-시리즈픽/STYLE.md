# A타입 — gobang-시리즈픽 스타일 가이드

## 슬라이드 기획

- **장수**: cover 포함 최대 10장. closing 없음.
- **구조**: 1장 cover → 2장 `text-notitle` 인트로(본문 첫 단락 원문) → 3장~ H2 단락 기준 1~2장씩.
- **콘텐츠 원칙**: 수치 나열 금지. 독자가 "왜?", "그래서 나는 어떻게?"를 느낄 수 있게 맥락·의미·행동 유도까지 담는다. 슬라이드 한 장이 그 자체로 유익해야 한다.
- **이미지 사용 원칙**: 제공된 이미지는 **전부** 사용. 이미지 1개당 이미지 템플릿(`text-cell` 또는 `img-list`) 슬라이드 1장 이상 배정.
- **분량**: 텍스트가 슬라이드 영역(top 115px ~ bottom 128px)을 벗어나지 않을 만큼 최대한 풍부하게.
- **이모지**: `EMOJI-GUIDE.md` 참고.

### 콘텐츠 우선순위 (분량 조절 기준)

같은 정보를 표현할 수 있는 방법이 여러 개면 아래 순서로 우선 선택한다. 안전 영역(top 115px ~ bottom 1222px)을 벗어날 것 같으면 낮은 우선순위 요소부터 줄이거나 제거한다.

1. **시각적 자료** — 이미지(`text-cell`, `img-list`), 표(`table`)
2. **개괄식 자료** — 불릿(`bullets`), callout, rank-badge 목록(`list`)
3. **줄글** — `body-text` 단락

- 조합은 자유롭게 섞되, 총 콘텐츠가 안전 영역을 초과하지 않도록 낮은 우선순위 요소부터 줄인다.
- CSS 값(폰트 크기·여백·이미지 높이)은 변경하지 않는다. 줄일 것은 **내용량**이지 **크기**가 아니다.

### 템플릿 선택

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

**table 사용 기준**: 구분-값이 짝을 이루는 항목이 2쌍 이상이면 table 우선 고려.

---

## 글자수 상한 (실측 기준 — 추정 금지)

| 요소 | font-size | 사용 가능 폭 | 한 줄 최대 |
|---|---|---|---|
| cover `.hl-line` (key span 포함) | 100.02px | 960px | **12자** |
| `headline-text` (아이콘·gap 제외) | 57.61px | 856px | **17자** |
| `body-text` 1줄 참고 | 43.44px | 936px | **20자** |

- 숫자·영문·구두점은 한글 1자의 **0.5자**로 환산해 합산.
- 초과 시 단어 제거 또는 문장 재구성. 폰트 크기 변경 금지.
- **cover hl-line은 extract.js가 감지 못함** — 작성 시 반드시 직접 글자수 확인.

## text-cell 기본 구성 (overflow 방지)

```
top body (1문장) → image(380px) → bullets (3개 이하)
```

- bottom body는 기본 **제거**. bullets까지 작성 후 남은 높이 150px 이상일 때만 1문장 추가.
- top body도 2줄 이상 예상되면 1문장으로 줄인다.
- 이미지 380px가 고정 점유하므로 텍스트 여유가 없다고 가정하고 시작.

## 슬라이드 작성 전 필수 확인

1. `slides/` 폴더 파일 목록 확인 (`ls`)
2. 기존 파일 있으면 `Read`로 내용·`content-group gap`값 확인
3. 품질 미달(얕은 내용, 잘못된 gap 등)이면 교체, 양호하면 수정만
4. **확인 없이 Write 금지**

---

## HTML 생성

이 폴더(`gobang-시리즈픽/`)의 CSS **그대로 복사** — 폰트 크기·여백·색상 변경 금지.

---

## 템플릿별 작성 규칙

### cover
- `BG_IMAGE_URL`: 사용자 제공 URL 또는 og:image만 (AI 생성 금지)
- 헤드라인 2줄 이내. 1줄=흰색, 2줄=`<span class="key">` (#00FFFF). 강한 후킹·어그로·밈.
- 다크 오버레이·카테고리 뱃지·부제목 라벨 금지. bubble은 선택.

### text-notitle (2장 인트로)
- `<p class="body-text">` 2~3개. 본문 첫 단락 원문. 마지막 단락은 전환문 필수.
- 타이틀·아이콘·구분선 없음.

### text (callout)
- 구성: 줄글(맥락) → callout(핵심) → 줄글(결론). callout 단독 금지.

### text-normal
- `body-text` 2~3개 단락 + bullets 혼합.

### text-cell
- 구성: 줄글(맥락 1~2문장) → 이미지 → bullets → 줄글(결론). 이미지+bullets는 필수.
- 이미지 경로: `../img/{파일명}`
- 안전 영역 초과 시: 줄글(상단 또는 하단) 제거 → bullets 항목 수 축소 순으로 줄인다.

### list
- 각 항목: rank-badge + group-title + body(줄글) + bullets. body만 또는 bullets만 금지.
- 항목 수는 overflow 나지 않을 만큼만.

### img-list
- 구성: 헤드라인 → 이미지 → 항목(rank-badge + group-title + body). 항목 수 1~2개 권장.

### table
- TOP_BODY(선택) → 표(행 4개 이내) → BOTTOM_BODY(선택).
- 좌측 `<th>` 200px 굵게.

---

## 공통 CSS 규칙

- 캔버스 **1080×1350px** 고정. `overflow:hidden` + `word-break:keep-all`.
- 외부 CDN: Pretendard 1개만. footer 항상 "시리즈픽". 타이틀 항상 해요체.
- letter-spacing `-0.02em` (커버만 `-0.05em`).
- **highlight**: `color:#009AB5; font-weight:700`. 단어·수치 기본, 전환문 전체 허용.
- **badge 배경**: `rgba(0,154,181,0.2)`. red 금지.
- 수치·조건은 원문 그대로 (임의 생성 금지).
- **content-divider**: cover·text-notitle을 제외한 모든 슬라이드에서 헤드라인 아래 `<div class="content-divider"></div>` 필수. divider는 반드시 936.08px content-group 안에 위치해야 한다(캔버스 전체 폭 금지).
- **content-group gap**: 모든 타입에서 `gap:43.44px` 고정 (text-cell 포함). paragraph 내부 gap은 별도 설정.

### 본문 가독성 (필수)
- **줄글 + 개괄식 혼합 필수** (cover·text-notitle 제외). 기본 순서: 줄글(맥락) → 개괄식(핵심) → 줄글(결론). 이미지 있으면 줄글 → 이미지 → 개괄식 → 줄글도 허용.
- 본문이 2~3줄 초과 시 반드시 단락 나눔.
- 개괄식 종류: 키-값 불릿 `div.bullets > div.bullet-item` / 체크리스트 `callout` / 순서 목록 `div.num-list > div.num-item`

---

## 반복 실수 방지 (필독)

### CSS 수치 절대 변경 금지
- `gap`, `font-size`, `height`, `padding` 등 모든 CSS 수치를 overflow 방지 목적으로 임의 변경하지 않는다.
- overflow가 날 것 같으면 **내용량(텍스트·bullets 수)을 줄인다**. 수치를 건드리는 것은 금지.
- `img-list`의 `.outer gap`은 **45.25px** 고정. `content-group gap`은 **43.44px** 고정. 예외 없음.

### cover hl-line 글자수
- 작성 후 반드시 직접 글자수를 센다. 숫자·영문·구두점은 0.5자로 환산해 합산.
- 12자 초과 시 단어를 제거하거나 문장을 재구성. LINE2가 2줄로 넘치면 실격.

### 원문에 없는 표현 생성 금지
- "A구역", "B구역" 같이 원문에 없는 분류명·레이블을 임의로 만들지 않는다.
- rank-badge, group-title 등 레이블은 원문의 실제 표현을 그대로 사용.

### 타이틀 품질
- 단순 키워드 타이틀 금지. "신청 방법", "준비물" 같은 명사형은 안 됨.
- 해요체 문장형으로 독자의 궁금증·이익·행동을 유도해야 함. (예: "5분이면 신청 완료예요")
- 슬라이드 한 장이 그 자체로 유익해야 함 — 맥락(왜?) + 행동유도(그래서 어떻게?) 포함.
