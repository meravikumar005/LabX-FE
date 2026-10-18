import { Injectable, computed, signal } from "@angular/core";
import {
  AppState,
  DraftRow,
  Panel,
  PanelRow,
  Patient,
  Report,
  ReportStatus,
  RegForm,
  RowType,
} from "./models";
import { CATALOG_SEED, PATIENTS_SEED, REPORTS_SEED, TODAY_AD, TODAY_BS } from "./data";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export interface DecoratedRow {
  id: string;
  date: string;
  pid: string;
  name: string;
  mobile: string;
  ageSex: string;
  tests: string;
  status: ReportStatus;
  actionLabel: string;
  actionScreen: "entry" | "print";
  report: Report;
}

@Injectable({ providedIn: "root" })
export class LabStore {
  catalog = signal<Panel[]>(clone(CATALOG_SEED));
  private retired: Record<string, string> = {};

  readonly today = { ad: TODAY_AD, bs: TODAY_BS };

  state = signal<AppState>({
    patients: clone(PATIENTS_SEED),
    reports: clone(REPORTS_SEED),
    activeReport: "R-26-0391",
    patient: { ...clone(PATIENTS_SEED)[0], bill: "39530" },
    selected: ["cbc", "sugar"],
    included: { sugar: ["PP"] },
    values: clone(REPORTS_SEED[0].values),
    entryTab: "cbc",
    dq: "",
    rq: "",
    q: "",
    eq: "",
    dashFilter: "All",
    statusFilter: "All",
    printHeader: true,
    arrows: true,
    ranges: true,
    reg: { pid: "", name: "", age: "", sex: "F", mobile: "", address: "", ref: "" },
    tpl: "cbc",
    draft: null,
    confirmDel: false,
    cancelTarget: null,
    orderEdit: null,
    selectedReports: [],
    deleteTarget: null,
    banner: "",
  });

  // ---------------------------------------------------------------- lookups
  panel(id: string): Panel | undefined {
    return this.catalog().find((c) => c.id === id);
  }

  refOf(row: PanelRow): string {
    return this.state().patient.sex === "M" ? row.m ?? "" : row.f ?? "";
  }

  rowsOf(pl: Panel): PanelRow[] {
    const inc = this.state().included[pl.id];
    if (!inc) return pl.rows;
    return pl.rows.filter((r) => {
      if (!r.head) return inc.includes(r.name);
      const i = pl.rows.indexOf(r);
      for (let k = i + 1; k < pl.rows.length && pl.rows[k].sub; k++) {
        if (inc.includes(pl.rows[k].name)) return true;
      }
      return false;
    });
  }

  limits(ref: string | undefined): { lo?: number; hi?: number } | null {
    if (!ref) return null;
    const lt = ref.match(/^<\s*([\d.,]+)$/);
    if (lt) return { hi: parseFloat(lt[1].replace(/,/g, "")) };
    const rg = ref.match(/^([\d.,]+)\s*-\s*([\d.,]+)$/);
    if (rg)
      return {
        lo: parseFloat(rg[1].replace(/,/g, "")),
        hi: parseFloat(rg[2].replace(/,/g, "")),
      };
    return null;
  }

  flagOf(row: PanelRow, raw: string | undefined): "" | "H" | "L" {
    if (row.head || raw === undefined || raw === "") return "";
    const n = parseFloat(String(raw).replace(/,/g, ""));
    const l = this.limits(this.refOf(row));
    if (!l || isNaN(n)) return "";
    if (l.hi !== undefined && n > l.hi) return "H";
    if (l.lo !== undefined && n < l.lo) return "L";
    return "";
  }

  fmt(v: string | undefined): string {
    if (v === undefined) return "";
    const n = parseFloat(String(v).replace(/,/g, ""));
    return isNaN(n) ? v : n >= 1000 ? n.toLocaleString("en-US") : v;
  }

  filled(id: string): [number, number] {
    const pl = this.panel(id);
    if (!pl) return [0, 0];
    const rows = this.rowsOf(pl).filter((r) => !r.head);
    const v = this.state().values[id] || {};
    return [rows.filter((r) => v[r.name]).length, rows.length];
  }

