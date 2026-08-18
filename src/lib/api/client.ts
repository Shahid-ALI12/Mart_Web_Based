const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: any; message: string }>('/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    request<any>(`/products${query}`)
    return request<any>(`/products${query}`)
  },

  // Categories
  getCategories: (storeId?: string) => {
    const params = storeId ? `?storeId=${storeId}` : ''
    return request<any>(`/categories${params}`)
  },

  // Cart
  getCart: (userId: string) =>
    request<any>(`/cart?userId=${userId}`),
  addToCart: (userId: string, productId: string, quantity: number = 1) =>
    request<any>('/cart', {
      method: 'POST',
      body: JSON.stringify({ userId, productId, quantity }),
    }),
  updateCartItem: (cartItemId: string, quantity: number) =>
    request<any>('/cart', {
      method: 'PUT',
      body: JSON.stringify({ cartItemId, quantity }),
    }),
  removeCartItem: (cartItemId: string, userId: string) =>
    request<any>(`/cart?cartItemId=${cartItemId}&userId=${userId}`, {
      method: 'DELETE',
    }),

  // Orders
  getOrders: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<any>(`/orders${query}`)
  },
  createOrder: (data: any) =>
    request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Stats
  getStats: () => request<any>('/stats'),

  // License
  getLicense: (storeId: string) =>
    request<any>(`/license?storeId=${storeId}`),

  // Coupons
  validateCoupon: (code: string, subtotal: number) =>
    request<any>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),
}
