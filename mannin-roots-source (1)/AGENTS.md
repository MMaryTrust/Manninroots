<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Mannin Roots
- All UI text lives in src/lib/translations.ts (en + ta) and is read via useI18n; never hard-code words — Tamil and English must stay equal.
- Money is integer cents; cart rules (max 3 kitchens, per-kitchen delivery) live in src/lib/cart.tsx and are tested in src/test/cart-rules.test.ts.
- Test data currently lives in src/lib/data.ts until the backend module replaces it.
- Language choices and automatic region defaults share lang-detect; localized dictionaries and logo assets map to the same language codes so manual choices update both together.
- Location subscriptions use a stable initial server snapshot to keep first render and hydration aligned before browser location updates.
