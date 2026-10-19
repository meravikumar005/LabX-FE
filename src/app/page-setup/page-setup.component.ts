import { Component, computed, signal } from "@angular/core";
import { LabStore } from "../core/lab-store.service";
import {
  PageSetup,
  PaperSize,
  PatientFieldConfig,
  PatientFieldSource,
  ResultColumnKey,
} from "../core/models";
import { PATIENT_FIELD_LABELS } from "../core/data";
import { inputValue } from "../core/dom";

type MarginKey = "marginTopMm" | "marginRightMm" | "marginBottomMm" | "marginLeftMm";
type TextKey = "hospitalName" | "addressLine" | "departmentLine" | "logoInitials";

@Component({
  selector: "app-page-setup",
  imports: [],
  templateUrl: "./page-setup.component.html",
  styleUrl: "./page-setup.component.css",
})
export class PageSetupComponent {
  constructor(public store: LabStore) {}

  readonly paperSizes: PaperSize[] = ["A4", "Letter", "A5"];

  readonly marginFields: { key: MarginKey; label: string }[] = [
    { key: "marginTopMm", label: "Top" },
    { key: "marginRightMm", label: "Right" },
    { key: "marginBottomMm", label: "Bottom" },
    { key: "marginLeftMm", label: "Left" },
  ];

  readonly textFields: { key: TextKey; label: string; ph: string }[] = [
    { key: "hospitalName", label: "Hospital / lab name", ph: "Sarbottam Hospital Pvt. Ltd." },
    { key: "addressLine", label: "Address line", ph: "Birgunj-8, Parsa, Nepal · 051-527755" },
    { key: "departmentLine", label: "Department line", ph: "Department of Pathology" },
    { key: "logoInitials", label: "Logo initials", ph: "SH" },
  ];

  readonly preview = computed(() => {
    const ps = this.store.state().pageSetup;
    const dims = LabStore.PAPER_SIZES_MM[ps.paperSize];
    const widthPx = 300;
    const heightPx = widthPx * (dims.h / dims.w);
    const pctTop = (ps.marginTopMm / dims.h) * 100;
    const pctRight = (ps.marginRightMm / dims.w) * 100;
    const pctBottom = (ps.marginBottomMm / dims.h) * 100;
    const pctLeft = (ps.marginLeftMm / dims.w) * 100;
    const innerHeightMm = Math.max(dims.h - ps.marginTopMm - ps.marginBottomMm, 1);
    const pctHeaderOffset = ps.useOwnLetterhead
      ? Math.min((ps.headerOffsetMm / innerHeightMm) * 100, 70)
      : 0;
    return { widthPx, heightPx, pctTop, pctRight, pctBottom, pctLeft, pctHeaderOffset };
  });

  readonly previewMmPx = computed(() => {
    const dims = LabStore.PAPER_SIZES_MM[this.store.state().pageSetup.paperSize];
    return this.preview().widthPx / dims.w;
  });

  readonly leftFields = computed(() =>
    this.store.state().pageSetup.patientFields.filter((f) => f.column === "left"),
  );
  readonly rightFields = computed(() =>
    this.store.state().pageSetup.patientFields.filter((f) => f.column === "right"),
  );
  readonly visibleResultColumns = computed(() =>
    this.store.state().pageSetup.resultColumns.filter((c) => c.show),
  );
  readonly showUnitColumn = computed(
    () => this.store.state().pageSetup.resultColumns.find((c) => c.key === "unit")?.show ?? true,
  );

  readonly sourceOptions: { value: PatientFieldSource; label: string }[] = (
    Object.keys(PATIENT_FIELD_LABELS) as PatientFieldSource[]
  ).map((value) => ({ value, label: PATIENT_FIELD_LABELS[value] }));

  sourceLabel(source: PatientFieldSource): string {
    return PATIENT_FIELD_LABELS[source];
  }

