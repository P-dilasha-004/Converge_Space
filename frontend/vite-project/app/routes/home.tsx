import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Converge Space" },
    { name: "description", content: "Welcome to Converge Space!" },
  ];
}

export async function loader() {
  return null; 
}

export default function Homepage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Converge Space</h1>
          <p className="text-xl text-gray-600">
            Streamline your team collaboration and project management
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Create a new account to start managing your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/signup">
                <Button className="w-full">Sign Up</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Already have an account?</CardTitle>
              <CardDescription>
                Sign in to access your workspaces and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/signin">
                <Button className="w-full" variant="outline">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Manage workspaces • Create projects • Track tasks • Collaborate efficiently</p>
        </div>
      </div>
    </div>
  );
}