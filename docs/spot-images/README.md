# Glazewave spot imagery — attribution and provenance

Generated 2026-09-07T23:06:29.975Z by `backend/app/scripts/harvest_spot_images.js`.

**4039 images across 1427 of 1611 spots.** Files live under `backend/data/spot-images/<region>/`, named `<region>-<spot-slug>-<rank>.<ext>`, ranked 1 = best match. The machine-readable version of everything here is `backend/data/spot_images.json`; `backend/data/spot_images.csv` is the same thing flattened one row per image.

## What has to be credited

Two separate obligations, and they are not the same one.

**The spot data itself** — names, coordinates, beach type, lifeguard and access flags — is OpenStreetMap under ODbL 1.0. Any page showing it owes:

> © OpenStreetMap contributors

**Each image** carries its own credit, precomposed as `attribution_line` in the manifest. Do not roll them into one site-wide notice; the licence asks for the credit where the work appears.

## The rules that actually bite

- **CC BY / CC BY-SA** — the credit has to be visible where the image is, not buried on a colophon page.
- **CC BY-SA is copyleft.** Displaying one as-is is fine. Compositing it into an OG card, a share image or any generated graphic makes that output CC BY-SA too. 2093 of the 4039 images are share-alike — filter on `share_alike: false` before you composite anything.
- **CC0 and public domain carry no obligation.** The credit lines are recorded anyway so provenance survives a later question.
- **Wikimedia asks you not to hotlink** `upload.wikimedia.org` from production. These files are local copies for exactly that reason; serve them from S3.

## Licence mix

| Licence | Images | Attribution | Share-alike |
| --- | ---: | --- | --- |
| CC BY-SA 4.0 | 961 | required | yes |
| CC BY 2.0 | 732 | required | no |
| CC BY-SA 3.0 | 685 | required | yes |
| Public domain | 457 | not required | no |
| CC BY-SA 2.0 | 442 | required | yes |
| CC BY 3.0 | 407 | required | no |
| CC0 | 191 | not required | no |
| CC BY 4.0 | 123 | required | no |
| CC BY 3.0 us | 19 | required | no |
| CC BY 2.5 | 13 | required | no |
| CC BY-SA 2.5 | 4 | required | yes |
| CC BY 3.0 pl | 3 | required | no |
| CC BY 3.0 cl | 1 | required | no |
| CC BY-SA 3.0 de | 1 | required | yes |

## What the images are actually pictures of

Every distinct file was reviewed by eye. Relevance scoring reads filenames and Commons categories, and text cannot tell a photograph of a beach from a photograph of a lizard standing on one — so this column, not the score, is what says whether an image is usable.

| Subject | All images | As a spot's rank 1 | Meaning |
| --- | ---: | ---: | --- |
| coastal | 2463 | 1188 | the coast is the subject — usable |
| context | 699 | 134 | coastal setting, other subject — judgement |
| not | 877 | 105 | no coastal subject — do not publish |

Images are ordered by subject first and relevance score second, so rank 1 is the best available photo of the coast for that spot. A spot whose rank 1 is `not` has no coastal image among its candidates at all.

## Coverage by region

