import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Post } from '../src/models/Post.js';

async function verifyDatabase() {
  console.log('================ MongoDB Data Verification ================');
  await connectDB();

  // 1. Check Users collection
  const users = await User.find({}, { password: 0 });
  console.log(`\n1. Users Count: ${users.length}`);
  users.forEach((u) => {
    console.log(`   - ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });

  // Verify passwords are encrypted
  const usersWithPass = await User.find({}).select('+password');
  const allHashed = usersWithPass.every((u) => u.password && u.password.startsWith('$2'));
  console.log(`   - Password Hashing Verified (bcrypt $2*): ${allHashed ? 'YES ✅' : 'NO ❌'}`);

  // 2. Posts Collection breakdown
  const postsCount = await Post.countDocuments();
  console.log(`\n2. Posts Count: ${postsCount}`);

  const statusCounts = await Post.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  console.log('   - Status breakdown:');
  statusCounts.forEach((s) => {
    console.log(`     * ${s._id}: ${s.count}`);
  });

  // 3. Verify createdBy reference
  const samplePosts = await Post.find().populate('createdBy', 'name email role').limit(3);
  console.log('\n3. Sample Posts with Populated createdBy:');
  samplePosts.forEach((p) => {
    console.log(`   - Title: "${p.title}"`);
    console.log(`     Status: ${p.status}`);
    console.log(`     Author: ${p.createdBy ? `${p.createdBy.name} (${p.createdBy.email}) [${p.createdBy.role}]` : 'None'}`);
    if (p.rejectionReason) {
      console.log(`     Rejection Reason: "${p.rejectionReason}"`);
    }
    if (p.isAiImproved) {
      console.log(`     AI Improved: true (Original: ${p.originalPostId})`);
    }
  });

  await disconnectDB();
  console.log('\n================ Verification Complete ================');
}

verifyDatabase().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
