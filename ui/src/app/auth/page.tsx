import React from "react";
import { AuthForm } from "@/components/features/auth/AuthForm/AuthForm";
import { NourMood } from "@/components/three/NourMood";

const pageStyle: React.CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
};

export default function AuthPage() {
  return (
    <div style={pageStyle}>
      <NourMood />
      <AuthForm />
    </div>
  );
}