import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  permissions: string[];
  description: string;
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
}

interface AdvancedPermissionManagerProps {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  onUpdateUserRole: (userId: string, roleId: string) => Promise<void>;
  onUpdateUserPermissions: (userId: string, permissions: string[]) => Promise<void>;
  onUpdateRolePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  onCreateRole: (role: Omit<Role, 'id'>) => Promise<void>;
  onDeleteRole: (roleId: string) => Promise<void>;
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function AdvancedPermissionManager({
  users,
  roles,
  permissions,
  onUpdateUserRole,
  onUpdateUserPermissions,
  onUpdateRolePermissions,
  onCreateRole,
  onDeleteRole,
  onToggleUserStatus,
  isLoading = false
}: AdvancedPermissionManagerProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserPermissionChange = async (userId: string, permissionId: string, granted: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedPermissions = granted
      ? [...user.permissions, permissionId]
      : user.permissions.filter(p => p !== permissionId);

    await onUpdateUserPermissions(userId, updatedPermissions);
  };

  const handleRolePermissionChange = async (roleId: string, permissionId: string, granted: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const updatedPermissions = granted
      ? [...role.permissions, permissionId]
      : role.permissions.filter(p => p !== permissionId);

    await onUpdateRolePermissions(roleId, updatedPermissions);
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim() || !newRole.displayName.trim()) return;

    await onCreateRole({
      name: newRole.name,
      displayName: newRole.displayName,
      description: newRole.description,
      permissions: newRole.permissions,
      isSystem: false
    });

    // Reset form
    setNewRole({
      name: '',
      displayName: '',
      description: '',
      permissions: []
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">إدارة الصلاحيات المتقدمة</h3>
          <p className="text-muted-foreground">التحكم الشامل في صلاحيات المستخدمين والأدوار</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input
            placeholder="البحث في المستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <i className="bi bi-people"></i>
            المستخدمون ({users.length})
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <i className="bi bi-shield-check"></i>
            الأدوار ({roles.length})
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <i className="bi bi-key"></i>
            الصلاحيات ({permissions.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <i className="bi bi-clock-history"></i>
            السجل
          </TabsTrigger>
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-person-x text-2xl mb-2 block"></i>
                    لا توجد مستخدمين
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <i className="bi bi-person"></i>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        آخر دخول: {user.lastLogin ? user.lastLogin.toLocaleDateString('ar-SA') : 'لم يدخل بعد'}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* User Details */}
            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>تفاصيل المستخدم</span>
                    <Switch
                      checked={selectedUser.isActive}
                      onCheckedChange={(checked) => onToggleUserStatus(selectedUser.id, checked)}
                      disabled={isLoading}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">الاسم</Label>
                      <p className="font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">البريد الإلكتروني</Label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="userRole">الدور</Label>
                    <Select
                      value={selectedUser.role}
                      onValueChange={(value) => onUpdateUserRole(selectedUser.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium mb-3 block">صلاحيات إضافية</Label>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                        <div key={category}>
                          <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                          <div className="space-y-2 ml-4">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`user-${selectedUser.id}-permission-${permission.id}`}
                                  checked={selectedUser.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) => 
                                    handleUserPermissionChange(selectedUser.id, permission.id, !!checked)
                                  }
                                />
                                <Label
                                  htmlFor={`user-${selectedUser.id}-permission-${permission.id}`}
                                  className="text-sm"
                                >
                                  {permission.displayName}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Roles Management Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles List */}
            <Card>
              <CardHeader>
                <CardTitle>إدارة الأدوار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole?.id === role.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{role.displayName}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            نظام
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {role.permissions.length} صلاحية
                        </Badge>
                        {!role.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('هل أنت متأكد من حذف هذا الدور؟')) {
                                onDeleteRole(role.id);
                              }
                            }}
                          >
                            <i className="bi bi-trash text-red-500"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Create New Role */}
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                  <p className="font-medium">إنشاء دور جديد</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="roleName">اسم الدور</Label>
                      <Input
                        id="roleName"
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                        placeholder="admin, manager..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="roleDisplayName">الاسم المعروض</Label>
                      <Input
                        id="roleDisplayName"
                        value={newRole.displayName}
                        onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                        placeholder="مدير، مشرف..."
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateRole} 
                    disabled={!newRole.name.trim() || !newRole.displayName.trim() || isLoading}
                    className="w-full"
                  >
                    <i className="bi bi-plus-circle mr-2"></i>
                    إنشاء دور
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Role Permissions */}
            {selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle>صلاحيات الدور: {selectedRole.displayName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-medium">{category}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allCategoryPermissions = categoryPermissions.map(p => p.id);
                              const hasAll = allCategoryPermissions.every(p => selectedRole.permissions.includes(p));
                              const newPermissions = hasAll
                                ? selectedRole.permissions.filter(p => !allCategoryPermissions.includes(p))
                                : Array.from(new Set([...selectedRole.permissions, ...allCategoryPermissions]));
                              onUpdateRolePermissions(selectedRole.id, newPermissions);
                            }}
                          >
                            {categoryPermissions.every(p => selectedRole.permissions.includes(p.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
                          </Button>
                        </div>
                        
                        <div className="space-y-2 ml-4">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${selectedRole.id}-permission-${permission.id}`}
                                checked={selectedRole.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handleRolePermissionChange(selectedRole.id, permission.id, !!checked)
                                }
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={`role-${selectedRole.id}-permission-${permission.id}`}
                                  className="text-sm font-medium"
                                >
                                  {permission.displayName}
                                </Label>
                                {permission.description && (
                                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Permissions Overview Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryPermissions.map((permission) => (
                      <div key={permission.id} className="p-2 rounded-lg border">
                        <p className="font-medium text-sm">{permission.displayName}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                        <div className="flex gap-1 mt-2">
                          {roles.filter(role => role.permissions.includes(permission.id)).map(role => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.displayName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل تغييرات الصلاحيات</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <i className="bi bi-info-circle"></i>
                <AlertDescription>
                  سيتم تسجيل جميع تغييرات الصلاحيات والأدوار هنا للمراجعة والتدقيق.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 space-y-3">
                {/* Sample audit entries */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <i className="bi bi-person-gear text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">تم تعديل صلاحيات المستخدم أحمد محمد</p>
                    <p className="text-xs text-muted-foreground">أضيفت صلاحية "إدارة المخازن" • منذ ساعتين</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <i className="bi bi-shield-plus text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">تم إنشاء دور جديد "مشرف المبيعات"</p>
                    <p className="text-xs text-muted-foreground">بواسطة المدير العام • منذ يوم واحد</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}