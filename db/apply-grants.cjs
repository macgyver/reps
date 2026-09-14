require("dotenv").config({ path: ".env.local", quiet: true });
const fs = require("node:fs");
const path = require("node:path");
const postgres = require("postgres");

let sql = postgres(process.env.DIRECT_URL, { ssl: "require" });
let statements = fs.readFileSync(path.join(__dirname, "grants.sql"), "utf8");

sql
  .unsafe(statements)
  .then(() => {
    console.log("Grants applied.");
    return sql.end();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
