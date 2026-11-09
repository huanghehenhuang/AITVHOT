// What the site's modules add to the web pages (site/modules/index.ts).
import type { WebModule } from "@aihot/web/modules";

import knowledge from "../../modules/knowledge/web.tsx";
export const WEB_MODULES: readonly WebModule[] = [knowledge];
