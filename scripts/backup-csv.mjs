import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backupToCSV() {
  try {
    console.log('🔄 Creating CSV backup of database...\n');

    const tableConfigs = [
      {
        name: 'Product',
        sheetName: 'Products',
        description: 'Product catalog'
      },
      {
        name: 'Category',
        sheetName: 'Categories',
        description: 'Product categories'
      },
      {
        name: 'User',
        sheetName: 'Users',
        description: 'User accounts'
      },
      {
        name: 'Order',
        sheetName: 'Orders',
        description: 'Customer orders'
      },
      {
        name: 'OrderItem',
        sheetName: 'OrderItems',
        description: 'Order line items'
      },
      {
        name: 'Review',
        sheetName: 'Reviews',
        description: 'Product reviews'
      },
      {
        name: 'Question',
        sheetName: 'Questions',
        description: 'Product questions'
      },
      {
        name: 'Address',
        sheetName: 'Addresses',
        description: 'User addresses'
      },
      {
        name: 'Post',
        sheetName: 'BlogPosts',
        description: 'Blog posts'
      },
      {
        name: 'Tag',
        sheetName: 'Tags',
        description: 'Blog tags'
      },
      {
        name: 'Slider',
        sheetName: 'Sliders',
        description: 'Homepage sliders'
      },
      {
        name: 'SaleBanner',
        sheetName: 'SaleBanners',
        description: 'Sale banners'
      },
      {
        name: 'Contact',
        sheetName: 'Contacts',
        description: 'Contact form submissions'
      },
      {
        name: 'FaqCategory',
        sheetName: 'FaqCategories',
        description: 'FAQ categories'
      },
      {
        name: 'FaqItem',
        sheetName: 'FaqItems',
        description: 'FAQ items'
      },
      {
        name: 'NewsletterSubscriber',
        sheetName: 'NewsletterSubscribers',
        description: 'Newsletter subscribers'
      },
      {
        name: 'WishList',
        sheetName: 'WishLists',
        description: 'User wishlists'
      },
      {
        name: 'ShippingUpdate',
        sheetName: 'ShippingUpdates',
        description: 'Shipping tracking updates'
      }
    ];

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = `./backup-csv-${timestamp}`;
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const results = [];
    let totalRecords = 0;

    for (const config of tableConfigs) {
      try {
        console.log(`📦 Processing ${config.name}...`);

        // Get data from database
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${config.name}" LIMIT 10000`);

        if (Array.isArray(data) && data.length > 0) {
          // Convert to CSV format
          const headers = Object.keys(data[0]);
          const rows = [headers]; // Headers as first row

          for (const row of data) {
            const values = headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined) {
                return '';
              }
              if (typeof value === 'object') {
                return JSON.stringify(value);
              }
              return String(value);
            });
            rows.push(values);
          }

          // Create CSV file
          const csvContent = rows.map(row => row.join('\t')).join('\n');
          const csvPath = path.join(backupDir, `${config.sheetName}.csv`);
          fs.writeFileSync(csvPath, csvContent);

          results.push({
            table: config.name,
            sheetName: config.sheetName,
            recordCount: data.length,
            success: true,
            filePath: csvPath
          });

          totalRecords += data.length;
          console.log(`   ✅ ${config.name}: ${data.length} records saved to ${config.sheetName}.csv`);
        } else {
          console.log(`   ⚠️  ${config.name}: No data to export`);
          results.push({
            table: config.name,
            sheetName: config.sheetName,
            recordCount: 0,
            success: true
          });
        }
      } catch (error) {
        console.log(`   ❌ ${config.name}: Error - ${error.message}`);
        results.push({
          table: config.name,
          sheetName: config.sheetName,
          error: error.message,
          success: false
        });
      }
    }

    // Create backup summary
    const summary = {
      timestamp: new Date().toISOString(),
      backupDate: timestamp,
      results: results,
      totalRecords: totalRecords,
      successfulTables: results.filter(r => r.success && r.recordCount > 0).length,
      backupDirectory: backupDir
    };

    const summaryPath = path.join(backupDir, 'backup-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Create README for the backup
    const readmeContent = `# Database CSV Backup - ${timestamp}

## Backup Summary
- **Date**: ${timestamp}
- **Total Records**: ${totalRecords}
- **Successful Tables**: ${summary.successfulTables}

## Available CSV Files

${results.map(result =>
  result.success && result.recordCount > 0
    ? `### ${result.sheetName}
   - **File**: \`${result.sheetName}.csv\`
   - **Records**: ${result.recordCount}
   - **Description**: ${tableConfigs.find(c => c.name === result.table)?.description || 'N/A'}`
    : `### ${result.sheetName}
   - **Status**: No data available
   - **Description**: ${tableConfigs.find(c => c.name === result.table)?.description || 'N/A'}`
).join('\n\n')}

## Usage
- Import CSV files to Google Sheets or Excel
- Use for data analysis or backup purposes
- Files are tab-separated for easy import

## Backup Information
- Generated on: ${new Date().toLocaleString()}
- Database: PacketBD
- Format: Tab-separated CSV
`;

    const readmePath = path.join(backupDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent);

    // Display results
    console.log('\n📊 CSV Backup Summary:');
    console.log(`   📁 Backup Directory: ${backupDir}`);
    console.log(`   📋 Summary: ${summaryPath}`);
    console.log(`   📖 README: ${readmePath}`);
    console.log(`   📦 Total records: ${totalRecords}`);
    console.log(`   ✅ Successful tables: ${summary.successfulTables}`);

    console.log('\n📁 CSV Files Created:');
    results.forEach(result => {
      if (result.success && result.recordCount > 0) {
        console.log(`   - ${result.sheetName}.csv (${result.recordCount} records)`);
      }
    });

    console.log('\n✅ CSV backup completed successfully!');
    console.log('📋 You can now import these CSV files to Google Sheets or Excel for backup purposes.');

    return {
      success: true,
      summary,
      results,
      backupDir
    };

  } catch (error) {
    console.error('❌ CSV backup failed:', error);
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
  await backupToCSV();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { backupToCSV }; 