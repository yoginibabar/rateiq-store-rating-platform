# Rating Confidence

Confidence increases with rating volume using `100 × (1 - e^(-count/20))` and is capped at 100. This keeps a 5.0 from being treated as highly reliable when it is based on only a few ratings.
