const VALID_KEYS = new Set(['harga', 'tangki', 'cc']);
const VALID_TYPES = new Set(['benefit', 'cost']);

function hitungSAW(data, kriteriaList, bobotOverride = {}) {
  if (!data.length || !kriteriaList.length) return [];

  const motors = data.map((motor) => ({ ...motor }));
  const stats = kriteriaList.map((item) => {
    if (!VALID_KEYS.has(item.key)) {
      throw new Error(`Key kriteria tidak valid: ${item.key}`);
    }
    if (!VALID_TYPES.has(item.type)) {
      throw new Error(`Type kriteria tidak valid: ${item.type}`);
    }

    let min = Infinity;
    let max = -Infinity;
    for (const motor of motors) {
      const value = motor[item.key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new Error(`Nilai ${item.key} pada motor ${motor.id} tidak valid`);
      }
      if (value < min) min = value;
      if (value > max) max = value;
    }

    const override = Object.prototype.hasOwnProperty.call(bobotOverride, item.key);
    const bobot = override ? bobotOverride[item.key] : item.bobot;
    if (typeof bobot !== 'number' || !Number.isFinite(bobot) || bobot < 0) {
      throw new Error(`Bobot kriteria ${item.key} tidak valid`);
    }

    return { key: item.key, type: item.type, bobot, min, max };
  });

  const normalized = motors.map((motor) => {
    const result = { ...motor };
    for (const stat of stats) {
      const value = motor[stat.key];
      const normalisasi = stat.type === 'cost'
        ? (value > 0 ? stat.min / value : (stat.min === 0 ? 1 : 0))
        : (stat.max > 0 ? value / stat.max : 0);

      result[`w_${stat.key}`] = stat.bobot;
      result[`r_${stat.key}`] = normalisasi;
    }
    return result;
  });

  return normalized
    .map((motor) => {
      let vi = 0;
      for (const stat of stats) {
        vi += motor[`w_${stat.key}`] * motor[`r_${stat.key}`];
      }
      if (!Number.isFinite(vi)) {
        throw new Error(`Nilai preferensi motor ${motor.id} tidak valid`);
      }
      return { ...motor, vi };
    })
    .sort((a, b) => b.vi - a.vi || a.id.localeCompare(b.id))
    .map((motor, index) => ({ ...motor, rank: index + 1 }));
}

module.exports = { hitungSAW };
