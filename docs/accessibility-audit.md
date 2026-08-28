# Accessibility audit

## Baseline pass

The initial rendered-page audit covers the homepage, Explore, Golden Gate Park,
Programs and reservations, and About the data. Interactive checks also cover
the Explore map and the two-image Alamo Square gallery.

The sampled pages have:

- one main landmark and one first-level heading;
- no duplicate IDs or skipped heading levels;
- accessible names for visible links, controls, selects, map controls, and
  embedded frames;
- alternative text for every rendered image;
- polite announcements for changing result and gallery counts; and
- no horizontal page overflow at the 320 CSS pixel target.

## Corrections made

- Reduced the internal layout floor slightly so desktop scrollbar width does
  not create horizontal overflow during a 320 CSS pixel reflow test.
- Added a dark inner edge to the yellow focus treatment so focus remains
  distinguishable against both pale and dark surfaces.
- Removed a redundant region role around the MapLibre canvas. The map retains
  its own named region, while the complete text result list remains the primary
  accessible browsing surface.
- Added source-level regression checks for the shared language declaration,
  landmarks, skip link and target, focus treatment, and layout floor.
- Added WCAG AA regression checks for the core text palette.

## Task-flow checks completed

- Opened the shared search, submitted a query, and confirmed the result count is
  announced through the polite live region.
- Opened the mobile filter disclosure, selected an activity, applied it, and
  confirmed the URL, count, and match explanation update together.
- Opened a destination from filtered results and confirmed that Back to results
  restores focus to the originating destination link.
- Changed the transit selector to BART and confirmed that its associated station
  and Muni connection content replaces the Muni-first view.
- Advanced the Alamo Square gallery and confirmed that its live region and slide
  position both update to image 2 of 2 while focus remains on the control.

## Remaining manual checks

- Repeat the representative task flows with hands-on keyboard-only and
  screen-reader sessions; browser automation does not substitute for these.
- Test representative pages with NVDA and VoiceOver, including announcements
  after client-side navigation.
- Verify browser zoom and text-only resizing through 200 percent.
- Review contrast for imagery overlays and every interactive state with a
  dedicated contrast tool.
- Confirm touch-target comfort and orientation changes on physical phones.
