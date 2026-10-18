import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../core/auth.service";

@Component({
  selector: "app-login",
  imports: [FormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  username = "";
  password = "";
  readonly error = signal("");
  readonly submitting = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit() {
    this.error.set("");
    this.submitting.set(true);
    const result = this.auth.login(this.username, this.password);
    this.submitting.set(false);
    if (!result.ok) {
      this.error.set(result.error ?? "Login failed.");
      return;
    }
    this.router.navigateByUrl("/dashboard");
  }
}
