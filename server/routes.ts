import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./drizzle-storage";
import { z } from "zod";
import bcrypt from "bcrypt";
import { broadcastEvent } from "./websocket";
import {
  insertUserSchema,
  insertServiceCenterSchema,
  insertCustomerSchema,
  insertCategorySchema,
  insertProductSchema,
  insertServiceRequestSchema,
  insertServiceRequestFollowUpSchema,
  insertServiceRequestFollowUpSparePartSchema,
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
      console.log(`🔍 Login attempt - Email: ${email}, Password length: ${password?.length}`);

      if (!email || !password) {
        console.log('❌ Missing email or password');
        return res
          .status(400)
          .json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      // Get user from database
      let user;
      try {
        user = await storage.getUserByEmail(email);
        console.log(`👤 User lookup result: ${user ? 'Found' : 'Not found'}`);
        if (user) {
          console.log(`   User ID: ${user.id}`);
          console.log(`   User Role: ${user.role}`);
          console.log(`   User Status: ${user.status}`);
          console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
        }
      } catch (dbError) {
        console.error("Database connection error:", dbError);
        return res.status(500).json({ message: "خطأ في الاتصال بقاعدة البيانات" });
      }

      if (!user) {
        console.log('❌ User not found in database');
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      // Verify password hash
      console.log(`🔑 Comparing password "${password}" with hash...`);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`🔑 Password comparison result: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!isPasswordValid) {
        console.log('❌ Password validation failed');
        return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      }

      if (user.status !== "active") {
        console.log('❌ User status is not active:', user.status);
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

  // Check current session
  app.get("/api/auth/me", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "غير مسجل الدخول" });
      }
      res.json(currentUser);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "تم تسجيل الخروج بنجاح" });
      });
    } catch (error) {
      console.error("Logout error:", error);
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

      // Broadcast real-time event
      broadcastEvent('user-created', {
        user: { ...user, password: undefined }, // Don't send password
        centerId: user.centerId
      }, {
        toAll: true,
        toCenters: user.centerId ? [user.centerId] : [],
        toRoles: ['admin', 'manager']
      });

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

      // Broadcast real-time event
      broadcastEvent('user-updated', {
        user: { ...user, password: undefined }, // Don't send password
        centerId: user.centerId
      }, {
        toAll: true,
        toCenters: user.centerId ? [user.centerId] : [],
        toRoles: ['admin', 'manager']
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

      // Broadcast real-time event
      broadcastEvent('user-deleted', {
        userId: req.params.id,
        centerId: user.centerId
      }, {
        toAll: true,
        toCenters: user.centerId ? [user.centerId] : [],
        toRoles: ['admin', 'manager']
      });

      res.json({ message: "تم حذف المستخدم بنجاح" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  // Get technicians by center
  app.get("/api/technicians", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only managers and admins can get technicians for assignment
      if (currentUser.role !== "manager" && currentUser.role !== "admin") {
        return res.status(403).json({ message: "ليس لديك صلاحية لعرض الفنيين" });
      }

      let allUsers;
      try {
        allUsers = await storage.getAllUsers();
      } catch (dbError) {
        console.error("Database connection error while fetching technicians:", dbError);
        return res.json([]);
      }

      // Filter to get only technicians
      let technicians = allUsers.filter(user => user.role === 'technician' && user.status === 'active');

      // If user is a manager, show only technicians from their center
      if (currentUser.role === "manager") {
        technicians = technicians.filter(tech => tech.centerId === currentUser.centerId);
      }

      // Return only necessary fields for assignment
      const techniciansList = technicians.map(tech => ({
        id: tech.id,
        fullName: tech.fullName,
        email: tech.email,
        phone: tech.phone,
        centerId: tech.centerId
      }));

      res.json(techniciansList);
    } catch (error) {
      console.error("Get technicians error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات الفنيين" });
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
  // Get customer users (users with role 'customer')
  app.get("/api/customer-users", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Get all users and filter for customers only
      const allUsers = await storage.getAllUsers();
      let customerUsers = allUsers.filter(user => user.role === 'customer');

      // Apply additional filtering based on current user role
      if (currentUser.role === "manager" || currentUser.role === "receptionist" || currentUser.role === "technician") {
        // Staff can see customers from their center only
        customerUsers = customerUsers.filter(
          (user) => user.centerId === currentUser.centerId,
        );
      } else if (currentUser.role === "customer") {
        // Customer can only see themselves
        customerUsers = customerUsers.filter(
          (user) => user.id === currentUser.id,
        );
      } else if (currentUser.role === "warehouse_manager") {
        // Warehouse manager doesn't need customer access
        return res
          .status(403)
          .json({ message: "ليس لديك صلاحية لعرض العملاء" });
      }
      // Admin can see all customer users

      res.json(customerUsers);
    } catch (error) {
      console.error("Get customer users error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المستخدمين العملاء" });
    }
  });

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

      // Broadcast real-time event
      broadcastEvent('service-request-follow-up', {
        followUp,
        serviceRequest,
        centerId: serviceRequest.centerId
      }, {
        toAll: true,
        toCenters: [serviceRequest.centerId],
        toRoles: ['manager', 'admin', 'technician', 'customer']
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

  // Assign technician to service request
  app.put("/api/service-requests/:id/assign-technician", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only managers and admins can assign technicians
      if (currentUser.role !== "manager" && currentUser.role !== "admin") {
        return res.status(403).json({ message: "ليس لديك صلاحية لتعيين الفنيين" });
      }

      const { technicianId } = req.body;

      // Validate technician exists and is active
      if (technicianId) {
        const technician = await storage.getUser(technicianId);
        if (!technician) {
          return res.status(400).json({ message: "الفني غير موجود" });
        }
        if (technician.role !== "technician") {
          return res.status(400).json({ message: "المستخدم المحدد ليس فنياً" });
        }
        if (technician.status !== "active") {
          return res.status(400).json({ message: "الفني غير نشط" });
        }

        // If current user is a manager, ensure technician is from their center
        if (currentUser.role === "manager" && technician.centerId !== currentUser.centerId) {
          return res.status(403).json({ message: "لا يمكنك تعيين فني من مركز آخر" });
        }
      }

      // Get the service request
      const serviceRequest = await storage.getServiceRequest(req.params.id);
      if (!serviceRequest) {
        return res.status(404).json({ message: "طلب الصيانة غير موجود" });
      }

      // If current user is a manager, ensure request is from their center
      if (currentUser.role === "manager" && serviceRequest.centerId !== currentUser.centerId) {
        return res.status(403).json({ message: "لا يمكنك تعديل طلب من مركز آخر" });
      }

      // Update the service request with new technician
      const updateData = {
        technicianId: technicianId || null,
        updatedAt: new Date(),
      };

      await storage.updateServiceRequest(req.params.id, updateData);

      // Log activity
      const actionDescription = technicianId 
        ? `تم تعيين الفني للطلب ${serviceRequest.requestNumber}`
        : `تم إلغاء تعيين الفني من الطلب ${serviceRequest.requestNumber}`;
      
      await storage.logActivity({
        userId: currentUser.id,
        action: "update",
        entityType: "service_request",
        entityId: req.params.id,
        description: actionDescription,
      });

      // Broadcast real-time event
      broadcastEvent('service-request-assigned', {
        serviceRequestId: req.params.id,
        technicianId: technicianId,
        centerId: serviceRequest.centerId
      }, {
        toAll: true,
        toCenters: [serviceRequest.centerId],
        toRoles: ['manager', 'admin', 'technician']
      });

      res.json({ message: technicianId ? "تم تعيين الفني بنجاح" : "تم إلغاء تعيين الفني بنجاح" });
    } catch (error) {
      console.error("Assign technician error:", error);
      res.status(500).json({ message: "خطأ في تعيين الفني" });
    }
  });

  // Spare Parts CRUD
  app.get("/api/spare-parts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only technicians, warehouse managers, managers and admins can view spare parts
      if (!["technician", "warehouse_manager", "manager", "admin"].includes(currentUser.role)) {
        return res.status(403).json({ message: "ليس لديك صلاحية لعرض قطع الغيار" });
      }

      const allSpareParts = await storage.getAllSpareParts();
      res.json(allSpareParts);
    } catch (error) {
      console.error("Get spare parts error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات قطع الغيار" });
    }
  });

  app.get("/api/spare-parts/:id", async (req, res) => {
    try {
      const sparePart = await storage.getSparePart(req.params.id);
      if (!sparePart) {
        return res.status(404).json({ message: "قطعة الغيار غير موجودة" });
      }
      res.json(sparePart);
    } catch (error) {
      console.error("Get spare part error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات قطعة الغيار" });
    }
  });

  app.post("/api/spare-parts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only warehouse managers, managers and admins can create spare parts
      if (!["warehouse_manager", "manager", "admin"].includes(currentUser.role)) {
        return res.status(403).json({ message: "ليس لديك صلاحية لإضافة قطع الغيار" });
      }

      const sparePartData = insertSparePartSchema.parse(req.body);
      const sparePart = await storage.createSparePart(sparePartData);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "create",
        entityType: "spare_part",
        entityId: sparePart.id,
        description: `تم إضافة قطعة غيار جديدة: ${sparePart.name}`,
      });

      // Broadcast real-time event
      broadcastEvent('product-created', {
        sparePart,
      }, {
        toAll: true,
        toRoles: ['technician', 'warehouse_manager', 'manager', 'admin']
      });

      res.status(201).json(sparePart);
    } catch (error) {
      console.error("Create spare part error:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "بيانات غير صحيحة", errors: error.errors });
      }
      res.status(500).json({ message: "خطأ في إضافة قطعة الغيار" });
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
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);

      // Log activity
      try {
        await storage.logActivity({
          userId: currentUser.id,
          action: "create",
          entityType: "category",
          entityId: category.id,
          description: `تم إضافة فئة جديدة: ${category.name}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

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
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(
        req.params.id,
        categoryData,
      );

      // Log activity
      try {
        await storage.logActivity({
          userId: currentUser.id,
          action: "update",
          entityType: "category",
          entityId: category.id,
          description: `تم تحديث الفئة: ${category.name}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

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
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "الفئة غير موجودة" });
      }

      await storage.deleteCategory(req.params.id);

      // Log activity
      try {
        await storage.logActivity({
          userId: currentUser.id,
          action: "delete",
          entityType: "category",
          entityId: req.params.id,
          description: `تم حذف الفئة: ${category.name}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

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
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);

      // Log activity
      try {
        await storage.logActivity({
          userId: currentUser.id,
          action: "create",
          entityType: "product",
          entityId: product.id,
          description: `تم إضافة منتج جديد: ${product.name}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

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
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);

      // Log activity
      try {
        await storage.logActivity({
          userId: currentUser.id,
          action: "update",
          entityType: "product",
          entityId: product.id,
          description: `تم تحديث المنتج: ${product.name}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

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
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "المنتج غير موجود" });
      }

      await storage.deleteProduct(req.params.id);

      // Log activity
      try {
        await storage.logActivity({
          userId: currentUser.id,
          action: "delete",
          entityType: "product",
          entityId: req.params.id,
          description: `تم حذف المنتج: ${product.name}`,
        });
      } catch (logError) {
        console.warn("Could not log activity:", logError);
      }

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

  // Service Requests with Follow-ups
  app.get("/api/service-requests-with-followups", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const allRequests = await storage.getAllServiceRequestsWithFollowUps();
      let filteredRequests = allRequests;

      // Filter based on user role and permissions
      if (currentUser.role === "technician") {
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
      console.error("Get service requests with follow-ups error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات طلبات الصيانة" });
    }
  });

  app.post("/api/service-requests", async (req, res) => {
    try {
      console.log("Received service request data:", JSON.stringify(req.body, null, 2));
      const requestData = insertServiceRequestSchema.parse(req.body);
      console.log("Parsed service request data:", JSON.stringify(requestData, null, 2));
      const serviceRequest = await storage.createServiceRequest(requestData);
      console.log("Created service request:", JSON.stringify(serviceRequest, null, 2));

      // Get current user for activity logging
      const currentUser = await getCurrentUser(req);
      
      // Log activity only if we have a valid user
      if (currentUser?.id) {
        try {
          await storage.logActivity({
            userId: currentUser.id,
            action: "create",
            entityType: "service_request",
            entityId: serviceRequest.id,
            description: `تم إضافة طلب صيانة جديد: ${serviceRequest.requestNumber}`,
          });
        } catch (logError) {
          console.warn("Could not log activity:", logError);
        }
      }

      // Broadcast real-time event
      broadcastEvent('service-request-created', {
        serviceRequest,
        centerId: serviceRequest.centerId
      }, {
        toAll: true,
        toCenters: [serviceRequest.centerId],
        toRoles: ['manager', 'admin', 'receptionist']
      });

      res.status(201).json(serviceRequest);
    } catch (error) {
      console.error("Create service request error:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
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

      // Broadcast real-time event
      broadcastEvent('service-request-updated', {
        serviceRequest,
        centerId: serviceRequest.centerId
      }, {
        toAll: true,
        toCenters: [serviceRequest.centerId],
        toRoles: ['manager', 'admin', 'technician', 'receptionist']
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

      // Broadcast real-time event
      broadcastEvent('service-request-deleted', {
        serviceRequestId: req.params.id,
        centerId: serviceRequest.centerId
      }, {
        toAll: true,
        toCenters: [serviceRequest.centerId],
        toRoles: ['manager', 'admin', 'receptionist']
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

      // Get selected data types from query parameters
      const selectedTypes = req.query.types;
      const typesToExport = Array.isArray(selectedTypes) ? selectedTypes : (selectedTypes ? [selectedTypes] : []);
      
      // Default to all types if none specified
      const availableTypes = [
        'users', 'serviceCenters', 'customers', 'categories', 
        'products', 'warehouses', 'spareParts', 'inventory', 
        'serviceRequests', 'serviceRequestFollowUps'
      ];
      
      const exportTypes = typesToExport.length > 0 ? typesToExport : availableTypes;
      
      // Build data object based on selected types
      const data: any = {
        exportDate: new Date().toISOString(),
        exportedBy: currentUser.fullName,
        exportedTypes: exportTypes
      };

      if (exportTypes.includes('users')) {
        data.users = await storage.getAllUsers();
      }
      if (exportTypes.includes('serviceCenters')) {
        data.serviceCenters = await storage.getAllServiceCenters();
      }
      if (exportTypes.includes('customers')) {
        data.customers = await storage.getAllCustomers();
      }
      if (exportTypes.includes('categories')) {
        data.categories = await storage.getAllCategories();
      }
      if (exportTypes.includes('products')) {
        data.products = await storage.getAllProducts();
      }
      if (exportTypes.includes('warehouses')) {
        data.warehouses = await storage.getAllWarehouses();
      }
      if (exportTypes.includes('spareParts')) {
        // Get all spare parts - we'll need to implement this
        data.spareParts = []; // TODO: implement getAllSpareParts
      }
      if (exportTypes.includes('inventory')) {
        // Get all inventory - we'll need to implement this
        data.inventory = []; // TODO: implement getAllInventory
      }
      if (exportTypes.includes('serviceRequests')) {
        data.serviceRequests = await storage.getAllServiceRequests();
      }
      if (exportTypes.includes('serviceRequestFollowUps')) {
        // Get all follow-ups for all service requests
        const allServiceRequests = await storage.getAllServiceRequests();
        const allFollowUps = [];
        for (const request of allServiceRequests) {
          const followUps = await storage.getServiceRequestFollowUps(request.id);
          allFollowUps.push(...followUps);
        }
        data.serviceRequestFollowUps = allFollowUps;
      }

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "export",
        entityType: "system_data",
        entityId: null,
        description: `تم تصدير البيانات (${exportTypes.join(', ')}) بواسطة ${currentUser.fullName}`,
      });

      // Set headers for file download
      res.setHeader("Content-Type", "application/json");
      const filename = exportTypes.length === availableTypes.length 
        ? `sokany-backup-all-${new Date().toISOString().split("T")[0]}.json`
        : `sokany-backup-${exportTypes.join('-')}-${new Date().toISOString().split("T")[0]}.json`;
      
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
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

  // Follow-up spare parts management endpoints
  app.post("/api/service-request-follow-ups/:id/spare-parts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only technicians and above can add spare parts to follow-ups
      if (!["technician", "manager", "admin"].includes(currentUser.role)) {
        return res.status(403).json({ message: "ليس لديك صلاحية لإضافة قطع الغيار للمتابعة" });
      }

      const followUpId = req.params.id;
      const sparePartsData = req.body.spareParts;

      if (!Array.isArray(sparePartsData)) {
        return res.status(400).json({ message: "البيانات يجب أن تكون مصفوفة من قطع الغيار" });
      }

      await storage.addSparePartsToFollowUp(followUpId, sparePartsData);

      const followUpWithSpareParts = await storage.getFollowUpWithSpareParts(followUpId);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "update",
        entityType: "service_request_follow_up",
        entityId: followUpId,
        description: `تم إضافة ${sparePartsData.length} قطعة غيار للمتابعة`,
      });

      // Broadcast real-time event
      broadcastEvent('follow-up-updated', {
        followUp: followUpWithSpareParts,
      }, {
        toAll: true,
        ...(followUpWithSpareParts.serviceRequest?.centerId && {
          toCenters: [followUpWithSpareParts.serviceRequest.centerId]
        })
      });

      res.json(followUpWithSpareParts);
    } catch (error) {
      console.error("Add spare parts to follow-up error:", error);
      res.status(500).json({ message: "خطأ في إضافة قطع الغيار للمتابعة" });
    }
  });

  // Get follow-up with spare parts
  app.get("/api/service-request-follow-ups/:id/spare-parts", async (req, res) => {
    try {
      const followUpId = req.params.id;
      const followUpWithSpareParts = await storage.getFollowUpWithSpareParts(followUpId);

      if (!followUpWithSpareParts) {
        return res.status(404).json({ message: "المتابعة غير موجودة" });
      }

      res.json(followUpWithSpareParts);
    } catch (error) {
      console.error("Get follow-up with spare parts error:", error);
      res.status(500).json({ message: "خطأ في جلب بيانات المتابعة مع قطع الغيار" });
    }
  });

  // Remove spare parts from follow-up
  app.delete("/api/service-request-follow-ups/:id/spare-parts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      // Only technicians and above can remove spare parts from follow-ups
      if (!["technician", "manager", "admin"].includes(currentUser.role)) {
        return res.status(403).json({ message: "ليس لديك صلاحية لإزالة قطع الغيار من المتابعة" });
      }

      const followUpId = req.params.id;
      const { sparePartIds } = req.body;

      if (!Array.isArray(sparePartIds)) {
        return res.status(400).json({ message: "البيانات يجب أن تكون مصفوفة من معرفات قطع الغيار" });
      }

      await storage.removeSparePartsFromFollowUp(followUpId, sparePartIds);

      const followUpWithSpareParts = await storage.getFollowUpWithSpareParts(followUpId);

      // Log activity
      await storage.logActivity({
        userId: currentUser.id,
        action: "update",
        entityType: "service_request_follow_up",
        entityId: followUpId,
        description: `تم إزالة ${sparePartIds.length} قطعة غيار من المتابعة`,
      });

      // Broadcast real-time event
      broadcastEvent('follow-up-updated', {
        followUp: followUpWithSpareParts,
      }, {
        toAll: true,
        ...(followUpWithSpareParts.serviceRequest?.centerId && {
          toCenters: [followUpWithSpareParts.serviceRequest.centerId]
        })
      });

      res.json(followUpWithSpareParts);
    } catch (error) {
      console.error("Remove spare parts from follow-up error:", error);
      res.status(500).json({ message: "خطأ في إزالة قطع الغيار من المتابعة" });
    }
  });

  // Temporary endpoint to insert test data
  app.post("/api/insert-test-data", async (req, res) => {
    try {
      // Temporarily remove authentication for testing
      // const currentUser = await getCurrentUser(req);
      // if (!currentUser || currentUser.role !== "admin") {
      //   return res.status(403).json({ message: "الصلاحية محدودة للمسؤولين فقط" });
      // }

      // Insert categories
      const categoriesData = [
        { id: 'cat-ac', name: 'مكيفات هواء', description: 'أجهزة التكييف والتبريد المنزلية والتجارية' },
        { id: 'cat-ref', name: 'ثلاجات', description: 'ثلاجات منزلية ومبردات' },
        { id: 'cat-wash', name: 'غسالات', description: 'غسالات الملابس والأطباق' },
        { id: 'cat-kitchen', name: 'أجهزة مطبخ', description: 'أجهزة المطبخ الكهربائية مثل الميكروويف والفرن' },
        { id: 'cat-heat', name: 'أجهزة تسخين', description: 'سخانات المياه والدفايات' },
      ];

      for (const categoryData of categoriesData) {
        try {
          await storage.createCategory(categoryData);
        } catch (error) {
          // Ignore if already exists
          console.log(`Category ${categoryData.name} might already exist`);
        }
      }

      // Insert products
      const productsData = [
        // مكيفات هواء
        { id: 'prod-ac-1', name: 'مكيف شباك سوكاني', model: 'SK-AC-12K', categoryId: 'cat-ac', description: 'مكيف شباك 12 ألف وحدة تبريد' },
        { id: 'prod-ac-2', name: 'مكيف اسبليت سوكاني', model: 'SK-SP-18K', categoryId: 'cat-ac', description: 'مكيف اسبليت 18 ألف وحدة تبريد' },
        { id: 'prod-ac-3', name: 'مكيف شباك سوكاني صغير', model: 'SK-AC-9K', categoryId: 'cat-ac', description: 'مكيف شباك 9 ألف وحدة تبريد' },
        
        // ثلاجات
        { id: 'prod-ref-1', name: 'ثلاجة سوكاني بابين', model: 'SK-REF-350L', categoryId: 'cat-ref', description: 'ثلاجة بابين سعة 350 لتر' },
        { id: 'prod-ref-2', name: 'ثلاجة سوكاني باب واحد', model: 'SK-REF-200L', categoryId: 'cat-ref', description: 'ثلاجة باب واحد سعة 200 لتر' },
        { id: 'prod-ref-3', name: 'فريزر سوكاني', model: 'SK-FRZ-150L', categoryId: 'cat-ref', description: 'فريزر أفقي سعة 150 لتر' },
        
        // غسالات
        { id: 'prod-wash-1', name: 'غسالة سوكاني فوق أوتوماتيك', model: 'SK-WM-7KG', categoryId: 'cat-wash', description: 'غسالة فوق أوتوماتيك سعة 7 كيلو' },
        { id: 'prod-wash-2', name: 'غسالة سوكاني تحميل علوي', model: 'SK-WT-10KG', categoryId: 'cat-wash', description: 'غسالة تحميل علوي سعة 10 كيلو' },
        
        // أجهزة مطبخ
        { id: 'prod-kit-1', name: 'ميكروويف سوكاني', model: 'SK-MW-25L', categoryId: 'cat-kitchen', description: 'ميكروويف سعة 25 لتر' },
        { id: 'prod-kit-2', name: 'فرن كهربائي سوكاني', model: 'SK-OV-42L', categoryId: 'cat-kitchen', description: 'فرن كهربائي سعة 42 لتر' },
        
        // أجهزة تسخين
        { id: 'prod-heat-1', name: 'سخان مياه سوكاني', model: 'SK-WH-50L', categoryId: 'cat-heat', description: 'سخان مياه كهربائي سعة 50 لتر' },
        { id: 'prod-heat-2', name: 'دفاية زيت سوكاني', model: 'SK-OH-2000W', categoryId: 'cat-heat', description: 'دفاية زيت قدرة 2000 وات' },
      ];

      for (const productData of productsData) {
        try {
          await storage.createProduct(productData);
        } catch (error) {
          // Ignore if already exists
          console.log(`Product ${productData.name} might already exist`);
        }
      }

      res.json({ message: "تم إدراج البيانات التجريبية بنجاح", categoriesCount: categoriesData.length, productsCount: productsData.length });
    } catch (error) {
      console.error("Insert test data error:", error);
      res.status(500).json({ message: "خطأ في إدراج البيانات التجريبية" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "الخادم يعمل بنجاح" 
    });
  });

  // Test page endpoint
  app.get("/test", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار النظام</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    </style>
</head>
<body class="bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">اختبار نظام قطع الغيار</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- إدراج البيانات التجريبية -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold mb-4 text-gray-700">إدراج البيانات التجريبية</h2>
                <button id="insertTestData" class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    إدراج البيانات
                </button>
                <div id="insertResult" class="mt-4 text-sm"></div>
            </div>

            <!-- اختبار الفئات والمنتجات -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold mb-4 text-gray-700">اختبار الفئات والمنتجات</h2>
                <button id="testCategories" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                    عرض الفئات والمنتجات
                </button>
                <div id="categoriesResult" class="mt-4 text-sm max-h-40 overflow-y-auto"></div>
            </div>

            <!-- اختبار قطع الغيار -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold mb-4 text-gray-700">اختبار قطع الغيار</h2>
                <button id="testSpareParts" class="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
                    عرض قطع الغيار
                </button>
                <div id="sparePartsResult" class="mt-4 text-sm max-h-40 overflow-y-auto"></div>
            </div>

            <!-- حالة الخادم -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-semibold mb-4 text-gray-700">حالة الخادم</h2>
                <button id="checkServer" class="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                    فحص الخادم
                </button>
                <div id="serverResult" class="mt-4 text-sm"></div>
            </div>
        </div>

        <!-- روابط سريعة -->
        <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-4 text-gray-700">روابط سريعة للنظام</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="/" target="_blank" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                    النظام الرئيسي
                </a>
                <a href="/service-requests" target="_blank" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                    طلبات الصيانة
                </a>
                <a href="/categories" target="_blank" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                    الفئات
                </a>
                <a href="/inventory" target="_blank" class="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-center transition-colors">
                    المخزون
                </a>
            </div>
        </div>
    </div>

    <script>
        const BASE_URL = window.location.origin;

        // إدراج البيانات التجريبية
        document.getElementById('insertTestData').addEventListener('click', async () => {
            const resultDiv = document.getElementById('insertResult');
            resultDiv.innerHTML = '<div class="text-yellow-600">جاري إدراج البيانات...</div>';
            
            try {
                const response = await fetch(BASE_URL + '/api/insert-test-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = '<div class="text-green-600">✅ تم إدراج البيانات بنجاح!</div>';
                } else {
                    resultDiv.innerHTML = '<div class="text-red-600">❌ خطأ: ' + result.message + '</div>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<div class="text-red-600">❌ خطأ في الاتصال: ' + error.message + '</div>';
            }
        });

        // اختبار الفئات والمنتجات
        document.getElementById('testCategories').addEventListener('click', async () => {
            const resultDiv = document.getElementById('categoriesResult');
            resultDiv.innerHTML = '<div class="text-yellow-600">جاري تحميل البيانات...</div>';
            
            try {
                const [categoriesResponse, productsResponse] = await Promise.all([
                    fetch(BASE_URL + '/api/categories', { credentials: 'include' }),
                    fetch(BASE_URL + '/api/products', { credentials: 'include' })
                ]);
                
                const categories = await categoriesResponse.json();
                const products = await productsResponse.json();
                
                let html = '<div class="text-green-600 mb-2">✅ الفئات (' + categories.length + ')</div>';
                categories.forEach(cat => {
                    const categoryProducts = products.filter(p => p.categoryId === cat.id);
                    html += '<div class="mb-1"><strong>' + cat.name + '</strong> (' + categoryProducts.length + ' منتج)</div>';
                });
                
                resultDiv.innerHTML = html;
            } catch (error) {
                resultDiv.innerHTML = '<div class="text-red-600">❌ خطأ: ' + error.message + '</div>';
            }
        });

        // اختبار قطع الغيار
        document.getElementById('testSpareParts').addEventListener('click', async () => {
            const resultDiv = document.getElementById('sparePartsResult');
            resultDiv.innerHTML = '<div class="text-yellow-600">جاري تحميل البيانات...</div>';
            
            try {
                const response = await fetch(BASE_URL + '/api/spare-parts', { credentials: 'include' });
                const spareParts = await response.json();
                
                let html = '<div class="text-green-600 mb-2">✅ قطع الغيار (' + spareParts.length + ')</div>';
                spareParts.slice(0, 10).forEach(part => {
                    html += '<div class="mb-1">' + part.name + ' - ' + part.partNumber + '</div>';
                });
                if (spareParts.length > 10) {
                    html += '<div class="text-gray-500">... و ' + (spareParts.length - 10) + ' قطعة أخرى</div>';
                }
                
                resultDiv.innerHTML = html;
            } catch (error) {
                resultDiv.innerHTML = '<div class="text-red-600">❌ خطأ: ' + error.message + '</div>';
            }
        });

        // فحص حالة الخادم
        document.getElementById('checkServer').addEventListener('click', async () => {
            const resultDiv = document.getElementById('serverResult');
            resultDiv.innerHTML = '<div class="text-yellow-600">جاري فحص الخادم...</div>';
            
            try {
                const startTime = Date.now();
                const response = await fetch(BASE_URL + '/api/health', { credentials: 'include' });
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                if (response.ok) {
                    resultDiv.innerHTML = 
                        '<div class="text-green-600">✅ الخادم يعمل بنجاح</div>' +
                        '<div class="text-gray-500">زمن الاستجابة: ' + responseTime + 'ms</div>';
                } else {
                    resultDiv.innerHTML = '<div class="text-red-600">❌ مشكلة في الخادم</div>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<div class="text-red-600">❌ الخادم غير متاح</div>';
            }
        });

        // فحص تلقائي للخادم عند التحميل
        window.addEventListener('load', () => {
            document.getElementById('checkServer').click();
        });
    </script>
</body>
</html>
    `);
  });

  // User Approval endpoints
  app.get("/api/pending-users", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !["admin", "manager"].includes(currentUser.role)) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول" });
      }

      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Get pending users error:", error);
      res.status(500).json({ message: "خطأ في جلب المستخدمين المعلقين" });
    }
  });

  app.post("/api/approve-user/:userId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !["admin", "manager"].includes(currentUser.role)) {
        return res.status(403).json({ message: "غير مصرح لك بالموافقة" });
      }

      const { userId } = req.params;
      const { role, centerId, warehouseId, notes } = req.body;

      const approvalData = {
        userId,
        approvedBy: currentUser.id,
        role,
        centerId: centerId || null,
        warehouseId: warehouseId || null,
        notes
      };

      const updatedUser = await storage.approveUser(userId, approvalData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ message: "خطأ في الموافقة على المستخدم" });
    }
  });

  // Warehouse-specific endpoints
  app.get("/api/warehouse/:warehouseId/spare-parts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "يجب تسجيل الدخول" });
      }

      const { warehouseId } = req.params;
      
      // Check if user has access to this warehouse
      if (currentUser.role !== "admin" && currentUser.warehouseId !== warehouseId) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذا المخزن" });
      }

      const spareParts = await storage.getWarehouseSpareParts(warehouseId);
      res.json(spareParts);
    } catch (error) {
      console.error("Get warehouse spare parts error:", error);
      res.status(500).json({ message: "خطأ في جلب قطع الغيار" });
    }
  });

  app.get("/api/warehouse/:warehouseId/users", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || !["admin", "warehouse_manager"].includes(currentUser.role)) {
        return res.status(403).json({ message: "غير مصرح لك بالوصول" });
      }

      const { warehouseId } = req.params;
      const users = await storage.getUsersByWarehouse(warehouseId);
      res.json(users);
    } catch (error) {
      console.error("Get warehouse users error:", error);
      res.status(500).json({ message: "خطأ في جلب مستخدمي المخزن" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
