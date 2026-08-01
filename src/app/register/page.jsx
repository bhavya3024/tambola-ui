"use client";

import AuthPage from "../../components/AuthPage";
import { PublicRoute } from "../../components/ProtectedRoute";

export default function RegisterPage() {
  return (
    <PublicRoute>
      <AuthPage mode="register" />
    </PublicRoute>
  );
}
