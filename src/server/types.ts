export type UserRole = 'OWNER' | 'MANAGER' | 'WAITER' | 'KITCHEN';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type RequestType =
  | 'CALL_WAITER'
  | 'WATER'
  | 'EXTRA_CUTLERY'
  | 'NAPKINS'
  | 'ASSISTANCE'
  | 'REQUEST_BILL'
  | 'OTHER';

export type RequestStatus = 'PENDING' | 'RESOLVED';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
export type PaymentStatus = 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  description: string;
  currency: string;
  tax_rate_percent: number; // e.g. 5 for 5%
  service_charge_percent: number;
  enable_transaction_camera?: boolean;
  require_transaction_camera?: boolean;
  is_active: boolean;
  onboarding_step: number; // 1-8
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  restaurant_id: string;
  name: string;
  address: string;
  is_default: boolean;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  restaurant_id: string;
  created_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  branch_id: string;
  table_number: string;
  capacity: number;
  section: string; // e.g. "Main Dining", "Floor 1", "Rooftop Terrace"
  token: string; // secure public token like "X8K29P"
  is_active: boolean;
  qr_code_svg?: string;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_adjustment: number;
  is_default?: boolean;
}

export interface ModifierGroup {
  id: string;
  item_id: string;
  name: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  modifiers: Modifier[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  image_url?: string;
  display_order: number;
  modifier_groups: ModifierGroup[];
}

export interface OrderItemModifierSelection {
  modifier_id: string;
  group_name: string;
  modifier_name: string;
  price_adjustment: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_veg: boolean;
  special_instructions?: string;
  modifiers: OrderItemModifierSelection[];
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  changed_by?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  order_number: string; // e.g. "#1042"
  restaurant_id: string;
  branch_id: string;
  table_id: string;
  table_number: string;
  session_id: string;
  customer_name?: string;
  status: OrderStatus;
  special_instructions?: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  status_history: OrderStatusHistoryItem[];
}

export interface CustomerSession {
  session_id: string;
  restaurant_id: string;
  branch_id: string;
  table_id: string;
  table_number: string;
  created_at: string;
  expires_at: string;
}

export interface StaffRequest {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_number: string;
  request_type: RequestType;
  status: RequestStatus;
  notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  restaurant_id: string;
  table_id: string;
  table_number: string;
  order_ids: string[];
  subtotal: number;
  tax_rate_percent: number;
  tax_amount: number;
  service_charge_percent: number;
  service_charge_amount: number;
  discount_amount: number;
  grand_total: number;
  status: 'OPEN' | 'PAID';
  payment_method?: PaymentMethod;
  transaction_image?: string;
  transaction_reference?: string;
  settled_by?: string;
  created_at: string;
  paid_at?: string;
}

export interface WebSocketMessage {
  type:
    | 'SUBSCRIBE'
    | 'ORDER_CREATED'
    | 'ORDER_STATUS_CHANGED'
    | 'STAFF_REQUEST_CREATED'
    | 'STAFF_REQUEST_RESOLVED'
    | 'BILL_REQUESTED'
    | 'PING'
    | 'PONG';
  restaurant_id?: string;
  data?: any;
}
