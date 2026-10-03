import test from "node:test";
import assert from "node:assert/strict";
import {
  renderizarPlantilla,
  extraerVariablesDePlantilla,
  generarEnlaceTelegram,
  generarEnlaceWhatsApp,
  validarTokenTelegram,
  validarConfiguracionCanal,
} from "./comunicaciones.ts";

test("renderizarPlantilla: reemplaza variables encontradas y deja intactas las ausentes", () => {
  const plantilla = "Hola {nombre}, bienvenido a {proyecto}. Precio desde US${precio_desde}. Tu asesor es {broker}.";
  const resultado = renderizarPlantilla(plantilla, {
    nombre: "Carlos Gómez",
    proyecto: "Marina Bay Residences",
    precio_desde: "145,000",
  });

  assert.equal(
    resultado,
    "Hola Carlos Gómez, bienvenido a Marina Bay Residences. Precio desde US$145,000. Tu asesor es {broker}.",
  );
});

test("extraerVariablesDePlantilla: encuentra todas las variables únicas", () => {
  const texto = "{nombre}, le confirmo su cita en {proyecto} con {broker}. Recuerde {nombre} traer su ID.";
  const variables = extraerVariablesDePlantilla(texto);
  assert.deepEqual(variables, ["nombre", "proyecto", "broker"]);
});

test("generarEnlaceTelegram: genera enlace universal t.me sin costo", () => {
  const enlace = generarEnlaceTelegram("@quisqueya_bot", "Hola quiero informes");
  assert.equal(enlace, "https://t.me/quisqueya_bot?text=Hola%20quiero%20informes");

  const enlaceSinMensaje = generarEnlaceTelegram("quisqueyahome");
  assert.equal(enlaceSinMensaje, "https://t.me/quisqueyahome");
});

test("generarEnlaceWhatsApp: normaliza teléfono y arma enlace wa.me", () => {
  const enlace = generarEnlaceWhatsApp("+1 (809) 555-0199", "Consulta sobre proyecto");
  assert.equal(enlace, "https://wa.me/18095550199?text=Consulta%20sobre%20proyecto");
});

test("validarTokenTelegram: detecta tokens oficiales válidos e inválidos", () => {
  assert.ok(validarTokenTelegram("123456789:ABCdefGhIjKLmnOPqrSTUVwxYZ_1234567"));
  assert.equal(validarTokenTelegram("token_invalido"), false);
  assert.equal(validarTokenTelegram("123:corte"), false);
});

test("validarConfiguracionCanal: valida configuraciones por canal", () => {
  const telegramOk = validarConfiguracionCanal("telegram", {
    botToken: "123456789:ABCdefGhIjKLmnOPqrSTUVwxYZ_1234567",
  });
  assert.ok(telegramOk.valido);

  const telegramMal = validarConfiguracionCanal("telegram", { botToken: "" });
  assert.equal(telegramMal.valido, false);

  const whatsappOk = validarConfiguracionCanal("whatsapp", {
    apiToken: "eaab...",
    phoneNumberId: "109827364",
  });
  assert.ok(whatsappOk.valido);

  const webhookOk = validarConfiguracionCanal("webhook", {
    url: "https://api.quisqueyahome.com/leads",
  });
  assert.ok(webhookOk.valido);
});
