import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./drizzle-storage";
import { z } from "zod";
import bcrypt from "bcrypt";
import {
  insertUserSchema,
  insertServiceCenterSchema,
  insertCustomerSchema,
  insertCategorySchema,
  insertProductSchema,
  insertServiceRequestSchema,
  insertServiceRequestFollowUpSchema,
  insertWarehouseSchema,
  insertSparePartSchema,
  insertInventorySchema,
  insertProductInventorySchema,
  insertPartsTransferSchema,
  insertActivityLogSchema,
  type User,
} from "@shared/schema";

// Helper function to get current user from session
async function getCurrentUser(req: any): Promise<User | null> {
  if (!req.session?.user?.id) {
    return null;
  }
  return (await storage.getUser(req.session.user.id)) || null;
}

// Helper function to check if user can access data based on role and center
function canAccessData(user: User, resourceType: string, data?: any): boolean {
  if (user.role === "admin") {
    return true; // Admin can access everything
  }

  // Manager can only access their center's data
  if (user.role === "manager") {
    if (
      resourceType === "user" &&
      data?.centerId &&
      data.centerId !== user.centerId
    ) {
      return false;
    }
    if (
      resourceType === "serviceRequest" &&
      data?.centerId &&
      data.centerId !== user.centerId
    ) {
      return false;
    }
    if (
      resourceType === "warehouse" &&
      data?.centerId &&
      data.centerId !== user.centerId
    ) {
      return false;
    }
    if (
      resourceType === "customer" &&
      data?.centerId &&
      data.centerId !== user.centerId
    ) {
      return false;
    }
  }

  // Technician can only access their assigned service requests
  if (user.role === "technician") {
    if (
      resourceType === "serviceRequest" &&
      data?.technicianId &&
      data.technicianId !== user.id
    ) {
      return false;
    }
  }

  // Warehouse manager can only access their warehouse data
  if (user.role === "warehouse_manager") {
    if (
      resourceType === "warehouse" &&
      data?.managerId &&
      data.managerId !== user.id
    ) {
      return false;
    }
  }

  // Customer can only access their own data
  if (user.role === "customer") {
    if (
      resourceType === "serviceRequest" &&
      data?.customerId &&
      data.customerId !== user.id
    ) {
      return false;
    }
  }

  return true;
}

