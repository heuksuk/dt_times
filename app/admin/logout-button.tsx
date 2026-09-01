"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return <button className="text-button" disabled={isLoggingOut} onClick={logout} type="button">로그아웃</button>;
}
