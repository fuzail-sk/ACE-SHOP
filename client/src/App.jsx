import React, { useEffect, useState } from "react";

import AdminLogin from "./AdminLogin";

import AdminDashboard from "./AdminDashboard";

import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

const API_URL = "http://localhost:5000/api";

// ==========================================

// PRODUCT IMAGES

// ==========================================

const productImages = [
  {
    src: "/images/ace-tshirt-home.png",

    alt: "ACE T-Shirt",
  },

  {
    src: "/images/ace-tshirt-back.jpg",

    alt: "ACE T-Shirt Back View",
  },

  {
    src: "/images/ace-tshirt-logo.jpg",

    alt: "ACE T-Shirt Logo Close Up",
  },
];

// ==========================================

// VALIDATION FUNCTIONS

// ==========================================

function validateFullName(name) {
  const value = name.trim();

  if (!value) {
    return "Full name is required.";
  }

  if (value.length < 2) {
    return "Full name must contain at least 2 characters.";
  }

  if (value.length > 60) {
    return "Full name must not exceed 60 characters.";
  }

  const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]*$/u;

  if (!namePattern.test(value)) {
    return "Full name can contain only letters, spaces, apostrophes, dots and hyphens.";
  }

  return "";
}

function validateEmail(email) {
  const value = email.trim();

  if (!value) {
    return "Email address is required.";
  }

  if (value.length > 254) {
    return "Email address is too long.";
  }

  const emailPattern =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

  if (!emailPattern.test(value)) {
    return "Please enter a valid email address.";
  }

  return "";
}

function validatePhone(phone) {
  const value = phone.trim();

  if (!value) {
    return "Contact number is required.";
  }

  if (!/^\d{10}$/.test(value)) {
    return "Contact number must contain exactly 10 digits.";
  }

  if (!/^[6-9]\d{9}$/.test(value)) {
    return "Please enter a valid Indian mobile number.";
  }

  return "";
}

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

        <Link to="/checkout">Cart{cartCount > 0 ? ` (${cartCount})` : ""}</Link>
      </nav>
    </header>
  );
}

// ==========================================

// HOME

// ==========================================

