import { useState, type FormEvent } from "react";
import { BarChart3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

type Mode = "signin" | "signup";

export function Login() {
  const setSession = useAuthStore((s) => s.setSession);
  const enterDemo = useAuthStore((s) => s.enterDemo);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result =
        mode === "signin"
          ? await api.login(email, password)
          : await api.register(email, password, name || undefined);
      setSession(result.token, result.user);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong, try again"
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-2 lg:items-center">
        {/* Brand panel */}
        <div className="hidden flex-col gap-4 lg:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BarChart3 className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold tracking-tight">
              Metricool<span className="text-primary"> Lite</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Schedule once.
            <br />
            Publish to Instagram & TikTok automatically.
          </h1>
          <p className="text-muted-foreground">
            Connect your accounts, plan your content on a calendar, and let the
            scheduler publish for you — then watch the numbers roll in.
          </p>
        </div>

        {/* Auth card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Sign in to manage your scheduled posts."
                : "A free account to connect your socials and start scheduling."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    No account?{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode("signup")}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{" "}
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode("signin")}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>

            <div className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => enterDemo()}
            >
              <Sparkles className="h-4 w-4" />
              Explore the demo (no account needed)
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Demo mode runs on generated data and never posts anywhere.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
