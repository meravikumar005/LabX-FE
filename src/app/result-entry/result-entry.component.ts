import { Component, ElementRef, OnInit, ViewChild, computed } from "@angular/core";
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
  @ViewChild("entryTable") entryTable?: ElementRef<HTMLElement>;

  constructor(
    public store: LabStore,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  readonly status = computed(() => this.store.findReport(this.store.state().activeReport)?.status);
  readonly cancellable = computed(() => {
    const s = this.status();
    return !!s && this.store.canCancel(s);
  });

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

  onEnter(ev: Event) {
    ev.preventDefault();
    const root = this.entryTable?.nativeElement;
    if (!root) return;
    const inputs = Array.from(root.querySelectorAll<HTMLInputElement>("input.value-input"));
    const idx = inputs.indexOf(ev.target as HTMLInputElement);
    if (idx > -1 && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
      inputs[idx + 1].select();
      return;
    }
    this.focusNextPanel();
  }

  private focusNextPanel() {
    const tabs = this.store.panelTabs();
    const next = tabs[tabs.findIndex((t) => t.active) + 1];
    if (!next) return;
    this.store.setEntryTab(next.id);
    setTimeout(() => {
      const firstInput = this.entryTable?.nativeElement.querySelector<HTMLInputElement>(
        "input.value-input",
      );
      firstInput?.focus();
      firstInput?.select();
    });
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

  confirmCancel() {
    this.store.confirmCancelOrder();
    this.router.navigate(["/entry"]);
  }
}
