/**
 * Adaptador de cliente para Moodle 4.5 LTS local (puerto 9330).
 *
 * Implementa PuertoAprendizaje hablando con los Web Services REST reales de Moodle:
 * - core_webservice_get_site_info
 * - core_course_get_categories
 * - core_course_get_courses / core_course_get_courses_by_field
 * - core_course_create_courses
 * - core_user_get_users_by_field / core_user_create_users
 * - enrol_manual_enrol_users / core_enrol_get_enrolled_users / core_enrol_get_users_courses
 * - core_completion_get_course_completion_status / core_completion_get_activities_completion_status
 * - gradereport_user_get_grade_items
 *
 * - Los secretos (MOODLE_TOKEN) nunca viajan al cliente.
 * - Si Moodle está apagado o no responde, responde con degradación elegante
 *   (sin 500 en la vista de Academy).
 */

import { randomBytes } from "node:crypto";
import type {
  CategoriaLms,
  CrearCursoLmsInput,
  CursoLms,
  EstadoLms,
  EvidenciaLms,
  ProgresoPersonaCursoLms,
  PuertoAprendizaje,
  UsuarioMoodleSyncInput,
} from "../../../application/aprendizaje/puertos.ts";
import { moodleConfig } from "../../env.ts";

function limpiarHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extraerNotaMinima(summaryHtml: string | undefined | null): number {
  if (!summaryHtml) return 80;
  const attr = summaryHtml.match(/data-nota-minima="(\d{1,3})"/i);
  if (attr?.[1]) {
    const val = Number(attr[1]);
    if (val >= 1 && val <= 100) return val;
  }
  const texto = summaryHtml.match(/nota\s+m[íi]nima[^0-9]{0,25}(\d{1,3})\s*%/i);
  if (texto?.[1]) {
    const val = Number(texto[1]);
    if (val >= 1 && val <= 100) return val;
  }
  return 80;
}

export class MoodleAdaptador implements PuertoAprendizaje {
  private readonly baseUrl: string;
  private readonly token: string | null;

  constructor(config?: { url?: string; token?: string | null }) {
    const cfg = config ?? moodleConfig();
    const url = cfg.url || "http://127.0.0.1:9330";
    this.baseUrl = url.replace(/\/+$/, "");
    this.token = cfg.token ?? null;
  }

