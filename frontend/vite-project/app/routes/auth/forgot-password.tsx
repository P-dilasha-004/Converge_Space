import type { Route } from "./+types/forgot-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, useActionData, useNavigation, Link, useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Forgot Password - Converge Space" },
    { name: "description", content: "Reset your password" },
  ];
}

export async function loader() {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  console.log("[FRONTEND] Password reset request:", { email });

  try {
    const response = await fetch("http://localhost:5001/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "An error occurred" };
    }

    // In development, show the code for testing
    return { 
      success: true, 
      message: data.message,
      code: data.code, // Only in development
      email: email as string,
    };
  } catch (error) {
    console.error("[FRONTEND] Password reset error:", error);
    return { error: "Failed to connect to server" };
  }
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const handleContinue = () => {
    if (actionData?.email) {
      navigate(`/verify-code?email=${encodeURIComponent(actionData.email)}`);
    }
  };

  if (actionData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification code to {actionData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                {actionData.message}
              </p>
              {actionData.code && (
                <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                  <p className="text-xs text-gray-600 mb-1">Development Mode - Verification Code:</p>
                  <p className="text-2xl font-bold text-blue-600 font-mono">{actionData.code}</p>
                  <p className="text-xs text-gray-500 mt-2">Copy this code to use on the next page</p>
                </div>
              )}
            </div>
            <Button 
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Continue to Verify Code
            </Button>
            <Link to="/signin">
              <Button variant="outline" className="w-full">Back to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a verification code
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
                placeholder="you@example.com"
                required
              />
            </div>
            {actionData?.error && (
              <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
                {actionData.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Verification Code"}
            </Button>
            <div className="text-center">
              <Link to="/signin" className="text-sm text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

