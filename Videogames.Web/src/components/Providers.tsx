"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import Navbar from "./Navbar";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ChatProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-68px)]">{children}</main>
        </ChatProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
