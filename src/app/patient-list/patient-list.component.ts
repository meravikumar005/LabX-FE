import { Component } from "@angular/core";
import { LabStore } from "../core/lab-store.service";
import { inputValue } from "../core/dom";
import { Patient, Sex } from "../core/models";

@Component({
  selector: "app-patient-list",
  imports: [],
  templateUrl: "./patient-list.component.html",
  styleUrl: "./patient-list.component.css",
})
export class PatientListComponent {
  constructor(public store: LabStore) {}

  readonly fields: { key: keyof Patient; label: string; ph: string; mono?: boolean }[] = [
    { key: "name", label: "Full name", ph: "Sunita Devi" },
    { key: "age", label: "Age", ph: "50", mono: true },
    { key: "mobile", label: "Mobile number", ph: "98XXXXXXXX", mono: true },
    { key: "address", label: "Address", ph: "Birgunj-8" },
    { key: "ref", label: "Referred by", ph: "Dr. …" },
  ];

  setPq(ev: Event) {
    this.store.setPq(inputValue(ev));
  }

  setField(key: keyof Patient, ev: Event) {
    this.store.setPatientDraftField(key, inputValue(ev));
  }

  setSex(ev: Event) {
    this.store.setPatientDraftField("sex", inputValue(ev) as Sex);
  }
}
