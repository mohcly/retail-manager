import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import basicSsl from "@vitejs/plugin-basic-ssl";
import obfuscator from 'vite-plugin-javascript-obfuscator';

const enableHttps = process.env.VITE_DEV_HTTPS === "true";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determine HTTPS configuration  
  let httpsConfig: { key: Buffer; cert: Buffer } | undefined = undefined;
  let useBasicSslPlugin = false;
  
  if (enableHttps) {
    // prefer mkcert-generated certs when available in project root
    const cert = [
      "localhost+2.pem",
      "localhost.pem",
      "dev-localhost-8080+2.pem",
      "dev-localhost-8080.pem",
    ].find((f) => fs.existsSync(f));
    const key = cert ? (cert.includes("-key") ? cert : cert.replace(/\.pem$/, "-key.pem")) : undefined;
    
    if (cert && key && fs.existsSync(cert) && fs.existsSync(key)) {
      httpsConfig = {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert),
      };
    } else {
      // Fall back to basicSsl plugin
      useBasicSslPlugin = true;
    }
  }

  // Resolve actual build version:
  // 1. Explicit env var VITE_APP_VERSION (if supplied by CI or build runner)
  // 2. src-tauri/tauri.conf.json version (authoritative desktop build version)
  // 3. frontend/package.json version
  let appVersion = process.env.VITE_APP_VERSION;
  if (!appVersion) {
    try {
      const tauriConfPath = path.resolve(__dirname, "../src-tauri/tauri.conf.json");
      if (fs.existsSync(tauriConfPath)) {
        const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
        if (tauriConf.version) {
          appVersion = tauriConf.version;
        }
      }
    } catch (e) {}
  }
  if (!appVersion) {
    try {
      const pkgPath = path.resolve(__dirname, "package.json");
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.version) {
          appVersion = pkg.version;
        }
      }
    } catch (e) {}
  }
  appVersion = appVersion || process.env.npm_package_version || "0.2.0";

  return {
    base: (mode === 'production' && !process.env.VERCEL) ? './' : '/',
    server: {
      host: "::",
      port: 5173,
      https: httpsConfig,
    },
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion)
    },
    plugins: [
      react(),
      (enableHttps && useBasicSslPlugin) && basicSsl(),
      mode === "development" && componentTagger(),
      /* mode === 'production' && obfuscator({
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: true,
          renameGlobals: false,
          selfDefending: true,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          stringArray: true,
          stringArrayCallsTransform: true,
          stringArrayCallsTransformThreshold: 0.75,
          stringArrayEncoding: ['base64'],
          stringArrayIndexesType: ['hexadecimal-number'],
          stringArrayReturnType: 'array',
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false
        },
      }) */
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
 
