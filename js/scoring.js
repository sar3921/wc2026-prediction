// =============================================================================
// scoring.js — Pure scoring functions (no DOM, no network)
// =============================================================================

// ---------------------------------------------------------------------------
// Helper: case-insensitive, trimmed string comparison
// ---------------------------------------------------------------------------
function eqStr(a, b) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Helper: check if a team appears in a set (case-insensitive)
function inSet(team, arr) {
  if (!team || !Array.isArray(arr)) return false;
  const t = team.trim().toLowerCase();
  return arr.some(x => x && x.trim().toLowerCase() === t);
}

// ---------------------------------------------------------------------------
// PART A — Group Stage (max 108pt)
// ---------------------------------------------------------------------------
function scorePartA(pred, groupResults) {
  if (!pred || !groupResults) return { total: 0, breakdown: {} };

  const groups = pred.groups || {};
  const thirdPicks = pred.third_place_qualifiers || [];

  let total = 0;
  const breakdown = { groups: {}, third: { pts: 0, correct: [] } };

  Object.keys(WC2026_GROUPS).forEach(g => {
    const actual = groupResults[g] || {};
    const pick   = groups[g] || {};
    let pts = 0;
    let note = '';

    const actualFirst  = actual.first  || '';
    const actualSecond = actual.second || '';
    const pickFirst    = pick.first    || '';
    const pickSecond   = pick.second   || '';

    if (actualFirst && actualSecond && pickFirst && pickSecond) {
      if (eqStr(pickFirst, actualFirst) && eqStr(pickSecond, actualSecond)) {
        pts = 7; note = '1位2位完全正解 (+7)';
      } else if (eqStr(pickFirst, actualSecond) && eqStr(pickSecond, actualFirst)) {
        pts = 2; note = '1位2位逆順 (+2)';
      } else if (eqStr(pickFirst, actualFirst)) {
        pts = 4; note = '1位のみ正解 (+4)';
      } else if (eqStr(pickSecond, actualSecond)) {
        pts = 3; note = '2位のみ正解 (+3)';
      } else {
        note = '不正解';
      }
    } else if (actualFirst || actualSecond) {
      // Partial results available
      if (actualFirst && eqStr(pickFirst, actualFirst)) { pts = 4; note = '1位正解 (+4)'; }
      else if (actualSecond && eqStr(pickSecond, actualSecond)) { pts = 3; note = '2位正解 (+3)'; }
      else { note = '集計中'; }
    } else {
      note = '未確定';
    }

    total += pts;
    breakdown.groups[g] = { pts, note };
  });

  // 3rd place qualifiers
  const actualThirds = Object.values(groupResults)
    .map(g => g.third)
    .filter(Boolean);

  thirdPicks.forEach(team => {
    if (inSet(team, actualThirds)) {
      breakdown.third.pts += 3;
      breakdown.third.correct.push(team);
    }
  });
  total += breakdown.third.pts;

  return { total, breakdown };
}

// ---------------------------------------------------------------------------
// PART B — Knockout Tournament (max 100pt)
// ---------------------------------------------------------------------------
function scorePartB(pred, knockoutResults) {
  if (!pred || !knockoutResults) return { total: 0, breakdown: {} };

  const rounds = [
    { key: 'qf',       picks: pred.qf       || [], actual: knockoutResults.qf       || [], pts: 5, label: 'ベスト8' },
    { key: 'sf',       picks: pred.sf       || [], actual: knockoutResults.sf       || [], pts: 5, label: 'ベスト4' },
    { key: 'final',    picks: pred.final    || [], actual: knockoutResults.final    || [], pts: 5, label: '決勝' },
    { key: 'champion', picks: pred.champion ? [pred.champion] : [], actual: knockoutResults.champion ? [knockoutResults.champion] : [], pts: 30, label: '優勝' },
  ];

  let total = 0;
  const breakdown = {};

  rounds.forEach(({ key, picks, actual, pts, label }) => {
    let correct = 0;
    const correctTeams = [];
    if (actual.length > 0) {
      picks.forEach(team => {
        if (inSet(team, actual)) {
          correct++;
          correctTeams.push(team);
        }
      });
    }
    const roundPts = correct * pts;
    total += roundPts;
    breakdown[key] = { pts: roundPts, correct, correctTeams, perTeam: pts, label };
  });

  return { total, breakdown };
}

