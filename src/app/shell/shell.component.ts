import { Component, computed } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { Router } from "@angular/router";
import { LabStore } from "../core/lab-store.service";
import { AuthService } from "../core/auth.service";

@Component({
  selector: "app-shell",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css",
})
export class ShellComponent {
  constructor(
    public store: LabStore,
    public auth: AuthService,
    private router: Router,
  ) {}

  readonly nav = computed(() => {
    const c = this.store.navCounts();
    return [
      { path: "dashboard", label: "Dashboard", count: `${c.dash}` },
      { path: "entry", label: "Result entry", count: `${c.entry}` },
      { path: "reports", label: "All reports", count: `${c.reports}` },
      { path: "templates", label: "Test templates", count: `${c.templates}` },
      { path: "page-setup", label: "Page setup", count: "" },
    ];
  });

  clearBanner() {
    this.store.clearBanner();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(["/login"]);
  }
}
