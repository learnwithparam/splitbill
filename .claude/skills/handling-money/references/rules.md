# Money rules: the remainder rule and formatting

## The remainder rule

To split `totalCents` evenly among `n` members without losing cents:

```
base = floor(totalCents / n)
remainder = totalCents - base * n     // 0 <= remainder < n
```

The first `remainder` members (in a stable, deterministic order - e.g. the
order they're passed in) get `base + 1` cents; everyone else gets `base`
cents. The shares always sum to exactly `totalCents`.

### Worked example

`splitCents(1000, ["a", "b", "c"])`:

```
base = floor(1000 / 3) = 333
remainder = 1000 - 333*3 = 1
```

`a` gets `334`, `b` and `c` get `333` each. Sum: `334 + 333 + 333 = 1000`.

Flooring every share instead (`333, 333, 333`) sums to `999` and silently
loses a cent - this is the bug tracked as issue #2.

## Formatting convention

- Integer cents -> display string: divide by 100, pad the fractional part
  to 2 digits (`1005` -> `"10.05"`, `5` -> `"0.05"`).
- Display string -> integer cents: parse the string, multiply the whole
  part by 100, add the (padded) fractional part as an integer. Never
  `parseFloat` and multiply by 100 - floating point rounding can land on
  `999.9999999` instead of `1000`.
- CSV and CLI output must use the formatted string, not raw cents - see
  issue #3 for what happens when a formatting step is skipped.
