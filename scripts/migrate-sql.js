const mysql = require('mysql2/promise');

async function migrate() {
  // Conexiones
  const oldConn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'receipt_scanner' });
  const newConn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '', database: 'orderfox' });

  try {
    console.log('Migrando categorías...');
    const [cats] = await oldConn.execute('SELECT * FROM category');
    for (const cat of cats) {
      await newConn.execute(
        'INSERT IGNORE INTO category (id, name, userId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.userId, cat.createdAt, cat.updatedAt]
      );
      console.log(`  ✅ ${cat.name}`);
    }

    console.log('Migrando gastos...');
    const [exps] = await oldConn.execute('SELECT * FROM expense');
    for (const exp of exps) {
      await newConn.execute(
        'INSERT IGNORE INTO expense (id, amount, amountConfidence, description, date, categoryId, userId, receiptUrl, ocrText, items, itemsConfidence, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [exp.id, exp.amount, exp.amountConfidence, exp.description, exp.date, exp.categoryId, exp.userId, exp.receiptUrl, exp.ocrText, exp.items, exp.itemsConfidence, exp.createdAt, exp.updatedAt]
      );
      console.log(`  ✅ ${exp.description} ($${exp.amount})`);
    }

    console.log('Migrando presupuestos...');
    const [buds] = await oldConn.execute('SELECT * FROM budget');
    for (const bud of buds) {
      await newConn.execute(
        'INSERT IGNORE INTO budget (id, amount, categoryId, userId, month, year, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [bud.id, bud.amount, bud.categoryId, bud.userId, bud.month, bud.year, bud.createdAt, bud.updatedAt]
      );
      console.log(`  ✅ Presupuesto ${bud.categoryId}`);
    }

    console.log('\n✅ Migración completada');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await oldConn.end();
    await newConn.end();
  }
}

migrate();
