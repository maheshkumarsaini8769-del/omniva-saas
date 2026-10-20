const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const runBackup = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
  const redactedUri = String(mongoUri || '').replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
  console.log('[Omniva Backup Engine] Connecting to database:', redactedUri);
  await mongoose.connect(mongoUri);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, `../backups/snapshot-${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`[Omniva Backup Engine] Found ${collections.length} collections to back up...`);

  let totalDocs = 0;

  for (const colInfo of collections) {
    const colName = colInfo.name;
    const docs = await mongoose.connection.db.collection(colName).find({}).toArray();
    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    console.log(`  ✓ Exported ${colName}: ${docs.length} documents -> ${filePath}`);
    totalDocs += docs.length;
  }

  const manifest = {
    platform: 'Omniva SaaS Platform',
    timestamp: new Date().toISOString(),
    collectionsCount: collections.length,
    totalDocuments: totalDocs,
    backupDir,
  };

  fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\n[Omniva Backup Engine] Backup completed successfully!');
  console.log(`Location: ${backupDir}`);
  console.log(`Total Documents Archived: ${totalDocs}`);

  if (require.main === module) {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  runBackup().catch((err) => {
    console.error('[Omniva Backup Engine Error]:', err);
    process.exit(1);
  });
}

module.exports = { runBackup };
