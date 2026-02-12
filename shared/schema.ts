import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

// === TABLE DEFINITIONS ===

// Admin Users (Separate from vendor profiles)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendor Profile (Linked to Auth User)
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // Link to auth user
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  passwordHash: text("password_hash"), // For credential-based vendor login (admin-created accounts)
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  businessType: text("business_type"), // chai_stall, salon, restaurant, etc.
  gstNumber: text("gst_number"),
  upiId: text("upi_id"), // For UPI QR payment
  whatsappEnabled: boolean("whatsapp_enabled").default(false), // Enable WhatsApp billing
  whatsappNumber: text("whatsapp_number"), // Business WhatsApp number
  googleReviewLink: text("google_review_link"),
  onboardingStatus: text("onboarding_status").default("pending"), // pending, active, rejected
  isAdmin: boolean("is_admin").default(false), // Admin flag for admin panel access
  preferredLanguage: text("preferred_language").default("hinglish"),
  subscriptionPlan: text("subscription_plan").default("starter"), // starter, growth, pro
  dashboardConfig: jsonb("dashboard_config").$type<{
    widgets: {
      id: string;
      visible: boolean;
      order: number;
    }[];
  }>(),
  // Multi-store configuration for vendors with multiple outlets
  stores: jsonb("stores").$type<{
    id: string;
    name: string;
    type: string; // dining, takeaway, etc.
    description?: string;
  }[]>(),
  promoVideoUrl: text("promo_video_url"), // Video reel for mobile ordering
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  gender: text("gender"), // male, female, other
  visitCount: integer("visit_count").default(0),
  totalSpend: numeric("total_spend").default("0"),
  favoriteItem: text("favorite_item"),
  optedOut: boolean("opted_out").default(false),
  lastVisit: timestamp("last_visit").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  size: text("size"), // regular, large, etc.
  category: text("category"),
  isAvailable: boolean("is_available").default(true),
  description: text("description"),
  imageUrl: text("image_url"),
  storeId: text("store_id"), // For multi-store vendors - links to profile.stores[].id
});

