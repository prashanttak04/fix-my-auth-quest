import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Recycle } from "lucide-react";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_employee')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.is_employee) {
          navigate("/employee/dashboard");
        } else {
          navigate("/citizen/dashboard");
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>, isEmployee: boolean) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    try {
      // Validate input
      const validatedData = signUpSchema.parse({ email, password, username });

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: validatedData.username,
            is_employee: isEmployee,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Account created successfully. You can now sign in.",
      });

      // Switch to sign in tab
      const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
      signInTab?.click();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Validate input
      const validatedData = signInSchema.parse({ email, password });

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      // Get user profile to check if employee
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_employee')
        .eq('id', data.user.id)
        .single();

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

      // Redirect based on user type
      if (profile?.is_employee) {
        navigate("/employee/dashboard");
      } else {
        navigate("/citizen/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Recycle className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Smart Sewage Management</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <Tabs defaultValue="citizen" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="citizen">Citizen</TabsTrigger>
                  <TabsTrigger value="employee">Employee</TabsTrigger>
                </TabsList>

                <TabsContent value="citizen">
                  <form onSubmit={(e) => handleSignUp(e, false)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="citizen-username">Username</Label>
                      <Input
                        id="citizen-username"
                        name="username"
                        type="text"
                        placeholder="johndoe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citizen-email">Email</Label>
                      <Input
                        id="citizen-email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citizen-password">Password</Label>
                      <Input
                        id="citizen-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up as Citizen"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="employee">
                  <form onSubmit={(e) => handleSignUp(e, true)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee-username">Username</Label>
                      <Input
                        id="employee-username"
                        name="username"
                        type="text"
                        placeholder="johndoe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-email">Email</Label>
                      <Input
                        id="employee-email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-password">Password</Label>
                      <Input
                        id="employee-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up as Employee"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
