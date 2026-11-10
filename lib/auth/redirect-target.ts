const FALLBACK_REDIRECT = '/teams/signup';

export function getSafeRedirectPath(
  candidate: string | null | undefined,
): string {
  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    /[\u0000-\u001f]/.test(candidate)
  ) {
    return FALLBACK_REDIRECT;
  }

  try {
    const url = new URL(candidate, 'https://konneqta.invalid');
    if (url.origin !== 'https://konneqta.invalid') {
      return FALLBACK_REDIRECT;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return FALLBACK_REDIRECT;
  }
}
