import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SecurityThreat {
  id: string;
  type: 'malware' | 'intrusion' | 'ddos' | 'brute_force' | 'data_breach' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  timestamp: Date;
  status: 'active' | 'mitigated' | 'investigating';
  description: string;
  details: Record<string, any>;
}

interface SecurityPolicy {
  id: string;
  name: string;
  category: 'authentication' | 'authorization' | 'network' | 'data' | 'compliance';
  description: string;
  enabled: boolean;
  rules: SecurityRule[];
  lastModified: Date;
  modifiedBy: string;
}

interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'alert' | 'quarantine';
  priority: number;
  enabled: boolean;
}

interface SecurityAudit {
  id: string;
  type: 'login' | 'permission_change' | 'data_access' | 'system_change' | 'policy_update';
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  details: Record<string, any>;
}

interface SecurityMetrics {
  threatsBlocked: number;
  loginAttempts: number;
  failedLogins: number;
  suspiciousActivities: number;
  securityScore: number;
  vulnerabilities: number;
  patchLevel: number;
  lastSecurityScan: Date;
}

interface SecurityDashboardProps {
  threats: SecurityThreat[];
  policies: SecurityPolicy[];
  auditLogs: SecurityAudit[];
  metrics: SecurityMetrics;
  onMitigateThreat: (threatId: string) => Promise<void>;
  onUpdatePolicy: (policyId: string, updates: Partial<SecurityPolicy>) => Promise<void>;
  onRunSecurityScan: () => Promise<void>;
  onExportAuditLog: (filters: any) => Promise<void>;
  isLoading?: boolean;
}

