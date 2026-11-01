# Drawers / places

**What lives here:** the cascade panels (Pages, Boards, Journal, Drawers, Themes, Trash, Settings), the drawers tree, places, and the desk rail.
**Owner (proposal):** TOOLS. **Back to** [MAP](../MAP.md).

## Entry files
- `components/CascadePanels.tsx`: every cascade panel in one file; `components/Cascade.tsx` hosts them.
- `components/DrawersTree.tsx`, `components/DrawerTabs.tsx`, `components/DrawerActions.tsx`, `components/ConnectionsDrawerPanel.tsx`.
- `components/PlacesPanel.tsx`, `components/PlaceBlock.tsx`, `components/DeskRail.tsx`.
- `store/place.ts`, `store/menusDrawers.ts`, `store/drawerSet.ts`, `store/lastPlace.ts`, `store/routeForEntry.ts`.

## Seams and hooks
`window.wrizoCreateDrawer`, `window.wrizoSetProjectDrawer`, `window.wrizoRenameDrawer`, `window.wrizoCreateProject`, `window.wrizoCreateBinder`,
`window.wrizoRecordLastPlace`, `window.wrizoResolveLanding`, `window.wrizoSectionFold`.

## Full pair
Drawer and project writes go through `store/persistence.ts`: save/sync, full pair. Panels alone (look, motion) take the default leg.

## Covering harnesses (start here)
`cd2.mjs`, `pw1.mjs`, `pw2.mjs`, `cascade-motion-source.mjs`, `fx9.mjs`, `j6.mjs`, `drawers-p1.mjs`, `one-drawer.mjs`.

## Known traps
- **Panels orbit the page:** opening a panel never moves the page (law 1). Leaving through a panel must offer a one-tap return.
- **An unused availability seam is decorative.** Before trusting a capability prop, grep who actually passes it.
- **Select by name, never by index:** panel and row order changes, and an index check then goes green about something else.
- **#13 step 12a** removes the old project screens and their doors here ([brief](../cleanup/deploy-13-brief.md)).
