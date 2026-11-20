# Team A, "The quiet desk": every colour pair, measured

**How these were measured.** Each ratio is the WCAG 2 contrast formula run in the browser on the two colour values written in `a.css` (Nov 20). They are worked out from the values, not sampled from screenshot pixels. Where a thing is drawn part see-through (a faded act), the two colours were mixed first at that strength and the mix was measured.

**The floors** (brief, section 2): page text 13.9 · names 7 · labels and buttons 4.5 · lines, icons and tiles 3.

**Result.** Every pair that carries a word, a name, an icon or a control's edge meets its floor. Four things sit under a floor on purpose and are listed at the end, each with its reason: acts that are not offered in the stage she is in, the hairlines the palette itself gives, two Part tiles that lean on their edge, and the prototype's own scrollbar thumb.

## 1. The page (the same in both rooms: the page stays paper)

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| Page text and heading | `#1C1C1C` | `#FBFBFA` | 16.46 | 13.9 | pass |
| Foot of the Part ("end of Part 3") | `#5E666E` | `#FBFBFA` | 5.63 | 4.5 | pass |
| Foot of the Part, the two links | `#3A4047` | `#FBFBFA` | 10.12 | 4.5 | pass |
| The Part's tag in the margin, its letter | `#1C1C1C` | `#B9A03A` | 6.62 | 4.5 | pass |
| The Part's tag, its edge | `#6A727B` | `#FBFBFA` | 4.71 | 3 | pass |
| Up and down arrows, the mark | `#3A4047` | `#F4F5F6` | 9.60 | 3 | pass |
| Up and down arrows, the edge | `#6A727B` | `#FBFBFA` | 4.71 | 3 | pass |

## 2. Light room: the three levels on a panel, a hovered row and the room

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| Level 1 (where she is) | `#151719` | panel `#F4F5F6` | 16.46 | 7 | pass |
| Level 2 (names) | `#23272B` | panel `#F4F5F6` | 13.78 | 7 | pass |
| Labels, "More" | `#3A4047` | panel `#F4F5F6` | 9.60 | 4.5 | pass |
| Level 3 (facts) | `#5E666E` | panel `#F4F5F6` | 5.34 | 4.5 | pass |
| A control's edge, an icon | `#5E666E` | panel `#F4F5F6` | 5.34 | 3 | pass |
| Guidance blue ("No split screen in SPRINT.") | `#3F6183` | panel `#F4F5F6` | 5.92 | 4.5 | pass |
| Level 1 | `#151719` | hover `#E6E8EA` | 14.63 | 7 | pass |
| Level 2 | `#23272B` | hover `#E6E8EA` | 12.24 | 7 | pass |
| Labels | `#3A4047` | hover `#E6E8EA` | 8.53 | 4.5 | pass |
| Level 3, the readout under the page, the notes switch | `#5E666E` | room `#E6E8EA` | 4.75 | 4.5 | pass |
| A switch that is set (ON) | `#F4F5F6` | `#23272B` | 13.78 | 4.5 | pass |
| Search field, the word typed | `#151719` | `#FBFBFA` | 17.36 | 7 | pass |
| Search field, "Search" | `#5E666E` | `#FBFBFA` | 5.63 | 4.5 | pass |
| Brass bar, against its keyline | `#FF9800` | `#23272B` | 6.98 | 3 | pass |

## 3. Light room: the Part tints (PROPOSED colour role)

