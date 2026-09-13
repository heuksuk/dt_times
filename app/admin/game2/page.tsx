import { cookies } from "next/headers";
import AdminLoginForm from "../login-form";
import Game2Board from "./game-board";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function Game2Page() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) return <AdminLoginForm />;
  return <Game2Board />;
}
