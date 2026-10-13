// SAW (Simple Additive Weighting) engine — murni, tanpa I/O.
// data: array motor (object atau Mongoose doc). kriteriaList: array { key, type, bobot }.
function hitungSAW(data, kriteriaList, bobotOverride = {}) {
  if (!data.length || !kriteriaList.length) return [];

  const normalized = data.map(motor => {
    const r = motor.toObject ? motor.toObject() : { ...motor };
    kriteriaList.forEach(k => {
      const vals = data.map(m => m[k.key]);
      const maxVal = Math.max(...vals);
      const minVal = Math.min(...vals);
      const value = motor[k.key];
      const bobot = bobotOverride[k.key] != null ? bobotOverride[k.key] : k.bobot;
      r['w_' + k.key] = bobot;
      // type: cost -> min/x, benefit -> x/max. Guard agar tak bagi nol.
      r['r_' + k.key] = k.type === 'cost'
        ? (value > 0 ? minVal / value : (minVal === 0 ? 1 : 0))
        : (maxVal > 0 ? value / maxVal : 0);
    });
    return r;
  });

  const withScore = normalized.map(motor => {
    let vi = 0;
    kriteriaList.forEach(k => {
      vi += motor['w_' + k.key] * motor['r_' + k.key];
    });
    return { ...motor, vi };
  });

  return withScore.sort((a, b) => b.vi - a.vi).map((m, i) => ({ ...m, rank: i + 1 }));
}

module.exports = { hitungSAW };
