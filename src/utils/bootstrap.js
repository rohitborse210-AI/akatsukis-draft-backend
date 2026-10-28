import { User } from '../models/User.js';
import { config } from '../config/env.js';

export const autoBootstrapAdmin = async () => {
  if (!config.adminEmail || !config.adminPassword) {
    return;
  }

  const normalizedEmail = config.adminEmail.toLowerCase().trim();
  const existingAdmin = await User.findOne({ email: normalizedEmail });

  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`[Bootstrap] Updated existing user '${normalizedEmail}' to admin role.`);
    }
    return;
  }

  const adminUser = new User({
    name: config.adminName || 'Akatsuki Admin',
    email: normalizedEmail,
    password: config.adminPassword,
    role: 'admin',
  });

  await adminUser.save();
  console.log(`[Bootstrap] Initial admin user successfully bootstrapped: ${normalizedEmail}`);
};
