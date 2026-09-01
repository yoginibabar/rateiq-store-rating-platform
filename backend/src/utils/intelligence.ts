export type RatingLike = {
  value: number;
  createdAt: Date | string;
};

const avg = (r: RatingLike[]) =>
  r.length ? r.reduce((s, x) => s + x.value, 0) / r.length : 0;

export function confidence(count: number) {
  return Math.min(100, Math.round((1 - Math.exp(-count / 20)) * 100));
}

export function trend(ratings: RatingLike[]) {
  const now = Date.now();
  const cut = now - 30 * 864e5;
  const prev = now - 60 * 864e5;

  const recent = ratings.filter(
    (r) => new Date(r.createdAt).getTime() >= cut,
  );

  const old = ratings.filter((r) => {
    const t = new Date(r.createdAt).getTime();
    return t >= prev && t < cut;
  });

  const current = avg(recent);
  const previous = avg(old);

  const change = previous
    ? ((current - previous) / previous) * 100
    : 0;

  return {
    current: Number(current.toFixed(2)),
    previous: Number(previous.toFixed(2)),
    change: Number(change.toFixed(1)),
    direction:
      change > 2
        ? 'IMPROVING'
        : change < -2
          ? 'DECLINING'
          : 'STABLE',
  };
}

export function health(ratings: RatingLike[]) {
  const score = avg(ratings);
  const quality = (score / 5) * 100;
  const conf = confidence(ratings.length);
  const tr = trend(ratings);

  const trScore = Math.max(
    0,
    Math.min(100, 50 + tr.change * 5),
  );

  const variance = ratings.length
    ? ratings.reduce(
        (s, r) => s + (r.value - score) ** 2,
        0,
      ) / ratings.length
    : 0;

  const stability = Math.max(
    0,
    100 - Math.sqrt(variance) * 35,
  );

  const engagement = Math.min(100, ratings.length * 5);

  return Math.round(
    0.35 * quality +
      0.25 * conf +
      0.2 * trScore +
      0.1 * stability +
      0.1 * engagement,
  );
}

export function analytics(ratings: RatingLike[]) {
  const distribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: ratings.filter((x) => x.value === r).length,
  }));

  return {
    rating: Number(avg(ratings).toFixed(2)),
    ratingCount: ratings.length,
    confidence: confidence(ratings.length),
    health: health(ratings),
    distribution,
    trend: trend(ratings),
  };
}

export function anomaly(ratings: RatingLike[]) {
  const days = 30;
  const now = Date.now();

  const counts = Array.from(
    { length: days },
    () => 0,
  );

  ratings.forEach((r) => {
    const d = Math.floor(
      (now - new Date(r.createdAt).getTime()) / 864e5,
    );

    if (d >= 0 && d < days) {
      counts[days - 1 - d]++;
    }
  });

  const mean =
    counts.reduce((a, b) => a + b, 0) / days;

  const sd = Math.sqrt(
    counts.reduce(
      (s, x) => s + (x - mean) ** 2,
      0,
    ) / days,
  );

  const today = counts.at(-1) || 0;

  const deviation = sd
    ? (today - mean) / sd
    : 0;

  const unusual =
    (today >= 5 && deviation >= 2) ||
    (mean > 0 && today >= mean * 4);

  return {
    unusual,
    today,
    baseline: Number(mean.toFixed(1)),
    deviation: Number(deviation.toFixed(1)),
    risk:
      unusual && deviation >= 3
        ? 'HIGH'
        : unusual
          ? 'MEDIUM'
          : 'LOW',
  };
}

export function insight(a: any) {
  if (a.ratingCount < 10 && a.rating >= 4) {
    return `Your rating is strong, but confidence is moderate because the store has relatively few ratings.`;
  }

  if (a.trend.direction === 'IMPROVING') {
    return `Rating performance is improving. The current average is ${a.trend.current}, up ${Math.abs(a.trend.change)}% versus the previous period.`;
  }

  if (a.trend.direction === 'DECLINING') {
    return `Rating performance is declining. Review recent customer feedback and monitor the next rating cycle.`;
  }

  return `Rating performance is stable with a ${a.rating} average across ${a.ratingCount} ratings.`;
}