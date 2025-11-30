import type { Route } from "./+types/verify-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, useActionData, useNavigation, useSearchParams, Link } from "react-router";
import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify Code - Converge Space" },
    { name: "description", content: "Enter your verification code" },
  ];
}

export async function loader() {
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const code = formData.get("code");

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Invalid verification code" };
    }

    return { 
      success: true, 
      message: data.message,
      email: email as string,
      code: code as string,
    };
  } catch (error) {
    console.error("[FRONTEND] Verify code error:", error);
    return { error: "Failed to connect to server" };
  }
}

export default function VerifyCode() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (actionData?.success) {
      // Redirect to reset password page
      window.location.href = `/reset-password?email=${encodeURIComponent(actionData.email)}&code=${encodeURIComponent(actionData.code)}`;
    }
  }, [actionData]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, ""); // Only numbers
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || "";
    }
    setCode(newCode);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      const form = e.target as HTMLFormElement;
      const codeInput = document.createElement("input");
      codeInput.type = "hidden";
      codeInput.name = "code";
      codeInput.value = fullCode;
      form.appendChild(codeInput);
      form.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Enter Verification Code</CardTitle>
          <CardDescription>
            We sent a 6-digit code to {email || "your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="email" value={email} />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-center block">
                Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold"
                    required
                  />
                ))}
              </div>
            </div>

            {actionData?.error && (
              <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
                {actionData.error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
              disabled={isSubmitting || code.join("").length !== 6}
            >
              {isSubmitting ? "Verifying..." : code.join("").length === 6 ? "Verify Code" : `Enter ${6 - code.join("").length} more digit${6 - code.join("").length > 1 ? 's' : ''}`}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                <Link to="/forgot-password" className="text-blue-600 hover:underline">
                  Resend
                </Link>
              </p>
              <Link to="/signin" className="text-sm text-blue-600 hover:underline block">
                Back to Sign In
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

