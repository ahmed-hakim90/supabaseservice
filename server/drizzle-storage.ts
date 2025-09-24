import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from './db';
import { 
  users, 
  serviceCenters,
  customers,
  categories,
  products,
  serviceRequests,
  serviceRequestFollowUps,
  serviceRequestFollowUpSpareParts,
  warehouses,
  spareParts,
  inventory,
  productInventory,
  partsTransfers,
  activityLogs,
  userApprovals
} from '../shared/schema';
import type { 
  User, InsertUser,
  ServiceCenter, InsertServiceCenter,
  Customer, InsertCustomer,
  Category, InsertCategory,
  Product, InsertProduct,
  ServiceRequest, InsertServiceRequest,
  ServiceRequestFollowUp, InsertServiceRequestFollowUp,
  ServiceRequestFollowUpSparePart, InsertServiceRequestFollowUpSparePart,
  Warehouse, InsertWarehouse,
  SparePart, InsertSparePart,
  Inventory, InsertInventory,
  ProductInventory, InsertProductInventory,
  PartsTransfer, InsertPartsTransfer,
  ActivityLog, InsertActivityLog,
  UserApproval, InsertUserApproval,
  insertSparePartSchema
} from '../shared/schema';
import type { IStorage } from './storage';

export class DrizzleStorage implements IStorage {
  
  // Users
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Service Centers
  async getAllServiceCenters(): Promise<ServiceCenter[]> {
    return await db.select().from(serviceCenters);
  }

  async getServiceCenter(id: string): Promise<ServiceCenter | undefined> {
    const result = await db.select().from(serviceCenters).where(eq(serviceCenters.id, id));
    return result[0];
  }

