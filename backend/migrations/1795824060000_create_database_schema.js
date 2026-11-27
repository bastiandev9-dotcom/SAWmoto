exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE motors (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      tipe TEXT NOT NULL,
      harga BIGINT NOT NULL,
      tangki DOUBLE PRECISION NOT NULL,
      cc INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT motors_id_not_blank CHECK (char_length(btrim(id)) > 0),
      CONSTRAINT motors_nama_not_blank CHECK (char_length(btrim(nama)) > 0),
      CONSTRAINT motors_tipe_valid CHECK (tipe IN ('Matic', 'Moped', 'Sport')),
      CONSTRAINT motors_harga_nonnegative CHECK (harga >= 0),
      CONSTRAINT motors_harga_js_safe CHECK (harga <= 9007199254740991),
      CONSTRAINT motors_tangki_valid CHECK (tangki >= 0 AND tangki < 'Infinity'::double precision),
      CONSTRAINT motors_cc_nonnegative CHECK (cc >= 0)
    )
  `);

  pgm.sql(`
    CREATE TABLE criteria (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      bobot DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT criteria_id_not_blank CHECK (char_length(btrim(id)) > 0),
      CONSTRAINT criteria_label_not_blank CHECK (char_length(btrim(label)) > 0),
      CONSTRAINT criteria_key_valid CHECK (key IN ('harga', 'tangki', 'cc')),
      CONSTRAINT criteria_type_valid CHECK (type IN ('benefit', 'cost')),
      CONSTRAINT criteria_key_type_valid CHECK (
        (key = 'harga' AND type = 'cost')
        OR (key IN ('tangki', 'cc') AND type = 'benefit')
      ),
      CONSTRAINT criteria_bobot_valid CHECK (bobot >= 0 AND bobot < 'Infinity'::double precision)
    )
  `);

  pgm.sql(`
    CREATE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  pgm.sql(`
    CREATE TRIGGER motors_set_updated_at
    BEFORE UPDATE ON motors
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at()
  `);

  pgm.sql(`
    CREATE TRIGGER criteria_set_updated_at
    BEFORE UPDATE ON criteria
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at()
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS criteria');
  pgm.sql('DROP TABLE IF EXISTS motors');
  pgm.sql('DROP FUNCTION IF EXISTS set_updated_at()');
};
