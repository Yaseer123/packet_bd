import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportToCSV() {
  try {
    console.log('📊 Exporting database to CSV files...\n');
    
    // Create exports directory
    const exportDir = './csv-exports';
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Tables to export
    const tables = [
      { name: 'Product', description: 'Products' },
      { name: 'Category', description: 'Categories' },
      { name: 'User', description: 'Users' },
      { name: 'Order', description: 'Orders' },
      { name: 'OrderItem', description: 'Order Items' },
      { name: 'Review', description: 'Reviews' },
      { name: 'Question', description: 'Questions' },
      { name: 'Address', description: 'Addresses' },
      { name: 'Post', description: 'Posts' },
      { name: 'Tag', description: 'Tags' },
      { name: 'Slider', description: 'Sliders' },
      { name: 'SaleBanner', description: 'Sale Banners' },
      { name: 'Contact', description: 'Contacts' },
      { name: 'FaqCategory', description: 'FAQ Categories' },
      { name: 'FaqItem', description: 'FAQ Items' },
      { name: 'NewsletterSubscriber', description: 'Newsletter Subscribers' },
      { name: 'WishList', description: 'Wish Lists' },
      { name: 'ShippingUpdate', description: 'Shipping Updates' }
    ];
    
    const exportSummary = {
      timestamp: new Date().toISOString(),
      tables: [],
      totalRecords: 0
    };
    
    console.log('📦 Exporting tables to CSV...\n');
    
    for (const table of tables) {
      try {
        console.log(`📊 Exporting ${table.name}...`);
        
        // Get data from database
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table.name}"`);
        
        if (Array.isArray(data) && data.length > 0) {
          // Convert to CSV
          const headers = Object.keys(data[0]);
          const csvRows = [headers.join(',')];
          
          for (const row of data) {
            const values = headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined) {
                return '';
              }
              if (typeof value === 'object') {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              }
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvRows.push(values.join(','));
          }
          
          const csvContent = csvRows.join('\n');
          const csvPath = path.join(exportDir, `${table.name}.csv`);
          fs.writeFileSync(csvPath, csvContent);
          
          exportSummary.tables.push({
            name: table.name,
            description: table.description,
            records: data.length,
            file: `${table.name}.csv`
          });
          exportSummary.totalRecords += data.length;
          
          console.log(`   ✅ ${table.name}: ${data.length} records exported`);
        } else {
          console.log(`   ⚠️  ${table.name}: No data to export`);
          exportSummary.tables.push({
            name: table.name,
            description: table.description,
            records: 0,
            file: `${table.name}.csv`
          });
        }
      } catch (error) {
        console.log(`   ❌ ${table.name}: Error - ${error.message}`);
        exportSummary.tables.push({
          name: table.name,
          description: table.description,
          records: 0,
          error: error.message
        });
      }
    }
    
    // Create export summary
    const summaryPath = path.join(exportDir, 'export-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(exportSummary, null, 2));
    
    // Create instructions
    const instructions = `# CSV Export Instructions

## Export Summary
- **Total records**: ${exportSummary.totalRecords}
- **Tables exported**: ${exportSummary.tables.length}
- **Export timestamp**: ${exportSummary.timestamp}

## Available CSV Files

${exportSummary.tables.map(table => 
  table.records > 0 
    ? `### ${table.description} (${table.name})
   - **File**: \`${table.file}\`
   - **Records**: ${table.records}`
    : `### ${table.description} (${table.name})
   - **File**: \`${table.file}\`
   - **Records**: No data available`
).join('\n\n')}

## How to Import to Google Sheets

1. **Open Google Sheets**
2. **Create a new sheet** for each table you want to import
3. **For each CSV file**:
   - Go to **File > Import**
   - Upload the CSV file
   - Choose **"Replace current sheet"**
   - Click **Import**

## Files Location
All CSV files are in the \`csv-exports\` directory.

## Next Steps
1. Import the CSV files to your Google Sheets
2. Run this script again whenever you want to update your exports
3. Keep these CSV files as a backup of your data
`;
    
    const instructionsPath = path.join(exportDir, 'import-instructions.md');
    fs.writeFileSync(instructionsPath, instructions);
    
    console.log('\n📋 Export Summary:');
    console.log(`   📁 Export location: ${exportDir}`);
    console.log(`   📦 Total records: ${exportSummary.totalRecords}`);
    console.log(`   📊 Tables exported: ${exportSummary.tables.length}`);
    console.log(`   📄 Summary: export-summary.json`);
    console.log(`   📝 Instructions: import-instructions.md`);
    
    console.log('\n📝 To import to Google Sheets:');
    console.log('1. Go to your Google Sheets document');
    console.log('2. Create new sheets for each table');
    console.log('3. Import the CSV files from the csv-exports directory');
    console.log('4. Follow the instructions in import-instructions.md');
    
    console.log('\n✅ CSV export completed!');
    
    return {
      success: true,
      exportDir,
      summary: exportSummary
    };
    
  } catch (error) {
    console.error('❌ Export failed:', error);
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
  await exportToCSV();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { exportToCSV }; 