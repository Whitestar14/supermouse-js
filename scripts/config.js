/**
 * Shared configuration for all Supermouse scripts
 */

/** @typedef {{ pkg: string, path: string, global: string }} SharedLib */
/** @typedef {{ umdName?: string, extraExternals: string[], extraGlobals: Record<string, string> }} SpecialCase */

/** @type {SharedLib[]} */
export const SHARED_LIBS = [
  { pkg: '@supermousejs/utils',    path: '../utils/src/index.ts',    global: 'SupermouseUtils'    },
  { pkg: '@supermousejs/zoetrope', path: '../zoetrope/src/index.ts', global: 'SupermouseZoetrope' },
];

/** @type {Record<string, SpecialCase>} */
export const SPECIAL_CASES = {
  legacy: {
    umdName:        'Supermouse',
    extraExternals: [],
    extraGlobals:   {},
  },
  vue: {
    umdName:        'SupermouseVue',
    extraExternals: ['vue'],
    extraGlobals:   { vue: 'Vue' },
  },
  react: {
    umdName:        'SupermouseReact',
    extraExternals: ['react'],
    extraGlobals:   { react: 'React' },
  },
};

/** Directories inside /packages to skip entirely */
export const EXCLUDED_PACKAGES = ['.DS_Store', 'node_modules'];

export const UMD_NAME_PREFIX = 'Supermouse';

/**
 * Convert a kebab-case string to PascalCase.
 * @param {string} str
 * @returns {string}
 */
export function toPascalCase(str) {
  return str.replace(/(^\w|-\w)/g, (m) => m.replace('-', '').toUpperCase());
}

/**
 * Derive the UMD global name for a given package.
 * @param {string} pkgName
 * @returns {string}
 */
export function getUmdName(pkgName) {
  if (SPECIAL_CASES[pkgName]?.umdName) return SPECIAL_CASES[pkgName].umdName;
  if (pkgName === 'core') return 'SupermouseCore';
  return `${UMD_NAME_PREFIX}${toPascalCase(pkgName)}`;
}