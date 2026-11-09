# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Purpose and Users

A Spanish-language songwriting inspiration tool for people writing songs, rap bars, and other lyrics. Its core mechanism is showing two or three randomly combined words with imagery, drawn from many unrelated subjects.

## Confirmed Requirements

- At least 100 prompts per category: the catalog contains 1,200 unique entries across 12 themes, including artists, jewelry/materials, moments, iconic couples, celebrities, movie references, actors, and superheroes.
- Exactly two or three selected prompt words visible in the studio at once.
- Images alongside the selected prompts.

## Implementation Assumptions

These are implementation choices inferred from the open brief, not separately approved user preferences: the name “Entre líneas,” a local static application, category-based ambient photography rather than exact subject portraits, filters, word locks, saved ideas, and a notebook persisted in this browser. No account, backend, deployment, payment, or music playback is included.

## Stack

Delegated implementation choice: native HTML, CSS, and JavaScript ES modules, with Node's built-in test runner and a dependency-free local server/build script.

## Product Principles

- Connections are prompts, not automatically written lyrics.
- Keep the generated set small while the underlying vocabulary stays broad.
- Clearly distinguish atmospheric imagery from portraits and official film stills.
- Keep personal notes in the visitor's browser; do not send them to a service.
