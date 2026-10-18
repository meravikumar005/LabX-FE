import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { LabStore } from "../core/lab-store.service";
import { RegForm, Sex } from "../core/models";
import { inputValue } from "../core/dom";

@Component({
  selector: "app-new-report",
  imports: [],
  templateUrl: "./new-report.component.html",
  styleUrl: "./new-report.component.css",
})
export class NewReportComponent {
  constructor(
    public store: LabStore,
    private router: Router,
  ) {}

  readonly regFields: {
    key: keyof RegForm;
    label: string;
    ph: string;
    mono?: boolean;
  }[] = [
    { key: "name", label: "Full name", ph: "Sunita Devi" },
    { key: "age", label: "Age", ph: "50", mono: true },
    { key: "mobile", label: "Mobile number", ph: "98XXXXXXXX", mono: true },
    { key: "address", label: "Address", ph: "Birgunj-8" },
    { key: "ref", label: "Referred by", ph: "Dr. …" },
  ];

  setReg(key: keyof RegForm, ev: Event) {
    this.store.setReg(key, inputValue(ev));
  }
  setRegSex(ev: Event) {
    this.store.setReg("sex", inputValue(ev) as Sex);
  }
  setQ(ev: Event) {
    this.store.setQ(inputValue(ev));
  }

  saveOrder() {
    const res = this.store.saveOrder();
    if (res.ok) this.router.navigate(["/entry"]);
  }
}
