import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { LabStore, DecoratedRow } from "../core/lab-store.service";
import { AppState } from "../core/models";

@Component({
  selector: "app-dashboard",
  imports: [],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent {
  constructor(
    public store: LabStore,
    private router: Router,
  ) {}

  readonly filters: AppState["dashFilter"][] = ["All", "Pending", "Done"];

  setDq(v: string) {
    this.store.setDq(v);
  }

  open(row: DecoratedRow) {
    const screen = this.store.openReport(row.report);
    if (screen === "entry") {
      this.router.navigate(["/entry", row.report.id]);
    } else {
      this.store.setPrintOrigin("dashboard");
      this.router.navigate(["/print"]);
    }
  }
}
