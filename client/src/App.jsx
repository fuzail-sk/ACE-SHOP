import React, { useEffect, useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

const API_URL = 'https://ace-shop.onrender.com/api';

// ==========================================
// HEADER
// ==========================================
function Header({ cartCount }) {
  return (
    <header>
      <Link className="logo" to="/">
        ACE<span>STORE</span>
      </Link>

      <nav>
        <Link to="/">Home</Link>
        <Link to="/product">T-Shirt</Link>
        <Link to="/checkout">
          Cart{cartCount > 0 ? ` (${cartCount})` : ''}
        </Link>
      </nav>
    </header>
  );
}

// ==========================================
// HOME
// ==========================================
function Home({ product, loading }) {
  if (loading) {
    return (
      <main className="empty">
        <h2>Loading ACE Store...</h2>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="empty">
        <h2>Unable to load product.</h2>
        <p>Please make sure the backend server is running.</p>
      </main>
    );
  }

  return (
    <main className="hero">
      <div>
        <p className="eyebrow">ACE OFFICIAL MERCH</p>

        <h1>
          Built for the<br />
          <span>ACE community.</span>
        </h1>

        <p className="lead">
          A minimal black-and-white store for the official ACE T-Shirt.
        </p>

        <Link className="button" to="/product">
          Shop ACE T-Shirt
        </Link>
      </div>

      <div className="hero-card">
        <img src={product.image} alt={product.name} />

        <div>
          <strong>{product.name}</strong>
          <b>₹{product.price}</b>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// PRODUCT
// ==========================================
function Product({ product, loading, setCart }) {
  const navigate = useNavigate();
  const [gender, setGender] = useState('');
  const [size, setSize] = useState('');

  useEffect(() => {
    if (product?.sizes?.length > 0) {
      setSize(product.sizes[0]);
    }
  }, [product]);

  if (loading) {
    return (
      <main className="empty">
        <h2>Loading product...</h2>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="empty">
        <h2>Product unavailable.</h2>
        <p>Please make sure the backend server is running.</p>
      </main>
    );
  }

  const addToCart = () => {
    if (!gender || !size) return;

    setCart({
      product,
      gender,
      neckType: gender === 'Male' ? 'Collar' : 'Round Neck',
      size
    });

    navigate('/checkout');
  };

  return (
    <main className="product-page">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>

      <section>
        <p className="eyebrow">OFFICIAL ACE MERCH</p>

        <h2>{product.name}</h2>

        <div className="price">₹{product.price}</div>

        <p className="description">{product.description}</p>

        <h4>Gender</h4>

        <div className="sizes">
          {['Male', 'Female'].map((g) => (
            <button
              key={g}
              type="button"
              className={gender === g ? 'selected' : ''}
              onClick={() => setGender(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {gender && (
          <p className="description">
            Style: <strong>{gender === 'Male' ? 'Collar' : 'Round Neck'}</strong>
          </p>
        )}

        <h4>Size</h4>

        <div className="sizes">
          {product.sizes?.map((s) => (
            <button
              key={s}
              type="button"
              className={size === s ? 'selected' : ''}
              onClick={() => setSize(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          className="button full"
          type="button"
          onClick={addToCart}
          disabled={!gender || !size}
        >
          Add to Cart
        </button>
      </section>
    </main>
  );
}

// ==========================================
// CHECKOUT
// ==========================================
function Checkout({ cart }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!cart) {
    return (
      <main className="empty">
        <h2>Your cart is empty.</h2>
        <Link className="button" to="/product">
          View T-Shirt
        </Link>
      </main>
    );
  }

  const total = cart.product.price;

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    setError('');

    if (!fullName || !email || !phone) {
      setError('Please fill in all the required details.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerEmail: email,
          items: [
            {
              product: cart.product._id,
              gender: cart.gender,
              neckType: cart.neckType,
              size: cart.size
            }
          ],
          customerDetails: {
            fullName,
            phone
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit order.');
      }

      navigate('/order-success');
    } catch (err) {
      console.error('Order submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="checkout">
      <section>
        <p className="eyebrow">CHECKOUT</p>
        <h2>Complete your order</h2>

        <form className="form" onSubmit={handleSubmitOrder}>
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            placeholder="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}
        </form>
      </section>

      <aside className="payment">
        <h3>Order Summary</h3>

        <p>
          <b>{cart.product.name}</b>
          <br />
          Gender: {cart.gender}
          <br />
          Style: {cart.neckType}
          <br />
          Size: {cart.size}
          <br />
          ₹{total}
        </p>

        <h3>UPI Payment</h3>

        <p>
          Scan the ACE store QR code and pay <b>₹{total}</b>.
        </p>

        <div className="qr">
          QR CODE
          <small>Replace with ACE UPI QR</small>
        </div>

        <p className="muted">
          After making the payment, click the button below.
          Your payment will be verified manually by the ACE senior/admin.
        </p>

        <div className="order-summary">
          <p>
            <span>T-Shirt</span>
            <b>₹{total}</b>
          </p>

          <hr />

          <p>
            <strong>Total</strong>
            <strong>₹{total}</strong>
          </p>
        </div>

        <button
          className="button full"
          type="submit"
          onClick={handleSubmitOrder}
          disabled={submitting}
        >
          {submitting ? 'Submitting Order...' : "I've Paid — Submit Order"}
        </button>
      </aside>
    </main>
  );
}

// ==========================================
// SUCCESS
// ==========================================
function Success() {
  return (
    <main className="success">
      <div className="check">✓</div>

      <p className="eyebrow">ORDER RECEIVED</p>

      <h2>Thank you for supporting ACE.</h2>

      <p>
        Your payment is pending verification.
        <br />
        Once approved, your invoice will be generated and emailed to you.
      </p>

      <Link className="button" to="/">
        Back to Store
      </Link>
    </main>
  );
}

// ==========================================
// ADMIN LOGIN PAGE
// ==========================================
function AdminLoginPage() {
  const navigate = useNavigate();

  const handleLogin = (user) => {
    console.log('Admin logged in:', user);
    navigate('/admin');
  };

  return <AdminLogin onLogin={handleLogin} />;
}

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cart, setCart] = useState(null);

  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const products = await response.json();

        if (products.length > 0) {
          setProduct(products[0]);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Product fetch error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  return (
    <>
      {!isAdminPage && (
        <Header cartCount={cart ? 1 : 0} />
      )}

      {error && !isAdminPage ? (
        <main className="empty">
          <h2>Unable to connect to ACE Store.</h2>
          <p>
            Please make sure the backend server is running on port 5000.
          </p>
        </main>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <Home
                product={product}
                loading={loading}
              />
            }
          />

          <Route
            path="/product"
            element={
              <Product
                product={product}
                loading={loading}
                setCart={setCart}
              />
            }
          />

          <Route
            path="/checkout"
            element={<Checkout cart={cart} />}
          />

          <Route
            path="/order-success"
            element={<Success />}
          />

          <Route
            path="/admin/login"
            element={<AdminLoginPage />}
          />

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />
        </Routes>
      )}

      {!isAdminPage && (
        <footer>
          © 2026 ACE STORE · Black & White Edition
        </footer>
      )}
    </>
  );
}
