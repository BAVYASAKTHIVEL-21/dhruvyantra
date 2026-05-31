/** Dispatched in the browser after a mock is submitted — refreshes dashboard data. */
export const MOCK_CENTER_REFRESH_EVENT = "dhruvyantra:mock-center-refresh";

export function dispatchMockCenterRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOCK_CENTER_REFRESH_EVENT));
}
