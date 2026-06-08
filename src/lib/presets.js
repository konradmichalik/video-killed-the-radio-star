// Build channel presets from the available videos. A preset is a saved filter
// combination: { label, yearMin, yearMax, genres, countries } where a null
// genres/countries means "all". Only presets that overlap the data are
// returned, so e.g. "Best of 70s" won't show if there are no 70s videos.

const DECADES = [
  ['70s', 1970, 1979],
  ['80s', 1980, 1989],
  ['90s', 1990, 1999],
  ['00s', 2000, 2009],
  ['10s', 2010, 2019],
  ['20s', 2020, 2029],
];

const GENRE_CHANNELS = [
  ['Rock Block', ['Rock', 'Grunge', 'Britpop', 'Alternative']],
  ['Hip-Hop', ['Hip-Hop']],
  ['Dance Floor', ['Dance', 'Synthpop']],
  ['Pop Hits', ['Pop']],
];

const COUNTRY_CHANNELS = [
  ['British Invasion', ['United Kingdom']],
  ['Made in USA', ['United States']],
  ['Euro Wave', ['France', 'Germany', 'Norway', 'Sweden']],
  ['Down Under', ['Australia', 'New Zealand']],
];

export function buildPresets(allVideos) {
  if (!allVideos || !allVideos.length) return [];
  const years = allVideos.map((v) => v.year);
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  const genres = new Set(allVideos.map((v) => v.genre));
  const countries = new Set(allVideos.map((v) => v.country).filter(Boolean));

  const decadePresets = DECADES.filter(([, dlo, dhi]) => dhi >= lo && dlo <= hi).map(
    ([label, dlo, dhi]) => ({
      label: `Best of ${label}`,
      yearMin: Math.max(dlo, lo),
      yearMax: Math.min(dhi, hi),
      genres: null,
      countries: null,
    }),
  );

  const genrePresets = GENRE_CHANNELS.map(([label, wanted]) => ({
    label,
    yearMin: lo,
    yearMax: hi,
    genres: wanted.filter((g) => genres.has(g)),
    countries: null,
  })).filter((p) => p.genres.length);

  const countryPresets = COUNTRY_CHANNELS.map(([label, wanted]) => ({
    label,
    yearMin: lo,
    yearMax: hi,
    genres: null,
    countries: wanted.filter((c) => countries.has(c)),
  })).filter((p) => p.countries.length);

  return [
    { label: 'All Time', yearMin: lo, yearMax: hi, genres: null, countries: null },
    ...decadePresets,
    ...genrePresets,
    ...countryPresets,
  ];
}
