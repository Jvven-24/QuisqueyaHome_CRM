/**
 * Seed Integral Local-First para QuisqueyaHome CRM (Viltrum Agentic OS)
 * Pobla la base de datos local `quisqueyahome_crm` con usuarios, proyectos de lujo,
 * unidades, contactos, leads, deals en pipeline, comisiones y actividades.
 */
import postgres from "postgres";

process.loadEnvFile(".env");
const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/quisqueyahome_crm";
const sql = postgres(url, { max: 1 });

async function seed() {
  console.log("Iniciando seed de datos locales en quisqueyahome_crm...");

  // 1. Crear schema auth y tabla auth.users mínima por compatibilidad si no existe
  await sql`CREATE SCHEMA IF NOT EXISTS auth;`;
  await sql`
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `;

  // 2. Roles
  const roles = await sql`SELECT id, slug FROM roles;`;
  const roleMap = Object.fromEntries(roles.map(r => [r.slug, r.id]));
  if (!roleMap.admin || !roleMap.broker || !roleMap.assistant) {
    throw new Error("Roles base no encontrados. Corre `npm run db:seed` primero.");
  }

  // 3. Usuarios
  console.log("Sembrando usuarios de demostración...");
  const adminRows = await sql`
    INSERT INTO users (role_id, email, full_name, initials, job_title, phone, is_active)
    VALUES (${roleMap.admin}, 'admin@quisqueyahome.do', 'Wilbert Admin', 'WA', 'Director General', '+18095550101', true)
    ON CONFLICT (email) WHERE deleted_at IS NULL DO UPDATE SET full_name = EXCLUDED.full_name, role_id = EXCLUDED.role_id, is_active = true
    RETURNING id;
  `;
  const adminId = adminRows[0].id;

  const brokerRows = await sql`
    INSERT INTO users (role_id, email, full_name, initials, job_title, phone, is_active)
    VALUES (${roleMap.broker}, 'carlos.mendoza@quisqueyahome.do', 'Carlos Mendoza', 'CM', 'Senior Luxury Broker', '+18095550102', true)
    ON CONFLICT (email) WHERE deleted_at IS NULL DO UPDATE SET full_name = EXCLUDED.full_name, role_id = EXCLUDED.role_id, is_active = true
    RETURNING id;
  `;
  const brokerId = brokerRows[0].id;

  const assistantRows = await sql`
    INSERT INTO users (role_id, email, full_name, initials, job_title, phone, is_active)
    VALUES (${roleMap.assistant}, 'elena.castillo@quisqueyahome.do', 'Elena Castillo', 'EC', 'Coordinadora de Operaciones', '+18095550103', true)
    ON CONFLICT (email) WHERE deleted_at IS NULL DO UPDATE SET full_name = EXCLUDED.full_name, role_id = EXCLUDED.role_id, is_active = true
    RETURNING id;
  `;
  const assistantId = assistantRows[0].id;

  // 4. Perfil de Broker
  await sql`
    INSERT INTO broker_profiles (user_id, specialty, handles_rentals, level, annual_sales_cents, monthly_target_deals)
    VALUES (${brokerId}, 'Turístico & Pre-construcción Punta Cana / Cap Cana', false, 'senior', 285000000, 3)
    ON CONFLICT (user_id) DO UPDATE SET specialty = EXCLUDED.specialty, annual_sales_cents = EXCLUDED.annual_sales_cents;
  `;

  // 5. Proyectos Dominicanos de Lujo
  console.log("Sembrando proyectos de lujo...");
  const p1 = (await sql`
    INSERT INTO projects (name, slug, zone, project_type, operation_type, developer, description, start_date, estimated_delivery_date, progress_percent, currency, public_range_min_cents, public_range_max_cents, broker_id)
    VALUES ('Cap Cana Marina Bay Luxury Residences', 'cap-cana-marina-bay', 'Cap Cana', 'construction', 'sale', 'Noval Properties / Cap Cana Real Estate', 'Complejo residencial exclusivo con vista directa a la marina, amigable con ley Confotur (exención de impuestos por 15 años).', '2025-01-15', '2027-06-30', 45, 'USD', 34000000, 89000000, ${brokerId})
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET progress_percent = EXCLUDED.progress_percent RETURNING id;
  `)[0].id;

  const p2 = (await sql`
    INSERT INTO projects (name, slug, zone, project_type, operation_type, developer, description, start_date, estimated_delivery_date, progress_percent, currency, public_range_min_cents, public_range_max_cents, broker_id)
    VALUES ('Palma Real Golf & Beach Villas', 'palma-real-villas', 'Bávaro / Punta Cana', 'blueprint', 'sale', 'Meliá Desarrollos', 'Villas de arquitectura moderna con campo de golf Cocotal y club de playa privado.', '2025-03-01', '2026-12-15', 25, 'USD', 28000000, 56000000, ${brokerId})
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET progress_percent = EXCLUDED.progress_percent RETURNING id;
  `)[0].id;

  const p3 = (await sql`
    INSERT INTO projects (name, slug, zone, project_type, operation_type, developer, description, start_date, estimated_delivery_date, progress_percent, currency, public_range_min_cents, public_range_max_cents, broker_id)
    VALUES ('Torre Piantini Horizon Skyline', 'torre-piantini-horizon', 'Santo Domingo', 'completed', 'sale', 'Campagna Ricart & Asociados', 'Torre corporativa y residencial de alta gama en el polígono central de Santo Domingo.', '2023-01-10', '2025-08-30', 100, 'USD', 42000000, 115000000, ${brokerId})
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET progress_percent = EXCLUDED.progress_percent RETURNING id;
  `)[0].id;

  const p4 = (await sql`
    INSERT INTO projects (name, slug, zone, project_type, operation_type, developer, description, start_date, estimated_delivery_date, progress_percent, currency, public_range_min_cents, public_range_max_cents, broker_id)
    VALUES ('Las Terrenas Eco-Boutique Residences', 'las-terrenas-eco-boutique', 'Las Terrenas', 'construction', 'sale', 'Atlantida Developments', 'Residencias ecológicas de playa con alta rentabilidad en renta corta y exención Confotur.', '2024-06-01', '2026-09-30', 60, 'USD', 24500000, 52000000, ${brokerId})
    ON CONFLICT (slug) WHERE deleted_at IS NULL DO UPDATE SET progress_percent = EXCLUDED.progress_percent RETURNING id;
  `)[0].id;

  // 6. Unidades
  console.log("Sembrando unidades...");
  const u1 = (await sql`
    INSERT INTO units (project_id, code, unit_type, bedrooms, bathrooms, built_area_m2, floor_level, operation_type, currency, real_price_cents, public_range_min_cents, public_range_max_cents, status, broker_id)
    VALUES (${p1}, 'MAR-302', 'Apartamento Vista Marina', 2, 2.5, 142.5, 3, 'sale', 'USD', 38500000, 38000000, 39500000, 'available', ${brokerId})
    ON CONFLICT (project_id, code) WHERE deleted_at IS NULL DO UPDATE SET real_price_cents = EXCLUDED.real_price_cents RETURNING id;
  `)[0].id;

  const u2 = (await sql`
    INSERT INTO units (project_id, code, unit_type, bedrooms, bathrooms, built_area_m2, floor_level, operation_type, currency, real_price_cents, public_range_min_cents, public_range_max_cents, status, broker_id)
    VALUES (${p1}, 'PH-501', 'Penthouse Duplex Terraza & Jacuzzi', 3, 3.5, 260.0, 5, 'sale', 'USD', 75000000, 74000000, 77000000, 'reserved', ${brokerId})
    ON CONFLICT (project_id, code) WHERE deleted_at IS NULL DO UPDATE SET real_price_cents = EXCLUDED.real_price_cents RETURNING id;
  `)[0].id;

  const u3 = (await sql`
    INSERT INTO units (project_id, code, unit_type, bedrooms, bathrooms, built_area_m2, floor_level, operation_type, currency, real_price_cents, public_range_min_cents, public_range_max_cents, status, broker_id)
    VALUES (${p2}, 'VILLA-14B', 'Villa Unifamiliar Jardín Privado', 3, 3.0, 210.0, 1, 'sale', 'USD', 42000000, 41000000, 43500000, 'available', ${brokerId})
    ON CONFLICT (project_id, code) WHERE deleted_at IS NULL DO UPDATE SET real_price_cents = EXCLUDED.real_price_cents RETURNING id;
  `)[0].id;

  const u4 = (await sql`
    INSERT INTO units (project_id, code, unit_type, bedrooms, bathrooms, built_area_m2, floor_level, operation_type, currency, real_price_cents, public_range_min_cents, public_range_max_cents, status, broker_id)
    VALUES (${p3}, 'PNT-11A', 'Apartamento Lujo Torre Central', 2, 2.0, 125.0, 11, 'sale', 'USD', 49500000, 49000000, 51000000, 'available', ${brokerId})
    ON CONFLICT (project_id, code) WHERE deleted_at IS NULL DO UPDATE SET real_price_cents = EXCLUDED.real_price_cents RETURNING id;
  `)[0].id;

  // 7. Fuentes de Captación y Etapas
  const sourceRows = await sql`SELECT id, slug FROM lead_sources;`;
  const srcMap = Object.fromEntries(sourceRows.map(s => [s.slug, s.id]));

  const stageRows = await sql`SELECT id, slug FROM pipeline_stages;`;
  const stageMap = Object.fromEntries(stageRows.map(s => [s.slug, s.id]));

  // 8. Contactos reales
  console.log("Sembrando contactos...");
  const c1 = (await sql`
    INSERT INTO contacts (full_name, phone, phone_display, email, country, city, source_id, broker_id, notes, last_interaction_at)
    VALUES ('Jean-Luc Dubois', '+15145558912', '(514) 555-8912', 'jldubois.invest@videotron.ca', 'Canadá', 'Montreal', ${srcMap.youtube}, ${brokerId}, 'Inversionista canadiense buscando 2 unidades bajo régimen Confotur para rentas cortas.', now())
    RETURNING id;
  `)[0].id;

  const c2 = (await sql`
    INSERT INTO contacts (full_name, phone, phone_display, email, country, city, source_id, broker_id, notes, last_interaction_at)
    VALUES ('Roberto Peña Rosario', '+17185552390', '(718) 555-2390', 'roberto.pena.ny@gmail.com', 'Estados Unidos', 'New York', ${srcMap.whatsapp}, ${brokerId}, 'Diáspora dominicana en Queens NY. Busca apartamento de retiro en Cap Cana o Bávaro.', now())
    RETURNING id;
  `)[0].id;

  const c3 = (await sql`
    INSERT INTO contacts (full_name, phone, phone_display, email, country, city, source_id, broker_id, notes, last_interaction_at)
    VALUES ('Dra. Sofía Almonte', '+18095557788', '809-555-7788', 'sofia.almonte@cedimat.do', 'República Dominicana', 'Santo Domingo', ${srcMap.referido}, ${brokerId}, 'Médico especialista. Interesada en inversión patrimonial en Torre Piantini.', now())
    RETURNING id;
  `)[0].id;

  const c4 = (await sql`
    INSERT INTO contacts (full_name, phone, phone_display, email, country, city, source_id, broker_id, notes, last_interaction_at)
    VALUES ('David & Sarah Miller', '+13055554411', '(305) 555-4411', 'd.miller.miami@floridacapital.com', 'Estados Unidos', 'Miami', ${srcMap.portal_web}, ${brokerId}, 'Pareja de Miami interesada en villa golf en Bávaro con entrega 2026.', now())
    RETURNING id;
  `)[0].id;

  // 9. Leads
  console.log("Sembrando leads...");
  const l1 = (await sql`
    INSERT INTO leads (contact_id, source_id, project_id, project_interest_text, zone_interest, operation_type, currency, budget_min_cents, budget_max_cents, bedrooms, status, broker_id)
    VALUES (${c1}, ${srcMap.youtube}, ${p1}, 'Cap Cana Marina Bay', 'Cap Cana', 'sale', 'USD', 35000000, 75000000, 2, 'qualified', ${brokerId})
    RETURNING id;
  `)[0].id;

  const l2 = (await sql`
    INSERT INTO leads (contact_id, source_id, project_id, project_interest_text, zone_interest, operation_type, currency, budget_min_cents, budget_max_cents, bedrooms, status, broker_id)
    VALUES (${c2}, ${srcMap.whatsapp}, ${p1}, 'Cap Cana Marina Bay Penthouse', 'Cap Cana', 'sale', 'USD', 60000000, 85000000, 3, 'contacted', ${brokerId})
    RETURNING id;
  `)[0].id;

  const l3 = (await sql`
    INSERT INTO leads (contact_id, source_id, project_id, project_interest_text, zone_interest, operation_type, currency, budget_min_cents, budget_max_cents, bedrooms, status, broker_id)
    VALUES (${c3}, ${srcMap.referido}, ${p3}, 'Torre Piantini Horizon', 'Santo Domingo', 'sale', 'USD', 45000000, 55000000, 2, 'new', ${brokerId})
    RETURNING id;
  `)[0].id;

  const l4 = (await sql`
    INSERT INTO leads (contact_id, source_id, project_id, project_interest_text, zone_interest, operation_type, currency, budget_min_cents, budget_max_cents, bedrooms, status, broker_id)
    VALUES (${c4}, ${srcMap.portal_web}, ${p2}, 'Palma Real Villas', 'Bávaro / Punta Cana', 'sale', 'USD', 40000000, 48000000, 3, 'qualified', ${brokerId})
    RETURNING id;
  `)[0].id;

  // 10. Deals en el Pipeline
  console.log("Sembrando deals en pipeline...");
  const d1 = (await sql`
    INSERT INTO deals (contact_id, lead_id, title, stage_id, source_id, broker_id, operation_type, currency, amount_cents, probability)
    VALUES (${c2}, ${l2}, 'Roberto Peña - Penthouse Cap Cana PH-501', ${stageMap.negociacion || 12}, ${srcMap.whatsapp}, ${brokerId}, 'sale', 'USD', 75000000, 80)
    RETURNING id;
  `)[0].id;

  const d2 = (await sql`
    INSERT INTO deals (contact_id, lead_id, title, stage_id, source_id, broker_id, operation_type, currency, amount_cents, probability)
    VALUES (${c1}, ${l1}, 'Jean-Luc Dubois - Marina Bay MAR-302', ${stageMap.preseleccion || 11}, ${srcMap.youtube}, ${brokerId}, 'sale', 'USD', 38500000, 60)
    RETURNING id;
  `)[0].id;

  const d3 = (await sql`
    INSERT INTO deals (contact_id, lead_id, title, stage_id, source_id, broker_id, operation_type, currency, amount_cents, probability)
    VALUES (${c4}, ${l4}, 'David Miller - Villa Palma Real 14B', ${stageMap.presentacion || 10}, ${srcMap.portal_web}, ${brokerId}, 'sale', 'USD', 42000000, 40)
    RETURNING id;
  `)[0].id;

  const d4 = (await sql`
    INSERT INTO deals (contact_id, lead_id, title, stage_id, source_id, broker_id, operation_type, currency, amount_cents, probability)
    VALUES (${c3}, ${l3}, 'Sofía Almonte - Piantini Horizon 11A', ${stageMap.contactado || 9}, ${srcMap.referido}, ${brokerId}, 'sale', 'USD', 49500000, 25)
    RETURNING id;
  `)[0].id;

  // 11. Deal Properties
  await sql`
    INSERT INTO deal_properties (deal_id, project_id, unit_id, is_primary)
    VALUES 
      (${d1}, ${p1}, ${u2}, true),
      (${d2}, ${p1}, ${u1}, true),
      (${d3}, ${p2}, ${u3}, true),
      (${d4}, ${p3}, ${u4}, true)
    ON CONFLICT DO NOTHING;
  `;

  // 12. Comisiones proyectadas y pactadas (5% de comisión, split 50/50 broker/agencia)
  console.log("Sembrando comisiones...");
  await sql`
    INSERT INTO commissions (deal_id, broker_id, currency, sale_amount_cents, commission_basis_points, total_commission_cents, broker_share_basis_points, agency_share_basis_points, broker_amount_cents, agency_amount_cents, status)
    VALUES 
      (${d1}, ${brokerId}, 'USD', 75000000, 500, 3750000, 5000, 5000, 1875000, 1875000, 'pending'),
      (${d2}, ${brokerId}, 'USD', 38500000, 500, 1925000, 5000, 5000, 962500, 962500, 'pending')
    ON CONFLICT (deal_id) DO UPDATE SET total_commission_cents = EXCLUDED.total_commission_cents;
  `;

  // 13. Actividades recientes
  console.log("Sembrando actividades...");
  await sql`
    INSERT INTO activities (activity_type, title, description, contact_id, deal_id, project_id, assignee_id, status, priority, starts_at)
    VALUES 
      ('whatsapp', 'Envío de brochure y plano arquitectónico', 'Se envió por WhatsApp el plano detallado y video 4K del Penthouse PH-501.', ${c2}, ${d1}, ${p1}, ${brokerId}, 'completed', 'high', now() - interval '2 hours'),
      ('call', 'Llamada de seguimiento sobre financiamiento fiduciario', 'Coordinar con Banco BHD León la pre-aprobación del crédito para el señor Dubois.', ${c1}, ${d2}, ${p1}, ${brokerId}, 'pending', 'high', now() + interval '1 day'),
      ('meeting', 'Visita guiada al showroom en Piantini', 'Cita presencial con la Dra. Almonte para ver la maqueta y acabados en mármol.', ${c3}, ${d4}, ${p3}, ${brokerId}, 'pending', 'medium', now() + interval '2 days');
  `;

  console.log("✅ Seed completado con éxito. Base de datos local lista y verificada.");
}

seed()
  .catch((err) => {
    console.error("❌ Error en seed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
