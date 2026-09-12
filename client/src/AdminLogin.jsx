import React, { useState } from 'react';

const API_URL = 'https://ace-shop.onrender.com/api';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed.'
        );
      }

      // Only admins can access the admin panel.
      if (data.user?.role !== 'admin') {
        throw new Error(
          'Access denied. Admin account required.'
        );
      }

      // Save admin authentication details.
      localStorage.setItem(
        'ace_admin_token',
        data.token
      );

      localStorage.setItem(
        'ace_admin_user',
        JSON.stringify(data.user)
      );

      onLogin(data.user);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <div style={styles.logo}>
          ACE
        </div>

        <h1 style={styles.title}>
          Admin Login
        </h1>

        <p style={styles.subtitle}>
          ACE SmartCart Administration
        </p>


        <form onSubmit={handleLogin}>

          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            style={styles.input}
          />


          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            style={styles.input}
          />


          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading
              ? 'Signing in...'
              : 'Sign In'}
          </button>

        </form>


        <p style={styles.footer}>
          ACE • SmartCart Admin Panel
        </p>

      </div>

    </div>
  );
}


const styles = {

  page: {
    minHeight: '100vh',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box'
  },

  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    padding: '40px',
    borderRadius: '16px',
    boxSizing: 'border-box',
    boxShadow:
      '0 20px 60px rgba(255,255,255,0.08)'
  },

  logo: {
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '18px',
    marginBottom: '24px'
  },

  title: {
    margin: '0',
    fontSize: '30px',
    fontWeight: '800',
    color: '#000'
  },

  subtitle: {
    margin: '8px 0 30px',
    color: '#666',
    fontSize: '14px'
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#111'
  },

  input: {
    width: '100%',
    padding: '13px 14px',
    marginBottom: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none'
  },

  error: {
    background: '#f5f5f5',
    border: '1px solid #222',
    color: '#111',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '18px'
  },

  button: {
    width: '100%',
    padding: '14px',
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  footer: {
    marginTop: '28px',
    textAlign: 'center',
    color: '#888',
    fontSize: '12px'
  }

};