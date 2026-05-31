/** Dashboard sidebar routes — add paths as each section is built */
export const DASHBOARD_ROUTES: Record<string, string> = {
  mission: "/dashboard",
  focus: "/dashboard/deep-focus",
  mock: "/dashboard/mock-center",
  insights: "/dashboard/insights",
  resources: "/dashboard/resources",
  mentor: "/dashboard/ai-mentor",
  parent: "/dashboard/parent-connect",
  vault: "/dashboard/vault",
  connections: "/dashboard/connections",
  alerts: "/dashboard/alerts",
};

export function getDashboardHref(navId: string): string {
  return DASHBOARD_ROUTES[navId] ?? "/dashboard";
}

export function isDashboardNavActive(pathname: string, navId: string): boolean {
  const href = DASHBOARD_ROUTES[navId];
  if (!href) return false;
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
