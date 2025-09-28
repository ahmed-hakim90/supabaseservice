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
  userApprovals,
  sparePartsScrap,
  sparePartsShortages,
  sales,
  saleItems,
  warehousePermissions
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

export class DrizzleStorage /* implements IStorage */ {
  
  // Users
  async getUsers(): Promise<User[]> {
    return await this.getAllUsers();
  }

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

  async getServiceRequestWithDetails(id: string): Promise<any | undefined> {
    // Get the service request with joins for all related data
    const result = await db
      .select({
        // Service request fields
        id: serviceRequests.id,
        requestNumber: serviceRequests.requestNumber,
        issue: serviceRequests.issue,
        status: serviceRequests.status,
        deviceName: serviceRequests.deviceName,
        model: serviceRequests.model,
        estimatedCost: serviceRequests.estimatedCost,
        actualCost: serviceRequests.actualCost,
        notes: serviceRequests.notes,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        completedAt: serviceRequests.completedAt,
        
        // Customer info
        customer: {
          id: customers.id,
          name: customers.fullName,
          email: customers.email,
          phone: customers.phone,
        },
        
        // Product info
        product: {
          id: products.id,
          name: products.name,
          model: products.model,
        },
        
        // Technician info
        technician: {
          id: users.id,
          name: users.fullName,
          email: users.email,
        },
        
        // Service center info
        serviceCenter: {
          id: serviceCenters.id,
          name: serviceCenters.name,
          address: serviceCenters.address,
        },
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .leftJoin(users, eq(serviceRequests.technicianId, users.id))
      .leftJoin(serviceCenters, eq(serviceRequests.centerId, serviceCenters.id))
      .where(eq(serviceRequests.id, id));
    
    if (result.length === 0) return undefined;
    
    const serviceRequest = result[0];
    
    // Get follow-ups with technician details
    const followUps = await db
      .select({
        id: serviceRequestFollowUps.id,
        followUpText: serviceRequestFollowUps.followUpText,
        createdAt: serviceRequestFollowUps.createdAt,
        technician: {
          id: users.id,
          name: users.fullName,
          email: users.email,
        },
      })
      .from(serviceRequestFollowUps)
      .leftJoin(users, eq(serviceRequestFollowUps.technicianId, users.id))
      .where(eq(serviceRequestFollowUps.serviceRequestId, id))
      .orderBy(desc(serviceRequestFollowUps.createdAt));
    
    // Get spare parts used in follow-ups
    const followUpsWithSpareParts = await Promise.all(
      followUps.map(async (followUp) => {
        const sparePartsList = await db
          .select({
            id: serviceRequestFollowUpSpareParts.id,
            quantityUsed: serviceRequestFollowUpSpareParts.quantityUsed,
            notes: serviceRequestFollowUpSpareParts.notes,
            createdAt: serviceRequestFollowUpSpareParts.createdAt,
            sparePart: {
              id: spareParts.id,
              name: spareParts.name,
              partNumber: spareParts.partNumber,
              price: spareParts.price,
            },
          })
          .from(serviceRequestFollowUpSpareParts)
          .leftJoin(spareParts, eq(serviceRequestFollowUpSpareParts.sparePartId, spareParts.id))
          .where(eq(serviceRequestFollowUpSpareParts.followUpId, followUp.id));
        
        return {
          ...followUp,
          spareParts: sparePartsList,
        };
      })
    );
    
    return {
      ...serviceRequest,
      followUps: followUpsWithSpareParts,
    };
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

  // Inventory Management
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async createInventoryItem(inventoryData: InsertInventory): Promise<Inventory> {
    const [newInventory] = await db
      .insert(inventory)
      .values(inventoryData)
      .returning();
    
    if (!newInventory) throw new Error('Failed to create inventory record');
    return newInventory;
  }


  async updateInventoryItem(id: string, item: Partial<Inventory>): Promise<Inventory> {
    const [updated] = await db
      .update(inventory)
      .set(item)
      .where(eq(inventory.id, id))
      .returning();
    
    if (!updated) throw new Error('Inventory item not found');
    return updated;
  }

  async getInventoryByWarehouseAndSparePart(warehouseId: string, sparePartId: string): Promise<any> {
    const result = await db
      .select()
      .from(inventory)
      .where(and(
        eq(inventory.warehouseId, warehouseId),
        eq(inventory.sparePartId, sparePartId)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async updateInventory(id: string, data: any): Promise<any> {
    const result = await db
      .update(inventory)
      .set(data)
      .where(eq(inventory.id, id))
      .returning();
    return result[0];
  }

  async createInventory(data: any): Promise<any> {
    // Normalize field names: some callers use minStock
    const normalized = {
      ...data,
      minQuantity: data.minQuantity ?? data.minStock ?? 5,
    };
    delete (normalized as any).minStock;
    const result = await db.insert(inventory).values(normalized).returning();
    return result[0];
  }

  // Spare Parts Scrap and Shortage
  async getSparePartsScrap(): Promise<any[]> {
    return await db.select().from(sparePartsScrap).orderBy(desc(sparePartsScrap.createdAt));
  }

  async createSparePartsScrap(scrapData: any): Promise<any> {
    const [scrap] = await db.insert(sparePartsScrap).values(scrapData).returning();
    return scrap;
  }

  async getSparePartsShortages(): Promise<any[]> {
    return await db.select().from(sparePartsShortages).where(eq(sparePartsShortages.status, 'open'));
  }

  async createSparePartsShortage(shortageData: any): Promise<any> {
    const [shortage] = await db.insert(sparePartsShortages).values(shortageData).returning();
    return shortage;
  }

  async resolveSparePartsShortage(id: string): Promise<any> {
    const [resolved] = await db
      .update(sparePartsShortages)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(eq(sparePartsShortages.id, id))
      .returning();
    
    if (!resolved) throw new Error('Shortage not found');
    return resolved;
  }

  async getSparePartsWithInventory(warehouseId: string): Promise<any[]> {
    return await db
      .select({
        id: spareParts.id,
        name: spareParts.name,
        partNumber: spareParts.partNumber,
        price: spareParts.price,
        description: spareParts.description,
        quantity: inventory.quantity,
        minQuantity: inventory.minQuantity,
      })
      .from(spareParts)
      .leftJoin(inventory, and(
        eq(inventory.sparePartId, spareParts.id),
        eq(inventory.warehouseId, warehouseId)
      ))
      .where(sql`${inventory.quantity} > 0 OR ${inventory.quantity} IS NULL`)
      .orderBy(spareParts.name);
  }

  // Sales methods
  async createSale(saleData: any): Promise<any> {
    return await db.transaction(async (tx) => {
      // Create the sale
      const [sale] = await tx.insert(sales).values({
        customerId: saleData.customerId,
        centerId: saleData.centerId,
        warehouseId: saleData.warehouseId,
        technicianId: saleData.technicianId,
        totalAmount: saleData.totalAmount,
        notes: saleData.notes,
      }).returning();

      // Create sale items and update inventory
      const createdSaleItems = [];
      for (const item of saleData.items) {
        // Create sale item
        const [saleItem] = await tx.insert(saleItems).values({
          saleId: sale.id,
          sparePartId: item.sparePartId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }).returning();

        createdSaleItems.push(saleItem);

        // Update inventory (decrease quantity)
        const [currentInventory] = await tx
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.warehouseId, saleData.warehouseId),
              eq(inventory.sparePartId, item.sparePartId)
            )
          );

        if (!currentInventory || currentInventory.quantity < item.quantity) {
          throw new Error(`كمية غير كافية لقطعة الغيار`);
        }

        await tx
          .update(inventory)
          .set({
            quantity: currentInventory.quantity - item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, currentInventory.id));
      }

      return { sale, items: createdSaleItems };
    });
  }

  async getSales(centerId?: string): Promise<any[]> {
    const query = db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        notes: sales.notes,
        createdAt: sales.createdAt,
        customer: {
          id: customers.id,
          fullName: customers.fullName,
          phone: customers.phone,
        },
        technician: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.technicianId, users.id))
      .orderBy(desc(sales.createdAt));

    if (centerId) {
      return await query.where(eq(sales.centerId, centerId));
    }
    
    return await query;
  }

  async getSaleDetails(saleId: string): Promise<any> {
    // Get sale with customer and technician info
    const [sale] = await db
      .select({
        id: sales.id,
        totalAmount: sales.totalAmount,
        notes: sales.notes,
        createdAt: sales.createdAt,
        customer: {
          id: customers.id,
          fullName: customers.fullName,
          phone: customers.phone,
          address: customers.address,
        },
        technician: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.technicianId, users.id))
      .where(eq(sales.id, saleId));

    if (!sale) return null;

    // Get sale items with spare parts info
    const items = await db
      .select({
        id: saleItems.id,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        totalPrice: saleItems.totalPrice,
        sparePart: {
          id: spareParts.id,
          name: spareParts.name,
          partNumber: spareParts.partNumber,
        },
      })
      .from(saleItems)
      .leftJoin(spareParts, eq(saleItems.sparePartId, spareParts.id))
      .where(eq(saleItems.saleId, saleId));

    return { ...sale, items };
  }

  // Warehouse Permissions
  async getAllWarehousePermissions(): Promise<any[]> {
    return await db
      .select({
        id: warehousePermissions.id,
        permissionNumber: warehousePermissions.permissionNumber,
        type: warehousePermissions.type,
        warehouseId: warehousePermissions.warehouseId,
        sparePartId: warehousePermissions.sparePartId,
        quantity: warehousePermissions.quantity,
        reason: warehousePermissions.reason,
        requestedBy: warehousePermissions.requestedBy,
        approvedBy: warehousePermissions.approvedBy,
        executedBy: warehousePermissions.executedBy,
        status: warehousePermissions.status,
        notes: warehousePermissions.notes,
        createdAt: warehousePermissions.createdAt,
        approvedAt: warehousePermissions.approvedAt,
        executedAt: warehousePermissions.executedAt,
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
        },
        sparePart: {
          id: spareParts.id,
          name: spareParts.name,
          partNumber: spareParts.partNumber,
        },
        requester: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(warehousePermissions)
      .leftJoin(warehouses, eq(warehousePermissions.warehouseId, warehouses.id))
      .leftJoin(spareParts, eq(warehousePermissions.sparePartId, spareParts.id))
      .leftJoin(users, eq(warehousePermissions.requestedBy, users.id))
      .orderBy(desc(warehousePermissions.createdAt));
  }

  async getWarehousePermission(id: string): Promise<any> {
    const result = await db
      .select({
        id: warehousePermissions.id,
        permissionNumber: warehousePermissions.permissionNumber,
        type: warehousePermissions.type,
        warehouseId: warehousePermissions.warehouseId,
        sparePartId: warehousePermissions.sparePartId,
        quantity: warehousePermissions.quantity,
        reason: warehousePermissions.reason,
        requestedBy: warehousePermissions.requestedBy,
        approvedBy: warehousePermissions.approvedBy,
        executedBy: warehousePermissions.executedBy,
        status: warehousePermissions.status,
        notes: warehousePermissions.notes,
        createdAt: warehousePermissions.createdAt,
        approvedAt: warehousePermissions.approvedAt,
        executedAt: warehousePermissions.executedAt,
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
        },
        sparePart: {
          id: spareParts.id,
          name: spareParts.name,
          partNumber: spareParts.partNumber,
        },
        requester: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(warehousePermissions)
      .leftJoin(warehouses, eq(warehousePermissions.warehouseId, warehouses.id))
      .leftJoin(spareParts, eq(warehousePermissions.sparePartId, spareParts.id))
      .leftJoin(users, eq(warehousePermissions.requestedBy, users.id))
      .where(eq(warehousePermissions.id, id))
      .limit(1);

    return result[0] || null;
  }

  async createWarehousePermission(data: any): Promise<any> {
    const result = await db.insert(warehousePermissions).values(data).returning();
    return result[0];
  }

  async updateWarehousePermission(id: string, data: any): Promise<any> {
    const result = await db
      .update(warehousePermissions)
      .set(data)
      .where(eq(warehousePermissions.id, id))
      .returning();
    return result[0];
  }

  async deleteWarehousePermission(id: string): Promise<boolean> {
    const result = await db.delete(warehousePermissions).where(eq(warehousePermissions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async generatePermissionNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Find the last permission number for today
    const lastPermission = await db
      .select({ permissionNumber: warehousePermissions.permissionNumber })
      .from(warehousePermissions)
      .where(sql`${warehousePermissions.permissionNumber} LIKE ${`${year}${month}${day}%`}`)
      .orderBy(desc(warehousePermissions.permissionNumber))
      .limit(1);

    let sequence = 1;
    if (lastPermission.length > 0) {
      const lastNumber = lastPermission[0].permissionNumber;
      const lastSequence = parseInt(lastNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${year}${month}${day}${String(sequence).padStart(4, '0')}`;
  }

  // Parts Transfers Methods
  async getAllPartsTransfers(): Promise<any[]> {
    const results = await db
      .select({
        id: partsTransfers.id,
        transferNumber: partsTransfers.transferNumber,
        fromWarehouseId: partsTransfers.fromWarehouseId,
        toWarehouseId: partsTransfers.toWarehouseId,
        sparePartId: partsTransfers.sparePartId,
        quantity: partsTransfers.quantity,
        reason: partsTransfers.reason,
        requestedBy: partsTransfers.requestedBy,
        approvedBy: partsTransfers.approvedBy,
        status: partsTransfers.status,
        notes: partsTransfers.notes,
        createdAt: partsTransfers.createdAt,
        updatedAt: partsTransfers.updatedAt,
        sparePart: {
          id: spareParts.id,
          name: spareParts.name,
          partNumber: spareParts.partNumber,
        },
        requester: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(partsTransfers)
      .leftJoin(spareParts, eq(partsTransfers.sparePartId, spareParts.id))
      .leftJoin(users, eq(partsTransfers.requestedBy, users.id))
      .orderBy(desc(partsTransfers.createdAt));

    // Get warehouse details separately for each transfer
    const transfersWithWarehouses = await Promise.all(
      results.map(async (transfer) => {
        const fromWarehouse = await db
          .select()
          .from(warehouses)
          .where(eq(warehouses.id, transfer.fromWarehouseId))
          .limit(1);

        const toWarehouse = await db
          .select()
          .from(warehouses)
          .where(eq(warehouses.id, transfer.toWarehouseId))
          .limit(1);

        return {
          ...transfer,
          fromWarehouse: fromWarehouse[0] || null,
          toWarehouse: toWarehouse[0] || null,
        };
      })
    );

    return transfersWithWarehouses;
  }

  async getPartsTransfer(id: string): Promise<PartsTransfer | null> {
    const result = await db
      .select()
      .from(partsTransfers)
      .where(eq(partsTransfers.id, id))
      .limit(1);

    return result[0] || null;
  }

  async getPartsTransferWithWarehouses(id: string): Promise<any> {
    // Get transfer details
    const transfer = await this.getPartsTransfer(id);
    if (!transfer) return null;

    // Get warehouse details separately
    const fromWarehouse = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, transfer.fromWarehouseId))
      .limit(1);

    const toWarehouse = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, transfer.toWarehouseId))
      .limit(1);

    return {
      ...transfer,
      fromWarehouse: fromWarehouse[0] || null,
      toWarehouse: toWarehouse[0] || null
    };
  }

  async createPartsTransfer(data: InsertPartsTransfer): Promise<PartsTransfer> {
    const transferNumber = await this.generateTransferNumber();
    const result = await db.insert(partsTransfers).values({
      ...data,
      transferNumber,
      status: 'pending'
    }).returning();
    return result[0];
  }

  async updatePartsTransfer(id: string, data: Partial<InsertPartsTransfer>): Promise<PartsTransfer | null> {
    const result = await db
      .update(partsTransfers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(partsTransfers.id, id))
      .returning();
    return result[0] || null;
  }

  async deletePartsTransfer(id: string): Promise<boolean> {
    const result = await db.delete(partsTransfers).where(eq(partsTransfers.id, id));
    return (result.rowCount || 0) > 0;
  }

  async generateTransferNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Find the last transfer number for today
    const lastTransfer = await db
      .select({ transferNumber: partsTransfers.transferNumber })
      .from(partsTransfers)
      .where(sql`${partsTransfers.transferNumber} LIKE ${`TR${year}${month}${day}%`}`)
      .orderBy(desc(partsTransfers.transferNumber))
      .limit(1);

    let sequence = 1;
    if (lastTransfer.length > 0) {
      const lastNumber = lastTransfer[0].transferNumber;
      const lastSequence = parseInt(lastNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `TR${year}${month}${day}${String(sequence).padStart(4, '0')}`;
  }

  async createActivityLog(data: any): Promise<any> {
    const result = await db.insert(activityLogs).values(data).returning();
    return result[0];
  }
}

export const storage = new DrizzleStorage();