"use client";

import AuthPage from "../../components/AuthPage";
import { PublicRoute } from "../../components/ProtectedRoute";

export default function LoginPage() {
  return (
    <PublicRoute>
      <AuthPage mode="login" />
    </PublicRoute>
  );
}
