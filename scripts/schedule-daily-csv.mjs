import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function dailyCSVExport() {
  try {
    console.log('🔄 Starting daily CSV export...');
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}\n`);

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

    // Create daily export directory
    const dailyDir = './daily-csv-exports';
    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir);
    }

    // Create today's directory
    const today = new Date().toISOString().split('T')[0];
    const todayDir = path.join(dailyDir, today);
    if (!fs.existsSync(todayDir)) {
      fs.mkdirSync(todayDir);
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
          const csvPath = path.join(todayDir, `${config.sheetName}.csv`);
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

    // Create daily summary
    const summary = {
      exportDate: today,
      timestamp: new Date().toISOString(),
      results: results,
      totalRecords: totalRecords,
      successfulTables: results.filter(r => r.success && r.recordCount > 0).length,
      exportDirectory: todayDir
    };

    const summaryPath = path.join(todayDir, 'daily-export-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Create daily log
    const logEntry = {
      date: today,
      timestamp: new Date().toISOString(),
      totalRecords: totalRecords,
      successfulTables: summary.successfulTables,
      status: 'success'
    };

    const logPath = path.join(dailyDir, 'export-log.json');
    let logData = [];
    
    if (fs.existsSync(logPath)) {
      try {
        logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (error) {
        logData = [];
      }
    }

    // Add today's entry
    logData.push(logEntry);
    
    // Keep only last 30 days
    if (logData.length > 30) {
      logData = logData.slice(-30);
    }

    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    // Display results
    console.log('\n📊 Daily CSV Export Summary:');
    console.log(`   📁 Export Directory: ${todayDir}`);
    console.log(`   📋 Summary: ${summaryPath}`);
    console.log(`   📊 Log: ${logPath}`);
    console.log(`   📦 Total records: ${totalRecords}`);
    console.log(`   ✅ Successful tables: ${summary.successfulTables}`);

    console.log('\n📁 CSV Files Created:');
    results.forEach(result => {
      if (result.success && result.recordCount > 0) {
        console.log(`   - ${result.sheetName}.csv (${result.recordCount} records)`);
      }
    });

    console.log('\n✅ Daily CSV export completed successfully!');
    console.log('📋 Files are ready for import to Google Sheets or Excel.');

    return {
      success: true,
      summary,
      results,
      todayDir
    };

  } catch (error) {
    console.error('❌ Daily CSV export failed:', error);
    
    // Log the error
    const dailyDir = './daily-csv-exports';
    const logPath = path.join(dailyDir, 'export-log.json');
    let logData = [];
    
    if (fs.existsSync(logPath)) {
      try {
        logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (error) {
        logData = [];
      }
    }

    const errorEntry = {
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'error'
    };

    logData.push(errorEntry);
    
    if (logData.length > 30) {
      logData = logData.slice(-30);
    }

    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

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
  await dailyCSVExport();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { dailyCSVExport }; 