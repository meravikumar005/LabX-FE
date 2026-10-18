import { Component } from "@angular/core";
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

  flip(key: "printHeader" | "arrows" | "ranges") {
    if (key === "printHeader") this.store.toggleLetterhead();
    else if (key === "arrows") this.store.toggleArrows();
    else this.store.toggleRanges();
  }

  verifyAndPrint() {
    this.store.printReport();
    window.print();
    this.router.navigate(["/dashboard"]);
  }
}
