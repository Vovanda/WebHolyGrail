# Player

> Russian version: [video-player.md](video-player.md).

> On the implementation see `VideoPlayer` and the two control layers next to it
> in `src/client/src/blocks/primitives/Video/`. This document is about what the
> player is and the rules it follows.

## What it is

A player for a single recording. It takes a stream address and shows the frame
with the usual controls: seeking, volume, quality and speed.

It has no control markup of its own, and it should not grow one. Seeking,
fullscreen, picture-in-picture and keyboard control were written before us and
tuned on real users; our own copy would diverge from what viewers expect within
the first month.

## Two control layers

A layer is the look of the panel; the engine underneath is one.

**media-chrome.** We assemble the panel from individual buttons: play, sound,
volume, time, progress, settings, picture-in-picture, fullscreen. The set and
the order are ours, so the look follows the site palette.

**vidstack.** The library's ready-made layout is used: it owns both the set and
the look. That is the visible difference between the layers - one is assembled,
the other is taken whole.

Which one is shown is a site setting; the address overrides it through
`?player=`, so both can be seen without switching anything for everyone else.

## What the player does by itself

The same in both layers:

**Shows a frame before the click.** The poster comes with the recording, taken
from a frame in the middle during the cut.

**Asks for keys as it goes.** The recording is encrypted in cryptoperiods, and
at every boundary the player requests the next key. It tells a rights refusal
from a failure: instead of a silent frame it shows that a code is needed.

**Keeps the shape of the recording.** Until metadata arrives the frame stands at
16:9 - otherwise the page jumps when the frame finally comes. After that the
frame takes the shape of the stream but stays under the ceiling
`--video-frame-max-h` (80vh). Once it hits the ceiling it narrows along the
recording's aspect ratio and centres itself in the place. While the place is
wider than the ceiling the frame fills it; when the ceiling is smaller the frame
narrows too: 9/16 at 1440 px wide would otherwise be 2500 px tall, and 4/3 in a
low window would leave margins on both sides.

**Remembers the place.** The position is stored in the viewer's browser and
restored on return; the start and the end are not stored, and a timecode in the
address wins over memory.

**Moves to a corner on scroll**, when asked to. A playing recording goes to the
bottom-right corner once the frame has almost left the page, and can be closed
from there. A paused one is left alone: it was paused on purpose.

**Keeps room for a layer above the frame.** What goes there is up to the caller:
a playlist puts its "up next" card in it.

## How the layers differ

The difference between the layers is the look of the panel, not the behaviour.
The frame shape, the place memory and the corner on scroll live in separate
hooks and are wired into both: the assembled panel and the one taken whole
behave the same.

The corner is not turned on by itself - the caller asks for it. On a recording
page it belongs; in a block in the middle of long text it would cover the
reading.

## Display settings

What the owner configures: the control layer (in site settings), the quality
ladder, the recording poster, subtitles and chapters. All of it lives with the
recording or with the site, not with the block that places the player.

## Marked parts

The player root is `player`, the frame is `frame`, the bottom panel is
`controls`, the centre control is `center` together with `prev` and `next`. The
placeholder in place of a closed recording is `denied`. The corner on scroll is
`mini`, its button is `mini-close`.

The internals of `media-chrome`, `hls-video` and the ready-made vidstack layout
live in a shadow tree: no marks are put there, they have their own hooks from
the library.

The layer above the frame arrives from outside already marked - the player adds
no wrapper of its own, so as not to interfere with the layout.

## Where it is used

A video block on any page, a recording page, a player inside a playlist. In all
three cases it is the same component with a different environment.

## What the player does not know

Neither playlists, nor the queue, nor what to show after the recording ends. The
layer above the frame arrives ready-made from outside - the player gives it the
place and reports when the recording ends.

It also knows nothing about access: the right is checked by the key issuing
side, and the player only shows the refusal reason in the text the owner set.
