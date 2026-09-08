# BUILD-LOG.md — Domain Map: Ankle & Sports Rehab

Build date: 2026-09-06

## Environment constraint (read this first)

This build ran inside a sandboxed session whose egress proxy enforces a strict
allowlist. Every research domain was blocked at the network layer:

| Host | Method tried | Result |
|---|---|---|
| `pubmed.ncbi.nlm.nih.gov` | curl, WebFetch | `EGRESS_BLOCKED` / CONNECT 403 |
| `eutils.ncbi.nlm.nih.gov` | curl, WebFetch | `EGRESS_BLOCKED` / CONNECT 403 |
| `www.ncbi.nlm.nih.gov` (PMC) | WebFetch | `EGRESS_BLOCKED` |
| `www.jospt.org` | WebFetch | `EGRESS_BLOCKED` |
| `pedro.org.au` | WebFetch | `EGRESS_BLOCKED` |
| `api.crossref.org` | WebFetch | `EGRESS_BLOCKED` |
| `api.openalex.org` | WebFetch | `EGRESS_BLOCKED` |
| `en.wikipedia.org` | WebFetch | `EGRESS_BLOCKED` |
| `github.com` | WebFetch | 200 OK (allowlisted) |

Only server-side web search was reachable.

## Verification tiers actually achieved

Because direct fetching was impossible, this build uses an explicitly weaker,
clearly-labelled standard. Two tiers are used and every record in `data.json`
carries its tier in the `verification` field:

- **`search-confirmed`** — a live web search returned this exact URL with a page
  title matching the expected target. The URL exists and resolves in a live index.
  This is the tier used for the overwhelming majority of entries.
- **`constructed`** — a URL built deterministically from a documented URL template
  (PubMed `[jour]` / `[au]` query syntax, PubMed `?term=` runner links). The
  template is documented PubMed syntax and the journal/author name inside it was
  search-confirmed, but the resulting query URL itself could NOT be executed from
  this session.

NOTHING in this build is tier "fetched and confirmed 200". The original spec asked
for that tier. It was not achievable. This is stated in the app UI as well, so the
file is not able to misrepresent its own provenance.

## Search log

Method: server-side web search only (the sole channel that reached the open web). A URL counts as
`search-confirmed` when a search returned that exact URL as an indexed result with a page title
matching the expected target.

### Section 1 — Journals (19 verified, 0 dropped)

| Search | Outcome |
|---|---|
| BJSM homepage (3 separate queries, incl. one restricted to `bmj.com`) | **FAILED** as indexed link; asserted in result text. Kept at `search-asserted`. See UNVERIFIED.md §2 |
| JOSPT official website | `https://www.jospt.org/` ✓ |
| Sports Medicine (Springer/Adis) | `link.springer.com/journal/40279` ✓ |
| Sports Medicine – Open | `link.springer.com/journal/40798` ✓ |
| AJSM (SAGE) | `journals.sagepub.com/home/ajs` ✓ + alerts page `/connected/AJS` ✓ |
| OJSM (SAGE) | `journals.sagepub.com/home/ojs` ✓ |
| Physical Therapy (PTJ, OUP) | `academic.oup.com/ptj` ✓ |
| Journal of Athletic Training | `meridian.allenpress.com/jat` ✓ — confirmed fully OA, no publication fees |
| Physical Therapy in Sport | `sciencedirect.com/journal/physical-therapy-in-sport` ✓ |
| Scand J Med Sci Sports | `onlinelibrary.wiley.com/journal/16000838` ✓ + `/loi/16000838` ✓ |
| Clinical Journal of Sport Medicine | `journals.lww.com/cjsportsmed/pages/default.aspx` ✓ |
| Foot & Ankle International | `journals.sagepub.com/home/fai` ✓ |
| Journal of Foot and Ankle Research | **PUBLISHER CHANGE FOUND** — now Wiley `onlinelibrary.wiley.com/journal/17571146` ✓; BMC archive still live |
| KSSTA | **PUBLISHER CHANGE FOUND** — moved to Wiley/ESSKA in 2024, `esskajournals.onlinelibrary.wiley.com/journal/14337347` ✓; Springer archive `link.springer.com/journal/167` ✓ |
| Journal of Biomechanics | `sciencedirect.com/journal/journal-of-biomechanics` ✓ |
| Clinical Biomechanics | `sciencedirect.com/journal/clinical-biomechanics` ✓ |
| Gait & Posture | `sciencedirect.com/journal/gait-and-posture` ✓ |
| Journal of Applied Biomechanics | `journals.humankinetics.com/view/journals/jab/jab-overview.xml` ✓ |
| Journal of Sport Rehabilitation | `journals.humankinetics.com/view/journals/jsr/jsr-overview.xml` ✓ |

