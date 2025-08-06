import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('🔄 Creating database backup...\n');
    
    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `./backups/backup-${timestamp}`;
    
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
    }
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // List of all tables to backup
    const tables = [
      'User', 'Product', 'Category', 'Order', 'OrderItem', 
      'Review', 'Question', 'Address', 'Post', 'Tag',
      'Slider', 'SaleBanner', 'Contact', 'FaqCategory', 'FaqItem',
      'NewsletterSubscriber', 'WishList', 'ShippingUpdate'
    ];
    
    const backupSummary = {
      timestamp: new Date().toISOString(),
      tables: [],
      totalRecords: 0
    };
    
    console.log('📊 Backing up tables...\n');
    
    for (const table of tables) {
      try {
        console.log(`📦 Backing up ${table}...`);
        
        // Get all data from table
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
        
        if (Array.isArray(data) && data.length > 0) {
          // Save to JSON file
          const filePath = path.join(backupDir, `${table}.json`);
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
          
          backupSummary.tables.push({
            name: table,
            records: data.length,
            file: `${table}.json`
          });
          backupSummary.totalRecords += data.length;
          
          console.log(`   ✅ ${table}: ${data.length} records backed up`);
        } else {
          console.log(`   ⚠️  ${table}: No data to backup`);
          backupSummary.tables.push({
            name: table,
            records: 0,
            file: `${table}.json`
          });
        }
      } catch (error) {
        console.log(`   ❌ ${table}: Error - ${error.message}`);
        backupSummary.tables.push({
          name: table,
          records: 0,
          error: error.message
        });
      }
    }
    
    // Save backup summary
    const summaryPath = path.join(backupDir, 'backup-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(backupSummary, null, 2));
    
    // Create a simple restore script
    const restoreScript = `import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function restoreDatabase() {
  try {
    console.log('🔄 Restoring database from backup...\\n');
    
    const backupDir = '${backupDir}';
    const summaryPath = path.join(backupDir, 'backup-summary.json');
    
    if (!fs.existsSync(summaryPath)) {
      throw new Error('Backup summary not found');
    }
    
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    
    for (const table of summary.tables) {
      if (table.records > 0) {
        try {
          console.log(\`📦 Restoring \${table.name}...\`);
          
          const dataPath = path.join(backupDir, table.file);
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          
          // Clear existing data
          await prisma.\$executeRawUnsafe(\`DELETE FROM "\${table.name}"\`);
          
          // Insert backup data
          for (const record of data) {
            await prisma.\$executeRawUnsafe(\`INSERT INTO "\${table.name}" VALUES (\${Object.values(record).map(v => typeof v === 'string' ? \`'\${v}'\` : v).join(', ')})\`);
          }
          
          console.log(\`   ✅ \${table.name}: \${data.length} records restored\`);
        } catch (error) {
          console.log(\`   ❌ \${table.name}: Error - \${error.message}\`);
        }
      }
    }
    
    console.log('\\n✅ Database restore completed!');
  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

restoreDatabase();
`;
    
    const restorePath = path.join(backupDir, 'restore-database.mjs');
    fs.writeFileSync(restorePath, restoreScript);
    
    console.log('\n📋 Backup Summary:');
    console.log(`   📁 Backup location: ${backupDir}`);
    console.log(`   📦 Total records: ${backupSummary.totalRecords}`);
    console.log(`   📊 Tables backed up: ${backupSummary.tables.length}`);
    console.log(`   📄 Summary file: backup-summary.json`);
    console.log(`   🔄 Restore script: restore-database.mjs`);
    
    console.log('\n📝 To restore from this backup:');
    console.log(`   cd ${backupDir}`);
    console.log('   node restore-database.mjs');
    
    console.log('\n✅ Backup completed successfully!');
    
    return {
      success: true,
      backupDir,
      summary: backupSummary
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  await backupDatabase();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { backupDatabase }; 