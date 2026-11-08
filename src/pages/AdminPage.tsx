import { AdminAuth } from "@/admin/AdminAuth";
import { AdminShell } from "@/admin/AdminShell";

export function AdminPage() {
  return (
    <AdminAuth>
      <AdminShell />
    </AdminAuth>
  );
}
