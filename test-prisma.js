const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const Database = require('better-sqlite3')

const connection = new Database('dev.db')
const adapter = new PrismaBetterSqlite3(connection)
const prisma = new PrismaClient({ adapter })

async function main() {
  const summaries = await prisma.summary.findMany()
  console.log(summaries)
}
main().catch(console.error)
