/**
 * Fix Result collection unique index
 * Drops old index with wrong field names and ensures correct one exists
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/online_exam';

async function fixIndex() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const resultCollection = db.collection('results');

    // List all existing indexes
    const indexes = await resultCollection.listIndexes().toArray();
    const indexNames = indexes.map(i => i.name);
    console.log('📋 Current indexes:', indexNames);

    // Drop the potentially problematic index (studentId_1_examId_1 or similar)
    for (const indexName of indexNames) {
      if (indexName !== '_id_' && (indexName.includes('studentId') || indexName.includes('examId'))) {
        console.log(`🗑️  Dropping old index: ${indexName}`);
        await resultCollection.dropIndex(indexName);
      }
    }

    // Create the correct unique index on student and exam
    console.log('✨ Creating correct unique index on (student, exam)...');
    await resultCollection.createIndex({ student: 1, exam: 1 }, { unique: true });

    console.log('✅ Index fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndex();
