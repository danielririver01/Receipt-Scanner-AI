const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

async function migrate() {
  // Conexión a BD vieja
  const oldAdapter = new PrismaMariaDb({ 
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'receipt_scanner' 
  });
  const oldPrisma = new PrismaClient({ adapter: oldAdapter });

  // Conexión a BD nueva
  const newAdapter = new PrismaMariaDb({ 
    host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'orderfox' 
  });
  const newPrisma = new PrismaClient({ adapter: newAdapter });

  try {
    console.log('Migrando categorías...');
    const cats = await oldPrisma.$queryRaw`SELECT * FROM category`;
    for (const cat of cats) {
      await newPrisma.$executeRaw`
        INSERT INTO category (id, name, userId, createdAt, updatedAt) 
        VALUES (${cat.id}, ${cat.name}, ${cat.userId}, ${cat.createdAt}, ${cat.updatedAt})
        ON DUPLICATE KEY UPDATE id = id
      `;
      console.log(`  ✅ ${cat.name}`);
    }

    console.log('Migrando gastos...');
    const exps = await oldPrisma.$queryRaw`SELECT * FROM expense`;
    for (const exp of exps) {
      await newPrisma.$executeRaw`
        INSERT INTO expense (id, amount, amountConfidence, description, date, categoryId, userId, receiptUrl, ocrText, items, itemsConfidence, createdAt, updatedAt) 
        VALUES (${exp.id}, ${exp.amount}, ${exp.amountConfidence}, ${exp.description}, ${exp.date}, ${exp.categoryId}, ${exp.userId}, ${exp.receiptUrl}, ${exp.ocrText}, ${exp.items}, ${exp.itemsConfidence}, ${exp.createdAt}, ${exp.updatedAt})
        ON DUPLICATE KEY UPDATE id = id
      `;
      console.log(`  ✅ ${exp.description} ($${exp.amount})`);
    }

    console.log('Migrando presupuestos...');
    const buds = await oldPrisma.$queryRaw`SELECT * FROM budget`;
    for (const bud of buds) {
      await newPrisma.$executeRaw`
        INSERT INTO budget (id, amount, categoryId, userId, month, year, createdAt, updatedAt) 
        VALUES (${bud.id}, ${bud.amount}, ${bud.categoryId}, ${bud.userId}, ${bud.month}, ${bud.year}, ${bud.createdAt}, ${bud.updatedAt})
        ON DUPLICATE KEY UPDATE id = id
      `;
      console.log(`  ✅ Presupuesto ${bud.categoryId}`);
    }

    console.log('\n✅ Migración completada');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrate();
