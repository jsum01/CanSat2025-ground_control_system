/**
 * Electron Forge 설정 파일
 * 안정적인 macOS 및 Windows 빌드를 위한 간소화된 설정
 */

// 필요한 모듈 가져오기
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  // 패키저 설정
  packagerConfig: {
    asar: true,
    ignore: [ // 불필요 파일 제외
      "^\\/\\.git($|\\/)",
      "^\\/node_modules\\/\\.cache",
      "^\\/\\.vscode",
      "\\.map$"
    ],
    executableName: "CosmoLink",
    // 운영체제별 아이콘 자동 선택 (파일 확장자 제외)
    icon: "./public/icons/cosmoLink",
    extraFiles: [
      { from: "public/preload.js", to: "preload.js" },
    ]
  },
  rebuildConfig: {},
  
  // 메이커 설정
  makers: [
    // Windows 인스톨러
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "CosmoLink"
      },
      platforms: ["win32"]
    },
    // ZIP 패키지 (모든 플랫폼)
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"]
    }
  ],
  
  // 플러그인 설정
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {}
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false
    })
  ]
};