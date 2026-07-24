require('dotenv').config();
const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  const summaries = await prisma.summary.findMany()
  console.log("Success! Found", summaries.length, "summaries.")
}
main().catch(console.error)
