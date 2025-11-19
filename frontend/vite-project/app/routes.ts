import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("signin", "routes/auth/signin.tsx"),
  route("signup", "routes/auth/signup.tsx"),
  route("forgot-password", "routes/auth/forgot-password.tsx"),
  route("verify-code", "routes/auth/verify-code.tsx"),
  route("reset-password", "routes/auth/reset-password.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("profile", "routes/profile.tsx"),
  route("team/:workspaceId", "routes/team.tsx"),
] satisfies RouteConfig;
