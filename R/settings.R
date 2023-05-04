#' Settings
#' 
#' Pass settings.
#' @param timeline An object of class `clinical_timeline` 
#'  as returned by [clinical_timeline()].
#' @param ... Settings, see 
#'  [official documentation](https://github.com/RhoInc/clinical-timelines/wiki/Configuration)
#' 
#' @export
clinical_settings <- function(timeline, ...) {
  timeline$x$settings <- list(...)
  timeline
}
