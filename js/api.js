// =============================================================================
// api.js — football-data.org API wrapper + data transformation
// =============================================================================

async function apiFetch(path, apiKey) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'X-Auth-Token': apiKey }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Transform standings → group_results
// ---------------------------------------------------------------------------
function transformStandings(standingsData) {
  const groupResults = {};

  const standings = standingsData.standings || [];
  standings.forEach(section => {
    if (section.stage !== 'GROUP_STAGE') return;
    const groupKey = section.group?.replace('GROUP_', '') || '';
    if (!groupKey) return;

    const table = section.table || [];
    groupResults[groupKey] = {
      first:  table[0]?.team?.name || null,
      second: table[1]?.team?.name || null,
      third:  table[2]?.team?.name || null,
      fourth: table[3]?.team?.name || null,
    };
  });

  // Determine which 3rd-place teams qualified (best 8 of 12 thirds)
  const thirds = Object.entries(groupResults)
    .map(([g, r]) => ({ group: g, team: r.third, ...r._thirdStats }))
    .filter(t => t.team);
  // API standings don't always expose 3rd-place comparison points directly.
  // We rely on the LAST_32 matches to determine this more accurately (see below).
  groupResults._qualifying_thirds = thirds.slice(0, 8).map(t => t.team);

  return groupResults;
}

// ---------------------------------------------------------------------------
// Transform matches → knockout_results + Japan results
// ---------------------------------------------------------------------------
function transformMatches(matchesData, existingGroupResults) {
  const matches = matchesData.matches || [];

  const knockoutResults = {
    r32:      [],
    r16:      [],
    qf:       [],
    sf:       [],
    final:    [],
    champion: null,
  };

  const japanGroupMatches = [];
  let japanFinalRound = 'group';
  const JAPAN = 'Japan';

  // Collect all teams that played in each knockout stage
  const stageTeams = { LAST_32: new Set(), LAST_16: new Set(), QUARTER_FINALS: new Set(), SEMI_FINALS: new Set(), FINAL: new Set() };

  matches.forEach(m => {
    const stage  = m.stage;
    const home   = m.homeTeam?.name;
    const away   = m.awayTeam?.name;
    const status = m.status;

    // Group stage — collect Japan's matches
    if (stage === 'GROUP_STAGE' && (home === JAPAN || away === JAPAN)) {
      if (status === 'FINISHED') {
        const japanGoals    = home === JAPAN ? m.score?.fullTime?.home : m.score?.fullTime?.away;
        const oppGoals      = home === JAPAN ? m.score?.fullTime?.away : m.score?.fullTime?.home;
        const opponent      = home === JAPAN ? away : home;
        japanGroupMatches.push({ opponent, japan_goals: japanGoals, opponent_goals: oppGoals });
      }
    }

    // Knockout stages — collect participants
    if (stageTeams[stage]) {
      if (home) stageTeams[stage].add(home);
      if (away) stageTeams[stage].add(away);
    }

    // Determine winner for champion
    if (stage === 'FINAL' && status === 'FINISHED') {
      const winner = m.score?.winner;
      if (winner === 'HOME_TEAM') knockoutResults.champion = home;
      else if (winner === 'AWAY_TEAM') knockoutResults.champion = away;
    }
  });

  // Map stage sets → our round keys
  knockoutResults.r32   = [...stageTeams.LAST_32];
  knockoutResults.r16   = [...stageTeams.LAST_16];
  knockoutResults.qf    = [...stageTeams.QUARTER_FINALS];
  knockoutResults.sf    = [...stageTeams.SEMI_FINALS];
  knockoutResults.final = [...stageTeams.FINAL];

  // Also update qualifying 3rd-place teams from LAST_32 if group results provided
  if (existingGroupResults && stageTeams.LAST_32.size > 0) {
    const groupAdvancers = new Set();
    Object.values(existingGroupResults).forEach(g => {
      if (g.first)  groupAdvancers.add(g.first);
      if (g.second) groupAdvancers.add(g.second);
    });
    const r32Teams = [...stageTeams.LAST_32];
    const qualifyingThirds = r32Teams.filter(t => !groupAdvancers.has(t));
    existingGroupResults._qualifying_thirds = qualifyingThirds;
  }

  // Determine Japan's final round
  if (knockoutResults.champion === JAPAN) { japanFinalRound = 'champion'; }
  else if (knockoutResults.final.includes(JAPAN)) { japanFinalRound = 'final'; }
  else if (knockoutResults.sf.includes(JAPAN)) { japanFinalRound = 'sf'; }
  else if (knockoutResults.qf.includes(JAPAN)) { japanFinalRound = 'qf'; }
  else if (knockoutResults.r16.includes(JAPAN)) { japanFinalRound = 'r16'; }
  else if (knockoutResults.r32.includes(JAPAN)) { japanFinalRound = 'r32'; }

  // Japan total goals (all matches including knockout)
  const japanKnockoutMatches = matches.filter(m =>
    m.stage !== 'GROUP_STAGE' &&
    (m.homeTeam?.name === JAPAN || m.awayTeam?.name === JAPAN) &&
    m.status === 'FINISHED'
  ).map(m => {
    const isHome = m.homeTeam?.name === JAPAN;
    return {
      japan_goals: isHome ? m.score?.fullTime?.home : m.score?.fullTime?.away,
    };
  });

  const totalGoals = [...japanGroupMatches, ...japanKnockoutMatches]
    .reduce((sum, m) => sum + (m.japan_goals || 0), 0);

  const japanResults = {
    final_round:   japanFinalRound,
    top_scorer:    null, // must be entered manually
    total_goals:   totalGoals || null,
    match_scores:  japanGroupMatches,
  };

  return { knockoutResults, japanResults };
}

// ---------------------------------------------------------------------------
// Transform scorers → top_scorer only (assists not available in free tier)
// ---------------------------------------------------------------------------
function transformScorers(scorersData) {
  const scorers = scorersData.scorers || [];
  return {
    top_scorer: scorers[0]?.player?.name || null,
  };
}

// ---------------------------------------------------------------------------
// syncAll — fetch all data and merge into tournament_state patch
// ---------------------------------------------------------------------------
async function syncAll(apiKey) {
  const [standingsData, matchesData, scorersData] = await Promise.all([
    apiFetch(`/competitions/${WC_CODE}/standings`, apiKey),
    apiFetch(`/competitions/${WC_CODE}/matches`, apiKey),
    apiFetch(`/competitions/${WC_CODE}/scorers?limit=1`, apiKey),
  ]);

  const groupResults = transformStandings(standingsData);
  const { knockoutResults, japanResults } = transformMatches(matchesData, groupResults);
  const scorerPatch = transformScorers(scorersData);

  return {
    groupResults,
    knockoutResults,
    japanResults,
    scorerPatch,
    rawCache: {
      standings: standingsData,
      matches:   matchesData,
      scorers:   scorersData,
      synced_at: new Date().toISOString(),
    },
  };
}