A Part's tint is a pale wash behind the things that belong to that Part. The tag carries the meaning; the tint only helps, so the tint against the panel has no floor of its own (yellow 1.10, blue 1.13). What stands on a tint does:

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| Level 1 | `#151719` | yellow tint `#F1EBCF` | 15.00 | 7 | pass |
| Level 2 | `#23272B` | yellow tint `#F1EBCF` | 12.55 | 7 | pass |
| Labels | `#3A4047` | yellow tint `#F1EBCF` | 8.74 | 4.5 | pass |
| Level 3, a review flag | `#5E666E` | yellow tint `#F1EBCF` | 4.87 | 4.5 | pass |
| A button's edge, an icon | `#5E666E` | yellow tint `#F1EBCF` | 4.87 | 3 | pass |
| Guidance blue | `#3F6183` | yellow tint `#F1EBCF` | 5.39 | 4.5 | pass |
| A tag's edge | `#6A727B` | yellow tint `#F1EBCF` | 4.07 | 3 | pass |
| Level 1 | `#151719` | blue tint `#E0E8F0` | 14.52 | 7 | pass |
| Level 2 | `#23272B` | blue tint `#E0E8F0` | 12.15 | 7 | pass |
| Labels | `#3A4047` | blue tint `#E0E8F0` | 8.47 | 4.5 | pass |
| Level 3 | `#5E666E` | blue tint `#E0E8F0` | 4.71 | 4.5 | pass |
| Guidance blue | `#3F6183` | blue tint `#E0E8F0` | 5.22 | 4.5 | pass |
| A tag's edge | `#6A727B` | blue tint `#E0E8F0` | 3.94 | 3 | pass |

The grey tint is the room's own `#E6E8EA`: its pairs are the "hover" and "room" rows of table 2.

## 4. The Part tags (the prototype's colours, now also in the top bar, on the page, under the page and beside the page)

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| Letter on the blue tag | `#FFFFFF` | `#41658A` | 6.08 | 4.5 | pass |
| Letter on the yellow tag | `#1C1C1C` | `#B9A03A` | 6.62 | 4.5 | pass |
| Letter on the grey tag | `#FFFFFF` | `#6A727B` | 4.88 | 4.5 | pass |
| Letter on the pale tag | `#1C1C1C` | `#C9CED3` | 10.75 | 4.5 | pass |
| Blue tile | `#41658A` | panel `#F4F5F6` | 5.57 | 3 | pass |
| Blue tile | `#41658A` | blue tint `#E0E8F0` | 4.91 | 3 | pass |
| Grey tile (it is also its own edge) | `#6A727B` | panel `#F4F5F6` | 4.47 | 3 | pass |
| Any tag's edge | `#6A727B` | panel `#F4F5F6` | 4.47 | 3 | pass |
| Any tag's edge, under the page | `#6A727B` | room `#E6E8EA` | 3.97 | 3 | pass |
| On the dark bar and in the dark room: letter on yellow | `#1E262E` | `#CDB75A` | 7.67 | 4.5 | pass |
| the same: letter on blue | `#1E262E` | `#8FA9C4` | 6.30 | 4.5 | pass |
| the same: letter on grey | `#1E262E` | `#9AA1A8` | 5.86 | 4.5 | pass |
| the same: letter on pale | `#1E262E` | `#C3C8CD` | 9.08 | 4.5 | pass |
| Yellow tile on the bar | `#CDB75A` | `#1E262E` | 7.67 | 3 | pass |
| Blue tile on the bar | `#8FA9C4` | `#1E262E` | 6.30 | 3 | pass |

## 5. The top bar and the rail (dark in both rooms)

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| The Project's name (Level 3) | `#B4BAC0` | `#1E262E` | 7.82 | 7 | pass |
| The Doc's name (Level 2) | `#E6E8EA` | `#1E262E` | 12.46 | 7 | pass |
| The Part's place (Level 1) | `#F4F5F6` | `#1E262E` | 14.02 | 7 | pass |
| The arrows between them | `#9AA1A8` | `#1E262E` | 5.86 | 3 | pass |
| A stage she is not in | `#9AA1A8` | `#1E262E` | 5.86 | 4.5 | pass |
| A stage she is not in, pointed at | `#E6E8EA` | `#1E262E` | 12.46 | 4.5 | pass |
| The stage she is in (Level 1) | `#F4F5F6` | lit cell `#2E3A46` | 10.63 | 4.5 | pass |
| The brass line under it | `#FF9800` | lit cell `#2E3A46` | 5.38 | 3 | pass |
| The brass line under an open Part's place | `#FF9800` | `#1E262E` | 7.10 | 3 | pass |
| The strip's NOT RULED tag, its words | `#E6E8EA` | `#1E262E` | 12.46 | 4.5 | pass |
| The strip's NOT RULED tag, its dashed edge | `#9AA1A8` | `#1E262E` | 5.86 | 3 | pass |
| The three tool icons | `#9AA1A8` | `#1E262E` | 5.86 | 3 | pass |
| A tool icon, pointed at | `#F4F5F6` | `#2E3A46` | 10.63 | 3 | pass |
| A review flag on the bar | `#9AA1A8` | `#1E262E` | 5.86 | 4.5 | pass |
| Rail labels (as in the prototype) | `#9AA1A8` | `#1E262E` | 5.86 | 4.5 | pass |
| The Project she is in, on the rail | `#F4F5F6` | `#27323C` | 11.97 | 7 | pass |
| The rail's rules | `#727C86` | `#1E262E` | 3.60 | 3 | pass |

