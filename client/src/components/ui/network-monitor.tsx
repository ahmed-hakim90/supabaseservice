import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NetworkConnection {
  id: string;
  sourceIP: string;
  destinationIP: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  status: 'active' | 'closed' | 'listening';
  bandwidth: number; // in Mbps
  latency: number; // in ms
  packets: {
    sent: number;
    received: number;
    dropped: number;
  };
  timestamp: Date;
  duration: number; // in seconds
}

interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  type: 'server' | 'workstation' | 'router' | 'switch' | 'printer' | 'mobile' | 'iot';
  status: 'online' | 'offline' | 'warning';
  lastSeen: Date;
  operatingSystem?: string;
  openPorts: number[];
  vulnerabilities: number;
}

interface NetworkTraffic {
  timestamp: Date;
  inbound: number; // in MB
  outbound: number; // in MB
  totalConnections: number;
  protocols: {
    http: number;
    https: number;
    ftp: number;
    ssh: number;
    dns: number;
    other: number;
  };
}

interface NetworkAlert {
  id: string;
  type: 'high_traffic' | 'port_scan' | 'unusual_connection' | 'device_offline' | 'bandwidth_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  details: Record<string, any>;
}

interface NetworkMonitorProps {
  connections: NetworkConnection[];
  devices: NetworkDevice[];
  trafficHistory: NetworkTraffic[];
  alerts: NetworkAlert[];
  currentBandwidth: {
    download: number;
    upload: number;
    total: number;
    limit: number;
  };
  onBlockConnection: (connectionId: string) => Promise<void>;
  onScanNetwork: () => Promise<void>;
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
  onExportReport: (type: 'connections' | 'devices' | 'traffic') => Promise<void>;
  isLoading?: boolean;
}