TOC/alert URLs: only 2 of 19 confirmed. The rest omitted rather than extrapolated from the
publisher URL patterns. See UNVERIFIED.md §6.

### Section 2 — Researchers (15 shipped)

Google Scholar profile IDs confirmed as indexed links with matching page titles:

```
Hertel J        La5FP70AAAAJ      Delahunt E      t9j51zsAAAAJ
Wikstrom EA     keFbzOwAAAAJ      McKeon PO       -U2yX60AAAAJ
Hiller CE       DTlO7BgAAAAJ      Bleakley CM     F8h0e9IAAAAJ
Doherty C       iM9ug6IAAAAJ      Khan KM         A5TVjnQAAAAJ
Bahr R          y3Cj1fAAAAAJ      Silbernagel KG  G0dpYu0AAAAJ
Verhagen E      EwBrijQAAAAJ
```

Four searched, no Scholar profile surfaced → field omitted, institutional page used instead:
Gribble (UKY), Kerkhoffs (Amsterdam UMC), Thorborg (Region H / KU), Vuurberg (ResearchGate).

Landmark papers verified (title + year + journal + live link): Hertel 2002 JAT (PMC164367);
Gribble 2014 JAT selection criteria (free full text at meridian.allenpress.com);
Doherty/Delahunt 2014 Sports Med incidence & prevalence (PMID 24105612);
Wikstrom/Hubbard-Turner/McKeon 2013 Sports Med constraints-based (PMID 23580392);
Hiller 2006 CAIT (Arch Phys Med Rehabil); Delahunt 2018 ROAST (PMID 29886432);
Bleakley 2022 PLOS ONE reinjury meta-analysis; Wikstrom 2019 JAT epidemiology;
McKeon 2016 sensory-targeted rehab (PMC4833574); Kerkhoffs 2002 Cochrane CD003762;
Vuurberg 2018 Dutch guideline.

One candidate paper DROPPED: "Chronic ankle instability: evolution of the model" (PMID 21391798)
— surfaced in Hertel-context searches but authorship never confirmed. Not attributed.

### Section 3 — Guidelines (19 shipped, 8 flagged `possibly superseded`)

| Item | Outcome |
|---|---|
| IAC selection criteria 2014 | JOSPT DOI ✓, PMID 24377963 ✓, **free full text at JAT** ✓ |
| IAC 2016 consensus (prevalence/impact) | PMID 27259750 ✓ + evidence review PMID 27259753 ✓ |
| IAC ROAST 2019 | PMID 29886432 ✓, DOI 10.1136/bjsports-2017-098885 |
| PAASS return-to-sport framework 2021 | ✓ BJSM 55(22):1270-6, DOI 10.1136/bjsports-2021-104087 |
| Ankle-GO score 2024 | ✓ Sports Health + PMC10920508 |
| **JOSPT Lateral Ankle Ligament Sprains Revision 2021** | DOI ✓, PMID 33789434 ✓, **free PDF at orthopt.org** ✓ |
| **JOSPT Achilles Tendinopathy** | **CURRENCY FINDING: 2024 revision found, supersedes the widely-cited 2018 version.** Both shipped; 2018 flagged superseded |
| JOSPT Heel Pain – Plantar Fasciitis Revision 2023 | DOI ✓, **free PDF at orthopt.org** ✓ |
| Dutch multidisciplinary guideline (Vuurberg 2018) | ✓ BJSM 52(15), DOI 10.1136/bjsports-2017-098106 |
| KNGF acute ankle sprain | English PDF + flowchart ✓ — but **2006**, flagged, newer version NOT ESTABLISHED |
| Bern RTS consensus 2016 | ✓ free PDF hosted by IFSPT |
| Cochrane: CD003762, CD000018, CD001250 | all ✓ on cochranelibrary.com; all old, all flagged |
| Cochrane CD009512 (Janssen 2011) | **DROPPED** — only a locale-specific `/references/es` URL surfaced |
| IAC prevention / prognosis statement | **SEARCHED, NOT FOUND.** Only 2014/2016/2019 statements located |
| CPG-quality systematic review (BMC 2019) | ✓ added — appraises the ankle guidelines themselves |
| IAC homepage + publications page | ✓ both |