// ---------------------------------------------------------------------------
// PART C — Individual Awards (max 80pt)
// ---------------------------------------------------------------------------
function scorePartC(pred, awards) {
  if (!pred || !awards) return { total: 0, breakdown: {} };

  const fields = [
    { key: 'top_scorer',    label: '得点王',         pts: 20 },
    { key: 'assist_king',   label: 'アシスト王',     pts: 20 },
    { key: 'golden_ball',   label: 'ゴールデンボール', pts: 20 },
    { key: 'golden_glove',  label: 'ゴールデングローブ', pts: 20 },
  ];

  let total = 0;
  const breakdown = {};

  fields.forEach(({ key, label, pts }) => {
    const correct = eqStr(pred[key], awards[key]);
    const earnedPts = (awards[key] && correct) ? pts : 0;
    total += earnedPts;
    breakdown[key] = {
      pts: earnedPts,
      correct,
      label,
      predicted: pred[key] || '—',
      actual: awards[key] || '未確定',
    };
  });

  return { total, breakdown };
}

// ---------------------------------------------------------------------------
// PART D — Dark Horse (max 100pt)
// ---------------------------------------------------------------------------
function scorePartD(pred, knockoutResults) {
  if (!pred || !knockoutResults) return { total: 0, breakdown: {} };

  const team = pred.team;
  if (!team) return { total: 0, breakdown: { team: null, highest_round: null } };

  const milestones = [
    { key: 'champion', pts: 100, label: '優勝' },
    { key: 'final',    pts: 80,  label: '決勝進出' },
    { key: 'sf',       pts: 60,  label: 'ベスト4' },
    { key: 'qf',       pts: 40,  label: 'ベスト8' },
    { key: 'r16',      pts: 20,  label: 'ベスト16' },
  ];

  for (const m of milestones) {
    const actual = m.key === 'champion'
      ? (knockoutResults.champion ? [knockoutResults.champion] : [])
      : (knockoutResults[m.key] || []);

    if (actual.length > 0 && inSet(team, actual)) {
      return { total: m.pts, breakdown: { team, highest_round: m.key, label: m.label } };
    }
  }

  return { total: 0, breakdown: { team, highest_round: null, label: '未進出' } };
}

