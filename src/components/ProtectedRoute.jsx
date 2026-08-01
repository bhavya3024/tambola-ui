"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="loader" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return children;
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="loader" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return children;
}
