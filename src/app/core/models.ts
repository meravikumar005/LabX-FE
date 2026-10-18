export type RowType = "value" | "sub" | "head";

export interface PanelRow {
  name: string;
  unit?: string;
  m?: string;
  f?: string;
  bold?: boolean;
  head?: boolean;
  sub?: boolean;
}

export interface Panel {
  id: string;
  name: string;
  heading: string;
  rows: PanelRow[];
}

export type Sex = "M" | "F";

export interface Patient {
  id: string;
  name: string;
  age: string;
  sex: Sex;
  mobile: string;
  address: string;
  ref: string;
  bill?: string;
}

export type ReportStatus =
  | "Ordered"
  | "Results entered"
  | "Verified"
  | "Printed";

export interface Report {
  id: string;
  pid: string;
  bill: string;
  date: string;
  today?: boolean;
  tests: string[];
  included: Record<string, string[]>;
  status: ReportStatus;
  values: Record<string, Record<string, string>>;
}

export type DraftRow = {
  name: string;
  unit: string;
  m: string;
  f: string;
  type: RowType;
};

export interface Draft {
  id: string | null;
  name: string;
  rows: DraftRow[];
}

export interface RegForm {
  name: string;
  age: string;
  sex: Sex;
  mobile: string;
  address: string;
  ref: string;
}

export interface AppState {
  patients: Patient[];
  reports: Report[];
  activeReport: string;
  patient: Patient;
  selected: string[];
  included: Record<string, string[]>;
  values: Record<string, Record<string, string>>;
  entryTab: string;
  dq: string;
  rq: string;
  q: string;
  eq: string;
  pq: string;
  patientDraft: Patient | null;
  dashFilter: "All" | "Pending" | "Done";
  statusFilter: "All" | ReportStatus;
  printHeader: boolean;
  arrows: boolean;
  ranges: boolean;
  reg: RegForm;
  tpl: string;
  draft: Draft | null;
  confirmDel: boolean;
  banner: string;
}
