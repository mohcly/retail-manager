import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logoUrl from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultDashboardRoute } from '@/utils/accessControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Store } from 'lucide-react';
import { z } from 'zod';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useDevice } from '@/contexts/DeviceContext';
import { MobileAuthPage } from '@/components/mobile/Auth/MobileAuthPage';
import { predictTenantByEmail, REGISTERED_TENANTS } from '@/lib/tenants';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, rolesLoading, hasRole, roles, loading: authLoading, devLogin, isBackendReady } = useAuth();
  const { isDesktop } = useDevice();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user came from "Get Started" button
  const fromGetStarted = (location.state as any)?.fromGetStarted === true;

  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const detectedTenantId = loginData.email ? predictTenantByEmail(loginData.email) : null;
  const detectedTenant = detectedTenantId ? REGISTERED_TENANTS[detectedTenantId] : null;

  useEffect(() => {
    console.log('🔐 AuthPage useEffect - user:', !!user, 'rolesLoading:', rolesLoading, 'roles.length:', roles.length, 'authLoading:', authLoading, 'fromGetStarted:', fromGetStarted);

    // If auth check is complete and no user
    if (!authLoading && !user) {
      console.log('👤 No user found - showing login form');
      // We no longer force redirect to landing page to prevent loops
    }

    // Wait for roles to load before redirecting authenticated users
    // Only redirect if user is authenticated, roles are loaded, AND roles exist
    if (user && !rolesLoading && roles.length > 0) {
      console.log('🚀 User authenticated with roles, navigating to dashboard...');
      const timeout = setTimeout(() => {
        const userRoles = roles.map(r => r.role);
        const dashboardRoute = getDefaultDashboardRoute(userRoles);
        console.log('📍 Navigating to', dashboardRoute, 'for roles:', userRoles);
        navigate(dashboardRoute, { replace: true });
      }, 100);
      return () => clearTimeout(timeout);
    } else if (user && !rolesLoading && roles.length === 0) {
      console.log('⚠️ User exists but no roles found - staying on auth page');
    }
  }, [user, rolesLoading, roles, navigate, authLoading, fromGetStarted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      loginSchema.parse(loginData);
      setLoading(true);

      const { error } = await signIn(loginData.email, loginData.password);

      if (error) {
        setErrors({ form: error.message });
        setLoading(false);
      } else {
        // If no error, we expect roles to load via context
        // But if roles are empty after sign-in, we need to stop loading manually after a timeout
        // or check if we got roles. signIn in AuthContext sets roles.
        // If signIn returned no error but roles are empty, it means user has no roles.
        // We can't easily check AuthContext state *here* instantly because it's async update.
        // But we can set a timeout to stop loading if redirect doesn't happen.
        setTimeout(() => {
           setLoading(false);
           // If we are still here, it means no redirect happened
           // We can check user roles from context? No, closure stale.
           // But if we are here, we can assume something went wrong with role assignment
           // or we are just waiting.
           // Better: rely on useEffect to redirect. 
           // If we stop loading, the user sees the form again "signed in".
        }, 5000);
      }
      // Navigation will be handled by the useEffect hook when roles are loaded
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no user and auth check is complete, show the form (handled by return below)

  if (!isDesktop) {
    return (
      <MobileAuthPage
        loginData={loginData}
        setLoginData={setLoginData}
        handleLogin={handleLogin}
        loading={loading}
        errors={errors}
      />
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl">
            <img src={logoUrl} alt="Djati Logo" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Djati</CardTitle>
          <CardDescription>
            {t('auth.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth.email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    disabled={loading}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {detectedTenant && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-muted/60 border border-muted-foreground/20 text-foreground animate-in fade-in duration-200">
                      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: detectedTenant.accentColor }} />
                      <span>{detectedTenant.name}</span>
                    </div>
                  )}
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('auth.password')}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    disabled={loading}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {errors.form && (
                  <p className="text-sm text-destructive">{errors.form}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    t('auth.signIn')
                  )}
                </Button>
              </form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}