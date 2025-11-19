import type { Route } from "./+types/signin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, useActionData, useNavigation, redirect, Link, useNavigate } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In - Converge Space" },
    { name: "description", content: "Sign in to your Converge Space account" },
  ];
}

export async function loader() {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  console.log("[FRONTEND] Sign in attempt:", { email });

  try {
    const response = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "An error occurred" };
    }

    // Store token in localStorage (only in browser)
    // Note: In React Router, actions run on server, so we'll handle storage in the component
    // Return the token so component can store it
    return { 
      success: true, 
      token: data.token,
      user: data.user 
    };
  } catch (error) {
    console.error("[FRONTEND] Login error:", error);
    return { error: "Failed to connect to server" };
  }
}

export default function SignIn() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  // Handle redirect on successful login
  useEffect(() => {
    if (actionData?.success && actionData?.token) {
      // Store token in localStorage
      localStorage.setItem("token", actionData.token);
      localStorage.setItem("user", JSON.stringify(actionData.user));
      console.log("[FRONTEND] Login successful, token stored");
      
      // Use window.location for reliable redirect
      window.location.href = "/dashboard";
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="demo@converge-space.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="demo123"
                required
              />
            </div>
            {actionData?.error && (
              <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
                {actionData.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center mt-4">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
            <div className="text-center mt-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

