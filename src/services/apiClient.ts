import {
  Restaurant,
  Table,
  MenuCategory,
  MenuItem,
  Order,
  StaffRequest,
  Bill,
  OrderStatus,
  PaymentMethod,
} from '../types';

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('restodine_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('restodine_auth_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('restodine_auth_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    const errorMsg = json.error?.message || json.message || 'Request failed';
    throw new Error(errorMsg);
  }

  return json.data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any; restaurant: Restaurant }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: any) =>
    request<{ token: string; user: any; restaurant: Restaurant }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: any; restaurant: Restaurant }>('/auth/me'),

  // Restaurant & Settings
  getRestaurant: (id: string) => request<Restaurant>(`/restaurants/${id}`),
  updateSettings: (id: string, settings: Partial<Restaurant>) =>
    request<Restaurant>(`/restaurants/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  updateOnboarding: (id: string, step: number, is_live?: boolean) =>
    request<Restaurant>(`/restaurants/${id}/onboarding`, {
      method: 'PATCH',
      body: JSON.stringify({ step, is_live }),
    }),

  // Tables
  getTables: (restaurantId: string) => request<Table[]>(`/restaurants/${restaurantId}/tables`),
  createTable: (restaurantId: string, data: Partial<Table>) =>
    request<Table>(`/restaurants/${restaurantId}/tables`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTable: (restaurantId: string, tableId: string, data: Partial<Table>) =>
    request<Table>(`/restaurants/${restaurantId}/tables/${tableId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTable: (restaurantId: string, tableId: string) =>
    request<{ message: string }>(`/restaurants/${restaurantId}/tables/${tableId}`, {
      method: 'DELETE',
    }),
  regenerateTableQR: (restaurantId: string, tableId: string) =>
    request<Table>(`/restaurants/${restaurantId}/tables/${tableId}/regenerate-token`, {
      method: 'POST',
    }),

  // Menu
  getMenu: (restaurantId: string) =>
    request<{ categories: MenuCategory[]; items: MenuItem[] }>(`/restaurants/${restaurantId}/menu`),
  createCategory: (restaurantId: string, name: string, display_order?: number) =>
    request<MenuCategory>(`/restaurants/${restaurantId}/menu/categories`, {
      method: 'POST',
      body: JSON.stringify({ name, display_order }),
    }),
  updateCategory: (restaurantId: string, catId: string, data: Partial<MenuCategory>) =>
    request<MenuCategory>(`/restaurants/${restaurantId}/menu/categories/${catId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (restaurantId: string, catId: string) =>
    request<{ message: string }>(`/restaurants/${restaurantId}/menu/categories/${catId}`, {
      method: 'DELETE',
    }),
  createItem: (restaurantId: string, data: any) =>
    request<MenuItem>(`/restaurants/${restaurantId}/menu/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (restaurantId: string, itemId: string, data: Partial<MenuItem>) =>
    request<MenuItem>(`/restaurants/${restaurantId}/menu/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteItem: (restaurantId: string, itemId: string) =>
    request<{ message: string }>(`/restaurants/${restaurantId}/menu/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Staff
  getStaff: (restaurantId: string) => request<any[]>(`/restaurants/${restaurantId}/staff`),
  createStaff: (restaurantId: string, data: any) =>
    request<any>(`/restaurants/${restaurantId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Customer QR flow
  resolveTableSession: (slug: string, token: string) =>
    request<{ restaurant: any; table: any; session: any }>(`/customer/resolve/${slug}/${token}`),
  getCustomerMenu: (restaurantId: string) =>
    request<{ restaurant: any; categories: MenuCategory[]; items: MenuItem[] }>(
      `/customer/restaurants/${restaurantId}/menu`
    ),
  createOrder: (orderData: any, idempotencyKey: string) =>
    request<Order>('/customer/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderData),
    }),
  getOrder: (orderId: string) => request<Order>(`/customer/orders/${orderId}`),
  createStaffRequest: (data: { restaurant_id: string; table_id: string; request_type: string; notes?: string }) =>
    request<StaffRequest>('/customer/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Kitchen
  getKitchenStationToken: (restaurantId: string) =>
    request<{ token: string; user: any; restaurant: Restaurant }>('/kitchen/station-token', {
      method: 'POST',
      body: JSON.stringify({ restaurantId }),
    }),
  getKitchenOrders: async (restaurantId: string): Promise<Order[]> => {
    // If not authenticated, acquire kitchen station token first
    if (!getAuthToken()) {
      try {
        const session = await api.getKitchenStationToken(restaurantId);
        if (session?.token) {
          setAuthToken(session.token);
        }
      } catch {
        // Fallback to direct get
      }
    }
    return request<Order[]>(`/kitchen/orders/${restaurantId}`);
  },
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) =>
    request<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  // Waiter & Staff
  getStaffRequests: (restaurantId: string) => request<StaffRequest[]>(`/staff/requests/${restaurantId}`),
  resolveStaffRequest: (requestId: string) =>
    request<StaffRequest>(`/staff/requests/${requestId}/resolve`, {
      method: 'PATCH',
    }),

  // Billing & Payments
  getBills: (restaurantId: string) => request<Bill[]>(`/bills/${restaurantId}`),
  generateBill: (restaurantId: string, tableId: string, discount_amount?: number) =>
    request<Bill>('/bills/generate', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, table_id: tableId, discount_amount }),
    }),
  payBill: (
    billId: string,
    paymentMethod: PaymentMethod,
    transactionImage?: string,
    transactionReference?: string
  ) =>
    request<Bill>(`/bills/${billId}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        payment_method: paymentMethod,
        transaction_image: transactionImage,
        transaction_reference: transactionReference,
      }),
    }),
  attachBillTransactionImage: (
    billId: string,
    transactionImage: string,
    transactionReference?: string
  ) =>
    request<Bill>(`/bills/${billId}/transaction-image`, {
      method: 'PATCH',
      body: JSON.stringify({
        transaction_image: transactionImage,
        transaction_reference: transactionReference,
      }),
    }),

  // Analytics
  getAnalytics: (restaurantId: string) => request<any>(`/analytics/${restaurantId}`),

  // Demo
  resetDemoData: () => request<{ message: string }>('/demo/reset', { method: 'POST' }),
};