// Inventory
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  itemName: text("item_name").notNull(),
  currentStock: integer("current_stock").default(0),
  minStockLevel: integer("min_stock_level").default(10),
  unit: text("unit").notNull(), // kg, liters, units, etc.
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bills (Transactions)
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"), // Snapshot in case customer record deleted/changed
  items: jsonb("items").notNull(), // Array of { itemId, name, quantity, price, total }
  totalAmount: numeric("total_amount").notNull(),
  discount: numeric("discount").default("0"),
  extraCharges: numeric("extra_charges").default("0"),
  finalAmount: numeric("final_amount").notNull(),
  paymentMode: text("payment_mode").default("cash"), // cash, upi, card
  status: text("status").default("completed"), // completed, pending, cancelled
  whatsappMessageId: text("whatsapp_message_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tables (for QR ordering)
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  tableNumber: text("table_number").notNull(),
  qrCode: text("qr_code"), // QR code image URL or data
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table Orders (customer orders from QR scan)
export const tableOrders = pgTable("table_orders", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  tableId: integer("table_id").references(() => tables.id), // nullable for online orders
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  items: jsonb("items").notNull(), // Array of { itemId, name, quantity, price, total }
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").default("pending"), // pending, confirmed, preparing, ready, completed, cancelled
  orderSource: text("order_source").default("table_qr"), // table_qr, online, phone
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Messages for business communication
export const customerMessages = pgTable("customer_messages", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  type: text("type").notNull(), // promotional, follow_up, reminder, announcement, automated
  content: text("content").notNull(),
  recipientType: text("recipient_type").default("all"), // all, selected, segment
  recipientIds: jsonb("recipient_ids"), // Array of customer IDs if selected
  status: text("status").default("scheduled"), // scheduled, sent, failed
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message Automations
export const customerAutomations = pgTable("customer_automations", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // new_customer, after_purchase, days_inactive, nth_visit, birthday
  triggerValue: text("trigger_value"), // e.g., "7" for 7 days inactive, "3" for 3rd visit
  messageTemplate: text("message_template").notNull(),
  enabled: boolean("enabled").default(true),
  sentCount: integer("sent_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty Points
export const loyaltyPoints = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  points: integer("points").default(0),
  lifetimePoints: integer("lifetime_points").default(0),
  tier: text("tier").default("bronze"), // bronze, silver, gold, platinum
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty Rewards
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  pointsRequired: integer("points_required").notNull(),
  rewardValue: numeric("reward_value"),
  rewardType: text("reward_type").default("discount"), // discount, free_item
  isActive: boolean("is_active").default(true),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // info, warning, success
  isRead: boolean("is_read").default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contact Queries (from landing page contact form)
export const contactQueries = pgTable("contact_queries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  message: text("message").notNull(),
  status: text("status").default("new"), // new, read, replied, closed
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses (for expense & profit tracking)
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  category: text("category").notNull(), // raw_material, salary, rent, utilities, marketing, other
  description: text("description").notNull(),
  amount: numeric("amount").notNull(),
  paymentMode: text("payment_mode").default("cash"), // cash, upi, bank_transfer
  expenseDate: timestamp("expense_date").defaultNow(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff (for staff management)
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(), // manager, chef, waiter, delivery, cashier, helper
  salary: numeric("salary"),
  joinDate: timestamp("join_date").defaultNow(),
  status: text("status").default("active"), // active, inactive
  emergencyContact: text("emergency_contact"),
  address: text("address"),
  photoUrl: text("photo_url"), // Photo for face detection
  faceDescriptor: text("face_descriptor"), // JSON serialized Float32Array for face-api.js
  createdAt: timestamp("created_at").defaultNow(),
});

// Staff Attendance (for attendance tracking)
export const staffAttendance = pgTable("staff_attendance", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id),
  staffId: integer("staff_id").notNull().references(() => staff.id),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out"),
  status: text("status").default("present"), // present, absent, half_day, late
  manualOverride: boolean("manual_override").default(false),
  notes: text("notes"),
  date: timestamp("date").notNull(), // Date for the attendance record
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendor Feature Settings (Admin-controlled feature toggles per vendor)
export const vendorFeatures = pgTable("vendor_features", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => profiles.id).unique(),
  whatsappBilling: boolean("whatsapp_billing").default(true),
  loyalty: boolean("loyalty").default(true),
  inventory: boolean("inventory").default(true),
  tableQr: boolean("table_qr").default(true),
  onlineOrdering: boolean("online_ordering").default(true),
  kitchenDisplay: boolean("kitchen_display").default(true),
  staffManagement: boolean("staff_management").default(true),
  faceAttendance: boolean("face_attendance").default(true),
  expenseTracking: boolean("expense_tracking").default(true),
  analytics: boolean("analytics").default(true),
  messaging: boolean("messaging").default(true),
  aiSupport: boolean("ai_support").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by").references(() => adminUsers.id),
});

// RELATIONS
export const profilesRelations = relations(profiles, ({ many }) => ({
  customers: many(customers),
  menuItems: many(menuItems),
  inventory: many(inventory),
  bills: many(bills),
  loyaltyRewards: many(loyaltyRewards),
  notifications: many(notifications),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  profile: one(profiles, { fields: [customers.vendorId], references: [profiles.id] }),
  bills: many(bills),
  loyaltyPoints: one(loyaltyPoints, { fields: [customers.id], references: [loyaltyPoints.customerId] }),
}));

export const billsRelations = relations(bills, ({ one }) => ({
  profile: one(profiles, { fields: [bills.vendorId], references: [profiles.id] }),
  customer: one(customers, { fields: [bills.customerId], references: [customers.id] }),
}));

// === ZOD SCHEMAS ===

export const insertProfileSchema = createInsertSchema(profiles).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true, 
  lastVisit: true, 
  createdAt: true 
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ 
  id: true 
});

export const insertInventorySchema = createInsertSchema(inventory).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertBillSchema = createInsertSchema(bills).omit({ 
  id: true, 
  createdAt: true 
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ 
  id: true 
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
  createdAt: true
});

export const insertTableOrderSchema = createInsertSchema(tableOrders).omit({
  id: true,
  createdAt: true
});

export const insertCustomerMessageSchema = createInsertSchema(customerMessages).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  deliveredCount: true,
  failedCount: true
});

export const insertCustomerAutomationSchema = createInsertSchema(customerAutomations).omit({
  id: true,
  createdAt: true,
  sentCount: true
});

export const insertContactQuerySchema = createInsertSchema(contactQueries).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true
});

export const insertStaffAttendanceSchema = createInsertSchema(staffAttendance).omit({
  id: true,
  createdAt: true
});

export const insertVendorFeaturesSchema = createInsertSchema(vendorFeatures).omit({
  id: true,
  updatedAt: true
});

// === TYPE EXPORTS ===

export type AdminUser = typeof adminUsers.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Table = typeof tables.$inferSelect;
export type TableOrder = typeof tableOrders.$inferSelect;
export type CustomerMessage = typeof customerMessages.$inferSelect;
export type CustomerAutomation = typeof customerAutomations.$inferSelect;
export type ContactQuery = typeof contactQueries.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type StaffAttendance = typeof staffAttendance.$inferSelect;

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type InsertTableOrder = z.infer<typeof insertTableOrderSchema>;
export type InsertCustomerMessage = z.infer<typeof insertCustomerMessageSchema>;
export type InsertCustomerAutomation = z.infer<typeof insertCustomerAutomationSchema>;
export type InsertContactQuery = z.infer<typeof insertContactQuerySchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type InsertStaffAttendance = z.infer<typeof insertStaffAttendanceSchema>;
export type VendorFeatures = typeof vendorFeatures.$inferSelect;
export type InsertVendorFeatures = z.infer<typeof insertVendorFeaturesSchema>;
