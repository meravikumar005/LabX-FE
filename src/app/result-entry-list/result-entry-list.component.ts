import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { LabStore, DecoratedRow } from "../core/lab-store.service";
import { inputValue } from "../core/dom";

@Component({
  selector: "app-result-entry-list",
  imports: [],
  templateUrl: "./result-entry-list.component.html",
  styleUrl: "./result-entry-list.component.css",
})
export class ResultEntryListComponent {
  constructor(
    public store: LabStore,
    private router: Router,
  ) {}

  setEq(ev: Event) {
    this.store.setEq(inputValue(ev));
  }

  open(row: DecoratedRow) {
    this.store.openReport(row.report);
    this.router.navigate(["/entry", row.report.id]);
  }
}