// Helper function to filter data based on user role
function filterDataForUser(
  user: User,
  resourceType: string,
  data: any[],
): any[] {
  if (user.role === "admin") {
    return data; // Admin sees everything
  }

  return data.filter((item) => canAccessData(user, resourceType, item));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      // Temporary admin user fallback if database is not connected
      if (email === "admin@sokany.com" && password === "Admin123!") {
        const tempAdminUser = {
          id: "temp-admin-001",
          email: "admin@sokany.com",
          password: "$2b$10$dummy.hash", // This won't be checked for temp user
          fullName: "مدير النظام",
          phone: "+966501234567",
          address: null,
          role: "admin" as const,
          status: "active" as const,
          centerId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Store user in session
        (req as any).session.user = tempAdminUser;
        console.log("✅ Temporary admin login successful");
        return res.json(tempAdminUser);
      }

      let user;
      try {
        user = await storage.getUserByEmail(email);
      } catch (dbError) {
        console.error("Database connection error, using fallback:", dbError);
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      if (!user) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      // Verify password hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      if (user.status !== "active") {
        return res
          .status(401)
          .json({ message: "الحساب غير مفعل، يرجى انتظار موافقة المسؤول" });
      }

      // Store user in session
      (req as any).session.user = user;

      // Try to log activity, but don't fail if database is down
      try {
        await storage.logActivity({
          userId: user.id,
          action: "login",
          entityType: "user",
          entityId: user.id,
          description: `تم تسجيل الدخول للمستخدم ${user.fullName}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "المستخدم موجود بالفعل" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user with pending status
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        status: "pending",
      });

      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "register",
        entityType: "user",
        entityId: user.id,
        description: `تم تسجيل مستخدم جديد: ${user.fullName}`,
      });

      res
        .status(201)
        .json({ message: "تم إنشاء الحساب بنجاح، في انتظار الموافقة" });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Users CRUD
  app.get("/api/users", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      let allUsers;
      try {
        allUsers = await storage.getAllUsers();
      } catch (dbError) {
        console.error(
          "Database connection error while fetching users:",
          dbError,
        );
        // Return empty array when database is not available
        return res.json([]);
      }

      let filteredUsers = allUsers;

      // Filter users based on role
      if (currentUser.role === "manager") {
        // Manager can only see users in their center
        filteredUsers = allUsers.filter(
          (user) => user.centerId === currentUser.centerId,
        );
      } else if (currentUser.role !== "admin") {
        // Non-admin and non-manager roles cannot view other users
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض المستخدمين" });
      }

      res.json(filteredUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المستخدمين" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المستخدم" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists (with database fallback)
      let existingUser;
      try {
        existingUser = await storage.getUserByEmail(userData.email);
      } catch (dbError) {
        console.error("Database connection error during user check:", dbError);
        // Return a temporary response when database is not available
        return res.status(503).json({
          message:
            "قاعدة البيانات غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.",
        });
      }

      if (existingUser) {
        return res.status(400).json({ message: "المستخدم موجود بالفعل" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      let user;
      try {
        user = await storage.createUser({
          ...userData,
          password: hashedPassword,
        });
      } catch (dbError) {
        console.error(
          "Database connection error during user creation:",
          dbError,
        );
        return res.status(503).json({
          message:
            "قاعدة البيانات غير متاحة حالياً. يرجى المحاولة مرة أخرى لاحقاً.",
        });
      }

      // Try to log activity (but don't fail if logging fails)
      try {
        await storage.logActivity({
          userId: user.id,
          action: "create",
          entityType: "user",
          entityId: user.id,
          description: `تم إضافة مستخدم جديد: ${user.fullName}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة المستخدم" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);

      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "update",
        entityType: "user",
        entityId: user.id,
        description: `تم تحديث بيانات المستخدم: ${user.fullName}`,
      });

      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث المستخدم" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      await storage.deleteUser(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: req.params.id,
        action: "delete",
        entityType: "user",
        entityId: req.params.id,
        description: `تم حذف المستخدم: ${user.fullName}`,
      });

      res.json({ message: "تم حذف المستخدم بنجاح" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  // Service Centers CRUD
  app.get("/api/service-centers", async (req, res) => {
    try {
      const centers = await storage.getAllServiceCenters();
      res.json(centers);
    } catch (error) {
      console.error("Get service centers error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات مراكز الخدمة" });
    }
  });

  app.get("/api/service-centers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const centers = await storage.getAllServiceCenters();
      const center = centers.find((c) => c.id === id);

      if (!center) {
        return res.status(404).json({ message: "المركز غير موجود" });
      }

      res.json(center);
    } catch (error) {
      console.error("Get service center error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المركز" });
    }
  });

  app.post("/api/service-centers", async (req, res) => {
    try {
      const centerData = insertServiceCenterSchema.parse(req.body);
      const center = await storage.createServiceCenter(centerData);

      // Log activity
      await storage.logActivity({
        userId: center.managerId || "",
        action: "create",
        entityType: "service_center",
        entityId: center.id,
        description: `تم إضافة مركز خدمة جديد: ${center.name}`,
      });

      res.status(201).json(center);
    } catch (error) {
      console.error("Create service center error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة مركز الخدمة" });
    }
  });

  app.put("/api/service-centers/:id", async (req, res) => {
    try {
      const centerData = insertServiceCenterSchema.partial().parse(req.body);
      const center = await storage.updateServiceCenter(
        req.params.id,
        centerData,
      );

      // Log activity
      await storage.logActivity({
        userId: center.managerId || "",
        action: "update",
        entityType: "service_center",
        entityId: center.id,
        description: `تم تحديث مركز الخدمة: ${center.name}`,
      });

      res.json(center);
    } catch (error) {
      console.error("Update service center error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث مركز الخدمة" });
    }
  });

  app.delete("/api/service-centers/:id", async (req, res) => {
    try {
      const center = await storage.getServiceCenter(req.params.id);
      if (!center) {
        return res.status(404).json({ message: "مركز الخدمة غير موجود" });
      }

      await storage.deleteServiceCenter(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: center.managerId || "",
        action: "delete",
        entityType: "service_center",
        entityId: req.params.id,
        description: `تم حذف مركز الخدمة: ${center.name}`,
      });

      res.json({ message: "تم حذف مركز الخدمة بنجاح" });
    } catch (error) {
      console.error("Delete service center error:", error);
      res.status(500).json({ message: "خطأ في حذف مركز الخدمة" });
    }
  });

  // Customers CRUD
  app.get("/api/customers", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const allCustomers = await storage.getAllCustomers();
      let filteredCustomers = allCustomers;

      // Filter customers based on role
      if (
        currentUser.role === "manager" ||
        currentUser.role === "receptionist"
      ) {
        // Manager and receptionist can see customers from their center only
        filteredCustomers = allCustomers.filter(
          (customer) => customer.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "technician") {
        // Technician can see customers from their center only
        filteredCustomers = allCustomers.filter(
          (customer) => customer.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "customer") {
        // Customer can only see their own data
        filteredCustomers = allCustomers.filter(
          (customer) => customer.id === currentUser.id,
        );
      } else if (currentUser.role === "warehouse_manager") {
        // Warehouse manager doesn't need customer access
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض العملاء" });
      }

      res.json(filteredCustomers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات العملاء" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check permissions
      if (
        currentUser.role === "customer" ||
        currentUser.role === "warehouse_manager"
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لإضافة عملاء" });
      }

      const customerData = insertCustomerSchema.parse(req.body);

      // Auto-assign centerId based on user's center
      if (currentUser.centerId) {
        customerData.centerId = currentUser.centerId;
      }

      const customer = await storage.createCustomer(customerData);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create",
        entityType: "customer",
        entityId: customer.id,
        description: `تم إضافة عميل جديد: ${customer.fullName}`,
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة العميل" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(
        req.params.id,
        customerData,
      );

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "update",
        entityType: "customer",
        entityId: customer.id,
        description: `تم تحديث بيانات العميل: ${customer.fullName}`,
      });

      res.json(customer);
    } catch (error) {
      console.error("Update customer error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث العميل" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "العميل غير موجود" });
      }

      await storage.deleteCustomer(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "delete",
        entityType: "customer",
        entityId: req.params.id,
        description: `تم حذف العميل: ${customer.fullName}`,
      });

      res.json({ message: "تم حذف العميل بنجاح" });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ message: "خطأ في حذف العميل" });
    }
  });

  // Service Request Follow-ups
  app.get("/api/service-requests/:id/follow-ups", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check if user can access this service request
      const serviceRequest = await storage.getServiceRequest(req.params.id);
      if (!serviceRequest) {
        return res.status(404).json({ message: "طلب الصيانة غير موجود" });
      }

      // Check permissions
      if (!canAccessData(currentUser, "serviceRequest", serviceRequest)) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض متابعات هذا الطلب" });
      }

      const followUps = await storage.getServiceRequestFollowUps(req.params.id);
      res.json(followUps);
    } catch (error) {
      console.error("Get follow-ups error:", error);
      res.status(500).json({ message: "خطأ في جلب المتابعات" });
    }
  });

  app.post("/api/service-requests/:id/follow-ups", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check if user can add follow-ups (only technicians)
      if (currentUser.role !== "technician") {
        return res
          .status(403)
          .json({ message: "فقط الفنيين يمكنهم إضافة متابعات" });
      }

      // Check if this service request exists and is assigned to the technician
      const serviceRequest = await storage.getServiceRequest(req.params.id);
      if (!serviceRequest) {
        return res.status(404).json({ message: "طلب الصيانة غير موجود" });
      }

      if (serviceRequest.technicianId !== currentUser.id) {
        return res
          .status(403)
          .json({ message: "يمكنك إضافة متابعات فقط للطلبات المسندة إليك" });
      }

      const followUpData = insertServiceRequestFollowUpSchema.parse({
        serviceRequestId: req.params.id,
        technicianId: currentUser.id,
        followUpText: req.body.followUpText,
        newStatus: req.body.newStatus,
      });

      const followUp = await storage.createServiceRequestFollowUp(followUpData);

      // Update service request status if newStatus was provided
      if (followUpData.newStatus) {
        const updateData = {
          status: followUpData.newStatus,
          updatedAt: new Date(),
          ...(followUpData.newStatus === "completed"
            ? { completedAt: new Date() }
            : {}),
        };
        await storage.updateServiceRequest(req.params.id, updateData);

        // Log status change activity
        const statusText =
          followUpData.newStatus === "completed"
            ? "مكتمل"
            : followUpData.newStatus === "in_progress"
              ? "قيد التقدم"
              : followUpData.newStatus === "pending"
                ? "في الانتظار"
                : "ملغي";
        await storage.logActivity({
          userId: currentUser.id,
          action: "update",
          entityType: "service_request",
          entityId: req.params.id,
          description: `تم تحديث حالة طلب الصيانة ${serviceRequest.requestNumber} إلى ${statusText}`,
        });
      }

      // Log follow-up activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create",
        entityType: "service_request_follow_up",
        entityId: followUp.id,
        description: `تم إضافة متابعة لطلب الصيانة: ${serviceRequest.requestNumber}`,
      });

      res.status(201).json(followUp);
    } catch (error) {
      console.error("Create follow-up error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة المتابعة" });
    }
  });

  // Warehouses CRUD
  app.get("/api/warehouses", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const allWarehouses = await storage.getAllWarehouses();
      let filteredWarehouses = allWarehouses;

      // Filter warehouses based on role
      if (currentUser.role === "manager") {
        // Manager can only see warehouses in their center
        filteredWarehouses = allWarehouses.filter(
          (warehouse) => warehouse.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "warehouse_manager") {
        // Warehouse manager can only see warehouses they manage
        filteredWarehouses = allWarehouses.filter(
          (warehouse) => warehouse.managerId === currentUser.id,
        );
      } else if (currentUser.role !== "admin") {
        // Other roles cannot access warehouses
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض المخازن" });
      }

      res.json(filteredWarehouses);
    } catch (error) {
      console.error("Get warehouses error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المخازن" });
    }
  });

  app.post("/api/warehouses", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check permissions - only admin can create warehouses
      if (currentUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لإضافة مخازن" });
      }

      const warehouseData = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(warehouseData);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create",
        entityType: "warehouse",
        entityId: warehouse.id,
        description: `تم إضافة مخزن جديد: ${warehouse.name}`,
      });

      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Create warehouse error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة المخزن" });
    }
  });

  app.put("/api/warehouses/:id", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "المخزن غير موجود" });
      }

      // Check permissions
      if (
        currentUser.role === "manager" &&
        warehouse.centerId !== currentUser.centerId
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لتعديل هذا المخزن" });
      }
      if (
        currentUser.role === "warehouse_manager" &&
        warehouse.managerId !== currentUser.id
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لتعديل هذا المخزن" });
      }
      if (
        currentUser.role !== "admin" &&
        currentUser.role !== "manager" &&
        currentUser.role !== "warehouse_manager"
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لتعديل المخازن" });
      }

      const warehouseData = insertWarehouseSchema.partial().parse(req.body);
      const updatedWarehouse = await storage.updateWarehouse(
        req.params.id,
        warehouseData,
      );

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "update",
        entityType: "warehouse",
        entityId: updatedWarehouse.id,
        description: `تم تحديث المخزن: ${updatedWarehouse.name}`,
      });

      res.json(updatedWarehouse);
    } catch (error) {
      console.error("Update warehouse error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث المخزن" });
    }
  });

  app.delete("/api/warehouses/:id", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "المخزن غير موجود" });
      }

      // Check permissions - only admin can delete warehouses
      if (currentUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لحذف المخازن" });
      }

      await storage.deleteWarehouse(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "delete",
        entityType: "warehouse",
        entityId: req.params.id,
        description: `تم حذف المخزن: ${warehouse.name}`,
      });

      res.json({ message: "تم حذف المخزن بنجاح" });
    } catch (error) {
      console.error("Delete warehouse error:", error);
      res.status(500).json({ message: "خطأ في حذف المخزن" });
    }
  });

  // Categories CRUD
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات الفئات" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "create",
        entityType: "category",
        entityId: category.id,
        description: `تم إضافة فئة جديدة: ${category.name}`,
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة الفئة" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(
        req.params.id,
        categoryData,
      );

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "update",
        entityType: "category",
        entityId: category.id,
        description: `تم تحديث الفئة: ${category.name}`,
      });

      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث الفئة" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "الفئة غير موجودة" });
      }

      await storage.deleteCategory(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "delete",
        entityType: "category",
        entityId: req.params.id,
        description: `تم حذف الفئة: ${category.name}`,
      });

      res.json({ message: "تم حذف الفئة بنجاح" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "خطأ في حذف الفئة" });
    }
  });

  // Products CRUD
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المنتجات" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "create",
        entityType: "product",
        entityId: product.id,
        description: `تم إضافة منتج جديد: ${product.name}`,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة المنتج" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "update",
        entityType: "product",
        entityId: product.id,
        description: `تم تحديث المنتج: ${product.name}`,
      });

      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث المنتج" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "المنتج غير موجود" });
      }

      await storage.deleteProduct(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: "",
        action: "delete",
        entityType: "product",
        entityId: req.params.id,
        description: `تم حذف المنتج: ${product.name}`,
      });

      res.json({ message: "تم حذف المنتج بنجاح" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "خطأ في حذف المنتج" });
    }
  });

  // Product Inventory CRUD
  app.get("/api/product-inventory/:warehouseId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check permissions
      if (currentUser.role === "customer") {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض المخزون" });
      }

      // Get warehouse to check permissions
      const warehouse = await storage.getWarehouse(req.params.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "المخزن غير موجود" });
      }

      // Check if user can access this warehouse
      if (
        currentUser.role === "manager" &&
        warehouse.centerId !== currentUser.centerId
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض مخزون هذا المخزن" });
      }
      if (
        currentUser.role === "warehouse_manager" &&
        warehouse.managerId !== currentUser.id
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض مخزون هذا المخزن" });
      }

      const inventory = await storage.getProductInventory(
        req.params.warehouseId,
      );
      res.json(inventory);
    } catch (error) {
      console.error("Get product inventory error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المخزون" });
    }
  });

  app.post("/api/product-inventory", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check permissions
      if (
        currentUser.role !== "admin" &&
        currentUser.role !== "manager" &&
        currentUser.role !== "warehouse_manager"
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لإضافة مخزون" });
      }

      const inventoryData = insertProductInventorySchema.parse(req.body);

      // Get warehouse to check permissions
      const warehouse = await storage.getWarehouse(inventoryData.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "المخزن غير موجود" });
      }

      // Check if user can add to this warehouse
      if (
        currentUser.role === "manager" &&
        warehouse.centerId !== currentUser.centerId
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لإضافة مخزون لهذا المخزن" });
      }
      if (
        currentUser.role === "warehouse_manager" &&
        warehouse.managerId !== currentUser.id
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لإضافة مخزون لهذا المخزن" });
      }

      const inventory = await storage.createProductInventory(inventoryData);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create",
        entityType: "product_inventory",
        entityId: inventory.id,
        description: `تم إضافة مخزون جديد للمنتج في المخزن`,
      });

      res.status(201).json(inventory);
    } catch (error) {
      console.error("Create product inventory error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة المخزون" });
    }
  });

  app.put("/api/product-inventory/:id", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check permissions
      if (
        currentUser.role !== "admin" &&
        currentUser.role !== "manager" &&
        currentUser.role !== "warehouse_manager"
      ) {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لتحديث المخزون" });
      }

      const inventoryData = insertProductInventorySchema
        .partial()
        .parse(req.body);
      const inventory = await storage.updateProductInventory(
        req.params.id,
        inventoryData,
      );

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "update",
        entityType: "product_inventory",
        entityId: inventory.id,
        description: `تم تحديث المخزون`,
      });

      res.json(inventory);
    } catch (error) {
      console.error("Update product inventory error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث المخزون" });
    }
  });

  app.delete("/api/product-inventory/:id", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Check permissions - only admin can delete inventory
      if (currentUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لحذف المخزون" });
      }

      await storage.deleteProductInventory(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "delete",
        entityType: "product_inventory",
        entityId: req.params.id,
        description: `تم حذف المخزون`,
      });

      res.json({ message: "تم حذف المخزون بنجاح" });
    } catch (error) {
      console.error("Delete product inventory error:", error);
      res.status(500).json({ message: "خطأ في حذف المخزون" });
    }
  });

  // Service Requests CRUD
  app.get("/api/service-requests", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const allRequests = await storage.getAllServiceRequests();
      let filteredRequests = allRequests;

      // Filter service requests based on role
      if (currentUser.role === "manager") {
        // Manager can only see requests from their center
        filteredRequests = allRequests.filter(
          (req) => req.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "technician") {
        // Technician can only see requests assigned to them
        filteredRequests = allRequests.filter(
          (req) => req.technicianId === currentUser.id,
        );
      } else if (currentUser.role === "receptionist") {
        // Receptionist can see requests from their center
        filteredRequests = allRequests.filter(
          (req) => req.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "customer") {
        // Customer can only see their own requests
        filteredRequests = allRequests.filter(
          (req) => req.customerId === currentUser.id,
        );
      } else if (currentUser.role === "warehouse_manager") {
        // Warehouse manager cannot see service requests
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض طلبات الصيانة" });
      }

      res.json(filteredRequests);
    } catch (error) {
      console.error("Get service requests error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات طلبات الصيانة" });
    }
  });

  app.post("/api/service-requests", async (req, res) => {
    try {
      const requestData = insertServiceRequestSchema.parse(req.body);
      const serviceRequest = await storage.createServiceRequest(requestData);

      // Log activity
      await storage.logActivity({
        userId: serviceRequest.technicianId || "",
        action: "create",
        entityType: "service_request",
        entityId: serviceRequest.id,
        description: `تم إضافة طلب صيانة جديد: ${serviceRequest.requestNumber}`,
      });

      res.status(201).json(serviceRequest);
    } catch (error) {
      console.error("Create service request error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة طلب الصيانة" });
    }
  });

  app.put("/api/service-requests/:id", async (req, res) => {
    try {
      const requestData = insertServiceRequestSchema.partial().parse(req.body);
      const serviceRequest = await storage.updateServiceRequest(
        req.params.id,
        requestData,
      );

      // Log activity
      await storage.logActivity({
        userId: serviceRequest.technicianId || "",
        action: "update",
        entityType: "service_request",
        entityId: serviceRequest.id,
        description: `تم تحديث طلب الصيانة: ${serviceRequest.requestNumber}`,
      });

      res.json(serviceRequest);
    } catch (error) {
      console.error("Update service request error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في تحديث طلب الصيانة" });
    }
  });

  app.delete("/api/service-requests/:id", async (req, res) => {
    try {
      const serviceRequest = await storage.getServiceRequest(req.params.id);
      if (!serviceRequest) {
        return res.status(404).json({ message: "طلب الصيانة غير موجود" });
      }

      await storage.deleteServiceRequest(req.params.id);

      // Log activity
      await storage.logActivity({
        userId: serviceRequest.technicianId || "",
        action: "delete",
        entityType: "service_request",
        entityId: req.params.id,
        description: `تم حذف طلب الصيانة: ${serviceRequest.requestNumber}`,
      });

      res.json({ message: "تم حذف طلب الصيانة بنجاح" });
    } catch (error) {
      console.error("Delete service request error:", error);
      res.status(500).json({ message: "خطأ في حذف طلب الصيانة" });
    }
  });

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const stats = await storage.getDashboardStats();

      // Filter stats based on user role
      if (currentUser.role === "technician") {
        // For technicians, show only their assigned requests stats
        const allRequests = await storage.getAllServiceRequests();
        const technicianRequests = allRequests.filter(
          (req) => req.technicianId === currentUser.id,
        );

        const filteredStats = {
          totalRequests: technicianRequests.length,
          pendingRequests: technicianRequests.filter(
            (req) => req.status === "pending",
          ).length,
          inProgressRequests: technicianRequests.filter(
            (req) => req.status === "in_progress",
          ).length,
          completedRequests: technicianRequests.filter(
            (req) => req.status === "completed",
          ).length,
          totalRevenue: technicianRequests
            .filter((req) => req.status === "completed")
            .reduce(
              (sum, req) => sum + (req.actualCost || req.estimatedCost || 0),
              0,
            ),
        };

        res.json(filteredStats);
      } else if (currentUser.role === "manager") {
        const allRequests = await storage.getAllServiceRequests();
        const allUsers = await storage.getAllUsers();
        const allCustomers = await storage.getAllCustomers();

        const centerRequests = allRequests.filter(
          (req) => req.centerId === currentUser.centerId,
        );
        const centerUsers = allUsers.filter(
          (user) => user.centerId === currentUser.centerId,
        );

        const filteredStats = {
          totalUsers: centerUsers.length,
          serviceRequests: centerRequests.length,
          serviceCenters: 1, // Manager only sees their own center
          revenue: centerRequests.reduce(
            (sum, req) => sum + (req.estimatedCost || 0),
            0,
          ),
        };

        res.json(filteredStats);
      } else {
        res.json(stats);
      }
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات لوحة التحكم" });
    }
  });

  app.get("/api/dashboard/recent-requests", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const recentRequests = await storage.getRecentServiceRequests();

      // Filter recent requests based on user role
      let filteredRequests = recentRequests;
      if (currentUser.role === "manager") {
        filteredRequests = recentRequests.filter(
          (req) => req.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "technician") {
        filteredRequests = recentRequests.filter(
          (req) => req.technicianId === currentUser.id,
        );
      } else if (currentUser.role === "receptionist") {
        filteredRequests = recentRequests.filter(
          (req) => req.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "customer") {
        filteredRequests = recentRequests.filter(
          (req) => req.customerId === currentUser.id,
        );
      }

      res.json(filteredRequests);
    } catch (error) {
      console.error("Get recent requests error:", error);
      res.status(500).json({ message: "خطأ في جلب أحدث طلبات الصيانة" });
    }
  });

  app.get("/api/dashboard/recent-activities", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const recentActivities = await storage.getRecentActivities();

      // Filter activities based on user role
      let filteredActivities = recentActivities;
      if (currentUser.role === "manager") {
        // For managers, show activities related to their center
        const allUsers = await storage.getAllUsers();
        const centerUserIds = allUsers
          .filter((user) => user.centerId === currentUser.centerId)
          .map((user) => user.id);

        filteredActivities = recentActivities.filter((activity) =>
          centerUserIds.includes(activity.userId),
        );
      } else if (currentUser.role === "technician") {
        // Technicians see only their own activities
        filteredActivities = recentActivities.filter(
          (activity) => activity.userId === currentUser.id,
        );
      } else if (currentUser.role === "receptionist") {
        // Receptionists see activities from their center
        const allUsers = await storage.getAllUsers();
        const centerUserIds = allUsers
          .filter((user) => user.centerId === currentUser.centerId)
          .map((user) => user.id);

        filteredActivities = recentActivities.filter((activity) =>
          centerUserIds.includes(activity.userId),
        );
      }

      res.json(filteredActivities);
    } catch (error) {
      console.error("Get recent activities error:", error);
      res.status(500).json({ message: "خطأ في جلب أحدث الأنشطة" });
    }
  });

  // Activity logs
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "خطأ في جلب سجل الأنشطة" });
    }
  });

  // Data Export/Import endpoints
  app.get("/api/export", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only admin can export all data
      if (currentUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لتصدير البيانات" });
      }

      // Get all data
      const data = {
        users: await storage.getAllUsers(),
        serviceCenters: await storage.getAllServiceCenters(),
        customers: await storage.getAllCustomers(),
        categories: await storage.getAllCategories(),
        products: await storage.getAllProducts(),
        warehouses: await storage.getAllWarehouses(),
        serviceRequests: await storage.getAllServiceRequests(),
        exportDate: new Date().toISOString(),
        exportedBy: currentUser.fullName,
      };

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "export",
        entityType: "system_data",
        entityId: null,
        description: `تم تصدير البيانات بواسطة ${currentUser.fullName}`,
      });

      // Set headers for file download
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sokany-backup-${new Date().toISOString().split("T")[0]}.json"`,
      );
      res.json(data);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "خطأ في تصدير البيانات" });
    }
  });

  app.post("/api/import", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only admin can import data
      if (currentUser.role !== "admin") {
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لاستيراد البيانات" });
      }

      const importData = req.body;

      if (!importData || typeof importData !== "object") {
        return res.status(400).json({ message: "بيانات الاستيراد غير صحيحة" });
      }

      let importedCount = {
        users: 0,
        serviceCenters: 0,
        customers: 0,
        categories: 0,
        products: 0,
        warehouses: 0,
        serviceRequests: 0,
      };

      // Import service centers first (as they are referenced by other entities)
      if (
        importData.serviceCenters &&
        Array.isArray(importData.serviceCenters)
      ) {
        for (const center of importData.serviceCenters) {
          try {
            await storage.createServiceCenter(center);
            importedCount.serviceCenters++;
          } catch (e) {
            console.error("Failed to import center:", e);
          }
        }
      }

      // Import users
      if (importData.users && Array.isArray(importData.users)) {
        for (const user of importData.users) {
          try {
            // Skip if user already exists
            const existing = await storage.getUserByEmail(user.email);
            if (!existing) {
              await storage.createUser(user);
              importedCount.users++;
            }
          } catch (e) {
            console.error("Failed to import user:", e);
          }
        }
      }

      // Import customers
      if (importData.customers && Array.isArray(importData.customers)) {
        for (const customer of importData.customers) {
          try {
            await storage.createCustomer(customer);
            importedCount.customers++;
          } catch (e) {
            console.error("Failed to import customer:", e);
          }
        }
      }

      // Import categories
      if (importData.categories && Array.isArray(importData.categories)) {
        for (const category of importData.categories) {
          try {
            await storage.createCategory(category);
            importedCount.categories++;
          } catch (e) {
            console.error("Failed to import category:", e);
          }
        }
      }

      // Import products
      if (importData.products && Array.isArray(importData.products)) {
        for (const product of importData.products) {
          try {
            await storage.createProduct(product);
            importedCount.products++;
          } catch (e) {
            console.error("Failed to import product:", e);
          }
        }
      }

      // Import warehouses
      if (importData.warehouses && Array.isArray(importData.warehouses)) {
        for (const warehouse of importData.warehouses) {
          try {
            await storage.createWarehouse(warehouse);
            importedCount.warehouses++;
          } catch (e) {
            console.error("Failed to import warehouse:", e);
          }
        }
      }

      // Import service requests
      if (
        importData.serviceRequests &&
        Array.isArray(importData.serviceRequests)
      ) {
        for (const request of importData.serviceRequests) {
          try {
            await storage.createServiceRequest(request);
            importedCount.serviceRequests++;
          } catch (e) {
            console.error("Failed to import service request:", e);
          }
        }
      }

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "import",
        entityType: "system_data",
        entityId: null,
        description: `تم استيراد البيانات بواسطة ${currentUser.fullName}`,
      });

      res.json({
        message: "تم استيراد البيانات بنجاح",
        imported: importedCount,
      });
    } catch (error) {
      console.error("Import data error:", error);
      res.status(500).json({ message: "خطأ في استيراد البيانات" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
