// tests/helpers/entorno.js
// Se ejecuta antes de cada archivo de pruebas (setupFiles de Jest).
// Las pruebas NUNCA usan la base de desarrollo: trabajan sobre ecorecicla_test,
// que preparar-bd.js borra y vuelve a crear en cada corrida.
process.env.DB_NAME = process.env.DB_NAME_TEST || 'ecorecicla_test';

// dotenv no sobrescribe variables ya definidas, asi que este valor gana
// sobre el .env local. En GitHub Actions no hay .env y se usa este.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'clave_de_pruebas_ecorecicla';
process.env.JWT_EXPIRA = '2h';
