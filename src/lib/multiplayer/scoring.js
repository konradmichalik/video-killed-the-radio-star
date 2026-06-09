// Closest year wins 1 point. Ties share the point.
export function closestYearWinners(submissions, actualYear) {
  const entries = Object.entries(submissions || {});
  if (entries.length === 0) return [];
  const distances = entries.map(([id, sub]) => ({
    id,
    dist: Math.abs(sub.year - actualYear),
  }));
  const minDist = distances.reduce((m, d) => Math.min(m, d.dist), Infinity);
  return distances.filter((d) => d.dist === minDist).map((d) => d.id);
}
