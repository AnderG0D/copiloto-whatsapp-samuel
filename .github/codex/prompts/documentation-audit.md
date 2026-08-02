# Auditoría de documentación automática

Revisa únicamente el diff documental sin modificar archivos.

Comprueba:

1. que los hechos sobre código, dependencias, modelo, módulos, pruebas, commit y PR coincidan con el repositorio;
2. que la siguiente acción corresponda al primer checkpoint realmente pendiente;
3. que los diagramas describan solo módulos y conexiones observables;
4. que ninguna decisión, ADR, alcance, roadmap o nota archivada haya sido reescrita;
5. que las modificaciones de notas mixtas estén limitadas a bloques `AUTO`;
6. que no aparezcan secretos, datos personales ni afirmaciones sin evidencia.

Respeta `AGENTS.md` y `docs/control/documentation-policy.json`.

Devuelve en español:

- `PASS` si no existe ninguna contradicción material; o
- `BLOCK` seguido de una lista corta de contradicciones verificables, con archivo y evidencia.

No propongas cambios de arquitectura ni actualizaciones tecnológicas en esta auditoría.
