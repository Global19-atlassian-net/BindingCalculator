//
// Sample Preparation Calculator
// Testing utilities
//
// (c) 2013 Pacific Biosciences
//

//
// This shows a list of samples available on an RS to compare against
//

var TestListView = Backbone.View.extend({
    //
    // Just shows a list of samples and lets us select them to go to the
    // testsample view, where we compare what Bart returns for coefficients
    // versus what we produce
    //
    constants: undefined,
    samples: undefined,
    templateid: "",
    initialize: function (options) {
        this.constants = options.constants;
        this.samples = options.samples;
        this.templateid = options.templateid;
    },
    render: function () {
        $('body').css('background', "#FFFFFF");
        $('body').removeAttr('background-image');

        var that = this;
        this.samples.once('list', function (data) {
            _.templateSettings = {
                evaluate: /\{\{(.+?)\}\}/g,
                interpolate: /\{\{=(.+?)\}\}/g,
                escape: /\{\{-(.+?)\}\}/g
            };
            var template = _.template($('#' + that.templateid).html(), {
                names: data
            });
            that.$el.html(template);
        });

        this.samples.getNames();
    }
});

//
// This compares a sample saved on the RS versus our own calculations given
// the same input. Shares code with TestSampleView below that reads
//

var TestSampleView = Backbone.View.extend({
    //
    // Just shows a list of samples and lets us select them to go to the
    // testsample view, where we compare what Bart returns for coefficients
    // versus what we produce
    //
    samples: undefined,
    constants: undefined,
    initialize: function (options) {
        this.samples = options.samples;
        this.constants = options.constants;
    },
    randomizeInputs: function (data) {

        var randomString = function (array) {
            var max = array.length;
            var which = Math.floor(Math.random() * max);  // from 0 to max
            return array[which];
        };

        data["StartingSampleConcentration"] = (Math.floor(Math.random() * 30000) / 100);      // from 0 to 300.00
        data["AvailableSampleVolume"] = (Math.floor(Math.random() * 3000) / 100);             // from 0 to 30.00
        data["CustomVolumeOfBindingReactionInStorageComplex"] = (Math.floor(Math.random() * 30000) / 100);      // from 0 to 300.00
        data["SampleVolumeToUseInAnnealing"] = (Math.floor(Math.random() * 60000) / 100);     // from 0 to 600.00
        data["NumberOfCellsToUse"] = Math.floor(Math.random() * 64);                          // from 0 to 64
        data["NumberOfCellsInBinding"] = Math.floor(Math.random() * 8);                       // from 0 to 8
        data["BindingComplexNumberOfCellsRequested"] = Math.floor(Math.random() * 8);         // from 0 to 8
        data["AnnealedBasePairLength"] = (Math.floor(Math.random() * 11000) + 250);           // from 250 to 11250

        data["TitrationConcentration1"] = (Math.floor(Math.random() * 100) / 1000);           // from 0 to 0.0100
        data["TitrationConcentration2"] = (Math.floor(Math.random() * 100) / 1000);
        data["TitrationConcentration3"] = (Math.floor(Math.random() * 100) / 1000);
        data["TitrationConcentration4"] = (Math.floor(Math.random() * 100) / 1000);

        data["ComputeOption"] = randomString(["Volume", "Cells", "Titration"]);
        data["MagBead"] = randomString(["True", "False"]);
        data["PreparationProtocol"] = randomString(["Small", "Large"]);
        data["UseSpikeInControl"] = randomString(["True", "False"]);
        data["ComplexReuse"] = randomString(["True", "False"]);
        data["LowConcentrationsAllowed"] = randomString(["True", "False"]);
        data["Chemistry"] = randomString(["Version2", "VersionXL"]);
        data["BindingPolymeraseOption"] = randomString(["Volume", "Cells"]);

        // not sure we even allow these to be set now, double check:
        //data["CustomNonStandardAnnealingConcentration"] = (Math.floor(Math.random() * 100) / 1000);     // from 0 to 0.0100
        //data["CustomNonStandardBindingConcentration"] = (Math.floor(Math.random() * 100) / 1000);       // from 0 to 0.0100

        data["CustomConcentrationOnPlate"] = (Math.floor(Math.random() * 100) / 1000);      // from 0 to 0.0100
        data["CustomSpikeInRatioPercent"] = Math.floor((Math.random() * 90) / 10);          // from 0 to 9.0
        data["CustomPolymeraseTemplateRatio"] = Math.floor((Math.random() * 300) / 10) + 1; // from 1 to 30.0
        data["CustomPrimerTemplateRatio"] = Math.floor((Math.random() * 300) / 10) + 1; // from 1 to 30.0

        data["ConcentrationOnPlateOption"] = randomString(["Default", "Custom"]);
        data["SpikeInRatioOption"] = randomString(["Default", "Custom"]);
        data["PolymeraseTemplateRatioOption"] = randomString(["Default", "Custom"]);
        data["PrimerTemplateRatioOption"] = randomString(["Default", "Custom"]);
        data["StorageComplexOption"] = randomString(["Default", "Custom"]);

        /*
        things to randomize still or are not allowed currently:
        calc.BindingComputation = this.BindingComputation;
        calc.Cell = this.Cell;  // CellVersion3 or CellVersion2, etc
        calc.CollectionProtocol = this.CollectionProtocol;  // Standard or Strobe

        calc.NonStandardAnnealingConcentrationOption = this.NonStandardAnnealingConcentrationOption;    // not implemented yet
        calc.CustomNonStandardAnnealingConcentration = this.CustomNonStandardAnnealingConcentration;    // not implemented yet
        calc.CustomNonStandardBindingConcentration = this.CustomNonStandardBindingConcentration ;       // implemented?
        calc.LoadingTitrationNumberOfCellsRequested  = this.LoadingTitrationNumberOfCellsRequested;     // implemented?
        */

        return data;
    },

    updateOrCreateSample: function (samplelist, samplename, sampleinputs) {
        // Look for a named sample and then update the sample details
        // Used by randomize, as well as checkLocal
        var that = this;
        samplelist.once('list', function (data) {
            //
            // for randomize, when we make a new sample fill in random inputs
            // and save it then trigger 'sample' to display it
            //

            for (var i = 0; i < data.length; i++) {
                if (data[i] == samplename) {

                    samplelist.once('sample', function (sampledeets) {
                        sampledeets = sampleinputs(sampledeets);

                        samplelist.once('updated', function (newdeets) {
                            that.renderSampleDetails(newdeets);
                        });

                        samplelist.saveSample(sampledeets);
                    });
                    samplelist.getSample(samplename);

                    return;
                }
            }

            // else we didn't find it, prepare to create it

            samplelist.once('new', function (newdata) {

                console.log('Created new sample, renaming "' + samplename + '"');
                newdata["SampleName"] = samplename;
                newdata = sampleinputs(newdata);

                samplelist.once('updated', function (newdeets) {
                    that.renderSampleDetails(newdeets);
                });

                samplelist.saveSample(newdata);
            });
            samplelist.newSample();
        });
        samplelist.getNames();
    },

    randomize: function () {
        //
        // This will pick random inputs for the sample named "Random"
        // if that sample doesn't exist it will create it
        // it will save them to the instrument to get calculations
        // then it will render the outputs for comparison
        //

        var that = this;
        this.updateOrCreateSample(this.samples, "Random", function (sampledeets) {
            return that.randomizeInputs(sampledeets);
        });

        /*
        this.samples.once('list', function (data) {
        //
        // for randomize, when we make a new sample fill in random inputs
        // and save it then trigger 'sample' to display it
        //

        for (var i = 0; i < data.length; i++) {
        if (data[i] == "Random") {

        that.samples.once('sample', function (sampledeets) {
        that.randomizeInputs(sampledeets);

        that.samples.once('updated', function (newdeets) {
        that.renderSampleDetails(newdeets);
        });

        that.samples.saveSample(sampledeets);
        });
        that.samples.getSample("Random");

        return;
        }
        }

        // else we didn't find it, prepare to create it

        that.samples.once('new', function (newdata) {

        console.log('Created new sample, renaming "Random"');
        newdata["SampleName"] = "Random";
        that.randomizeInputs(data);

        that.samples.once('updated', function (newdeets) {
        that.renderSampleDetails(newdeets);
        });

        that.samples.saveSample(newdata);
        });
        that.samples.newSample();
        });
        this.samples.getNames();
        */
    },

    compareLocalToRemote: function (name, localsamplelist) {
        //
        // this will take a sample from one set of samples (e.g. local sample)
        // and propogate it to another set of samples (e.g. remote server)
        // then compare the results. causes the named sample to be copied.
        //

        var that = this;
        localsamplelist.once('sample', function (localdeets) {
            // we will GET this named sample from local storage and receive the details
            // next is to then create a sample with that name in remote storage on the RS
            // and use this callback to update all the inputs to match the local version

            var sourcedeets = localdeets;
            that.updateOrCreateSample(that.samples, name, function (remotedeets) {
                // make sampledeets equal to deets (the local version)
                // and then renders a comparison against a local version again
                // useful for comparing a set of known inputs against what 1.3.3 would generate

                for (var prop in remotedeets) {
                    if (remotedeets.hasOwnProperty(prop) && sourcedeets.hasOwnProperty(prop)) {
                        remotedeets[prop] = sourcedeets[prop];
                    }
                }

                return remotedeets;
            });
        });
        localsamplelist.getSample(name); // trigger the fetch
    },

    renderSampleDetails: function (data) {

        //
        // ok we got the sample details in data
        // - put those into a Sample
        // - build a new hash where for each key we have original value and local value
        // - iterate and build a template table with coefficient, original, local
        // - display, and if the values differ highlight them
        //
        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        var differences = [];
        var comparison = [];
        var mycache = new Sample({ constants: this.constants, unitTesting: true });
        mycache.ReadFromJson(data);

        for (var prop in data) {
            //
            // Skip FinalTitrationConcentration and VolumeOfAnnealingReactionToUse
            // Those two were vestigial on the RS calculator and omitted in javascript
            //

            if (prop === "FinalTitrationConcentration" ||
                prop === "VolumeOfAnnealingReactionToUse" ||
                prop === "TubeNameSpikeInControl" ||
                prop === "SpikeInTubeLabel") {
                continue;
            }

            var found = "";
            if (prop in mycache)
                found = mycache[prop];

            var compare1 = found;
            var compare2 = data[prop];

            //
            // if we get error strings that are substantial and the same length, they may just need sorting
            //

            if (prop == "Errors" && (compare1.length > 0)) {
                var error1 = JSON.parse(compare1);
                var error2 = JSON.parse(compare2);

                var sortedkeys1 = Object.keys(error1).sort(function (a, b) { return -(error1[a] - error1[b]); });
                var sortedkeys2 = Object.keys(error2).sort(function (a, b) { return -(error2[a] - error2[b]); });

                var newerror1 = {};
                var newerror2 = {};
                for (var key1 in sortedkeys1) {
                    newerror1[key1] = error1[key1];
                }
                for (var key2 in sortedkeys2) {
                    newerror2[key2] = error2[key2];
                }

                compare1 = JSON.stringify(newerror1);
                compare2 = JSON.stringify(newerror2);

                // also, the "TooManyCellsInBinding" error is unicode in C# land for some reason, so search and replace for that
                compare2.replace("You won't have enough annealed sample for the number of SMRT Cells requested in the binding reaction.",
                    "You won\u0027t have enough annealed sample for the number of SMRT Cells requested in the binding reaction.");
            }

            // try string comparison first
            var same = (("" + compare1) == ("" + compare2));
            if (!same) {
                // then if they're numbers, assume sameness if they round to within 3 places
                if (isNumber(compare1) && isNumber(compare2)) {
                    same = ((Math.round(compare1 * 1000) / 1000) == (Math.round(compare2 * 1000) / 1000));
                }

                // these two properties are ints in C# and I now return -1/-2 for them
                // but in javascript they're NaN. Let that slide...

                if (!same && prop == "NumberOfCellsFromPartialWells") {
                    if ("?" == compare1) same = true;
                }

                if (!same && prop == "TotalComplexDilutionCells") {
                    if ("?" == compare1) same = true;
                }
            }
            var style = (same) ? "" : "background:yellow";

            if (!same)
                differences.push({ key: prop, oldvalue: data[prop], newvalue: found, style: style });
            comparison.push({ key: prop, oldvalue: data[prop], newvalue: found, style: style });
        }

        //
        // if auto mode, then keep reloading until we find a sample that is different
        //

        if (0 == differences.length) {
            if (this.automode) {
                // no differences, reload immediately instead of displaying
                Backbone.history.loadUrl(Backbone.history.fragment);
            }
        }

        _.templateSettings = {
            evaluate: /\{\{(.+?)\}\}/g,
            interpolate: /\{\{=(.+?)\}\}/g,
            escape: /\{\{-(.+?)\}\}/g
        };

        var template = "<h3>Comparison of " +  data["SampleName"] + "</h3>";
        var d = new Date();
        template += "<p>Completed: " + d.toLocaleString();
        template += "<p>Differences:";

        if ("Random" == data["SampleName"]) {

            if ("testsample/Auto" == Backbone.history.fragment) {
                template += "&nbsp;&nbsp;&nbsp;<a href='javascript:Backbone.history.loadUrl( Backbone.history.fragment )'>auto</a>";
                template += "&nbsp;&nbsp;&nbsp;<a href='#testsample/Random'>reload</a>";
            }
            else {
                template += "&nbsp;&nbsp;&nbsp;<a href='#testsample/Auto'>auto</a>";
                template += "&nbsp;&nbsp;&nbsp;<a href='javascript:Backbone.history.loadUrl( Backbone.history.fragment )'>reload</a>";
            }

            template += "&nbsp;&nbsp;&nbsp;<a href='#testsample/Random'>freeze</a>";
        }

        if (0 == differences.length) template += "<p>None";
        template += _.template($('#test-sample-comparison').html(), {
            values: differences
        });
        template += "<hr /><p>Details:";
        template += _.template($('#test-sample-comparison').html(), {
            values: comparison
        });
        this.$el.html(template);
    },

    renderLocal: function (name, localsamplelist) {
        // This takes a local SampleList model and a name
        // and copies the sample details to our remote model
        // then runs a comparison between them. Useful to set
        // a given set of inputs in an issue report to compare
        // against the outputs that the 1.3.3 calculator produces
        
        $('body').css('background', "#FFFFFF");
        $('body').removeAttr('background-image');
        
        this.compareLocalToRemote(name, localsamplelist);
    },

    render: function (name) {
        $('body').css('background', "#FFFFFF");
        $('body').removeAttr('background-image');

        this.automode = false;

        if ("Auto" == name) {
            this.automode = true;
            this.randomize();
            return;
        }

        if ("Randomize" == name) {
            this.randomize();
            return;
        }

        var that = this;
        this.samples.once('sample', function (deets) {
            that.renderSampleDetails(deets);
        });

        this.samples.getSample(name);
    }
});
