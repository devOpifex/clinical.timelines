#' Clinical Timeline
#'
#' Create a clinical timeline.
#'
#' @param data Dataset to visualise.
#' @param width,height Dimensions.
#' @param elementId HTML ID to use.
#'
#' @import htmlwidgets
#'
#' @export
clinical_timeline <- function(data, width = NULL, height = NULL, elementId = NULL) {

  x = list(
    data = data,
    settings = list()
  )

  attr(x, 'TOJSON_ARGS') <- list(dataframe = "rows")

  # create widget
  htmlwidgets::createWidget(
    name = 'clinical_timeline',
    x,
    width = width,
    height = height,
    package = 'clinical.timelines',
    elementId = elementId
  )
}

#' Shiny bindings for clinical_timeline
#'
#' Output and render functions for using clinical_timeline within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a clinical_timeline
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name clinical_timeline-shiny
#'
#' @export
clinical_timelineOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'clinical_timeline', width, height, package = 'clinical.timelines')
}

#' @rdname clinical_timeline-shiny
#' @export
renderClinical_timeline <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, clinical_timelineOutput, env, quoted = TRUE)
}
