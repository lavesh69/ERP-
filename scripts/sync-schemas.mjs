import fs from "fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf-8");
fs.writeFileSync("prisma/schema.sqlite.prisma", schema);
const postgresSchema = schema.replace(
  'provider = "sqlite"',
  'provider = "postgresql"'
);
fs.writeFileSync("prisma/schema.postgresql.prisma", postgresSchema);
console.log("Successfully synchronized schema.sqlite.prisma and schema.postgresql.prisma");
