import { HttpError } from "./security";
export type AccountIdentity = { id: string; role: string; active: number };
export function authorizeDeactivation(
  actor: AccountIdentity,
  target: AccountIdentity,
  users: AccountIdentity[],
) {
  if (actor.role !== "SUPER_ADMIN" || !actor.active)
    throw new HttpError("Super Admin access required", 403);
  if (actor.id === target.id)
    throw new HttpError("You cannot delete your own account", 409);
  if (
    target.role === "SUPER_ADMIN" &&
    target.active &&
    users.filter((u) => u.role === "SUPER_ADMIN" && u.active).length <= 1
  )
    throw new HttpError("The last active Super Admin cannot be deleted", 409);
}
