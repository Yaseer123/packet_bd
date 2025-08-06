# Database Backup System

This is a simple backup system for your database that creates JSON backups and CSV exports for Google Sheets.

## Available Commands

### 1. Create Database Backup
```bash
pnpm run backup
```
This will:
- Create a timestamped backup folder in `./backups/`
- Export all tables to JSON files
- Create a restore script for each backup
- Generate a backup summary

### 2. Export to CSV for Google Sheets
```bash
pnpm run export-csv
```
This will:
- Create CSV files in `./csv-exports/`
- Export all tables to CSV format
- Generate import instructions for Google Sheets
- Create a summary of all exports

## How to Use

### Creating a Backup
1. Run: `pnpm run backup`
2. Check the `./backups/` folder for your backup
3. Each backup has its own folder with timestamp

### Exporting to Google Sheets
1. Run: `pnpm run export-csv`
2. Check the `./csv-exports/` folder for CSV files
3. Follow the instructions in `import-instructions.md`

### Restoring from Backup
1. Go to the backup folder you want to restore from
2. Run: `node restore-database.mjs`
3. This will restore all data from that backup

## Backup Locations

- **JSON Backups**: `./backups/backup-[timestamp]/`
- **CSV Exports**: `./csv-exports/`
- **Restore Scripts**: Inside each backup folder

## When to Use

- **Backup**: Before making major changes to your database
- **Export CSV**: When you want to view data in Google Sheets
- **Restore**: If you accidentally delete data or need to rollback

## Safety Tips

1. **Run backups regularly** - especially before updates
2. **Keep multiple backups** - don't delete old backups immediately
3. **Test restore process** - make sure you can restore if needed
4. **Store backups safely** - consider copying to cloud storage

## Example Usage

```bash
# Create a backup before making changes
pnpm run backup

# Export current data to CSV for Google Sheets
pnpm run export-csv

# If something goes wrong, restore from backup
cd ./backups/backup-2024-01-15T10-30-00-000Z/
node restore-database.mjs
```

## Files Created

### Backup Command
- `backup-summary.json` - Summary of what was backed up
- `restore-database.mjs` - Script to restore the backup
- `[TableName].json` - JSON files for each table

### Export CSV Command
- `export-summary.json` - Summary of exported data
- `import-instructions.md` - How to import to Google Sheets
- `[TableName].csv` - CSV files for each table

This simple system ensures you never lose your data and can easily view it in Google Sheets! 