-- PoC b1g exclusivamente en m40_poc_*; no es una migración del producto.
-- PORT de https://github.com/pgr0ss/pgledger
-- Commit 164eee9d542d3ce0f305466d6f21575157c597c6, pgledger.sql:
-- 42-82: cuentas/transferencias/entradas; 124-154: creación y límites de saldo;
-- 193-306: locks ordenados, saldos/versiones y par de entradas compensadas.
-- MIT, Copyright (c) 2025 Paul Gross. Texto íntegro en LICENSE.pgledger.
-- Adaptaciones: IDs internos/publicos, RLS, USD/DOP, escala, idempotencia,
-- origen, reversos parciales, permisos, triggers append-only y balance diferido.
-- Se excluyen UUIDv7/ULID y helpers vendorizados (upstream 1-40), vistas y batches.
-- Instalar como propietario NOLOGIN/NOSUPERUSER/NOBYPASSRLS, nunca como app.
DO $$ BEGIN
  IF current_database() !~ '^m40_poc_[a-f0-9]{16}$' THEN
    RAISE EXCEPTION 'Destino PoC rechazado';
  END IF;
END $$;
CREATE SCHEMA ledger_poc;
REVOKE ALL ON SCHEMA ledger_poc FROM PUBLIC;
CREATE DOMAIN ledger_poc.moneda AS text CHECK (VALUE IN ('USD','DOP'));
-- NUMERIC sin typmod: la escala se comprueba ANTES de un redondeo implícito.
CREATE DOMAIN ledger_poc.importe AS numeric
  CHECK (VALUE > '-Infinity'::numeric AND VALUE < 'Infinity'::numeric
    AND VALUE = trunc(VALUE,2));

CREATE TABLE ledger_poc.cuentas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  propietario name NOT NULL DEFAULT session_user,
  nombre text NOT NULL CHECK (length(nombre) BETWEEN 1 AND 100),
  moneda ledger_poc.moneda NOT NULL,
  saldo ledger_poc.importe NOT NULL DEFAULT 0,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  permite_negativo boolean NOT NULL DEFAULT false,
  creado timestamptz NOT NULL DEFAULT now(),
  actualizado timestamptz NOT NULL DEFAULT now(),
  UNIQUE (propietario,nombre,moneda),
  UNIQUE (propietario,id,moneda),
  CHECK (permite_negativo OR saldo >= 0)
);
CREATE TABLE ledger_poc.movimientos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  propietario name NOT NULL DEFAULT session_user,
  clave uuid NOT NULL,
  origen uuid NOT NULL,
  desde bigint NOT NULL,
  hasta bigint NOT NULL,
  moneda ledger_poc.moneda NOT NULL,
  importe ledger_poc.importe NOT NULL
    CHECK (importe > 0 AND importe <= 92233720368547758.07),
  compensa bigint,
  creado timestamptz NOT NULL DEFAULT now(),
  UNIQUE (propietario,clave),
  UNIQUE (propietario,origen),
  UNIQUE (propietario,id,moneda),
  FOREIGN KEY (propietario,desde,moneda)
    REFERENCES ledger_poc.cuentas(propietario,id,moneda) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (propietario,hasta,moneda)
    REFERENCES ledger_poc.cuentas(propietario,id,moneda) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (propietario,compensa,moneda)
    REFERENCES ledger_poc.movimientos(propietario,id,moneda) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CHECK (desde <> hasta AND compensa IS DISTINCT FROM id)
);
CREATE TABLE ledger_poc.entradas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  propietario name NOT NULL DEFAULT session_user,
  cuenta_id bigint NOT NULL,
  movimiento_id bigint NOT NULL,
  moneda ledger_poc.moneda NOT NULL,
  importe ledger_poc.importe NOT NULL CHECK (importe <> 0),
  saldo_anterior ledger_poc.importe NOT NULL,
  saldo_actual ledger_poc.importe NOT NULL,
  version_cuenta bigint NOT NULL CHECK (version_cuenta > 0),
  creado timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cuenta_id,version_cuenta),
  UNIQUE (movimiento_id,cuenta_id),
  FOREIGN KEY (propietario,cuenta_id,moneda)
    REFERENCES ledger_poc.cuentas(propietario,id,moneda) ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY (propietario,movimiento_id,moneda)
    REFERENCES ledger_poc.movimientos(propietario,id,moneda) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CHECK (saldo_actual = saldo_anterior + importe)
);
ALTER TABLE ledger_poc.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_poc.cuentas FORCE ROW LEVEL SECURITY;
ALTER TABLE ledger_poc.movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_poc.movimientos FORCE ROW LEVEL SECURITY;
ALTER TABLE ledger_poc.entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_poc.entradas FORCE ROW LEVEL SECURITY;
-- Identidad del arnés mediante SESSION AUTHORIZATION: no es un tenant del CRM.
-- session_user no puede ser falsificado por una conexión ordinaria.
CREATE POLICY identidad ON ledger_poc.cuentas
  USING (propietario = session_user) WITH CHECK (propietario = session_user);
