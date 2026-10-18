import { Injectable, computed, signal } from "@angular/core";
import { User } from "./models";
import { USERS_SEED } from "./data";

const SESSION_KEY = "labx.session";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly users: User[] = USERS_SEED;

  readonly currentUser = signal<User | null>(this.restore());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  private restore(): User | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const username = JSON.parse(raw)?.username;
      return this.users.find((u) => u.username === username) ?? null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): { ok: boolean; error?: string } {
    const uname = username.trim();
    if (!uname || !password) {
      return { ok: false, error: "Enter both username and password." };
    }
    const user = this.users.find(
      (u) => u.username.toLowerCase() === uname.toLowerCase() && u.password === password,
    );
    if (!user) {
      return { ok: false, error: "Incorrect username or password." };
    }
    this.currentUser.set(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username }));
    return { ok: true };
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(SESSION_KEY);
  }
}
