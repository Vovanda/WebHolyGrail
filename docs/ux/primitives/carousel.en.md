# Carousel

> Russian version: [carousel.md](carousel.md).

> On the implementation see `CarouselDeck` in
> `src/client/src/blocks/arrangements/Carousel/`. This document is about what the
> carousel is and the rules it follows.

## What it is

A set shown as a strip: one or two items visible, the rest reached by paging.
Banners, gallery photographs, testimonials, service cards in a narrow place - anything
that does not fit in rows and does not deserve a page of its own.

It differs from a tile grid in that it does not divide the area between all items at
once but shows a window into the set. So the choice between them is not a matter of
taste but of how many items a person must see at the same time: the grid answers "all",
the carousel answers "one and a hint of the neighbours".

## Two ways of showing

**As a frame.** One item across the full width, the neighbours beyond the edge. This is
how banners and photographs are shown, where the picture itself matters.

**As a strip.** Several items in a row, the edge of the next one visible to hint that
the set continues. This is how cards are shown: without that edge a person does not
guess that there is more to page through.

## What the carousel does by itself

**Shows that the set continues.** The edge of the neighbouring item stays visible - the
only honest sign that there is somewhere to page. The dots under the strip show how many
there are and where we are now; the arrows page with the pointer.

**Draws the controls on request and only when there is something to page.** The arrows
appear when the caller passes `arrows`, the dots when it passes `dots`; in frame mode
the dots are not drawn at all. A set that fits entirely stays without controls: there is
nothing to page in it, and buttons on a motionless strip only confuse.

**The arrows are visible at every width.** On a phone the gesture always works, but
without the buttons it is not visible that the strip pages at all, so they are not
hidden. Where an arrow would cover the frame, it is placed above it
(`controls="overlay"`): smaller, semi-transparent, revealed under the pointer.

**Stops under the pointer.** A person has moved the cursor over it - which means they are
looking closely, and a card sliding out from under it is annoying. A showcase that moves
in the background and offers nothing to choose does not need the stop - it can be turned
off there.

## Display settings

| What                   | Why                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------- |
| way of showing         | as a frame or as a strip                                                            |
| arrows, dots           | on request of the caller; placed beyond the edge or over the frame                  |
| looping                | after the last one comes the first again                                            |
| pause between frames   | without it paging is by hand only                                                   |
| continuous movement    | the strip drifts past the eyes instead of snapping; with its own speed              |
| stop under the pointer | on by default                                                                       |
| gap, strip height      | the height is needed when cards differ in length and the strip would jump otherwise |
| frame change           | by shift or by fade: a fade suits a single frame                                    |

## Marked parts

A block's own style reaches the internals without touching code: `carousel`,
`carousel-viewport`, `carousel-track`, `carousel-item`, `carousel-arrow`,
`carousel-dots`, `carousel-dot`.

## Where it is used

Banners on landing pages, photo galleries, testimonials, rows of cards in narrow places -
seventeen places in the template on the day of writing.

## What the carousel does not know

Neither the subject nor what is inside an item: it sees the length of the set and the
place of each item, and the item is drawn by whoever places the carousel. That is why the
same carousel takes photographs, service cards and testimonials alike.

It does not write its own paging: that is already here, and a rewritten one would diverge
from the common behaviour within the first month.
