import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuickPaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  children: (paginatedData: T[], paginationControls: React.ReactNode) => React.ReactNode;
  className?: string;
}

/**
 * مكون Pagination سريع وبسيط يمكن تطبيقه على أي قائمة بيانات
 * 
 * الاستخدام:
 * <QuickPagination data={myData} itemsPerPage={15}>
 *   {(paginatedData, controls) => (
 *     <div>
 *       {paginatedData.map(item => <div key={item.id}>{item.name}</div>)}
 *       {controls}
 *     </div>
 *   )}
 * </QuickPagination>
 */
function QuickPagination<T extends Record<string, any>>({
  data,
  itemsPerPage = 15,
  itemsPerPageOptions = [5, 10, 15, 25, 50],
  children,
  className = ""
}: QuickPaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const { paginatedData, totalPages, startIndex, endIndex } = useMemo(() => {
    const total = Math.ceil(data.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    
    return {
      paginatedData: data.slice(start, end),
      totalPages: total,
      startIndex: start,
      endIndex: Math.min(end, data.length)
    };
  }, [data, currentPage, pageSize]);

  // إعادة تعيين الصفحة عند تغيير حجم الصفحة
  React.useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // عرض جميع الصفحات
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // عرض نطاق محدود من الصفحات
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const paginationControls = (
    <div className={`flex justify-between items-center mt-4 ${className}`}>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          عرض {data.length > 0 ? startIndex + 1 : 0}-{endIndex} من {data.length} عنصر
        </span>
        <div className="flex items-center gap-2">
          <span>عرض</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>سطر</span>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2"
          >
            السابق
          </Button>
          
          {generatePageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page as number)}
                  className="px-3"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2"
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );

  return <>{children(paginatedData, paginationControls)}</>;
}

export default QuickPagination;

// مثال للاستخدام في أي صفحة موجودة
export const PaginationExample = () => {
  const sampleData = Array.from({ length: 157 }, (_, i) => ({
    id: i + 1,
    name: `عنصر ${i + 1}`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    date: new Date().toLocaleDateString('ar-SA')
  }));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">مثال على Pagination سريع</h2>
      
      <QuickPagination data={sampleData} itemsPerPage={10}>
        {(paginatedData, paginationControls) => (
          <div>
            {/* عرض البيانات */}
            <div className="grid gap-2 mb-4">
              {paginatedData.map(item => (
                <div key={item.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{item.date}</div>
                </div>
              ))}
            </div>
            
            {/* أدوات التحكم في Pagination */}
            {paginationControls}
          </div>
        )}
      </QuickPagination>
    </div>
  );
};