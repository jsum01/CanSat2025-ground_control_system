# Electron-React 프로젝트 스크립트 사용 가이드

이 문서는 Electron과 React를 사용하는 프로젝트의 스크립트 사용법을 설명합니다.

## 개발 환경

### 개발 서버 실행
```bash
npm run dev
```
React 개발 서버와 Electron을 동시에 실행합니다. 개발 중에 UI 변경사항이 즉시 반영됩니다.

### React 서버만 실행
```bash
npm run start
```
React 개발 서버만 실행하고 싶을 때 사용합니다.

### Electron만 실행
```bash
npm run electron
```
Electron 애플리케이션만 별도로 실행합니다.

## 빌드 및 패키징

### 리액트 빌드
```bash
npm run build
```
React 애플리케이션을 빌드하여 `build` 폴더에 생성합니다.

### 패키징
```bash
npm run package
```
Electron 애플리케이션을 패키징하지만 실행 파일은 생성하지 않습니다.

## 플랫폼별 빌드

### Windows 64비트 빌드
```bash
npm run make-win64
```
Windows 64비트용 애플리케이션을 빌드합니다. 결과물은 `out/win64` 폴더에 생성됩니다.

### Windows 32비트 빌드
```bash
npm run make-win32
```
Windows 32비트용 애플리케이션을 빌드합니다. 결과물은 `out/win32` 폴더에 생성됩니다.

### macOS 빌드
```bash
npm run make-mac
```
macOS용 애플리케이션을 빌드합니다. 결과물은 `out/mac` 폴더에 생성됩니다.

### 모든 플랫폼 빌드
```bash
npm run make-all
```
Windows 32비트, 64비트 및 macOS 용 애플리케이션을 모두 빌드합니다.

## 유틸리티 스크립트

### 캐시 및 빌드 폴더 정리
```bash
npm run clean
```
`build`, `out` 폴더 및 노드 모듈 캐시를 삭제합니다.

### 재빌드 스크립트
```bash
npm run rebuild-win64
```
```bash
npm run rebuild-win32
```
```bash
npm run rebuild-mac
```
캐시와 이전 빌드를 정리한 후 해당 플랫폼에 맞는 새 빌드를 생성합니다.

## 플랫폼별 빌드 주의사항

### Windows 빌드
- Windows에서 빌드할 때는 `make-win32` 또는 `make-win64` 스크립트를 사용하세요.
- 64비트 Windows 시스템에서는 `make-win64`를 권장합니다.

### macOS 빌드
- macOS에서 빌드할 때는 `make-mac` 스크립트를 사용하세요.
- Windows에서 macOS 빌드를 생성하려면 추가 설정이 필요할 수 있습니다.

## 문제 해결

### 빌드 오류 발생 시
1. `npm run clean`으로 이전 빌드 파일 정리
2. `npm install`로 의존성 재설치
3. 해당 플랫폼의 빌드 스크립트 다시 실행

### 개발 서버 실행 오류
1. 포트 3000이 이미 사용 중인지 확인
2. Node.js 버전이 프로젝트 요구사항과 일치하는지 확인