CREATE POLICY identidad ON ledger_poc.movimientos
  USING (propietario = session_user) WITH CHECK (propietario = session_user);
CREATE POLICY identidad ON ledger_poc.entradas
  USING (propietario = session_user) WITH CHECK (propietario = session_user);

CREATE FUNCTION ledger_poc.inmutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog,ledger_poc AS $$
BEGIN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Hecho contable inmutable'; END $$;
CREATE TRIGGER inmutable BEFORE UPDATE OR DELETE ON ledger_poc.entradas
  FOR EACH STATEMENT EXECUTE FUNCTION ledger_poc.inmutable();
CREATE TRIGGER no_truncate BEFORE TRUNCATE ON ledger_poc.entradas
  FOR EACH STATEMENT EXECUTE FUNCTION ledger_poc.inmutable();
CREATE TRIGGER inmutable BEFORE UPDATE OR DELETE ON ledger_poc.movimientos
  FOR EACH STATEMENT EXECUTE FUNCTION ledger_poc.inmutable();
CREATE TRIGGER no_truncate BEFORE TRUNCATE ON ledger_poc.movimientos
  FOR EACH STATEMENT EXECUTE FUNCTION ledger_poc.inmutable();

CREATE FUNCTION ledger_poc.comprobar_balance() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog,ledger_poc AS $$
DECLARE m ledger_poc.movimientos; n bigint; neto numeric; correctas bigint;
BEGIN
  IF TG_TABLE_NAME='movimientos' THEN m:=NEW;
  ELSE SELECT * INTO STRICT m FROM ledger_poc.movimientos WHERE id=NEW.movimiento_id;
  END IF;
  SELECT count(*), coalesce(sum(importe),0),
    count(*) FILTER (WHERE (cuenta_id=m.desde AND importe=-m.importe)
      OR (cuenta_id=m.hasta AND importe=m.importe))
    INTO n,neto,correctas FROM ledger_poc.entradas WHERE movimiento_id=m.id;
  IF n<>2 OR neto<>0 OR correctas<>2 THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Movimiento desbalanceado';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER balance_movimiento AFTER INSERT ON ledger_poc.movimientos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_poc.comprobar_balance();
CREATE CONSTRAINT TRIGGER balance_entrada AFTER INSERT ON ledger_poc.entradas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_poc.comprobar_balance();