| Region | Spots | With images | Images | Attribution file |
| --- | ---: | ---: | ---: | --- |
| MX-BC — Mexico, Baja California | 16 | 8 | 17 | [`mx-bc.md`](./mx-bc.md) |
| MX-BCS — Mexico, Baja California Sur | 46 | 31 | 87 | [`mx-bcs.md`](./mx-bcs.md) |
| MX-CAM — Mexico, Campeche | 8 | 2 | 3 | [`mx-cam.md`](./mx-cam.md) |
| MX-COL — Mexico, Colima | 20 | 8 | 19 | [`mx-col.md`](./mx-col.md) |
| MX-GRO — Mexico, Guerrero | 13 | 9 | 26 | [`mx-gro.md`](./mx-gro.md) |
| MX-JAL — Mexico, Jalisco | 3 | 1 | 1 | [`mx-jal.md`](./mx-jal.md) |
| MX-MIC — Mexico, Michoacan | 4 | 2 | 4 | [`mx-mic.md`](./mx-mic.md) |
| MX-NAY — Mexico, Nayarit | 29 | 18 | 48 | [`mx-nay.md`](./mx-nay.md) |
| MX-OAX — Mexico, Oaxaca | 18 | 6 | 14 | [`mx-oax.md`](./mx-oax.md) |
| MX-ROO — Mexico, Quintana Roo | 39 | 34 | 89 | [`mx-roo.md`](./mx-roo.md) |
| MX-SIN — Mexico, Sinaloa | 11 | 8 | 23 | [`mx-sin.md`](./mx-sin.md) |
| MX-SON — Mexico, Sonora | 12 | 10 | 24 | [`mx-son.md`](./mx-son.md) |
| MX-TAB — Mexico, Tabasco | 2 | 2 | 6 | [`mx-tab.md`](./mx-tab.md) |
| MX-TAM — Mexico, Tamaulipas | 6 | 2 | 5 | [`mx-tam.md`](./mx-tam.md) |
| MX-VER — Mexico, Veracruz | 26 | 18 | 46 | [`mx-ver.md`](./mx-ver.md) |
| MX-YUC — Mexico, Yucatan | 1 | 0 | 0 | — |
| US-AK — United States, Alaska | 25 | 18 | 48 | [`us-ak.md`](./us-ak.md) |
| US-AL — United States, Alabama | 14 | 14 | 34 | [`us-al.md`](./us-al.md) |
| US-CA — United States, California | 419 | 410 | 1198 | [`us-ca.md`](./us-ca.md) |
| US-CT — United States, Connecticut | 8 | 7 | 11 | [`us-ct.md`](./us-ct.md) |
| US-DE — United States, Delaware | 2 | 2 | 6 | [`us-de.md`](./us-de.md) |
| US-FL — United States, Florida | 167 | 155 | 447 | [`us-fl.md`](./us-fl.md) |
| US-GA — United States, Georgia | 19 | 19 | 56 | [`us-ga.md`](./us-ga.md) |
| US-HI — United States, Hawaii | 210 | 184 | 533 | [`us-hi.md`](./us-hi.md) |
| US-LA — United States, Louisiana | 5 | 3 | 9 | [`us-la.md`](./us-la.md) |
| US-MA — United States, Massachusetts | 84 | 78 | 219 | [`us-ma.md`](./us-ma.md) |
| US-MD — United States, Maryland | 1 | 1 | 3 | [`us-md.md`](./us-md.md) |
| US-ME — United States, Maine | 52 | 51 | 147 | [`us-me.md`](./us-me.md) |
| US-NC — United States, North Carolina | 27 | 25 | 72 | [`us-nc.md`](./us-nc.md) |
| US-NH — United States, New Hampshire | 14 | 14 | 41 | [`us-nh.md`](./us-nh.md) |
| US-NJ — United States, New Jersey | 30 | 29 | 82 | [`us-nj.md`](./us-nj.md) |
| US-NY — United States, New York | 43 | 40 | 109 | [`us-ny.md`](./us-ny.md) |
| US-OR — United States, Oregon | 67 | 65 | 190 | [`us-or.md`](./us-or.md) |
| US-RI — United States, Rhode Island | 49 | 46 | 132 | [`us-ri.md`](./us-ri.md) |
| US-SC — United States, South Carolina | 55 | 49 | 137 | [`us-sc.md`](./us-sc.md) |
| US-TX — United States, Texas | 32 | 29 | 77 | [`us-tx.md`](./us-tx.md) |
| US-VA — United States, Virginia | 11 | 7 | 14 | [`us-va.md`](./us-va.md) |
| US-WA — United States, Washington | 23 | 22 | 62 | [`us-wa.md`](./us-wa.md) |

## Spots with no image

184 spots found nothing above the relevance floor. That is the honest result, not a bug: Commons simply has no freely licensed photo of them. They are in the manifest with `coverage: "none"` and an empty `images` array, so the frontend can fall back to a regional shot rather than a broken card.
