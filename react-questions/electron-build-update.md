# Q : Electron 앱은 어떻게 빌드·배포하고 자동 업데이트하나요?

<br />

# A : Electron 자체에는 패키징 기능이 없어서, 보통 공식 도구인 **Electron Forge**로 세 단계를 거칩니다. 먼저 앱 코드와 Electron 실행 파일을 하나로 묶고(**package**), OS별 설치 파일(Windows는 Squirrel·MSI, macOS는 DMG·ZIP, Linux는 deb·rpm 등)을 만들고(**make**), GitHub Releases 같은 곳에 올립니다(**publish**). 이때 **코드 서명**이 사실상 필수입니다. Windows와 macOS 모두 서명하지 않은 앱은 실행을 막거나 경고를 띄우고, macOS는 서명 후 Apple의 **공증(notarization)**까지 받아야 하며, 자동 업데이트도 서명된 앱이어야 동작합니다. 자동 업데이트는 Electron에 내장된 `autoUpdater`(Squirrel 기반)를 쓰고, 공개 GitHub 저장소라면 무료 서비스인 **update.electronjs.org**와 `update-electron-app` 모듈 한 줄로 붙일 수 있습니다.

### 전체 흐름

```
코드 ─ npm run package ─▶ 실행 파일 묶음 ─ npm run make ─▶ 설치 파일 (exe / dmg / deb ...)
                                                    │ 코드 서명 (+ macOS 공증)
                                                    ▼
                                   npm run publish ─▶ GitHub Releases / S3 등
                                                    ▼
                                 설치된 앱이 업데이트 확인 ─▶ 백그라운드 다운로드 ─▶ 재시작 시 적용
```

### 1. 패키징과 설치 파일 (Electron Forge)

```bash
# 기존 프로젝트에 Forge 붙이기
npx create-electron-app@latest import

npm run package   # 실행 파일 묶음만
npm run make      # package + OS별 설치 파일 (결과: out/make)
npm run publish   # 설정한 곳(예: GitHub Releases)에 업로드
```

- Forge는 `@electron/packager`, `@electron/osx-sign`, `electron-winstaller` 같은 개별 도구를 묶은 파이프라인이다.
- 어떤 설치 파일을 만들지는 **maker**로 정한다(DMG, deb, MSI 등). 배포처는 **publisher**로 정한다(예: `@electron-forge/publisher-github`).
- 각 OS용 설치 파일은 보통 그 OS에서 만든다. 그래서 CI에서 Windows·macOS·Linux 러너를 나눠 빌드하는 경우가 많다.

### 2. 코드 서명

| OS | 필요한 것 | 서명하지 않으면 |
|---|---|---|
| macOS | Apple Developer Program, 인증서로 서명 + Apple **공증(notarization)** | 실행이 막히고 사용자가 수동으로 허용해야 함. 자동 업데이트(Squirrel.Mac)가 아예 동작하지 않음 |
| Windows | 코드 서명 인증서 (2023년 6월부터 EV 인증서 요구), 또는 Azure Artifact Signing | SmartScreen 경고, 실행 차단 |

```js
// forge.config.js (macOS 서명·공증 예)
module.exports = {
  packagerConfig: {
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    },
  },
};
```

- 인증서·비밀번호는 코드에 넣지 않고 CI의 비밀 값(환경 변수)으로 넣는다.
- 공식 문서는 Windows 서명 방법 중 Azure Artifact Signing을 가장 저렴한 선택지로 소개한다.

### 3. 자동 업데이트

**가장 간단한 방법: update.electronjs.org (무료)**

```js
// main.js
require('update-electron-app')();
// 시작할 때와 이후 10분마다 확인하고, 새 버전을 백그라운드에서 받아 둔다
```

- 조건: macOS 또는 Windows 앱, **공개** GitHub 저장소, 빌드를 GitHub Releases에 올림, macOS는 코드 서명된 빌드.
- 비공개 저장소나 자체 서버라면 S3 같은 정적 저장소(`UpdateSourceType.StaticStorage`)를 쓰거나 Hazel, Nuts, electron-release-server 같은 업데이트 서버를 둔다.

**직접 구현: autoUpdater**

```js
const { autoUpdater, dialog } = require('electron');

autoUpdater.setFeedURL({ url: `https://update.example.com/${process.platform}/${app.getVersion()}` });
autoUpdater.checkForUpdates();

autoUpdater.on('update-downloaded', async () => {
  const { response } = await dialog.showMessageBox({
    buttons: ['재시작', '나중에'],
    message: '새 버전을 받았어요. 재시작하면 적용됩니다.',
  });
  if (response === 0) autoUpdater.quitAndInstall();
});
```

### 실무 체크리스트

- **버전 관리**: `package.json`의 `version`이 업데이트 비교 기준이다. 릴리스마다 올린다.
- **CI로 자동화**: 태그를 푸시하면 OS별로 빌드·서명·공증·업로드까지 한 번에.
- **업데이트 UX**: 다운로드는 백그라운드로, 적용은 사용자가 고른 시점(재시작)에. 작업 중에 강제로 재시작하지 않는다.
- **Electron 버전 따라가기**: Electron은 8주마다 메이저 버전이 나오고 최근 3개 메이저만 지원한다. Chromium 보안 패치를 받으려면 주기적으로 올려야 한다.
- **롤백 대비**: 문제 있는 버전을 내렸을 때 이전 버전을 다시 배포할 수 있게 릴리스를 보관한다.

- 면접 답변 요약: "Electron은 자체 패키징 기능이 없어서 Electron Forge로 package, make, publish 단계를 거쳐 OS별 설치 파일을 만들고 GitHub Releases 등에 올립니다. Windows와 macOS는 서명하지 않은 앱 실행을 막거나 경고하고, macOS는 공증까지 필요하며 자동 업데이트도 서명된 앱이어야 해서 코드 서명은 사실상 필수입니다. 자동 업데이트는 내장 autoUpdater를 쓰고, 공개 저장소면 update.electronjs.org와 update-electron-app 한 줄로 붙일 수 있습니다. Electron은 8주마다 메이저가 나오고 최근 3개만 지원하므로 CI로 빌드·서명·배포를 자동화해 꾸준히 올리는 게 중요합니다."

### 관련 질문

- [React(Vite) 프로젝트에 Electron을 붙이려면 어떻게 구성하나요?](./electron-react-setup.md)
- [CI/CD란?](../web-questions/ci-cd.md)

### 참고

- [Packaging Your Application (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
- [Code Signing (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [Updating Applications (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/updates)
- [Electron Releases (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- [Getting Started (Electron Forge)](https://www.electronforge.io/)
