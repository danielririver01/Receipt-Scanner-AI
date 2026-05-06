const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'receipt_scanner',
  connectionLimit: 10,
  connectTimeout: 10000,
  socketTimeout: 10000,
});

const prisma = new PrismaClient({ adapter });

async function diagnose() {
  console.log('=== DIAGNÓSTICO DE BASE DE DATOS ===\n');

  try {
    // 1. Verificar conexión
    console.log('1. Verificando conexión a BD...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Contar expenses
    console.log('2. Contando expenses...');
    const count = await prisma.expense.count();
    console.log(`📊 Total de expenses: ${count}\n`);

    // 3. Ver últimos 5 expenses
    console.log('3. Últimos 5 expenses:');
    const expenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        description: true,
        amount: true,
        userId: true,
        date: true,
      }
    });
    expenses.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.description} - $${e.amount} - User: ${e.userId?.substring(0, 8)}... - ${e.date.toISOString()}`);
    });
    console.log('');

    // 4. Verificar userIds únicos
    console.log('4. UserIds únicos en expenses:');
    const userIds = await prisma.expense.findMany({
      distinct: ['userId'],
      select: { userId: true }
    });
    userIds.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.userId}`);
    });
    console.log('');

    // 5. Suma total por userId
    console.log('5. Suma total por userId:');
    const allExpenses = await prisma.expense.findMany({
      select: { userId: true, amount: true }
    });
    const sums = {};
    allExpenses.forEach(e => {
      sums[e.userId] = (sums[e.userId] || 0) + e.amount;
    });
    Object.entries(sums).forEach(([userId, sum]) => {
      console.log(`  ${userId.substring(0, 8)}...: $${sum}`);
    });
    console.log('');

    // 6. Verificar schema
    console.log('6. Verificando campos del modelo Expense:');
    const sample = await prisma.expense.findFirst();
    if (sample) {
      console.log('  Campos disponibles:', Object.keys(sample).join(', '));
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('=== FIN DEL DIAGNÓSTICO ===');
}

diagnose();
