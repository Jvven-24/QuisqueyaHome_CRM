-- T-FIX-1018-G3. Ejecutar con psql mediante la configuración de conexión del
-- operador. No contiene credenciales ni modifica filas ajenas a la sonda.
-- BLOQUEADO: goals no dispone de borrado lógico. No se hace DELETE físico.
-- Es idempotente y falla cerrado hasta que D11 defina el borrado y sus lecturas.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.goals WHERE id = 1000234 AND broker_id IS NULL
      AND year = 2026 AND month = 10 AND target_deals = 0
      AND achieved_deals = 0 AND achieved_amount_cents = 0
      AND COALESCE(target_amount_cents, 0) = 0
  ) THEN
    RAISE NOTICE 'La sonda no existe o cambió: ninguna fila modificada.';
    RETURN;
  END IF;
  RAISE EXCEPTION 'Limpieza pendiente de D11: goals requiere borrado lógico, auditoría y filtros de lectura. Ninguna fila modificada.';
END $$;
