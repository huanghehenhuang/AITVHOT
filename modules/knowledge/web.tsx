import type { WebModule } from "@aihot/web/modules";
import { IconDoc } from "@aihot/web/components/icons";
export default {
  name: "knowledge",
  itemResources: () => import("./web/RelatedResources"),
  sidebar: { section: "内容", items: [{ to: "/knowledge", label: "AIGC知识库", icon: IconDoc }] },
  tabs: [{ key: "knowledge", to: "/knowledge", label: "知识库", icon: IconDoc }],
  admin: { content: [{ to: "/admin/knowledge", label: "知识库管理" }] },
} satisfies WebModule;
