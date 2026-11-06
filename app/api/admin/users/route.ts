import { authorizeDeactivation } from "../../../../server/account-policy";
import { database, errorResponse, requireAdmin } from "../../../lib";
import {
  readJson,
  hashPassword,
  validatePassword,
  validEmail,
  HttpError,
} from "../../../../server/security";
import { audit, transaction } from "../../../../server/database";
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(true),
      { email, role, password } = await readJson(req);
    if (!validEmail(email) || !["ADMIN", "SUPER_ADMIN"].includes(String(role)))
      throw new HttpError("Invalid user");
    validatePassword(password);
    const normalized = (email as string).trim().toLowerCase();
    if (
      await database()
        .prepare("SELECT id FROM admins WHERE email=?")
        .bind(normalized)
        .first()
    )
      throw new HttpError("An admin already has this email");
    await database()
      .prepare(
        "INSERT INTO admins(id,email,password_hash,role,active,created_at) VALUES(?,?,?,?,1,?)",
      )
      .bind(
        crypto.randomUUID(),
        normalized,
        await hashPassword(password),
        role,
        new Date().toISOString(),
      )
      .run();
    await audit(actor.email, "admin.created", normalized);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PATCH(req: Request) {
  try {
    const actor = await requireAdmin(true),
      { id, role, active, password } = await readJson(req);
    if (
      typeof id !== "string" ||
      !["ADMIN", "SUPER_ADMIN"].includes(String(role)) ||
      typeof active !== "boolean"
    )
      throw new HttpError("Invalid update");
    let passwordHash: string | undefined;
    if (password !== undefined) {
      validatePassword(password);
      passwordHash = await hashPassword(password);
    }
    await transaction(async (db) => {
      // Lock the complete role set so simultaneous demotions cannot remove all Super Admins.
      const { results: users } = await db
        .prepare("SELECT id,role,active FROM admins ORDER BY id FOR UPDATE")
        .all<{ id: string; role: string; active: number }>();
      const target = users.find((u) => u.id === id);
      if (!target) throw new HttpError("User not found", 404);
      const current = users.find((u) => u.id === actor.id);
      if (!current?.active || current.role !== "SUPER_ADMIN")
        throw new HttpError("Super Admin access required", 403);
      if (id === actor.id && (!active || role !== "SUPER_ADMIN"))
        throw new HttpError(
          "You cannot deactivate or demote your own account",
          400,
        );
      if (
        target.role === "SUPER_ADMIN" &&
        target.active &&
        (role !== "SUPER_ADMIN" || !active) &&
        users.filter((u) => u.role === "SUPER_ADMIN" && u.active).length <= 1
      )
        throw new HttpError("The final Super Admin cannot be removed");
      await db
        .prepare(
          "UPDATE admins SET role=?,active=?,auth_version=auth_version+1" +
            (passwordHash ? ",password_hash=?" : "") +
            " WHERE id=?",
        )
        .bind(role, active ? 1 : 0, ...(passwordHash ? [passwordHash] : []), id)
        .run();
    });
    await audit(actor.email, "admin.updated", id);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

// Soft deletion retains account identity and every historical business record.
export async function DELETE(req: Request) {
  let actor: Awaited<ReturnType<typeof requireAdmin>> | undefined;
  let targetId = "";
  try {
    actor = await requireAdmin();
    if (actor.role !== "SUPER_ADMIN")
      throw new HttpError("Super Admin access required", 403);
    const body = await readJson(req);
    if (
      typeof body.id !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(body.id) ||
      body.confirmation !== "DEACTIVATE ACCOUNT"
    )
      throw new HttpError("Confirm account deactivation");
    targetId = body.id;
    await transaction(async (db) => {
      const { results: users } = await db
        .prepare(
          "SELECT id,email,role,active FROM admins ORDER BY id FOR UPDATE",
        )
        .all<{ id: string; email: string; role: string; active: number }>();
      const current = users.find((u) => u.id === actor!.id),
        target = users.find((u) => u.id === targetId);
      if (!current || !current.active || current.role !== "SUPER_ADMIN")
        throw new HttpError("Super Admin access required", 403);
      if (!target) throw new HttpError("Account not found", 404);
      authorizeDeactivation(current, target, users);
      await db
        .prepare(
          "UPDATE admins SET active=0,auth_version=auth_version+1 WHERE id=?",
        )
        .bind(targetId)
        .run();
      await db
        .prepare("DELETE FROM sessions WHERE admin_id=?")
        .bind(targetId)
        .run();
      await db
        .prepare(
          "INSERT INTO audit_logs(id,actor,action,target,created_at) VALUES(?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          actor!.email,
          "admin.deactivated.success",
          target.id,
          new Date().toISOString(),
        )
        .run();
    });
    return Response.json({
      ok: true,
      message:
        "Account deactivated; sessions revoked. Registration, membership and financial history preserved.",
    });
  } catch (e) {
    if (actor)
      await audit(
        actor.email,
        "admin.deactivated.failed",
        JSON.stringify({
          id: targetId,
          outcome: e instanceof HttpError ? e.status : 500,
        }),
      );
    return errorResponse(e);
  }
}