// ---------------------------------------------------------------------------
// PART E — Japan Special (max 95pt)
// ---------------------------------------------------------------------------
function scorePartE(pred, japanResults) {
  if (!pred || !japanResults) return { total: 0, breakdown: {} };

  let total = 0;
  const breakdown = {};

  // Final round (20pt)
  const roundCorrect = pred.final_round && japanResults.final_round &&
    eqStr(pred.final_round, japanResults.final_round);
  const roundPts = roundCorrect ? 20 : 0;
  total += roundPts;
  breakdown.final_round = {
    pts: roundPts,
    correct: roundCorrect,
    predicted: pred.final_round || '—',
    actual: japanResults.final_round || '未確定',
  };

  // Japan top scorer (15pt)
  const scorerCorrect = eqStr(pred.top_scorer, japanResults.top_scorer);
  const scorerPts = (japanResults.top_scorer && scorerCorrect) ? 15 : 0;
  total += scorerPts;
  breakdown.top_scorer = {
    pts: scorerPts,
    correct: scorerCorrect,
    predicted: pred.top_scorer || '—',
    actual: japanResults.top_scorer || '未確定',
  };

  // Total goals (15pt exact / 7pt ±1)
  let goalsPts = 0;
  let goalsNote = '未確定';
  if (japanResults.total_goals != null && pred.total_goals_exact != null) {
    const diff = Math.abs(pred.total_goals_exact - japanResults.total_goals);
    if (diff === 0) { goalsPts = 15; goalsNote = '完全一致 (+15)'; }
    else if (diff === 1) { goalsPts = 7; goalsNote = '±1点 (+7)'; }
    else { goalsNote = `外れ (実際: ${japanResults.total_goals}ゴール)`; }
  }
  total += goalsPts;
  breakdown.total_goals = {
    pts: goalsPts,
    note: goalsNote,
    predicted: pred.total_goals_exact,
    actual: japanResults.total_goals,
  };

  // Group matches (3 matches × max 15pt)
  const matchPredictions = pred.match_scores || [];
  const actualMatches    = japanResults.match_scores || [];
  breakdown.matches = [];

  matchPredictions.forEach((predMatch, i) => {
    const actual = actualMatches[i];
    let matchPts = 0;
    let matchNote = '未確定';

    if (actual && actual.japan_goals != null && actual.opponent_goals != null) {
      const predResult  = Math.sign(predMatch.japan_goals - predMatch.opponent_goals);
      const actualResult = Math.sign(actual.japan_goals - actual.opponent_goals);

      if (predMatch.japan_goals === actual.japan_goals &&
          predMatch.opponent_goals === actual.opponent_goals) {
        matchPts = 15;
        matchNote = `完全一致 ${actual.japan_goals}-${actual.opponent_goals} (+15)`;
      } else if (predResult === actualResult) {
        matchPts = 7;
        matchNote = `勝敗正解 (+7)`;
      } else {
        matchNote = `外れ (実際: ${actual.japan_goals}-${actual.opponent_goals})`;
      }
    }

    total += matchPts;
    breakdown.matches.push({
      match: i + 1,
      opponent: predMatch.opponent || JAPAN_GROUP_MATCHES[i]?.opponent || `第${i+1}戦`,
      predicted: `${predMatch.japan_goals}-${predMatch.opponent_goals}`,
      actual: actual ? `${actual.japan_goals}-${actual.opponent_goals}` : '未確定',
      pts: matchPts,
      note: matchNote,
    });
  });

  return { total, breakdown };
}

// ---------------------------------------------------------------------------
// PART F — Secret Card (admin-set points)
// ---------------------------------------------------------------------------
function scorePartF(partFPoints) {
  const pts = typeof partFPoints === 'number' ? partFPoints : 0;
  return { total: pts };
}

// ---------------------------------------------------------------------------
// scoreAll — compute all 6 parts + tiebreakers
// ---------------------------------------------------------------------------
function scoreAll(prediction, tournamentState) {
  if (!prediction) {
    return {
      partA: { total: 0 }, partB: { total: 0 }, partC: { total: 0 },
      partD: { total: 0 }, partE: { total: 0 }, partF: { total: 0 },
      total: 0, tiebreakers: { correct_champion: false, part_a_pts: 0, part_b_pts: 0 },
    };
  }

  const ts = tournamentState || {};

  const partA = scorePartA(prediction.part_a, ts.group_results || {});
  const partB = scorePartB(prediction.part_b, ts.knockout_results || {});
  const partC = scorePartC(prediction.part_c, ts.awards || {});
  const partD = scorePartD(prediction.part_d, ts.knockout_results || {});
  const partE = scorePartE(prediction.part_e, ts.japan_results || {});
  const partF = scorePartF(prediction.part_f_points);

  const total = partA.total + partB.total + partC.total + partD.total + partE.total + partF.total;

  return {
    partA, partB, partC, partD, partE, partF,
    total,
    tiebreakers: {
      correct_champion: partB.breakdown?.champion?.pts > 0,
      part_a_pts: partA.total,
      part_b_pts: partB.total,
    },
  };
}
