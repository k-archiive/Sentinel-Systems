# How we work

Everyone's work should show up under their own name on GitHub, and nobody's work should
overwrite anyone else's. This is the workflow that makes both happen.

## 1. Pick a task

- Every task is an issue on the [Sentinel Systems Board](https://github.com/users/YoumboFatimaAne/projects/2).
- Assign yourself to the issue and move it to **In progress** before you start, so nobody doubles up.
- New idea or bug? Open an issue first and say what it's for.

## 2. Work on a branch

Never commit straight to `main`. Make a branch named after the kind of work:

```
git switch main
git pull
git switch -c feature/short-name      # new feature
git switch -c fix/short-name          # bug fix
git switch -c docs/short-name         # documents only
```

Commit small, focused changes from **your own GitHub account** (`git config user.name` should be
you). Please use `git push` rather than "Add files via upload", so each commit says what changed.

## 3. Open a pull request

```
git push -u origin feature/short-name
```

Then open a pull request on GitHub. The template asks for:

- what changed and why
- `Closes #<issue>` so the issue closes when it merges
- how a teammate can test it

Move the issue to **In review** on the board.

## 4. Review each other's work

- Every pull request needs **one approval from a teammate** before it's merged.
- To review: open the PR → **Files changed** → comment on lines, then **Review changes →
  Approve** or **Request changes**.
- Try to review within 2 days. If you're asked and can't, say so in a comment.

## 5. Merge

The author merges once it's approved. Delete the branch afterwards (GitHub offers a button).

## Running the app

```
cd Route_Machine
npm install
npm test        # unit tests
npm run dev     # opens on http://localhost:5173
```

## Where things live

| Folder | What's in it |
|---|---|
| `Route_Machine/` | The React app |
| `Route_Machine/src/risk/` | Flood risk scoring and safety-guidance rules (+ tests) |
| `Route_Machine/src/components/` | Map pieces like the risk-coloured route and safety screen |
| `docs/` | How the risk score works, usability check, other write-ups |
