const EmbeddedPostgres = require("embedded-postgres").default;

(async () => {
  const pg = new EmbeddedPostgres({
    databaseDir: "./.local-pg",
    user: "postgres",
    password: "postgres",
    port: 5433,
    persistent: true,
  });
  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("mentormind");
    console.log("Embedded Postgres running on port 5433, database mentormind created");
    console.log("Connection string: postgresql://postgres:postgres@localhost:5433/mentormind");
    setInterval(() => {}, 1000);
  } catch (error) {
    console.error("Failed to start embedded postgres:", error);
    process.exit(1);
  }
})();
