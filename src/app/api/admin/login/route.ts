import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
  isValidAdminPassword,
} from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";

export async function POST(request: Request) {
  const body = (await readJson(request)) as { password?: unknown } | null;
  const password = body?.password;

  if (typeof password !== "string" || !isValidAdminPassword(password)) {
    return jsonError("Invalid password", 401);
  }

  const token = await createAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}
