import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertCustomerSchema, 
  insertMenuItemSchema, 
  insertInventorySchema, 
  insertBillSchema, 
  insertLoyaltyRewardSchema,
  profiles,
  customers,
  menuItems,
  inventory,
  bills,
  loyaltyPoints,
  loyaltyRewards,
  notifications,
  type InsertProfile,
  type InsertCustomer,
  type InsertMenuItem,
  type InsertInventory,
  type InsertBill,
  type InsertLoyaltyReward
} from './schema';

export type { InsertProfile, InsertCustomer, InsertMenuItem, InsertInventory, InsertBill, InsertLoyaltyReward };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Profiles (Vendor Settings)
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: insertProfileSchema.omit({ userId: true, onboardingStatus: true }), // User ID inferred from session
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/profiles/me',
      input: z.object({
        businessName: z.string().optional(),
        ownerName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        businessType: z.string().optional(),
        gstNumber: z.string().optional(),
        upiId: z.string().optional(),
        whatsappEnabled: z.boolean().optional(),
        whatsappNumber: z.string().optional(),
        googleReviewLink: z.string().optional(),
        preferredLanguage: z.string().optional(),
        subscriptionPlan: z.string().optional(),
        dashboardConfig: z.any().optional(),
        stores: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          description: z.string().optional(),
        })).optional(),
        promoVideoUrl: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    },
  },

  // Customers (CRM)
  customers: {
    list: {
      method: 'GET' as const,
      path: '/api/customers',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof customers.$inferSelect & { loyalty?: typeof loyaltyPoints.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/customers/:id',
      responses: {
        200: z.custom<typeof customers.$inferSelect & { loyalty?: typeof loyaltyPoints.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/customers',
      input: insertCustomerSchema.omit({ vendorId: true }),
      responses: {
        201: z.custom<typeof customers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/customers/:id',
      input: insertCustomerSchema.partial().omit({ vendorId: true }),
      responses: {
        200: z.custom<typeof customers.$inferSelect>(),
      },
    },
  },

  // Menu Items
  menu: {
    list: {
      method: 'GET' as const,
      path: '/api/menu',
      responses: {
        200: z.array(z.custom<typeof menuItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/menu',
      input: insertMenuItemSchema.omit({ vendorId: true }),
      responses: {
        201: z.custom<typeof menuItems.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/menu/:id',
      input: insertMenuItemSchema.partial().omit({ vendorId: true }),
      responses: {
        200: z.custom<typeof menuItems.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/menu/:id',
      responses: {
        204: z.void(),
      },
    },
    extractFromImage: {
      method: 'POST' as const,
      path: '/api/menu/extract',
      input: z.object({
        imagePrompt: z.string().optional(), // Text description of menu items
        imageData: z.string().optional(), // Base64 encoded image/PDF data
        mimeType: z.string().optional(), // MIME type of uploaded file
      }),
      responses: {
        200: z.array(z.object({
          name: z.string(),
          price: z.string(),
          category: z.string().optional(),
          description: z.string().optional(),
        })),
      },
    },
  },

  // Inventory
  inventory: {
    list: {
      method: 'GET' as const,
      path: '/api/inventory',
      responses: {
        200: z.array(z.custom<typeof inventory.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/inventory',
      input: insertInventorySchema.omit({ vendorId: true }),
      responses: {
        201: z.custom<typeof inventory.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/inventory/:id',
      input: insertInventorySchema.partial().omit({ vendorId: true }),
      responses: {
        200: z.custom<typeof inventory.$inferSelect>(),
      },
    },
  },

  // Bills
  bills: {
    list: {
      method: 'GET' as const,
      path: '/api/bills',
      responses: {
        200: z.array(z.custom<typeof bills.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bills',
      input: insertBillSchema.omit({ vendorId: true }),
      responses: {
        201: z.custom<typeof bills.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/bills/:id',
      responses: {
        200: z.custom<typeof bills.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // Analytics
  analytics: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/analytics/dashboard',
      responses: {
        200: z.object({
          totalSales: z.number(),
          totalOrders: z.number(),
          totalCustomers: z.number(),
          pendingTableOrders: z.number(),
          activeTableOrders: z.number(),
          recentSales: z.array(z.object({ date: z.string(), amount: z.number() })),
          topItems: z.array(z.object({ name: z.string(), quantity: z.number() })),
          salesGrowth: z.number().optional(),
          ordersGrowth: z.number().optional(),
          customersGrowth: z.number().optional(),
          overallGrowth: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
