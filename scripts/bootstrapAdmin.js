import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { config } from '../src/config/env.js';

async function bootstrap() {
  console.log('--- Akatsuki Platform Admin Bootstrap ---');
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || config.adminEmail || 'admin@akatsuki.draft').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || config.adminPassword || 'Admin@Akatsuki2026!';
  const name = process.env.ADMIN_NAME || config.adminName || 'Akatsuki Lead Admin';

  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'admin';
    existing.password = password; // Will be hashed by pre-save hook
    await existing.save();
    console.log(`[Success] User with email '${email}' was updated to Admin with the provided credentials.`);
  } else {
    const admin = new User({
      name,
      email,
      password,
      role: 'admin',
    });
    await admin.save();
    console.log(`[Success] Created initial admin account successfully: ${email}`);
  }

  await disconnectDB();
  console.log('--- Admin Bootstrap Complete ---');
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('[Error] Admin bootstrap failed:', err.message);
  process.exit(1);
});