export function SecurityDashboard({
  threats,
  policies,
  auditLogs,
  metrics,
  onMitigateThreat,
  onUpdatePolicy,
  onRunSecurityScan,
  onExportAuditLog,
  isLoading = false
}: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedThreat, setSelectedThreat] = useState<SecurityThreat | null>(null);

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'malware': return 'bi-bug';
      case 'intrusion': return 'bi-shield-exclamation';
      case 'ddos': return 'bi-arrow-repeat';
      case 'brute_force': return 'bi-key';
      case 'data_breach': return 'bi-database-exclamation';
      case 'suspicious_activity': return 'bi-eye';
      default: return 'bi-exclamation-triangle';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const activeThreats = threats.filter(t => t.status === 'active');
  const criticalThreats = activeThreats.filter(t => t.severity === 'critical');
  const recentAudits = auditLogs.slice(0, 10);
  const enabledPolicies = policies.filter(p => p.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">لوحة الأمان المتقدمة</h3>
          <p className="text-muted-foreground">مراقبة وحماية شاملة للنظام</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={criticalThreats.length > 0 ? 'destructive' : 'secondary'}>
            {criticalThreats.length} تهديد حرج
          </Badge>
          <Badge 
            variant="outline" 
            className={getSecurityScoreColor(metrics.securityScore)}
          >
            نقاط الأمان: {metrics.securityScore}/100
          </Badge>
          <Button onClick={onRunSecurityScan} disabled={isLoading}>
            <i className="bi bi-shield-check mr-2"></i>
            فحص أمني
          </Button>
        </div>
      </div>

      {/* Critical Threats Alert */}
      {criticalThreats.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <i className="bi bi-shield-exclamation text-red-600"></i>
          <AlertDescription className="text-red-800">
            تم اكتشاف {criticalThreats.length} تهديد حرج يتطلب تدخلاً فورياً!
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="threats">التهديدات</TabsTrigger>
          <TabsTrigger value="policies">السياسات</TabsTrigger>
          <TabsTrigger value="audit">سجل التدقيق</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">التهديدات المحجوبة</p>
                    <p className="text-2xl font-bold">{metrics.threatsBlocked}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <i className="bi bi-shield-check text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">محاولات تسجيل الدخول</p>
                    <p className="text-2xl font-bold">{metrics.loginAttempts}</p>
                    <p className="text-xs text-red-600">{metrics.failedLogins} فاشلة</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i className="bi bi-person-check text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">نقاط الأمان</p>
                    <p className={`text-2xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
                      {metrics.securityScore}/100
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.securityScore >= 80 ? 'bg-green-100 text-green-600' :
                    metrics.securityScore >= 60 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <i className="bi bi-award text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الثغرات الأمنية</p>
                    <p className="text-2xl font-bold">{metrics.vulnerabilities}</p>
                    <p className="text-xs text-muted-foreground">
                      آخر فحص: {metrics.lastSecurityScan.toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    metrics.vulnerabilities === 0 ? 'bg-green-100 text-green-600' :
                    metrics.vulnerabilities < 5 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <i className="bi bi-bug text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Score Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-shield-check"></i>
                تقييم الأمان الشامل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>نقاط الأمان العامة</span>
                  <span className={getSecurityScoreColor(metrics.securityScore)}>
                    {metrics.securityScore}/100
                  </span>
                </div>
                <Progress value={metrics.securityScore} className="h-3" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>مستوى التحديثات</span>
                  <span>{metrics.patchLevel}%</span>
                </div>
                <Progress value={metrics.patchLevel} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <div className="text-green-600 font-semibold">{enabledPolicies.length}</div>
                  <div className="text-xs text-muted-foreground">سياسة نشطة</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <div className="text-blue-600 font-semibold">{activeThreats.length}</div>
                  <div className="text-xs text-muted-foreground">تهديد نشط</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50">
                  <div className="text-orange-600 font-semibold">{metrics.suspiciousActivities}</div>
                  <div className="text-xs text-muted-foreground">نشاط مشبوه</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>الأحداث الأمنية الحديثة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAudits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-shield-check text-2xl mb-2 block"></i>
                    لا توجد أحداث أمنية حديثة
                  </div>
                ) : (
                  recentAudits.map((audit) => (
                    <div key={audit.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`w-3 h-3 rounded-full ${
                        audit.success ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{audit.action}</span>
                          <Badge variant="outline" className={`text-xs ${
                            audit.riskLevel === 'high' ? 'border-red-200 text-red-700' :
                            audit.riskLevel === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-gray-200 text-gray-700'
                          }`}>
                            {audit.riskLevel}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {audit.userName} • {audit.ipAddress} • 
                          {audit.timestamp.toLocaleString('ar-SA')}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <i className="bi bi-eye"></i>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التهديدات النشطة ({activeThreats.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeThreats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-shield-check text-2xl mb-2 block"></i>
                    لا توجد تهديدات نشطة
                  </div>
                ) : (
                  activeThreats.map((threat) => (
                    <div
                      key={threat.id}
                      className={`p-4 rounded-lg border ${getSeverityColor(threat.severity)} cursor-pointer`}
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <i className={`bi ${getThreatIcon(threat.type)} text-xl`}></i>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{threat.description}</span>
                              <Badge className={getSeverityColor(threat.severity)}>
                                {threat.severity}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              المصدر: {threat.source} → الهدف: {threat.target}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {threat.timestamp.toLocaleString('ar-SA')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMitigateThreat(threat.id);
                            }}
                            disabled={isLoading}
                          >
                            <i className="bi bi-shield-check mr-1"></i>
                            معالجة
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {policies.map((policy) => (
              <Card key={policy.id} className={policy.enabled ? '' : 'opacity-60'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{policy.name}</CardTitle>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={(enabled) => 
                        onUpdatePolicy(policy.id, { enabled })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {policy.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>التصنيف:</span>
                      <Badge variant="outline">{policy.category}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>عدد القواعد:</span>
                      <span>{policy.rules.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>آخر تعديل:</span>
                      <span>{policy.lastModified.toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>سجل التدقيق الأمني</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => onExportAuditLog({})}
                  disabled={isLoading}
                >
                  <i className="bi bi-download mr-2"></i>
                  تصدير السجل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((audit) => (
                  <div key={audit.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          audit.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium">{audit.action}</span>
                        <Badge variant="outline" className={`text-xs ${
                          audit.riskLevel === 'high' ? 'border-red-200 text-red-700' :
                          audit.riskLevel === 'medium' ? 'border-yellow-200 text-yellow-700' :
                          'border-gray-200 text-gray-700'
                        }`}>
                          {audit.riskLevel}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {audit.timestamp.toLocaleString('ar-SA')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">المستخدم:</span>
                        <span className="mr-2">{audit.userName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المورد:</span>
                        <span className="mr-2">{audit.resource}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">عنوان IP:</span>
                        <span className="mr-2">{audit.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">النوع:</span>
                        <span className="mr-2">{audit.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الامتثال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-sm text-muted-foreground">GDPR</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-muted-foreground">ISO 27001</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">87%</div>
                  <div className="text-sm text-muted-foreground">SOC 2</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">التوصيات التحسينية</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-exclamation-circle text-yellow-600"></i>
                    <span>تحديث سياسات كلمات المرور لتتوافق مع ISO 27001</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-info-circle text-blue-600"></i>
                    <span>إجراء مراجعة دورية للصلاحيات كل 3 أشهر</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-check-circle text-green-600"></i>
                    <span>تشفير البيانات الحساسة مكتمل</span>
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