"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import ThemeProvider from "./ThemeProvider";
import BottomNav from "./theme/BottomNav";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const hasGoogleClientId = Boolean(googleClientId);

export default function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <main className="min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <BottomNav />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  if (!hasGoogleClientId) {
    return content;
  }

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
}