function Home({
  product,

  loading,

  error,

  onRetry,
}) {
  if (error) {
    return (
      <main className="empty">
        <h2>Unable to connect to ACE Store.</h2>

        <p>Please try again in a moment.</p>

        <button className="button" type="button" onClick={onRetry}>
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="hero">
      <div>
        <p className="eyebrow">ACE OFFICIAL MERCH</p>

        <h1>
          Built for the
          <br />
          <span>ACE community.</span>
        </h1>

        <p className="lead">
          A minimal black-and-white store for the official ACE T-Shirt.
        </p>

        <Link className="button" to="/product">
          Shop ACE T-Shirt
        </Link>
      </div>

      <div
        className="hero-card"
        style={{
          padding: 0,

          overflow: "hidden",
        }}
      >
        <img
          src={productImages[0].src}
          alt="ACE T-Shirt"
          style={{
            width: "75%",

            height: "auto",

            aspectRatio: "auto",

            objectFit: "contain",

            display: "block",

            margin: "0 auto",
          }}
        />

        <div
          style={{
            margin: 0,

            padding: "18px 22px",
          }}
        >
          <strong>{product?.name || "ACE T-Shirt"}</strong>

          {loading && (
            <p
              style={{
                margin: "6px 0 0",

                fontSize: "13px",

                opacity: 0.6,
              }}
            >
              Loading product details...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

// ==========================================

// PRODUCT

// ==========================================

function Product({
  product,

  loading,

  setCart,
}) {
  const navigate = useNavigate();

  const [size, setSize] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

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

  const previousImage = () => {
    setCurrentImage((current) =>
      current === 0 ? productImages.length - 1 : current - 1,
    );
  };

  const nextImage = () => {
    setCurrentImage((current) =>
      current === productImages.length - 1 ? 0 : current + 1,
    );
  };

  const addToCart = () => {
    if (!size) return;

    setCart({
      product,

      neckType: "Collar",

      size,
    });

    navigate("/checkout");
  };

  return (
    <main className="product-page">
      {/* ==========================================

          SINGLE IMAGE CAROUSEL

          ========================================== */}

      <div
        className="product-image"
        style={{
          position: "relative",

          display: "flex",

          flexDirection: "column",

          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",

            width: "100%",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",
          }}
        >
          {/* LEFT ARROW */}

          <button
            type="button"
            onClick={previousImage}
            aria-label="Previous image"
            style={{
              position: "absolute",

              left: "12px",

              top: "50%",

              transform: "translateY(-50%)",

              zIndex: 2,

              width: "42px",

              height: "42px",

              borderRadius: "50%",

              border: "1px solid #222",

              background: "#fff",

              color: "#000",

              fontSize: "24px",

              lineHeight: "1",

              cursor: "pointer",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            ←
          </button>

          {/* MAIN IMAGE */}

          <img
            key={productImages[currentImage].src}
            src={productImages[currentImage].src}
            alt={productImages[currentImage].alt}
            style={{
              width: "100%",

              maxWidth: "560px",

              height: "520px",

              objectFit: "contain",

              display: "block",

              animation: "aceImageFade 0.25s ease",
            }}
          />

          {/* RIGHT ARROW */}

          <button
            type="button"
            onClick={nextImage}
            aria-label="Next image"
            style={{
              position: "absolute",

              right: "12px",

              top: "50%",

              transform: "translateY(-50%)",

              zIndex: 2,

              width: "42px",

              height: "42px",

              borderRadius: "50%",

              border: "1px solid #222",

              background: "#fff",

              color: "#000",

              fontSize: "24px",

              lineHeight: "1",

              cursor: "pointer",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            →
          </button>
        </div>

        {/* IMAGE POSITION */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "8px",

            marginTop: "12px",
          }}
        >
          {productImages.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setCurrentImage(index)}
              aria-label={`Show image ${index + 1}`}
              style={{
                width: "8px",

                height: "8px",

                padding: 0,

                border: "none",

                borderRadius: "50%",

                background: currentImage === index ? "#000" : "#c8c8c8",

                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* ==========================================

          PRODUCT DETAILS

          ========================================== */}

      <section>
        <p className="eyebrow">OFFICIAL ACE MERCH</p>

        <h2>{product.name}</h2>

        <div className="price">₹{product.price}</div>

        <p className="description">{product.description}</p>

        {/* COLLAR ONLY */}

        <h4>Style</h4>

        <div className="sizes">
          <button type="button" className="selected" disabled>
            Collar
          </button>
        </div>

        <h4>Size</h4>

        <div className="sizes">
          {product.sizes?.map((s) => (
            <button
              key={s}
              type="button"
              className={size === s ? "selected" : ""}
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
          disabled={!size}
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

  const [fullName, setFullName] = useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",

    email: "",

    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

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

  // ==========================================

  // LIVE FIELD VALIDATION

  // ==========================================

  const handleFullNameChange = (event) => {
    const value = event.target.value;

    setFullName(value);

    setFieldErrors((previous) => ({
      ...previous,

      fullName: validateFullName(value),
    }));

    setError("");
  };

  const handleEmailChange = (event) => {
    const value = event.target.value;

    setEmail(value);

    setFieldErrors((previous) => ({
      ...previous,

      email: validateEmail(value),
    }));

    setError("");
  };

  const handlePhoneChange = (event) => {
    const value = event.target.value.replace(
      /\D/g,

      "",
    );

    setPhone(value);

    setFieldErrors((previous) => ({
      ...previous,

      phone: validatePhone(value),
    }));

    setError("");
  };

  // ==========================================

  // PAYMENT SCREENSHOT

  // ==========================================

  const handlePaymentScreenshotChange = (event) => {
    const file = event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setPaymentScreenshot(null);

      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      setPaymentScreenshot(null);

      event.target.value = "";

      setError("Please upload a JPG, JPEG, PNG or WEBP payment screenshot.");

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPaymentScreenshot(null);

      event.target.value = "";

      setError("Payment screenshot must be smaller than 5 MB.");

      return;
    }

    setPaymentScreenshot(file);
  };

  // ==========================================

  // SUBMIT ORDER

  // ==========================================

  const handleSubmitOrder = async (event) => {
    event.preventDefault();

    setError("");

    const fullNameError = validateFullName(fullName);

    const emailError = validateEmail(email);

    const phoneError = validatePhone(phone);

    setFieldErrors({
      fullName: fullNameError,

      email: emailError,

      phone: phoneError,
    });

    if (fullNameError || emailError || phoneError) {
      setError("Please correct the highlighted details before submitting.");

      return;
    }

    if (!paymentScreenshot) {
      setError(
        "Please upload your payment screenshot before submitting the order.",
      );

      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append(
        "customerEmail",

        email.trim(),
      );

      formData.append(
        "items",

        JSON.stringify([
          {
            product: cart.product._id,

            neckType: "Collar",

            size: cart.size,
          },
        ]),
      );

      formData.append(
        "customerDetails",

        JSON.stringify({
          fullName: fullName.trim(),

          phone: phone.trim(),
        }),
      );

      formData.append(
        "paymentScreenshot",

        paymentScreenshot,
      );

      const response = await fetch(
        `${API_URL}/orders`,

        {
          method: "POST",

          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit order.");
      }

      navigate("/order-success");
    } catch (err) {
      console.error(
        "Order submission error:",

        err,
      );

      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="checkout">
      {/* ==========================================

          CUSTOMER DETAILS

          ========================================== */}

      <section>
        <p className="eyebrow">CHECKOUT</p>

        <h2>Complete your order</h2>

        <form className="form" onSubmit={handleSubmitOrder}>
          {/* FULL NAME */}

          <input
            placeholder="Full name"
            type="text"
            value={fullName}
            onChange={handleFullNameChange}
            onBlur={() =>
              setFieldErrors((previous) => ({
                ...previous,

                fullName: validateFullName(fullName),
              }))
            }
            maxLength={60}
            required
          />

          {fieldErrors.fullName && (
            <p className="error">{fieldErrors.fullName}</p>
          )}

          {/* EMAIL */}

          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() =>
              setFieldErrors((previous) => ({
                ...previous,

                email: validateEmail(email),
              }))
            }
            maxLength={254}
            required
          />

          {fieldErrors.email && <p className="error">{fieldErrors.email}</p>}

          {/* PHONE */}

          <input
            placeholder="10-digit mobile number"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() =>
              setFieldErrors((previous) => ({
                ...previous,

                phone: validatePhone(phone),
              }))
            }
            maxLength={10}
            required
          />

          {fieldErrors.phone && <p className="error">{fieldErrors.phone}</p>}

          {error && <p className="error">{error}</p>}
        </form>
      </section>

      {/* ==========================================

          PAYMENT

          ========================================== */}

      <aside className="payment">
        <h3>Order Summary</h3>

        <div
          style={{
            lineHeight: "1.5",

            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
            }}
          >
            {cart.product.name}
          </div>

          <div>Style: Collar</div>

          <div>Size: {cart.size}</div>

          <div>₹{total}</div>
        </div>

        <h3>UPI Payment</h3>

        <p
          style={{
            marginBottom: "14px",

            lineHeight: "1.5",
          }}
        >
          Scan the ACE store QR code and pay <b>₹{total}</b>.
        </p>

        {/* QR CODE */}

        <div
          className="qr"
          style={{
            width: "100%",

            height: "auto",

            minHeight: 0,

            boxSizing: "border-box",

            overflow: "hidden",

            display: "flex",

            flexDirection: "column",

            alignItems: "center",

            justifyContent: "center",

            padding: "16px",

            marginBottom: "16px",
          }}
        >
          <img
            src="/images/QR%20CODE%20_krish_Parmar.png"
            alt="ACE Store UPI Payment QR Code"
            onError={(event) => {
              const current = event.currentTarget.src;

              if (current.includes("QR%20CODE%20_krish_Parmar.png")) {
                event.currentTarget.src =
                  "/images/QR%20CODE%20_krish_Parmar.jpeg";

                return;
              }

              if (current.includes("QR%20CODE%20_krish_Parmar.jpeg")) {
                event.currentTarget.src =
                  "/images/QR%20CODE%20_krish_Parmar.jpg";

                return;
              }

              event.currentTarget.src = "/images/ace-upi-qr.jpeg";
            }}
            style={{
              width: "220px",

              maxWidth: "100%",

              aspectRatio: "1 / 1",

              height: "auto",

              objectFit: "contain",

              display: "block",

              borderRadius: "8px",
            }}
          />

          <p
            style={{
              marginTop: "12px",

              marginBottom: 0,

              textAlign: "center",

              fontSize: "13px",

              lineHeight: "1.4",
            }}
          >
            Scan with any UPI app to pay ₹{total}
          </p>
        </div>

        <p className="muted">
          After making the payment, upload your payment screenshot below. Your
          payment will be verified manually by the ACE senior/admin.
        </p>

        {/* ==========================================

            PAYMENT SCREENSHOT UPLOAD

            ========================================== */}

        <div
          style={{
            marginTop: "16px",

            padding: "16px",

            border: "1px solid #ddd",

            borderRadius: "12px",

            background: "#fff",
          }}
        >
          <h4
            style={{
              margin: "0 0 6px",

              fontSize: "17px",
            }}
          >
            Payment Proof
          </h4>

          <p
            style={{
              margin: "0 0 12px",

              fontSize: "13px",

              color: "#666",

              lineHeight: "1.5",
            }}
          >
            After payment, upload the screenshot of your ₹{total} payment.
          </p>

          <label
            style={{
              display: "block",

              width: "100%",

              boxSizing: "border-box",

              padding: "10px 12px",

              border: "1px dashed #999",

              borderRadius: "8px",

              cursor: "pointer",

              fontSize: "14px",

              background: "#fafafa",
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handlePaymentScreenshotChange}
              style={{
                width: "100%",

                cursor: "pointer",
              }}
            />
          </label>

          {paymentScreenshot && (
            <p
              style={{
                margin: "10px 0 0",

                fontSize: "13px",

                color: "#222",
              }}
            >
              ✓ {paymentScreenshot.name}
            </p>
          )}
        </div>

        {/* ==========================================

            ORDER SUMMARY

            ========================================== */}

        <div className="order-summary">
          <p
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              gap: "24px",

              margin: 0,
            }}
          >
            <span>T-Shirt</span>

            <b>₹{total}</b>
          </p>

          <hr />

          <p
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              gap: "24px",

              margin: 0,
            }}
          >
            <strong>Total :</strong>

            <strong>₹{total}</strong>
          </p>
        </div>

        {/* ==========================================

            SUBMIT

            ========================================== */}

        <button
          className="button full"
          type="button"
          onClick={handleSubmitOrder}
          disabled={submitting || !paymentScreenshot}
        >
          {"Submit Order"}
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
    console.log(
      "Admin logged in:",

      user,
    );

    navigate("/admin");
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

  const isAdminPage = location.pathname.startsWith("/admin");

  // ==========================================

  // FETCH PRODUCT

  // ==========================================

  const fetchProduct = async () => {
    try {
      setLoading(true);

      setError(false);

      console.log("Fetching ACE product...");

      const response = await fetch(
        `${API_URL}/products`,

        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(`Product API returned ${response.status}`);
      }

      const products = await response.json();

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error("No active products found");
      }

      setProduct(products[0]);
    } catch (err) {
      console.error(
        "Product fetch error:",

        err,
      );

      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  return (
    <>
      {/* ==========================================

          IMAGE TRANSITION ANIMATION

          ========================================== */}

      <style>
        {`

          @keyframes aceImageFade {

            from {

              opacity: 0;

              transform: scale(0.98);

            }



            to {

              opacity: 1;

              transform: scale(1);

            }

          }

        `}
      </style>

      {!isAdminPage && <Header cartCount={cart ? 1 : 0} />}

      <Routes>
        {/* ==========================================

            HOME

            ========================================== */}

        <Route
          path="/"
          element={
            <Home
              product={product}
              loading={loading}
              error={error}
              onRetry={fetchProduct}
            />
          }
        />

        {/* ==========================================

            PRODUCT

            ========================================== */}

        <Route
          path="/product"
          element={
            <Product product={product} loading={loading} setCart={setCart} />
          }
        />

        {/* ==========================================

            CHECKOUT

            ========================================== */}

        <Route path="/checkout" element={<Checkout cart={cart} />} />

        {/* ==========================================

            SUCCESS

            ========================================== */}

        <Route path="/order-success" element={<Success />} />

        {/* ==========================================

            ADMIN LOGIN

            ========================================== */}

        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ==========================================

            ADMIN DASHBOARD

            ========================================== */}

        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>

      {!isAdminPage && <footer>© 2026 ACE STORE</footer>}
    </>
  );
}