  async createServiceCenter(centerData: InsertServiceCenter): Promise<ServiceCenter> {
    const result = await db.insert(serviceCenters).values({
      ...centerData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateServiceCenter(id: string, centerData: Partial<InsertServiceCenter>): Promise<ServiceCenter> {
    const result = await db.update(serviceCenters)
      .set({ ...centerData, updatedAt: new Date() })
      .where(eq(serviceCenters.id, id))
      .returning();
    return result[0];
  }

  async deleteServiceCenter(id: string): Promise<void> {
    await db.delete(serviceCenters).where(eq(serviceCenters.id, id));
  }

  // Customers
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values({
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const result = await db.update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values({
      ...categoryData,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category> {
    const result = await db.update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values({
      ...productData,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product> {
    const result = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Service Requests
  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  }

  async getAllServiceRequestsWithFollowUps(): Promise<any[]> {
    const requests = await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
    
    // Get follow-ups for each request
    const requestsWithFollowUps = await Promise.all(
      requests.map(async (request) => {
        const followUps = await db.select()
          .from(serviceRequestFollowUps)
          .where(eq(serviceRequestFollowUps.serviceRequestId, request.id))
          .orderBy(desc(serviceRequestFollowUps.createdAt));
        
        return {
          ...request,
          followUps
        };
      })
    );

    return requestsWithFollowUps;
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const result = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return result[0];
  }

  async createServiceRequest(requestData: InsertServiceRequest): Promise<ServiceRequest> {
    const result = await db.insert(serviceRequests).values({
      ...requestData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateServiceRequest(id: string, requestData: Partial<InsertServiceRequest>): Promise<ServiceRequest> {
    const result = await db.update(serviceRequests)
      .set({ ...requestData, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return result[0];
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
    const result = await db.insert(serviceRequestFollowUps).values({
      ...followUpData,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  // Service Request Follow-up Spare Parts
  async addSparePartsToFollowUp(followUpId: string, spareParts: InsertServiceRequestFollowUpSparePart[]): Promise<ServiceRequestFollowUpSparePart[]> {
    if (spareParts.length === 0) return [];
    
    const sparePartsWithFollowUpId = spareParts.map(part => ({
      ...part,
      followUpId,
      createdAt: new Date()
    }));
    
    const result = await db.insert(serviceRequestFollowUpSpareParts)
      .values(sparePartsWithFollowUpId)
      .returning();
    return result;
  }

  async getFollowUpSpareParts(followUpId: string): Promise<ServiceRequestFollowUpSparePart[]> {
    return await db.select().from(serviceRequestFollowUpSpareParts)
      .where(eq(serviceRequestFollowUpSpareParts.followUpId, followUpId));
  }

  async getFollowUpWithSpareParts(followUpId: string): Promise<{
    followUp: ServiceRequestFollowUp | undefined;
    spareParts: (ServiceRequestFollowUpSparePart & { sparePart: SparePart })[];
    serviceRequest?: ServiceRequest;
  }> {
    const followUp = await db.select().from(serviceRequestFollowUps)
      .where(eq(serviceRequestFollowUps.id, followUpId))
      .then(result => result[0]);

    let serviceRequest;
    if (followUp) {
      serviceRequest = await db.select().from(serviceRequests)
        .where(eq(serviceRequests.id, followUp.serviceRequestId))
        .then(result => result[0]);
    }

    const sparePartsWithDetails = await db.select({
      id: serviceRequestFollowUpSpareParts.id,
      followUpId: serviceRequestFollowUpSpareParts.followUpId,
      sparePartId: serviceRequestFollowUpSpareParts.sparePartId,
      quantityUsed: serviceRequestFollowUpSpareParts.quantityUsed,
      notes: serviceRequestFollowUpSpareParts.notes,
      createdAt: serviceRequestFollowUpSpareParts.createdAt,
      sparePart: spareParts
    })
    .from(serviceRequestFollowUpSpareParts)
    .leftJoin(spareParts, eq(serviceRequestFollowUpSpareParts.sparePartId, spareParts.id))
    .where(eq(serviceRequestFollowUpSpareParts.followUpId, followUpId));

    return {
      followUp,
      spareParts: sparePartsWithDetails as any,
      serviceRequest
    };
  }

  async removeSparePartsFromFollowUp(followUpId: string, sparePartIds: string[]) {
    return await db
      .delete(serviceRequestFollowUpSpareParts)
      .where(
        and(
          eq(serviceRequestFollowUpSpareParts.followUpId, followUpId),
          inArray(serviceRequestFollowUpSpareParts.sparePartId, sparePartIds)
        )
      );
  }

  // Spare Parts
  async getAllSpareParts(): Promise<SparePart[]> {
    return await db.select().from(spareParts);
  }

  async getSparePart(id: string): Promise<SparePart | undefined> {
    const result = await db.select().from(spareParts).where(eq(spareParts.id, id));
    return result[0];
  }

  async createSparePart(sparePartData: any): Promise<SparePart> {
    const result = await db.insert(spareParts).values(sparePartData).returning();
    return result[0];
  }

  // Warehouses
  async getAllWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const result = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return result[0];
  }

  async createWarehouse(warehouseData: InsertWarehouse): Promise<Warehouse> {
    const result = await db.insert(warehouses).values({
      ...warehouseData,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateWarehouse(id: string, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse> {
    const result = await db.update(warehouses)
      .set(warehouseData)
      .where(eq(warehouses.id, id))
      .returning();
    return result[0];
  }

  async deleteWarehouse(id: string): Promise<void> {
    await db.delete(warehouses).where(eq(warehouses.id, id));
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const [userCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(users);
    const [requestCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(serviceRequests);
    const [centerCount] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(serviceCenters);
    
    return {
      totalUsers: userCount.count,
      serviceRequests: requestCount.count,
      serviceCenters: centerCount.count,
      pendingRequests: 0,
      inProgressRequests: 0,
      completedRequests: 0
    };
  }

  async getRecentServiceRequests(): Promise<any[]> {
    return await db.select().from(serviceRequests)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(10);
  }

  async getRecentActivities(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(20);
  }

  // Activity Logs
  async logActivity(activityData: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values({
      ...activityData,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  // Product Inventory
  async getProductInventory(id: string): Promise<ProductInventory | undefined> {
    const result = await db.select().from(productInventory)
      .where(eq(productInventory.id, id));
    return result[0];
  }

  async getProductInventoryByWarehouse(warehouseId: string): Promise<ProductInventory[]> {
    return await db.select().from(productInventory)
      .where(eq(productInventory.warehouseId, warehouseId));
  }

  async getProductInventoryByProduct(productId: string): Promise<ProductInventory[]> {
    return await db.select().from(productInventory)
      .where(eq(productInventory.productId, productId));
  }

  async getProductInventoryItem(warehouseId: string, productId: string): Promise<ProductInventory | undefined> {
    const result = await db.select().from(productInventory)
      .where(and(
        eq(productInventory.warehouseId, warehouseId),
        eq(productInventory.productId, productId)
      ));
    return result[0];
  }

  async createProductInventory(inventoryData: InsertProductInventory): Promise<ProductInventory> {
    const result = await db.insert(productInventory).values({
      ...inventoryData,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateProductInventory(id: string, inventoryData: Partial<InsertProductInventory>): Promise<ProductInventory> {
    const result = await db.update(productInventory)
      .set({ ...inventoryData, updatedAt: new Date() })
      .where(eq(productInventory.id, id))
      .returning();
    return result[0];
  }

  async deleteProductInventory(id: string): Promise<void> {
    await db.delete(productInventory).where(eq(productInventory.id, id));
  }

  // User Approvals
  async createUserApproval(approvalData: InsertUserApproval): Promise<UserApproval> {
    const result = await db.insert(userApprovals).values(approvalData).returning();
    return result[0];
  }

  async getUserApprovals(userId: string): Promise<UserApproval[]> {
    return await db.select().from(userApprovals).where(eq(userApprovals.userId, userId));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, 'pending'));
  }

  async approveUser(userId: string, approvalData: InsertUserApproval): Promise<User> {
    // Create approval record
    await this.createUserApproval(approvalData);
    
    // Update user status and details
    const result = await db.update(users)
      .set({
        status: 'active',
        role: approvalData.role,
        centerId: approvalData.centerId || null,
        warehouseId: approvalData.warehouseId || null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return result[0];
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

export const storage = new DrizzleStorage();