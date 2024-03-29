<!-- badges: start -->
<!-- badges: end -->

# clinical.timelines

Create [clinical-timelines](https://github.com/RhoInc/clinical-timelines) in R.

## Example

This is a basic example which shows you how to solve a common problem:

``` r
library(clinical.timelines)

data <- read.csv("https://raw.githubusercontent.com/RhoInc/data-library/master/data/clinical-trials/renderer-specific/adtimelines.csv")

clinical_timeline(data)

# groupings
data |> 
  clinical_timeline(data) |> 
  clinical_settings(
    groupings = list("ARM", "SITEID"), 
    grouping_initial = "ARM"
  ) 

# time_scale
data |> 
  clinical_timeline(data) |> 
  clinical_settings(
    time_scale = "day"
  ) 
```

