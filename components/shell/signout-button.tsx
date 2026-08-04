export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="rounded-lg px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-line/50 hover:text-ink"
      >
        Sign out
      </button>
    </form>
  );
}
