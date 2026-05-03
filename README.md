# 시리즈픽 카드뉴스 자동화

gobang.kr URL → Claude가 슬라이드 HTML 생성 → PNG 추출 → 인스타 업로드.

## 셋업 (팀원용)

### 1. 사전 요구
- [Node.js 18+](https://nodejs.org/) 설치
- [Claude Code](https://claude.com/claude-code) 설치 및 로그인
- Git

### 2. 클론 & 설치
```bash
git clone https://github.com/gobangMkt/my-claude-project
cd my-claude-project/프로젝트/1.인스타자동화
npm install
```

### 3. 실행
```bash
시작 3017.bat   # Windows: 더블클릭
# 또는
npm start
```

브라우저에서 [http://localhost:3017](http://localhost:3017) 자동 오픈.

---

## 사용 흐름

1. **컨트롤 패널 접속** → URL 입력 (+ 선택적으로 이미지 업로드)
2. **"프롬프트 만들기"** 클릭 → 자동 생성된 프롬프트 복사
3. **Claude Code 터미널**에서 프롬프트 붙여넣기 → 슬라이드 HTML + PNG 자동 생성
4. **컨트롤 패널 "생성된 카드뉴스"** 섹션
   - **미리보기**: PNG 갤러리 펼치기
   - **개별 다운로드**: 갤러리 각 PNG 아래 ⬇ 버튼
   - **전체 ZIP**: 한 번에 다운
   - **다시 렌더**: HTML 수정 후 PNG만 재생성

---

## 폴더 구조

```
1.인스타자동화/
├── CLAUDE.md              # 카드뉴스 작성 규칙 (Claude가 따름)
├── server.js              # 컨트롤 패널 서버
├── extract.js             # HTML → PNG 변환
├── public/index.html      # 컨트롤 패널 UI
├── templates/gobang-시리즈픽/   # 슬라이드 템플릿 (cover, list, table 등)
└── output/{slug}/
    ├── slides/slide-0N.html
    └── png/slide-0N.png
```

## 디자인 시스템 요약

- 캔버스: **1080×1350px** (인스타 4:5 비율)
- 폰트: Pretendard
- 강조색: `#009AB5` (highlight), `rgba(0,154,181,0.2)` (badge)
- letter-spacing: `-0.02em` (커버만 `-0.05em`)
- 푸터: "시리즈픽" 고정

상세는 [CLAUDE.md](CLAUDE.md) 참고.

## 문제 해결

- **`npm install` 시 puppeteer 다운로드 실패**: 사내 프록시 환경이면 `PUPPETEER_SKIP_DOWNLOAD=true npm install` 후 시스템 Chrome 경로 지정 필요
- **포트 3017 충돌**: `server.js` 상단 `PORT` 변경 후 `시작 3017.bat`도 같이 수정
- **한글 깨짐 (.bat)**: 콘솔 코드페이지 65001 (UTF-8) 자동 설정됨
