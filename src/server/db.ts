import {
  Restaurant,
  Branch,
  User,
  Table,
  MenuCategory,
  MenuItem,
  ModifierGroup,
  Order,
  CustomerSession,
  StaffRequest,
  Bill,
  OrderStatus,
  RequestType,
  PaymentMethod,
} from './types';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

export interface DatabaseState {
  restaurants: Restaurant[];
  branches: Branch[];
  users: User[];
  tables: Table[];
  categories: MenuCategory[];
  items: MenuItem[];
  orders: Order[];
  sessions: CustomerSession[];
  staff_requests: StaffRequest[];
  bills: Bill[];
  idempotency_keys: Record<string, { order_id: string; created_at: string }>;
}

let db: DatabaseState;

// Simple deterministic hash password helper
const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, 8);

export async function generateTableQR(slug: string, token: string): Promise<string> {
  const url = `/r/${slug}/t/${token}`;
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return svg;
  } catch (err) {
    return '';
  }
}

export async function initDatabase(): Promise<DatabaseState> {
  const restaurantId = 'rest-curry-room-01';
  const branchId = 'branch-main-01';

  const defaultRestaurant: Restaurant = {
    id: restaurantId,
    name: 'The Curry Room',
    slug: 'curry-room',
    owner_name: 'Vikram Malhotra',
    phone: '+91 98765 43210',
    email: 'owner@curryroom.com',
    address: '42 Heritage Boulevard, Connaught Place, New Delhi',
    logo: '🍛',
    description: 'Fine Indian dining offering heritage tandoori delicacies, royal biryanis, and artisanal breads.',
    currency: '₹',
    tax_rate_percent: 5, // 5% GST
    service_charge_percent: 5, // 5% Service Charge
    enable_transaction_camera: true,
    require_transaction_camera: false,
    is_active: true,
    onboarding_step: 8,
    is_live: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const defaultBranch: Branch = {
    id: branchId,
    restaurant_id: restaurantId,
    name: 'Flagship Dining',
    address: '42 Heritage Boulevard, Connaught Place, New Delhi',
    is_default: true,
  };

  const defaultUsers: User[] = [
    {
      id: 'usr-owner-01',
      email: 'owner@curryroom.com',
      password_hash: hashPassword('admin123'),
      name: 'Vikram Malhotra',
      role: 'OWNER',
      restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-manager-01',
      email: 'manager@curryroom.com',
      password_hash: hashPassword('manager123'),
      name: 'Priya Sharma',
      role: 'MANAGER',
      restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-waiter-01',
      email: 'waiter@curryroom.com',
      password_hash: hashPassword('waiter123'),
      name: 'Rahul Verma',
      role: 'WAITER',
      restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-kitchen-01',
      email: 'kitchen@curryroom.com',
      password_hash: hashPassword('kitchen123'),
      name: 'Chef Sanjeev',
      role: 'KITCHEN',
      restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
    },
  ];

  // 8 Tables across Floor 1 and Rooftop Terrace
  const tablesData = [
    { num: '01', cap: 2, sec: 'Floor 1', tok: 'T1CR' },
    { num: '02', cap: 4, sec: 'Floor 1', tok: 'T2CR' },
    { num: '03', cap: 4, sec: 'Floor 1', tok: 'T3CR' },
    { num: '04', cap: 6, sec: 'Floor 1', tok: 'T4CR' },
    { num: '05', cap: 2, sec: 'Rooftop Terrace', tok: 'T5CR' },
    { num: '06', cap: 4, sec: 'Rooftop Terrace', tok: 'T6CR' },
    { num: '07', cap: 6, sec: 'Rooftop Terrace', tok: 'T7CR' },
    { num: '08', cap: 8, sec: 'Rooftop Terrace', tok: 'T8CR' },
  ];

  const defaultTables: Table[] = [];
  for (const t of tablesData) {
    const qrSvg = await generateTableQR('curry-room', t.tok);
    defaultTables.push({
      id: `tbl-${t.num}`,
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_number: t.num,
      capacity: t.cap,
      section: t.sec,
      token: t.tok,
      is_active: true,
      qr_code_svg: qrSvg,
      created_at: new Date().toISOString(),
    });
  }

  // Categories
  const defaultCategories: MenuCategory[] = [
    { id: 'cat-starters', restaurant_id: restaurantId, name: 'Starters', display_order: 1, is_active: true },
    { id: 'cat-mains', restaurant_id: restaurantId, name: 'Main Course', display_order: 2, is_active: true },
    { id: 'cat-biryani', restaurant_id: restaurantId, name: 'Rice & Biryani', display_order: 3, is_active: true },
    { id: 'cat-breads', restaurant_id: restaurantId, name: 'Breads', display_order: 4, is_active: true },
    { id: 'cat-beverages', restaurant_id: restaurantId, name: 'Beverages', display_order: 5, is_active: true },
    { id: 'cat-desserts', restaurant_id: restaurantId, name: 'Desserts', display_order: 6, is_active: true },
  ];

  // Menu items with modifier groups
  const biryaniModifiers: ModifierGroup[] = [
    {
      id: 'mg-biryani-portion',
      item_id: 'item-chk-biryani',
      name: 'Portion Size',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      modifiers: [
        { id: 'mod-biry-reg', group_id: 'mg-biryani-portion', name: 'Regular (Serves 1-2)', price_adjustment: 0, is_default: true },
        { id: 'mod-biry-large', group_id: 'mg-biryani-portion', name: 'Jumbo Handi (Serves 3-4)', price_adjustment: 260 },
      ],
    },
    {
      id: 'mg-biryani-spice',
      item_id: 'item-chk-biryani',
      name: 'Spice Level',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      modifiers: [
        { id: 'mod-biry-mild', group_id: 'mg-biryani-spice', name: 'Mild & Fragrant', price_adjustment: 0 },
        { id: 'mod-biry-med', group_id: 'mg-biryani-spice', name: 'Medium Spice', price_adjustment: 0, is_default: true },
        { id: 'mod-biry-hot', group_id: 'mg-biryani-spice', name: 'Royal Spicy', price_adjustment: 0 },
      ],
    },
    {
      id: 'mg-biryani-addons',
      item_id: 'item-chk-biryani',
      name: 'Accompaniments',
      min_selections: 0,
      max_selections: 2,
      is_required: false,
      modifiers: [
        { id: 'mod-biry-boondi-raita', group_id: 'mg-biryani-addons', name: 'Extra Boondi Raita', price_adjustment: 60 },
        { id: 'mod-biry-salan', group_id: 'mg-biryani-addons', name: 'Mirchi Ka Salan', price_adjustment: 75 },
      ],
    },
  ];

  const naanModifiers: ModifierGroup[] = [
    {
      id: 'mg-naan-toppings',
      item_id: 'item-garlic-naan',
      name: 'Butter Finish',
      min_selections: 1,
      max_selections: 1,
      is_required: true,
      modifiers: [
        { id: 'mod-naan-reg-butter', group_id: 'mg-naan-toppings', name: 'Melted Amul Butter', price_adjustment: 0, is_default: true },
        { id: 'mod-naan-extra-butter', group_id: 'mg-naan-toppings', name: 'Extra Butter & Cilantro', price_adjustment: 20 },
        { id: 'mod-naan-cheese-stuff', group_id: 'mg-naan-toppings', name: 'Cheese Stuffed Layer', price_adjustment: 50 },
      ],
    },
  ];

  const defaultItems: MenuItem[] = [
    // Starters
    {
      id: 'item-paneer-tikka',
      restaurant_id: restaurantId,
      category_id: 'cat-starters',
      name: 'Paneer Tikka Angaare',
      description: 'Charcoal-grilled cottage cheese cubes marinated in Kashmiri deghi mirch and mustard oil, served with mint relish.',
      price: 360,
      is_veg: true,
      is_available: true,
      display_order: 1,
      modifier_groups: [],
    },
    {
      id: 'item-chicken-tikka',
      restaurant_id: restaurantId,
      category_id: 'cat-starters',
      name: 'Tandoori Chicken Tikka',
      description: 'Boneless tender chicken thigh chunks infused with hung curd, royal garam masala, and roasted in clay oven.',
      price: 420,
      is_veg: false,
      is_available: true,
      display_order: 2,
      modifier_groups: [],
    },

    // Mains
    {
      id: 'item-butter-chicken',
      restaurant_id: restaurantId,
      category_id: 'cat-mains',
      name: 'Old Delhi Butter Chicken',
      description: 'Succulent tandoori chicken simmered in a velvety slow-cooked tomato, cashew nut and butter gravy.',
      price: 490,
      is_veg: false,
      is_available: true,
      display_order: 1,
      modifier_groups: [],
    },
    {
      id: 'item-paneer-butter-masala',
      restaurant_id: restaurantId,
      category_id: 'cat-mains',
      name: 'Paneer Butter Masala',
      description: 'Fresh malai paneer steeped in a rich aromatic tomato-cashew reduction spiked with dried fenugreek leaves.',
      price: 440,
      is_veg: true,
      is_available: true,
      display_order: 2,
      modifier_groups: [],
    },
    {
      id: 'item-dal-makhani',
      restaurant_id: restaurantId,
      category_id: 'cat-mains',
      name: 'Dal Makhani Bukhara',
      description: 'Black urad lentils slow-cooked overnight for 18 hours with clarified butter and vine-ripened tomatoes.',
      price: 380,
      is_veg: true,
      is_available: true,
      display_order: 3,
      modifier_groups: [],
    },

    // Rice & Biryani
    {
      id: 'item-chk-biryani',
      restaurant_id: restaurantId,
      category_id: 'cat-biryani',
      name: 'Dum Pukht Chicken Biryani',
      description: 'Aged long-grain basmati rice and marinated chicken cooked sealed with dough, infused with saffron and kewra water.',
      price: 480,
      is_veg: false,
      is_available: true,
      display_order: 1,
      modifier_groups: biryaniModifiers,
    },
    {
      id: 'item-veg-biryani',
      restaurant_id: restaurantId,
      category_id: 'cat-biryani',
      name: 'Subz Dum Biryani',
      description: 'Garden fresh seasonal vegetables, paneer cubes, and aromatic saffron basmati rice cooked on slow charcoal heat.',
      price: 410,
      is_veg: true,
      is_available: true,
      display_order: 2,
      modifier_groups: [],
    },

    // Breads
    {
      id: 'item-garlic-naan',
      restaurant_id: restaurantId,
      category_id: 'cat-breads',
      name: 'Tandoori Garlic Naan',
      description: 'Hand-stretched leavened flatbread topped with minced roasted garlic, fresh coriander and farm butter.',
      price: 95,
      is_veg: true,
      is_available: true,
      display_order: 1,
      modifier_groups: naanModifiers,
    },
    {
      id: 'item-butter-roti',
      restaurant_id: restaurantId,
      category_id: 'cat-breads',
      name: 'Tandoori Butter Roti',
      description: 'Crisp whole wheat flatbread baked in the clay oven and brushed with pure desi ghee.',
      price: 45,
      is_veg: true,
      is_available: true,
      display_order: 2,
      modifier_groups: [],
    },

    // Beverages
    {
      id: 'item-fresh-lime',
      restaurant_id: restaurantId,
      category_id: 'cat-beverages',
      name: 'Fresh Lime Soda',
      description: 'Hand-pressed lemon juice with mint sprigs, rock salt and sparkling chilled club soda.',
      price: 130,
      is_veg: true,
      is_available: true,
      display_order: 1,
      modifier_groups: [],
    },
    {
      id: 'item-coke',
      restaurant_id: restaurantId,
      category_id: 'cat-beverages',
      name: 'Coca Cola Chilled (330ml)',
      description: 'Served in a cold glass tumbler with fresh lemon slice.',
      price: 80,
      is_veg: true,
      is_available: true,
      display_order: 2,
      modifier_groups: [],
    },

    // Desserts
    {
      id: 'item-gulab-jamun',
      restaurant_id: restaurantId,
      category_id: 'cat-desserts',
      name: 'Shahi Gulab Jamun (2 pcs)',
      description: 'Warm fried milk solids steeped in green cardamom and rose sugar syrup, topped with silver leaf and sliced pistachios.',
      price: 180,
      is_veg: true,
      is_available: true,
      display_order: 1,
      modifier_groups: [],
    },
  ];

  // Demo Orders in various states to make KDS and Admin instantly testable
  const now = Date.now();
  const defaultOrders: Order[] = [
    {
      id: 'ord-1042',
      order_number: '#1042',
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: 'tbl-04',
      table_number: '04',
      session_id: 'sess-demo-04',
      customer_name: 'Ananya S.',
      status: 'PLACED',
      special_instructions: 'Please make biryani extra spicy, separate raita.',
      items: [
        {
          id: 'oi-1',
          order_id: 'ord-1042',
          item_id: 'item-chk-biryani',
          item_name: 'Dum Pukht Chicken Biryani',
          quantity: 2,
          unit_price: 480,
          total_price: 960,
          is_veg: false,
          modifiers: [
            { modifier_id: 'mod-biry-reg', group_name: 'Portion Size', modifier_name: 'Regular (Serves 1-2)', price_adjustment: 0 },
            { modifier_id: 'mod-biry-hot', group_name: 'Spice Level', modifier_name: 'Royal Spicy', price_adjustment: 0 },
          ],
        },
        {
          id: 'oi-2',
          order_id: 'ord-1042',
          item_id: 'item-garlic-naan',
          item_name: 'Tandoori Garlic Naan',
          quantity: 2,
          unit_price: 95,
          total_price: 190,
          is_veg: true,
          modifiers: [
            { modifier_id: 'mod-naan-reg-butter', group_name: 'Butter Finish', modifier_name: 'Melted Amul Butter', price_adjustment: 0 },
          ],
        },
        {
          id: 'oi-3',
          order_id: 'ord-1042',
          item_id: 'item-coke',
          item_name: 'Coca Cola Chilled (330ml)',
          quantity: 2,
          unit_price: 80,
          total_price: 160,
          is_veg: true,
          modifiers: [],
        },
      ],
      subtotal: 1310,
      tax_amount: 65.5,
      total_amount: 1375.5,
      created_at: new Date(now - 3 * 60000).toISOString(),
      updated_at: new Date(now - 3 * 60000).toISOString(),
      status_history: [
        {
          id: 'sh-1',
          order_id: 'ord-1042',
          status: 'PLACED',
          notes: 'Customer placed order via Table 04 QR',
          timestamp: new Date(now - 3 * 60000).toISOString(),
        },
      ],
    },
    {
      id: 'ord-1041',
      order_number: '#1041',
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: 'tbl-02',
      table_number: '02',
      session_id: 'sess-demo-02',
      customer_name: 'Karan Mehra',
      status: 'PREPARING',
      special_instructions: 'No coriander on butter chicken.',
      items: [
        {
          id: 'oi-4',
          order_id: 'ord-1041',
          item_id: 'item-butter-chicken',
          item_name: 'Old Delhi Butter Chicken',
          quantity: 1,
          unit_price: 490,
          total_price: 490,
          is_veg: false,
          modifiers: [],
        },
        {
          id: 'oi-5',
          order_id: 'ord-1041',
          item_id: 'item-garlic-naan',
          item_name: 'Tandoori Garlic Naan',
          quantity: 3,
          unit_price: 95,
          total_price: 285,
          is_veg: true,
          modifiers: [],
        },
      ],
      subtotal: 775,
      tax_amount: 38.75,
      total_amount: 813.75,
      created_at: new Date(now - 14 * 60000).toISOString(),
      updated_at: new Date(now - 8 * 60000).toISOString(),
      status_history: [
        { id: 'sh-2', order_id: 'ord-1041', status: 'PLACED', timestamp: new Date(now - 14 * 60000).toISOString() },
        { id: 'sh-3', order_id: 'ord-1041', status: 'ACCEPTED', timestamp: new Date(now - 12 * 60000).toISOString() },
        { id: 'sh-4', order_id: 'ord-1041', status: 'PREPARING', notes: 'Chef started tandoori grill', timestamp: new Date(now - 8 * 60000).toISOString() },
      ],
    },
    {
      id: 'ord-1040',
      order_number: '#1040',
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: 'tbl-01',
      table_number: '01',
      session_id: 'sess-demo-01',
      status: 'ACCEPTED',
      items: [
        {
          id: 'oi-6',
          order_id: 'ord-1040',
          item_id: 'item-paneer-tikka',
          item_name: 'Paneer Tikka Angaare',
          quantity: 1,
          unit_price: 360,
          total_price: 360,
          is_veg: true,
          modifiers: [],
        },
        {
          id: 'oi-7',
          order_id: 'ord-1040',
          item_id: 'item-fresh-lime',
          item_name: 'Fresh Lime Soda',
          quantity: 2,
          unit_price: 130,
          total_price: 260,
          is_veg: true,
          modifiers: [],
        },
      ],
      subtotal: 620,
      tax_amount: 31,
      total_amount: 651,
      created_at: new Date(now - 9 * 60000).toISOString(),
      updated_at: new Date(now - 5 * 60000).toISOString(),
      status_history: [
        { id: 'sh-5', order_id: 'ord-1040', status: 'PLACED', timestamp: new Date(now - 9 * 60000).toISOString() },
        { id: 'sh-6', order_id: 'ord-1040', status: 'ACCEPTED', timestamp: new Date(now - 5 * 60000).toISOString() },
      ],
    },
    {
      id: 'ord-1039',
      order_number: '#1039',
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: 'tbl-03',
      table_number: '03',
      session_id: 'sess-demo-03',
      status: 'READY',
      items: [
        {
          id: 'oi-8',
          order_id: 'ord-1039',
          item_id: 'item-dal-makhani',
          item_name: 'Dal Makhani Bukhara',
          quantity: 1,
          unit_price: 380,
          total_price: 380,
          is_veg: true,
          modifiers: [],
        },
        {
          id: 'oi-9',
          order_id: 'ord-1039',
          item_id: 'item-butter-roti',
          item_name: 'Tandoori Butter Roti',
          quantity: 4,
          unit_price: 45,
          total_price: 180,
          is_veg: true,
          modifiers: [],
        },
      ],
      subtotal: 560,
      tax_amount: 28,
      total_amount: 588,
      created_at: new Date(now - 22 * 60000).toISOString(),
      updated_at: new Date(now - 2 * 60000).toISOString(),
      status_history: [
        { id: 'sh-7', order_id: 'ord-1039', status: 'PLACED', timestamp: new Date(now - 22 * 60000).toISOString() },
        { id: 'sh-8', order_id: 'ord-1039', status: 'ACCEPTED', timestamp: new Date(now - 20 * 60000).toISOString() },
        { id: 'sh-9', order_id: 'ord-1039', status: 'PREPARING', timestamp: new Date(now - 15 * 60000).toISOString() },
        { id: 'sh-10', order_id: 'ord-1039', status: 'READY', notes: 'Plated and ready on counter', timestamp: new Date(now - 2 * 60000).toISOString() },
      ],
    },
  ];

  // Demo staff requests
  const defaultStaffRequests: StaffRequest[] = [
    {
      id: 'req-01',
      restaurant_id: restaurantId,
      table_id: 'tbl-02',
      table_number: '02',
      request_type: 'WATER',
      status: 'PENDING',
      notes: 'Customer asked for chilled water refill.',
      created_at: new Date(now - 4 * 60000).toISOString(),
    },
    {
      id: 'req-02',
      restaurant_id: restaurantId,
      table_id: 'tbl-05',
      table_number: '05',
      request_type: 'REQUEST_BILL',
      status: 'PENDING',
      notes: 'Ready to pay via UPI.',
      created_at: new Date(now - 2 * 60000).toISOString(),
    },
  ];

  db = {
    restaurants: [defaultRestaurant],
    branches: [defaultBranch],
    users: defaultUsers,
    tables: defaultTables,
    categories: defaultCategories,
    items: defaultItems,
    orders: defaultOrders,
    sessions: [],
    staff_requests: defaultStaffRequests,
    bills: [
      {
        id: 'bill-1001',
        bill_number: '#B-1001',
        restaurant_id: restaurantId,
        table_id: 'tbl-02',
        table_number: '02',
        order_ids: ['ord-1041'],
        subtotal: 1040,
        tax_rate_percent: 5,
        tax_amount: 52,
        service_charge_percent: 5,
        service_charge_amount: 52,
        discount_amount: 0,
        grand_total: 1144,
        status: 'PAID',
        payment_method: 'UPI',
        transaction_image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520" fill="%23f8fafc"><rect width="100%" height="100%" fill="%23ffffff" rx="16"/><rect x="20" y="20" width="360" height="480" rx="12" fill="%23f8fafc" stroke="%23e2e8f0" stroke-width="2"/><text x="200" y="65" text-anchor="middle" font-family="monospace" font-size="18" font-weight="bold" fill="%230f172a">THE CURRY ROOM</text><text x="200" y="90" text-anchor="middle" font-family="monospace" font-size="12" fill="%2364748b">TRANSACTION PROOF (UPI / QR)</text><line x1="40" y1="110" x2="360" y2="110" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="45" y="140" font-family="monospace" font-size="12" fill="%23475569">Bill Number:</text><text x="355" y="140" text-anchor="end" font-family="monospace" font-size="12" font-weight="bold" fill="%230f172a">#B-1001</text><text x="45" y="170" font-family="monospace" font-size="12" fill="%23475569">Table:</text><text x="355" y="170" text-anchor="end" font-family="monospace" font-size="12" font-weight="bold" fill="%230f172a">Table 02</text><text x="45" y="200" font-family="monospace" font-size="12" fill="%23475569">Payment Channel:</text><text x="355" y="200" text-anchor="end" font-family="monospace" font-size="12" font-weight="bold" fill="%234f46e5">UPI PhonePe / GPay</text><text x="45" y="230" font-family="monospace" font-size="12" fill="%23475569">UTR / Txn Ref:</text><text x="355" y="230" text-anchor="end" font-family="monospace" font-size="12" font-weight="bold" fill="%230f172a">UPI-29481039824</text><line x1="40" y1="260" x2="360" y2="260" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="45" y="300" font-family="monospace" font-size="14" font-weight="bold" fill="%230f172a">TOTAL PAID:</text><text x="355" y="300" text-anchor="end" font-family="monospace" font-size="18" font-weight="bold" fill="%23059669">INR 1,144.00</text><circle cx="200" cy="380" r="35" fill="%23ecfdf5" stroke="%2310b981" stroke-width="2"/><path d="M188 380 l8 8 l16 -16" fill="none" stroke="%2310b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="440" text-anchor="middle" font-family="monospace" font-size="13" font-weight="bold" fill="%23059669">VERIFIED TRANSACTION PROOF</text><text x="200" y="470" text-anchor="middle" font-family="monospace" font-size="10" fill="%2394a3b8">Captured via In-Restaurant Staff Camera</text></svg>',
        transaction_reference: 'UPI Ref UTR: 29481039824 (PhonePe Verified)',
        settled_by: 'Rahul Verma (Waiter)',
        created_at: new Date(now - 25 * 60000).toISOString(),
        paid_at: new Date(now - 18 * 60000).toISOString(),
      },
    ],
    idempotency_keys: {},
  };

  return db;
}

export function getDatabase(): DatabaseState {
  if (!db) {
    throw new Error('Database not initialized! Call initDatabase() first.');
  }
  return db;
}

// Multi-tenant Query Helpers
export const dbQueries = {
  // Auth & Users
  findUserByEmail(email: string): User | undefined {
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id: string): User | undefined {
    return db.users.find(u => u.id === id);
  },
  createUser(user: User): User {
    db.users.push(user);
    return user;
  },
  getStaffByRestaurant(restaurantId: string): User[] {
    return db.users.filter(u => u.restaurant_id === restaurantId);
  },

  // Restaurant
  findRestaurantById(id: string): Restaurant | undefined {
    return db.restaurants.find(r => r.id === id);
  },
  findRestaurantBySlug(slug: string): Restaurant | undefined {
    return db.restaurants.find(r => r.slug.toLowerCase() === slug.toLowerCase());
  },
  createRestaurant(restaurant: Restaurant): Restaurant {
    db.restaurants.push(restaurant);
    return restaurant;
  },
  updateRestaurant(id: string, updates: Partial<Restaurant>): Restaurant | undefined {
    const idx = db.restaurants.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.restaurants[idx] = { ...db.restaurants[idx], ...updates, updated_at: new Date().toISOString() };
      return db.restaurants[idx];
    }
    return undefined;
  },

  // Tables
  getTables(restaurantId: string): Table[] {
    return db.tables.filter(t => t.restaurant_id === restaurantId);
  },
  findTableById(id: string): Table | undefined {
    return db.tables.find(t => t.id === id);
  },
  findTableByToken(restaurantId: string, token: string): Table | undefined {
    return db.tables.find(t => t.restaurant_id === restaurantId && t.token.toUpperCase() === token.toUpperCase());
  },
  createTable(table: Table): Table {
    db.tables.push(table);
    return table;
  },
  updateTable(id: string, updates: Partial<Table>): Table | undefined {
    const idx = db.tables.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.tables[idx] = { ...db.tables[idx], ...updates };
      return db.tables[idx];
    }
    return undefined;
  },
  deleteTable(id: string): boolean {
    const prev = db.tables.length;
    db.tables = db.tables.filter(t => t.id !== id);
    return db.tables.length < prev;
  },

  // Menu
  getCategories(restaurantId: string): MenuCategory[] {
    return db.categories
      .filter(c => c.restaurant_id === restaurantId && c.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  },
  createCategory(category: MenuCategory): MenuCategory {
    db.categories.push(category);
    return category;
  },
  updateCategory(id: string, updates: Partial<MenuCategory>): MenuCategory | undefined {
    const idx = db.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...updates };
      return db.categories[idx];
    }
    return undefined;
  },
  deleteCategory(id: string): boolean {
    const prev = db.categories.length;
    db.categories = db.categories.filter(c => c.id !== id);
    return db.categories.length < prev;
  },

  getItems(restaurantId: string): MenuItem[] {
    return db.items
      .filter(i => i.restaurant_id === restaurantId)
      .sort((a, b) => a.display_order - b.display_order);
  },
  findItemById(id: string): MenuItem | undefined {
    return db.items.find(i => i.id === id);
  },
  createItem(item: MenuItem): MenuItem {
    db.items.push(item);
    return item;
  },
  updateItem(id: string, updates: Partial<MenuItem>): MenuItem | undefined {
    const idx = db.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.items[idx] = { ...db.items[idx], ...updates };
      return db.items[idx];
    }
    return undefined;
  },
  deleteItem(id: string): boolean {
    const prev = db.items.length;
    db.items = db.items.filter(i => i.id !== id);
    return db.items.length < prev;
  },

  // Customer Sessions
  createOrGetSession(restaurantId: string, branchId: string, tableId: string, tableNumber: string): CustomerSession {
    const existing = db.sessions.find(s => s.restaurant_id === restaurantId && s.table_id === tableId && new Date(s.expires_at) > new Date());
    if (existing) return existing;

    const newSession: CustomerSession = {
      session_id: 'sess-' + Math.random().toString(36).substring(2, 9),
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: tableId,
      table_number: tableNumber,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 3600000).toISOString(), // 6 hours
    };
    db.sessions.push(newSession);
    return newSession;
  },

  // Orders
  getOrders(restaurantId: string): Order[] {
    return db.orders
      .filter(o => o.restaurant_id === restaurantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  findOrderById(id: string): Order | undefined {
    return db.orders.find(o => o.id === id);
  },
  findOrderByIdempotencyKey(key: string): Order | undefined {
    const entry = db.idempotency_keys[key];
    if (entry) {
      return db.orders.find(o => o.id === entry.order_id);
    }
    return undefined;
  },
  createOrder(order: Order, idempotencyKey?: string): Order {
    db.orders.unshift(order);
    if (idempotencyKey) {
      db.idempotency_keys[idempotencyKey] = { order_id: order.id, created_at: new Date().toISOString() };
    }
    return order;
  },
  updateOrderStatus(orderId: string, status: OrderStatus, changedBy?: string, notes?: string): Order | undefined {
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      order.status_history.push({
        id: 'sh-' + Math.random().toString(36).substring(2, 9),
        order_id: orderId,
        status,
        notes,
        changed_by: changedBy,
        timestamp: new Date().toISOString(),
      });
      return order;
    }
    return undefined;
  },

  // Staff Requests
  getStaffRequests(restaurantId: string): StaffRequest[] {
    return db.staff_requests
      .filter(r => r.restaurant_id === restaurantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  createStaffRequest(request: StaffRequest): StaffRequest {
    db.staff_requests.unshift(request);
    return request;
  },
  resolveStaffRequest(id: string): StaffRequest | undefined {
    const req = db.staff_requests.find(r => r.id === id);
    if (req) {
      req.status = 'RESOLVED';
      req.resolved_at = new Date().toISOString();
      return req;
    }
    return undefined;
  },

  // Bills & Payments
  getBills(restaurantId: string): Bill[] {
    return db.bills
      .filter(b => b.restaurant_id === restaurantId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  findBillById(id: string): Bill | undefined {
    return db.bills.find(b => b.id === id);
  },
  createBill(bill: Bill): Bill {
    db.bills.unshift(bill);
    return bill;
  },
  payBill(
    id: string,
    paymentMethod: PaymentMethod,
    transactionImage?: string,
    transactionReference?: string,
    settledBy?: string
  ): Bill | undefined {
    const bill = db.bills.find((b) => b.id === id);
    if (bill) {
      bill.status = 'PAID';
      bill.payment_method = paymentMethod;
      if (transactionImage) bill.transaction_image = transactionImage;
      if (transactionReference) bill.transaction_reference = transactionReference;
      if (settledBy) bill.settled_by = settledBy;
      bill.paid_at = new Date().toISOString();

      // Mark associated orders as COMPLETED
      for (const ordId of bill.order_ids) {
        const ord = db.orders.find((o) => o.id === ordId);
        if (ord && ord.status !== 'CANCELLED') {
          ord.status = 'COMPLETED';
          ord.updated_at = new Date().toISOString();
        }
      }
      return bill;
    }
    return undefined;
  },
  attachBillTransactionImage(
    id: string,
    transactionImage: string,
    transactionReference?: string
  ): Bill | undefined {
    const bill = db.bills.find((b) => b.id === id);
    if (bill) {
      bill.transaction_image = transactionImage;
      if (transactionReference !== undefined) bill.transaction_reference = transactionReference;
      return bill;
    }
    return undefined;
  },
};