CREATE FUNCTION ledger_poc.crear_cuenta(p_nombre text,p_moneda text,p_negativo boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog,ledger_poc AS $$
DECLARE resultado uuid;
BEGIN
  INSERT INTO ledger_poc.cuentas(nombre,moneda,permite_negativo)
    VALUES(p_nombre,p_moneda,p_negativo) RETURNING public_id INTO resultado;
  RETURN resultado;
END $$;

CREATE FUNCTION ledger_poc.registrar(p_clave uuid,p_origen uuid,p_desde uuid,p_hasta uuid,
  p_moneda text,p_importe numeric,p_compensa uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog,ledger_poc AS $$
DECLARE
  a ledger_poc.cuentas; b ledger_poc.cuentas;
  anterior ledger_poc.movimientos; original ledger_poc.movimientos;
  nuevo ledger_poc.movimientos; compensado numeric; c_id bigint;
BEGIN
  IF p_clave IS NULL OR p_origen IS NULL OR p_desde IS NULL OR p_hasta IS NULL
    OR p_desde=p_hasta OR p_moneda IS NULL OR p_moneda NOT IN ('USD','DOP')
    OR p_importe IS NULL OR NOT (p_importe>0 AND p_importe<=92233720368547758.07)
    OR p_importe<>trunc(p_importe,2) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Movimiento inválido';
  END IF;
  -- Serializa incluso la primera inserción: no se continúa tras UNIQUE fallido.
  PERFORM pg_advisory_xact_lock(hashtextextended(session_user::text||p_clave::text,0));
  SELECT * INTO a FROM ledger_poc.cuentas WHERE public_id=p_desde;
  SELECT * INTO b FROM ledger_poc.cuentas WHERE public_id=p_hasta;
  IF a.id IS NULL OR b.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Cuentas no accesibles';
  END IF;
  IF a.moneda<>p_moneda OR b.moneda<>p_moneda THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Monedas incompatibles';
  END IF;
  IF p_compensa IS NOT NULL THEN
    SELECT * INTO original FROM ledger_poc.movimientos WHERE public_id=p_compensa FOR UPDATE;
    IF original.id IS NULL OR original.compensa IS NOT NULL OR original.desde<>b.id
      OR original.hasta<>a.id OR original.moneda<>p_moneda THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Compensación inválida';
    END IF;
    c_id:=original.id;
  END IF;
  SELECT * INTO anterior FROM ledger_poc.movimientos WHERE clave=p_clave;
  IF FOUND THEN
    IF anterior.origen IS DISTINCT FROM p_origen OR anterior.desde<>a.id OR anterior.hasta<>b.id
      OR anterior.moneda<>p_moneda OR anterior.importe<>p_importe
      OR anterior.compensa IS DISTINCT FROM c_id THEN
      RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='Clave idempotente con otro contenido';
    END IF;
    RETURN anterior.public_id;
  END IF;
  IF c_id IS NOT NULL THEN
    SELECT coalesce(sum(importe),0) INTO compensado FROM ledger_poc.movimientos WHERE compensa=c_id;
    IF compensado+p_importe>original.importe THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Compensación excedida';
    END IF;
  END IF;
  -- Derivado de upstream 214-230. Orden estable para ambos sentidos.
  PERFORM id FROM ledger_poc.cuentas WHERE id IN (a.id,b.id) ORDER BY id FOR UPDATE;
  -- Derivado de upstream 249-276; CHECK preserva el límite de saldo.
  UPDATE ledger_poc.cuentas SET saldo=saldo-p_importe,version=version+1,actualizado=now()
    WHERE id=a.id RETURNING * INTO a;
  UPDATE ledger_poc.cuentas SET saldo=saldo+p_importe,version=version+1,actualizado=now()
    WHERE id=b.id RETURNING * INTO b;
  INSERT INTO ledger_poc.movimientos(clave,origen,desde,hasta,moneda,importe,compensa)
    VALUES(p_clave,p_origen,a.id,b.id,p_moneda,p_importe,c_id) RETURNING * INTO nuevo;
  -- Derivado de upstream 283-296: una entrada negativa y otra positiva.
  INSERT INTO ledger_poc.entradas(cuenta_id,movimiento_id,moneda,importe,
    saldo_anterior,saldo_actual,version_cuenta) VALUES
    (a.id,nuevo.id,p_moneda,-p_importe,a.saldo+p_importe,a.saldo,a.version),
    (b.id,nuevo.id,p_moneda,p_importe,b.saldo-p_importe,b.saldo,b.version);
  RETURN nuevo.public_id;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA ledger_poc FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ledger_poc FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ledger_poc FROM PUBLIC;
