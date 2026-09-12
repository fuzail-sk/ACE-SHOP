import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';

const product = {
  name: 'ACE T-Shirt',
  description:
    'The official ACE T-Shirt — clean, minimal and made for the community.',
  price: 799,
  image: '/ace-tshirt-placeholder.svg',
  category: 'ACE Merchandise',
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  stock: 100,
  active: true
};

try {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Product.findOne({ name: product.name });

  if (existing) {
    await Product.findByIdAndUpdate(existing._id, product, {
      new: true,
      runValidators: true
    });

    console.log('ACE T-shirt product updated.');
  } else {
    await Product.create(product);
    console.log('ACE T-shirt product created.');
  }

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}