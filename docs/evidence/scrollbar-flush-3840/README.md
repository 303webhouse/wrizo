# scrollbar-flush item 3 - the page bar at any page scale (branch scrollbar-flush, on page-size-r3)

Captured on the box by a one-off script (not a committed harness; the committed checks are `scrollbar-flush.mjs` PAINT / WIDTH, 68/68 on this tree). Arbor, light page, a 400-line page scrolled to mid-track.
Each `bar-*` file is a 210 x 260 px crop of the page's right edge at the window's NATIVE pixels, enlarged 4x with nearest-neighbour (the bar is a few pixels wide; nothing is smoothed). `window-*` are the whole window, downsized.

| frame | viewport | applied scale (the transform the browser really applied to .mode-page) | bar layout width | PAINTED = layout x scale |
| --- | --- | --- | --- | --- |
| bar-1366 | 1366 x 768 | 1.000 | 10 | 10.0 px |
| bar-3840 | 3840 x 2160 | 1.742 (--wz-k) | 6 | 10.45 px |
| bar-3840-zoom | 3840 x 2160, zoom on | 2.619 (k x 1.6) | 4 | 10.5 px |
| bar-1366-zoom | 1366 x 768, zoom on | 1.600 | 6 | 9.6 px |
| bar-3840-BEFORE-native-thin | 3840 x 2160, the exception switched OFF (`scrollbar-width: thin; scrollbar-color: auto` injected) | 1.742 | 10 | 17.4 px - the bulky bar (the colour is reset to auto here so the native track and arrow show; the production rule was a transparent track) |

The bar is `round(nearest, 10px / applied scale, 1px)` of layout: the engine truncates a fractional scrollbar width (the first box run laid out 10/1.74 = 5.74 as 5 and painted 8.7 px), so the width is rounded on purpose.
In the zoom frames the page and its edge fade into the desk by design (the zoom's band mask); the thumb stays a thin square on the dark ground there, "barely noticeable", as ruled.
