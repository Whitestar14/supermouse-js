export const PACKAGE_BUILD_ENTRIES = {
  main: "dist/index.umd.js",
  module: "dist/index.mjs",
  types: "dist/index.d.ts"
};

export function syncPackageManifest(pkg, pkgName) {
  const changes = [];

  if (pkg.scripts?.build !== "vite build") {
    pkg.scripts ??= {};
    pkg.scripts.build = "vite build";
    changes.push(`  → ${pkgName}: Updated build script`);
  }

  for (const [field, value] of Object.entries(PACKAGE_BUILD_ENTRIES)) {
    if (pkg[field] !== value) {
      pkg[field] = value;
      changes.push(`  → ${pkgName}: Set ${field} → ${value}`);
    }
  }

  if (!pkg.exports) {
    pkg.exports = {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.mjs",
        require: "./dist/index.umd.js"
      }
    };
    changes.push(`  → ${pkgName}: Created exports field`);
  }

  if (pkg.name?.startsWith("@supermousejs/")) {
    pkg.publishConfig ??= {};
    if (pkg.publishConfig.access !== "public") {
      pkg.publishConfig.access = "public";
      changes.push(`  → ${pkgName}: Set publishConfig.access → public`);
    }
  }

  pkg.peerDependencies ??= {};
  pkg.devDependencies ??= {};
  pkg.dependencies ??= {};

  return { pkg, changes };
}
