const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

function getCookies(response) {
  const values = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return values.map((value) => value.split(';')[0]).join('; ');
}

test('integrasi API, PostgreSQL, autentikasi, CSRF, dan CORS', { skip: !testDatabaseUrl }, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.TEST_DATABASE_URL = testDatabaseUrl;
  process.env.PORT = '0';
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = 'http://localhost:3001';
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('integration-password', 4);
  process.env.JWT_SECRET = 'integration-test-secret-that-is-long-enough';

  const { pool, closePool } = require('../../db/pool');
  const motorRepository = require('../../repositories/motorRepository');
  const kriteriaRepository = require('../../repositories/kriteriaRepository');
  const { start } = require('../../server');

  let server;
  let poolClosed = false;
  try {
    await pool.query('TRUNCATE TABLE criteria, motors');

    const motorA = await motorRepository.create({
      id: 'T-A',
      nama: 'Motor Test A',
      tipe: 'Matic',
      harga: 10000000,
      tangki: 5,
      cc: 125,
    });
    const motorB = await motorRepository.create({
      id: 'T-B',
      nama: 'Motor Test B',
      tipe: 'Sport',
      harga: 20000000,
      tangki: 6,
      cc: 150,
    });

    assert.equal(motorA.harga, 10000000);
    assert.equal((await motorRepository.findAll(['T-A']))[0].id, 'T-A');

    await assert.rejects(
      motorRepository.create({ ...motorA }),
      (error) => error.code === '23505',
    );

    const updated = await motorRepository.update('T-A', { harga: 11000000 });
    assert.equal(updated.harga, 11000000);

    const kriteria = [
      { id: 'T-C1', label: 'Harga', key: 'harga', type: 'cost', bobot: 5 },
      { id: 'T-C2', label: 'Tangki', key: 'tangki', type: 'benefit', bobot: 3 },
      { id: 'T-C3', label: 'CC', key: 'cc', type: 'benefit', bobot: 4 },
    ];
    for (const item of kriteria) {
      await kriteriaRepository.create(item);
    }

    await assert.rejects(
      kriteriaRepository.create({
        id: 'T-C4',
        label: 'Harga Salah',
        key: 'harga',
        type: 'benefit',
        bobot: 1,
      }),
      (error) => error.code === '23514',
    );

    server = await start();
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).db, 'connected');

    const unauthorizedMotor = await fetch(`${baseUrl}/api/motors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(motorB),
    });
    assert.equal(unauthorizedMotor.status, 401);

    const unauthorizedCriteria = await fetch(`${baseUrl}/api/kriteria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kriteria[0]),
    });
    assert.equal(unauthorizedCriteria.status, 401);

    const wrongLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
    });
    assert.equal(wrongLogin.status, 401);

    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'integration-password' }),
    });
    assert.equal(login.status, 200);
    const cookies = getCookies(login);
    const session = await login.json();
    assert.equal(session.role, 'admin');
    assert.ok(session.csrfToken);

    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie: cookies } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).username, 'admin');

    const missingCsrf = await fetch(`${baseUrl}/api/motors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookies },
      body: JSON.stringify(motorB),
    });
    assert.equal(missingCsrf.status, 403);

    const authHeaders = {
      'Content-Type': 'application/json',
      cookie: cookies,
      'x-csrf-token': session.csrfToken,
    };

    const duplicate = await fetch(`${baseUrl}/api/motors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(motorB),
    });
    assert.equal(duplicate.status, 409);

    const invalid = await fetch(`${baseUrl}/api/motors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ ...motorB, id: 'T-C', harga: -1 }),
    });
    assert.equal(invalid.status, 400);

    const created = await fetch(`${baseUrl}/api/motors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ ...motorB, id: 'T-C', nama: 'Motor Test C' }),
    });
    assert.equal(created.status, 201);

    const apiUpdated = await fetch(`${baseUrl}/api/motors/T-C`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ harga: 21000000 }),
    });
    assert.equal(apiUpdated.status, 200);
    assert.equal((await apiUpdated.json()).harga, 21000000);

    const calculation = await fetch(`${baseUrl}/api/motors/calculate/saw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['T-A', 'T-B'], bobot: { harga: 10 } }),
    });
    assert.equal(calculation.status, 200);
    const ranked = await calculation.json();
    assert.equal(ranked.length, 2);
    assert.ok(ranked.every((motor) => Number.isFinite(motor.vi)));
    assert.equal(ranked[0].id, 'T-A');

    const allowedCors = await fetch(`${baseUrl}/health`, {
      headers: { origin: 'http://localhost:3001' },
    });
    assert.equal(allowedCors.status, 200);
    assert.equal(allowedCors.headers.get('access-control-allow-origin'), 'http://localhost:3001');
    assert.equal(allowedCors.headers.get('access-control-allow-credentials'), 'true');

    const blockedCors = await fetch(`${baseUrl}/health`, {
      headers: { origin: 'http://evil.example' },
    });
    assert.equal(blockedCors.status, 403);

    const deleted = await fetch(`${baseUrl}/api/motors/T-C`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.equal(deleted.status, 200);

    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert.equal(logout.status, 200);
    const logoutCookies = logout.headers.getSetCookie
      ? logout.headers.getSetCookie().join('; ')
      : logout.headers.get('set-cookie') || '';
    assert.match(logoutCookies, /sawmoto_admin=/);
    assert.match(logoutCookies, /Max-Age=0|Expires=/);

    const afterLogout = await fetch(`${baseUrl}/api/motors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(motorB),
    });
    assert.equal(afterLogout.status, 401);

    await motorRepository.deleteById('T-A');
    await motorRepository.deleteById('T-B');
    for (const item of kriteria) {
      await kriteriaRepository.deleteById(item.id);
    }

    await closePool();
    poolClosed = true;
    const unhealthy = await fetch(`${baseUrl}/health`);
    assert.equal(unhealthy.status, 503);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (!poolClosed) await closePool();
  }
});
