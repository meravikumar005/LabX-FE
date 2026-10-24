import { Component, computed, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { LabStore } from "../core/lab-store.service";
import { ResultColumnKey } from "../core/models";

@Component({
  selector: "app-print-preview",
  imports: [RouterLink],
  templateUrl: "./print-preview.component.html",
  styleUrl: "./print-preview.component.css",
})
export class PrintPreviewComponent {
  constructor(
    public store: LabStore,
    private router: Router,
  ) {}

  readonly toggles: { key: "printHeader" | "arrows" | "ranges"; label: string }[] = [
    { key: "printHeader", label: "Letterhead" },
    { key: "arrows", label: "Arrows" },
    { key: "ranges", label: "Ref. ranges" },
  ];

  readonly status = computed(() => this.store.findReport(this.store.state().activeReport)?.status);
  readonly isVerified = computed(() => {
    const s = this.status();
    return s === "Verified" || s === "Printed";
  });
  readonly cancellable = computed(() => {
    const s = this.status();
    return !!s && this.store.canCancel(s);
  });
  readonly backLabel = computed(() => {
    switch (this.store.state().printOrigin) {
      case "dashboard":
        return "← Back to dashboard";
      case "reports":
        return "← Back to all reports";
      default:
        return "← Back to results";
    }
  });
  readonly pageCss = computed(() => {
    const size = this.store.state().pageSetup.paperSize;
    const cssSize = size === "Letter" ? "letter" : size === "A5" ? "A5" : "A4";
    return `@page { size: ${cssSize}; margin: 0; }`;
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

  private static readonly COLUMN_WEIGHTS: Record<ResultColumnKey, number> = {
    investigation: 1.6,
    result: 0.9,
    unit: 0.7,
    referenceRange: 1.1,
  };

  columnWidthPct(key: ResultColumnKey): number {
    const visible = this.visibleResultColumns();
    const total = visible.reduce(
      (sum, c) => sum + PrintPreviewComponent.COLUMN_WEIGHTS[c.key],
      0,
    );
    return total > 0 ? (PrintPreviewComponent.COLUMN_WEIGHTS[key] / total) * 100 : 0;
  }

  flip(key: "printHeader" | "arrows" | "ranges") {
    if (key === "printHeader") this.store.toggleLetterhead();
    else if (key === "arrows") this.store.toggleArrows();
    else this.store.toggleRanges();
  }

  verify() {
    this.store.verifyReport();
  }

  readonly awaitingPrintConfirm = signal(false);

  print() {
    // Browsers never tell a page whether the user actually printed or hit
    // Cancel in the OS dialog — `afterprint` fires either way. So we don't
    // assume success: no status change, no navigation, until the user
    // confirms it actually printed.
    const onAfterPrint = () => {
      window.removeEventListener("afterprint", onAfterPrint);
      this.awaitingPrintConfirm.set(true);
    };
    window.addEventListener("afterprint", onAfterPrint);
    window.print();
  }

  confirmPrinted() {
    this.awaitingPrintConfirm.set(false);
    this.store.printReport();
    this.router.navigate(["/dashboard"]);
  }

  dismissPrintConfirm() {
    this.awaitingPrintConfirm.set(false);
  }

  confirmCancel() {
    this.store.confirmCancelOrder();
    this.router.navigate(["/dashboard"]);
  }

  goBack() {
    switch (this.store.state().printOrigin) {
      case "dashboard":
        this.router.navigate(["/dashboard"]);
        break;
      case "reports":
        this.router.navigate(["/reports"]);
        break;
      default:
        this.router.navigate(["/entry", this.store.state().activeReport]);
    }
  }
}