  decorate(rep: Report): DecoratedRow {
    const pat = this.state().patients.find((x) => x.id === rep.pid);
    const names = rep.tests
      .map((t) => {
        const pl = this.panel(t);
        if (pl) return pl.name.replace(/ \(.*\)$/, "");
        return (
          (this.retired[t] || "Removed test").replace(/ \(.*\)$/, "") +
          " (deleted)"
        );
      })
      .join(" · ");
    const action: { label: string; screen: "entry" | "print" } =
      rep.status === "Ordered"
        ? { label: "Enter", screen: "entry" }
        : rep.status === "Results entered"
          ? { label: "Verify", screen: "print" }
          : rep.status === "Verified"
            ? { label: "Print", screen: "print" }
            : { label: "View", screen: "print" };
    return {
      id: rep.id,
      date: rep.date,
      pid: rep.pid,
      name: pat?.name ?? "",
      mobile: pat?.mobile ?? "",
      ageSex: `${pat?.age ?? ""}Y/${pat?.sex ?? ""}`,
      tests: names,
      status: rep.status,
      actionLabel: action.label,
      actionScreen: action.screen,
      report: rep,
    };
  }

  private slug(status: ReportStatus): string {
    return status.toLowerCase().replace(/\s+/g, "-");
  }
  statusClass(status: ReportStatus): string {
    return "status-" + this.slug(status);
  }
  railClass(status: ReportStatus): string {
    return "rail-" + this.slug(status);
  }

  findReport(id: string): Report | undefined {
    return this.state().reports.find((r) => r.id === id);
  }

  openReport(rep: Report): "entry" | "print" {
    const pat =
      this.state().patients.find((p) => p.id === rep.pid) ??
      this.state().patients[0];
    const dec = this.decorate(rep);
    this.state.update((s) => ({
      ...s,
      activeReport: rep.id,
      patient: { ...pat, bill: rep.bill },
      selected: rep.tests.slice(),
      included: { ...rep.included },
      values: clone(rep.values || {}),
      entryTab: rep.tests[0],
      cancelTarget: null,
      orderEdit: null,
      banner: "",
    }));
    return dec.actionScreen;
  }

  // ------------------------------------------------------------- computed
  readonly sexWord = computed(() => (this.state().patient.sex === "M" ? "Male" : "Female"));

  readonly todays = computed(() => this.state().reports.filter((r) => r.today));
  readonly pendingCount = computed(
    () => this.state().reports.filter((r) => r.status === "Ordered").length,
  );
  readonly enteredCount = computed(
    () =>
      this.state().reports.filter((r) => r.status === "Results entered")
        .length,
  );
  readonly printedTodayCount = computed(
    () => this.todays().filter((r) => r.status === "Printed").length,
  );

  readonly stats = computed(() => [
    { label: "Registered today", value: this.todays().length, note: "" },
    { label: "Awaiting results", value: this.pendingCount(), note: "in lab" },
    { label: "Ready to verify", value: this.enteredCount(), note: "" },
    { label: "Printed today", value: this.printedTodayCount(), note: "" },
  ]);

  readonly navCounts = computed(() => ({
    dash: this.todays().length,
    entry: this.pendingCount(),
    reports: this.state().reports.length,
    templates: this.catalog().length,
  }));

  readonly dashAll = computed(() => {
    const dq = this.state().dq.trim().toLowerCase();
    let list = this.todays().map((r) => this.decorate(r));
    if (dq)
      list = list.filter((r) =>
        (r.name + " " + r.pid + " " + r.mobile + " " + r.id)
          .toLowerCase()
          .includes(dq),
      );
    return list;
  });

  readonly dashRows = computed(() => {
    const f = this.state().dashFilter;
    const all = this.dashAll();
    if (f === "All") return all;
    return all.filter((r) =>
      f === "Pending" ? r.status === "Ordered" : r.status !== "Ordered",
    );
  });