  private static readonly PREVIEW_WIDTHS: Record<ResultColumnKey, string> = {
    investigation: "1.6fr",
    result: "0.9fr",
    unit: "0.7fr",
    referenceRange: "1.1fr",
  };

  readonly previewColTemplate = computed(() =>
    this.visibleResultColumns()
      .map((c) => PageSetupComponent.PREVIEW_WIDTHS[c.key])
      .join(" "),
  );

  previewCellSample(key: ResultColumnKey, name: string, value: string, unit: string, ref: string): string {
    switch (key) {
      case "investigation":
        return name;
      case "result":
        return this.showUnitColumn() ? value : `${value} ${unit}`;
      case "unit":
        return unit;
      case "referenceRange":
        return this.showUnitColumn() ? ref : `${ref} ${unit}`;
    }
  }

  readonly sampleValues: Record<PatientFieldSource, string> = {
    name: "Sample Patient",
    patientId: "P-0000",
    ageSex: "32 Yrs / F",
    mobile: "98XXXXXXXX",
    address: "Birgunj-8",
    ref: "Dr. ...",
    bill: "00000",
    date: "00/00/0000 · B.S. 0000-00-00",
    dateAd: "00/00/0000",
    dateBs: "0000-00-00",
    reportNo: "R-00-0000",
  };

  setPaperSize(ev: Event) {
    this.store.updatePageSetup({ paperSize: inputValue(ev) as PaperSize });
  }

  setMargin(key: MarginKey, ev: Event) {
    const n = Number(inputValue(ev));
    this.store.updatePageSetup({ [key]: isNaN(n) ? 0 : Math.max(0, n) } as Partial<PageSetup>);
  }

  setHeaderOffset(ev: Event) {
    const n = Number(inputValue(ev));
    this.store.updatePageSetup({ headerOffsetMm: isNaN(n) ? 0 : Math.max(0, n) });
  }

  toggleUseOwnLetterhead() {
    const ps = this.store.state().pageSetup;
    this.store.updatePageSetup({ useOwnLetterhead: !ps.useOwnLetterhead });
  }

  toggleShowPatientMeta() {
    const ps = this.store.state().pageSetup;
    this.store.updatePageSetup({ showPatientMeta: !ps.showPatientMeta });
  }

  setTextField(key: TextKey, ev: Event) {
    this.store.updatePageSetup({ [key]: inputValue(ev) } as Partial<PageSetup>);
  }

  reset() {
    this.store.resetPageSetup();
  }

  readonly addFieldSource = signal<PatientFieldSource>(this.sourceOptions[0].value);

  setAddFieldSource(ev: Event) {
    this.addFieldSource.set(inputValue(ev) as PatientFieldSource);
  }
  addField(column: "left" | "right") {
    this.store.addPatientField(this.addFieldSource(), column);
  }
  removeField(id: string) {
    this.store.removePatientField(id);
  }
  setFieldLabel(id: string, ev: Event) {
    this.store.setPatientFieldLabel(id, inputValue(ev));
  }
  setFieldColumn(id: string, column: "left" | "right") {
    this.store.setPatientFieldColumn(id, column);
  }
  moveField(id: string, dir: "up" | "down") {
    this.store.movePatientField(id, dir);
  }
  toggleFieldLabel(f: PatientFieldConfig) {
    this.store.setPatientFieldLabelVisible(f.id, !f.showLabel);
  }
  setFieldMargin(id: string, axis: "top" | "left", ev: Event) {
    this.store.setPatientFieldMargin(id, axis, Number(inputValue(ev)));
  }

  toggleColumn(key: ResultColumnKey) {
    this.store.toggleResultColumn(key);
  }
  setColumnLabel(key: ResultColumnKey, ev: Event) {
    this.store.setResultColumnLabel(key, inputValue(ev));
  }
  moveColumn(key: ResultColumnKey, dir: "left" | "right") {
    this.store.moveResultColumn(key, dir);
  }
}
