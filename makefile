check: document
	R -e "devtools::check()"

document:
	R -e "devtools::document()"