### Section 4 — Databases and tools (36 shipped)

All confirmed as indexed links: PubMed, PMC, Clinical Queries (`/clinical/`), My NCBI help
(NBK53592), NLM MeSH home + MeSH Browser, PEDro + Advanced Search, Cochrane Library,
Epistemonikos, Google Scholar, Semantic Scholar, OpenAlex, Unpaywall, PROSPERO,
ClinicalTrials.gov, SportRxiv, medRxiv, Trip, Connected Papers, ResearchRabbit, Elicit,
Consensus, scite, NotebookLM.

Appraisal instruments — linked to the actual instrument, not commentary: PEDro scale (page + PDF
+ training), Cochrane RoB 2, AMSTAR-2 (OA instrument paper), ROBIS (Bristol tool page + guidance
PDF), QUADAS-2 (Ann Intern Med paper + Bristol project), QUIPS (Hayden 2013 Ann Intern Med),
GRADE Handbook, CASP checklists, CONSORT 2010 (OA PLOS Med version), PRISMA 2020 (EQUATOR),
STROBE (EQUATOR), EQUATOR index.

Currency findings recorded on the cards: **QUADAS-3 has been released** and is the current
recommended version; **NotebookLM has been renamed Gemini Notebook**; **Unpaywall now sits under
the OpenAlex/OurResearch brand**; **Connected Papers has introduced a monthly search cap**.

### Section 5 — Search strings (10 built, 0 validated)

`eutils.ncbi.nlm.nih.gov` blocked. **No string executed, no hit count obtained, none invented.**
All 10 ship with `hitCount: null`, a `hit count not validated` badge and a `constructed` tier.
See UNVERIFIED.md §1.

### Section 6 — Question routing (8 rows)

Authored from the source research-system document plus the appraisal tools verified in Section 4.
No external links, so no verification applicable.

---

## Build and test

`data.json` assembled programmatically (19 journals / 15 researchers / 19 guidelines / 36 tools /
10 strings / 8 routing rows / 12 checklist items), then inlined into `domain-map.html`.

Tested in headless Chromium against `file:///` with **all non-`file://` requests aborted at the
route level**:

```
externalRequests            []          (zero network requests)
jsErrors                    []
cards rendered              19 / 15 / 19 / 36 / 10  + 8 routing rows + 12 checklist items
default collapse            researchers 0 open, guidelines 0 open, journals + strings expanded
anchors with target=_blank  50 / 50
anchors with rel=noopener   50 / 50
global search "achilles"    filters live across all sections simultaneously
no-match state              empty-state message in all 5 sections
Escape                      clears query and tags
"/"                         focuses the search box
tag chips                   multi-select AND-filtering; clear-all restores
copy button                 clipboard content verified === the search string; label -> "✓ Copied"
localStorage                query, open cards and checklist ticks all survive a reload
mobile 390px                scrollWidth 390, no horizontal overflow
```

---

# 2026-09-08 — restructured from directory to router

## What changed and why

The first build answered "what are the sources in this field". The brief was then corrected: the
product should be the **decision chain**, not the source list —

```
MY SPECIFIC QUESTION
        ↓
What KIND of knowledge would answer this?
        ↓
Where does that kind of knowledge usually live?
        ↓
What terminology does the literature use?
        ↓
What exact search route should I take?
```

The journals, researchers, guidelines and tools verified in the first build are unchanged. They
are now **the substrate the router points into**, demoted below the router in the page and
reachable from within each knowledge kind, rather than being the front door.

## Layers added

**1. Knowledge kinds (9).** background, intervention, diagnosis, prognosis, mechanism,
epidemiology, qualitative, **measurement**, practice. Measurement is not in the routing table
from the source document and was added because "is the CAIT reliable / what is the MCID" is a
distinct question type that physiotherapy asks constantly and that no other row answers.

Each kind carries: "sounds like" trigger phrases, question shape (PICO / PEO / neither), designs
that CAN answer it, **designs that CANNOT and why**, the journals and people who hold it, the
guidelines to read first, the database order, the appraisal instrument, red flags, a tiered search
ladder with time budgets, and a stop rule.

The "cannot answer" column is the load-bearing part. Most wasted searching is a design mismatch —
looking for an RCT to answer a mechanism question.

