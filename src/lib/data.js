export async function loadVideos() {
  const res = await fetch(`${import.meta.env.BASE_URL}videos.json`);
  if (!res.ok) throw new Error(`videos.json: HTTP ${res.status}`);
  return res.json();
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function genresOf(all) {
  return [...new Set(all.map((v) => v.genre))].sort();
}

export function countriesOf(all) {
  return [...new Set(all.map((v) => v.country).filter(Boolean))].sort();
}

// Continent for each country name we know about. Lowercase keys for tolerant
// lookup. Anything not in the map falls through to "Other".
const CONTINENT_OF = {
  europe: [
    'Germany',
    'United Kingdom',
    'France',
    'Netherlands',
    'Italy',
    'Sweden',
    'Ireland',
    'Austria',
    'Belgium',
    'Spain',
    'Norway',
    'Denmark',
    'Finland',
    'Switzerland',
    'Iceland',
    'Hungary',
    'Poland',
    'Czech Republic',
    'Slovakia',
    'Romania',
    'Greece',
    'Portugal',
    'Russia',
    'Ukraine',
    'Croatia',
    'Slovenia',
    'Serbia',
    'Bulgaria',
    'Lithuania',
    'Latvia',
    'Estonia',
    'Luxembourg',
    'Moldova',
  ],
  'north america': ['United States', 'Canada', 'Mexico'],
  'south america': ['Brazil', 'Colombia', 'Argentina', 'Chile', 'Peru'],
  asia: ['Japan', 'South Korea', 'China', 'India', 'Philippines', 'Thailand', 'Israel', 'Turkey'],
  africa: ['Egypt', 'Nigeria', 'Ghana', 'South Africa'],
  oceania: ['Australia', 'New Zealand'],
  caribbean: ['Jamaica'],
};

const COUNTRY_TO_CONTINENT = (() => {
  const m = new Map();
  for (const [cont, list] of Object.entries(CONTINENT_OF)) {
    for (const c of list) m.set(c, cont);
  }
  return m;
})();

const CONTINENT_ORDER = [
  'europe',
  'north america',
  'south america',
  'asia',
  'africa',
  'oceania',
  'caribbean',
  'other',
];

const CONTINENT_LABEL = {
  europe: 'EUROPE',
  'north america': 'NORTH AMERICA',
  'south america': 'SOUTH AMERICA',
  asia: 'ASIA',
  africa: 'AFRICA',
  oceania: 'OCEANIA',
  caribbean: 'CARIBBEAN',
  other: 'OTHER',
};

/** Group the given country names into [{label, continent, countries[]}, ...]
 *  ordered by CONTINENT_ORDER. Empty groups are dropped. (pure / testable) */
export function groupCountriesByContinent(countries) {
  const groups = new Map();
  for (const c of countries) {
    const cont = COUNTRY_TO_CONTINENT.get(c) ?? 'other';
    if (!groups.has(cont)) groups.set(cont, []);
    groups.get(cont).push(c);
  }
  return CONTINENT_ORDER.filter((cont) => groups.has(cont)).map((cont) => ({
    continent: cont,
    label: CONTINENT_LABEL[cont],
    countries: groups.get(cont).sort(),
  }));
}

export function yearBounds(all) {
  const y = all.map((v) => v.year);
  return [Math.min(...y), Math.max(...y)];
}

export function yearRange(videos) {
  const years = (videos || []).map((v) => v.year).filter(Number.isFinite);
  if (years.length === 0) return { min: 1900, max: new Date().getFullYear() };
  return { min: Math.min(...years), max: Math.max(...years) };
}

export function filterVideos(all, { yearMin, yearMax, genres, countries }) {
  return all.filter((v) => {
    if (v.year < yearMin || v.year > yearMax) return false;
    if (genres && !genres.has(v.genre)) return false;
    // country filter only applies to entries that have a country, so entries
    // without one are never hidden by it (keeps the field optional)
    if (countries && v.country && !countries.has(v.country)) return false;
    return true;
  });
}

// Ranked autocomplete search over artist/title (also matches year/country/genre).
// Pure and synchronous so it can be unit-tested and run on every keystroke.
export function searchVideos(all, query, limit = 50) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  const scored = [];
  for (const v of all) {
    const artist = (v.artist || '').toLowerCase();
    const title = (v.title || '').toLowerCase();
    const hay = `${artist} ${title} ${v.year || ''} ${(v.country || '').toLowerCase()} ${(
      v.genre || ''
    ).toLowerCase()}`;
    if (!tokens.every((t) => hay.includes(t))) continue;
    let score = 10; // matched all tokens somewhere
    if (artist.startsWith(q)) score += 100;
    else if (artist.includes(q)) score += 40;
    if (title.startsWith(q)) score += 80;
    else if (title.includes(q)) score += 30;
    scored.push({ v, score });
  }
  scored.sort((a, b) => b.score - a.score || a.v.artist.localeCompare(b.v.artist));
  return scored.slice(0, limit).map((s) => s.v);
}
