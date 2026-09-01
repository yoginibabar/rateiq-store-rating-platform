# Activity Anomaly Detection

RateIQ counts ratings per day for the previous 30 days. It calculates the baseline mean and standard deviation, then flags a day as unusual when the activity is at least 2 standard deviations above normal or at least four times the baseline (with a minimum of five ratings). This identifies unusual activity; it does not claim to prove fake reviews.
