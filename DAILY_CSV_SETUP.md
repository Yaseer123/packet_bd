# Daily CSV Export Setup Guide

## 🚀 Automatic Daily CSV Export

This guide will help you set up automatic daily CSV export of your database.

## 📋 Available Commands

### **Manual Export:**
```bash
# Run daily CSV export manually
pnpm run daily-csv

# Create timestamped backup
pnpm run backup-csv

# Full CSV export
pnpm run export-csv
```

## 🔄 Automatic Scheduling Options

### **Option 1: Cron Job (Recommended for macOS/Linux)**

#### **Step 1: Open Crontab**
```bash
crontab -e
```

#### **Step 2: Add Daily Schedule**
Add this line to run CSV export daily at 2 AM:
```bash
# Daily CSV export at 2 AM
0 2 * * * cd /Users/yaseerarafatkhan/Documents/GitHub/packetbd && /usr/local/bin/pnpm run daily-csv >> /Users/yaseerarafatkhan/Documents/GitHub/packetbd/daily-csv-exports/cron.log 2>&1
```

#### **Step 3: Verify Crontab**
```bash
crontab -l
```

### **Option 2: macOS LaunchAgent (Alternative)**

#### **Step 1: Create LaunchAgent File**
Create file: `~/Library/LaunchAgents/com.packetbd.dailycsv.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.packetbd.dailycsv</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/pnpm</string>
        <string>run</string>
        <string>daily-csv</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/yaseerarafatkhan/Documents/GitHub/packetbd</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/yaseerarafatkhan/Documents/GitHub/packetbd/daily-csv-exports/launchagent.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/yaseerarafatkhan/Documents/GitHub/packetbd/daily-csv-exports/launchagent.log</string>
</dict>
</plist>
```

#### **Step 2: Load LaunchAgent**
```bash
launchctl load ~/Library/LaunchAgents/com.packetbd.dailycsv.plist
```

### **Option 3: GitHub Actions (Cloud-based)**

#### **Step 1: Create GitHub Actions Workflow**
Create file: `.github/workflows/daily-csv-export.yml`

```yaml
name: Daily CSV Export

on:
  schedule:
    # Runs daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  export-csv:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install -g pnpm && pnpm install
      
    - name: Setup database
      run: |
        # Add your database setup commands here
        # For example: pnpm prisma db push
        
    - name: Run daily CSV export
      run: pnpm run daily-csv
      
    - name: Upload CSV files as artifacts
      uses: actions/upload-artifact@v3
      with:
        name: daily-csv-export
        path: daily-csv-exports/
        retention-days: 30
```

## 📁 File Structure

After running the daily export, you'll have:

```
daily-csv-exports/
├── 2025-08-04/
│   ├── Products.csv
│   ├── Categories.csv
│   ├── Users.csv
│   ├── Orders.csv
│   ├── OrderItems.csv
│   ├── Addresses.csv
│   ├── daily-export-summary.json
│   └── README.md
├── 2025-08-05/
│   └── ... (next day's files)
├── export-log.json
└── cron.log (if using cron)
```

## 📊 Monitoring

### **Check Export Log:**
```bash
# View export history
cat daily-csv-exports/export-log.json

# View recent exports
tail -f daily-csv-exports/cron.log
```

### **Manual Test:**
```bash
# Test the export manually
pnpm run daily-csv

# Check the results
ls -la daily-csv-exports/$(date +%Y-%m-%d)/
```

## 🔧 Troubleshooting

### **If Cron Job Fails:**
1. Check cron logs: `tail -f daily-csv-exports/cron.log`
2. Verify pnpm path: `which pnpm`
3. Test manually: `pnpm run daily-csv`

### **If LaunchAgent Fails:**
1. Check logs: `tail -f daily-csv-exports/launchagent.log`
2. Reload agent: `launchctl unload ~/Library/LaunchAgents/com.packetbd.dailycsv.plist && launchctl load ~/Library/LaunchAgents/com.packetbd.dailycsv.plist`

### **If GitHub Actions Fails:**
1. Check Actions tab in GitHub repository
2. Verify database connection in cloud environment
3. Check workflow logs for errors

## ✅ Success Indicators

- ✅ CSV files created in `daily-csv-exports/YYYY-MM-DD/`
- ✅ Export log updated in `export-log.json`
- ✅ No errors in cron/launchagent logs
- ✅ Files ready for import to Google Sheets

## 🎯 Recommended Setup

1. **Use Cron Job** (Option 1) for local development
2. **Use GitHub Actions** (Option 3) for production/cloud
3. **Test manually** first: `pnpm run daily-csv`
4. **Monitor logs** for the first few days
5. **Import CSV files** to Google Sheets as needed

## 📝 Next Steps

1. Choose your scheduling method
2. Set up the automation
3. Test the first export
4. Monitor for a few days
5. Import CSV files to Google Sheets

Your daily CSV export will now run automatically! 🎉 