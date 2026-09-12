import Product from '../models/Product.js';

export async function listProducts(req, res, next) {
  try {
    const { search, category } = req.query;
    const filter = { active: true };
    if (category) filter.category = category;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    res.json(await Product.find(filter).sort({ createdAt: -1 }));
  } catch (err) { next(err); }
}

export async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
}

export async function createProduct(req, res, next) {
  try { res.status(201).json(await Product.create(req.body)); } catch (err) { next(err); }
}
export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
}
export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product archived' });
  } catch (err) { next(err); }
}
