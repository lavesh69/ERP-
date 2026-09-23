const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const destPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');

const content = fs.readFileSync(srcPath, 'utf8');
const pgContent = content.replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync(destPath, pgContent, 'utf8');
console.log('PostgreSQL schema generated at:', destPath);
