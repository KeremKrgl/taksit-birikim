/** Prefixes a locale-less path for English, matching localePrefix "as-needed". */
export function localizedPath(path: string, locale: string): string {
  if (locale !== "en") return path;
  return path === "/" ? "/en" : `/en${path}`;
}
