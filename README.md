# 명산100 정복기

가입 없이 혼자 쓰는 명산 100 완등 챌린지 웹앱 (모바일 PWA).

![화면 미리보기](screenshots/overview.png)

- 명산 100개 목록 · 검색 · 지역/정복 필터 · 내 주변(가까운 순, 반경 10~100km) 조회
- 정상 반경 300m 안에서 GPS 인증, 또는 지난 등산 직접 기록
- 정복하면 산이 캐릭터가 튀어올라 깃발을 꽂고 도장이 쾅! 찍히는 축하 애니메이션
- 도장첩, 칭호(10·30·50·70·100개), 지역별 현황, 지도, 내 주변 미정복 명산
- 인증샷·메모 저장, JSON 백업/복원
- 데이터는 이 기기 브라우저에만 저장 (기록: localStorage, 사진: IndexedDB)

## 실행

```bash
npm install
npm run dev          # http://localhost:5173 (PC 브라우저, 개발자도구 모바일 뷰로 확인)
npm run dev:phone    # 같은 와이파이의 폰에서 https://<PC IP>:5173 접속 (GPS 테스트용)
npm run build        # dist/ 에 정적 파일 생성 → 아무 정적 호스팅에 올리면 됨
```

`dev:phone`은 자체 서명 인증서를 쓰기 때문에 폰에서 "안전하지 않음" 경고가 뜹니다. 고급 → 계속을 누르면 돼요.
브라우저는 HTTPS가 아니면 위치 정보를 막기 때문에 GPS 인증은 HTTPS 주소에서만 동작합니다.

## 배포

`main` 브랜치에 push하면 GitHub Actions가 빌드해서 GitHub Pages에 올립니다 (`.github/workflows/deploy.yml`).

## 산 데이터

`src/data/mountains.json` 에 이름·정상·높이·지역·좌표가 있습니다. 좌표가 실제 정상과 다르면 이 파일을 고치면 됩니다.
인증 반경은 `src/lib/geo.ts` 의 `CERT_RADIUS_M` 입니다.
