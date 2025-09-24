import type { 
  User, InsertUser, 
  ServiceCenter, InsertServiceCenter,
  Customer, InsertCustomer,
  Category, InsertCategory,
  Product, InsertProduct,
  ServiceRequest, InsertServiceRequest,
  ServiceRequestFollowUp, InsertServiceRequestFollowUp,
  Warehouse, InsertWarehouse,
  SparePart, InsertSparePart,
  Inventory, InsertInventory,
  ProductInventory, InsertProductInventory,
  PartsTransfer, InsertPartsTransfer,
  ActivityLog, InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Service Centers
  getServiceCenters(): Promise<ServiceCenter[]>;
  getServiceCenter(id: string): Promise<ServiceCenter | undefined>;
  createServiceCenter(center: InsertServiceCenter): Promise<ServiceCenter>;
  updateServiceCenter(id: string, center: Partial<ServiceCenter>): Promise<ServiceCenter>;
  deleteServiceCenter(id: string): Promise<void>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Service Requests
  getServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, request: Partial<ServiceRequest>): Promise<ServiceRequest>;
  deleteServiceRequest(id: string): Promise<void>;
  
  // Service Request Follow-ups
  getServiceRequestFollowUps(serviceRequestId: string): Promise<ServiceRequestFollowUp[]>;
  getServiceRequestFollowUp(id: string): Promise<ServiceRequestFollowUp | undefined>;
  createServiceRequestFollowUp(followUp: InsertServiceRequestFollowUp): Promise<ServiceRequestFollowUp>;
  updateServiceRequestFollowUp(id: string, followUp: Partial<ServiceRequestFollowUp>): Promise<ServiceRequestFollowUp>;
  deleteServiceRequestFollowUp(id: string): Promise<void>;
  
  // Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<Warehouse>): Promise<Warehouse>;
  deleteWarehouse(id: string): Promise<void>;
  
  // Spare Parts
  getSpareParts(): Promise<SparePart[]>;
  getSparePart(id: string): Promise<SparePart | undefined>;
  createSparePart(sparePart: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, sparePart: Partial<SparePart>): Promise<SparePart>;
  deleteSparePart(id: string): Promise<void>;
  
  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<Inventory>): Promise<Inventory>;
  deleteInventoryItem(id: string): Promise<void>;
  
  // Product Inventory
  getProductInventory(id: string): Promise<ProductInventory | undefined>;
  createProductInventoryItem(item: InsertProductInventory): Promise<ProductInventory>;
  updateProductInventoryItem(id: string, item: Partial<ProductInventory>): Promise<ProductInventory>;
  deleteProductInventoryItem(id: string): Promise<void>;
  
  // Parts Transfers
  getPartsTransfers(): Promise<PartsTransfer[]>;
  getPartsTransfer(id: string): Promise<PartsTransfer | undefined>;
  createPartsTransfer(transfer: InsertPartsTransfer): Promise<PartsTransfer>;
  updatePartsTransfer(id: string, transfer: Partial<PartsTransfer>): Promise<PartsTransfer>;
  deletePartsTransfer(id: string): Promise<void>;
  
  // Activity Logs
  getActivityLogs(): Promise<ActivityLog[]>;
  getActivityLog(id: string): Promise<ActivityLog | undefined>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Additional methods
  createUserApproval(approvalData: any): Promise<any>;
  getUserApprovals(userId: string): Promise<any[]>;
  getPendingUsers(): Promise<User[]>;
  approveUser(userId: string, approvalData: any): Promise<User>;
  getUsersByWarehouse(warehouseId: string): Promise<User[]>;
  getWarehouseSpareParts(warehouseId: string): Promise<any[]>;
}
import { db } from "./db";
import { 
  users, serviceCenters, customers, categories, products, 
  serviceRequests, serviceRequestFollowUps, warehouses, 
  spareParts, inventory, productInventory, partsTransfers, 
  activityLogs, userApprovals
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Service Centers
  getAllServiceCenters(): Promise<ServiceCenter[]>;
  getServiceCenter(id: string): Promise<ServiceCenter | undefined>;
  createServiceCenter(center: InsertServiceCenter): Promise<ServiceCenter>;
  updateServiceCenter(id: string, center: Partial<InsertServiceCenter>): Promise<ServiceCenter>;
  deleteServiceCenter(id: string): Promise<void>;

  // Customers
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Service Requests
  getAllServiceRequests(): Promise<ServiceRequest[]>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, request: Partial<InsertServiceRequest>): Promise<ServiceRequest>;
  deleteServiceRequest(id: string): Promise<void>;

  // Service Request Follow-ups
  getServiceRequestFollowUps(serviceRequestId: string): Promise<ServiceRequestFollowUp[]>;
  createServiceRequestFollowUp(followUp: InsertServiceRequestFollowUp): Promise<ServiceRequestFollowUp>;

  // Warehouses
  getAllWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse>;
  deleteWarehouse(id: string): Promise<void>;

  // Dashboard Stats
  getDashboardStats(): Promise<any>;
  getRecentServiceRequests(): Promise<any[]>;
  getRecentActivities(): Promise<ActivityLog[]>;

  // Activity Logs
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;

    // Product Inventory
  getAllProductInventory(): Promise<ProductInventory[]>;
  getProductInventory(id: string): Promise<ProductInventory | undefined>;
  createProductInventory(inventoryData: InsertProductInventory): Promise<ProductInventory>;
  updateProductInventory(id: string, inventoryData: Partial<InsertProductInventory>): Promise<ProductInventory>;
  deleteProductInventory(id: string): Promise<void>;

  // User Approvals
  createUserApproval(approvalData: any): Promise<any>;
  getUserApprovals(userId: string): Promise<any[]>;
  getPendingUsers(): Promise<User[]>;
  approveUser(userId: string, approvalData: any): Promise<User>;
  getUsersByWarehouse(warehouseId: string): Promise<User[]>;
  getWarehouseSpareParts(warehouseId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database connection handled by db.ts
  }


  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Service Centers
  async getAllServiceCenters(): Promise<ServiceCenter[]> {
    return await db.select().from(serviceCenters).orderBy(desc(serviceCenters.createdAt));
  }

  async getServiceCenter(id: string): Promise<ServiceCenter | undefined> {
    const [center] = await db.select().from(serviceCenters).where(eq(serviceCenters.id, id));
    return center || undefined;
  }

  async createServiceCenter(centerData: InsertServiceCenter): Promise<ServiceCenter> {
    const [center] = await db.insert(serviceCenters).values(centerData).returning();
    return center;
  }

  async updateServiceCenter(id: string, centerData: Partial<InsertServiceCenter>): Promise<ServiceCenter> {
    const [updatedCenter] = await db
      .update(serviceCenters)
      .set({ ...centerData, updatedAt: new Date() })
      .where(eq(serviceCenters.id, id))
      .returning();
    
    if (!updatedCenter) throw new Error('Service center not found');
    return updatedCenter;
  }

  async deleteServiceCenter(id: string): Promise<void> {
    await db.delete(serviceCenters).where(eq(serviceCenters.id, id));
  }

  // Customers
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    
    if (!updatedCustomer) throw new Error('Customer not found');
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    
    if (!updatedCategory) throw new Error('Category not found');
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) throw new Error('Product not found');
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Service Requests
  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request || undefined;
  }

  async createServiceRequest(requestData: InsertServiceRequest): Promise<ServiceRequest> {
    const [request] = await db.insert(serviceRequests).values(requestData).returning();
    return request;
  }

  async updateServiceRequest(id: string, requestData: Partial<InsertServiceRequest>): Promise<ServiceRequest> {
    const [updatedRequest] = await db
      .update(serviceRequests)
      .set({ ...requestData, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    
    if (!updatedRequest) throw new Error('Service request not found');
    return updatedRequest;
  }

  async deleteServiceRequest(id: string): Promise<void> {
    await db.delete(serviceRequests).where(eq(serviceRequests.id, id));
  }

  // Service Request Follow-ups
  async getServiceRequestFollowUps(serviceRequestId: string): Promise<ServiceRequestFollowUp[]> {
    return await db.select().from(serviceRequestFollowUps)
      .where(eq(serviceRequestFollowUps.serviceRequestId, serviceRequestId))
      .orderBy(desc(serviceRequestFollowUps.createdAt));
  }

  async createServiceRequestFollowUp(followUpData: InsertServiceRequestFollowUp): Promise<ServiceRequestFollowUp> {
    const [followUp] = await db.insert(serviceRequestFollowUps).values(followUpData).returning();
    return followUp;
  }

  // Warehouses
  async getAllWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).orderBy(desc(warehouses.createdAt));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse || undefined;
  }

  async createWarehouse(warehouseData: InsertWarehouse): Promise<Warehouse> {
    const [warehouse] = await db.insert(warehouses).values(warehouseData).returning();
    return warehouse;
  }

  async updateWarehouse(id: string, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse> {
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set(warehouseData)
      .where(eq(warehouses.id, id))
      .returning();
    
    if (!updatedWarehouse) throw new Error('Warehouse not found');
    return updatedWarehouse;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const [userCount] = await db.select({ count: db.$count(users) }).from(users);
    const [requestCount] = await db.select({ count: db.$count(serviceRequests) }).from(serviceRequests);
    const [centerCount] = await db.select({ count: db.$count(serviceCenters) }).from(serviceCenters);
    
    return {
      totalUsers: userCount?.count || 0,
      serviceRequests: requestCount?.count || 0,
      serviceCenters: centerCount?.count || 0,
      revenue: 125490
    };
  }

  async getRecentServiceRequests(): Promise<any[]> {
    return await db.select().from(serviceRequests)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(5);
  }

  async getRecentActivities(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(10);
  }

  // Activity Logs
  async logActivity(activityData: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLogs).values(activityData).returning();
    return activity;
  }

  // Product Inventory
  async getProductInventory(id: string): Promise<ProductInventory | undefined> {
    const result = await db.select().from(productInventory)
      .where(eq(productInventory.id, id));
    return result[0];
  }

  async getProductInventoryByWarehouse(warehouseId: string): Promise<ProductInventory[]> {
    return await db.select().from(productInventory)
      .where(eq(productInventory.warehouseId, warehouseId))
      .orderBy(desc(productInventory.updatedAt));
  }

  async getProductInventoryByProduct(productId: string): Promise<ProductInventory[]> {
    return await db.select().from(productInventory)
      .where(eq(productInventory.productId, productId))
      .orderBy(desc(productInventory.updatedAt));
  }

  async getProductInventoryItem(warehouseId: string, productId: string): Promise<ProductInventory | undefined> {
    const [item] = await db.select().from(productInventory)
      .where(eq(productInventory.warehouseId, warehouseId) && eq(productInventory.productId, productId));
    return item || undefined;
  }

  async createProductInventory(inventoryData: InsertProductInventory): Promise<ProductInventory> {
    const [inventory] = await db.insert(productInventory).values(inventoryData).returning();
    return inventory;
  }

  async updateProductInventory(id: string, inventoryData: Partial<InsertProductInventory>): Promise<ProductInventory> {
    const [updatedInventory] = await db
      .update(productInventory)
      .set({ ...inventoryData, updatedAt: new Date() })
      .where(eq(productInventory.id, id))
      .returning();
    
    if (!updatedInventory) throw new Error('Product inventory not found');
    return updatedInventory;
  }

  async deleteProductInventory(id: string): Promise<void> {
    await db.delete(productInventory).where(eq(productInventory.id, id));
  }

  // User Approvals
  async createUserApproval(approvalData: any): Promise<any> {
    const [approval] = await db.insert(userApprovals).values(approvalData).returning();
    return approval;
  }

  async getUserApprovals(userId: string): Promise<any[]> {
    return await db.select().from(userApprovals).where(eq(userApprovals.userId, userId));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, 'pending'));
  }

  async approveUser(userId: string, approvalData: any): Promise<User> {
    // Create approval record
    await this.createUserApproval(approvalData);
    
    // Update user status and details
    const [updatedUser] = await db
      .update(users)
      .set({
        status: 'active',
        role: approvalData.role,
        centerId: approvalData.centerId || null,
        warehouseId: approvalData.warehouseId || null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
  }

  async getUsersByWarehouse(warehouseId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.warehouseId, warehouseId));
  }

  async getWarehouseSpareParts(warehouseId: string): Promise<any[]> {
    const result = await db
      .select({
        sparePart: spareParts,
        inventory: inventory,
        category: categories
      })
      .from(inventory)
      .innerJoin(spareParts, eq(inventory.sparePartId, spareParts.id))
      .leftJoin(categories, eq(spareParts.categoryId, categories.id))
      .where(eq(inventory.warehouseId, warehouseId));
    
    return result.map(item => ({
      ...item.sparePart,
      quantity: item.inventory.quantity,
      minQuantity: item.inventory.minQuantity,
      category: item.category
    }));
  }
}

export const storage = new DatabaseStorage();