  private async llamarWs<T = unknown>(
    wsfunction: string,
    params: Record<string, string | number | undefined | null> = {},
    timeoutMs = 5000,
  ): Promise<T> {
    if (!this.token) {
      throw new Error("MOODLE_TOKEN no configurado en el servidor.");
    }
    const body = new URLSearchParams({
      wstoken: this.token,
      wsfunction,
      moodlewsrestformat: "json",
    });
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        body.set(k, String(v));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const respuesta = await fetch(`${this.baseUrl}/webservice/rest/server.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    if (!respuesta.ok) {
      throw new Error(`Moodle HTTP ${respuesta.status} en ${wsfunction}`);
    }

    const data: unknown = await respuesta.json();
    if (data && typeof data === "object" && "exception" in data) {
      const err = data as { errorcode?: string; message?: string };
      const msg = `${err.errorcode ?? "error"} - ${err.message ?? ""}`;
      if (wsfunction === "enrol_manual_enrol_users" && msg.includes("Message was not sent")) {
        return null as T;
      }
      throw new Error(`Moodle WS (${wsfunction}): ${msg}`);
    }
    return data as T;
  }

  async comprobarSalud(): Promise<EstadoLms> {
    const urlCrearCurso = `${this.baseUrl}/course/edit.php?category=1`;
    const urlGestionCursos = `${this.baseUrl}/course/management.php`;
    try {
      if (this.token) {
        const info = await this.llamarWs<{
          sitename?: string;
          release?: string;
          version?: string;
        }>("core_webservice_get_site_info", {}, 3000);
        return {
          disponible: true,
          url: this.baseUrl,
          urlCrearCurso,
          urlGestionCursos,
          version: info.release ? `Moodle ${info.release}` : "4.5.15 LTS",
          mensaje: `LMS ${info.sitename || "Quisqueya Academy"} conectado por Web Services REST.`,
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const respuesta = await fetch(this.baseUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      }).finally(() => clearTimeout(timeout));

      if (respuesta.ok) {
        return {
          disponible: true,
          url: this.baseUrl,
          urlCrearCurso,
          urlGestionCursos,
          version: "4.5.15 LTS",
          mensaje: "LMS Quisqueya Academy accesible en servidor local.",
        };
      }

      return {
        disponible: false,
        url: this.baseUrl,
        urlCrearCurso,
        urlGestionCursos,
        version: "Desconocida",
        mensaje: `Moodle respondió con estado HTTP ${respuesta.status}`,
      };
    } catch {
      return {
        disponible: false,
        url: this.baseUrl,
        urlCrearCurso,
        urlGestionCursos,
        version: "Inaccesible",
        mensaje: "Instancia local de Moodle no disponible en 127.0.0.1:9330.",
      };
    }
  }

  async listarCategorias(): Promise<CategoriaLms[]> {
    try {
      if (!this.token) return [];
      const raw = await this.llamarWs<
        Array<{ id: number; name: string; idnumber?: string }>
      >("core_course_get_categories");
      if (!Array.isArray(raw)) return [];
      return raw.map((c) => ({
        id: Number(c.id),
        codigo: c.idnumber || `CAT-${c.id}`,
        nombre: c.name,
      }));
    } catch {
      return [];
    }
  }

  async listarCursos(): Promise<CursoLms[]> {
    try {
      if (!this.token) return [];
      const [cursosRaw, categorias] = await Promise.all([
        this.llamarWs<
          Array<{
            id: number;
            shortname: string;
            fullname: string;
            categoryid?: number;
            summary?: string;
            format?: string;
            visible?: number;
          }>
        >("core_course_get_courses"),
        this.listarCategorias(),
      ]);

      if (!Array.isArray(cursosRaw)) return [];
      const mapaCat = new Map<number, string>(
        categorias.map((c) => [c.id, c.nombre]),
      );

      // Excluir el curso raíz del sitio (id=1 o format='site') y el curso sintético viejo si existe QHA-IND-PC
      const tieneInduccionOficial = cursosRaw.some((c) => c.shortname === "QHA-IND-PC");

      return cursosRaw
        .filter((c) => c.id !== 1 && c.format !== "site")
        .filter(
          (c) =>
            !(
              tieneInduccionOficial &&
              (c.shortname === "QH-CONFOTUR-101" || c.shortname === "QH-IND-101")
            ),
        )
        .map((c) => ({
          id: Number(c.id),
          codigo: c.shortname,
          nombre: c.fullname,
          categoria: mapaCat.get(Number(c.categoryid)) || "Formación Comercial e Inmobiliaria",
          categoriaId: Number(c.categoryid ?? 1),
          notaMinima: extraerNotaMinima(c.summary),
          resumen: limpiarHtml(c.summary),
          urlLanzamiento: `${this.baseUrl}/course/view.php?id=${c.id}`,
          urlEdicion: `${this.baseUrl}/course/edit.php?id=${c.id}`,
        }));
    } catch {
      return [];
    }
  }

  async listarCursosUsuario(moodleUserId: number): Promise<CursoLms[]> {
    try {
      if (!this.token || !moodleUserId) return [];
      const [cursosUsuario, categorias] = await Promise.all([
        this.llamarWs<
          Array<{
            id: number;
            shortname: string;
            fullname: string;
            category?: number;
            summary?: string;
          }>
        >("core_enrol_get_users_courses", { userid: moodleUserId }),
        this.listarCategorias(),
      ]);
      if (!Array.isArray(cursosUsuario)) return [];
      const mapaCat = new Map<number, string>(
        categorias.map((c) => [c.id, c.nombre]),
      );
      const tieneInduccionOficial = cursosUsuario.some((c) => c.shortname === "QHA-IND-PC");
      return cursosUsuario
        .filter((c) => c.id !== 1)
        .filter(
          (c) =>
            !(
              tieneInduccionOficial &&
              (c.shortname === "QH-CONFOTUR-101" || c.shortname === "QH-IND-101")
            ),
        )
        .map((c) => ({
          id: Number(c.id),
          codigo: c.shortname,
          nombre: c.fullname,
          categoria: mapaCat.get(Number(c.category)) || "Formación Comercial e Inmobiliaria",
          categoriaId: Number(c.category ?? 1),
          notaMinima: extraerNotaMinima(c.summary),
          resumen: limpiarHtml(c.summary),
          urlLanzamiento: `${this.baseUrl}/course/view.php?id=${c.id}`,
          urlEdicion: `${this.baseUrl}/course/edit.php?id=${c.id}`,
        }));
    } catch {
      return [];
    }
  }

  async crearCurso(input: CrearCursoLmsInput): Promise<CursoLms> {
    const summaryHtml =
      `<p>${escaparHtml(input.resumen)}</p>` +
      `<p data-nota-minima="${input.notaMinima}"><strong>Nota mínima de aprobación:</strong> ${input.notaMinima} %</p>`;

    const creados = await this.llamarWs<Array<{ id: number; shortname: string }>>(
      "core_course_create_courses",
      {
        "courses[0][fullname]": input.nombre,
        "courses[0][shortname]": input.codigo,
        "courses[0][idnumber]": input.codigo,
        "courses[0][categoryid]": input.categoriaId ?? 1,
        "courses[0][summary]": summaryHtml,
        "courses[0][summaryformat]": 1,
        "courses[0][format]": "topics",
        "courses[0][numsections]": 4,
        "courses[0][visible]": 1,
        "courses[0][enablecompletion]": 1,
        "courses[0][showgrades]": 1,
      },
    );

    const creado = Array.isArray(creados) ? creados[0] : undefined;
    if (!creado?.id) {
      throw new Error("Moodle no devolvió el identificador del curso creado.");
    }

    const categorias = await this.listarCategorias();
    const cat = categorias.find((c) => c.id === (input.categoriaId ?? 1));

    return {
      id: Number(creado.id),
      codigo: creado.shortname || input.codigo,
      nombre: input.nombre,
      categoria: input.categoriaNombre || cat?.nombre || "Formación Comercial e Inmobiliaria",
      categoriaId: input.categoriaId ?? 1,
      notaMinima: input.notaMinima,
      resumen: input.resumen,
      urlLanzamiento: `${this.baseUrl}/course/view.php?id=${creado.id}`,
      urlEdicion: `${this.baseUrl}/course/edit.php?id=${creado.id}`,
    };
  }

  async asegurarUsuario(input: UsuarioMoodleSyncInput): Promise<{ moodleUserId: number }> {
    if (input.externalIdActual && Number.isFinite(Number(input.externalIdActual))) {
      const porId = await this.llamarWs<Array<{ id: number }>>(
        "core_user_get_users_by_field",
        {
          field: "id",
          "values[0]": Number(input.externalIdActual),
        },
      );
      if (Array.isArray(porId) && porId[0]?.id) {
        return { moodleUserId: Number(porId[0].id) };
      }
    }

    const porEmail = await this.llamarWs<Array<{ id: number }>>(
      "core_user_get_users_by_field",
      {
        field: "email",
        "values[0]": input.email,
      },
    );
    if (Array.isArray(porEmail) && porEmail[0]?.id) {
      return { moodleUserId: Number(porEmail[0].id) };
    }

    const usernameBase = input.email
      .split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9._-]/g, ".") || `crm.user.${input.localUserId}`;
    const username = `${usernameBase}.${input.localUserId}`;

    const porUsername = await this.llamarWs<Array<{ id: number }>>(
      "core_user_get_users_by_field",
      {
        field: "username",
        "values[0]": username,
      },
    );
    if (Array.isArray(porUsername) && porUsername[0]?.id) {
      return { moodleUserId: Number(porUsername[0].id) };
    }

    const partes = input.fullName.trim().split(/\s+/);
    const firstname = partes[0] || "Usuario";
    const lastname = partes.slice(1).join(" ") || "Quisqueya Home";
    const claveAleatoria = `${randomBytes(12).toString("base64url")}A1!`;

    const creados = await this.llamarWs<Array<{ id: number }>>(
      "core_user_create_users",
      {
        "users[0][username]": username,
        "users[0][password]": claveAleatoria,
        "users[0][firstname]": firstname,
        "users[0][lastname]": lastname,
        "users[0][email]": input.email,
        "users[0][auth]": "manual",
        "users[0][idnumber]": `CRM-USER-${input.localUserId}`,
        "users[0][lang]": "en",
      },
    );
    const creado = Array.isArray(creados) ? creados[0] : undefined;
    if (!creado?.id) {
      throw new Error(`No fue posible registrar en Moodle al usuario ${input.email}.`);
    }
    return { moodleUserId: Number(creado.id) };
  }

  async matricularUsuarios(
    cursoId: number,
    matriculas: Array<{ moodleUserId: number; rolCurso: "student" | "editingteacher" }>,
  ): Promise<{ matriculados: number }> {
    if (matriculas.length === 0) return { matriculados: 0 };
    const params: Record<string, string | number> = {};
    matriculas.forEach((m, idx) => {
      params[`enrolments[${idx}][roleid]`] = m.rolCurso === "editingteacher" ? 3 : 5;
      params[`enrolments[${idx}][userid]`] = m.moodleUserId;
      params[`enrolments[${idx}][courseid]`] = cursoId;
    });
    await this.llamarWs("enrol_manual_enrol_users", params);
    return { matriculados: matriculas.length };
  }

  private async resolverCursoMoodleId(cursoId: string | number): Promise<{
    id: number;
    codigo: string;
    notaMinima: number;
  } | null> {
    if (typeof cursoId === "number" && Number.isFinite(cursoId)) {
      const res = await this.llamarWs<{
        courses?: Array<{ id: number; shortname: string; summary?: string }>;
      }>("core_course_get_courses_by_field", {
        field: "id",
        value: cursoId,
      });
      const c = res?.courses?.[0];
      return c
        ? { id: Number(c.id), codigo: c.shortname, notaMinima: extraerNotaMinima(c.summary) }
        : { id: cursoId, codigo: String(cursoId), notaMinima: 80 };
    }
    const texto = String(cursoId).trim();
    if (/^\d+$/.test(texto)) {
      return this.resolverCursoMoodleId(Number(texto));
    }
    const res = await this.llamarWs<{
      courses?: Array<{ id: number; shortname: string; summary?: string }>;
    }>("core_course_get_courses_by_field", {
      field: "shortname",
      value: texto,
    });
    const c = res?.courses?.[0];
    if (!c) return null;
    return {
      id: Number(c.id),
      codigo: c.shortname,
      notaMinima: extraerNotaMinima(c.summary),
    };
  }

  async listarProgresoCurso(cursoId: number): Promise<ProgresoPersonaCursoLms[]> {
    try {
      if (!this.token) return [];
      const inscritos = await this.llamarWs<
        Array<{
          id: number;
          fullname: string;
          email?: string;
          lastcourseaccess?: number;
          roles?: Array<{ shortname?: string; name?: string }>;
        }>
      >("core_enrol_get_enrolled_users", { courseid: cursoId });

      if (!Array.isArray(inscritos)) return [];

      const resultado: ProgresoPersonaCursoLms[] = [];
      for (const u of inscritos) {
        const evidencia = await this.obtenerEvidencia(0, cursoId, Number(u.id));
        const rolPrincipal = u.roles?.[0]?.shortname || "student";
        resultado.push({
          moodleUserId: Number(u.id),
          email: u.email || "",
          nombreCompleto: u.fullname,
          rolCurso: rolPrincipal,
          progresoPorcentaje: evidencia?.progresoPorcentaje ?? 0,
          calificacion: evidencia?.calificacion ?? null,
          completado: evidencia?.completado ?? false,
          actividadesCompletadas: evidencia?.actividadesCompletadas ?? 0,
          actividadesTotales: evidencia?.actividadesTotales ?? 0,
          ultimoAcceso:
            u.lastcourseaccess && u.lastcourseaccess > 0
              ? new Date(u.lastcourseaccess * 1000).toISOString()
              : null,
        });
      }
      return resultado;
    } catch {
      return [];
    }
  }

  async obtenerEvidencia(
    usuarioId: number,
    cursoId: string | number,
    moodleUserId?: number,
  ): Promise<EvidenciaLms | null> {
    const salud = await this.comprobarSalud();
    if (!salud.disponible) return null;

    if (!this.token) {
      return {
        usuarioId,
        cursoId,
        completado: false,
        progresoPorcentaje: 0,
        sincronizadoEn: new Date(),
        origen: "moodle_local",
      };
    }

    try {
      const cursoInfo = await this.resolverCursoMoodleId(cursoId);
      if (!cursoInfo) return null;

      const targetMoodleUserId = moodleUserId ?? usuarioId;
      let actividadesCompletadas = 0;
      let actividadesTotales = 0;
      let completadoEnCurso = false;
      let calificacion: number | undefined = undefined;

      try {
        const actRes = await this.llamarWs<{
          statuses?: Array<{ state?: number; tracking?: number }>;
        }>("core_completion_get_activities_completion_status", {
          courseid: cursoInfo.id,
          userid: targetMoodleUserId,
        });
        const rastreables = (actRes?.statuses ?? []).filter((s) => (s.tracking ?? 1) > 0);
        actividadesTotales = rastreables.length;
        actividadesCompletadas = rastreables.filter(
          (s) => s.state === 1 || s.state === 2,
        ).length;
      } catch {
        // Si el usuario aún no tiene actividades rastreadas, mantiene 0.
      }

      try {
        const compRes = await this.llamarWs<{
          completionstatus?: { completed?: boolean };
        }>("core_completion_get_course_completion_status", {
          courseid: cursoInfo.id,
          userid: targetMoodleUserId,
        });
        completadoEnCurso = Boolean(compRes?.completionstatus?.completed);
      } catch {
        // Cursos recién creados sin criterios aún devuelven excepción nocriteriaset.
      }

      try {
        const gradesRes = await this.llamarWs<{
          usergrades?: Array<{
            gradeitems?: Array<{
              itemtype?: string;
              itemmodule?: string;
              graderaw?: number | null;
              grademax?: number;
            }>;
          }>;
        }>("gradereport_user_get_grade_items", {
          courseid: cursoInfo.id,
          userid: targetMoodleUserId,
        });
        const items = gradesRes?.usergrades?.[0]?.gradeitems ?? [];
        const quizItem =
          items.find((i) => i.itemmodule === "quiz" && typeof i.graderaw === "number") ??
          items.find((i) => i.itemtype === "course" && typeof i.graderaw === "number");
        if (quizItem && typeof quizItem.graderaw === "number") {
          const max = quizItem.grademax && quizItem.grademax > 0 ? quizItem.grademax : 100;
          calificacion = Math.round((quizItem.graderaw / max) * 100);
        }
      } catch {
        // Si aún no tiene intentos calificados, calificacion permanece undefined.
      }

      let progresoPorcentaje =
        actividadesTotales > 0
          ? Math.round((actividadesCompletadas / actividadesTotales) * 100)
          : 0;
      if (completadoEnCurso && progresoPorcentaje < 100) {
        progresoPorcentaje = 100;
      }

      const apruebaNota =
        calificacion !== undefined
          ? calificacion >= cursoInfo.notaMinima
          : completadoEnCurso;
      const completado =
        completadoEnCurso ||
        (actividadesTotales > 0 &&
          actividadesCompletadas === actividadesTotales &&
          apruebaNota);

      return {
        usuarioId,
        moodleUserId: targetMoodleUserId,
        cursoId: cursoInfo.id,
        cursoCodigo: cursoInfo.codigo,
        completado,
        calificacion,
        notaMinima: cursoInfo.notaMinima,
        progresoPorcentaje,
        actividadesCompletadas,
        actividadesTotales,
        sincronizadoEn: new Date(),
        origen: "moodle_local",
      };
    } catch {
      return null;
    }
  }
}
