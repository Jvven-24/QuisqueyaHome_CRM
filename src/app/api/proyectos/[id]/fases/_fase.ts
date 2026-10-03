/**
 * R3.4: helper compartido de fases; solo conserva el parseo común de ids.
 * La autorización, el alcance y las escrituras siguen en cada ruta y caso de
 * uso, como exige `src/application/README.md` §4 y decisión #41.
 */
export { idsDeRuta } from "@/infrastructure/http";
