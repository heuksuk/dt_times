import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "animal-team-admin-session";

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) throw new Error("ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다.");

  return password;
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminPassword(password: string) {
  return secureEquals(password, getAdminPassword());
}

export function createAdminSessionToken() {
  return createHmac("sha256", getAdminPassword()).update("animal-team-admin-session-v1").digest("hex");
}

export function isValidAdminSession(token: string | undefined) {
  if (!token) return false;

  return secureEquals(token, createAdminSessionToken());
}
