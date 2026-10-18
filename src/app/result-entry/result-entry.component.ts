import { Component, ElementRef, OnInit, ViewChild, computed, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LabStore } from "../core/lab-store.service";
import { inputValue } from "../core/dom";
import { Patient, Sex } from "../core/models";

@Component({
  selector: "app-result-entry",
  imports: [],
  templateUrl: "./result-entry.component.html",
  styleUrl: "./result-entry.component.css",
})
export class ResultEntryComponent implements OnInit {
  @ViewChild("entryTable") entryTable?: ElementRef<HTMLElement>;
  @ViewChild("panelsList") panelsList?: ElementRef<HTMLElement>;

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
  readonly editable = computed(() => {
    const s = this.status();
    return !!s && this.store.canEditOrder(s);
  });

  readonly patientFields: { key: keyof Patient; label: string; ph: string; mono?: boolean }[] = [
    { key: "name", label: "Full name", ph: "Sunita Devi" },
    { key: "age", label: "Age", ph: "50", mono: true },
    { key: "mobile", label: "Mobile number", ph: "98XXXXXXXX", mono: true },
    { key: "address", label: "Address", ph: "Birgunj-8" },
    { key: "ref", label: "Referred by", ph: "Dr. …" },
  ];

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

  setEditField(key: keyof Patient, ev: Event) {
    this.store.setOrderEditField(key, inputValue(ev));
  }
  setEditSex(ev: Event) {
    this.store.setOrderEditField("sex", inputValue(ev) as Sex);
  }
  setEditQ(ev: Event) {
    this.store.setOrderEditQ(inputValue(ev));
  }

  saveOrderEdit() {
    this.store.saveOrderEdit();
  }

  readonly draggingId = signal<string | null>(null);
  private dragStart: { id: string; x: number; y: number; pointerId: number } | null = null;
  private didDrag = false;

  onTabPointerDown(ev: PointerEvent, id: string) {
    this.dragStart = { id, x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId };
    this.didDrag = false;
  }

  onListPointerMove(ev: PointerEvent) {
    const start = this.dragStart;
    if (!start) return;
    if (!this.didDrag) {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (Math.hypot(dx, dy) < 6) return;
      this.didDrag = true;
      this.draggingId.set(start.id);
      // Only capture once a real drag is confirmed — capturing on every
      // pointerdown redirects the plain click's target to this container,
      // which stops the (click) handler on the individual tab from firing.
      this.panelsList?.nativeElement.setPointerCapture(start.pointerId);
    }
    const over = document
      .elementFromPoint(ev.clientX, ev.clientY)
      ?.closest<HTMLElement>(".panel-tab");
    const overId = over?.dataset["id"];
    if (overId && overId !== start.id) {
      this.store.reorderSelected(start.id, overId);
    }
  }

  onListPointerUp(ev: PointerEvent) {
    if (this.panelsList?.nativeElement.hasPointerCapture(ev.pointerId)) {
      this.panelsList.nativeElement.releasePointerCapture(ev.pointerId);
    }
    this.dragStart = null;
    this.draggingId.set(null);
    if (this.didDrag) {
      // swallow the trailing click a real drag-release fires, then clear
      // the flag so it never blocks a later, unrelated click.
      setTimeout(() => (this.didDrag = false), 0);
    }
  }

  onTabClick(id: string) {
    if (this.didDrag) {
      this.didDrag = false;
      return;
    }
    this.store.setEntryTab(id);
  }
}
