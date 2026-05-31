import { LOGIN_PAGE_META } from "../loginpage/meta";
import { DASHBOARD_META } from "../dashboard/meta";

export const FRONTEND_PAGES = [LOGIN_PAGE_META, DASHBOARD_META] as const;

export type FrontendPageId = (typeof FRONTEND_PAGES)[number]["id"];
