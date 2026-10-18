import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { LabStore, DecoratedRow } from "../core/lab-store.service";
import { inputValue } from "../core/dom";
import { AppState } from "../core/models";

@Component({
  selector: "app-reports-list",
  imports: [],
  templateUrl: "./reports-list.component.html",
  styleUrl: "./reports-list.component.css",
})
export class ReportsListComponent {
  constructor(
    public store: LabStore,
    private router: Router,
  ) {}

  setRq(ev: Event) {
    this.store.setRq(inputValue(ev));
  }

  pickStatus(f: AppState["statusFilter"]) {
    this.store.setStatusFilter(f);
  }

  open(row: DecoratedRow) {
    const screen = this.store.openReport(row.report);
    if (screen === "entry") this.router.navigate(["/entry", row.report.id]);
    else this.router.navigate(["/print"]);
  }

  toggleSelect(id: string, ev: Event) {
    ev.stopPropagation();
    this.store.toggleReportSelect(id);
  }

  toggleSelectAll() {
    this.store.toggleSelectAllReports();
  }

  askDelete(id: string, ev: Event) {
    ev.stopPropagation();
    this.store.askDeleteReports([id]);
  }

  askBulkDelete() {
    this.store.askDeleteReports(this.store.state().selectedReports);
  }

  confirmDelete() {
    this.store.confirmDeleteReports();
  }
}