## 6. Dark room (PROPOSED: the grey ramp turned over; the page stays paper)

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| Level 1 and Level 2 | `#F4F5F6` | panel `#23272B` | 13.78 | 7 | pass |
| Labels | `#D2D6DA` | panel `#23272B` | 10.29 | 4.5 | pass |
| Level 3 | `#9AA1A8` | panel `#23272B` | 5.76 | 4.5 | pass |
| A control's edge, an icon | `#9AA1A8` | panel `#23272B` | 5.76 | 3 | pass |
| Guidance blue | `#7FA0BC` | panel `#23272B` | 5.48 | 4.5 | pass |
| Brass bar (stands alone on a dark surface) | `#FF9800` | panel `#23272B` | 6.98 | 3 | pass |
| Level 1 and Level 2 | `#F4F5F6` | hover and grey tint `#2E3338` | 11.68 | 7 | pass |
| Labels | `#D2D6DA` | hover and grey tint `#2E3338` | 8.73 | 4.5 | pass |
| Level 3 | `#9AA1A8` | hover and grey tint `#2E3338` | 4.88 | 4.5 | pass |
| Guidance blue | `#7FA0BC` | hover and grey tint `#2E3338` | 4.65 | 4.5 | pass |
| Level 1 and Level 2 | `#F4F5F6` | yellow tint `#37321F` | 11.74 | 7 | pass |
| Labels | `#D2D6DA` | yellow tint `#37321F` | 8.77 | 4.5 | pass |
| Level 3 | `#9AA1A8` | yellow tint `#37321F` | 4.91 | 4.5 | pass |
| Guidance blue | `#7FA0BC` | yellow tint `#37321F` | 4.67 | 4.5 | pass |
| Brass bar | `#FF9800` | yellow tint `#37321F` | 5.95 | 3 | pass |
| Yellow tile | `#CDB75A` | yellow tint `#37321F` | 6.42 | 3 | pass |
| Level 1 and Level 2 | `#F4F5F6` | blue tint `#24313D` | 12.16 | 7 | pass |
| Labels | `#D2D6DA` | blue tint `#24313D` | 9.09 | 4.5 | pass |
| Level 3 | `#9AA1A8` | blue tint `#24313D` | 5.08 | 4.5 | pass |
| Guidance blue | `#7FA0BC` | blue tint `#24313D` | 4.84 | 4.5 | pass |
| Blue tile | `#8FA9C4` | blue tint `#24313D` | 5.46 | 3 | pass |
| Level 3, the readout under the page, the notes switch | `#9AA1A8` | room `#151719` | 6.88 | 4.5 | pass |
| Search field, the word typed | `#F4F5F6` | `#151719` | 16.46 | 7 | pass |
| Search field, "Search" | `#9AA1A8` | `#151719` | 6.88 | 4.5 | pass |
| A switch that is set (ON) | `#23272B` | `#F4F5F6` | 13.78 | 4.5 | pass |
| Yellow tile under the page | `#CDB75A` | room `#151719` | 9.00 | 3 | pass |

The first draft had the dark hover at `#3A4047`, where Level 3 measured 4.01. It was changed to `#2E3338` for that reason.

## 7. Review notes, the words on hover, and notes when a thing is pressed

