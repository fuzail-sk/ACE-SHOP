import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://ace-shop.onrender.com/api';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [exportLoading, setExportLoading] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==========================================
  // CHECK ADMIN LOGIN
  // ==========================================
  useEffect(() => {
    const storedUser = localStorage.getItem('ace_admin_user');
    const token = localStorage.getItem('ace_admin_token');

    if (!storedUser || !token) {
      navigate('/admin/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser.role !== 'admin') {
        localStorage.removeItem('ace_admin_user');
        localStorage.removeItem('ace_admin_token');

        navigate('/admin/login');
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.removeItem('ace_admin_user');
      localStorage.removeItem('ace_admin_token');

      navigate('/admin/login');
    }
  }, [navigate]);

  // ==========================================
  // FETCH ALL ORDERS
  // ==========================================
  const fetchOrders = async () => {
    const token = localStorage.getItem('ace_admin_token');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/orders`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to fetch orders.'
        );
      }

      setOrders(data);
    } catch (err) {
      console.error('Fetch orders error:', err);

      setError(
        err.message || 'Unable to load orders.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD ORDERS
  // ==========================================
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    localStorage.removeItem('ace_admin_token');
    localStorage.removeItem('ace_admin_user');

    navigate('/admin/login');
  };

  // ==========================================
  // APPROVE PAYMENT
  // ==========================================
  const approvePayment = async (orderId) => {
    const token = localStorage.getItem('ace_admin_token');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to approve this payment?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(orderId);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${API_URL}/orders/${orderId}/payment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'approve'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to approve payment.'
        );
      }

      setSuccess(
        data.message ||
          'Payment approved successfully.'
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        'Approve payment error:',
        err
      );

      setError(
        err.message ||
          'Unable to approve payment.'
      );
    } finally {
      setActionLoading('');
    }
  };

  // ==========================================
  // REJECT PAYMENT
  // ==========================================
  const rejectPayment = async (orderId) => {
    const token = localStorage.getItem('ace_admin_token');

    if (!token) {
      navigate('/admin/login');
      return;
    }

    const reason = window.prompt(
      'Enter the reason for rejecting this payment:'
    );

    if (reason === null) {
      return;
    }

    const rejectionReason =
      reason.trim() ||
      'Payment could not be verified.';

    const confirmed = window.confirm(
      'Are you sure you want to reject this payment?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(orderId);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${API_URL}/orders/${orderId}/payment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'reject',
            rejectionReason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to reject payment.'
        );
      }

      setSuccess(
        data.message ||
          'Payment rejected successfully.'
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        'Reject payment error:',
        err
      );

      setError(
        err.message ||
          'Unable to reject payment.'
      );
    } finally {
      setActionLoading('');
    }
  };

  // ==========================================
  // EXPORT ORDERS TO EXCEL
  // ==========================================
  const exportOrders = async (filter = 'all') => {
    const token = localStorage.getItem(
      'ace_admin_token'
    );

    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      setExportLoading(filter);
      setError('');
      setSuccess('');

      const response = await fetch(
        `${API_URL}/orders/export?filter=${filter}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        let message = 'Unable to export orders.';

        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // Response was not JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;

      link.download =
        filter === 'paid'
          ? 'ACE-Paid-Orders.xlsx'
          : 'ACE-All-Orders.xlsx';

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setSuccess(
        filter === 'paid'
          ? 'Paid orders exported successfully.'
          : 'All orders exported successfully.'
      );
    } catch (err) {
      console.error(
        'Export orders error:',
        err
      );

      setError(
        err.message ||
          'Unable to export orders.'
      );
    } finally {
      setExportLoading('');
    }
  };

  // ==========================================
  // DASHBOARD COUNTS
  // ==========================================
  const pendingOrders = orders.filter(
    (order) =>
      order.paymentStatus === 'pending'
  );

  const approvedOrders = orders.filter(
    (order) =>
      order.paymentStatus === 'paid'
  );

  const rejectedOrders = orders.filter(
    (order) =>
      order.paymentStatus === 'failed'
  );

  const totalRevenue =
    approvedOrders.reduce(
      (total, order) =>
        total +
        Number(order.totalAmount || 0),
      0
    );

  const processedOrders = orders.filter(
    (order) =>
      order.paymentStatus !== 'pending'
  );

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date) => {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleString(
      'en-IN'
    );
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (!user || loading) {
    return (
      <main style={styles.loadingPage}>
        <h2>Loading ACE Admin...</h2>
      </main>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================
  return (
    <main style={styles.page}>

      {/* TOP BAR */}
      <div style={styles.topBar}>

        <div>
          <div style={styles.brand}>
            ACE STORE
          </div>

          <div style={styles.subtitle}>
            Senior Administration
          </div>
        </div>

        <div style={styles.topActions}>

          <button
            style={styles.refreshButton}
            onClick={fetchOrders}
          >
            🔄 Refresh
          </button>

          <button
            style={styles.refreshButton}
            onClick={() => exportOrders('all')}
            disabled={exportLoading !== ''}
          >
            {exportLoading === 'all'
              ? 'Exporting...'
              : '📥 Export All'}
          </button>

          <button
            style={styles.refreshButton}
            onClick={() => exportOrders('paid')}
            disabled={exportLoading !== ''}
          >
            {exportLoading === 'paid'
              ? 'Exporting...'
              : '📥 Export Paid'}
          </button>

          <button
            style={styles.logoutButton}
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </div>

      {/* WELCOME */}
      <section style={styles.welcome}>

        <p style={styles.eyebrow}>
          ADMIN PANEL
        </p>

        <h1 style={styles.heading}>
          Welcome, {user.name || 'Senior'}
        </h1>

        <p style={styles.description}>
          Manage ACE T-Shirt orders and
          verify manual UPI payments.
        </p>

      </section>

      {/* MESSAGES */}
      {success && (
        <div style={styles.successMessage}>
          ✓ {success}
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <section style={styles.statsGrid}>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>
            Pending Payments
          </span>

          <strong style={styles.statNumber}>
            {pendingOrders.length}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>
            Approved Orders
          </span>

          <strong style={styles.statNumber}>
            {approvedOrders.length}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>
            Rejected Payments
          </span>

          <strong style={styles.statNumber}>
            {rejectedOrders.length}
          </strong>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statLabel}>
            Revenue
          </span>

          <strong style={styles.statNumber}>
            ₹{totalRevenue.toFixed(2)}
          </strong>
        </div>

      </section>

      {/* PENDING ORDERS */}
      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <p style={styles.eyebrow}>
              PAYMENT VERIFICATION
            </p>

            <h2 style={styles.sectionTitle}>
              Pending Orders
            </h2>
          </div>

          <span style={styles.badge}>
            {pendingOrders.length} Pending
          </span>

        </div>

        {pendingOrders.length === 0 ? (

          <div style={styles.emptyCard}>

            <div style={styles.emptyIcon}>
              ✓
            </div>

            <h3>
              No pending payments
            </h3>

            <p>
              All submitted payments have
              been processed.
            </p>

          </div>

        ) : (

          <div style={styles.ordersContainer}>

            {pendingOrders.map((order) => {

              const item =
                order.items?.[0] || {};

              return (
                <div
                  key={order._id}
                  style={styles.orderCard}
                >

                  {/* ORDER HEADER */}
                  <div style={styles.orderHeader}>

                    <div>

                      <div style={styles.orderId}>
                        Order #
                        {order._id.slice(-8)}
                      </div>

                      <div style={styles.orderDate}>
                        {formatDate(
                          order.createdAt
                        )}
                      </div>

                    </div>

                    <div
                      style={
                        styles.pendingBadge
                      }
                    >
                      PAYMENT PENDING
                    </div>

                  </div>

                  {/* CUSTOMER INFORMATION */}
                  <div style={styles.infoGrid}>

                    <div style={styles.infoBlock}>
                      <span
                        style={styles.infoLabel}
                      >
                        CUSTOMER
                      </span>

                      <strong>
                        {order.customerDetails
                          ?.fullName ||
                          'Customer'}
                      </strong>
                    </div>

                    <div style={styles.infoBlock}>
                      <span
                        style={styles.infoLabel}
                      >
                        EMAIL
                      </span>

                      <strong>
                        {order.customerEmail ||
                          '-'}
                      </strong>
                    </div>

                    <div style={styles.infoBlock}>
                      <span
                        style={styles.infoLabel}
                      >
                        PHONE
                      </span>

                      <strong>
                        {order.customerDetails
                          ?.phone ||
                          '-'}
                      </strong>
                    </div>

                    <div style={styles.infoBlock}>
                      <span
                        style={styles.infoLabel}
                      >
                        TOTAL
                      </span>

                      <strong
                        style={styles.amount}
                      >
                        ₹
                        {Number(
                          order.totalAmount || 0
                        ).toFixed(2)}
                      </strong>
                    </div>

                  </div>

                  {/* PRODUCT INFORMATION */}
                  <div
                    style={styles.productsSection}
                  >

                    <span
                      style={styles.infoLabel}
                    >
                      ORDER DETAILS
                    </span>

                    <div
                      style={styles.productDetails}
                    >

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          PRODUCT
                        </span>

                        <strong>
                          {item.name ||
                            'ACE T-Shirt'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          GENDER
                        </span>

                        <strong>
                          {item.gender || '-'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          NECK TYPE
                        </span>

                        <strong>
                          {item.neckType ||
                            'Collar'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          SIZE
                        </span>

                        <strong>
                          {item.size || '-'}
                        </strong>
                      </div>

                      <div>
                        <span
                          style={
                            styles.detailLabel
                          }
                        >
                          PAYMENT
                        </span>

                        <strong>
                          {order.paymentMethod ||
                            'UPI'}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={styles.actions}>

                    <button
                      style={{
                        ...styles.rejectButton,
                        opacity:
                          actionLoading ===
                          order._id
                            ? 0.6
                            : 1
                      }}
                      onClick={() =>
                        rejectPayment(
                          order._id
                        )
                      }
                      disabled={
                        actionLoading ===
                        order._id
                      }
                    >
                      {actionLoading ===
                      order._id
                        ? 'Processing...'
                        : '✕ Reject Payment'}
                    </button>

                    <button
                      style={{
                        ...styles.approveButton,
                        opacity:
                          actionLoading ===
                          order._id
                            ? 0.6
                            : 1
                      }}
                      onClick={() =>
                        approvePayment(
                          order._id
                        )
                      }
                      disabled={
                        actionLoading ===
                        order._id
                      }
                    >
                      {actionLoading ===
                      order._id
                        ? 'Processing...'
                        : '✓ Approve Payment'}
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </section>

      {/* PROCESSED ORDERS */}
      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <p style={styles.eyebrow}>
              ORDER HISTORY
            </p>

            <h2 style={styles.sectionTitle}>
              Processed Orders
            </h2>
          </div>

        </div>

        {processedOrders.length === 0 ? (

          <div style={styles.emptyCard}>
            <p>
              No processed orders yet.
            </p>
          </div>

        ) : (

          <div style={styles.historyTable}>

            {/* TABLE HEADER */}
            <div style={styles.tableHeader}>

              <span>ORDER</span>
              <span>CUSTOMER</span>
              <span>PRODUCT</span>
              <span>AMOUNT</span>
              <span>PAYMENT</span>
              <span>STATUS</span>

            </div>

            {/* TABLE ROWS */}
            {processedOrders.map((order) => {

              const item =
                order.items?.[0] || {};

              return (
                <div
                  key={order._id}
                  style={styles.tableRow}
                >

                  <span>
                    #{order._id.slice(-8)}
                  </span>

                  <span>
                    {order.customerDetails
                      ?.fullName ||
                      'Customer'}
                  </span>

                  <span>
                    {item.name ||
                      'ACE T-Shirt'}
                  </span>

                  <span>
                    ₹
                    {Number(
                      order.totalAmount || 0
                    ).toFixed(2)}
                  </span>

                  <span>
                    {order.paymentStatus ===
                    'paid'
                      ? 'PAID'
                      : 'FAILED'}
                  </span>

                  <span>
                    {order.orderStatus}
                  </span>

                </div>
              );
            })}

          </div>

        )}

      </section>

    </main>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    color: '#111',
    padding: '0 40px 60px',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif'
  },

  loadingPage: {
    minHeight: '100vh',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif'
  },

  topBar: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '28px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #ddd',
    gap: '20px'
  },

  brand: {
    fontSize: '22px',
    fontWeight: '900',
    letterSpacing: '-1px'
  },

  subtitle: {
    fontSize: '12px',
    color: '#777',
    marginTop: '4px'
  },

  topActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },

  refreshButton: {
    background: '#fff',
    color: '#111',
    border: '1px solid #111',
    borderRadius: '7px',
    padding: '10px 18px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  logoutButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    padding: '10px 18px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  welcome: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '45px 0 30px'
  },

  eyebrow: {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '2px',
    color: '#777',
    margin: '0 0 8px'
  },

  heading: {
    fontSize: '36px',
    margin: '0',
    letterSpacing: '-1.5px'
  },

  description: {
    color: '#666',
    marginTop: '10px'
  },

  successMessage: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    background: '#e9e9e9',
    border: '1px solid #bbb',
    padding: '14px 16px',
    borderRadius: '8px',
    fontWeight: '600'
  },

  errorMessage: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    background: '#fff',
    border: '1px solid #111',
    padding: '14px 16px',
    borderRadius: '8px',
    fontWeight: '600'
  },

  statsGrid: {
    maxWidth: '1200px',
    margin: '0 auto 50px',
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '16px'
  },

  statCard: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '22px'
  },

  statLabel: {
    display: 'block',
    color: '#777',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '12px'
  },

  statNumber: {
    fontSize: '28px'
  },

  section: {
    maxWidth: '1200px',
    margin: '0 auto 50px'
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '20px'
  },

  sectionTitle: {
    margin: '0',
    fontSize: '28px'
  },

  badge: {
    background: '#000',
    color: '#fff',
    padding: '7px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700'
  },

  emptyCard: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '50px',
    textAlign: 'center'
  },

  emptyIcon: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px',
    fontWeight: '800'
  },

  ordersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  orderCard: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '14px',
    padding: '25px'
  },

  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '18px',
    borderBottom: '1px solid #eee',
    gap: '15px'
  },

  orderId: {
    fontSize: '16px',
    fontWeight: '800'
  },

  orderDate: {
    fontSize: '12px',
    color: '#777',
    marginTop: '5px'
  },

  pendingBadge: {
    border: '1px solid #111',
    padding: '7px 10px',
    borderRadius: '5px',
    fontSize: '10px',
    fontWeight: '800'
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    padding: '20px 0'
  },

  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },

  infoLabel: {
    fontSize: '10px',
    color: '#888',
    fontWeight: '800',
    letterSpacing: '1px'
  },

  amount: {
    fontSize: '20px'
  },

  productsSection: {
    borderTop: '1px solid #eee',
    paddingTop: '18px'
  },

  productDetails: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '18px',
    marginTop: '15px'
  },

  productDetails: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '18px',
    marginTop: '15px'
  },

  detailLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#888',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '5px'
  },

  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '22px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    flexWrap: 'wrap'
  },

  rejectButton: {
    background: '#fff',
    color: '#111',
    border: '1px solid #111',
    borderRadius: '7px',
    padding: '12px 18px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  approveButton: {
    background: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '7px',
    padding: '12px 18px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  historyTable: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '12px',
    overflow: 'auto'
  },

  tableHeader: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1.5fr 1.5fr 1fr 1fr 1.5fr',
    minWidth: '850px',
    gap: '15px',
    padding: '15px 20px',
    background: '#f0f0f0',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '1px'
  },

  tableRow: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1.5fr 1.5fr 1fr 1fr 1.5fr',
    minWidth: '850px',
    gap: '15px',
    padding: '17px 20px',
    borderTop: '1px solid #eee',
    fontSize: '13px',
    alignItems: 'center'
  }
};