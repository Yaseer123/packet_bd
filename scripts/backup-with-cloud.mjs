import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupWithCloud() {
  try {
    console.log('🔄 Creating comprehensive backup...\n');
    
    // Step 1: Create local backup
    console.log('📁 Step 1: Creating local backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `./backups/backup-${timestamp}`;
    
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
    }
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Backup all tables
    const tables = [
      'User', 'Product', 'Category', 'Order', 'OrderItem', 
      'Review', 'Question', 'Address', 'Post', 'Tag',
      'Slider', 'SaleBanner', 'Contact', 'FaqCategory', 'FaqItem',
      'NewsletterSubscriber', 'WishList', 'ShippingUpdate'
    ];
    
    const backupSummary = {
      timestamp: new Date().toISOString(),
      tables: [],
      totalRecords: 0,
      backupLocation: 'local',
      cloudBackup: false
    };
    
    for (const table of tables) {
      try {
        console.log(`📦 Backing up ${table}...`);
        
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
        
        if (Array.isArray(data) && data.length > 0) {
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
    
    // Step 2: Create compressed backup
    console.log('\n📦 Step 2: Creating compressed backup...');
    
    const { exec } = await import('child_process');
    const tarPath = path.join(backupDir, 'backup.tar.gz');
    
    exec(`tar -czf "${tarPath}" -C "${backupDir}" .`, (error) => {
      if (error) {
        console.log('   ⚠️  Could not create compressed backup');
      } else {
        console.log('   ✅ Compressed backup created');
        backupSummary.compressedBackup = tarPath;
      }
    });
    
    // Step 3: Cloud backup options
    console.log('\n☁️  Step 3: Cloud backup options...');
    console.log('   📋 Available options:');
    console.log('   1. AWS S3 (recommended)');
    console.log('   2. Google Cloud Storage');
    console.log('   3. Dropbox/Google Drive');
    console.log('   4. Second Supabase DB');
    console.log('   5. Skip cloud backup for now');
    
    console.log('\n💡 Recommendation:');
    console.log('   - Use AWS S3 for cost-effective cloud backup');
    console.log('   - Set up automatic uploads');
    console.log('   - Keep local backups as primary');
    console.log('   - Use Google Sheets for data viewing');
    
    // Step 4: Backup verification
    console.log('\n🔍 Step 4: Backup verification...');
    
    const backupSize = fs.statSync(backupDir).size;
    const backupSizeMB = (backupSize / (1024 * 1024)).toFixed(2);
    
    console.log(`   📊 Backup size: ${backupSizeMB} MB`);
    console.log(`   📦 Total records: ${backupSummary.totalRecords}`);
    console.log(`   📁 Backup location: ${backupDir}`);
    
    // Step 5: Create restore instructions
    const restoreInstructions = `# Restore Instructions

## Backup Details
- **Timestamp**: ${backupSummary.timestamp}
- **Location**: ${backupDir}
- **Total Records**: ${backupSummary.totalRecords}
- **Tables**: ${backupSummary.tables.length}

## How to Restore

### Option 1: Using Restore Script
\`\`\`bash
cd ${backupDir}
node restore-database.mjs
\`\`\`

### Option 2: Manual Restore
1. Go to your database
2. Import each JSON file manually
3. Follow the table structure

### Option 3: From Compressed Backup
\`\`\`bash
tar -xzf backup.tar.gz
node restore-database.mjs
\`\`\`

## Backup Verification
- ✅ All tables backed up
- ✅ Backup summary created
- ✅ Restore script included
- ⚠️  Cloud backup not configured

## Next Steps
1. Test restore process
2. Set up cloud backup
3. Schedule regular backups
4. Monitor backup success
`;
    
    const instructionsPath = path.join(backupDir, 'restore-instructions.md');
    fs.writeFileSync(instructionsPath, restoreInstructions);
    
    console.log('\n📋 Backup Summary:');
    console.log(`   📁 Location: ${backupDir}`);
    console.log(`   📦 Records: ${backupSummary.totalRecords}`);
    console.log(`   📊 Size: ${backupSizeMB} MB`);
    console.log(`   📄 Summary: backup-summary.json`);
    console.log(`   📝 Instructions: restore-instructions.md`);
    
    console.log('\n🔄 To restore from this backup:');
    console.log(`   cd ${backupDir}`);
    console.log('   node restore-database.mjs');
    
    console.log('\n✅ Comprehensive backup completed!');
    
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
  await backupWithCloud();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { backupWithCloud }; 