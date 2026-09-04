# Auditoría de documentación automática

Revisa únicamente el diff documental sin modificar archivos.

Comprueba:

1. que los hechos sobre código, dependencias, modelo, módulos, pruebas, commit y PR coincidan con el repositorio;
2. que la siguiente acción corresponda al primer checkpoint realmente pendiente;
3. que los diagramas describan solo módulos y conexiones observables;
4. que ninguna decisión, ADR, alcance, roadmap o nota archivada haya sido reescrita;
5. que las modificaciones de notas mixtas estén limitadas a bloques `AUTO`;
6. que no aparezcan secretos, datos personales ni afirmaciones sin evidencia.
7. que cada auditoría use `FD-EVIDENCIA-01`: objetivo, alcance, proyecto, hito, entorno, rama, commit, acción, salida original sanitizada, esperado, observado, estado, hallazgos/riesgos, decisión, siguiente checkpoint y autorización requerida cuando aplique;
8. que el estado sea sólo `PASS`, `PASS_WITH_WARNINGS`, `FAIL`, `BLOCKED`, `NOT_RUN` o `UNKNOWN`, y que la evidencia ausente se marque como `UNKNOWN`, `BLOCKED` o `NOT_RUN`;
9. que no persistan logs crudos, secretos, tokens, contraseñas, datos personales, payloads sensibles ni datos de leads reales.

Respeta `AGENTS.md` y `docs/control/documentation-policy.json`.

Devuelve en español:

- `PASS` si no existe ninguna contradicción material; o
- `FAIL` seguido de una lista corta de contradicciones verificables, con archivo y evidencia.

No inventes evidencia ni propongas cambios de arquitectura o actualizaciones tecnológicas en esta auditoría. La automatización no puede modificar ADR, roadmap, alcance, decisiones humanas ni archivo histórico; tampoco puede avanzar un hito sin aprobación humana explícita.
