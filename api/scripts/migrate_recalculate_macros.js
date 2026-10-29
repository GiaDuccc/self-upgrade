const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');
const { runNutritionistAgent } = require('../build/agents/selfUpgradeAgent');

async function migrateAllMacros() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME || 'Self-upgrade';
  console.log('🚀 Connecting to MongoDB:', dbName);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const disciplinesCol = db.collection('disciplines');
  const usersCol = db.collection('users');

  const docs = await disciplinesCol.find({}).toArray();
  console.log(`Found ${docs.length} user discipline document(s).`);

  let totalDaysUpdated = 0;
  let totalMealsUpdated = 0;

  for (const doc of docs) {
    let user = null;
    try {
      user = await usersCol.findOne({ _id: doc.userId instanceof ObjectId ? doc.userId : new ObjectId(doc.userId) });
    } catch {
      user = await usersCol.findOne({ _id: doc.userId });
    }
    const profile = user?.profile || {};
    const records = doc.records || {};
    let docModified = false;

    console.log(`\n--------------------------------------------------`);
    console.log(`Processing User: ${doc.userId} (${profile.name || 'Unknown'})`);

    for (const [dateKey, dayRecord] of Object.entries(records)) {
      if (dayRecord.caloriesData && Array.isArray(dayRecord.caloriesData.meals) && dayRecord.caloriesData.meals.length > 0) {
        const oldSummary = dayRecord.caloriesData.summary;
        const oldMeals = dayRecord.caloriesData.meals;

        console.log(`\n📅 Date [${dateKey}]: ${oldMeals.length} meal(s)`);
        console.log(`   Old total: ${oldSummary?.totalCalories || 0} kcal | P:${oldSummary?.protein || 0}g C:${oldSummary?.carb || 0}g F:${oldSummary?.fat || 0}g Fib:${oldSummary?.fiber || 0}g`);

        const result = await runNutritionistAgent({
          profile,
          dateKey,
          meals: oldMeals,
          previousSummary: undefined
        });

        // Update day record
        dayRecord.caloriesData = {
          meals: result.meals,
          summary: result.summary,
        };
        dayRecord.updatedAt = new Date().toISOString();

        console.log(`   👉 NEW TOTAL: ${result.summary.totalCalories} kcal | P:${result.summary.protein}g C:${result.summary.carb}g F:${result.summary.fat}g Fib:${result.summary.fiber}g`);
        for (const m of result.meals) {
          console.log(`      * ${m.name} (${m.weight}): ${m.calories} kcal | P:${m.protein}g C:${m.carb}g F:${m.fat}g Fib:${m.fiber}g`);
        }

        docModified = true;
        totalDaysUpdated++;
        totalMealsUpdated += oldMeals.length;
      }
    }

    if (docModified) {
      await disciplinesCol.updateOne(
        { _id: doc._id },
        { $set: { records } }
      );
      console.log(`✅ Saved updated records for user ${doc.userId}`);
    }
  }

  console.log('\n==================================================');
  console.log(`🎉 MIGRATION COMPLETED!`);
  console.log(`Total days recalculated: ${totalDaysUpdated}`);
  console.log(`Total meals recalculated: ${totalMealsUpdated}`);
  console.log('==================================================\n');

  await client.close();
}

migrateAllMacros().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

