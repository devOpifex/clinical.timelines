(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? (module.exports = factory(require('d3'), require('webcharts')))
        : typeof define === 'function' && define.amd
          ? define(['d3', 'webcharts'], factory)
          : (global.clinicalTimelines = factory(global.d3, global.webCharts));
})(this, function(d3, webcharts) {
    'use strict';

    Number.isInteger =
        Number.isInteger ||
        function(value) {
            return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
        };

    /*------------------------------------------------------------------------------------------------\
      Add assign method to Object if nonexistent.
    \------------------------------------------------------------------------------------------------*/

    if (typeof Object.assign != 'function') {
        (function() {
            Object.assign = function(target) {
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }

                var output = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source !== undefined && source !== null) {
                        for (var nextKey in source) {
                            if (source.hasOwnProperty(nextKey)) {
                                output[nextKey] = source[nextKey];
                            }
                        }
                    }
                }
                return output;
            };
        })();
    }

    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, 'find', {
            value: function value(predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
                    // d. If testResult is true, return kValue.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return kValue;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return undefined.
                return undefined;
            }
        });
    }

    if (!Array.prototype.findIndex) {
        Object.defineProperty(Array.prototype, 'findIndex', {
            value: function value(predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
                    // d. If testResult is true, return k.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return k;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return -1.
                return -1;
            }
        });
    }

    var _typeof =
        typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
            ? function(obj) {
                  return typeof obj;
              }
            : function(obj) {
                  return obj &&
                      typeof Symbol === 'function' &&
                      obj.constructor === Symbol &&
                      obj !== Symbol.prototype
                      ? 'symbol'
                      : typeof obj;
              };

    /*------------------------------------------------------------------------------------------------\
      Clone a variable (http://stackoverflow.com/a/728694).
    \------------------------------------------------------------------------------------------------*/

    function clone(obj) {
        var copy;

        //Handle the 3 simple types, and null or undefined
        if (null == obj || 'object' != (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)))
            return obj;

        //Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        //Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        //Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    var rendererSpecificSettings = {
        //ID settings
        id_col: 'USUBJID',
        id_unit: 'participant',
        id_characteristics: null,

        //Event settings
        event_col: 'DOMAIN',
        event_types: null,
        event_highlighted: null,
        event_highlight_color: 'black',
        event_symbols: null,

        //Filter settings
        filters: null,

        //Grouping settings
        groupings: null,
        grouping_initial: null,
        grouping_direction: 'horizontal',

        //Timing settings
        time_scale: 'Date',

        //Date settings
        stdt_col: 'STDT',
        endt_col: 'ENDT',
        date_range: null,
        date_ranges: null,
        date_format: '%Y-%m-%d',
        date_display_format: '%b %y', // sync in syncSettings()

        //Day settings
        stdy_col: 'STDY',
        endy_col: 'ENDY',
        day_range: null,
        day_ranges: null,

        //Miscellaneous settings
        seq_col: 'SEQ',
        ongo_col: 'ONGO',
        ongo_val: 'Y',
        tooltip_col: 'TOOLTIP',
        offset_col: null,
        reference_lines: null,
        mark_thickness: 6,
        transpose_data: false,

        //Listing settings
        details: null,
        details_config: null
    };

    var webchartsSettings = {
        x: {
            type: null, // set in syncSettings()
            column: 'wc_value',
            label: null, // set in syncSettings()
            format: null // set in syncSettings()
        },
        y: {
            type: 'ordinal',
            column: null, // set in syncSettings()
            label: null, // set in syncSettings()
            sort: 'By Earliest Event',
            behavior: 'flex',
            grouping: null // set in syncSettings()
        },
        marks: [
            {
                type: 'line',
                per: null, // set in syncSettings()
                tooltip: null, // set in syncSettings()
                attributes: {
                    'stroke-width': null // set in syncSettings()
                }
            },
            {
                type: 'circle',
                per: null, // set in syncSettings()
                tooltip: null, // set in syncSettings()
                radius: null, // set in syncSettings()
                attributes: {
                    'stroke-width': null // set in syncSettings()
                }
            }
        ],
        colors: [
            '#1b9e77',
            '#d95f02',
            '#7570b3',
            '#a6cee3',
            '#1f78b4',
            '#b2df8a',
            '#66c2a5',
            '#fc8d62',
            '#8da0cb'
        ],
        color_dom: null, // set in syncSettings()
        legend: {
            location: 'top',
            label: 'Event Type',
            order: null, // set in syncSettings()
            mark: 'circle'
        },
        range_band: 35,
        margin: {
            top: 60,
            right: 40
        }, // for second x-axis
        resizable: false // can't be resizable so the multiples aren't overlapped by their titles
    };

    var settings = Object.assign({}, rendererSpecificSettings, webchartsSettings);

    function arrayOfVariablesCheck(defaultVariables, userDefinedVariables) {
        var validSetting =
            userDefinedVariables instanceof Array && userDefinedVariables.length
                ? d3
                      .merge([
                          defaultVariables,
                          userDefinedVariables.filter(function(item) {
                              return (
                                  !(
                                      item instanceof Object &&
                                      item.hasOwnProperty('value_col') === false
                                  ) &&
                                  defaultVariables
                                      .map(function(d) {
                                          return d.value_col;
                                      })
                                      .indexOf(item.value_col || item) === -1
                              );
                          })
                      ])
                      .map(function(item) {
                          var itemObject =
                              item instanceof Object
                                  ? Object.assign({}, item)
                                  : { value_col: item };

                          itemObject.label = itemObject.label || itemObject.value_col;

                          return itemObject;
                      })
                : defaultVariables;

        return validSetting;
    }

    function syncRendererSpecificSettings(settings) {
        /**-------------------------------------------------------------------------------------------\
          ID settings
        \-------------------------------------------------------------------------------------------**/

        //id_unit
        settings.id_unit = settings.id_unit.replace(/^\s+|\s+$/g, ''); // remove leading and trailing white space
        settings.id_unitPropCased =
            settings.id_unit.substring(0, 1).toUpperCase() +
            settings.id_unit.substring(1).toLowerCase();
        settings.id_unitPlural = /y$/.test(settings.id_unit)
            ? settings.id_unit.substring(0, settings.id_unit.length - 1) + 'ies'
            : settings.id_unit + 's';

        //id_characteristics
        var defaultID_characteristics = [
            { value_col: settings.id_col, label: settings.id_unitPropCased }
        ];
        settings.id_characteristics = arrayOfVariablesCheck(
            defaultID_characteristics,
            settings.id_characteristics
        );

        /**-------------------------------------------------------------------------------------------\
          Event settings
        \-------------------------------------------------------------------------------------------**/

        //event_types
        if (!(settings.event_types instanceof Array && settings.event_types.length))
            delete settings.event_types;

        //event_symbols
        if (settings.event_symbols instanceof Array)
            settings.event_symbols = settings.event_symbols.filter(function(event_symbol) {
                return ['square', 'diamond', 'triangle'].indexOf(event_symbol.symbol) > -1;
            });
        if (!(settings.event_symbols instanceof Array && settings.event_symbols.length))
            delete settings.event_symbols;

        /**-------------------------------------------------------------------------------------------\
          Filter settings
        \-------------------------------------------------------------------------------------------**/

        //filters
        var defaultFilters = [
            { value_col: settings.id_col, label: settings.id_unitPropCased },
            { value_col: settings.event_col, label: 'Event Type' }
        ];
        if (settings.ongo_col)
            defaultFilters.splice(2, 0, { value_col: settings.ongo_col, label: 'Ongoing?' });
        settings.filters = arrayOfVariablesCheck(defaultFilters, settings.filters);

        /**-------------------------------------------------------------------------------------------\
          Grouping settings
        \-------------------------------------------------------------------------------------------**/

        //groupings
        var defaultGroupings = [];
        settings.groupings = arrayOfVariablesCheck(defaultGroupings, settings.groupings);

        //grouping direction
        if (['horizontal', 'vertical'].indexOf(settings.grouping_direction) === -1)
            settings.grouping_direction = 'horizontal';

        /**-------------------------------------------------------------------------------------------\
          Timing settings
        \-------------------------------------------------------------------------------------------**/

        //date_display_format
        settings.date_display_format = settings.date_display_format || settings.date_format;

        //date_ranges - array of 2-element date ranges or of objects with a label property and a time_range property
        //  {
        //      domain: [
        //          <lower bound>,
        //          <upper bound>
        //      ],
        //      label: '<date range description>'
        //  }

        if (Array.isArray(settings.date_range) && settings.date_ranges === null)
            settings.date_ranges = [
                {
                    domain: settings.date_range,
                    label: 'Initial Date Range'
                }
            ];
        else if (Array.isArray(settings.date_range) && Array.isArray(settings.date_ranges))
            settings.date_ranges.unshift(settings.date_range);

        if (Array.isArray(settings.date_ranges))
            settings.date_ranges = settings.date_ranges
                .filter(function(date_range) {
                    var domain = date_range.domain || date_range;
                    return (
                        domain instanceof Array &&
                        domain.length === 2 &&
                        domain[0].toString() !== domain[1].toString() &&
                        domain.every(function(d) {
                            return (
                                d instanceof Date || d3.time.format(settings.date_format).parse(d)
                            );
                        })
                    );
                })
                .map(function(date_range) {
                    var domain = (date_range.domain || date_range).map(function(date) {
                        return date instanceof Date
                            ? date
                            : d3.time.format(settings.date_format).parse(date);
                    });
                    var label =
                        date_range.label ||
                        domain
                            .map(function(date) {
                                return date instanceof Date
                                    ? d3.time.format(settings.date_display_format)(date)
                                    : date;
                            })
                            .join(' - ');
                    return {
                        domain: domain,
                        label: label
                    };
                });
        else settings.date_ranges = [];

        //day_ranges - array of 2-element day ranges or of objects with a label property and a time_range property
        //  {
        //      domain: [
        //          <lower bound>,
        //          <upper bound>
        //      ],
        //      label: '<day range description>'
        //  }

        if (Array.isArray(settings.day_range) && settings.day_ranges === null)
            settings.day_ranges = [
                {
                    domain: settings.day_range,
                    label: 'Initial Day Range'
                }
            ];
        else if (Array.isArray(settings.day_range) && Array.isArray(settings.day_ranges))
            settings.day_ranges.unshift(settings.day_range);

        if (settings.day_range && settings.day_ranges === null)
            settings.day_ranges = [
                {
                    domain: settings.day_range,
                    label: 'Initial Day Range'
                }
            ];
        if (Array.isArray(settings.day_ranges))
            settings.day_ranges = settings.day_ranges
                .filter(function(day_range) {
                    var domain = day_range.domain || day_range;
                    return (
                        domain instanceof Array &&
                        domain.length === 2 &&
                        domain[0].toString() !== domain[1].toString() &&
                        domain.every(function(d) {
                            return Number.isInteger(+d);
                        })
                    );
                })
                .map(function(day_range) {
                    var domain = day_range.domain || day_range;
                    var label = day_range.label || domain.join(' - ');
                    return {
                        domain: domain,
                        label: label
                    };
                });
        else settings.day_ranges = [];

        /**-------------------------------------------------------------------------------------------\
          Miscellaneous settings
        \-------------------------------------------------------------------------------------------**/

        //reference_lines
        if (settings.reference_lines) {
            if (!(settings.reference_lines instanceof Array))
                settings.reference_lines = [settings.reference_lines];

            settings.reference_lines = settings.reference_lines
                .map(function(reference_line) {
                    var referenceLineObject = {};

                    //either an object or not
                    referenceLineObject.timepoint =
                        reference_line instanceof Object
                            ? reference_line.timepoint
                            : reference_line;

                    //either an integer or not
                    referenceLineObject.time_scale = Number.isInteger(
                        +referenceLineObject.timepoint
                    )
                        ? 'Day'
                        : 'Date';

                    //label predefined or not
                    referenceLineObject.label = reference_line.label
                        ? reference_line.label
                        : referenceLineObject.time_scale.substring(0, 1).toUpperCase() +
                          referenceLineObject.time_scale.substring(1) +
                          ': ' +
                          referenceLineObject.timepoint;

                    return referenceLineObject;
                })
                .filter(function(reference_line) {
                    return (
                        (reference_line.time_scale === 'Day' &&
                            Number.isInteger(reference_line.timepoint)) ||
                        (reference_line.time_scale === 'Date' &&
                            d3.time
                                .format(settings.date_format)
                                .parse(reference_line.timepoint) instanceof Date)
                    );
                });

            if (!settings.reference_lines.length) delete settings.reference_lines;
        }

        /**-------------------------------------------------------------------------------------------\
          Listing settings
        \-------------------------------------------------------------------------------------------**/

        //details
        var defaultDetails = [
            { value_col: settings.event_col, label: 'Event Type' },
            { value_col: 'stdtdy', label: 'Start Date (Day)' },
            { value_col: 'endtdy', label: 'Stop Date (Day)' },
            { value_col: settings.seq_col, label: 'Sequence Number' }
        ];

        //add ongo_col if specified
        if (settings.ongo_col)
            defaultDetails.push({ value_col: settings.ongo_col, label: 'Ongoing?' });

        //add tooltip_col if specified
        if (settings.tooltip_col)
            defaultDetails.push({ value_col: settings.tooltip_col, label: 'Details' });

        settings.details = arrayOfVariablesCheck(defaultDetails, settings.details);

        //add filters
        settings.filters
            .filter(function(filter) {
                return filter.value_col !== settings.id_col;
            }) // remove id_col
            .filter(function(filter) {
                return (
                    settings.id_characteristics
                        .map(function(id_characteristic) {
                            return id_characteristic.value_col;
                        })
                        .indexOf(filter.value_col) < 0
                );
            }) // remove id_characteristics
            .forEach(function(filter) {
                if (
                    settings.details
                        .map(function(detail) {
                            return detail.value_col;
                        })
                        .indexOf(filter.value_col) === -1
                )
                    settings.details.push(filter);
            });
    }

    function syncWebchartsSettings(settings) {
        //Y-axis
        settings.y.column = settings.id_col;
        if (settings.grouping_initial) {
            settings.y.grouping = settings.grouping_initial;
            settings.y.groupingLabel =
                settings.groupings[
                    settings.groupings
                        .map(function(grouping) {
                            return grouping.value_col;
                        })
                        .indexOf(settings.grouping_initial)
                ].label;
        }

        //Lines
        var lines = settings.marks[0];
        lines.per = [settings.id_col, settings.event_col, settings.seq_col];
        lines.attributes['stroke-width'] = settings.mark_thickness * 1.25;

        //Circles
        var circles = settings.marks[1];
        circles.per = [settings.id_col, settings.event_col, settings.seq_col, 'wc_value'];
        circles.radius = settings.mark_thickness * 3 / 4;
        circles.attributes['stroke-width'] = settings.mark_thickness * 1 / 2;

        //Color stratification
        settings.color_by = settings.event_col;

        //Add space at bottom of timeline to create space for the last ID's offset marks.
        settings.margin.bottom = settings.margin.top + settings.range_band;
    }

    function syncTimeScaleSettings(settings) {
        settings.time_scale =
            ['date', 'day'].indexOf(settings.time_scale.toLowerCase()) > -1
                ? settings.time_scale.substring(0, 1).toUpperCase() +
                  settings.time_scale.substring(1).toLowerCase()
                : 'Date';

        //Define settings variables to handle both date and day time scales.
        if (settings.time_scale === 'Date') {
            settings.st_col = settings.stdt_col;
            settings.en_col = settings.endt_col;
            settings.x.type = 'time';
            settings.x.format = settings.date_display_format;
            settings.time_unit = 'DT';

            settings.x_parseFormat = d3.time.format(settings.date_format);
            settings.x_displayFormat = d3.time.format(settings.date_display_format);
            settings.time_function = function(dt) {
                var parsed = void 0;
                try {
                    parsed = settings.x_parseFormat.parse(dt) || new Date(dt);
                } catch (error) {
                    parsed = new Date(dt);
                }
                return parsed;
            };
        } else if (settings.time_scale === 'Day') {
            settings.st_col = settings.stdy_col;
            settings.en_col = settings.endy_col;
            settings.x.type = 'linear';
            settings.x.format = '1f';
            settings.time_unit = 'DY';

            settings.x_parseFormat = d3.format(settings.x.format);
            settings.x_displayFormat = settings.x_parseFormat;
            settings.time_function = function(dy) {
                return +settings.x_displayFormat(+dy);
            };
        }

        //Time intervals (lines)
        settings.marks[0].tooltip =
            'Event: [' +
            settings.event_col +
            ']' +
            ('\nStart ' + settings.time_scale.toLowerCase() + ': [' + settings.st_col + ']') +
            ('\nStop ' + settings.time_scale.toLowerCase() + ': [' + settings.en_col + ']');
        settings.marks[0].values = { wc_category: [settings.st_col, settings.en_col] };

        //Timepoints (circles)
        settings.marks[1].tooltip =
            'Event: [' +
            settings.event_col +
            ']' +
            ('\n' + settings.time_scale + ': [' + settings.st_col + ']');
        settings.marks[1].values = { wc_category: settings.time_unit };
    }

    function syncIDtimelineSettings(settings) {
        settings.x.label = '';
        settings.y.column = settings.seq_col;
        settings.y.sort = 'alphabetical-descending';
        settings.marks[0].per = [settings.event_col, settings.seq_col];
        settings.marks[1].per = [settings.event_col, settings.seq_col, 'wc_value'];
        settings.gridlines = 'y';
        settings.range_band = settings.mark_thickness * 2;
        settings.margin = { left: 25 };
    }

    function syncListingSettings(settings) {
        settings.details_config = settings.details_config || {
            cols: settings.details.map(function(detail) {
                return detail.value_col;
            }),
            headers: settings.details.map(function(detail) {
                return detail.label;
            })
        };

        //Define listing columns and headers if not already defined.
        if (!settings.details_config.hasOwnProperty('cols')) {
            settings.details_config.cols = settings.details.map(function(detail) {
                return detail.value_col;
            });
            settings.details_config.headers = settings.details.map(function(detail) {
                return detail.label;
            });
        }
    }

    function syncSettings(settings) {
        var syncedSettings = clone(settings);

        //Clinical timelines
        syncTimeScaleSettings(syncedSettings);
        syncRendererSpecificSettings(syncedSettings);
        syncWebchartsSettings(syncedSettings);

        //ID timeline
        syncedSettings.IDtimelineSettings = clone(syncedSettings);
        syncIDtimelineSettings(syncedSettings.IDtimelineSettings);

        //Listing
        syncListingSettings(syncedSettings);

        return syncedSettings;
    }

    var controls = [
        {
            type: 'dropdown',
            option: 'event_highlighted',
            label: '',
            description: 'Event highlighting',
            values: null // set in onInit() callback
        },
        {
            type: 'dropdown',
            option: 'time_scale',
            label: '',
            description: 'X-axis scale',
            values: ['Date', 'Day'],
            require: true
        },
        {
            type: 'dropdown',
            option: 'date_time_range',
            label: '',
            description: 'Time range',
            values: null, // set in onInit() callback
            require: true
        },
        {
            type: 'dropdown',
            option: 'day_time_range',
            label: '',
            description: 'Time range',
            values: null, // set in onInit() callback
            require: true
        },
        {
            type: 'dropdown',
            option: 'y.sort',
            label: '',
            description: 'Y-axis sort',
            values: ['By Earliest Event', 'Alphanumerically'],
            require: true
        },
        {
            type: 'dropdown',
            option: 'y.groupingLabel',
            label: '',
            description: 'Y-axis grouping',
            values: null // set in onInit() callback
        }
    ];

    function syncControls(controls, settings) {
        settings.filters
            .sort(function(a, b) {
                return a.value_col === settings.event_col ? 1 : 0;
            })
            .forEach(function(filter) {
                filter.type = 'subsetter';
                filter.description = filter.label;
                filter.label = '';

                //Update ID filter.
                if (filter.value_col === settings.id_col)
                    filter.description = settings.id_unitPropCased + ' view';

                //Update event type filter.
                if (filter.value_col === settings.event_col) {
                    filter.multiple = true;
                    filter.start = settings.event_types;
                }
            });

        //Remove groupings control if no groupings are specified.
        if (settings.groupings.length === 0)
            controls.splice(
                controls.findIndex(function(control) {
                    return control.option === 'y.grouping';
                }),
                1
            );

        var syncedControls = d3.merge([
            [settings.filters[0]], // ID dropdown first
            clone(controls), // Non-filters second
            settings.filters.slice(1) // Filters last
        ]);

        return syncedControls;
    }

    var defaults$1 = {
        settings: settings,
        syncSettings: syncSettings,
        controls: controls,
        syncControls: syncControls
    };

    function defineSettings() {
        this.settings.merged = Object.assign(
            {},
            clone(defaults$1.settings),
            clone(this.settings.user)
        );
        this.settings.synced = defaults$1.syncSettings(clone(this.settings.merged));
        Object.assign(this.settings, clone(this.settings.synced));
        this.settings.IDtimeline = clone(this.settings.IDtimelineSettings);
        this.settings.listing = clone(this.settings.details_config);
        this.settings.controls = defaults$1.syncControls(
            clone(defaults$1.controls),
            clone(this.settings)
        );
    }

    function defineStyles() {
        //Define styles.
        var line = this.settings.synced.marks.find(function(mark) {
            return mark.type === 'line';
        });
        var circle = this.settings.synced.marks.find(function(mark) {
            return mark.type === 'circle';
        });
        var styles = [
            /***--------------------------------------------------------------------------------------\
          Global styles
        \--------------------------------------------------------------------------------------***/

            //general
            'html {' + '    overflow: -moz-scrollbars-vertical;' + '    overflow-y: scroll;' + '}',
            '#clinical-timelines {' + '    display: inline-block;' + '    width: 100%;' + '}',

            //hidden
            '#clinical-timelines .ct-hidden {' + '    display: none !important;' + '}',

            //buttons
            '#clinical-timelines .ct-button {' +
                '    display: inline-block;' +
                '    padding: 3px 5px !important;' +
                '    border: 2px solid black !important;' +
                '    border-radius: 4px !important;' +
                '    color: #333;' +
                '    background: #ccc;' +
                '    cursor: pointer !important;' +
                '}',
            '#clinical-timelines .ct-button:hover {' +
                '    color: #ccc;' +
                '    background: #333 !important;' +
                '}',

            /***--------------------------------------------------------------------------------------\
          Left and right columns
        \--------------------------------------------------------------------------------------***/

            '#clinical-timelines .ct-column {' + '    display: inline-block;' + '}',
            '#clinical-timelines #ct-left-column {' + '    width: 24%;' + '    float: left;' + '}',
            '#clinical-timelines #ct-right-column {' +
                '    width: 75%;' +
                '    float: right;' +
                '}',
            '#clinical-timelines .ct-column > * {' +
                '    width: 100%;' +
                '    vertical-align: top;' +
                '    display: inline-block;' +
                '    margin-bottom: 10px;' +
                '    border: 1px solid #eee;' +
                '}',
            '#clinical-timelines .ct-column > * > * {' + '    margin: 10px;' + '}',

            /***--------------------------------------------------------------------------------------\
          Left column elements
        \--------------------------------------------------------------------------------------***/

            '#clinical-timelines #ct-left-column > * {' + '}',

            //Details
            '#clinical-timelines #ct-left-column .ct-details {' +
                '    font-size: 90%;' +
                '    text-align: right;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-button {' +
                '    float: left;' +
                '    font-size: 110%;' +
                '    font-weight: bold;' +
                '    margin-bottom: 10px;' +
                '    margin-right: 10px;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-button a {' +
                '    color: blue;' +
                '    text-decoration: none;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-button:hover a {' +
                '    color: #ccc;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-stats,' +
                '#clinical-timelines #ct-left-column .ct-details .ct-characteristic span {' +
                '    font-weight: bold;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-stats.ct-sample {' +
                '    color: green;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-stats.ct-sample-inside-time-range {' +
                '    color: blue;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-stats.ct-sample-outside-time-range {' +
                '    color: red;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-details .ct-info-icon {' +
                '    font-weight: bold;' +
                '    color: blue;' +
                '    cursor: help;' +
                '}',

            //Controls
            '#clinical-timelines #ct-left-column .wc-controls {' +
                '    margin-bottom: 0;' +
                '    clear: left;' +
                '}',
            '#clinical-timelines #ct-left-column .wc-controls .control-group {' +
                '    margin: 0 0 5px 0;' +
                '    display: block;' +
                '    float: right;' +
                '    clear: both;' +
                '    width: 100%;' +
                '}',
            '#clinical-timelines #ct-left-column .wc-controls .ct-horizontal-rule {' +
                '    width: 100%;' +
                '    display: inline-block;' +
                '    margin-bottom: 5px;' +
                '    font-size: 150%;' +
                '    border-bottom: 1px solid black;' +
                '}',
            '#clinical-timelines #ct-left-column .wc-controls .control-group.ct-ID {' +
                '    display: inline-block;' +
                '}',
            '#clinical-timelines #ct-left-column .wc-controls .control-group > * {' +
                '    display: inline-block;' +
                '    vertical-align: top;' +
                '    float: right;' +
                '}',
            '#clinical-timelines #ct-left-column .wc-controls .control-group .span-description {' +
                '    font-size: 90%;' +
                '}',
            '#clinical-timelines #ct-left-column .wc-controls .control-group .changer {' +
                '    margin-left: 5px;' +
                '    width: 50%;' +
                '    clear: right;' +
                '    box-sizing: border-box;' +
                '}',

            //Reference Tables
            '#clinical-timelines #ct-left-column .ct-reference-line-table-header {' +
                '    text-align: center;' +
                '    border-bottom: 1px solid black;' +
                '    padding-bottom: 5px;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-reference-line-table-body table {' +
                '    width: 100%;' +
                '    display: table;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-reference-line-table-body th,' +
                '#clinical-timelines #ct-left-column .ct-reference-line-table-body td {' +
                '    text-align: left;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-higher-level {' +
                '    border-bottom: 1px dotted lightgray;' +
                '    font-weight: bold;' +
                '    font-size: 14px;' +
                '}',
            '#clinical-timelines #ct-left-column .ct-lower-level {' + '    font-size: 12px;' + '}',
            '#clinical-timelines #ct-left-column .ct-lower-level.ct-indent {' +
                '    padding-left: 5%;' +
                '}',

            /***--------------------------------------------------------------------------------------\
          Right column elements
        \--------------------------------------------------------------------------------------***/

            '#clinical-timelines #ct-right-column > * {' + '}',
            '#clinical-timelines #ct-right-column #ct-timelines {' + '    min-height: 80px;' + '}',

            //Legend
            '#clinical-timelines #ct-right-column #ct-timelines .legend {' +
                '    display: flex !important;' +
                '    justify-content: center;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .legend-title {' +
                '    border-radius: 4px;' +
                '    padding: 5px 7px 3px 4px;' +
                '    border: 2px solid white;' +
                '    margin-right: .25em !important;' +
                '    margin-left: 10em;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .legend-item {' +
                '    cursor: pointer;' +
                '    float: left;' +
                '    border-radius: 4px;' +
                '    padding: 4px 7px 3px 4px;' +
                '    border: 2px solid white;' +
                '    margin-right: .25em !important;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .legend-item:not(.ct-highlighted) {' +
                '    border: none !important;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .legend-item:not(.ct-selected) {' +
                '    background: white;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .legend-color-block circle {' +
                '    cx: .55em !important;' +
                '    cy: .55em !important;' +
                '    r: .4em !important;' +
                '    stroke: black;' +
                '    stroke-width: 1;' +
                '}',

            //Second legend
            '#clinical-timelines #ct-legend {' +
                '    list-style-type: none;' +
                '    position: absolute;' +
                '    top: 0;' +
                '}',
            '#clinical-timelines .ct-legend-item {' +
                '    cursor: default;' +
                '    margin-right: 10px;' +
                '}',

            //Y-axis
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .y.axis .tick {' +
                '    cursor: pointer;' +
                '    fill: blue;' +
                '    text-decoration: none;' +
                '    font-weight: bolder;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .y.axis .tick:hover {' +
                '    text-decoration: underline;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .y.axis .tick rect.ct-stripe {' +
                '    stroke: #aaa;' +
                '    stroke-width: 1;' +
                '    fill: none;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .y.axis .tick:nth-child(even) rect.ct-stripe {' +
                '    fill: #eee;' +
                '}',

            //Grouping
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .ct-grouping .ct-boundary {' +
                '    stroke: black;' +
                '    stroke-width: 2;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .ct-grouping .ct-annotation {' +
                '    font-size: 150%;' +
                '    font-weight: normal;' +
                '    text-anchor: start;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-timelines .wc-chart .wc-svg .ct-grouping.ct-vertical .ct-annotation {' +
                '    writing-mode: tb-rl;' +
                '}',

            //Lines
            '#clinical-timelines path.wc-data-mark {' +
                ('    stroke-width: ' + line.attributes['stroke-width'] + ';') +
                '    stroke-opacity: 1;' +
                '}',
            '#clinical-timelines path.wc-data-mark.ct-highlighted {' +
                ('    stroke-width: ' + line.attributes['stroke-width'] * 1.5 + ';') +
                '}',
            '#clinical-timelines line.ct-highlight-overlay {' +
                ('    stroke-width: ' + line.attributes['stroke-width'] / 2 + ';') +
                '    stroke-linecap: round;' +
                '}',

            //Circles
            '#clinical-timelines circle.wc-data-mark:not(.ct-highlighted) {' +
                '    stroke-width: 1;' +
                '    stroke: black;' +
                '    fill-opacity: 1;' +
                '}',
            '#clinical-timelines circle.wc-data-mark.ct-highlighted {' +
                '    stroke-opacity: 1;' +
                '    fill-opacity: 1;' +
                ('    stroke-width: ' + circle.attributes['stroke-width'] + ';') +
                '}',

            //Symbols
            '#clinical-timelines .ct-custom-mark:not(.ct-highlighted) {' +
                '    stroke-width: 1;' +
                '    stroke: black;' +
                '    fill-opacity: 1;' +
                '}',
            '#clinical-timelines .ct-custom-mark.ct-highlighted {' +
                '    stroke-opacity: 1;' +
                '    fill-opacity: 1;' +
                ('    stroke-width: ' + circle.attributes['stroke-width'] + ';') +
                '}',

            //Arrows
            '#clinical-timelines polygon.ct-ongoing-event {' + '}',
            '#clinical-timelines polygon.ct-ongoing-event.ct-highlighted {' +
                ('    stroke-width: ' + line.attributes['stroke-width'] / 3 + ';') +
                '}',

            //Reference lines
            '#clinical-timelines #ct-right-column .wc-chart .wc-svg .ct-visible-reference-line {' +
                '    stroke: black;' +
                '    stroke-width: 1;' +
                '    stroke-dasharray: 2,2;' +
                '}',
            '#clinical-timelines #ct-right-column .wc-chart .wc-svg .ct-visible-reference-line.ct-hover {' +
                '    stroke-dasharray: none;' +
                '}',
            '#clinical-timelines #ct-right-column .wc-chart .wc-svg .ct-hover-line {' +
                '    cursor: pointer;' +
                '    stroke: black;' +
                '    stroke-width: 20;' +
                '    stroke-opacity: 0;' +
                '}',
            '#clinical-timelines #ct-right-column .wc-chart .wc-svg .ct-reference-line-text {' +
                '    font-weight: bold;' +
                '    font-size: 24px;' +
                '}',

            //ID timeline
            '#clinical-timelines #ct-right-column #ct-ID-timeline .wc-chart .wc-svg title {' +
                '    white-space: pre;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-ID-timeline .wc-small-multiples .wc-chart {' +
                '    width: 100%;' +
                '    padding: 0;' +
                '    border-top: 1px solid black;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-ID-timeline .wc-small-multiples .wc-chart > * {' +
                '    display: inline-block;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-ID-timeline .wc-small-multiples .wc-chart .wc-svg {' +
                '    float: left;' +
                '    width: 75%;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-ID-timeline .wc-small-multiples .wc-chart .wc-chart-title {' +
                '    float: right;' +
                '    text-align: left;' +
                '    font-size: 150%;' +
                '    font-weight: normal;' +
                '    width: 24%;' +
                '}',
            '#clinical-timelines #ct-right-column #ct-ID-timeline .wc-small-multiples .wc-chart .wc-svg .ct-time-range {' +
                '    opacity: .1;' +
                '}',

            //Listing
            '#clinical-timelines #ct-right-column #ct-listing .wc-chart.wc-table table {' +
                '    display: table;' +
                '    width: 100%;' +
                '}'
        ];

        //Attach styles to DOM.
        var style = this.document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = styles.join('\n');
        this.document.getElementsByTagName('head')[0].appendChild(style);
    }

    function exportData() {
        var _this = this;

        //Filter data on events overlapping current time range.
        var data = this.timelines.wideDataInsideTimeRange.filter(function(d) {
                var st = _this.timelines.config.time_function(d[_this.timelines.config.st_col]),
                    en = _this.timelines.config.time_function(d[_this.timelines.config.en_col]),
                    stInsideTimeRange =
                        _this.timelines.config.x.domain[0] <= st &&
                        st <= _this.timelines.config.x.domain[1],
                    // start is within the time range
                    enInsideTimeRange =
                        _this.timelines.config.x.domain[0] <= en &&
                        en <= _this.timelines.config.x.domain[1],
                    // end is within the time range
                    surroundingTimeRange =
                        _this.timelines.config.x.domain[0] > st &&
                        en > _this.timelines.config.x.domain[1]; // start is prior to time range and end is after time range

                return stInsideTimeRange || enInsideTimeRange || surroundingTimeRange;
            }),
            columns = void 0,
            headers = void 0;

        //If specified, transpose data to one record per ID per sequence number.
        if (this.settings.transpose_data) {
            var nested = d3
                    .nest()
                    .key(function(d) {
                        return d[_this.settings.id_col] + '|' + d[_this.settings.seq_col];
                    })
                    //.rollup(d => console.log(d))
                    .entries(data),
                transposed = [];
            nested.forEach(function(d) {
                var datum = {},
                    keys = d.key.split('|');
                datum[_this.settings.id_col] = keys[0];
                datum[_this.settings.seq_col] = keys[1];

                d.values.forEach(function(di) {
                    //ID characteristics
                    _this.settings.id_characteristics.forEach(function(id_characteristic) {
                        datum[id_characteristic.label] = di[id_characteristic.value_col];
                    });

                    //Event characteristics
                    datum[di[_this.settings.event_col] + ' Start'] = di.stdtdy;
                    datum[di[_this.settings.event_col] + ' End'] = di.endtdy;
                });

                transposed.push(datum);
            });
            data = transposed;
            columns = this.settings.id_characteristics
                .map(function(id_characteristic) {
                    return id_characteristic.label;
                })
                .concat([this.settings.seq_col])
                .concat(
                    this.timelines.currentEventTypes
                        .concat(this.timelines.currentEventTypes)
                        .sort()
                        .map(function(eventType, i) {
                            return eventType + (i % 2 ? ' End' : ' Start');
                        })
                );
            headers = columns;
        } else {
            //Otherwise export one record per ID per event.
            var variables = this.settings.id_characteristics.concat(
                this.settings.details.filter(function(detail) {
                    return (
                        _this.settings.id_characteristics
                            .map(function(id_characteristic) {
                                return id_characteristic.value_col;
                            })
                            .indexOf(detail.value_col) < 0
                    );
                })
            );
            columns = variables.map(function(variable) {
                return variable.value_col;
            });
            headers = variables.map(function(variable) {
                return variable.label;
            });
        }

        //Add headers and rows to CSV array.
        var CSVarray = [];
        data.forEach(function(d, i) {
            //Add headers to CSV array.
            if (i === 0)
                CSVarray.push(
                    headers.map(function(header) {
                        return '"' + header.replace(/"/g, '""') + '"';
                    })
                );

            //add rows to CSV array
            var row = columns.map(function(col) {
                var value = d[col] || '';

                if (typeof value === 'string') value = value.replace(/"/g, '""');

                return '"' + value + '"';
            });

            CSVarray.push(row);
        });

        //transform CSV array into CSV string
        var CSV = new Blob([CSVarray.join('\n')], { type: 'text/csv;charset=utf-8;' }),
            fileName =
                'ClinicalTimelinesData_' + d3.time.format('%Y-%m-%dT%H-%M-%S')(new Date()) + '.csv',
            link = this.containers.exportButton;

        if (navigator.msSaveBlob) {
            // IE 10+
            link.style({
                cursor: 'pointer',
                'text-decoration': 'underline',
                color: 'blue'
            });
            navigator.msSaveBlob(CSV, fileName);
        } else {
            // Browsers that support HTML5 download attribute
            if (link.node().download !== undefined) {
                var url = URL.createObjectURL(CSV);
                link.node().setAttribute('href', url);
                link.node().setAttribute('download', fileName);
            }
        }
    }

    function hideTimeRangeControl() {
        var _this = this;

        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.option && d.option.indexOf('_time_range') > -1;
            })
            .classed('ct-hidden', function(d) {
                return (
                    (_this.config.time_scale === 'Date' && d.option === 'day_time_range') ||
                    (_this.config.time_scale === 'Day' && d.option === 'date_time_range')
                );
            });
    }

    function enableDisableControls() {
        var _this = this;

        //Enable/Disable controls other than ID and Event Type filters.
        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(control) {
                return (
                    control.value_col !== _this.config.id_col &&
                    control.option !== 'event_highlighted' &&
                    control.option !== 'time_scale' &&
                    control.value_col !== _this.config.event_col
                );
            })
            .classed('ct-hidden', !!this.selected_id);

        if (!this.selected_id) hideTimeRangeControl.call(this);
    }

    function updateIDfilter() {
        var _this = this;

        var IDfilter = this.controls.wrap.selectAll('.control-group').filter(function(control) {
            return control.value_col === _this.config.id_col;
        });

        //Update selected option.
        IDfilter.selectAll('option').property('selected', function(option) {
            return option === _this.selected_id;
        });

        //Update ID object in filters array.
        this.filters.filter(function(filter) {
            return filter.col === _this.config.id_col;
        })[0].val =
            this.selected_id || 'All';

        //Bring focus to the ID dropdown.
        IDfilter.style({
            'font-weight': 'bold'
        })
            .transition()
            .delay(1000)
            .style({
                'font-weight': 'normal'
            })
            .select('select')
            .node()
            .focus();
    }

    function goBackToTimelines() {
        delete this.timelines.selected_id;

        enableDisableControls.call(this.timelines);
        updateIDfilter.call(this.timelines);

        //Hide ID timelines.
        this.containers.IDdetails.classed('ct-hidden', true);
        this.containers.IDtimeline.classed('ct-hidden', true);
        this.containers.listing.classed('ct-hidden', true);

        //Display population timelines.
        this.containers.populationDetails.classed('ct-hidden', false);
        this.timelines.wrap.select('svg.wc-svg').classed('ct-hidden', false);

        //Redraw clinical timelines.
        this.timelines.draw();
    }

    function defineLayout() {
        var _this = this;

        this.containers.main = d3
            .select(this.element)
            .append('div')
            .attr('id', 'clinical-timelines');

        /**-------------------------------------------------------------------------------------------\
          Left column
        \-------------------------------------------------------------------------------------------**/

        this.containers.leftColumn = this.containers.main
            .append('div')
            .classed('ct-column', true)
            .attr('id', 'ct-left-column');

        /***--------------------------------------------------------------------------------------\
          Details
        \--------------------------------------------------------------------------------------***/

        this.containers.details = this.containers.leftColumn.append('div').attr('id', 'ct-details');

        /****---------------------------------------------------------------------------------\
          Population details
        \---------------------------------------------------------------------------------****/

        this.containers.populationDetails = this.containers.details
            .append('div')
            .classed('ct-details', true)
            .attr('id', 'ct-population-details');

        //Add button to export timelines data.
        this.containers.exportButton = this.containers.populationDetails
            .append('div')
            .classed('ct-button', true)
            .attr('id', 'ct-export-button')
            .append('a')
            .html('&dArr; Data')
            .on('click', function() {
                exportData.call(_this);
            });

        //Add container for population details given current filters.
        this.containers.popCurrentFilters = this.containers.populationDetails
            .append('div')
            .classed('ct-characteristic', true)
            .attr('id', 'ct-current-filters');

        //Add container for population details inside time range.
        this.containers.popInsideTimeRange = this.containers.populationDetails
            .append('div')
            .classed('ct-characteristic', true)
            .attr('id', 'ct-inside-time-range');

        //Add container for population details inside time range.
        this.containers.popOutsideTimeRange = this.containers.populationDetails
            .append('div')
            .classed('ct-characteristic', true)
            .attr('id', 'ct-outside-time-range');

        /****---------------------------------------------------------------------------------\
          ID details
        \---------------------------------------------------------------------------------****/

        this.containers.IDdetails = this.containers.details
            .append('div')
            .classed('ct-details ct-hidden', true)
            .attr('id', 'ct-ID-details');

        //Add button to return from ID timeline to timelines.
        this.containers.backButton = this.containers.IDdetails.append('div')
            .classed('ct-button', true)
            .attr('id', 'ct-back-button')
            .append('a')
            .html('&lArr; Back')
            .on('click', function() {
                goBackToTimelines.call(_this);
            });

        /***--------------------------------------------------------------------------------------\
          Controls
        \--------------------------------------------------------------------------------------***/

        this.containers.controls = this.containers.leftColumn
            .append('div')
            .attr('id', 'ct-controls');

        /**-------------------------------------------------------------------------------------------\
          Right column
        \-------------------------------------------------------------------------------------------**/

        this.containers.rightColumn = this.containers.main
            .append('div')
            .classed('ct-column', true)
            .attr('id', 'ct-right-column');

        /***--------------------------------------------------------------------------------------\
          Timelines
        \--------------------------------------------------------------------------------------***/

        this.containers.timelines = this.containers.rightColumn
            .append('div')
            .attr('id', 'ct-timelines');

        /***--------------------------------------------------------------------------------------\
          ID timeline
        \--------------------------------------------------------------------------------------***/

        this.containers.IDtimeline = this.containers.rightColumn
            .append('div')
            .classed('ct-hidden', true)
            .attr('id', 'ct-ID-timeline');

        /***--------------------------------------------------------------------------------------\
          Listing
        \--------------------------------------------------------------------------------------***/

        this.containers.listing = this.containers.rightColumn
            .append('div')
            .classed('ct-hidden', true)
            .attr('id', 'ct-listing');
    }

    function recurse() {
        this.timelines.IDtimeline = this.IDtimeline;
        this.timelines.listing = this.listing;
        this.timelines.settings = this.settings;
        this.IDtimeline.timelines = this.timelines;
        this.IDtimeline.listing = this.listing;
        this.IDtimeline.settings = this.settings;
        this.listing.timelines = this.timelines;
        this.listing.IDtimeline = this.IDtimeline;
        this.listing.settings = this.settings;
    }

    function controls$1() {
        this.controls = webcharts.createControls(this.containers.controls.node(), {
            location: 'top',
            inputs: this.settings.controls
        });
    }

    //Capture and count all IDs in data.
    function getPopulationDetails() {
        var _this = this;

        this.populationDetails = {
            population: d3
                .set(
                    this.raw_data.map(function(d) {
                        return d[_this.config.id_col];
                    })
                )
                .values()
        };
        this.populationDetails.N = this.populationDetails.population.length;
        this.IDdetails = {};
    }

    //Remove records with missing key variables.
    function removeInvalidData() {
        var _this = this;

        this.initial_data = this.raw_data.filter(function(d) {
            return (
                !/^\s*$/.test(d[_this.config.id_col]) && !/^\s*$/.test(d[_this.config.event_col])
            );
        });

        //Warn user of removed records.
        if (this.initial_data.length < this.raw_data.length)
            console.warn(
                this.raw_data.length -
                    this.initial_data.length +
                    ' records have been removed due to missing identifiers or event types.'
            );

        //Check which time scales are present in the data.
        this.anyDates = this.initial_data.some(function(d) {
            return d.hasOwnProperty(_this.config.stdt_col) && d[_this.config.stdt_col] !== '';
        });
        this.anyDays = this.initial_data.some(function(d) {
            return d.hasOwnProperty(_this.config.stdy_col) && d[_this.config.stdy_col] !== '';
        });
    }

    //Attach initial, valid data to controls, bypassing controls.init().
    function attachDataToControls() {
        this.controls.data = this.initial_data;
        this.controls.ready = true;
    }

    //Standardize invalid date and day values.
    function standardizeTimeVariables() {
        var _this = this;

        this.initial_data.forEach(function(d, i) {
            var has_stdt = d.hasOwnProperty(_this.config.stdt_col),
                has_endt = d.hasOwnProperty(_this.config.endt_col),
                has_stdy = d.hasOwnProperty(_this.config.stdy_col),
                has_endy = d.hasOwnProperty(_this.config.endy_col);

            //Set to an empty string invalid date and day values.
            if (has_stdt) {
                if (!d3.time.format(_this.config.date_format).parse(d[_this.config.stdt_col]))
                    d[_this.config.stdt_col] = '';
            }
            if (has_endt) {
                if (!d3.time.format(_this.config.date_format).parse(d[_this.config.endt_col]))
                    d[_this.config.endt_col] = d[_this.config.stdt_col];
            }
            if (has_stdy) {
                if (!/^ *-?\d+ *$/.test(d[_this.config.stdy_col])) d[_this.config.stdy_col] = '';
            }
            if (has_endy) {
                if (!/^ *-?\d+ *$/.test(d[_this.config.endy_col]))
                    d[_this.config.endy_col] = d[_this.config.stdy_col];
            }

            //Concatenate date and day values for listing.
            d.stdtdy =
                has_stdt && has_stdy && d[_this.config.stdy_col] !== ''
                    ? d[_this.config.stdt_col] + ' (' + d[_this.config.stdy_col] + ')'
                    : d[_this.config.stdt_col] || d[_this.config.stdy_col];
            d.endtdy =
                has_endt && has_endy && d[_this.config.endy_col] !== ''
                    ? d[_this.config.endt_col] + ' (' + d[_this.config.endy_col] + ')'
                    : d[_this.config.endt_col] || d[_this.config.endy_col];
        });
    }

    //Capture all event types in array and define color domain as well as event type order.
    function handleEventTypes() {
        var _this = this;

        this.allEventTypes = d3
            .set(
                this.initial_data.map(function(d) {
                    return d[_this.config.event_col];
                })
            )
            .values()
            .sort();
        this.currentEventTypes = this.config.event_types || this.allEventTypes.slice();
        this.controls.config.inputs.find(function(input) {
            return input.description === 'Event Type';
        }).start = this.currentEventTypes;
        this.config.color_dom = this.currentEventTypes.concat(
            this.allEventTypes
                .filter(function(eventType) {
                    return _this.currentEventTypes.indexOf(eventType) === -1;
                })
                .sort()
        );
        this.config.legend.order = this.config.color_dom.slice();
    }

    function defineFullTimeRanges() {
        var _this = this;

        /**-------------------------------------------------------------------------------------------\
          Dates
        \-------------------------------------------------------------------------------------------**/

        if (this.anyDates) {
            //full domain
            this.full_date_range = [
                d3.min(this.initial_data, function(d) {
                    return d3.time.format(_this.config.date_format).parse(d[_this.config.stdt_col]);
                }),
                d3.max(this.initial_data, function(d) {
                    return d3.time.format(_this.config.date_format).parse(d[_this.config.endt_col]);
                })
            ];

            //full domain as a string
            this.full_date_time_range = this.full_date_range
                .map(function(d) {
                    return d3.time.format(_this.config.date_format)(d);
                })
                .join(' - ');

            //add full domain to date ranges
            this.config.date_ranges.push({
                domain: this.full_date_range,
                label: 'Full'
            });

            //add custom domain to date ranges
            this.config.date_ranges.push({
                domain: this.full_date_range.slice(),
                label: 'User Input'
            });
        }

        /**-------------------------------------------------------------------------------------------\
          Days
        \-------------------------------------------------------------------------------------------**/

        if (this.anyDays) {
            //full domain
            this.full_day_range = [
                d3.min(this.initial_data, function(d) {
                    return +d[_this.config.stdy_col];
                }),
                d3.max(this.initial_data, function(d) {
                    return +d[_this.config.endy_col];
                })
            ];

            //full domain as a string
            this.full_day_time_range = this.full_day_range.join(' - ');

            //add full domain to day ranges
            this.config.day_ranges.push({
                domain: this.full_day_range,
                label: 'Full'
            });

            //add custom domain to day ranges
            this.config.day_ranges.push({
                domain: this.full_day_range.slice(),
                label: 'User Input'
            });
        }
    }

    function defineInitialTimeRanges() {
        if (this.anyDates) this.date_range = this.config.date_ranges[0].domain.slice();
        if (this.anyDays) this.day_range = this.config.day_ranges[0].domain.slice();
    }

    function syncTimeRanges() {
        if (this.config.time_scale === 'Date') this.time_range = this.date_range.slice();
        else this.time_range = this.day_range.slice();
    }

    //Update time range data and settings.
    function handleTimeRanges() {
        //Calculate extent of each time scale.
        defineFullTimeRanges.call(this);

        //Set initial range of each time scale.
        defineInitialTimeRanges.call(this);

        //Sync time range variables given initial time scale.
        syncTimeRanges.call(this);
    }

    function checkTimeScales() {
        var _this = this;

        this.controls.config.inputs = this.controls.config.inputs.filter(function(input) {
            if (input.description !== 'X-axis scale') return true;
            else {
                if (!_this.anyDates && !_this.anyDays) {
                    var errorText =
                        'The data either contain neither ' +
                        _this.config.stdt_col +
                        ' nor ' +
                        _this.config.stdy_col +
                        ' or both ' +
                        _this.config.stdt_col +
                        ' and ' +
                        _this.config.stdy_col +
                        ' contain no valid values.  Please update the settings object to match the variables in the data or clean the data.';
                    _this.wrap
                        .append('div')
                        .style('color', 'red')
                        .html(errorText);
                    throw new Error(errorText);
                } else if (!_this.anyDates && _this.config.time_scale === 'Date') {
                    console.warn(
                        'The data either do not contain a variable named ' +
                            _this.config.stdt_col +
                            ' or ' +
                            _this.config.stdt_col +
                            ' contains no valid values.  Please update the settings object to match the variable in the data or clean the data.'
                    );
                    _this.config.time_scale = 'Day';
                    syncTimeScaleSettings(_this.config);
                    _this.IDtimeline.config.time_scale = 'Day';
                    syncTimeScaleSettings(_this.IDtimeline.config);
                } else if (!_this.anyDays && _this.config.time_scale === 'Day') {
                    console.warn(
                        'The data either do not contain a variable named ' +
                            _this.config.stdy_col +
                            ' or ' +
                            _this.config.stdy_col +
                            ' contains no valid values.  Please update the settings object to match the variable in the data or clean the data.'
                    );
                    _this.config.time_scale = 'Date';
                    syncTimeScaleSettings(_this.config);
                    _this.IDtimeline.config.time_scale = 'Date';
                    syncTimeScaleSettings(_this.IDtimeline.config);
                }

                return _this.anyDates && _this.anyDays;
            }
        });
    }

    function updateTimeRangeControls() {
        if (this.anyDates) {
            //Update date time range dropdown.
            this.controls.config.inputs.find(function(input) {
                return input.option === 'date_time_range';
            }).values = this.config.date_ranges.map(function(date_time_range) {
                return date_time_range.label;
            });
            this.config.date_time_range = this.config.date_ranges[0].label;
        }

        if (this.anyDays) {
            //Update day time range dropdown.
            this.controls.config.inputs.find(function(input) {
                return input.option === 'day_time_range';
            }).values = this.config.day_ranges.map(function(day_time_range) {
                return day_time_range.label;
            });
            this.config.day_time_range = this.config.day_ranges[0].label;
        }
    }

    function checkOtherControls() {
        var _this = this;

        this.controls.config.inputs
            .filter(function(input) {
                return input.type !== 'subsetter';
            })
            .forEach(function(input) {
                //Set values of Event Type highlighting control to event types present in the data.
                if (input.description === 'Event highlighting')
                    input.values = _this.config.color_dom.slice();
                else if (input.description === 'Y-axis grouping')
                    input.values = _this.config.groupings.map(function(grouping) {
                        return grouping.label;
                    });

                return true;
            });

        checkTimeScales.call(this);
        updateTimeRangeControls.call(this);
    }

    function checkFilters() {
        var _this = this;

        this.controls.config.inputs = this.controls.config.inputs.filter(function(input) {
            if (input.type !== 'subsetter') return true;
            else if (!_this.initial_data[0].hasOwnProperty(input.value_col)) {
                console.warn(
                    input.value_col + ' filter removed because the variable does not exist.'
                );

                return false;
            } else {
                var levels = d3
                    .set(
                        _this.initial_data.map(function(d) {
                            return d[input.value_col];
                        })
                    )
                    .values();

                if (levels.length < 2) {
                    console.warn(
                        input.value_col + ' filter removed because the variable has only one level.'
                    );
                }

                return levels.length > 1;
            }
        });
    }

    //Check control inputs for invalid settings.
    function checkControls() {
        checkOtherControls.call(this);
        checkFilters.call(this);
    }

    //Remove invalid time data.
    function cleanData() {
        var _this = this;

        this.wide_data = this.initial_data.filter(function(d) {
            return d[_this.config.st_col] !== '';
        });

        //Warn user of removed records.
        if (this.wide_data.length < this.initial_data.length) {
            if (this.config.time_scale === 'Date')
                console.warn(
                    this.initial_data.length -
                        this.wide_data.length +
                        ' records have been removed due to missing or invalid date variable values that do not match settings.date_format (' +
                        this.config.date_format +
                        ')'
                );
            else if (this.config.time_scale === 'Day')
                console.warn(
                    this.initial_data.length -
                        this.wide_data.length +
                        ' records have been removed due to missing or invalid day variable values.'
                );
        }
    }

    /*------------------------------------------------------------------------------------------------\
      Expand a data array to one item per original item per specified column.
    \------------------------------------------------------------------------------------------------*/

    function lengthenRaw(data, columns) {
        var my_data = [];

        data.forEach(function(d) {
            columns.forEach(function(column) {
                var obj = Object.assign({}, d);
                obj.wc_category = column;
                obj.wc_value = d[column];
                my_data.push(obj);
            });
        });

        return my_data;
    }

    //Define a record for each timepoint and a record for both the start and end of a time interval.
    function defineData() {
        var _this = this;

        //Capture timepoints.
        var timepoints = this.wide_data
            .filter(function(d) {
                return d[_this.config.st_col] === d[_this.config.en_col];
            })
            .map(function(d) {
                d.wc_category = _this.config.time_unit;
                d.wc_value = d[_this.config.st_col];

                return d;
            });

        //Capture time intervals, creating two records for each event..
        var timeIntervals = lengthenRaw(
            this.wide_data.filter(function(d) {
                return d[_this.config.st_col] !== d[_this.config.en_col];
            }),
            [this.config.st_col, this.config.en_col]
        );

        //Merge timepoints and time intervals.
        this.long_data = d3.merge([timepoints, timeIntervals]);
        this.raw_data = this.long_data;
    }

    function onInit() {
        getPopulationDetails.call(this);
        removeInvalidData.call(this);
        attachDataToControls.call(this);
        standardizeTimeVariables.call(this);
        handleEventTypes.call(this);
        handleTimeRanges.call(this);
        checkControls.call(this);

        cleanData.call(this);
        defineData.call(this);
    }

    function IDdetails() {
        //Add ID characteristics.
        this.clinicalTimelines.containers.IDdetails.selectAll('div.characteristic')
            .data(this.config.id_characteristics)
            .enter()
            .append('div')
            .classed('ct-characteristic', true)
            .html(function(d) {
                return d.label + ": <span id = '" + d.value_col + "'></span>";
            });
    }

    function controlGroupLayout() {
        var context = this;

        this.controls.wrap.selectAll('.control-group').each(function(d) {
            var controlGroup = d3.select(this),
                label = controlGroup.selectAll('.wc-control-label, .control-label'),
                description = controlGroup.select('.span-description'),
                container = controlGroup.append('div').classed('ct-label-description', true);

            controlGroup.attr('class', controlGroup.attr('class') + ' ' + d.type);

            container.node().appendChild(label.node());
            container.node().appendChild(description.node());

            //Add horizontal rule to group controls and filters.
            if (d.value_col === context.config.id_col)
                context.controls.wrap
                    .insert('div', ':first-child')
                    .classed('ct-controls ct-horizontal-rule', true)
                    .text('Controls');
            else if (
                (context.config.groupings.length && d.option === 'y.groupingLabel') ||
                (!context.config.groupings.length && d.option === 'y.sort')
            ) {
                var filterRule = context.controls.wrap
                    .append('div')
                    .classed('ct-filters ct-horizontal-rule', true)
                    .text('Filters');
                context.controls.wrap.node().insertBefore(filterRule.node(), this.nextSibling);
            }
        });
    }

    function drawIDtimeline() {
        var _this = this;

        //Hide population details.
        this.clinicalTimelines.containers.populationDetails.classed('ct-hidden', true);

        //Display ID information.
        this.clinicalTimelines.containers.IDdetails.classed('ct-hidden', false);

        //Hide reference line table.
        if (this.config.reference_lines)
            this.config.reference_lines.forEach(function(reference_line) {
                reference_line.tableContainer.remove();
            });

        //Hide clinical timelines.
        this.wrap.select('svg.wc-svg').classed('ct-hidden', true);

        //Define ID data.
        var longIDdata = this.long_data.filter(function(di) {
            return di[_this.config.id_col] === _this.selected_id;
        });
        var wideIDdata = this.wide_data.filter(function(di) {
            return di[_this.config.id_col] === _this.selected_id;
        });

        //Draw ID characteristics.
        if (this.config.id_characteristics) {
            var id_characteristics = this.initial_data.filter(function(d) {
                return d[_this.config.id_col] === _this.selected_id;
            })[0];
            this.clinicalTimelines.containers.IDdetails.selectAll('.ct-characteristic').each(
                function(d) {
                    d3
                        .select(this)
                        .select('span')
                        .text(id_characteristics[d.value_col]);
                }
            );
        }

        //Draw ID timeline.
        this.clinicalTimelines.containers.IDtimeline.classed('ct-hidden', false);
        this.clinicalTimelines.containers.IDtimeline.select('div')
            .selectAll('*')
            .remove();
        webcharts.multiply(
            this.IDtimeline,
            longIDdata.filter(function(d) {
                return _this.currentEventTypes !== 'All'
                    ? _this.currentEventTypes.indexOf(d[_this.config.event_col]) > -1
                    : true;
            }),
            this.config.event_col,
            this.config.color_dom,
            this.clinicalTimelines.test
        );

        //Draw ID detail listing.
        this.clinicalTimelines.containers.listing.classed('ct-hidden', false);
        this.clinicalTimelines.containers.listing
            .select('div')
            .selectAll('*')
            .remove();
        this.listing.init(
            wideIDdata.filter(function(d) {
                return _this.currentEventTypes !== 'All'
                    ? _this.currentEventTypes.indexOf(d[_this.config.event_col]) > -1
                    : true;
            }),
            this.clinicalTimelines.test
        );
    }

    function eventHighlighting(select, d) {
        //Update event highlighting settings.
        this.config.event_highlighted = d3
            .select(select)
            .select('option:checked')
            .text();
        this.IDtimeline.config.event_highlighted = this.config.event_highlighted;

        //Redraw.
        if (this.selected_id) drawIDtimeline.call(this);
        else this.draw();
    }

    function timeScale(dropdown, d) {
        //Update clinical timelines time scale settings
        this.config.time_scale = d3
            .select(dropdown)
            .select('option:checked')
            .text();
        syncTimeScaleSettings(this.config);

        //Hide other time range dropdown.
        if (!this.selected_id) hideTimeRangeControl.call(this);

        //Update time range settings.
        this.time_range = this[this.config.time_scale.toLowerCase() + '_range'];

        //Update ID timeline time scale settings
        this.IDtimeline.config.time_scale = this.config.time_scale;
        syncTimeScaleSettings(this.IDtimeline.config);

        //Remove records without time data.
        cleanData.call(this);

        //Redefine data.
        defineData.call(this);

        //Redraw.
        if (this.selected_id) drawIDtimeline.call(this);
        else this.draw();
    }

    function timeRange(dropdown, d) {
        var label = d3
            .select(dropdown)
            .selectAll('option')
            .filter(function() {
                return this.selected;
            })
            .text();
        var time_range = this.config[this.config.time_scale.toLowerCase() + '_ranges'].find(
            function(di) {
                return di.label === label;
            }
        );
        this[this.config.time_scale.toLowerCase() + '_range'] = time_range.domain.slice();
        this.time_range = time_range.domain.slice();

        //Remove records without time data.
        cleanData.call(this);

        //Redefine data.
        defineData.call(this);

        //Redraw.
        if (this.selected_id) drawIDtimeline.call(this);
        else this.draw();
    }

    function yAxisGrouping(select, d) {
        var selected = d3.select(select).select('option:checked');

        //Update grouping settings.
        if (selected.text() !== 'None') {
            this.config.y.grouping = this.config.groupings.find(function(grouping) {
                return grouping.label === selected.text();
            }).value_col;
            this.config.y.groupingLabel = selected.text();
        } else {
            delete this.config.y.grouping;
            this.config.y.groupingLabel = 'Event Types';
        }

        //Redraw.
        this.draw();
    }

    function augmentOtherControls() {
        var context = this;
        var controls = this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.type !== 'subsetter';
            })
            .classed('ct-control', true)
            .attr('id', function(d) {
                return 'control-' + d.option.replace('.', '-');
            });

        //Redefine event highlighting event listener.
        controls
            .filter(function(d) {
                return d.option === 'event_highlighted';
            })
            .select('select')
            .on('change', function(d) {
                eventHighlighting.call(context, this, d);
            });

        //Redefine time scale event listener.
        controls
            .filter(function(d) {
                return d.option === 'time_scale';
            })
            .select('select')
            .on('change', function(d) {
                timeScale.call(context, this, d);
            });

        //Redefine time range event listener.
        controls
            .filter(function(d) {
                return d.option.indexOf('time_range') > -1;
            })
            .selectAll('select')
            .each(function(d) {
                //add event listener
                d3.select(this).on('change', function(d) {
                    timeRange.call(context, this, d);
                });
            });

        //Redefine y-axis grouping event listener.
        controls
            .filter(function(d) {
                return d.option === 'y.groupingLabel';
            })
            .select('select')
            .on('change', function(d) {
                yAxisGrouping.call(context, this, d);
            });
    }

    function onChange(input, d) {
        var _this = this;

        var time_range = this.config.time_scale.toLowerCase() + '_range';
        var increment = this.config.time_scale === 'Date' ? 24 * 60 * 60 * 1000 : 1;

        //User input.
        var inputValue =
            this.config.time_scale === 'Date'
                ? d3.time.format('%Y-%m-%d').parse(input.value)
                : +input.value;

        //handle invalid inputs
        if (d.index === 0 && inputValue >= this[time_range][1])
            inputValue =
                this.config.time_scale === 'Date'
                    ? new Date(this[time_range][1].getTime() - increment)
                    : this[time_range][1] - increment;
        else if (d.index === 1 && inputValue <= this[time_range][0])
            inputValue =
                this.config.time_scale === 'Date'
                    ? new Date(this[time_range][0].getTime() + increment)
                    : (inputValue = this[time_range][0] + increment);

        //Update time range.
        this[time_range][d.index] = inputValue;
        this.time_range = this[time_range];

        //Update custom time range setting.
        var customTimeRange = this.config[time_range + 's'].find(function(d) {
            return d.label === 'User Input';
        });
        customTimeRange.domain = this.time_range.slice();

        //Update time range control.
        this.controls.wrap
            .selectAll('.control-group')
            .filter(function(d) {
                return d.option === _this.config.time_scale.toLowerCase() + '_time_range';
            })
            .selectAll('option')
            .property('selected', function() {
                return this.value === 'User Input';
            })
            .filter(function() {
                return this.value === 'User Input';
            })
            .datum(customTimeRange.time_range);

        this.draw();
    }

    function timeRangeControl(datum) {
        var context = this,
            timeRangeContainer = this.controls.wrap
                .insert('div', '#control-y-sort')
                .datum(datum)
                .classed('control-group ct-time-range ct-control', true)
                .attr('id', function(d) {
                    return 'control-' + d.option.replace(/\./g, '-');
                }),
            timeRangeInput = timeRangeContainer.append('input').classed('changer', true),
            timeRangeLabelDescription = timeRangeContainer
                .append('div')
                .classed('ct-label-description', true);

        //Add control label and span description nodes.
        timeRangeLabelDescription.append('span').classed('wc-control-label', true);
        timeRangeLabelDescription
            .append('span')
            .classed('span-description', true)
            .text(function(d) {
                return d.description;
            });

        //Add event listener to input node.
        timeRangeInput.on('change', function(d) {
            onChange.call(context, this, d);
        });
    }

    function addTimeRangeControls() {
        //Start
        timeRangeControl.call(this, {
            index: 0,
            option: 'x.domain.0',
            label: '',
            description: 'Start'
        });

        //End
        timeRangeControl.call(this, {
            index: 1,
            option: 'x.domain.1',
            label: '',
            description: 'End'
        });
    }

    function IDchange(select) {
        var _this = this;

        this.selected_id = d3
            .select(select)
            .select('option:checked')
            .text();
        this.filters.filter(function(filter) {
            return filter.col === _this.config.id_col;
        })[0].val = this.selected_id;

        //Redraw.
        if (this.selected_id !== 'All') {
            drawIDtimeline.call(this);
        } else {
            delete this.selected_id;

            //Display population details.
            this.clinicalTimelines.containers.populationDetails.classed('ct-hidden', false);

            //Hide ID information.
            this.clinicalTimelines.containers.IDdetails.classed('ct-hidden', true);

            //Hide clinical timelines.
            this.wrap.select('svg.wc-svg').classed('ct-hidden', false);
            this.draw();

            //Hide ID timeline.
            this.clinicalTimelines.containers.IDtimeline.select('div')
                .selectAll('*')
                .remove();
            this.clinicalTimelines.containers.IDtimeline.classed('ct-hidden', true);

            //Draw ID detail listing.
            this.clinicalTimelines.containers.listing
                .select('div')
                .selectAll('*')
                .remove();
            this.clinicalTimelines.containers.listing.classed('ct-hidden', true);
        }

        //Update controls given the current view.
        enableDisableControls.call(this);
    }

    function eventTypeChange(select) {
        var _this = this;

        this.currentEventTypes = d3
            .select(select)
            .selectAll('select option:checked')
            .pop()
            .map(function(d) {
                return d.textContent;
            });
        this.filters.filter(function(filter) {
            return filter.col === _this.config.event_col;
        })[0].val = this.currentEventTypes;
        this.wrap.selectAll('.legend-item').classed('ct-selected', function(d) {
            return _this.currentEventTypes.indexOf(d.label) > -1;
        });

        if (this.selected_id) drawIDtimeline.call(this);
        else this.draw();
    }

    function augmentFilters() {
        var _this = this;

        var context = this;
        var controls = this.controls.wrap
                .selectAll('.control-group')
                .filter(function(d) {
                    return d.type === 'subsetter';
                })
                .classed('ct-filter', true)
                .attr('id', function(d) {
                    return 'filter-' + d.value_col;
                })
                .classed('ct-ID', function(d) {
                    return d.value_col === _this.config.id_col;
                }),
            IDfilter = controls.filter(function(filter) {
                return filter.value_col === _this.config.id_col;
            }),
            eventTypeFilter = controls.filter(function(filter) {
                return filter.value_col === _this.config.event_col;
            });

        IDfilter.select('select').on('change', function(d) {
            IDchange.call(context, this);
        });

        eventTypeFilter.selectAll('select.changer option').property('selected', function(di) {
            return context.currentEventTypes instanceof Array
                ? context.currentEventTypes.indexOf(di) > -1
                : true;
        });
        eventTypeFilter.select('select').on('change', function(d) {
            eventTypeChange.call(context, this);
        });
    }

    function topXaxis() {
        this.svg
            .append('g')
            .classed('x-top axis linear', true)
            .append('text')
            .classed('axis-title top', true);
    }

    function onLayout() {
        //Lay out details container.
        IDdetails.call(this);

        //Move control labels and descriptions inside a div to display them vertically, label on top of description.
        controlGroupLayout.call(this);

        //Add additional functionality to other control event listeners.
        augmentOtherControls.call(this);

        //Hide other time range dropdown.
        hideTimeRangeControl.call(this);

        //Add time range functionality.
        addTimeRangeControls.call(this);

        //Add additional functionality to filter event listeners.
        augmentFilters.call(this);

        //Add top x-axis.
        topXaxis.call(this);
    }

    function updateTimeRangeControls$1() {
        var _this = this;

        var timeRangeControls = this.controls.wrap.selectAll('.ct-time-range input');

        //Internet Explorer does not support input date type.
        timeRangeControls.property(
            'type',
            !this.clinicalTimelines.document.documentMode
                ? this.config.time_scale === 'Date' ? 'date' : 'number'
                : 'text'
        );

        timeRangeControls.property('value', function(d) {
            return _this.config.time_scale === 'Date'
                ? d3.time.format(_this.config.date_format)(_this.time_range[d.index])
                : +_this.time_range[d.index];
        });
    }

    function defineFilteredData() {
        var _this = this;

        //Redefine filtered data as it defaults to the final mark drawn, which might be filtered in
        //addition to the current filter selections.
        this.filtered_long_data = this.long_data.filter(function(d) {
            var filtered = false;

            _this.filters.forEach(function(di) {
                if (filtered === false && di.val !== 'All') {
                    filtered =
                        di.val instanceof Array
                            ? di.val.indexOf(d[di.col]) === -1
                            : di.val !== d[di.col];
                }
            });

            return !filtered;
        });
        this.raw_data = this.filtered_long_data;

        //Define subset of original raw data.
        this.filtered_wide_data = this.wide_data.filter(function(d) {
            var filtered = false;

            _this.filters.forEach(function(di) {
                if (filtered === false && di.val !== 'All') {
                    filtered =
                        di.val instanceof Array
                            ? di.val.indexOf(d[di.col]) === -1
                            : di.val !== d[di.col];
                }
            });

            return !filtered;
        });
    }

    function updatePopulationDetails() {
        this.clinicalTimelines.containers.popCurrentFilters.html(
            "<span class = 'ct-stats ct-sample'>" +
                this.populationDetails.n +
                "</span> of <span class = 'ct-stats'>" +
                this.populationDetails.N +
                '</span> ' +
                (this.populationDetails.N > 1 ? this.config.id_unitPlural : this.config.id_unit) +
                " (<span class = 'ct-stats'>" +
                d3.format('%')(this.populationDetails.rate) +
                "</span>) <span class = 'ct-info-icon' title = 'These " +
                this.config.id_unitPlural +
                " have data that meet the current filter criteria.'>&#9432;</span>"
        );
        this.clinicalTimelines.containers.popInsideTimeRange.html(
            this.populationDetails.nInsideTimeRange < this.populationDetails.n
                ? "<span class = 'ct-stats ct-sample-inside-time-range'>" +
                  this.populationDetails.nInsideTimeRange +
                  "</span> of <span class = 'ct-stats ct-sample'>" +
                  this.populationDetails.n +
                  "</span> displayed (<span class = 'ct-stats'>" +
                  d3.format('%')(this.populationDetails.rateInsideTimeRange) +
                  "</span>) <span class = 'ct-info-icon' title = 'These " +
                  this.config.id_unitPlural +
                  " have events that occur in the current time range.'>&#9432;</span>"
                : ''
        );
        this.clinicalTimelines.containers.popOutsideTimeRange.html(
            this.populationDetails.nOutsideTimeRange
                ? "<span class = 'ct-stats ct-sample-outside-time-range'>" +
                  this.populationDetails.nOutsideTimeRange +
                  "</span> of <span class = 'ct-stats ct-sample'>" +
                  this.populationDetails.n +
                  "</span> hidden (<span class = 'ct-stats'>" +
                  d3.format('%')(this.populationDetails.rateOutsideTimeRange) +
                  "</span>) <span class = 'ct-info-icon' title = 'These " +
                  this.config.id_unitPlural +
                  " do not have events that occur in the current time range.'>&#9432;</span>"
                : ''
        );
    }

    function definePopulationDetails() {
        var _this = this;

        //Define sample given current filters.
        this.populationDetails.sample = d3
            .set(
                this.filtered_wide_data.map(function(d) {
                    return d[_this.config.id_col];
                })
            )
            .values()
            .map(function(ID) {
                var IDobject = {
                    ID: ID,
                    data: _this.filtered_wide_data.filter(function(d) {
                        return ID === d[_this.config.id_col];
                    })
                };

                IDobject.dataInsideTimeRange = IDobject.data.filter(function(d) {
                    var st = _this.config.time_function(d[_this.config.st_col]),
                        en = _this.config.time_function(d[_this.config.en_col]),
                        stInsideTimeRange =
                            _this.config.x.domain[0] <= st && st <= _this.config.x.domain[1],
                        // start is within the time range
                        enInsideTimeRange =
                            _this.config.x.domain[0] <= en && en <= _this.config.x.domain[1],
                        // end is within the time range
                        surroundingTimeRange =
                            _this.config.x.domain[0] > st && en > _this.config.x.domain[1]; // start is prior to time range and end is after time range

                    return stInsideTimeRange || enInsideTimeRange || surroundingTimeRange;
                });

                return IDobject;
            });
        this.populationDetails.n = this.populationDetails.sample.length;
        this.populationDetails.rate = this.populationDetails.n / this.populationDetails.N;

        //Define sample given current filters of IDs with an event inside the current time range.
        this.populationDetails.sampleInsideTimeRange = this.populationDetails.sample
            .filter(function(d) {
                return d.dataInsideTimeRange.length;
            })
            .map(function(d) {
                return d.ID;
            });
        this.populationDetails.nInsideTimeRange = this.populationDetails.sampleInsideTimeRange.length;
        this.populationDetails.rateInsideTimeRange =
            this.populationDetails.nInsideTimeRange / this.populationDetails.n;

        //Define sample given current filters of IDs without an event inside the current time range.
        this.populationDetails.sampleOutsideTimeRange = this.populationDetails.sample
            .filter(function(d) {
                return !d.dataInsideTimeRange.length;
            })
            .map(function(d) {
                return d.ID;
            });
        this.populationDetails.nOutsideTimeRange = this.populationDetails.sampleOutsideTimeRange.length;
        this.populationDetails.rateOutsideTimeRange =
            this.populationDetails.nOutsideTimeRange / this.populationDetails.n;

        //Update population details.
        updatePopulationDetails.call(this);
    }

    function defineDataInsideTimeRange() {
        var _this = this;

        this.longDataInsideTimeRange = this.filtered_long_data.filter(function(d) {
            return (
                _this.populationDetails.sampleInsideTimeRange.indexOf(d[_this.config.id_col]) > -1
            );
        });
        this.raw_data = this.longDataInsideTimeRange;
        this.wideDataInsideTimeRange = this.filtered_wide_data.filter(function(d) {
            return (
                _this.populationDetails.sampleInsideTimeRange.indexOf(d[_this.config.id_col]) > -1
            );
        });
    }

    function defineGroupingData() {
        var _this = this;

        if (this.config.y.grouping) {
            //Capture each grouping and corresponding array of IDs.
            this.groupings = d3
                .set(
                    this.longDataInsideTimeRange.map(function(d) {
                        return d[_this.config.y.grouping];
                    })
                )
                .values()
                .sort()
                .map(function(d, i) {
                    var groupingObject = {
                        key: d,
                        IDs: []
                    };

                    if (_this.config.grouping_direction === 'horizontal') {
                        //Define datum for each grouping that looks like actual data.
                        for (var variable in _this.raw_data[0]) {
                            if (
                                [
                                    _this.config.id_col,
                                    _this.config.event_col,
                                    _this.config.seq_col,
                                    _this.config.y.grouping
                                ].indexOf(variable) === -1
                            )
                                groupingObject[variable] = '';
                            else if (variable === _this.config.id_col)
                                groupingObject[_this.config.id_col] = d;
                            else if (variable === _this.config.event_col)
                                groupingObject[_this.config.event_col] = 'Grouping';
                            else if (variable === _this.config.seq_col)
                                groupingObject[_this.config.seq_col] = '1';
                            else if (variable === _this.config.y.grouping)
                                groupingObject[_this.config.y.grouping] = d;
                        }

                        //Define both a start and end datum.
                        var groupingStart = clone(groupingObject),
                            groupingEnd = clone(groupingObject);

                        if (_this.config.time_scale === 'Date') {
                            groupingStart.wc_value = _this.full_date_range[0];
                            groupingEnd.wc_value = _this.full_date_range[0];
                        } else {
                            groupingStart.wc_value = _this.full_day_range[0];
                            groupingEnd.wc_value = _this.full_day_range[0];
                        }

                        //Push two start and two end data to raw_data to create space to annotate grouping.
                        var groupingStart1 = clone(groupingStart),
                            groupingStart2 = clone(groupingStart),
                            groupingEnd1 = clone(groupingEnd),
                            groupingEnd2 = clone(groupingEnd);

                        //Placeholder row in which to print grouping.
                        groupingStart1[_this.config.id_col] = '-g' + i + '-';
                        _this.raw_data.push(groupingStart1);
                        _this.longDataInsideTimeRange.push(groupingStart1);

                        groupingEnd1[_this.config.id_col] = '-g' + i + '-';
                        _this.raw_data.push(groupingEnd1);
                        _this.longDataInsideTimeRange.push(groupingEnd1);
                    }

                    return groupingObject;
                });
        } else delete this.groupings;
    }

    function sortYdomain() {
        var _this = this;

        /**-------------------------------------------------------------------------------------------\
          Sort y-domain by the earliest event of each ID.
        \-------------------------------------------------------------------------------------------**/
        if (this.config.y.sort === 'By Earliest Event') {
            if (this.config.y.grouping) {
                //Sort IDs by grouping then earliest event if y-axis is grouped.
                var nestedData = d3
                    .nest()
                    .key(function(d) {
                        return d[_this.config.y.grouping] + '|' + d[_this.config.id_col];
                    })
                    .rollup(function(d) {
                        return d3.min(d, function(di) {
                            return _this.config.time_function(di.wc_value);
                        });
                    })
                    .entries(this.longDataInsideTimeRange)
                    .sort(function(a, b) {
                        var aGrouping = a.key.split('|')[0];
                        var bGrouping = b.key.split('|')[0];
                        var earliestEventSort =
                            a.values > b.values
                                ? -2
                                : a.values < b.values ? 2 : a.key > b.key ? -1 : 1;

                        return aGrouping > bGrouping
                            ? -1
                            : aGrouping < bGrouping ? 1 : earliestEventSort;
                    }); // nest data by grouping and ID.

                //Capture list of IDs by grouping.
                nestedData.forEach(function(d) {
                    var split = d.key.split('|');

                    _this.groupings
                        .filter(function(grouping) {
                            return grouping.key === split[0];
                        })
                        .pop()
                        .IDs.push(split[1]);
                });

                //Set y-domain.
                this.config.y.domain = nestedData.map(function(d) {
                    return d.key.split('|')[1];
                });
            } else {
                //Otherwise sort IDs by earliest event.
                this.config.y.domain = d3
                    .nest()
                    .key(function(d) {
                        return d[_this.config.id_col];
                    })
                    .rollup(function(d) {
                        return d3.min(d, function(di) {
                            return _this.config.time_function(di[_this.config.st_col]);
                        });
                    })
                    .entries(this.longDataInsideTimeRange)
                    .sort(function(a, b) {
                        var earliestEventSort =
                            a.values > b.values
                                ? -2
                                : a.values < b.values ? 2 : a.key > b.key ? -1 : 1;

                        return earliestEventSort;
                    })
                    .map(function(d) {
                        return d.key;
                    });
            }
        } else {
            /**-------------------------------------------------------------------------------------------\
            Sort y-domain alphanumerically.
            \-------------------------------------------------------------------------------------------**/

            if (this.config.y.grouping) {
                //Sort IDs by grouping then alphanumerically if y-axis is grouped.
                this.config.y.domain = d3
                    .set(
                        this.longDataInsideTimeRange.map(function(d) {
                            return d[_this.config.id_col];
                        })
                    )
                    .values()
                    .sort(function(a, b) {
                        var aGrouping = _this.raw_data.filter(function(d) {
                                return d[_this.config.id_col] === a;
                            })[0][_this.config.y.grouping],
                            bGrouping = _this.raw_data.filter(function(d) {
                                return d[_this.config.id_col] === b;
                            })[0][_this.config.y.grouping],
                            alphanumericSort = a > b ? -1 : 1;

                        return aGrouping > bGrouping
                            ? -1
                            : aGrouping < bGrouping ? 1 : alphanumericSort;
                    });

                this.config.y.domain.forEach(function(d) {
                    _this.groupings
                        .filter(function(grouping) {
                            return (
                                grouping.key ===
                                _this.raw_data.filter(function(di) {
                                    return di[_this.config.id_col] === d;
                                })[0][_this.config.y.grouping]
                            );
                        })
                        .pop()
                        .IDs.push(d);
                });
            } else {
                //Otherwise sort IDs alphanumerically.
                this.config.y.domain = this.populationDetails.sampleInsideTimeRange.sort(function(
                    a,
                    b
                ) {
                    var alphanumericSort = a > b ? -1 : 1;

                    return alphanumericSort;
                });
            }
        }
    }

    //If a tooltip variable is specified and exists, attach it to each mark's existing tooltip specification.
    function updateTooltipSettings() {
        var _this = this;

        if (this.raw_data.length > 0 && this.raw_data[0].hasOwnProperty(this.config.tooltip_col)) {
            this.config.marks.forEach(function(mark) {
                mark.tooltip = mark.tooltip + '\n[' + _this.config.tooltip_col + ']';
            });
            this.clinicalTimelines.settings.IDtimeline.marks.forEach(function(mark) {
                mark.tooltip = mark.tooltip + '\n[' + _this.config.tooltip_col + ']';
            });
        }
    }

    function onPreprocess() {
        //Set x-domain.
        this.config.x.domain = this.time_range;

        //Set x-domain.
        updateTimeRangeControls$1.call(this);

        //Define filtered data irrespective of individual mark filtering.
        defineFilteredData.call(this);

        //Define population details data.
        definePopulationDetails.call(this);

        //Define data inside time range.
        defineDataInsideTimeRange.call(this);

        //Insert dummy grouping data into data array to draw empty rows in which to annotate groupings.
        defineGroupingData.call(this);

        //Sort y-axis based on `Sort IDs` control selection.
        sortYdomain.call(this);

        //Add tooltip variable to mark tooltips.
        updateTooltipSettings.call(this);
    }

    function onDatatransform() {}

    function onDraw() {}

    function legendFilter() {
        var _this = this;

        //Filter data by clicking on legend.
        var context = this,
            eventTypeFilter = this.filters.filter(function(filter) {
                return filter.col === _this.config.event_col;
            })[0],
            // event type filter object
            eventTypeControl = this.controls.wrap.selectAll('.control-group').filter(function(d) {
                return d.description === 'Event Type';
            }),
            // event type control
            eventTypes = eventTypeControl.selectAll('.changer option').sort(function(a, b) {
                return _this.config.color_dom.indexOf(a) - _this.config.color_dom.indexOf(b);
            }),
            // event type options
            legendItems = this.wrap
                .selectAll('.legend-item')
                .classed('ct-button', true)
                .classed('ct-selected', function(d) {
                    return eventTypeFilter.val instanceof Array
                        ? eventTypeFilter.val.indexOf(d.label) > -1
                        : true;
                })
                .classed('ct-hidden', function(d) {
                    return d.label === 'None';
                }); // Remove None legend item; not sure why it's showing up.

        //Add event listener to legend items.
        legendItems.on('click', function(d) {
            var legendItem = d3.select(this),
                // clicked legend item
                selected = !legendItem.classed('ct-selected'); // selected boolean

            legendItem.classed('ct-selected', selected); // toggle selected class

            var selectedLegendItems = legendItems
                .filter(function() {
                    return d3.select(this).classed('ct-selected');
                })
                .data()
                .map(function(d) {
                    return d.label;
                }); // selected event types

            eventTypes
                .property('selected', false)
                .filter(function(d) {
                    return selectedLegendItems.indexOf(d) > -1;
                })
                .property('selected', true); // sync selected options in event type filter with selected legend items

            eventTypeFilter.val = selectedLegendItems; // update filter object
            context.currentEventTypes = selectedLegendItems;

            if (context.selected_id) drawIDtimeline.call(context);
            else context.draw();
        });
    }

    function timepoint(legendMark) {
        var x = 1;
        var y = 10;
        var width = 8;
        var height = 8;
        var margin = 2;
        legendMark
            .append('rect')
            .classed('ct-legend-mark', true)
            .attr({
                x: x + width * 0 + margin * 0,
                y: y - height / 2,
                width: width,
                height: height,
                fill: 'black'
            });
        //.append('animateTransform')
        //.attr({
        //    attributeName: 'transform',
        //    type: 'rotate',
        //    from: `0 ${x + width/2} ${y}`,
        //    to: `360 ${x + width/2} ${y}`,
        //    dur: '4s',
        //    repeatCount: 'indefinite'
        //});
        legendMark
            .append('circle')
            .classed('ct-legend-mark', true)
            .attr({
                cx: x + width * 1 + width / 2 + +margin * 1,
                cy: y,
                r: width / 2,
                fill: 'black'
            });
        legendMark
            .append('polygon')
            .classed('ct-legend-mark', true)
            .attr({
                points: [
                    [x + width * 2 + margin * 2, y - height / 2],
                    [x + width * 2 + margin * 2 + width, y],
                    [x + width * 2 + margin * 2, y + height / 2]
                ]
                    .map(function(point) {
                        return point.join(',');
                    })
                    .join(','),
                fill: 'black'
            });
        //.append('animateTransform')
        //.attr({
        //    attributeName: 'transform',
        //    type: 'rotate',
        //    from: `0 ${x + width*2 + 2 + width/2} ${y}`,
        //    to: `360 ${x + width*2 + 2 + width/2} ${y}`,
        //    dur: '4s',
        //    repeatCount: 'indefinite'
        //});
    }

    function timeInterval(legendMark) {
        var y = 10;
        legendMark
            .append('line')
            .classed('ct-legend-mark', true)
            .attr({
                x1: 4,
                x2: 26,
                y1: y,
                y2: y
            })
            .style({
                'stroke-width': 8,
                stroke: 'black',
                'stroke-linecap': 'round'
            });
        legendMark
            .append('circle')
            .classed('ct-legend-mark ct-start-stop-circle', true)
            .attr({
                cx: 5,
                cy: y,
                r: 2.5,
                fill: 'white',
                stroke: 'lightgray'
            });
        legendMark
            .append('circle')
            .classed('ct-legend-mark ct-start-stop-circle', true)
            .attr({
                cx: 25,
                cy: y,
                r: 2.5,
                fill: 'white',
                stroke: 'lightgray'
            });
    }

    function ongoingEvent(legendMark) {
        var y = 10;
        legendMark
            .append('line')
            .classed('ct-legend-mark', true)
            .attr({
                x1: 4,
                x2: 20,
                y1: y,
                y2: y
            })
            .style({
                'stroke-width': 8,
                stroke: 'black',
                'stroke-linecap': 'round'
            });
        legendMark
            .append('circle')
            .classed('ct-legend-mark ct-start-stop-circle', true)
            .attr({
                cx: 5,
                cy: y,
                r: 2.5,
                fill: 'white',
                stroke: 'lightgray'
            });
        legendMark
            .append('polygon')
            .classed('ct-legend-mark ct-ongoing-event', true)
            .attr({
                points: [[18, y - 6], [30, y], [18, y + 6]]
                    .map(function(point) {
                        return point.join(',');
                    })
                    .join(' '),
                fill: 'black',
                stroke: 'black'
            });
    }

    function addSecondLegend() {
        var context = this;
        var secondLegend = this.wrap.insert('ul', '.wc-svg').attr('id', 'ct-legend');
        secondLegend
            .selectAll('li')
            .data([
                { label: 'timepoint', function: timepoint },
                { label: 'time interval', function: timeInterval },
                { label: 'ongoing event', function: ongoingEvent }
            ])
            .enter()
            .append('li')
            .classed('ct-legend-item', true)
            .each(function(d) {
                var legendItem = d3.select(this);
                var legendMark = legendItem
                    .append('svg')
                    .classed('ct-legend-color-block', true)
                    .attr({
                        width: 36,
                        height: 16
                    });
                d.function.call(context, legendMark);
                var legendLabel = legendItem
                    .append('span')
                    .classed('ct-legend-label', true)
                    .text(d.label);
            });
    }

    function drawTopXaxis() {
        var topXaxis = d3.svg
                .axis()
                .scale(this.x)
                .orient('top')
                .ticks(this.xAxis.ticks()[0])
                .tickFormat(this.config.x_displayFormat)
                .innerTickSize(this.xAxis.innerTickSize())
                .outerTickSize(this.xAxis.outerTickSize()),
            topXaxisSelection = this.svg.select('g.x-top.axis').attr('class', 'x-top axis linear');
        topXaxisSelection.call(topXaxis);
        topXaxisSelection
            .select('text.axis-title.top')
            .attr({
                transform: 'translate(' + this.plot_width / 2 + ',' + -this.margin.top / 2 + ')',
                'text-anchor': 'middle'
            })
            .text(this.config.x.label);
    }

    function addTooltip() {
        var context = this;

        this.svg.select('title.ct-tooltip').remove();
        this.tooltip = this.svg.append('title').classed('ct-tooltip', true);
        this.svg.on('mousemove', function() {
            context.tooltip.text(
                '' + context.config.x_displayFormat(context.x.invert(d3.mouse(this)[0]))
            );
        });
    }

    function tickClick() {
        var _this = this;

        this.svg
            .selectAll('.y.axis .tick')
            .each(function(d) {
                if (/^-g\d+-/.test(d)) d3.select(this).remove();
            })
            .on('click', function(d) {
                _this.selected_id = d;

                drawIDtimeline.call(_this);
                enableDisableControls.call(_this);
                updateIDfilter.call(_this);
            })
            .append('title')
            .text(function(d) {
                return 'View a profile of ' + _this.config.id_unit + ' ' + d + '.';
            });
    }

    function horizontally() {
        var _this = this;

        this.groupings
            .sort(function(a, b) {
                return a.key < b.key ? -1 : 1;
            })
            .forEach(function(d, i) {
                if (d.IDs.length) {
                    var nIDs = d.IDs.length,
                        firstID = d.IDs[nIDs - 1],
                        y1 = _this.y(firstID),
                        y2 = _this.y(d.IDs[0]),
                        g = _this.svg
                            .append('g')
                            .classed('ct-grouping ct-horizontal', true)
                            .attr('id', d.key.replace(/ /g, '-')),
                        annotation = g
                            .append('text')
                            .classed('ct-annotation', true)
                            .attr({
                                x: 0,
                                y: y1,
                                dy: _this.y.rangeBand() * 1.25
                            })
                            .text(_this.config.y.groupingLabel + ': ' + d.key),
                        textArea = annotation.node().getBBox(),
                        background = g.insert('rect', ':first-child').attr({
                            x: textArea.x,
                            y: textArea.y,
                            width: textArea.width,
                            height: textArea.height,
                            fill: 'white'
                        }),
                        rule = g
                            .append('line')
                            .classed('ct-boundary ct-horizontal', true)
                            .attr({
                                x1: 0,
                                y1: y1 + _this.y.rangeBand() / 4,
                                x2: _this.plot_width,
                                y2: y1 + _this.y.rangeBand() / 4
                            });
                }
            });
    }

    function vertically() {
        var _this = this;

        this.groupings.forEach(function(d) {
            if (d.IDs.length) {
                var nIDs = d.IDs.length,
                    firstID = d.IDs[nIDs - 1],
                    y1 = _this.y(firstID),
                    y2 = _this.y(d.IDs[0]),
                    g = _this.svg
                        .append('g')
                        .classed('ct-grouping ct-vertical', true)
                        .attr('id', d.key.replace(/ /g, '-')),
                    topBoundary = g
                        .append('line')
                        .classed('ct-boundary ct-horizontal', true)
                        .attr({
                            x1: _this.plot_width,
                            x2: _this.plot_width + _this.margin.right / 8,
                            y1: y1 + 3 * _this.y.rangeBand() / 4,
                            y2: y1 + 3 * _this.y.rangeBand() / 4
                        }),
                    span = g
                        .append('line')
                        .classed('ct-boundary ct-vertical', true)
                        .attr({
                            x1: _this.plot_width + _this.margin.right / 8,
                            x2: _this.plot_width + _this.margin.right / 8,
                            y1: y1 + 3 * _this.y.rangeBand() / 4,
                            y2: y2 + _this.y.rangeBand()
                        }),
                    bottomBoundary = g
                        .append('line')
                        .classed('ct-boundary ct-horizontal', true)
                        .attr({
                            x1: _this.plot_width,
                            x2: _this.plot_width + _this.margin.right / 8,
                            y1: y2 + _this.y.rangeBand(),
                            y2: y2 + _this.y.rangeBand()
                        }),
                    annotation = g
                        .append('text')
                        .classed('ct-annotation', true)
                        .attr({
                            x: _this.plot_width,
                            dx: 4 * _this.margin.right / 8,
                            y: y1,
                            dy: _this.y.rangeBand()
                        })
                        .text(
                            _this.config.groupings.filter(function(grouping) {
                                return grouping.value_col === _this.config.y.grouping;
                            })[0].label +
                                ': ' +
                                d.key
                        );
            }
        });
    }

    function annotateGrouping() {
        //Clear grouping elements.
        this.svg.selectAll('.ct-grouping').remove();

        if (this.config.y.grouping) {
            if (this.config.grouping_direction === 'horizontal') horizontally.call(this);
            else if (this.config.grouping_direction === 'vertical') vertically.call(this);
        }
    }

    function addStriping() {
        var context = this;
        this.svg.selectAll('.ct-stripe').remove();
        var yAxisGridLines = this.svg.selectAll('.y.axis .tick').each(function(d, i) {
            //Offset tick label.
            d3
                .select(this)
                .select('text')
                .attr('dx', 4)
                .attr('dy', context.y.rangeBand() / 4);

            //Insert a rectangle with which to visually group each ID's events.
            d3
                .select(this)
                .insert('rect', ':first-child')
                .classed('ct-stripe', true)
                .attr({
                    id: d,
                    x: -context.margin.left + 1,
                    y: -context.config.marks[0].attributes['stroke-width'],
                    width: context.plot_width + context.margin.left,
                    height:
                        context.y.rangeBand() + context.config.marks[0].attributes['stroke-width']
                });
        });
    }

    function offsetCircles(mark, markData) {
        var _this = this;

        var context = this;

        this.svg.selectAll('g.point').attr('transform', null);

        if (this.raw_data.length && this.raw_data[0].hasOwnProperty(this.config.offset_col)) {
            this.svg.selectAll('g.point').each(function(d) {
                d3
                    .select(this)
                    .attr(
                        'transform',
                        'translate(0,' + d.offset * context.config.mark_thickness * 2 + ')'
                    );
            });
        } else {
            //Nest data by timepoint and filter on any nested object with more than one datum.
            var overlapping = d3
                .nest()
                .key(function(d) {
                    return d.total + '|' + d.values.raw[0][_this.config.id_col];
                })
                .rollup(function(d) {
                    return {
                        n: d.length,
                        keys: d.map(function(di) {
                            return di.key;
                        })
                    };
                })
                .entries(markData)
                .filter(function(d) {
                    return d.values.n > 1;
                });

            //For each timepoint with more than one event...
            overlapping.forEach(function(d) {
                var x = d.key.split('|')[0]; // timepoint
                var y = d.key.split('|')[1]; // ID

                //For each overlapping point...
                d.values.keys.forEach(function(di, i) {
                    //Capture point via its class name and offset vertically.
                    var className = di + ' point';
                    var g = d3.select(
                        _this.clinicalTimelines.document.getElementsByClassName(className)[0]
                    );
                    var point = g.select('circle');
                    g.attr('transform', 'translate(0,' + i * _this.config.mark_thickness * 2 + ')');
                });
            });
        }
    }

    function offsetLines(mark, markData) {
        var _this = this;

        var context = this;

        this.svg.selectAll('g.line').attr('transform', null);

        if (
            this.config.offset_col &&
            this.raw_data.length &&
            this.raw_data[0].hasOwnProperty(this.config.offset_col)
        ) {
            this.svg.selectAll('g.line').each(function(d) {
                d3
                    .select(this)
                    .attr(
                        'transform',
                        'translate(0,' + d.offset * context.config.mark_thickness * 2 + ')'
                    );
            });
        } else {
            //Nest data by time interval and filter on any nested object with more than one datum.
            var IDdata = d3
                .nest()
                .key(function(d) {
                    return d.values[0].values.raw[0][_this.config.id_col];
                })
                .key(function(d) {
                    return d.key;
                })
                .rollup(function(d) {
                    //Expose start and end point of line.
                    return _this.config.time_scale === 'Date'
                        ? {
                              x1: new Date(d[0].values[0].key),
                              x2: new Date(d[0].values[1].key)
                          }
                        : {
                              x1: +d[0].values[0].key,
                              x2: +d[0].values[1].key
                          };
                })
                .entries(
                    markData.filter(function(d) {
                        return d.values.length > 1;
                    })
                );

            //For each ID...
            IDdata.forEach(function(IDdatum) {
                var lineData = IDdatum.values;

                //Attach line x-coordinates to line object.
                lineData.forEach(function(lineDatum) {
                    lineDatum.x1 = lineDatum.values.x1;
                    lineDatum.x2 = lineDatum.values.x2;
                    delete lineDatum.values;
                });

                //Capture all line x-coordinates in an array.
                var lineCoordinates = lineData.map(function(di) {
                        return [di.x1, di.x2];
                    }),
                    overlappingLines = lineData
                        .filter(function(lineDatum) {
                            var overlap = lineCoordinates.filter(function(lineCoordinate) {
                                return (
                                    (lineCoordinate[0] <= lineDatum.x1 &&
                                        lineCoordinate[1] >= lineDatum.x1) ||
                                    (lineDatum.x1 <= lineCoordinate[0] &&
                                        lineDatum.x2 >= lineCoordinate[0]) ||
                                    (lineCoordinate[0] <= lineDatum.x2 &&
                                        lineCoordinate[1] >= lineDatum.x2) ||
                                    (lineDatum.x1 <= lineCoordinate[1] &&
                                        lineDatum.x2 >= lineCoordinate[1])
                                );
                            });

                            return overlap.length > 1;
                        })
                        .sort(function(a, b) {
                            var x1diff = a.x1 - b.x1,
                                x2diff = b.x2 - a.x2;
                            return x1diff !== 0
                                ? x1diff
                                : x2diff !== 0 ? x2diff : a.key < b.key ? -1 : 1;
                        });

                if (overlappingLines.length) {
                    var currentlyOverlappingLines = [];

                    //For each overlapping line...
                    overlappingLines.forEach(function(currentLine, i) {
                        if (i === 0) {
                            currentLine.offset = 0;
                            currentlyOverlappingLines.push(currentLine);
                        } else {
                            currentlyOverlappingLines.forEach(function(d) {
                                var currLapsPrevX1 =
                                        currentLine.x1 <= d.x1 && currentLine.x2 >= d.x1,
                                    currLapsPrevX2 =
                                        currentLine.x1 <= d.x2 && currentLine.x2 >= d.x2,
                                    currLapsPrev = currentLine.x1 <= d.x1 && currentLine.x2 >= d.x2,
                                    prevLapsCurrX1 =
                                        d.x1 <= currentLine.x1 && d.x2 >= currentLine.x1,
                                    prevLapsCurrX2 =
                                        d.x1 <= currentLine.x2 && d.x2 >= currentLine.x2,
                                    prevLapsCurr = d.x1 <= currentLine.x1 && d.x2 >= currentLine.x2;

                                d.overlapping =
                                    currLapsPrevX1 ||
                                    currLapsPrevX2 ||
                                    currLapsPrev ||
                                    prevLapsCurrX1 ||
                                    prevLapsCurrX2 ||
                                    prevLapsCurr;
                            });
                            var nOverlapping = currentlyOverlappingLines.filter(function(d) {
                                return d.overlapping;
                            }).length;

                            //if no lines are currently overlapping reset currently overlapping lines
                            if (nOverlapping === 0) {
                                currentLine.offset = 0;
                                currentlyOverlappingLines = [currentLine];
                            } else if (nOverlapping === currentlyOverlappingLines.length) {
                                //else if all lines are currently overlapping increase offset and add current line to currently overlapping lines
                                currentLine.offset =
                                    d3.max(currentlyOverlappingLines, function(d) {
                                        return d.offset;
                                    }) + 1;
                                currentlyOverlappingLines.push(currentLine);
                            } else {
                                //otherwise replace non-overlapping line with the smallest offset with current line
                                currentlyOverlappingLines.forEach(function(d, i) {
                                    d.index = i;
                                });
                                var minOffset = d3.min(
                                        currentlyOverlappingLines.filter(function(d) {
                                            return !d.overlapping;
                                        }),
                                        function(d) {
                                            return d.offset;
                                        }
                                    ),
                                    minIndex = currentlyOverlappingLines.filter(function(d) {
                                        return d.offset === minOffset;
                                    })[0].index;
                                currentLine.offset = minOffset;
                                currentlyOverlappingLines.splice(minIndex, 1, currentLine);
                            }
                        }

                        //Offset lines vertically.
                        var className = currentLine.key + ' line';
                        var g = d3.select(
                            _this.clinicalTimelines.document.getElementsByClassName(className)[0]
                        );
                        g.attr(
                            'transform',
                            currentLine.offset > 0
                                ? 'translate(0,' +
                                  currentLine.offset * _this.config.mark_thickness * 2 +
                                  ')'
                                : 'translate(0,0)'
                        );
                    });
                }
            });
        }
    }

    function offsetOverlappingMarks() {
        var _this = this;

        this.config.marks.forEach(function(mark, i) {
            var markData = _this.marks[i].data;

            //Identify marks which represent ongoing events.
            if (
                _this.config.ongo_col &&
                _this.raw_data.length &&
                _this.raw_data[0].hasOwnProperty(_this.config.ongo_col)
            )
                markData.forEach(function(d) {
                    d.ongoing =
                        mark.type === 'line'
                            ? d.values[0].values.raw[0][_this.config.ongo_col]
                            : d.values.raw[0][_this.config.ongo_col];
                });

            //Attach offset value to each mark datum.
            if (
                _this.config.offset_col &&
                _this.raw_data.length &&
                _this.raw_data[0].hasOwnProperty(_this.config.offset_col)
            )
                markData.forEach(function(d) {
                    d.offset =
                        mark.type === 'line'
                            ? d.values[0].values.raw[0][_this.config.offset_col]
                            : d.values.raw[0][_this.config.offset_col];
                });

            if (mark.type === 'line') offsetLines.call(_this, mark, markData);
            else if (mark.type === 'circle') offsetCircles.call(_this, mark, markData);
        });
    }

    function highlightMarks() {
        var _this = this;

        var context = this;

        //Clear line overlays.
        this.svg.selectAll('.ct-highlight-overlay').remove();

        //Highlight legend.
        this.wrap.selectAll('.legend-item').classed('ct-highlighted', function(d) {
            return d.label === _this.config.event_highlighted;
        });

        //Select marks.
        var highlightedMarks = this.svg
            .selectAll('.wc-data-mark, .ct-ongoing-event, .ct-custom-mark')
            .classed('ct-highlighted', function(d) {
                return d.key.indexOf(_this.config.event_highlighted) > -1;
            })
            .filter(function(d) {
                return d.key.indexOf(_this.config.event_highlighted) > -1;
            });

        //Highlight time intervals.
        var timeIntervals = highlightedMarks.filter(function() {
            return (
                this.tagName === 'path' && this.getAttribute('class').indexOf('highlighted') > -1
            );
        });
        timeIntervals.each(function(d, i) {
            var g = d3.select(this.parentNode);
            var x1 = context.x(context.config.time_function(d.values[0].key));
            var x2 =
                context.x(context.config.time_function(d.values[1].key)) +
                (d.ongoing === 'Y'
                    ? context.config.marks.find(function(mark) {
                          return mark.type === 'line';
                      }).attributes['stroke-width'] / 2
                    : 0);
            var y =
                context.y(
                    d.values[0].values.raw[0][
                        context.config.y.column === context.config.id_col
                            ? context.config.id_col
                            : context.config.seq_col
                    ]
                ) +
                context.y.rangeBand() / 2;
            var color = context.config.event_highlight_color;
            var line = g
                .append('line')
                .classed('ct-highlight-overlay', true)
                .attr({
                    x1: x1,
                    x2: x2,
                    y1: y,
                    y2: y,
                    stroke: color
                });
        });

        //Highlight timepoints.
        var timepoints = highlightedMarks.filter(function() {
            return (
                ['circle', 'polygon'].indexOf(this.tagName) > -1 &&
                this.getAttribute('class').indexOf('ct-highlighted') > -1 &&
                this.getAttribute('class').indexOf('ct-hidden') < 0 &&
                this.getAttribute('class').indexOf('ct-ongoing-event') < 0
            );
        });
        timepoints.attr({
            stroke: function stroke(d) {
                return _this.colorScale(d.values.raw[0][_this.config.event_col]);
            },
            fill: function fill(d) {
                return _this.config.event_highlight_color;
            }
        });
    }

    function drawOngoingMarks() {
        var _this = this;

        this.svg.selectAll('.ct-ongoing-event').remove();
        if (this.raw_data.length && this.raw_data[0].hasOwnProperty(this.config.ongo_col)) {
            var context = this;
            var lineSettings = this.config.marks.find(function(mark) {
                return mark.type === 'line';
            });

            this.svg
                .selectAll('.line-supergroup .line')
                .filter(function(d) {
                    return d.ongoing === _this.config.ongo_val;
                })
                .each(function(d) {
                    var g = d3.select(this);
                    var endpoint = d.values[1];
                    var x = context.x(context.config.time_function(endpoint.key));
                    var y = context.y(endpoint.values.y) + context.y.rangeBand() / 2;
                    var highlight = d.key.indexOf(context.config.event_highlighted) > -1;
                    var length =
                        x +
                        (highlight
                            ? lineSettings.attributes['stroke-width'] * 1.5
                            : lineSettings.attributes['stroke-width'] * 1.5);
                    var heightOffset = highlight
                        ? lineSettings.attributes['stroke-width'] * 2 / 3
                        : lineSettings.attributes['stroke-width'] * 2 / 3;
                    var arrow = [[length, y], [x, y - heightOffset], [x, y + heightOffset]];

                    g
                        .insert('polygon', 'line')
                        .datum(d)
                        .classed('ct-ongoing-event', true)
                        .classed('ct-highlighted', highlight)
                        .attr({
                            points: arrow
                                .map(function(coordinate) {
                                    return coordinate.join(',');
                                })
                                .join(' '),
                            fill: highlight
                                ? context.config.event_highlight_color
                                : context.colorScale(
                                      endpoint.values.raw[0][context.config.event_col]
                                  ),
                            stroke: context.colorScale(
                                endpoint.values.raw[0][context.config.event_col]
                            )
                        });
                });
        }
    }

    function addStartStopCircles() {
        var context = this;

        this.svg.selectAll('.ct-start-stop-circle').remove();
        this.svg.selectAll('g.line').each(function(d) {
            var g = d3.select(this);
            d.values
                .filter(function(di, i) {
                    return !(
                        i === 1 &&
                        di.values.raw[0][context.config.ongo_col] === context.config.ongo_val
                    );
                })
                .forEach(function(di) {
                    g
                        .append('circle')
                        .classed('ct-start-stop-circle', true)
                        .attr({
                            cx: context.x(di.values.x),
                            cy: context.y(di.values.y) + context.y.rangeBand() / 2,
                            r: context.config.mark_thickness * 2 / 5,
                            fill: 'white',
                            stroke: 'lightgray'
                        });
                });
        });
    }

    function drawPolygon(marks, event_symbol) {
        marks.each(function(d) {
            var g = d3.select(this);

            //clear out g
            g.select('circle').classed('ct-hidden', true);
            g.select('polygon.ct-custom-mark').remove();

            //define vertices
            var vertices = void 0;
            if (event_symbol.symbol === 'square')
                vertices = [
                    [d.symbolCoordinates.x1, d.symbolCoordinates.y1],
                    [d.symbolCoordinates.x1, d.symbolCoordinates.y3],
                    [d.symbolCoordinates.x3, d.symbolCoordinates.y3],
                    [d.symbolCoordinates.x3, d.symbolCoordinates.y1]
                ];
            else if (event_symbol.symbol === 'diamond')
                vertices = [
                    [d.symbolCoordinates.x1, d.symbolCoordinates.y2],
                    [d.symbolCoordinates.x2, d.symbolCoordinates.y3],
                    [d.symbolCoordinates.x3, d.symbolCoordinates.y2],
                    [d.symbolCoordinates.x2, d.symbolCoordinates.y1]
                ];
            else if (event_symbol.symbol === 'triangle') {
                if (event_symbol.direction === 'right')
                    vertices = [
                        [d.symbolCoordinates.x1, d.symbolCoordinates.y1],
                        [d.symbolCoordinates.x3, d.symbolCoordinates.y2],
                        [d.symbolCoordinates.x1, d.symbolCoordinates.y3]
                    ];
                else if (event_symbol.direction === 'down')
                    vertices = [
                        [d.symbolCoordinates.x1, d.symbolCoordinates.y1],
                        [d.symbolCoordinates.x3, d.symbolCoordinates.y1],
                        [d.symbolCoordinates.x2, d.symbolCoordinates.y3]
                    ];
                else if (event_symbol.direction === 'left')
                    vertices = [
                        [d.symbolCoordinates.x3, d.symbolCoordinates.y1],
                        [d.symbolCoordinates.x1, d.symbolCoordinates.y2],
                        [d.symbolCoordinates.x3, d.symbolCoordinates.y3]
                    ];
                else
                    vertices = [
                        [d.symbolCoordinates.x2, d.symbolCoordinates.y1],
                        [d.symbolCoordinates.x3, d.symbolCoordinates.y3],
                        [d.symbolCoordinates.x1, d.symbolCoordinates.y3]
                    ];
            }

            //draw polygon
            var polygon = g
                .append('polygon')
                .datum(d)
                .classed('ct-custom-mark', true)
                .attr({
                    points: vertices
                        .map(function(vertex) {
                            return vertex.join(',');
                        })
                        .join(' '),
                    fill: d.color
                });
        });
    }

    function addSymbols() {
        var _this = this;

        this.svg.selectAll('.ct-custom-mark').remove();
        if (this.config.event_symbols && this.config.event_symbols.length) {
            this.config.event_symbols.forEach(function(event_symbol) {
                var marks = _this.svg
                    .selectAll('g.point')
                    .filter(function(d) {
                        var event = d.values.raw[0][_this.config.event_col];
                        return (
                            (event_symbol.event === event ||
                                event_symbol.events.indexOf(event) > -1) && // point represents an event specified in the event symbol setting
                            _this.x_dom[0] <= d.total && // point is within current x-domain
                            d.total <= _this.x_dom[1] && // point is within current x-domain
                            _this.currentEventTypes.indexOf(event) > -1 // point represents a currently selected event type
                        );
                    })
                    .each(function(d) {
                        var x = _this.x(d.values.x);
                        var y = _this.y(d.values.y) + _this.y.rangeBand() / 2;
                        var sizeFactor = 1;
                        d.symbolCoordinates = {
                            x1: x - _this.config.mark_thickness * sizeFactor,
                            x2: x,
                            x3: x + _this.config.mark_thickness * sizeFactor,
                            y1: y - _this.config.mark_thickness * sizeFactor,
                            y2: y,
                            y3: y + _this.config.mark_thickness * sizeFactor
                        };
                        d.color = _this.colorScale(d.values.raw[0][_this.config.event_col]);
                    });

                drawPolygon.call(_this, marks, event_symbol);
            });
        }
    }

    function addSymbolsToLegend() {
        var _this = this;

        var context = this;

        if (this.config.event_symbols && this.config.event_symbols.length) {
            this.config.event_symbols.forEach(function(event_symbol) {
                var marks = _this.wrap
                    .selectAll('.legend .legend-color-block')
                    .filter(function(d) {
                        var event = d.label;
                        return (
                            event_symbol.event === event || event_symbol.events.indexOf(event) > -1
                        );
                    })
                    .each(function(d) {
                        var dimensions = this.getBBox();
                        var x = dimensions.x + dimensions.width / 2;
                        var y = dimensions.y + dimensions.height / 2;
                        d.symbolCoordinates = {
                            x1: x - dimensions.width / 2,
                            x2: x,
                            x3: x + dimensions.width / 2,
                            y1: y - dimensions.height / 2,
                            y2: y,
                            y3: y + dimensions.height / 2
                        };
                        d.color = context.colorScale(d.label);
                    });

                drawPolygon.call(_this, marks, event_symbol);
            });
        }
    }

    function offsetBottomXaxis() {
        if (!this.clinicalTimelines.test) {
            var //capture x-axis and its translation coordinates
                bottomXaxis = this.svg.select('.x.axis'),
                bottomXaxisTransform = bottomXaxis
                    .attr('transform')
                    .replace(/^translate\((.*)\)$/, '$1'),
                bottomXaxisTransformCoordinates =
                    bottomXaxisTransform.indexOf(',') > -1
                        ? bottomXaxisTransform.split(',')
                        : bottomXaxisTransform.split(' '),
                //capture x-axis title and its translation coordinates
                bottomXaxisTitle = bottomXaxis.select('.axis-title'),
                bottomXaxisTitleTransform = bottomXaxisTitle
                    .attr('transform')
                    .replace(/^translate\((.*)\)$/, '$1'),
                bottomXaxisTitleTransformCoordinates =
                    bottomXaxisTitleTransform.indexOf(',') > -1
                        ? bottomXaxisTitleTransform.split(',')
                        : bottomXaxisTitleTransform.split(' ');

            //offset x-axis
            bottomXaxis.attr(
                'transform',
                'translate(' +
                    +bottomXaxisTransformCoordinates[0] +
                    ',' +
                    (+bottomXaxisTransformCoordinates[1] + this.y.rangeBand()) +
                    ')'
            );

            //offset x-axis title
            bottomXaxisTitle.attr(
                'transform',
                'translate(' +
                    +bottomXaxisTitleTransformCoordinates[0] +
                    ',' +
                    (+bottomXaxisTitleTransformCoordinates[1] - 7 * this.margin.bottom / 16) +
                    ')'
            );
        }
    }

    function addVisibleLine(reference_line) {
        reference_line.visibleLine = reference_line.g
            .append('line')
            .datum(reference_line.lineDatum)
            .classed('ct-visible-reference-line', true)
            .attr({
                x1: function x1(d) {
                    return d.x1;
                },
                x2: function x2(d) {
                    return d.x2;
                },
                y1: function y1(d) {
                    return d.y1;
                },
                y2: function y2(d) {
                    return d.y2;
                }
            });
    }

    function addHoverLine(reference_line) {
        reference_line.hoverLine = reference_line.g
            .append('line')
            .datum(reference_line.lineDatum)
            .classed('ct-hover-line', true)
            .attr({
                x1: function x1(d) {
                    return d.x1;
                },
                x2: function x2(d) {
                    return d.x2;
                },
                y1: function y1(d) {
                    return d.y1;
                },
                y2: function y2(d) {
                    return d.y2;
                }
            });
    }

    function updateText(reference_line) {
        reference_line.textDirection =
            reference_line.lineDatum.x1 <= this.plot_width / 2 ? 'right' : 'left';
        reference_line.text
            .attr({
                x: reference_line.lineDatum.x1,
                dx: reference_line.textDirection === 'right' ? 20 : -25,
                'text-anchor': reference_line.textDirection === 'right' ? 'beginning' : 'end'
            })
            .text(reference_line.label);
    }

    function addText(reference_line) {
        reference_line.text = reference_line.g
            .append('text')
            .classed('ct-reference-line-text', true);
        updateText.call(this, reference_line);
    }

    function addHover(reference_line) {
        var context = this;

        //Hide reference labels initially.
        reference_line.text.classed('ct-hidden', true);

        //Add event listeners to hover reference line.
        reference_line.hoverLine
            .on('mouseover', function() {
                reference_line.visibleLine.classed('ct-hover', true);
                reference_line.text.classed('ct-hidden', false).attr('y', d3.mouse(this)[1]);
                context.svg.node().appendChild(reference_line.text.node());
            })
            .on('mouseout', function() {
                reference_line.visibleLine.classed('ct-hover', false);
                reference_line.text.classed('ct-hidden', true);
            });
    }

    function updateTable(reference_line) {
        var _this = this;

        //Update reference table header.
        reference_line.tableHeader.text(reference_line.label);

        //Filter data on events that overlap reference line.
        reference_line.wide_data = this.filtered_wide_data.filter(function(d) {
            return (
                _this.config.time_function(d[_this.config.st_col]) <=
                    _this.config.time_function(reference_line.timepoint) &&
                _this.config.time_function(d[_this.config.en_col]) >=
                    _this.config.time_function(reference_line.timepoint)
            );
        });

        //Nest data by grouping and event type.
        reference_line.nested_data = d3
            .nest()
            .key(function(d) {
                return d[_this.config.y.grouping] || 'All ' + _this.config.id_unitPlural;
            })
            .key(function(d) {
                return d[_this.config.event_col];
            })
            .rollup(function(d) {
                return d.length;
            })
            .entries(reference_line.wide_data);
        reference_line.flattened_data = [];
        reference_line.nested_data.forEach(function(d) {
            reference_line.flattened_data.push({
                class: 'ct-higher-level',
                key: d.key,
                n: d3.sum(d.values, function(di) {
                    return di.values;
                })
            });
            d.values.forEach(function(di) {
                reference_line.flattened_data.push({
                    class: 'ct-lower-level',
                    key: di.key,
                    n: di.values
                });
            });
        });

        //Update table.
        reference_line.table.selectAll('tr').remove();
        reference_line.table
            .selectAll('tr')
            .data(reference_line.flattened_data)
            .enter()
            .append('tr')
            .each(function(d) {
                var row = d3.select(this);
                row
                    .append('td')
                    .text(d.key)
                    .attr('class', function(d) {
                        return d.class + (d.class === 'ct-lower-level' ? ' ct-indent' : '');
                    });
                row
                    .append('td')
                    .text(d.n)
                    .attr('class', function(d) {
                        return d.class;
                    });
            });
    }

    function addDrag(reference_line) {
        var context = this,
            drag = d3.behavior
                .drag()
                .origin(function(d) {
                    return d;
                })
                .on('dragstart', function() {
                    d3.select(this).classed('ct-active', true);
                })
                .on('drag', function() {
                    var dx = d3.event.dx;

                    //Calculate x-coordinate of drag line.
                    var x = parseInt(reference_line.hoverLine.attr('x1')) + dx;
                    if (x < 0) x = 0;
                    if (x > context.plot_width) x = context.plot_width;

                    //Invert x-coordinate with x-scale.
                    var xInverted = context.x.invert(x);

                    //Update reference line datum.
                    reference_line.timepoint = context.config.x_parseFormat(xInverted);
                    reference_line.label = context.config.x_displayFormat(xInverted);
                    reference_line.lineDatum.x1 = x;
                    reference_line.lineDatum.x2 = x;
                    reference_line.visibleLine.attr({ x1: x, x2: x });
                    reference_line.hoverLine.attr({ x1: x, x2: x });

                    //Update reference line text label and table.
                    updateText.call(context, reference_line);
                    updateTable.call(context, reference_line);
                })
                .on('dragend', function() {
                    d3.select(this).classed('ct-active', false);
                });

        reference_line.hoverLine.call(drag);
    }

    function drawReferenceLine(reference_line, i) {
        reference_line.g = this.referenceLinesGroup
            .append('g')
            .classed('ct-reference-line', true)
            .attr('id', 'ct-reference-line-' + i);
        reference_line.timepointN = this.config.time_function(reference_line.timepoint);
        reference_line.lineDatum = {
            x1: this.x(reference_line.timepointN),
            x2: this.x(reference_line.timepointN),
            y1: 0,
            y2:
                this.plot_height +
                (this.config.y.column === this.config.id_col ? this.y.rangeBand() : 0)
        };

        //Visible reference line, drawn between the overlay and the marks
        addVisibleLine.call(this, reference_line);

        //Invisible reference line, without a dasharray and much thicker to make hovering easier
        addHoverLine.call(this, reference_line);

        //Reference line text label
        addText.call(this, reference_line);

        //Display reference line label on hover.
        addHover.call(this, reference_line);

        //Make line draggable.
        if (!this.parent) addDrag.call(this, reference_line);
    }

    function drawReferenceTable(reference_line, i) {
        //Add reference line table container.
        if (reference_line.tableContainer) reference_line.tableContainer.remove();
        reference_line.tableContainer = this.clinicalTimelines.containers.leftColumn
            .append('div')
            .classed('ct-reference-line-table-container', true)
            .attr('id', 'ct-reference-line-table-container-' + i);

        //Add reference line table header.
        reference_line.tableHeader = reference_line.tableContainer
            .append('h3')
            .classed('ct-reference-line-header', true);

        //Add reference line table.
        reference_line.table = reference_line.tableContainer
            .append('div')
            .classed('ct-reference-line-table-body', true)
            .append('table')
            .append('tbody');

        //Add table data.
        updateTable.call(this, reference_line);
    }

    function drawReferenceLines() {
        var _this = this;

        if (this.config.reference_lines) {
            //Remove previously reference lines and tables.
            this.svg.select('.ct-reference-lines').remove();
            this.clinicalTimelines.containers.leftColumn
                .selectAll('.ct-reference-line-label-container')
                .remove();

            //Add group for reference lines.
            this.svg.select('.ct-reference-lines').remove();
            if (!this.parent)
                this.clinicalTimelines.containers.leftColumn
                    .selectAll('.ct-reference-line-table-container')
                    .remove();
            this.referenceLinesGroup = this.svg
                .insert('g', '#clinical-timelines .wc-chart .wc-svg .line-supergroup')
                .classed('ct-reference-lines', true);

            //Append reference line for each item in config.reference_lines.
            this.config.reference_lines
                .filter(function(reference_line) {
                    return reference_line.time_scale === _this.config.time_scale;
                })
                .filter(function(reference_line) {
                    return (
                        _this.x_dom[0] <= _this.config.time_function(reference_line.timepoint) &&
                        _this.x_dom[1] >= _this.config.time_function(reference_line.timepoint)
                    );
                })
                .forEach(function(reference_line, i) {
                    //Draw reference line.
                    drawReferenceLine.call(_this, reference_line, i);

                    //Draw reference line frequency table.
                    if (!_this.parent) drawReferenceTable.call(_this, reference_line, i);
                });
        }
    }

    function IEsucks() {
        var inIE = !!this.clinicalTimelines.document.documentMode;
        if (inIE)
            this.svg.selectAll('.line,.point').each(function(d) {
                var mark = d3.select(this);
                var tooltip = mark.select('title');
                var text = tooltip.text().split('\n');
                tooltip.text(text.join('--|--'));
            });
    }

    function setClipPath() {
        var _this = this;

        this.marks.forEach(function(mark) {
            mark.groups
                .selectAll('circle,line,path,polygon,rect,text')
                .attr('clip-path', 'url(#' + _this.id + ')');
        });
    }

    function onResize() {
        //Add filter functionality to legend.
        legendFilter.call(this);

        //Add second legend to differentiate timepoints, time intervals, and ongoing events.
        addSecondLegend.call(this);

        //Draw second x-axis at top of chart.
        drawTopXaxis.call(this);

        //Add tick lines that display the tick label on hover.
        addTooltip.call(this);

        //Draw second chart when y-axis tick label is clicked.
        tickClick.call(this);

        //Annotate grouping.
        annotateGrouping.call(this);

        //Distinguish each timeline with striping.
        addStriping.call(this);

        //Offset overlapping marks.
        offsetOverlappingMarks.call(this);

        //Draw ongoing marks.
        drawOngoingMarks.call(this);

        //Add symbols.
        addSymbols.call(this);

        //Highlight marks.
        highlightMarks.call(this);

        //Draw circles at beginning and end of each line.
        addStartStopCircles.call(this);

        //Add symbols to legend.
        addSymbolsToLegend.call(this);

        //Offset bottom x-axis to prevent overlap with final ID.
        offsetBottomXaxis.call(this);

        //Draw reference lines.
        drawReferenceLines.call(this);

        //Replace newline characters with html line break entities to cater to Internet Explorer.
        IEsucks.call(this);

        //Set clip-path of all svg elements to the ID of the current chart.
        setClipPath.call(this);
    }

    function onDestroy() {}

    var callbacks = {
        onInit: onInit,
        onLayout: onLayout,
        onPreprocess: onPreprocess,
        onDatatransform: onDatatransform,
        onDraw: onDraw,
        onResize: onResize,
        onDestroy: onDestroy
    };

    function timelines() {
        //Create timelines.
        this.timelines = webcharts.createChart(
            this.containers.timelines.node(),
            this.settings.synced,
            this.controls
        );

        for (var callback in callbacks) {
            this.timelines.on(callback.substring(2).toLowerCase(), callbacks[callback]);
        }
        this.timelines.clinicalTimelines = this;
    }

    function onInit$1() {
        this.clinicalTimelines = this.parent.clinicalTimelines;
        this.config.color_dom = this.parent.timelines.config.color_dom;
        this.config.legend.order = this.parent.timelines.config.legend.order;
        this.config.x.domain = null;
        this.config.y.sort = 'alphabetical-ascending';
    }

    function onLayout$1() {}

    function onPreprocess$1() {}

    function onDatatransform$1() {}

    function onDraw$1() {
        //Re-scale x-axis by misleading webcharts as to what the actual container width is.
        var wrapWidth = +this.wrap.style('width').replace(/[^\d.]/g, ''),
            newWidth = wrapWidth * 0.75;
        this.raw_width = newWidth;
    }

    function drawTimeRange() {
        var _this = this;

        //Add group for time range.
        this.svg.select('.time-range').remove();
        var x_dom = this.x_dom.map(function(x) {
            return x instanceof Date ? x.getTime() : x;
        });
        var timeRange =
            this.parent.timelines.config.time_scale === 'Date'
                ? this.parent.timelines.date_range.map(function(dt) {
                      return dt.getTime();
                  })
                : this.parent.timelines.day_range;
        var timeRangeText =
            this.config.time_scale === 'Date'
                ? this.parent.timelines.date_range.map(function(dt) {
                      return d3.time.format(_this.parent.timelines.config.date_display_format)(dt);
                  })
                : this.parent.timelines.day_range.map(function(dy) {
                      return dy.toString();
                  });

        if (
            (x_dom[0] !== timeRange[0] || x_dom[1] !== timeRange[1]) &&
            ((timeRange[0] >= x_dom[0] && timeRange[0] <= x_dom[1]) || // left side of time range overlaps x-domain
            (timeRange[1] >= x_dom[0] && timeRange[1] <= x_dom[1]) || // right side of time range overlaps x-domain
                (timeRange[0] <= x_dom[0] && timeRange[1] >= x_dom[1])) // time range fully encompassed x-domain
        ) {
            var timeRangeGroup = this.svg
                    .insert('g', '#clinical-timelines .wc-chart .wc-svg .line-supergroup')
                    .classed('ct-time-range', true),
                x = this.x(Math.max(timeRange[0], x_dom[0])),
                width = Math.min(this.x(timeRange[1]) - x, this.plot_width - x),
                timeRangeRect = timeRangeGroup
                    .append('rect')
                    .classed('ct-time-range-rect', true)
                    .attr({
                        x: x,
                        y: 0,
                        width: width,
                        height: this.plot_height
                    }),
                timeRangeTooltip = timeRangeGroup
                    .append('title')
                    .text(this.config.time_scale + ' range: ' + timeRangeText.join(' - '));
        }
    }

    function onResize$1() {
        var _this = this;

        //Hide legend.
        this.parent.wrap.select('.legend').classed('ct-hidden', true);

        //Draw ongoing marks.
        this.config.marks.forEach(function(mark, i) {
            var markData = _this.marks[i].data;

            //Identify marks which represent ongoing events.
            if (mark.type === 'line') {
                markData.forEach(function(d) {
                    d.ongoing = d.values[0].values.raw[0][_this.config.ongo_col];
                });
            }
        });
        drawOngoingMarks.call(this);

        //Annotate time range.
        drawTimeRange.call(this);

        //Draw reference lines.
        drawReferenceLines.call(this);

        //Add circles to beginning and end of lines.
        addStartStopCircles.call(this);

        //Add symbols.
        addSymbols.call(this);

        //Highlight events.
        highlightMarks.call(this);

        //Replace newline characters with html line break entities to cater to Internet Explorer.
        IEsucks.call(this);
    }

    function onDestroy$1() {}

    var callbacks$1 = {
        onInit: onInit$1,
        onLayout: onLayout$1,
        onPreprocess: onPreprocess$1,
        onDatatransform: onDatatransform$1,
        onDraw: onDraw$1,
        onResize: onResize$1,
        onDestroy: onDestroy$1
    };

    function IDtimeline() {
        this.IDtimeline = webcharts.createChart(
            this.containers.IDtimeline.node(),
            this.settings.IDtimeline
        );

        for (var callback in callbacks$1) {
            this.IDtimeline.on(callback.substring(2).toLowerCase(), callbacks$1[callback]);
        }
        this.IDtimeline.clinicalTimelines = this;
    }

    function onInit$2() {}

    function onLayout$2() {}

    function onDraw$2() {}

    function onDestroy$2() {}

    var callbacks$2 = {
        onInit: onInit$2,
        onLayout: onLayout$2,
        onDraw: onDraw$2,
        onDestroy: onDestroy$2
    };

    function listing() {
        this.listing = webcharts.createTable(this.containers.listing.node(), this.settings.listing);

        for (var callback in callbacks$2) {
            this.listing.on(callback.substring(2).toLowerCase(), callbacks$2[callback]);
        }
        this.listing.clinicalTimelines = this;
    }

    function init(data) {
        this.data = {
            raw: data,
            variables: Object.keys(data[0])
        };
        this.timelines.init(data, this.test);
    }

    //polyfills and utility functions

    function clinicalTimelines() {
        var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';
        var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var dom = arguments[2];

        var clinicalTimelines = {
            element: element,
            settings: {
                user: settings
            },
            containers: {},
            init: init,
            test: !!dom,
            document: dom ? dom.window.document : document
        };

        //Merge and sync settings.
        defineSettings.call(clinicalTimelines);

        //Define .css styles to avoid requiring a separate .css file.
        defineStyles.call(clinicalTimelines);

        //Define layout of HTML.
        defineLayout.call(clinicalTimelines);

        //Create controls.
        controls$1.call(clinicalTimelines);

        //Create timelines.
        timelines.call(clinicalTimelines);

        //Create ID timeline.
        IDtimeline.call(clinicalTimelines);

        //Create listing.
        listing.call(clinicalTimelines);

        //Recurse clinical timelines, ID timeline, and listing.
        recurse.call(clinicalTimelines);

        return clinicalTimelines;
    }

    return clinicalTimelines;
});

