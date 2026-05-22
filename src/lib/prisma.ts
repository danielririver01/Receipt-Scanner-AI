import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

declare global {
  var prisma: PrismaClient | undefined
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL || '')

const prisma = global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma