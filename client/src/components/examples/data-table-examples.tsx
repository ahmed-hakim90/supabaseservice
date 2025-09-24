import React from "react";
import DataTable, { Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-progress";

// مثال لتطبيق DataTable على العملاء
export const CustomersTableExample = ({ customers, isLoading, onEdit, onDelete }) => {
  const columns: Column<any>[] = [
    {
      key: 'fullName',
      header: 'اسم العميل',
      searchable: true,
      render: (customer) => (
        <div className="font-medium">{customer.fullName}</div>
      )
    },
    {
      key: 'email',
      header: 'البريد الإلكتروني',
      searchable: true,
      render: (customer) => (
        <div className="text-muted-foreground">{customer.email}</div>
      )
    },
    {
      key: 'phone',
      header: 'رقم الهاتف',
      render: (customer) => (
        <div>{customer.phone || 'غير محدد'}</div>
      )
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (customer) => (
        <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
          {customer.status === 'active' ? 'نشط' : 'غير نشط'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'تاريخ التسجيل',
      render: (customer) => (
        <div className="text-sm text-muted-foreground">
          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (customer) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit?.(customer)}>
            تعديل
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete?.(customer.id)}>
            حذف
          </Button>
        </div>
      )
    }
  ];

  return (
    <DataTable 
      data={customers}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="البحث في العملاء..."
      emptyMessage="لا يوجد عملاء للعرض"
      pagination={{
        totalItemsToFetch: 100,
        defaultItemsPerPage: 15,
        itemsPerPageOptions: [10, 15, 25, 50]
      }}
    />
  );
};

// مثال لتطبيق DataTable على المنتجات
export const ProductsTableExample = ({ products, categories, isLoading, onEdit, onDelete }) => {
  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'اسم المنتج',
      searchable: true,
      render: (product) => (
        <div className="font-medium">{product.name}</div>
      )
    },
    {
      key: 'model',
      header: 'الموديل',
      searchable: true,
      render: (product) => (
        <div className="text-muted-foreground">{product.model || 'غير محدد'}</div>
      )
    },
    {
      key: 'categoryId',
      header: 'الفئة',
      render: (product) => {
        const category = categories?.find(c => c.id === product.categoryId);
        return (
          <Badge variant="outline">
            {category?.name || 'غير محدد'}
          </Badge>
        );
      }
    },
    {
      key: 'price',
      header: 'السعر',
      render: (product) => (
        <div className="font-medium">
          {product.price ? `${product.price} ريال` : 'غير محدد'}
        </div>
      )
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (product) => (
        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
          {product.status === 'active' ? 'متاح' : 'غير متاح'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (product) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onEdit?.(product)}>
            تعديل
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete?.(product.id)}>
            حذف
          </Button>
        </div>
      )
    }
  ];

  return (
    <DataTable 
      data={products}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="البحث في المنتجات..."
      searchKeys={['name', 'model']} // البحث في حقول محددة
      emptyMessage="لا يوجد منتجات للعرض"
      pagination={{
        totalItemsToFetch: 200,
        defaultItemsPerPage: 20,
        itemsPerPageOptions: [10, 20, 50, 100]
      }}
    />
  );
};

// مثال لتطبيق DataTable على طلبات الصيانة
export const ServiceRequestsTableExample = ({ requests, isLoading, onView, onEdit, onDelete }) => {
  const columns: Column<any>[] = [
    {
      key: 'requestNumber',
      header: 'رقم الطلب',
      searchable: true,
      render: (request) => (
        <div className="font-mono text-primary font-medium">
          {request.requestNumber}
        </div>
      )
    },
    {
      key: 'deviceName',
      header: 'اسم الجهاز',
      searchable: true,
      render: (request) => (
        <div>
          <div className="font-medium">{request.deviceName}</div>
          {request.model && (
            <div className="text-sm text-muted-foreground">{request.model}</div>
          )}
        </div>
      )
    },
    {
      key: 'issue',
      header: 'المشكلة',
      render: (request) => (
        <div className="max-w-xs truncate" title={request.issue}>
          {request.issue}
        </div>
      )
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (request) => <StatusBadge status={request.status} />
    },
    {
      key: 'estimatedCost',
      header: 'التكلفة المتوقعة',
      render: (request) => (
        <div className="font-medium">
          {request.estimatedCost ? `${request.estimatedCost} ريال` : 'غير محدد'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      render: (request) => (
        <div className="text-sm text-muted-foreground">
          {request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (request) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onView?.(request)}>
            عرض
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit?.(request)}>
            تعديل
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete?.(request.id)}>
            حذف
          </Button>
        </div>
      )
    }
  ];

  return (
    <DataTable 
      data={requests}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="البحث في طلبات الصيانة..."
      searchKeys={['requestNumber', 'deviceName']}
      emptyMessage="لا توجد طلبات صيانة للعرض"
      pagination={{
        totalItemsToFetch: 150,
        defaultItemsPerPage: 10,
        itemsPerPageOptions: [5, 10, 20, 50]
      }}
      onItemClick={(request) => onView?.(request)}
    />
  );
};

// Hook مساعد للاستخدام مع API
export const usePaginatedData = (endpoint: string, limit = 100) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${endpoint}?limit=${limit}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, limit]);

  return { data, loading, error, refetch: () => fetchData() };
};