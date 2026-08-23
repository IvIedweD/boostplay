export function resolveImageFallback(currentSource: string | null, defaultSource: string): string | null {
  return currentSource && currentSource !== defaultSource ? defaultSource : null;
}