| What | Ink | On | Ratio | Floor | |
|---|---|---|---|---|---|
| A review flag (letters and dashed edge) | `#5E666E` | panel `#F4F5F6` | 5.34 | 4.5 | pass |
| A review flag | `#5E666E` | room `#E6E8EA` | 4.75 | 4.5 | pass |
| A review flag | `#5E666E` | yellow tint `#F1EBCF` | 4.87 | 4.5 | pass |
| A review flag, dark room | `#9AA1A8` | panel `#23272B` | 5.76 | 4.5 | pass |
| A review flag, dark room | `#9AA1A8` | yellow tint `#37321F` | 4.91 | 4.5 | pass |
| An open note, its words | `#23272B` | `#FBFBFA` | 14.52 | 4.5 | pass |
| An open note, its head | `#3A4047` | `#FBFBFA` | 10.12 | 4.5 | pass |
| Words on hover | `#F4F5F6` | `#1E262E` | 14.02 | 4.5 | pass |
| Words on hover, the key | `#D2D6DA` | `#1E262E` | 10.48 | 4.5 | pass |
| Words on hover, the blue mark | `#7FA0BC` | `#1E262E` | 5.58 | 3 | pass |
| A note when a thing is pressed | `#E6E8EA` | `#23272B` | 12.24 | 4.5 | pass |

## 8. Under a floor, on purpose (for the Wrizors' law pass)

| What | Ink | On | Ratio | Floor | Why |
|---|---|---|---|---|---|
| An act not offered in this stage (faded to 38%) | mix `#A5A7A9` | panel `#F4F5F6` | 2.21 | 4.5 | It cannot be pressed. It keeps its spot so nothing moves between stages. In SPRINT a blue line under the rows says why ("No split screen in SPRINT."). |
| The same, on the yellow tint | mix `#A3A191` | `#F1EBCF` | 2.17 | 4.5 | as above |
| The same, dark room | mix `#727578` | panel `#23272B` | 3.24 | 4.5 | as above |
| The same, dark room, on the yellow tint | mix `#7F7C71` | `#37321F` | 3.07 | 4.5 | as above |
| Stage buttons in a split (cannot be pressed) | `#56616B` | `#1E262E` | 2.42 | 4.5 | As in the prototype. The stage she is in stays at 14.02. |
| SPRINT while she types: everything but the page, at a tenth | | | about 1.1 | | Meant not to be read: it comes back when the mouse moves. As in the prototype, but with a cut, not a fade. |
| Hairlines between rows | `#D2D6DA` | panel `#F4F5F6` | 1.34 | 3 | The palette's own hairline (G2 on G0). No meaning rests on a hairline: every control has a G4 edge (5.34). |
| Hairlines, dark room | `#3A4047` | panel `#23272B` | 1.44 | 3 | The same hairline, turned over. |
| Yellow tile | `#B9A03A` | page `#FBFBFA` | 2.49 | 3 | The tile leans on its `#6A727B` edge (4.71) and its letter (6.62). On the panel 2.36, on its own tint 2.15, under the page 2.10; the edge there is 4.47, 4.07, 3.97. |
| Pale tile | `#C9CED3` | panel `#F4F5F6` | 1.45 | 3 | The same: its edge is 4.47. No Part of Harbor Tolls uses it. |
| The Part's scrollbar thumb on its track | `#8A9199` | `#D2D6DA` | 2.18 | 3 | The prototype's own, not changed. Against the page it is 3.08. |

## 9. Brass and blue, checked against their rules

- **Brass is only "me, here, now":** the bar beside the Part she is in (Parts list, ASSETS group, the list dropped from the top bar), the bar beside the Doc, Project and theme she is in inside the rail's drawers, the line under the stage she is in, the line under the Part's place when its list is open, the Project she is in on the rail, the notch in the WRIZO mark. It is on no button and no label. (The prototype lets a Project's box be coloured brass, NOT-RULED item 31. No Project in the made-up content is.)
- **Brass on a light surface never stands alone:** every brass bar on a light panel or tint has a 1 px `#23272B` keyline on both sides (brass against a light panel alone is 1.97).
- **Blue is only help:** the line "No split screen in SPRINT." and the left edge of the words that show on hover. The blue Part tag is a Part colour, not guidance blue (`#41658A`, not `#3F6183`).
