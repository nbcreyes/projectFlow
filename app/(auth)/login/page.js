"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - warm illustrated side */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(18,72%,52%)] relative overflow-hidden flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-white font-bold text-lg">ProjectFlow</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Work together,<br />get things done.
            </h1>
            <p className="text-white/75 text-lg leading-relaxed">
              A calm, focused place for your team to plan, track, and celebrate progress.
            </p>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-white/90 text-sm leading-relaxed italic">
              "ProjectFlow changed how our team communicates. Everything is in one place and it actually feels pleasant to use."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="h-7 w-7 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Sarah K.</p>
                <p className="text-white/60 text-xs">Product Lead</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs">
          &copy; {new Date().getFullYear()} ProjectFlow. All rights reserved.
        </p>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-8 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg">ProjectFlow</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}