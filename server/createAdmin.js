import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const createOrUpdateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be added to .env'
      );
    }

    let admin = await User.findOne({
      email: adminEmail.toLowerCase()
    });

    if (admin) {
      admin.name = 'ACE Senior';
      admin.password = adminPassword;
      admin.role = 'admin';

      await admin.save();

      console.log('Admin account updated successfully.');
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
    } else {
      admin = await User.create({
        name: 'ACE Senior',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });

      console.log('Admin account created successfully.');
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed to create/update admin:', error.message);
    process.exit(1);
  }
};

createOrUpdateAdmin();