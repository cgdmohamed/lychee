# Menu categories redesign

_Started 2026-08-29 13:14 UTC_

---

## User

make menu categories circler and supports image or icon instead of current

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: dc_js_str_replace]_

Now the standalone HTML export needs the same update to stay in sync.

_[tool: read_file]_

_[tool: ready_for_verification]_

Category nav is now circular image/icon slots with active-state ring, label below each.

## User

make product image more larger

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Product images enlarged to 96×96px.

## User

remove build your salad

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Removed the "build your own salad" item and its header CTA.

## User

the menu categories needs more spacing on scroll because it sticky

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Increased sticky category bar padding (20px top, 22px bottom) for more breathing room.

## User

the header overlays on cat items

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Fixed the sticky offset (54px → 69px) to match actual header height, so it no longer overlaps the category row.

