import { defineModule } from "@aihot/contracts/modules";
export default defineModule({
  name: "knowledge",
  pages: [{ path: "knowledge", file: "web/page.tsx" }],
  adminPages: [{ path: "admin/knowledge", file: "web/admin.tsx" }],
  apiPaths: [/^\/api\/knowledge(?:\?|$)/],
});
