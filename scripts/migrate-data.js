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
    console.log('Leyendo datos de receipt_scanner...');
    const expenses = await oldPrisma.expense.findMany();
    const categories = await oldPrisma.category.findMany();
    const budgets = await oldPrisma.budget.findMany();

    console.log(`Encontrados: ${expenses.length} gastos, ${categories.length} categorías, ${budgets.length} presupuestos`);

    if (expenses.length === 0 && categories.length === 0) {
      console.log('No hay datos para migrar.');
      return;
    }

    console.log('Insertando en orderfox...');
    
    // Migrar categorías
    for (const cat of categories) {
      try {
        await newPrisma.velzia_category.create({ data: cat });
        console.log(`  ✅ Categoría: ${cat.name}`);
      } catch (e) {
        console.log(`  ⚠️ Categoría ya existe: ${cat.name}`);
      }
    }

    // Migrar gastos
    for (const exp of expenses) {
      try {
        await newPrisma.velzia_expense.create({ data: exp });
        console.log(`  ✅ Gasto: ${exp.description} ($${exp.amount})`);
      } catch (e) {
        console.log(`  ⚠️ Error migrando gasto: ${exp.description}`);
      }
    }

    // Migrar presupuestos
    for (const bud of budgets) {
      try {
        await newPrisma.velzia_budget.create({ data: bud });
        console.log(`  ✅ Presupuesto: ${bud.categoryId}`);
      } catch (e) {
        console.log(`  ⚠️ Error migrando presupuesto`);
      }
    }

    console.log('\n✅ Migración completada');
  } catch (e) {
    console.error('Error fatal:', e);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

migrate();
