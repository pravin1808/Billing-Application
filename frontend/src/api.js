const API = '/api';

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = typeof data === 'object' && data?.message ? data.message : (data || res.statusText);
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Products
  getProducts: () => fetch(`${API}/products`).then(handleResponse),
  getProductsPaged: (page = 0, size = 10, sortBy = 'product_id', sortDir = 'asc', search = '') => {
    let url = `${API}/products/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return fetch(url).then(handleResponse);
  },
  getProduct: (id) => fetch(`${API}/product/${id}`).then(handleResponse),
  addProduct: (data) => fetch(`${API}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
  updateProduct: (id, data) => fetch(`${API}/product/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
  deleteProduct: (id) => fetch(`${API}/product/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Orders
  getOrders: (cancelled) => {
    let url = `${API}/orders`;
    if (typeof cancelled === 'boolean') {
      url += `?cancelled=${cancelled}`;
    }
    return fetch(url).then(handleResponse);
  },
  getOrdersPaged: (page = 0, size = 10, sortBy = 'orderId', sortDir = 'desc', search = '', cancelled = false) => {
    let url = `${API}/orders/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}&cancelled=${cancelled}`;
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return fetch(url).then(handleResponse);
  },
  getCancelledOrdersPaged: (page = 0, size = 10, sortBy = 'orderId', sortDir = 'desc', search = '') => {
    let url = `${API}/orders/cancelled/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return fetch(url).then(handleResponse);
  },
  getOrder: (id) => fetch(`${API}/order/${id}`).then(handleResponse),
  addOrder: (data) => fetch(`${API}/order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
  updateOrderProducts: (id, data) => fetch(`${API}/order/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Array.isArray(data) ? { orderedProducts: data, externalOrderedProducts: [] } : data) }).then(handleResponse),
  updateOrderCustomer: (id, data) => fetch(`${API}/order/${id}/customer`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handleResponse),
  cancelOrder: (id) => fetch(`${API}/order/${id}/cancel`, { method: 'PUT' }).then(handleResponse),
  deleteOrder: (id) => fetch(`${API}/order/${id}/cancel`, { method: 'PUT' }).then(handleResponse),
  printInvoice: (id) => fetch(`${API}/order/${id}/invoice/print`, { method: 'POST' }).then(handleResponse),
  getInvoiceUrl: (id) => `${API}/order/${id}/invoice`,

  // Settings & GST
  getInvoicePath: () => fetch(`${API}/order/invoicePath`).then(handleResponse),
  updateInvoiceNumber: (num) => fetch(`${API}/order/invoice/${num}`, { method: 'PUT' }).then(handleResponse),
  updateInvoicePath: (path) => fetch(`${API}/order/invoicePath`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoicePath: path }) }).then(handleResponse),
  selectFolderFromDisk: (current) => fetch(`/api/select-folder?current=${encodeURIComponent(current || '')}`).then(handleResponse),
  getGstRates: () => fetch(`${API}/gst`).then(handleResponse),
  addGstRate: (gst) => fetch(`${API}/gst/${gst}`, { method: 'POST' }).then(handleResponse),
  deleteGstRate: (id) => fetch(`${API}/gst/${id}`, { method: 'DELETE' }).then(handleResponse),

  // Sales
  getMonthlySales: (year, month) => fetch(`${API}/sales/month?year=${year}&month=${month}`).then(handleResponse),
  getDailySales: (date) => fetch(`${API}/sales/day?date=${date}`).then(handleResponse),
};

