import React, { useMemo, useState } from 'react';
import './index.css';

type OrderStatus = 'Pending' | 'In Progress' | 'Ready' | 'Delivered';
type ViewMode = 'customer' | 'admin';

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

type TailorOrder = {
  id: string;
  customerId: string;
  itemType: string;
  dueDate: string;
  status: OrderStatus;
  totalPrice: number;
  notes: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type OrderForm = {
  customerId: string;
  itemType: string;
  dueDate: string;
  status: OrderStatus;
  totalPrice: string;
  notes: string;
};

type ColumnKey = 'id' | 'customer' | 'item' | 'due' | 'status' | 'price' | 'notes';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'tailor123';

const statusOptions: OrderStatus[] = ['Pending', 'In Progress', 'Ready', 'Delivered'];

const allColumns: Array<{ key: ColumnKey; label: string }> = [
  { key: 'id', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'item', label: 'Item' },
  { key: 'due', label: 'Due Date' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price' },
  { key: 'notes', label: 'Notes' },
];

const seedCustomers: Customer[] = [
  { id: 'CUS-1001', name: 'Ava Johnson', phone: '555-1022', email: 'ava@example.com', address: '742 Pine St' },
  { id: 'CUS-1002', name: 'Liam Carter', phone: '555-8842', email: 'liam@example.com', address: '195 Oak Ave' },
  { id: 'CUS-1003', name: 'Noah Smith', phone: '555-3312', email: 'noah@example.com', address: '83 Maple Rd' },
];

const seedOrders: TailorOrder[] = [
  {
    id: 'ORD-1001',
    customerId: 'CUS-1001',
    itemType: 'Blazer',
    dueDate: '2026-03-02',
    status: 'In Progress',
    totalPrice: 140,
    notes: 'Navy wool, slim fit',
  },
  {
    id: 'ORD-1002',
    customerId: 'CUS-1002',
    itemType: 'Trouser Hem',
    dueDate: '2026-02-28',
    status: 'Ready',
    totalPrice: 35,
    notes: 'Taper below knee',
  },
  {
    id: 'ORD-1003',
    customerId: 'CUS-1003',
    itemType: 'Wedding Suit',
    dueDate: '2026-03-10',
    status: 'Pending',
    totalPrice: 420,
    notes: 'First fitting needed',
  },
];

const emptyCustomerForm: CustomerForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

const emptyOrderForm: OrderForm = {
  customerId: '',
  itemType: '',
  dueDate: '',
  status: 'Pending',
  totalPrice: '',
  notes: '',
};

function formatDate(value: string) {
  if (!value) return 'N/A';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');

  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [orders, setOrders] = useState<TailorOrder[]>(seedOrders);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'All' | OrderStatus>('All');

  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm);
  const [customerFormError, setCustomerFormError] = useState('');

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>(emptyOrderForm);
  const [orderFormError, setOrderFormError] = useState('');

  const [adminOrderSearch, setAdminOrderSearch] = useState('');
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState<'All' | OrderStatus>('All');
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(['id', 'customer', 'item', 'due', 'status', 'price']);

  const customerMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((customer) => map.set(customer.id, customer));
    return map;
  }, [customers]);

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const inProgress = orders.filter((order) => order.status === 'In Progress').length;
    const ready = orders.filter((order) => order.status === 'Ready').length;
    const delivered = orders.filter((order) => order.status === 'Delivered').length;

    return {
      totalOrders: orders.length,
      totalCustomers: customers.length,
      inProgress,
      ready,
      delivered,
      totalRevenue,
    };
  }, [orders, customers.length]);

  const customerPanelOrders = useMemo(() => {
    return orders
      .filter((order) => (customerStatusFilter === 'All' ? true : order.status === customerStatusFilter))
      .filter((order) => {
        if (!customerSearch.trim()) return true;
        const customerName = customerMap.get(order.customerId)?.name ?? '';
        const searchable = `${order.id} ${customerName} ${order.itemType}`.toLowerCase();
        return searchable.includes(customerSearch.trim().toLowerCase());
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [orders, customerMap, customerSearch, customerStatusFilter]);

  const adminFilteredOrders = useMemo(() => {
    return orders
      .filter((order) => (adminOrderStatusFilter === 'All' ? true : order.status === adminOrderStatusFilter))
      .filter((order) => {
        if (!adminOrderSearch.trim()) return true;
        const customerName = customerMap.get(order.customerId)?.name ?? '';
        const searchable = `${order.id} ${customerName} ${order.itemType} ${order.notes}`.toLowerCase();
        return searchable.includes(adminOrderSearch.trim().toLowerCase());
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [orders, customerMap, adminOrderSearch, adminOrderStatusFilter]);

  function resetCustomerForm() {
    setEditingCustomerId(null);
    setCustomerForm(emptyCustomerForm);
    setCustomerFormError('');
  }

  function resetOrderForm() {
    setEditingOrderId(null);
    setOrderForm(emptyOrderForm);
    setOrderFormError('');
  }

  function onAdminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (adminUser === ADMIN_USERNAME && adminPass === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setLoginError('');
      return;
    }
    setLoginError('Invalid admin credentials.');
  }

  function onAdminLogout() {
    setIsAdminLoggedIn(false);
    setAdminUser('');
    setAdminPass('');
    setLoginError('');
    resetCustomerForm();
    resetOrderForm();
  }

  function submitCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCustomerFormError('');

    if (!customerForm.name || !customerForm.phone || !customerForm.email || !customerForm.address) {
      setCustomerFormError('Fill all customer fields.');
      return;
    }

    const payload = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      email: customerForm.email.trim(),
      address: customerForm.address.trim(),
    };

    if (editingCustomerId) {
      setCustomers((prev) => prev.map((customer) => (customer.id === editingCustomerId ? { ...customer, ...payload } : customer)));
      resetCustomerForm();
      return;
    }

    const nextId = `CUS-${Date.now().toString().slice(-6)}`;
    setCustomers((prev) => [{ id: nextId, ...payload }, ...prev]);
    resetCustomerForm();
  }

  function editCustomer(customer: Customer) {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
    });
    setCustomerFormError('');
  }

  function deleteCustomer(customerId: string) {
    setCustomers((prev) => prev.filter((customer) => customer.id !== customerId));
    setOrders((prev) => prev.filter((order) => order.customerId !== customerId));
    if (editingCustomerId === customerId) {
      resetCustomerForm();
    }
  }

  function submitOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOrderFormError('');

    if (!orderForm.customerId || !orderForm.itemType || !orderForm.dueDate || !orderForm.totalPrice) {
      setOrderFormError('Fill all required order fields.');
      return;
    }

    const parsedPrice = Number(orderForm.totalPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setOrderFormError('Price must be a positive number.');
      return;
    }

    const payload: Omit<TailorOrder, 'id'> = {
      customerId: orderForm.customerId,
      itemType: orderForm.itemType.trim(),
      dueDate: orderForm.dueDate,
      status: orderForm.status,
      totalPrice: parsedPrice,
      notes: orderForm.notes.trim(),
    };

    if (editingOrderId) {
      setOrders((prev) => prev.map((order) => (order.id === editingOrderId ? { ...order, ...payload } : order)));
      resetOrderForm();
      return;
    }

    const maxNumeric = orders.reduce((max, order) => {
      const numeric = Number(order.id.replace('ORD-', ''));
      return Number.isNaN(numeric) ? max : Math.max(max, numeric);
    }, 1000);

    const nextId = `ORD-${maxNumeric + 1}`;
    setOrders((prev) => [{ id: nextId, ...payload }, ...prev]);
    resetOrderForm();
  }

  function editOrder(order: TailorOrder) {
    setEditingOrderId(order.id);
    setOrderForm({
      customerId: order.customerId,
      itemType: order.itemType,
      dueDate: order.dueDate,
      status: order.status,
      totalPrice: String(order.totalPrice),
      notes: order.notes,
    });
    setOrderFormError('');
  }

  function deleteOrder(orderId: string) {
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
    if (editingOrderId === orderId) {
      resetOrderForm();
    }
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  function toggleColumn(column: ColumnKey) {
    setVisibleColumns((prev) => {
      if (prev.includes(column)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== column);
      }
      return [...prev, column];
    });
  }

  function renderOrderCell(order: TailorOrder, column: ColumnKey) {
    const customerName = customerMap.get(order.customerId)?.name ?? 'Unknown customer';

    if (column === 'id') return order.id;
    if (column === 'customer') return customerName;
    if (column === 'item') return order.itemType;
    if (column === 'due') return formatDate(order.dueDate);
    if (column === 'status') {
      return (
        <select
          value={order.status}
          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
          className="status-select"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      );
    }
    if (column === 'price') return `$${order.totalPrice.toFixed(2)}`;
    return order.notes || '-';
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Tailor Order Tracking</h1>
        <p>Customer view for order tracking and admin view for full management.</p>

        <div className="view-switch">
          <button className={viewMode === 'customer' ? 'active-switch' : ''} onClick={() => setViewMode('customer')}>
            Customer Panel
          </button>
          <button className={viewMode === 'admin' ? 'active-switch' : ''} onClick={() => setViewMode('admin')}>
            Admin Panel
          </button>
        </div>
      </header>

      {viewMode === 'customer' && (
        <>
          <section className="metrics-grid">
            <article className="metric-card">
              <span>Total Orders</span>
              <strong>{metrics.totalOrders}</strong>
            </article>
            <article className="metric-card">
              <span>In Progress</span>
              <strong>{metrics.inProgress}</strong>
            </article>
            <article className="metric-card">
              <span>Ready</span>
              <strong>{metrics.ready}</strong>
            </article>
            <article className="metric-card">
              <span>Delivered</span>
              <strong>{metrics.delivered}</strong>
            </article>
          </section>

          <section className="panel">
            <div className="panel-title-row">
              <h2>Customer Orders</h2>
              <div className="filters">
                <input
                  type="search"
                  placeholder="Search by order, customer, item"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                <select
                  value={customerStatusFilter}
                  onChange={(e) => setCustomerStatusFilter(e.target.value as 'All' | OrderStatus)}
                >
                  <option value="All">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Item</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {customerPanelOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        No matching orders.
                      </td>
                    </tr>
                  ) : (
                    customerPanelOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{customerMap.get(order.customerId)?.name ?? 'Unknown customer'}</td>
                        <td>{order.itemType}</td>
                        <td>{formatDate(order.dueDate)}</td>
                        <td>{order.status}</td>
                        <td>{order.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {viewMode === 'admin' && !isAdminLoggedIn && (
        <section className="panel login-panel">
          <h2>Admin Login</h2>
          <p className="muted-text">Use your admin credentials to manage customers and order lists.</p>
          <form onSubmit={onAdminLogin} className="order-form">
            <label>
              Username
              <input type="text" value={adminUser} onChange={(e) => setAdminUser(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} required />
            </label>
            {loginError && <p className="form-error">{loginError}</p>}
            <button type="submit" className="primary-btn">
              Log In
            </button>
          </form>
          <p className="credential-hint">Demo credentials: admin / tailor123</p>
        </section>
      )}

      {viewMode === 'admin' && isAdminLoggedIn && (
        <>
          <section className="metrics-grid">
            <article className="metric-card">
              <span>Total Customers</span>
              <strong>{metrics.totalCustomers}</strong>
            </article>
            <article className="metric-card">
              <span>Total Orders</span>
              <strong>{metrics.totalOrders}</strong>
            </article>
            <article className="metric-card">
              <span>In Progress</span>
              <strong>{metrics.inProgress}</strong>
            </article>
            <article className="metric-card">
              <span>Revenue</span>
              <strong>${metrics.totalRevenue.toFixed(2)}</strong>
            </article>
          </section>

          <div className="admin-top-row">
            <h2>Admin Workspace</h2>
            <button className="secondary-btn" onClick={onAdminLogout}>
              Log Out
            </button>
          </div>

          <main className="content-grid admin-grid">
            <section className="panel">
              <div className="panel-title-row">
                <h2>{editingCustomerId ? `Edit ${editingCustomerId}` : 'Customer Details'}</h2>
                {editingCustomerId && (
                  <button className="text-btn" onClick={resetCustomerForm}>
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={submitCustomer} className="order-form">
                <label>
                  Full Name
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Address
                  <textarea
                    rows={2}
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </label>

                {customerFormError && <p className="form-error">{customerFormError}</p>}

                <button type="submit" className="primary-btn">
                  {editingCustomerId ? 'Save Customer' : 'Add Customer'}
                </button>
              </form>

              <div className="table-wrap top-gap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.email}</td>
                        <td>
                          <button className="text-btn" onClick={() => editCustomer(customer)}>
                            Edit
                          </button>{' '}
                          <button className="danger-btn" onClick={() => deleteCustomer(customer.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-title-row">
                <h2>{editingOrderId ? `Edit ${editingOrderId}` : 'Order Management'}</h2>
                {editingOrderId && (
                  <button className="text-btn" onClick={resetOrderForm}>
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={submitOrder} className="order-form">
                <label>
                  Customer
                  <select
                    value={orderForm.customerId}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, customerId: e.target.value }))}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.id})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Item Type
                  <input
                    type="text"
                    value={orderForm.itemType}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, itemType: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Due Date
                  <input
                    type="date"
                    value={orderForm.dueDate}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Status
                  <select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, status: e.target.value as OrderStatus }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Price
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={orderForm.totalPrice}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, totalPrice: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    rows={2}
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </label>

                {orderFormError && <p className="form-error">{orderFormError}</p>}

                <button type="submit" className="primary-btn">
                  {editingOrderId ? 'Save Order' : 'Add Order'}
                </button>
              </form>

              <div className="customizer-box top-gap">
                <h3>Customizable Order List</h3>
                <div className="filters">
                  <input
                    type="search"
                    placeholder="Search orders"
                    value={adminOrderSearch}
                    onChange={(e) => setAdminOrderSearch(e.target.value)}
                  />
                  <select
                    value={adminOrderStatusFilter}
                    onChange={(e) => setAdminOrderStatusFilter(e.target.value as 'All' | OrderStatus)}
                  >
                    <option value="All">All statuses</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="column-list">
                  {allColumns.map((column) => (
                    <label key={column.key} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="table-wrap top-gap">
                <table>
                  <thead>
                    <tr>
                      {allColumns
                        .filter((column) => visibleColumns.includes(column.key))
                        .map((column) => (
                          <th key={column.key}>{column.label}</th>
                        ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminFilteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={visibleColumns.length + 1} className="empty-row">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      adminFilteredOrders.map((order) => (
                        <tr key={order.id}>
                          {allColumns
                            .filter((column) => visibleColumns.includes(column.key))
                            .map((column) => (
                              <td key={`${order.id}-${column.key}`}>{renderOrderCell(order, column.key)}</td>
                            ))}
                          <td>
                            <button className="text-btn" onClick={() => editOrder(order)}>
                              Edit
                            </button>{' '}
                            <button className="danger-btn" onClick={() => deleteOrder(order.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
