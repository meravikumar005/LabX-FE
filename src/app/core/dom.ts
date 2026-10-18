export function inputValue(ev: Event): string {
  return (ev.target as HTMLInputElement).value;
}
