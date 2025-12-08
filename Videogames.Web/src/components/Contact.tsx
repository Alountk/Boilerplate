"use client";

import { useAuth } from "@/context/AuthContext";
import {
  ChatBubble,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  LogIn,
  LogOut,
} from "iconoir-react";
import Link from "next/link";

function Wrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-2 py-2 ${className}`}> {children} </div>;
}

export default function Contact() {
  const { logout, isAuthenticated } = useAuth();
  return (
    <div className="bg-slate-400 flex justify-between items-center mx-auto text-white">
      <Wrapper className="bg-emerald-400">
        <ChatBubble />
      </Wrapper>
      <div className="flex">
        {/* <Wrapper className="bg-slate-700 hover:bg-slate-600">
          {isAuthenticated ? (
            <LogOut
              className="text-white cursor-pointer"
              onClick={() => logout()}
            />
          ) : (
            <Link href="/login">
              <LogIn className="text-white cursor-pointer" />
            </Link>
          )}
        </Wrapper> */}
        <Wrapper className="bg-slate-700 hover:bg-slate-600 border-l-2 border-slate-500">
          <Instagram />
        </Wrapper>
        <Wrapper className="bg-slate-700 hover:bg-slate-600 border-l-2 border-slate-500">
          <Github />
        </Wrapper>
        <Wrapper className="bg-slate-700 hover:bg-slate-600 text-red-600 border-l-2 border-slate-500">
          <Youtube />
        </Wrapper>
        <Wrapper className="bg-blue-700 hover:bg-blue-400 px-8">
          {isAuthenticated ? (
            <Link href="/login">Log In</Link>
          ) : (
            <Link href="/login">Log In</Link>
          )}
        </Wrapper>
        <Wrapper className="bg-blue-500 hover:bg-blue-400 px-8">
          <a href="mailto:contact@videogames.com"> Contact</a>
        </Wrapper>
      </div>
    </div>
  );
}
