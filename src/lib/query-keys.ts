export const queryKeys = {
  balance: (emp: string, loc: string) => ['balance', emp, loc] as const,
  balances: (emp: string) => ['balances', emp] as const,
  requests: (emp: string) => ['requests', emp] as const,
  pendingRequests: () => ['requests', 'pending'] as const,
  approvalHistory: () => ['requests', 'history'] as const,
}