**2. Vocabulary bank (16 concepts, 217 terms, 36 MeSH headings, 35 traps).** The layer that was
entirely missing from v1 and the direct answer to "what terminology does the literature use".
Each concept expands into clinical terms, abbreviations, lay terms, spelling variants, obsolete
terminology, MeSH headings, a MeSH note, and the traps that silently destroy recall.

Content that a source list cannot give you, and the reason this layer exists:

- **No MeSH heading exists for chronic ankle instability.** Searching it as a MeSH concept returns
  nothing. Recorded on the concept, and the reason every CAI block leans on `[tiab]`.
- **`FAI` collides** — functional ankle instability here, femoroacetabular impingement everywhere
  else. The block builder programmatically excludes collision-flagged abbreviations, verified in
  the test suite.
- **`OCD` collides** with obsessive-compulsive disorder.
- **"supination trauma"** — the Dutch/Belgian term. Omit it and you lose the literature behind the
  KNGF and Vuurberg guidelines.
- **"Achilles tendinitis" must be searched on purpose** even though the inflammatory model was
  abandoned, because twenty-plus years of trials are filed under it.
- **`programme` / `program`**, `kinaesthesia` / `kinesthesia`, `centre` / `center of pressure`,
  and `reinjur*` not matching `"re-injury"`.
- **`"Postural Balance"[mh]`, not `Balance`.** **`"Kinesthesis"[mh]`**, neither free-text spelling.
- **`coper`** — a coined research term you would never guess, and the key to the comparative CAI
  literature.
- **Syndesmotic injury actively excluded** from lateral-sprain routes, because the return-to-sport
  timeline is roughly double.

**3. Design filters (10) and a live string composer.** Concepts AND concepts AND filter, assembled
in the browser. This replaces the fixed set of 10 strings with the ability to build a string for
any question in the domain. The 10 original strings survive as **worked routes** that load back
into the router.

The composer warns when a chosen concept block already carries the design vocabulary of the
chosen filter (biomechanics concept + mechanism filter, for example) and tells you to drop the
filter first if you land under 20 hits.

## Verification status of the new layers

The new layers contain **no URLs**, so link verification does not apply to them. They assert
domain knowledge instead. This is a different class of claim and it is documented in
**UNVERIFIED.md §11 and §12** — in particular that **all 36 MeSH headings are asserted, not
checked against the MeSH Browser**, which is blocked. Every concept block is deliberately built so
its `[tiab]` terms alone still function, making a wrong MeSH heading a recall risk rather than a
correctness risk.

`eutils.ncbi.nlm.nih.gov` was re-tested on 2026-09-08 and is **still blocked**. Hit counts remain
`null`. No numbers were invented.

## Build and test

`data.json` is assembled by script with a **cross-reference integrity check** — every journal,
researcher, guideline, tool, concept, kind and filter id referenced by a knowledge kind or a route
must resolve, or the build fails. It passes.

Headless Chromium, `file:///`, all non-`file://` requests aborted at the route level:

```
externalRequests                    []        (zero network requests)
jsErrors                            []
chain steps / router steps          5 / 5
knowledge kinds / concepts          9 / 16
kind selection                      auto-selects that kind's default design filter
concept ordering                    concepts matching the chosen kind are listed first
composed string                     contains both concept blocks + the design filter
FAI collision                       correctly absent from the CAI block
obsolete terms                      present (proprioceptive rehabilitation, Achilles tendinitis)
redundancy warning                  fires on biomech+mech, clears on filter change
worked-route fidelity               r1 r2 r6 r7 r9 r10 -> loaded router string is an EXACT match
carried NOT clause                  survives load, and its remove button works
picking a kind                      resets clauses carried in from a route
copy button                         clipboard verified === composed string
global search                       "supination" hits the vocabulary layer and nothing else
localStorage                        question, kind, concepts, filter, ticks all survive reload
links                               33/33 target=_blank + rel=noopener
mobile 390px                        scrollWidth 390, no horizontal overflow
```

Two defects were found by the test suite during this build and fixed:

1. **Worked routes with extra or NOT clauses lost them when loaded into the router**, so the
   router produced a different string from the one displayed on the route card. Router state now
   carries both clauses; fidelity is asserted as an exact-match test across all six affected
   routes.
2. **The clause remove buttons never fired** — the handlers existed but the ids were missing from
   the delegated-click selector, so `closest()` returned null. Caught because the fidelity test
   checked the removal actually changed the string rather than just that the button existed.
