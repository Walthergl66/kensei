const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

// zustand v5 publica versiones ESM (.mjs) que usan `import.meta` (no soportado
// por el bundle dev de Metro en web, causa pantalla blanca por SyntaxError).
// En web forzamos la version CommonJS de la raiz del paquete, que no usa import.meta.
const ZUSTAND_CJS = {
  "zustand": "zustand/index.js",
  "zustand/middleware": "zustand/middleware.js",
  "zustand/vanilla": "zustand/vanilla.js",
  "zustand/react": "zustand/react.js",
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && ZUSTAND_CJS[moduleName]) {
    return {
      type: "sourceFile",
      filePath: path.join(process.cwd(), "node_modules", ZUSTAND_CJS[moduleName]),
    };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });