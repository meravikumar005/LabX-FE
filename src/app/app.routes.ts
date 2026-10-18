import { Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { NewReportComponent } from "./new-report/new-report.component";
import { ResultEntryListComponent } from "./result-entry-list/result-entry-list.component";
import { ResultEntryComponent } from "./result-entry/result-entry.component";
import { PrintPreviewComponent } from "./print-preview/print-preview.component";
import { ReportsListComponent } from "./reports-list/reports-list.component";
import { TemplatesComponent } from "./templates/templates.component";
import { PatientListComponent } from "./patient-list/patient-list.component";

export const routes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  { path: "dashboard", component: DashboardComponent },
  { path: "new", component: NewReportComponent },
  { path: "entry", component: ResultEntryListComponent },
  { path: "entry/:id", component: ResultEntryComponent },
  { path: "print", component: PrintPreviewComponent },
  { path: "reports", component: ReportsListComponent },
  { path: "patients", component: PatientListComponent },
  { path: "templates", component: TemplatesComponent },
  { path: "**", redirectTo: "dashboard" },
];
