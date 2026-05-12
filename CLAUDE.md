# 카드뉴스 생성 워크플로우

URL → 슬라이드 HTML → PNG 추출.

## 타입별 스타일

| 타입 | 폴더 | zip prefix |
|---|---|---|
| A (기본) | `core/templates/gobang-시리즈픽/` | 없음 |
| B | `core/templates/gobang-B/` | `B-` |
| C | `core/templates/gobang-C/` | `C-` |

**DRIVE_TASK에 `type` 필드가 있으면 해당 폴더의 `STYLE.md` 읽고 작업. 없으면 A타입.**

---

## 1. 콘텐츠 읽기

WebFetch로 URL 접속. 프롬프트: "제목, H2/H3 소제목, 본문 단락을 요약하지 말고 원문 문장 그대로 최대한 길게 추출해줘. 맥락·이유·배경·예시·수치·리스트 전부 포함."

## 2. 슬라이드 기획 및 HTML 생성

해당 타입 폴더의 **`STYLE.md` 규칙을 따른다.**

저장 위치: `core/output/{슬러그}/slides/slide-0N.html`

## 3. PNG 추출 및 확인

```bash
node core/extract.js core/output/{슬러그}
```
추출 후 콘솔 출력 확인. `⚠️ OVERFLOW` 경고가 있으면 해당 슬라이드 HTML 수정 후 재추출. 경고 없으면 완료.

---

## 드라이브 처리

**"드라이브 처리"** 입력 시 즉시 실행. 설명·확인 없이 바로 시작.

1. `node core/drive.js` → DRIVE_TASK JSON 파싱 (`url`, `slug`, `outputDir`, `imgDir`, `images`, `type` 추출). ZIP 없으면 종료.
2. 각 DRIVE_TASK마다: 타입 확인 → 해당 STYLE.md 읽기 → WebFetch로 URL 읽기 → 이미지 Read → 슬라이드 HTML 생성 → `node core/extract.js core/output/{slug}` → ⚠️ OVERFLOW 경고 슬라이드만 수정 후 재추출
- agent에게 위임 시 프롬프트에 반드시 포함: "작업 시작 전 `core/templates/gobang-시리즈픽/STYLE.md`를 Read할 것. **반복 실수 방지** 섹션까지 전부 읽어야 함."
3. `node core/drive.js` 재실행 → 완료 폴더 업로드 → 원본 ZIP 이동.
- DRIVE_TASK 여러 개면 순서대로 전부 처리.
