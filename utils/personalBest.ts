export function getPersonalBest(key: string): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(key);
  return stored ? Number(stored) || 0 : 0;
}

export function setPersonalBest(key: string, score: number): number {
  if (typeof window === "undefined") return score;
  const current = getPersonalBest(key);
  if (score > current) {
    localStorage.setItem(key, String(score));
    return score;
  }
  return current;
}
