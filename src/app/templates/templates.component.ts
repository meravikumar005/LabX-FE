import { Component } from "@angular/core";
import { LabStore } from "../core/lab-store.service";
import { inputValue } from "../core/dom";
import { RowType } from "../core/models";

@Component({
  selector: "app-templates",
  imports: [],
  templateUrl: "./templates.component.html",
  styleUrl: "./templates.component.css",
})
export class TemplatesComponent {
  constructor(public store: LabStore) {}

  readonly rowTypes: { key: RowType; label: string }[] = [
    { key: "value", label: "Value" },
    { key: "sub", label: "Sub" },
    { key: "head", label: "Heading" },
  ];

  pickTpl(ev: Event) {
    this.store.pickTemplate(inputValue(ev));
  }

  setDraftName(ev: Event) {
    this.store.setDraftName(inputValue(ev));
  }

  setRowField(i: number, field: "name" | "unit" | "m" | "f", ev: Event) {
    this.store.patchDraftRow(i, { [field]: inputValue(ev) });
  }
}
