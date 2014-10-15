//
// Sample Preparation Calculator
// List view
//
// (c) 2013 Pacific Biosciences
//

/*jslint maxlen: 150 */
/*global $, _, Backbone, alert */

var ListView = Backbone.View.extend({
    router: undefined,
    samples: undefined,
    constants: undefined,

    initialize: function (options) {
        this.samples = options.samples;
        this.router = options.router;
        this.constants = options.constants;

        // if we delete the last samples, then be prepared for the model
        // to create a new "Untitled 1" sample and add that to the list
        var that = this;
        this.samples.on('new', function (data) {
            var grid = $("#ui-jqgrid");
            if (0 === grid.length) {
                return; // we must not be the current view
            }

            that.addSampleToGrid(data, 1);
        });

        // handle delete events by removing samples from the list
        this.samples.on('delete', function (name) {
            var grid, i, rowdata, ids;

            // loop through rows to find the sample we just deleted
            grid = $("#ui-jqgrid");
            if (0 === grid.length) {
                return; // we must not be the current view
            }

            ids = grid.getDataIDs();
            for (i = 0; i < ids.length; i += 1) {
                rowdata = grid.getRowData(ids[i]);
                if (rowdata.internalname === name) {
                    grid.delRowData(ids[i]);
                    return;
                }
            }

            // if we get here, we didn't find the row
            alert("Error: could not find the sample. Please let PacBio support know.");
        });
    },

    getSelectedSampleNames: function () {
        var rows, result, i, row, name;
        rows = $("#ui-jqgrid").getGridParam('selarrrow');

        result = [];
        for (i in rows) {
            if (rows.hasOwnProperty(i)) {
                row = rows[i];
                name = $("#ui-jqgrid").getCell(row, 'internalname');
                result[i] = { name: name, row: row };
            }
        }
        return result;
    },

    wireUpButtons: function () {
        var that, sample;

        that = this;
        $('.edit_button').click(function () {
            var selectedsamples = that.getSelectedSampleNames();

            if (selectedsamples.length === 0) {
                alert("Please select a sample to edit");
            }

            if (selectedsamples.length > 1) {
                alert("Please select only one sample to edit");
            }

            if (selectedsamples.length === 1) {
                window.location = "#sample/" + encodeURIComponent(selectedsamples[0].name);
                // future: use that.router.navigate(); of some form
            }
        });

        $('.new_button').click(function () {
            var querystring = "#new";
            window.location = querystring;
        });

        $('.print_button').click(function () {
            var i, selectedsamples,
                querystring = "#print/";
            selectedsamples = that.getSelectedSampleNames();

            if (0 === selectedsamples.length) {
                alert("Select at least one sample to print.");
                return;
            }

            for (i in selectedsamples) {
                if (selectedsamples.hasOwnProperty(i)) {
                    sample = selectedsamples[i].name;
                    querystring += encodeURIComponent(sample) + "&";
                }
            }
            window.location = querystring;
        });

        $('.delete_button').click(function () {
            var i, selectedsamples, names;
            selectedsamples = that.getSelectedSampleNames();

            names = [];
            for (i in selectedsamples) {
                if (selectedsamples.hasOwnProperty(i)) {
                    names.push(selectedsamples[i].name);
                }
            }

            if (names.length > 0) {
                that.samples.deleteSamples(names);
            }
            else {
                alert("Select at least one sample to delete.");
            }

            // this triggers 'delete' events which we should watch and then remove them from our grid
        });

        String.prototype.endsWith = function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };

        var importButton = $('.import_button');

        $('.import_button').change(function (evt) {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var files = evt.target.files; // FileList object, we're only allowing 1 input at a time to start
                var f = files[0];
                var name = encodeURIComponent(f.name);
                if (f.name.endsWith(".sample")) {     // uses endsWith extension above
                    var reader = new FileReader();
                    reader.onload = function(e) {

                        //
                        // Use the SampleLocal class to add a new sample with the json, instead of sample.ReadFromJson
                        // potentially. Make sure the check the GUID against existing samples and error if already
                        // loaded. The SampleLocal class is our this.samples property. Have that property trigger
                        // a 'new' event at the end of the import, and then our UI should update correctly.
                        //

                        var text = reader.result;
                        var json = JSON.parse(text);

                        // Make sure we have essential components

                        if (json.hasOwnProperty("SampleName") && json.hasOwnProperty("SampleGuid")) {
                            that.samples.importSample(json);
                        } else {
                            // TODO: move these error messages with replacement tokens to static.js and look up
                            alert("Sorry, the file '"+ name + "' does not appear to contain sample information or is corrupted. Please contact Pacific Biosciences for assistance.")
                        }

                    }
                    reader.readAsText(f);
                } else {
                    alert("Sorry, the file '"+ name + "' does not have the file extension 'sample'");
                }

            } else {
                alert("This browser does not support importing samples, please upgrade to a more recent version.");
            }

            importButton.replaceWith( importButton = importButton.clone( true ) );
        });
    },

    computeListWidth: function () {
        var width = $(window).width();

        // based upon our css rules we could have these widths:
        if (width >= 1212) {
            return 1068;
        }
        if ((width >= 480) && (width <= 767)) {
            return 396;
        }
        if (width <= 479) {
            return 228;
        }
        return 648;
    },

    addSampleToGrid: function (sampledeets, rowNumber) {
        var row = {};
        row.internalname = sampledeets.SampleName;
        row.name = "<a href='#sample/" + encodeURIComponent(sampledeets.SampleName) +
            "'>" + sampledeets.SampleName + "</a>";
        row.volume = sampledeets.SampleVolumeToUseInAnnealing;
        row.cells = sampledeets.Cells;
        row.conc = sampledeets.StartingSampleConcentration;
        row.bp = sampledeets.AnnealedBasePairLength;

        //
        // get just the sample input data to persist to the file, and use a simple
        // filename encoding by replacing anything nonstandard with _, internally
        // the name is still saved as utf-8 when it is reimported. Filename conflicts
        // or renaming could occur when downloading though...
        //

        var data = "text/json;charset=utf-8," + encodeURIComponent(sampledeets.ToJson());
        var filename = sampledeets.SampleName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".sample";

        row.export = "<a href='data:" + data + "' download='" + filename + "'>export</a>";
        row.note = sampledeets.ShortDescription;

        $("#ui-jqgrid").jqGrid('addRowData', rowNumber, row);
    },

    drawPage: function (data) {
        var template, that, rowNumber;

        _.templateSettings = {
            evaluate: /\{\{(.+?)\}\}/g,
            interpolate: /\{\{=(.+?)\}\}/g,
            escape: /\{\{-(.+?)\}\}/g
        };

        template = _.template($('#names-list-template').html(), {
            names: data,
            strings: this.constants.strings
        });

        this.$el.hide().html(template);
        $('body').css('background', "rgb(201,201,206)");
        this.$el.prop("id", "listview");    // toggle css

        $("#ui-jqgrid").jqGrid({
            datatype: "local",
            height: 'auto',
            autowidth: true,
            rowNum: 9999999,
            colNames: ['Sample name', 'Vol', 'Cells', 'Conc', 'BP', 'Exp', 'Note', 'internalname'],
            colModel: [
                { name: 'name', index: 'name', width: 150 },
                { name: 'volume', index: 'volume', width: 30, align: "right", sorttype: "float" },
                { name: 'cells', index: 'cells', width: 30, align: "right", sorttype: "int" },
                { name: 'conc', index: 'conc', width: 30, align: "right", sorttype: "float" },
                { name: 'bp', index: 'bp', width: 36, align: "right", sorttype: "int" },
                { name: 'export', index: 'export', width: 30, align: "right", sortable: false },
                { name: 'note', index: 'note', width: 220, sortable: false },
                { name: 'internalname', index: "internalname", width: 0, hidden: true }
            ],
            multiselect: true,
            caption: "Samples"
        });

        // adjust width based upon screen width
        that = this;
        $(window).resize(function () {
            $("#ui-jqgrid").jqGrid('setGridWidth', that.computeListWidth(), true);
        }).trigger('resize');

        rowNumber = 0;
        this.samples.foreachSample(function (sampledeets) {
            rowNumber += 1;
            that.addSampleToGrid(sampledeets, rowNumber);
        });

        this.wireUpButtons();
        this.$el.show();
        this.samples.off('list', this.drawPageClosure);
    },

    render: function () {
        //
        // Show the list view
        // - reset the page with template for list view (cache it ultimately?)
        // - if we need to load sample details, start that in the model
        // - have the progress bar watch an event for how many are pending/read
        // - add samples as they come in to the list view
        // - when finished reading all, then 
        //

        var that = this;
        this.samples.on('list', function (data) {
            that.drawPage(data);
        });

        this.samples.getNames();

        // list event is unhooked in drawPage() when it's finished we only swap the page to list view
        // when we're triggering it here
    }
});
