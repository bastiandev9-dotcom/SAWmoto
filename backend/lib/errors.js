const { ValidationError } = require('./validation');

function sendDatabaseError(res, error, duplicateMessage = 'Data sudah ada') {
  if (error instanceof ValidationError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.code === '23505') {
    return res.status(409).json({ message: duplicateMessage });
  }
  if (['23514', '22P02', '22003'].includes(error.code)) {
    return res.status(400).json({ message: 'Data tidak memenuhi constraint database' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}

module.exports = { sendDatabaseError };
