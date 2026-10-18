import { Component, computed } from "@angular/core";
import { Router } from "@angular/router";
import { LabStore } from "../core/lab-store.service";

@Component({
  selector: "app-print-preview",
  imports: [],
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

  flip(key: "printHeader" | "arrows" | "ranges") {
    if (key === "printHeader") this.store.toggleLetterhead();
    else if (key === "arrows") this.store.toggleArrows();
    else this.store.toggleRanges();
  }

  verify() {
    this.store.verifyReport();
  }

  print() {
    this.store.printReport();
    window.print();
    this.router.navigate(["/dashboard"]);
  }

  confirmCancel() {
    this.store.confirmCancelOrder();
    this.router.navigate(["/dashboard"]);
  }

  backToEntry() {
    this.router.navigate(["/entry", this.store.state().activeReport]);
  }
}
