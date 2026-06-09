// Pure reducer for room state. All updates are immutable.
export const EMPTY_ROOM = {
  session: null,
  players: [],
  submissions: {},
};

export function startSession(state, now = Date.now()) {
  return {
    ...state,
    session: { startedAt: now, round: 1, phase: 'idle', currentVideo: null },
    submissions: {},
  };
}

export function startRound(state, currentVideo) {
  if (!state.session) return state;
  return {
    ...state,
    session: { ...state.session, phase: 'guessing', currentVideo },
    submissions: {},
  };
}

export function submitGuess(state, playerId, year, now = Date.now()) {
  if (!state.session || state.session.phase !== 'guessing') return state;
  return {
    ...state,
    submissions: {
      ...state.submissions,
      [playerId]: { year, lockedAt: now },
    },
  };
}

export function reveal(state, winnerIds) {
  if (!state.session) return state;
  const set = new Set(winnerIds);
  return {
    ...state,
    players: state.players.map((p) =>
      set.has(p.id) ? { ...p, score: (p.score || 0) + 1 } : p,
    ),
    session: { ...state.session, phase: 'revealed' },
  };
}

export function nextRound(state) {
  if (!state.session) return state;
  return {
    ...state,
    session: {
      ...state.session,
      round: state.session.round + 1,
      phase: 'idle',
      currentVideo: null,
    },
    submissions: {},
  };
}

export function endSession(state) {
  return { ...state, session: null, submissions: {} };
}

export function addPlayer(state, { id, name }) {
  const existing = state.players.find((p) => p.id === id);
  if (existing) {
    return {
      ...state,
      players: state.players.map((p) =>
        p.id === id ? { ...p, name, connected: true } : p,
      ),
    };
  }
  return {
    ...state,
    players: [
      ...state.players,
      { id, name, connected: true, score: 0, lastSubmission: null },
    ],
  };
}

export function markPlayerDisconnected(state, playerId) {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, connected: false } : p,
    ),
  };
}