  readonly dashCount = computed(() => {
    const dq = this.state().dq.trim();
    return dq
      ? `${this.dashAll().length}/${this.todays().length}`
      : `${this.todays().length}`;
  });

  readonly entryQueue = computed(() => {
    const eq = this.state().eq.trim().toLowerCase();
    return this.state()
      .reports.filter((r) => r.status === "Ordered")
      .map((r) => this.decorate(r))
      .filter((r) =>
        !eq || (r.name + " " + r.pid + " " + r.mobile + " " + r.id).toLowerCase().includes(eq),
      )
      .map((r) => ({ ...r, actionLabel: "Enter result" }));
  });

  readonly reportRows = computed(() => {
    const rq = this.state().rq.trim().toLowerCase();
    const sf = this.state().statusFilter;
    return this.state()
      .reports.filter((r) => {
        if (!rq) return true;
        const pat = this.state().patients.find((x) => x.id === r.pid);
        return [r.id, r.pid, r.bill, pat?.name, pat?.mobile].some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(rq),
        );
      })
      .filter((r) => sf === "All" || r.status === sf)
      .map((r) => this.decorate(r));
  });

  readonly allReportsSelected = computed(() => {
    const rows = this.reportRows();
    if (!rows.length) return false;
    const sel = this.state().selectedReports;
    return rows.every((r) => sel.includes(r.id));
  });

  readonly statusChips = computed(() => {
    const reports = this.state().reports;
    const sf = this.state().statusFilter;
    const labels: ("All" | ReportStatus)[] = [
      "All",
      "Ordered",
      "Results entered",
      "Verified",
      "Printed",
    ];
    return labels.map((f) => ({
      label: f,
      n: f === "All" ? reports.length : reports.filter((r) => r.status === f).length,
      active: sf === f,
    }));
  });

  readonly activePanels = computed(() =>
    this.state()
      .selected.map((id) => this.panel(id))
      .filter((p): p is Panel => !!p),
  );

  readonly entryPanel = computed(
    () => this.panel(this.state().entryTab) ?? this.activePanels()[0] ?? this.catalog()[0],
  );

  readonly panelTabs = computed(() =>
    this.activePanels().map((pl) => {
      const [d, t] = this.filled(pl.id);
      return {
        id: pl.id,
        label: pl.name.replace(/ \(.*\)$/, ""),
        done: `${d}/${t}`,
        pct: t ? Math.round((d / t) * 100) + "%" : "0%",
        active: pl.id === this.entryPanel().id,
      };
    }),
  );

  readonly entryRows = computed(() => {
    const pl = this.entryPanel();
    const vals = this.state().values[pl.id] || {};
    return this.rowsOf(pl).map((r) => {
      const v = vals[r.name] || "";
      const fl = this.flagOf(r, v);
      return {
        name: r.name,
        isInput: !r.head,
        value: v,
        unit: r.head ? "" : r.unit ?? "",
        ref: r.head ? "" : this.refOf(r),
        indent: r.sub ? "16px" : "0px",
        bold: !!(r.bold || r.head),
        head: !!r.head,
        flag: fl,
      };
    });
  });

  readonly printPanels = computed(() => {
    const s = this.state();
    return this.activePanels().map((pl) => ({
      id: pl.id,
      heading: pl.name.toUpperCase(),
      rows: this.rowsOf(pl)
        .filter((r) => r.head || (s.values[pl.id] || {})[r.name])
        .map((r) => {
          const v = (s.values[pl.id] || {})[r.name] || "";
          const fl = this.flagOf(r, v);
          return {
            name: r.name,
            value: r.head ? "" : this.fmt(v),
            unit: r.head ? "" : r.unit ?? "",
            ref: r.head || !s.ranges ? "" : this.refOf(r),
            indent: r.sub ? "18px" : "0px",
            bold: !!(r.bold || r.head),
            arrow: s.arrows && fl ? (fl === "H" ? "↑" : "↓") : "",
            high: fl === "H",
          };
        }),
    }));
  });

  readonly totalPrintRows = computed(() =>
    this.state().selected.reduce((n, id) => {
      const pl = this.panel(id);
      return pl ? n + this.rowsOf(pl).filter((r) => !r.head).length : n;
    }, 0),
  );

  readonly cards = computed(() => {
    const q = this.state().q.trim().toLowerCase();
    const s = this.state();
    return this.catalog()
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.rows.some((r) => r.name.toLowerCase().includes(q)),
      )
      .map((c) => {
        const on = s.selected.includes(c.id);
        const valueRows = c.rows.filter((r) => !r.head);
        const inc = s.included[c.id] || valueRows.map((r) => r.name);
        return {
          id: c.id,
          name: c.name,
          on,
          count: on ? `${inc.length}/${valueRows.length}` : `${valueRows.length}`,
          preview:
            valueRows
              .slice(0, 5)
              .map((r) => r.name)
              .join(", ") + (c.rows.length > 5 ? "…" : ""),
          rows: valueRows.map((r) => ({ name: r.name, on: inc.includes(r.name) })),
        };
      });
  });

  readonly editOrderCards = computed(() => {
    const oe = this.state().orderEdit;
    if (!oe) return [];
    const q = oe.q.trim().toLowerCase();
    return this.catalog()
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.rows.some((r) => r.name.toLowerCase().includes(q)),
      )
      .map((c) => {
        const on = oe.selected.includes(c.id);
        const valueRows = c.rows.filter((r) => !r.head);
        const inc = oe.included[c.id] || valueRows.map((r) => r.name);
        return {
          id: c.id,
          name: c.name,
          on,
          count: on ? `${inc.length}/${valueRows.length}` : `${valueRows.length}`,
          rows: valueRows.map((r) => ({ name: r.name, on: inc.includes(r.name) })),
        };
      });
  });

  readonly tplOptions = computed(() =>
    this.catalog().map((c) => ({ id: c.id, name: c.name })),
  );
  readonly tplPanel = computed(
    () => this.panel(this.state().tpl) ?? this.catalog()[0],
  );

  readonly editing = computed(() => {
    const pl = this.tplPanel();
    return {
      name: pl?.name ?? "",
      rows: (pl?.rows ?? []).map((r) => ({
        name: r.name,
        unit: r.head ? "" : r.unit || "—",
        refM: r.head ? "" : r.m || "—",
        refF: r.head ? "" : r.f || "—",
        indent: r.sub ? "14px" : "0px",
        bold: !!(r.bold || r.head),
        head: !!r.head,
      })),
    };
  });

  readonly deleteUsage = computed(() => {
    const pl = this.tplPanel();
    if (!pl) return "";
    const n = this.state().reports.filter((r) => r.tests.includes(pl.id)).length;
    return n
      ? ` Used by ${n} existing report${n === 1 ? "" : "s"} — they keep the printed values.`
      : "";
  });

  readonly draftRows = computed(() => this.state().draft?.rows ?? []);
  readonly draftTitle = computed(() => this.state().draft?.name || "Untitled test");
  readonly draftPreview = computed(() =>
    this.draftRows()
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name,
        indent: r.type === "sub" ? "12px" : "0px",
        head: r.type === "head",
        dash: r.type === "head" ? "" : "—",
        ref: r.type === "head" ? "" : r.f || r.m || "",
      })),
  );
  readonly draftCount = computed(
    () => this.draftRows().filter((r) => r.name.trim()).length,
  );
  readonly draftSexCount = computed(
    () => this.draftRows().filter((r) => r.m && r.f && r.m !== r.f).length,
  );

  // ------------------------------------------------------------ mutations
  setDq(v: string) {
    this.state.update((s) => ({ ...s, dq: v }));
  }
  setRq(v: string) {
    this.state.update((s) => ({ ...s, rq: v }));
  }
  setQ(v: string) {
    this.state.update((s) => ({ ...s, q: v }));
  }
  setEq(v: string) {
    this.state.update((s) => ({ ...s, eq: v }));
  }

  setDashFilter(f: AppState["dashFilter"]) {
    this.state.update((s) => ({ ...s, dashFilter: f }));
  }
  setStatusFilter(f: AppState["statusFilter"]) {
    this.state.update((s) => ({ ...s, statusFilter: f }));
  }
  clearBanner() {
    this.state.update((s) => ({ ...s, banner: "" }));
  }

  setReg(key: keyof RegForm, v: string) {
    this.state.update((s) => ({ ...s, reg: { ...s.reg, [key]: v } }));
  }
  clearReg() {
    this.state.update((s) => ({
      ...s,
      reg: { pid: "", name: "", age: "", sex: "F", mobile: "", address: "", ref: "" },
    }));
  }

  toggleCard(id: string) {
    this.state.update((s) => ({
      ...s,
      selected: s.selected.includes(id)
        ? s.selected.filter((x) => x !== id)
        : [...s.selected, id],
    }));
  }
  includeAll(id: string) {
    this.state.update((s) => {
      const n = { ...s.included };
      delete n[id];
      return { ...s, included: n };
    });
  }
  toggleAnalyte(panelId: string, name: string) {
    const pl = this.panel(panelId);
    if (!pl) return;
    this.state.update((s) => {
      const cur = s.included[panelId] || pl.rows.filter((r) => !r.head).map((r) => r.name);
      const on = cur.includes(name);
      return {
        ...s,
        included: {
          ...s.included,
          [panelId]: on ? cur.filter((x) => x !== name) : [...cur, name],
        },
      };
    });
  }

  get nextPid(): string {
    const s = this.state();
    return "P-" + (1048 + s.patients.length - PATIENTS_SEED.length);
  }

  readonly regPidMatch = computed(() => {
    const pid = this.state().reg.pid.trim().toLowerCase();
    if (!pid) return undefined;
    return this.state().patients.find((p) => p.id.toLowerCase() === pid);
  });

  saveOrder(): { ok: boolean; reportId?: string } {
    const s = this.state();
    const pidInput = s.reg.pid.trim();
    const existing = pidInput
      ? s.patients.find((p) => p.id.toLowerCase() === pidInput.toLowerCase())
      : undefined;

    if (pidInput && !existing && !s.reg.name) {
      this.state.update((st) => ({
        ...st,
        banner: `No patient found with ID "${pidInput}". Enter their details to register a new patient, or check the ID.`,
      }));
      return { ok: false };
    }

    const name = existing ? existing.name : s.reg.name || s.patient.name;
    if (!name || !s.selected.length) {
      this.state.update((st) => ({
        ...st,
        banner: "Enter a patient name and pick at least one test.",
      }));
      return { ok: false };
    }
    const num = 394 + (s.reports.length - REPORTS_SEED.length);
    const id = "R-26-0" + num;
    let pat: Patient = s.patient;
    let isNewPatient = false;
    if (existing) {
      pat = existing;
    } else if (s.reg.name) {
      isNewPatient = true;
      pat = {
        id:
          pidInput ||
          (s.patients.length
            ? "P-" + (1048 + s.patients.length - PATIENTS_SEED.length)
            : "P-1048"),
        name: s.reg.name,
        age: s.reg.age,
        sex: s.reg.sex,
        mobile: s.reg.mobile,
        address: s.reg.address,
        ref: s.reg.ref,
        bill: "",
      };
    }
    this.state.update((st) => ({
      ...st,
      patients: isNewPatient ? [pat, ...st.patients] : st.patients,
      patient: { ...pat },
      reports: [
        {
          id,
          pid: pat.id,
          bill: pat.bill || "—",
          date: TODAY_AD,
          today: true,
          tests: st.selected.slice(),
          included: { ...st.included },
          status: "Ordered",
          values: {},
        },
        ...st.reports,
      ],
      activeReport: id,
      values: {},
      reg: { pid: "", name: "", age: "", sex: "F", mobile: "", address: "", ref: "" },
      banner: existing
        ? `Order ${id} saved for ${pat.name} (${pat.id}).`
        : `Order ${id} saved for ${pat.name}. It is waiting in Result entry.`,
    }));
    return { ok: true, reportId: id };
  }

  setEntryTab(id: string) {
    this.state.update((s) => ({ ...s, entryTab: id }));
  }
  reorderSelected(fromId: string, toId: string) {
    if (fromId === toId) return;
    this.state.update((s) => {
      const arr = s.selected.slice();
      const from = arr.indexOf(fromId);
      if (from === -1) return s;
      arr.splice(from, 1);
      const to = arr.indexOf(toId);
      if (to === -1) return s;
      arr.splice(to, 0, fromId);
      return { ...s, selected: arr };
    });
  }
  setEntryValue(panelId: string, name: string, val: string) {
    this.state.update((s) => ({
      ...s,
      values: {
        ...s.values,
        [panelId]: { ...(s.values[panelId] || {}), [name]: val },
      },
    }));
  }
  saveResults() {
    this.state.update((st) => ({
      ...st,
      reports: st.reports.map((r) =>
        r.id === st.activeReport
          ? {
              ...r,
              values: clone(st.values),
              status: r.status === "Ordered" ? "Results entered" : r.status,
            }
          : r,
      ),
      banner: `Results saved for ${st.activeReport}.`,
    }));
  }

  toggleLetterhead() {
    this.state.update((s) => ({ ...s, printHeader: !s.printHeader }));
  }
  toggleArrows() {
    this.state.update((s) => ({ ...s, arrows: !s.arrows }));
  }
  toggleRanges() {
    this.state.update((s) => ({ ...s, ranges: !s.ranges }));
  }
  verifyReport() {
    this.state.update((st) => ({
      ...st,
      reports: st.reports.map((r) =>
        r.id === st.activeReport && (r.status === "Ordered" || r.status === "Results entered")
          ? { ...r, status: "Verified" as ReportStatus }
          : r,
      ),
      banner: `${st.activeReport} verified. Ready to print.`,
    }));
  }

  printReport() {
    this.state.update((st) => ({
      ...st,
      reports: st.reports.map((r) =>
        r.id === st.activeReport ? { ...r, status: "Printed" as ReportStatus } : r,
      ),
      banner: `${st.activeReport} sent to the printer.`,
    }));
  }

  canCancel(status: ReportStatus): boolean {
    return status === "Ordered" || status === "Results entered";
  }

  askCancelOrder(id: string) {
    this.state.update((s) => ({ ...s, cancelTarget: id }));
  }
  dismissCancelOrder() {
    this.state.update((s) => ({ ...s, cancelTarget: null }));
  }
  confirmCancelOrder() {
    const id = this.state().cancelTarget;
    if (!id) return;
    this.state.update((st) => {
      const rep = st.reports.find((r) => r.id === id);
      const name = rep ? st.patients.find((p) => p.id === rep.pid)?.name : undefined;
      return {
        ...st,
        reports: st.reports.filter((r) => r.id !== id),
        cancelTarget: null,
        banner: `Order ${id} cancelled.${name ? ` (${name})` : ""}`,
      };
    });
  }

  toggleReportSelect(id: string) {
    this.state.update((s) => ({
      ...s,
      selectedReports: s.selectedReports.includes(id)
        ? s.selectedReports.filter((x) => x !== id)
        : [...s.selectedReports, id],
    }));
  }
  toggleSelectAllReports() {
    const ids = this.reportRows().map((r) => r.id);
    this.state.update((s) => {
      const allSelected = ids.length > 0 && ids.every((id) => s.selectedReports.includes(id));
      return {
        ...s,
        selectedReports: allSelected
          ? s.selectedReports.filter((id) => !ids.includes(id))
          : Array.from(new Set([...s.selectedReports, ...ids])),
      };
    });
  }
  clearReportSelection() {
    this.state.update((s) => ({ ...s, selectedReports: [] }));
  }

  askDeleteReports(ids: string[]) {
    if (!ids.length) return;
    this.state.update((s) => ({ ...s, deleteTarget: ids }));
  }
  dismissDeleteReports() {
    this.state.update((s) => ({ ...s, deleteTarget: null }));
  }
  confirmDeleteReports() {
    const ids = this.state().deleteTarget;
    if (!ids || !ids.length) return;
    this.state.update((st) => {
      const idSet = new Set(ids);
      const singleName =
        ids.length === 1
          ? st.patients.find((p) => p.id === st.reports.find((r) => r.id === ids[0])?.pid)?.name
          : undefined;
      return {
        ...st,
        reports: st.reports.filter((r) => !idSet.has(r.id)),
        selectedReports: st.selectedReports.filter((id) => !idSet.has(id)),
        activeReport: idSet.has(st.activeReport) ? "" : st.activeReport,
        deleteTarget: null,
        banner:
          ids.length === 1
            ? `Report ${ids[0]} deleted.${singleName ? ` (${singleName})` : ""}`
            : `${ids.length} reports deleted.`,
      };
    });
  }

  canEditOrder(status: ReportStatus): boolean {
    return status === "Ordered";
  }

  startEditOrder() {
    this.state.update((s) => ({
      ...s,
      orderEdit: {
        patient: { ...s.patient },
        selected: s.selected.slice(),
        included: { ...s.included },
        q: "",
      },
    }));
  }
  cancelEditOrder() {
    this.state.update((s) => ({ ...s, orderEdit: null }));
  }
  setOrderEditField(key: keyof Patient, v: string) {
    this.state.update((s) => ({
      ...s,
      orderEdit: s.orderEdit ? { ...s.orderEdit, patient: { ...s.orderEdit.patient, [key]: v } } : s.orderEdit,
    }));
  }
  setOrderEditQ(v: string) {
    this.state.update((s) => ({
      ...s,
      orderEdit: s.orderEdit ? { ...s.orderEdit, q: v } : s.orderEdit,
    }));
  }
  toggleEditOrderCard(id: string) {
    this.state.update((s) => {
      if (!s.orderEdit) return s;
      const sel = s.orderEdit.selected;
      return {
        ...s,
        orderEdit: {
          ...s.orderEdit,
          selected: sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id],
        },
      };
    });
  }
  includeAllEditOrder(id: string) {
    this.state.update((s) => {
      if (!s.orderEdit) return s;
      const n = { ...s.orderEdit.included };
      delete n[id];
      return { ...s, orderEdit: { ...s.orderEdit, included: n } };
    });
  }
  toggleEditOrderAnalyte(panelId: string, name: string) {
    const pl = this.panel(panelId);
    if (!pl) return;
    this.state.update((s) => {
      if (!s.orderEdit) return s;
      const cur =
        s.orderEdit.included[panelId] || pl.rows.filter((r) => !r.head).map((r) => r.name);
      const on = cur.includes(name);
      return {
        ...s,
        orderEdit: {
          ...s.orderEdit,
          included: {
            ...s.orderEdit.included,
            [panelId]: on ? cur.filter((x) => x !== name) : [...cur, name],
          },
        },
      };
    });
  }
  saveOrderEdit(): { ok: boolean } {
    const oe = this.state().orderEdit;
    if (!oe) return { ok: false };
    if (!oe.patient.name.trim() || !oe.selected.length) {
      this.state.update((s) => ({
        ...s,
        banner: "Enter a patient name and pick at least one test.",
      }));
      return { ok: false };
    }
    this.state.update((st) => {
      const activeId = st.activeReport;
      return {
        ...st,
        patients: st.patients.map((p) => (p.id === oe.patient.id ? { ...oe.patient } : p)),
        patient: { ...oe.patient },
        selected: oe.selected.slice(),
        included: { ...oe.included },
        entryTab: oe.selected.includes(st.entryTab) ? st.entryTab : oe.selected[0] ?? st.entryTab,
        reports: st.reports.map((r) =>
          r.id === activeId
            ? { ...r, pid: oe.patient.id, tests: oe.selected.slice(), included: { ...oe.included } }
            : r,
        ),
        orderEdit: null,
        banner: `Order ${activeId} updated.`,
      };
    });
    return { ok: true };
  }

  pickTemplate(id: string) {
    this.state.update((s) => ({ ...s, tpl: id, draft: null, confirmDel: false }));
  }

  blankRow(): DraftRow {
    return { name: "", unit: "", m: "", f: "", type: "value" };
  }

  openNewDraft() {
    this.state.update((s) => ({
      ...s,
      draft: { id: null, name: "", rows: [this.blankRow(), this.blankRow(), this.blankRow()] },
      confirmDel: false,
    }));
  }

  editTemplate() {
    const pl = this.tplPanel();
    if (!pl) return;
    this.state.update((s) => ({
      ...s,
      confirmDel: false,
      draft: {
        id: pl.id,
        name: pl.name,
        rows: pl.rows.map((r) => ({
          name: r.name,
          unit: r.unit || "",
          m: r.m || "",
          f: r.f || "",
          type: (r.head ? "head" : r.sub ? "sub" : "value") as RowType,
        })),
      },
    }));
  }
  cancelDraft() {
    this.state.update((s) => ({ ...s, draft: null }));
  }
  setDraftName(v: string) {
    this.state.update((s) => ({
      ...s,
      draft: s.draft ? { ...s.draft, name: v } : s.draft,
    }));
  }
  addDraftRow() {
    this.state.update((s) => ({
      ...s,
      draft: s.draft ? { ...s.draft, rows: [...s.draft.rows, this.blankRow()] } : s.draft,
    }));
  }
  removeDraftRow(i: number) {
    this.state.update((s) => ({
      ...s,
      draft: s.draft ? { ...s.draft, rows: s.draft.rows.filter((_, k) => k !== i) } : s.draft,
    }));
  }
  patchDraftRow(i: number, patch: Partial<DraftRow>) {
    this.state.update((s) => ({
      ...s,
      draft: s.draft
        ? { ...s.draft, rows: s.draft.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) }
        : s.draft,
    }));
  }

  askDelete() {
    this.state.update((s) => ({ ...s, confirmDel: true }));
  }
  cancelDelete() {
    this.state.update((s) => ({ ...s, confirmDel: false }));
  }
  doDelete() {
    const pl = this.tplPanel();
    if (!pl) return;
    this.retired[pl.id] = pl.name;
    const cat = this.catalog();
    const i = cat.findIndex((c) => c.id === pl.id);
    const next = cat.filter((c) => c.id !== pl.id);
    const nextId = next[Math.min(i, next.length - 1)]?.id ?? "";
    this.catalog.set(next);
    this.state.update((s) => ({
      ...s,
      confirmDel: false,
      draft: null,
      tpl: nextId,
      selected: s.selected.filter((x) => x !== pl.id),
      banner: `Template "${pl.name}" deleted from the catalog.`,
    }));
  }

  saveDraft() {
    const s = this.state();
    const d = s.draft;
    if (!d) return;
    const name = d.name || "Untitled test";
    const rows: PanelRow[] = d.rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        unit: r.type === "head" ? "" : r.unit,
        m: r.type === "head" ? "" : r.m,
        f: r.type === "head" ? "" : r.f,
        head: r.type === "head" || undefined,
        sub: r.type === "sub" || undefined,
      }));
    if (d.id) {
      const id = d.id;
      this.catalog.update((cat) => cat.map((c) => (c.id === id ? { ...c, name, rows } : c)));
      this.state.update((st) => ({
        ...st,
        draft: null,
        tpl: id,
        banner: `Template "${name}" updated. Future orders use the new ranges.`,
      }));
      return;
    }
    const id = "tpl" + (this.catalog().length + 1);
    this.catalog.update((cat) => [...cat, { id, name, heading: name.toUpperCase() + " REPORT", rows }]);
    this.state.update((st) => ({
      ...st,
      draft: null,
      tpl: id,
      banner: `Template "${name}" saved to the catalog.`,
    }));
  }
}
