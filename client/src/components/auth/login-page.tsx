import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        setLocation("/dashboard/service-requests");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في نظام إدارة مراكز الصيانة",
        });
        // Navigation will be handled by the useEffect when user state updates
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: "تحقق من البريد الإلكتروني وكلمة المرور",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-xl border border-border">
        <div className="text-center mb-8">
          <div className="w-24 h-12 mx-auto mb-4 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">Sokany</span>
          </div>
          <h1 className="text-2xl font-bold text-card-foreground mb-2">تسجيل الدخول</h1>
          <p className="text-muted-foreground">مرحباً بك في نظام إدارة مراكز الصيانة</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-card-foreground">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sokany.com"
              required
              data-testid="input-email"
              className="text-right"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-card-foreground">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              data-testid="input-password"
              className="text-right"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">تذكرني</Label>
            </div>
            <Button variant="link" className="p-0 h-auto text-primary">نسيت كلمة المرور؟</Button>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
            data-testid="button-login"
          >
            {isLoading ? (
              <div className="loading-spinner mx-auto" />
            ) : (
              "تسجيل الدخول"
            )}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto font-medium"
            onClick={() => setLocation("/signup")}
            data-testid="link-signup"
          >
            إنشاء حساب جديد
          </Button>
        </p>
      </div>
    </div>
  );
}
