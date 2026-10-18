import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LabStore } from "../core/lab-store.service";
import { inputValue } from "../core/dom";

@Component({
  selector: "app-result-entry",
  imports: [],
  templateUrl: "./result-entry.component.html",
  styleUrl: "./result-entry.component.css",
})
export class ResultEntryComponent implements OnInit {
  constructor(
    public store: LabStore,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    if (id && id !== this.store.state().activeReport) {
      const rep = this.store.findReport(id);
      if (rep) this.store.openReport(rep);
    }
  }

  setValue(name: string, ev: Event) {
    this.store.setEntryValue(this.store.entryPanel().id, name, inputValue(ev));
  }

  backToQueue() {
    this.router.navigate(["/entry"]);
  }

  goPrint() {
    this.router.navigate(["/print"]);
  }

  saveResults() {
    this.store.saveResults();
    this.router.navigate(["/entry"]);
  }
}
