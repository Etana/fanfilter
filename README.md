# usage:

## `needle`

only show result containing `needle`

## `-needle`

only show result not containing `needle` (has priority over positive query terms)

## `"needle in haystack"`

search `needle in haystack`, allow to search terms containg whitespace or other search operator (-/:) without conflict

## `criteria:term`

search term on a given criteria, possible criteria are:

- `c`: see `char`
- `char`: this character is in the story
- `f`: see `fandom`
- `fandom`: the particular show, movie, book, or other thing the fanfiction is about.
- `fav`: number of favorites the story has received
- `favs`: see `fav`
- `follow`: number of user following the story
- `follows`: see `follow`
- `genre`: genre of the story, can be `adventure`, `angst`, `crime`, `drama`, …
- `is`: search characteristic of story, current possibilities: `crossover`, `complete`, `ongoing`
- `lang`: language of the story (eg. lang:english)
- `p`: see `published`
- `pair`: this pairing is in the story, each searched character of a pairing must be separated by a / character
- `published`: time when first published
- `r`: see `rated`
- `rated`: the rating of the story, can be `k`, `k+`, `t`, `m`
- `review`: number of review the story has received
- `reviews`: see `review`
- `u`: see `updated`
- `updated`: time when last updated
- `w`: see `words`
- `words`: number of words in the story

## `:>quantified` and `:<quantified`

for some criterias (`fav`, `follow`, `published`, `review`, `updated`, `words`) the term can be quantified more specifically, for example:

- `updated:<3month` will search stories updated since 3 months ago
- `fav:>4000` will search stories with more than 4000 favorites
- `words:>4242 words:<8585` will search for stories between 4243 and 8584 words

for date type (published and updated), a quantifier can be used at the end:

- `y`, `year`, `years`: will be a number of year
- `m`, `month`, `months`: will be a number of month
- `w`, `week`, `weeks`: will be a number of week
- `d`, `day`, `days`: will be a number of day

with only a number, the default meaning is a number of days (eg. p:>200days is the same that p:>200)
