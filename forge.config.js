const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "CosmoLink",
    icon: "./public/icons/cosmoLink", // 확장자 제거
    extraFiles: [
      {
        from: "public/preload.js",
        to: "preload.js",
      },
      {
        from: "public/css",
        to: "build/css",
      },
      {
        from: "public/favicons",
        to: "build/favicons",
      },
      {
        from: "public/fonts",
        to: "build/fonts",
      },
      {
        from: "public/icons",
        to: "build/icons",
      },
      {
        from: "public/images",
        to: "build/images",
      },
      {
        from: "public/manifest.json",
        to: "build/manifest.json",
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
      platforms: ['win32'],
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"],
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};