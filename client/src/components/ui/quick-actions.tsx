import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
  count?: number;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <i className="bi bi-lightning-charge"></i>
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className={`h-auto p-4 flex flex-col items-center justify-center gap-2 hover:bg-${action.color}-50 hover:border-${action.color}-200 transition-colors`}
            onClick={action.onClick}
          >
            <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 text-${action.color}-600 flex items-center justify-center`}>
              <i className={`bi ${action.icon} text-lg`}></i>
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
              {action.count !== undefined && (
                <div className={`w-5 h-5 rounded-full bg-${action.color}-500 text-white text-xs flex items-center justify-center mt-1 mx-auto`}>
                  {action.count}
                </div>
              )}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

interface RecentActivity {
  id: string;
  type: 'warehouse' | 'product' | 'transfer' | 'inventory';
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'completed';
  itemName: string;
  timestamp: Date;
  user?: string;
}

interface RecentActivitiesProps {
  activities: RecentActivity[];
  onViewAll: () => void;
}

export function RecentActivities({ activities, onViewAll }: RecentActivitiesProps) {
  const getActivityIcon = (type: string, action: string) => {
    const icons = {
      warehouse: {
        created: 'bi-building-add',
        updated: 'bi-building-gear',
        deleted: 'bi-building-dash'
      },
      product: {
        created: 'bi-box-plus',
        updated: 'bi-box-gear',
        deleted: 'bi-box-minus'
      },
      transfer: {
        created: 'bi-arrow-right-square',
        approved: 'bi-check-square',
        completed: 'bi-check-circle'
      },
      inventory: {
        created: 'bi-plus-circle',
        updated: 'bi-arrow-repeat'
      }
    };
    
    return icons[type as keyof typeof icons]?.[action as keyof typeof icons[keyof typeof icons]] || 'bi-info-circle';
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-600';
      case 'updated': return 'text-blue-600';
      case 'deleted': return 'text-red-600';
      case 'approved': return 'text-green-600';
      case 'completed': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return 'تم إنشاء';
      case 'updated': return 'تم تحديث';
      case 'deleted': return 'تم حذف';
      case 'approved': return 'تمت موافقة';
      case 'completed': return 'تم إنجاز';
      default: return action;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <i className="bi bi-activity"></i>
          النشاطات الحديثة
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          عرض الكل
          <i className="bi bi-arrow-left mr-1"></i>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <i className="bi bi-info-circle text-2xl mb-2 block"></i>
            لا توجد نشاطات حديثة
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${getActivityColor(activity.action)}`}>
                <i className={`bi ${getActivityIcon(activity.type, activity.action)}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getActionLabel(activity.action)} {activity.itemName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp.toLocaleDateString('ar-SA')} - 
                  {activity.timestamp.toLocaleTimeString('ar-SA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {activity.user && ` بواسطة ${activity.user}`}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}