export function NetworkMonitor({
  connections,
  devices,
  trafficHistory,
  alerts,
  currentBandwidth,
  onBlockConnection,
  onScanNetwork,
  onAcknowledgeAlert,
  onExportReport,
  isLoading = false
}: NetworkMonitorProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterIP, setFilterIP] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'server': return 'bi-hdd-network';
      case 'workstation': return 'bi-pc-display';
      case 'router': return 'bi-router';
      case 'switch': return 'bi-diagram-3';
      case 'printer': return 'bi-printer';
      case 'mobile': return 'bi-phone';
      case 'iot': return 'bi-cpu';
      default: return 'bi-device-hdd';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': case 'active': case 'listening': return 'text-green-600 bg-green-100';
      case 'offline': case 'closed': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-800';
      case 'high': return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const onlineDevices = devices.filter(d => d.status === 'online');
  const activeConnections = connections.filter(c => c.status === 'active');
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const bandwidthUsage = (currentBandwidth.total / currentBandwidth.limit) * 100;

  const filteredConnections = connections.filter(c => 
    filterIP === '' || c.sourceIP.includes(filterIP) || c.destinationIP.includes(filterIP)
  );

  const topTrafficDevices = connections
    .reduce((acc, conn) => {
      const ip = conn.sourceIP;
      if (!acc[ip]) acc[ip] = 0;
      acc[ip] += conn.bandwidth;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">مراقب الشبكة المتقدم</h3>
          <p className="text-muted-foreground">مراقبة شاملة للشبكة والاتصالات</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={unacknowledgedAlerts.length > 0 ? 'destructive' : 'secondary'}>
            {unacknowledgedAlerts.length} تنبيه
          </Badge>
          <Badge variant="outline">
            {onlineDevices.length}/{devices.length} أجهزة متصلة
          </Badge>
          <Button onClick={onScanNetwork} disabled={isLoading}>
            <i className="bi bi-arrow-clockwise mr-2"></i>
            فحص الشبكة
          </Button>
        </div>
      </div>

      {/* Network Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <i className="bi bi-exclamation-triangle text-orange-600"></i>
          <AlertDescription className="text-orange-800">
            يوجد {unacknowledgedAlerts.length} تنبيه شبكة يحتاج إلى مراجعة.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="devices">الأجهزة</TabsTrigger>
          <TabsTrigger value="connections">الاتصالات</TabsTrigger>
          <TabsTrigger value="traffic">حركة البيانات</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Network Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الأجهزة المتصلة</p>
                    <p className="text-2xl font-bold">{onlineDevices.length}</p>
                    <p className="text-xs text-muted-foreground">من {devices.length} جهاز</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <i className="bi bi-hdd-network text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الاتصالات النشطة</p>
                    <p className="text-2xl font-bold">{activeConnections.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i className="bi bi-diagram-3 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">استخدام النطاق الترددي</p>
                    <p className="text-2xl font-bold">{bandwidthUsage.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {currentBandwidth.total} من {currentBandwidth.limit} Mbps
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    bandwidthUsage > 80 ? 'bg-red-100 text-red-600' :
                    bandwidthUsage > 60 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-speedometer2 text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">تنبيهات الشبكة</p>
                    <p className="text-2xl font-bold">{unacknowledgedAlerts.length}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    unacknowledgedAlerts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    <i className="bi bi-exclamation-triangle text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bandwidth Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="bi bi-speedometer2"></i>
                استخدام النطاق الترددي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>إجمالي الاستخدام</span>
                  <span>{currentBandwidth.total} / {currentBandwidth.limit} Mbps</span>
                </div>
                <Progress value={bandwidthUsage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>التحميل</span>
                    <span>{currentBandwidth.download} Mbps</span>
                  </div>
                  <Progress 
                    value={(currentBandwidth.download / currentBandwidth.limit) * 100} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>الرفع</span>
                    <span>{currentBandwidth.upload} Mbps</span>
                  </div>
                  <Progress 
                    value={(currentBandwidth.upload / currentBandwidth.limit) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Network Activity */}
          <Card>
            <CardHeader>
              <CardTitle>النشاط الحديث للشبكة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeConnections.slice(0, 5).map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(connection.status)}>
                        {connection.protocol}
                      </Badge>
                      <div>
                        <div className="font-medium">
                          {connection.sourceIP} → {connection.destinationIP}:{connection.port}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {connection.bandwidth.toFixed(2)} Mbps • {connection.latency}ms زمن استجابة
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <i className="bi bi-eye"></i>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الأجهزة المتصلة ({devices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedDevice?.id === device.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <i className={`bi ${getDeviceIcon(device.type)} text-xl`}></i>
                        <span className="font-medium">{device.name}</span>
                      </div>
                      <Badge className={getStatusColor(device.status)}>
                        {device.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>عنوان IP:</span>
                        <span className="font-mono">{device.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>النوع:</span>
                        <span>{device.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>آخر ظهور:</span>
                        <span>{device.lastSeen.toLocaleString('ar-SA')}</span>
                      </div>
                      {device.vulnerabilities > 0 && (
                        <div className="flex justify-between">
                          <span>الثغرات:</span>
                          <Badge variant="destructive" className="text-xs">
                            {device.vulnerabilities}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>اتصالات الشبكة ({connections.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="تصفية حسب عنوان IP"
                    value={filterIP}
                    onChange={(e) => setFilterIP(e.target.value)}
                    className="w-48"
                  />
                  <Button
                    variant="outline"
                    onClick={() => onExportReport('connections')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-download mr-2"></i>
                    تصدير
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredConnections.map((connection) => (
                  <div key={connection.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(connection.status)}>
                          {connection.status}
                        </Badge>
                        <span className="font-mono text-sm">
                          {connection.sourceIP} → {connection.destinationIP}:{connection.port}
                        </span>
                        <Badge variant="outline">{connection.protocol}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBlockConnection(connection.id)}
                        disabled={isLoading}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <i className="bi bi-x-circle mr-1"></i>
                        حجب
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">النطاق الترددي:</span>
                        <span className="mr-2 font-medium">{connection.bandwidth.toFixed(2)} Mbps</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">زمن الاستجابة:</span>
                        <span className="mr-2 font-medium">{connection.latency}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الحزم المرسلة:</span>
                        <span className="mr-2 font-medium">{connection.packets.sent.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المدة:</span>
                        <span className="mr-2 font-medium">{Math.round(connection.duration)}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات حركة البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Protocol Distribution */}
              <div>
                <h4 className="font-medium mb-3">توزيع البروتوكولات</h4>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                  {trafficHistory.length > 0 && Object.entries(trafficHistory[trafficHistory.length - 1].protocols).map(([protocol, count]) => (
                    <div key={protocol} className="text-center p-3 rounded-lg bg-muted">
                      <div className="font-semibold">{count}</div>
                      <div className="text-xs text-muted-foreground uppercase">{protocol}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Traffic Sources */}
              <div>
                <h4 className="font-medium mb-3">أكبر مصادر البيانات</h4>
                <div className="space-y-2">
                  {Object.entries(topTrafficDevices)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([ip, bandwidth]) => (
                      <div key={ip} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                        <span className="font-mono text-sm">{ip}</span>
                        <span className="font-medium">{bandwidth.toFixed(2)} Mbps</span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنبيهات الشبكة ({alerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="bi bi-check-circle text-2xl mb-2 block"></i>
                    لا توجد تنبيهات شبكة
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertColor(alert.severity)} ${
                        alert.acknowledged ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.severity}
                            </Badge>
                            <span className="font-medium">{alert.message}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            المصدر: {alert.source} • {alert.timestamp.toLocaleString('ar-SA')}
                          </div>
                          {alert.details && (
                            <div className="text-xs text-muted-foreground">
                              {Object.entries(alert.details).map(([key, value]) => (
                                <span key={key} className="mr-4">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            disabled={isLoading}
                          >
                            إقرار
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}