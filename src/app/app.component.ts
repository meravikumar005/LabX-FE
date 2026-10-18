import { Component, computed } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { LabStore } from "./core/lab-store.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  constructor(public store: LabStore) {}

  readonly nav = computed(() => {
    const c = this.store.navCounts();
    return [
      { path: "dashboard", label: "Dashboard", count: `${c.dash}` },
      { path: "entry", label: "Result entry", count: `${c.entry}` },
      { path: "patients", label: "Patient list", count: `${c.patients}` },
      { path: "reports", label: "All reports", count: `${c.reports}` },
      { path: "templates", label: "Test templates", count: `${c.templates}` },
    ];
  });

  clearBanner() {
    this.store.clearBanner();
  }
}
