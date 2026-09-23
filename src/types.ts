export type Role = "member" | "admin";

export interface Group {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  token: string;
  role: Role;
}

export interface Expense {
  id: string;
  groupId: string;
  payerId: string;
  amountCents: number;
  description: string;
  createdAt: string;
}

export interface ExpenseShare {
  expenseId: string;
  memberId: string;
  shareCents: number;
}

/** The authenticated caller attached to the request context after token lookup. */
export interface AuthedMember {
  id: string;
  groupId: string;
  name: string;
  role: Role;
}

export interface Transfer {
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
}
