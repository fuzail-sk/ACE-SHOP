import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = 'http://localhost:5000/api';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [screenshotOrder, setScreenshotOrder] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotLoading, setScreenshotLoading] =
    useState(false);

  // ==========================================
  // CHECK ADMIN LOGIN
  // ==========================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("ace_admin_user");

    const token =
      localStorage.getItem("ace_admin_token");

    if (!storedUser || !token) {
      navigate("/admin/login");
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser);

      if (parsedUser.role !== "admin") {
        localStorage.removeItem(
          "ace_admin_user"
        );

        localStorage.removeItem(
          "ace_admin_token"
        );

        navigate("/admin/login");
        return;
      }

      setUser(parsedUser);
    } catch {
      localStorage.removeItem(
        "ace_admin_user"
      );

      localStorage.removeItem(
        "ace_admin_token"
      );

      navigate("/admin/login");
    }
  }, [navigate]);

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = async () => {
    const token =
      localStorage.getItem(
        "ace_admin_token"
      );

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to fetch orders."
        );
      }

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Fetch orders error:",
        err
      );

      setError(
        err.message ||
          "Unable to load orders."
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
    localStorage.removeItem(
      "ace_admin_token"
    );

    localStorage.removeItem(
      "ace_admin_user"
    );

    navigate("/admin/login");
  };

  // ==========================================
  // VIEW PAYMENT SCREENSHOT
  // ==========================================

  const viewPaymentScreenshot = async (
    order
  ) => {
    const token =
      localStorage.getItem(
        "ace_admin_token"
      );

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      setScreenshotLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/orders/${order._id}/payment-screenshot`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        let message =
          "Unable to load payment screenshot.";

        try {
          const data =
            await response.json();

          message =
            data.message || message;
        } catch {
          // Response was not JSON.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      setScreenshotUrl(url);
      setScreenshotOrder(order);
    } catch (err) {
      console.error(
        "Payment screenshot error:",
        err
      );

      setError(
        err.message ||
          "Unable to load payment screenshot."
      );
    } finally {
      setScreenshotLoading(false);
    }
  };

  // ==========================================
  // CLOSE SCREENSHOT
  // ==========================================

  const closeScreenshot = () => {
    if (screenshotUrl) {
      window.URL.revokeObjectURL(
        screenshotUrl
      );
    }

    setScreenshotUrl("");
    setScreenshotOrder(null);
  };

  // ==========================================
  // APPROVE PAYMENT
  // ==========================================

  const approvePayment = async (
    orderId
  ) => {
    const token =
      localStorage.getItem(
        "ace_admin_token"
      );

    const confirmed =
      window.confirm(
        "Are you sure you want to approve this payment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(orderId);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/orders/${orderId}/payment`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              action: "approve",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to approve payment."
        );
      }

      setSuccess(
        "Payment approved successfully."
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        "Approve payment error:",
        err
      );

      setError(
        err.message ||
          "Unable to approve payment."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // REJECT PAYMENT
  // ==========================================

  const rejectPayment = async (
    orderId
  ) => {
    const token =
      localStorage.getItem(
        "ace_admin_token"
      );

    const reason =
      window.prompt(
        "Enter the reason for rejecting this payment:"
      );

    if (reason === null) {
      return;
    }

    const rejectionReason =
      reason.trim() ||
      "Payment could not be verified.";

    const confirmed =
      window.confirm(
        "Are you sure you want to reject this payment?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(orderId);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/orders/${orderId}/payment`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              action: "reject",
              rejectionReason,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reject payment."
        );
      }

      setSuccess(
        "Payment rejected successfully."
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        "Reject payment error:",
        err
      );

      setError(
        err.message ||
          "Unable to reject payment."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ==========================================
  // EXPORT ORDERS
  // ==========================================

  const exportOrders = async (
    filter = "all"
  ) => {
    const token =
      localStorage.getItem(
        "ace_admin_token"
      );

    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `${API_URL}/orders/export?filter=${filter}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        let message =
          "Unable to export orders.";

        try {
          const data =
            await response.json();

          message =
            data.message || message;
        } catch {
          // Response was not JSON.
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        filter === "paid"
          ? "ACE-Paid-Orders.xlsx"
          : "ACE-All-Orders.xlsx";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

      setSuccess(
        filter === "paid"
          ? "Paid orders exported successfully."
          : "All orders exported successfully."
      );
    } catch (err) {
      console.error(
        "Export orders error:",
        err
      );

      setError(
        err.message ||
          "Unable to export orders."
      );
    }
  };

  // ==========================================
  // COUNTS
  // ==========================================

  const pendingOrders =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "pending"
    );

  const approvedOrders =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "paid"
    );

  const rejectedOrders =
    orders.filter(
      (order) =>
        order.paymentStatus ===
        "failed"
    );

  const totalRevenue =
    approvedOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.totalAmount || 0
        ),
      0
    );

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleString("en-IN");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (!user || loading) {
    return (
      <main
        style={
          styles.loadingPage
        }
      >
        <h2>
          Loading ACE Admin...
        </h2>
      </main>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <main style={styles.page}>
      {/* ======================================
          TOP BAR
          ====================================== */}

      <div style={styles.topBar}>
        <div>
          <div style={styles.brand}>
            ACE STORE
          </div>

          <div
            style={
              styles.subtitle
            }
          >
            Senior Administration
          </div>
        </div>

        <div
          style={
            styles.topActions
          }
        >
          <button
            style={
              styles.refreshButton
            }
            onClick={
              fetchOrders
            }
          >
            Refresh
          </button>

          <button
            style={
              styles.logoutButton
            }
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ======================================
          WELCOME
          ====================================== */}

      <section
        style={styles.welcome}
      >
        <p
          style={
            styles.eyebrow
          }
        >
          ADMIN PANEL
        </p>

        <h1
          style={
            styles.heading
          }
        >
          Welcome,{" "}
          {user.name ||
            "Senior"}
        </h1>

        <p
          style={
            styles.description
          }
        >
          Manage ACE T-Shirt
          orders and verify
          manual UPI payments.
        </p>
      </section>

      {/* ======================================
          MESSAGES
          ====================================== */}

      {success && (
        <div
          style={
            styles.successMessage
          }
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={
            styles.errorMessage
          }
        >
          {error}
        </div>
      )}

      {/* ======================================
          STATISTICS
          ====================================== */}

      <section
        style={
          styles.statsGrid
        }
      >
        <div
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statLabel
            }
          >
            Pending Payments
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            {pendingOrders.length}
          </strong>
        </div>

        <div
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statLabel
            }
          >
            Approved Orders
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            {approvedOrders.length}
          </strong>
        </div>

        <div
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statLabel
            }
          >
            Rejected Payments
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            {rejectedOrders.length}
          </strong>
        </div>

        <div
          style={
            styles.statCard
          }
        >
          <span
            style={
              styles.statLabel
            }
          >
            Revenue
          </span>

          <strong
            style={
              styles.statNumber
            }
          >
            ₹
            {totalRevenue.toFixed(
              2
            )}
          </strong>
        </div>
      </section>

      {/* ======================================
          EXPORT
          ====================================== */}

      <section
        style={
          styles.exportSection
        }
      >
        <div>
          <p
            style={
              styles.eyebrow
            }
          >
            ORDER DATA
          </p>

          <h2
            style={
              styles.exportTitle
            }
          >
            Export Orders
          </h2>
        </div>

        <div
          style={
            styles.exportActions
          }
        >
          <button
            style={
              styles.secondaryButton
            }
            onClick={() =>
              exportOrders("all")
            }
          >
            Export All Orders
          </button>

          <button
            style={
              styles.primaryButton
            }
            onClick={() =>
              exportOrders("paid")
            }
          >
            Export Paid Orders
          </button>
        </div>
      </section>

      {/* ======================================
          PENDING ORDERS
          ====================================== */}

      <section
        style={
          styles.section
        }
      >
        <div
          style={
            styles.sectionHeader
          }
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              PAYMENT VERIFICATION
            </p>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Pending Orders
            </h2>
          </div>

          <span
            style={
              styles.badge
            }
          >
            {pendingOrders.length}{" "}
            Pending
          </span>
        </div>

        {pendingOrders.length ===
        0 ? (
          <div
            style={
              styles.emptyCard
            }
          >
            <div
              style={
                styles.emptyIcon
              }
            >
              ✓
            </div>

            <h3>
              No pending payments
            </h3>

            <p>
              All submitted
              payments have been
              processed.
            </p>
          </div>
        ) : (
          <div
            style={
              styles.ordersContainer
            }
          >
            {pendingOrders.map(
              (order) => {
                const item =
                  order.items?.[0];

                return (
                  <div
                    key={
                      order._id
                    }
                    style={
                      styles.orderCard
                    }
                  >
                    {/* ORDER HEADER */}

                    <div
                      style={
                        styles.orderHeader
                      }
                    >
                      <div>
                        <div
                          style={
                            styles.orderId
                          }
                        >
                          Order #
                          {order._id.slice(
                            -8
                          )}
                        </div>

                        <div
                          style={
                            styles.orderDate
                          }
                        >
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

                    {/* CUSTOMER */}

                    <div
                      style={
                        styles.infoGrid
                      }
                    >
                      <div
                        style={
                          styles.infoBlock
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          CUSTOMER
                        </span>

                        <strong>
                          {order
                            .customerDetails
                            ?.fullName ||
                            "Customer"}
                        </strong>
                      </div>

                      <div
                        style={
                          styles.infoBlock
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          EMAIL
                        </span>

                        <strong>
                          {order.customerEmail ||
                            "-"}
                        </strong>
                      </div>

                      <div
                        style={
                          styles.infoBlock
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          PHONE
                        </span>

                        <strong>
                          {order
                            .customerDetails
                            ?.phone ||
                            "-"}
                        </strong>
                      </div>

                      <div
                        style={
                          styles.infoBlock
                        }
                      >
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          TOTAL
                        </span>

                        <strong
                          style={
                            styles.amount
                          }
                        >
                          ₹
                          {Number(
                            order.totalAmount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* ITEM */}

                    <div
                      style={
                        styles.productsSection
                      }
                    >
                      <span
                        style={
                          styles.infoLabel
                        }
                      >
                        ORDER DETAILS
                      </span>

                      <div
                        style={
                          styles.productRow
                        }
                      >
                        <div>
                          <strong>
                            {item?.name ||
                              "ACE T-Shirt"}
                          </strong>

                          <span
                            style={
                              styles.itemMeta
                            }
                          >
                            Style:{" "}
                            {item
                              ?.neckType ||
                              "Collar"}
                            {" • "}
                            Size:{" "}
                            {item
                              ?.size ||
                              "-"}
                          </span>
                        </div>

                        <strong>
                          ₹
                          {Number(
                            item?.price ||
                              order.totalAmount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* PAYMENT SCREENSHOT */}

                    <div
                      style={
                        styles.screenshotSection
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.infoLabel
                          }
                        >
                          PAYMENT PROOF
                        </span>

                        <p
                          style={
                            styles.screenshotText
                          }
                        >
                          {order
                            .paymentScreenshot
                            ?.originalName ||
                            "Payment screenshot uploaded"}
                        </p>
                      </div>

                      <button
                        style={
                          styles.viewScreenshotButton
                        }
                        onClick={() =>
                          viewPaymentScreenshot(
                            order
                          )
                        }
                        disabled={
                          screenshotLoading
                        }
                      >
                        {screenshotLoading
                          ? "Loading..."
                          : "View Payment Screenshot"}
                      </button>
                    </div>

                    {/* ACTIONS */}

                    <div
                      style={
                        styles.actions
                      }
                    >
                      <button
                        style={{
                          ...styles.rejectButton,
                          opacity:
                            actionLoading ===
                            order._id
                              ? 0.6
                              : 1,
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
                          ? "Processing..."
                          : "✕ Reject Payment"}
                      </button>

                      <button
                        style={{
                          ...styles.approveButton,
                          opacity:
                            actionLoading ===
                            order._id
                              ? 0.6
                              : 1,
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
                          ? "Processing..."
                          : "✓ Approve Payment"}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* ======================================
          PROCESSED ORDERS
          ====================================== */}

      <section
        style={
          styles.section
        }
      >
        <div
          style={
            styles.sectionHeader
          }
        >
          <div>
            <p
              style={
                styles.eyebrow
              }
            >
              ORDER HISTORY
            </p>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Processed Orders
            </h2>
          </div>
        </div>

        {orders.filter(
          (order) =>
            order.paymentStatus !==
            "pending"
        ).length === 0 ? (
          <div
            style={
              styles.emptyCard
            }
          >
            <p>
              No processed orders
              yet.
            </p>
          </div>
        ) : (
          <div
            style={
              styles.historyTable
            }
          >
            <div
              style={
                styles.tableHeader
              }
            >
              <span>
                ORDER
              </span>

              <span>
                CUSTOMER
              </span>

              <span>
                AMOUNT
              </span>

              <span>
                PAYMENT
              </span>

              <span>
                STATUS
              </span>
            </div>

            {orders
              .filter(
                (order) =>
                  order.paymentStatus !==
                  "pending"
              )
              .map((order) => (
                <div
                  key={
                    order._id
                  }
                  style={
                    styles.tableRow
                  }
                >
                  <span>
                    #
                    {order._id.slice(
                      -8
                    )}
                  </span>

                  <span>
                    {order
                      .customerDetails
                      ?.fullName ||
                      "Customer"}
                  </span>

                  <span>
                    ₹
                    {Number(
                      order.totalAmount ||
                        0
                    ).toFixed(
                      2
                    )}
                  </span>

                  <span>
                    {order.paymentStatus ===
                    "paid"
                      ? "PAID"
                      : "FAILED"}
                  </span>

                  <span>
                    {order.orderStatus}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ======================================
          SCREENSHOT MODAL
          ====================================== */}

      {screenshotOrder &&
        screenshotUrl && (
          <div
            style={
              styles.modalOverlay
            }
            onClick={
              closeScreenshot
            }
          >
            <div
              style={
                styles.modal
              }
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div
                style={
                  styles.modalHeader
                }
              >
                <div>
                  <p
                    style={
                      styles.eyebrow
                    }
                  >
                    PAYMENT PROOF
                  </p>

                  <h2
                    style={
                      styles.modalTitle
                    }
                  >
                    Order #
                    {screenshotOrder._id.slice(
                      -8
                    )}
                  </h2>
                </div>

                <button
                  style={
                    styles.closeButton
                  }
                  onClick={
                    closeScreenshot
                  }
                >
                  ✕
                </button>
              </div>

              <div
                style={
                  styles.modalContent
                }
              >
                <img
                  src={
                    screenshotUrl
                  }
                  alt="Payment screenshot"
                  style={
                    styles.screenshotImage
                  }
                />
              </div>

              <div
                style={
                  styles.modalFooter
                }
              >
                <div>
                  <strong>
                    {screenshotOrder
                      .customerDetails
                      ?.fullName ||
                      "Customer"}
                  </strong>

                  <span
                    style={
                      styles.modalMeta
                    }
                  >
                    {screenshotOrder
                      .paymentScreenshot
                      ?.originalName ||
                      "Payment Screenshot"}
                  </span>
                </div>

                <button
                  style={
                    styles.primaryButton
                  }
                  onClick={
                    closeScreenshot
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    color: "#111",
    padding:
      "0 40px 60px",
    boxSizing: "border-box",
    fontFamily:
      "Arial, sans-serif",
  },

  loadingPage: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "Arial, sans-serif",
  },

  topBar: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "28px 0",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    borderBottom:
      "1px solid #ddd",
  },

  brand: {
    fontSize: "22px",
    fontWeight: "900",
    letterSpacing: "-1px",
  },

  subtitle: {
    fontSize: "12px",
    color: "#777",
    marginTop: "4px",
  },

  topActions: {
    display: "flex",
    gap: "10px",
  },

  refreshButton: {
    background: "#fff",
    color: "#111",
    border:
      "1px solid #111",
    borderRadius: "7px",
    padding:
      "10px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  logoutButton: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding:
      "10px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  welcome: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding:
      "45px 0 30px",
  },

  eyebrow: {
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "2px",
    color: "#777",
    margin:
      "0 0 8px",
  },

  heading: {
    fontSize: "36px",
    margin: "0",
    letterSpacing:
      "-1.5px",
  },

  description: {
    color: "#666",
    marginTop: "10px",
  },

  successMessage: {
    maxWidth: "1200px",
    margin:
      "0 auto 20px",
    background: "#e9e9e9",
    border:
      "1px solid #bbb",
    padding:
      "14px 16px",
    borderRadius: "8px",
    fontWeight: "600",
  },

  errorMessage: {
    maxWidth: "1200px",
    margin:
      "0 auto 20px",
    background: "#fff",
    border:
      "1px solid #111",
    padding:
      "14px 16px",
    borderRadius: "8px",
    fontWeight: "600",
  },

  statsGrid: {
    maxWidth: "1200px",
    margin:
      "0 auto 40px",
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "16px",
  },

  statCard: {
    background: "#fff",
    border:
      "1px solid #ddd",
    borderRadius: "12px",
    padding: "22px",
    display: "flex",
    flexDirection:
      "column",
    gap: "10px",
  },

  statLabel: {
    fontSize: "12px",
    textTransform:
      "uppercase",
    letterSpacing:
      "1px",
    color: "#777",
    fontWeight: "700",
  },

  statNumber: {
    fontSize: "28px",
    letterSpacing:
      "-1px",
  },

  exportSection: {
    maxWidth: "1200px",
    margin:
      "0 auto 40px",
    background: "#fff",
    border:
      "1px solid #ddd",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
  },

  exportTitle: {
    margin: 0,
    fontSize: "22px",
  },

  exportActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  secondaryButton: {
    background: "#fff",
    color: "#111",
    border:
      "1px solid #111",
    borderRadius: "7px",
    padding:
      "11px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButton: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding:
      "11px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  section: {
    maxWidth: "1200px",
    margin:
      "0 auto 45px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom:
      "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "28px",
    letterSpacing:
      "-1px",
  },

  badge: {
    background: "#000",
    color: "#fff",
    borderRadius: "999px",
    padding:
      "8px 14px",
    fontSize: "12px",
    fontWeight: "700",
  },

  ordersContainer: {
    display: "flex",
    flexDirection:
      "column",
    gap: "18px",
  },

  orderCard: {
    background: "#fff",
    border:
      "1px solid #ddd",
    borderRadius: "14px",
    padding: "24px",
  },

  orderHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom:
      "20px",
  },

  orderId: {
    fontSize: "18px",
    fontWeight: "800",
  },

  orderDate: {
    fontSize: "12px",
    color: "#777",
    marginTop: "5px",
  },

  pendingBadge: {
    background: "#000",
    color: "#fff",
    borderRadius: "999px",
    padding:
      "7px 12px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing:
      "0.8px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "16px",
    paddingBottom:
      "20px",
    borderBottom:
      "1px solid #eee",
  },

  infoBlock: {
    display: "flex",
    flexDirection:
      "column",
    gap: "7px",
    minWidth: 0,
  },

  infoLabel: {
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing:
      "1.5px",
    color: "#888",
  },

  amount: {
    fontSize: "20px",
  },

  productsSection: {
    padding:
      "20px 0",
    borderBottom:
      "1px solid #eee",
  },

  productRow: {
    marginTop: "12px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "14px",
    border:
      "1px solid #eee",
    borderRadius: "9px",
  },

  itemMeta: {
    display: "block",
    fontSize: "12px",
    color: "#777",
    marginTop: "5px",
  },

  screenshotSection: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    padding:
      "20px 0",
    borderBottom:
      "1px solid #eee",
  },

  screenshotText: {
    margin:
      "7px 0 0",
    color: "#555",
    fontSize: "13px",
  },

  viewScreenshotButton: {
    background: "#fff",
    color: "#111",
    border:
      "1px solid #111",
    borderRadius: "7px",
    padding:
      "10px 16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  actions: {
    display: "flex",
    justifyContent:
      "flex-end",
    gap: "10px",
    paddingTop:
      "20px",
  },

  rejectButton: {
    background: "#fff",
    color: "#111",
    border:
      "1px solid #111",
    borderRadius: "7px",
    padding:
      "11px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  approveButton: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    padding:
      "11px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  emptyCard: {
    background: "#fff",
    border:
      "1px solid #ddd",
    borderRadius: "12px",
    padding: "50px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin:
      "0 auto 15px",
    fontSize: "22px",
  },

  historyTable: {
    background: "#fff",
    border:
      "1px solid #ddd",
    borderRadius: "12px",
    overflow: "hidden",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "1.2fr 2fr 1fr 1fr 1.5fr",
    gap: "20px",
    padding: "15px 18px",
    background: "#000",
    color: "#fff",
    fontSize: "10px",
    letterSpacing:
      "1.2px",
    fontWeight: "800",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns:
      "1.2fr 2fr 1fr 1fr 1.5fr",
    gap: "20px",
    padding: "16px 18px",
    borderBottom:
      "1px solid #eee",
    alignItems: "center",
    fontSize: "13px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.78)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 9999,
  },

  modal: {
    background: "#fff",
    width: "min(900px, 100%)",
    maxHeight: "90vh",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    flexDirection:
      "column",
  },

  modalHeader: {
    padding: "18px 20px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    borderBottom:
      "1px solid #ddd",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
  },

  closeButton: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border:
      "1px solid #111",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "700",
  },

  modalContent: {
    padding: "20px",
    overflow: "auto",
    background: "#f7f7f7",
    display: "flex",
    justifyContent:
      "center",
  },

  screenshotImage: {
    maxWidth: "100%",
    maxHeight: "60vh",
    objectFit: "contain",
    display: "block",
    borderRadius: "8px",
    background: "#fff",
  },

  modalFooter: {
    padding: "16px 20px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    borderTop:
      "1px solid #ddd",
  },

  modalMeta: {
    display: "block",
    fontSize: "12px",
    color: "#777",
    marginTop: "4px",
  },
};