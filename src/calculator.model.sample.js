//
// Sample Preparation Calculator
// Model for sample calculations
//
// (c) 2013 Pacific Biosciences
//

/*jslint maxlen: 150 */
/*global Backbone, SampleCalc, _, alert*/

//
// Utility class for calling calculation functions in order
// based on their Prep prefix number. Create one and use
// CallPreps to call the preparation functions on the class's
// prototype in index order...
//

function PrepOrderCaller() {}
PrepOrderCaller.prototype.callPreps = function(protos, callee) {
    var calcs, prop, under, order, k, index, functionlist;

    calcs = [];

    // we can't just call them all in a loop, order matters so we calculate coefficients only once
    // for performance. Do this with special naming, look for properties starting with Prep2...Prep9
    // and call them in that order...
    //
    // note: using __proto__ to get prototype functions won't work on IE 6,7,8,9, maybe 10
    // but it's going to be in the ES6 spec so it will eventually. perhaps reconsider this
    // approach to get IE working again even though it's not in the requirements for this calculator
    // (the prototypes don't show up as enumerable by default, could make a list.) except that
    // localStorage doesn't work for file-based stand-alone Calculators in IE up through 10...
    //
    
    for (prop in protos) {
        if (protos.hasOwnProperty(prop)) {

            if (prop.indexOf("Prep") !== 0) {
                continue;
            }

            under = prop.indexOf("_");
            if (under === -1) {
                continue;
            }

            order = prop.substring(4, under);
            if (!calcs[order]) {
                calcs[order] = [];
            }
            calcs[order].push(prop);
        }
    }

    // then iterate through them in dependency order

    for (k in calcs) {
        if (calcs.hasOwnProperty(k)) {
            functionlist = calcs[k];

            if (!functionlist) {
                continue;
            }

            for (index in functionlist) {
                if (functionlist.hasOwnProperty(index)) {
                    callee[functionlist[index]]();
                }
            }
        }
    }
};

//
// This provides a wrapper for the SampleCalc class
// You should have one wrapper for each calculator
// This will set the inputs and calculate all the fields
// and provide a single way to query all the properties
// that you want without causing new calculations. It's
// a facade over the calculations basically
//
// note: to output all values from this, try iterating
// over all items that are not functions?
//
var Sample = Backbone.Model.extend({
    samplecalc: undefined,
    constants: undefined,

    initialize: function (options) {
        if (options.hasOwnProperty("unitTesting")) {
            this.unitTesting = options.unitTesting;
        }

        this.constants = options.constants;
        this.samplecalc = new SampleCalc({ globals: options.constants.globals, errors: options.constants.errors, unitTesting: this.unitTesting });

        //
        // make a guid for new samples using simple random numbers, per
        // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        //

        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                     .toString(16)
                     .substring(1);
        }

        function guid() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                 s4() + '-' + s4() + s4() + s4();
        }

        this.SampleGuid = guid();
    },

    //
    // Input properties with defaults
    //

    SampleName: "Untitled",
    ComputeOption: "Volume",
    MagBead: "True",
    PreparationProtocol: "Small",
    LongTermStorage: "False",
    UseSpikeInControl: "True",
    ComplexReuse: "False",
    LowConcentrationsAllowed: "False",
    BindingComputation: "Volume",
    SampleVolumeToUseInAnnealing: 0,
    NumberOfCellsToUse: 0,
    StartingSampleConcentration: 0,
    CustomNonStandardAnnealingConcentration: 0,
    CustomNonStandardBindingConcentration: 0,
    BindingComplexNumberOfCellsRequested: 0,
    LoadingTitrationNumberOfCellsRequested: 0,
    TitrationConcentration1: 0,
    TitrationConcentration2: 0,
    TitrationConcentration3: 0,
    TitrationConcentration4: 0,
    AvailableSampleVolume: 0,
    CollectionProtocol: "Standard", // versus strobe - deprecated option currently
    Chemistry: "VersionP4",
    Cell: "CellVersion3",
    AnnealedBasePairLength: 10000,
    CustomConcentrationOnPlate: 0,
    ConcentrationOnPlateOption: "Default",
    NonStandardAnnealingConcentrationOption: "Default",
    SpikeInRatioOption: "Default",
    CustomSpikeInRatioPercent: "0",
    CustomPolymeraseTemplateRatio: "0",
    PolymeraseTemplateRatioOption: "Default",
    NumberOfCellsInBinding: 0,
    BindingPolymeraseOption: "Volume",
    StorageComplexOption: "Default",
    CustomVolumeOfBindingReactionInStorageComplex: 0,

    // private fields
    Version: "0",
    SampleGuid: "",

    // set true for unit tests to force all calculations (no short circuits)
    unitTesting: false,

    ReadFromJson: function (json) {

        this.SampleName = json.SampleName;
        this.SampleGuid = json.SampleGuid;
        this.Version = json.Version;

        this.ComputeOption = json.ComputeOption;
        this.MagBead = json.MagBead;
        this.PreparationProtocol = json.PreparationProtocol;
        this.LongTermStorage = json.LongTermStorage;
        this.UseSpikeInControl = json.UseSpikeInControl;
        this.ComplexReuse = json.ComplexReuse;
        this.LowConcentrationsAllowed = json.LowConcentrationsAllowed;
        this.BindingComputation = json.BindingComputation;
        this.SampleVolumeToUseInAnnealing = json.SampleVolumeToUseInAnnealing;
        this.NumberOfCellsToUse = json.NumberOfCellsToUse;
        this.StartingSampleConcentration = json.StartingSampleConcentration;
        this.CustomNonStandardAnnealingConcentration = json.CustomNonStandardAnnealingConcentration;
        this.CustomNonStandardBindingConcentration = json.CustomNonStandardBindingConcentration;
        this.BindingComplexNumberOfCellsRequested = json.BindingComplexNumberOfCellsRequested;
        this.LoadingTitrationNumberOfCellsRequested = json.LoadingTitrationNumberOfCellsRequested;
        this.TitrationConcentration1 = json.TitrationConcentration1;
        this.TitrationConcentration2 = json.TitrationConcentration2;
        this.TitrationConcentration3 = json.TitrationConcentration3;
        this.TitrationConcentration4 = json.TitrationConcentration4;
        this.AvailableSampleVolume = json.AvailableSampleVolume;
        this.CollectionProtocol = json.CollectionProtocol;
        this.Chemistry = json.Chemistry;
        this.Cell = json.Cell;
        this.AnnealedBasePairLength = json.AnnealedBasePairLength;
        this.CustomConcentrationOnPlate = json.CustomConcentrationOnPlate;
        this.ConcentrationOnPlateOption = json.ConcentrationOnPlateOption;
        this.NonStandardAnnealingConcentrationOption = json.NonStandardAnnealingConcentrationOption;
        this.SpikeInRatioOption = json.SpikeInRatioOption;
        this.CustomSpikeInRatioPercent = json.CustomSpikeInRatioPercent;
        this.CustomPolymeraseTemplateRatio = json.CustomPolymeraseTemplateRatio;
        this.PolymeraseTemplateRatioOption = json.PolymeraseTemplateRatioOption;
        this.NumberOfCellsInBinding = json.NumberOfCellsInBinding;
        this.BindingPolymeraseOption = json.BindingPolymeraseOption;
        this.StorageComplexOption = json.StorageComplexOption;
        this.CustomVolumeOfBindingReactionInStorageComplex = json.CustomVolumeOfBindingReactionInStorageComplex;

        //
        // Then compute all outputs
        //

        this.Calculate();
    },

    ToJson: function () {
        // Output just the things we need to save into a JSON string for persistance in a key/value store

        var output = {};
        output.SampleName = this.SampleName;
        output.SampleGuid = this.SampleGuid;
        output.Version = this.Version;

        output.ComputeOption = this.ComputeOption;
        output.MagBead = this.MagBead;
        output.PreparationProtocol = this.PreparationProtocol;
        output.LongTermStorage = this.LongTermStorage;
        output.UseSpikeInControl = this.UseSpikeInControl;
        output.ComplexReuse = this.ComplexReuse;
        output.LowConcentrationsAllowed = this.LowConcentrationsAllowed;
        output.BindingComputation = this.BindingComputation;
        output.SampleVolumeToUseInAnnealing = this.SampleVolumeToUseInAnnealing;
        output.NumberOfCellsToUse = this.NumberOfCellsToUse;
        output.StartingSampleConcentration = this.StartingSampleConcentration;
        output.CustomNonStandardAnnealingConcentration = this.CustomNonStandardAnnealingConcentration;
        output.CustomNonStandardBindingConcentration = this.CustomNonStandardBindingConcentration;
        output.BindingComplexNumberOfCellsRequested = this.BindingComplexNumberOfCellsRequested;
        output.LoadingTitrationNumberOfCellsRequested = this.LoadingTitrationNumberOfCellsRequested;
        output.TitrationConcentration1 = this.TitrationConcentration1;
        output.TitrationConcentration2 = this.TitrationConcentration2;
        output.TitrationConcentration3 = this.TitrationConcentration3;
        output.TitrationConcentration4 = this.TitrationConcentration4;
        output.AvailableSampleVolume = this.AvailableSampleVolume;
        output.CollectionProtocol = this.CollectionProtocol;
        output.Chemistry = this.Chemistry;
        output.Cell = this.Cell;
        output.AnnealedBasePairLength = this.AnnealedBasePairLength;
        output.CustomConcentrationOnPlate = this.CustomConcentrationOnPlate;
        output.ConcentrationOnPlateOption = this.ConcentrationOnPlateOption;
        output.NonStandardAnnealingConcentrationOption = this.NonStandardAnnealingConcentrationOption;
        output.SpikeInRatioOption = this.SpikeInRatioOption;
        output.CustomSpikeInRatioPercent = this.CustomSpikeInRatioPercent;
        output.CustomPolymeraseTemplateRatio = this.CustomPolymeraseTemplateRatio;
        output.PolymeraseTemplateRatioOption = this.PolymeraseTemplateRatioOption;
        output.NumberOfCellsInBinding = this.NumberOfCellsInBinding;
        output.BindingPolymeraseOption = this.BindingPolymeraseOption;
        output.StorageComplexOption = this.StorageComplexOption;
        output.CustomVolumeOfBindingReactionInStorageComplex = this.CustomVolumeOfBindingReactionInStorageComplex;

        return JSON.stringify(output);
    },

    sanitize: function (value, type) {

        // samplecalc has our rounding routine of choice
        var gaussianRounding = this.samplecalc.gaussianRounding;

        // handle error values independent of expected type
        if (_.isNaN(value) || value === "?") {
            return "?";
        }

        // sometimes SampleVolumeInAnnealingReaction returns Infinity for boundary conditions, where c# would return NaN
        if (_.isNumber(value) && !_.isFinite(value)) {
            return "?";
        }

        //
        // rounding rules
        // if the parameter is named Concentration, round to 1 digit
        //   unless the value < 1 then use 4 digits
        // if the parameter is named Ratio, round to 1 digit
        // otherwise
        // round to 1 digit unless the value is < 1, then round to 2 digits
        // if an output is a true Integer, then the calculation should parseInt(foo, 10)
        // customer inputs we keep extra precisions
        //

        switch (type) {
            case "string":
                if (value === "NaN") { return "?"; }
                return value;

            case "ratio":
                return gaussianRounding(value, 1);

            case "concentration":
                return gaussianRounding(value, (parseFloat(value) < 1) ? 4 : 1);

            case "volume":
                return gaussianRounding(value, (parseFloat(value) < (this.unitTesting ? 10 : 1)) ? 2 : 1);

            case "input":
                return gaussianRounding(value, 5);

            case "integer":
                return parseInt(value, 10);

            default:
                return "ERROR";
        }
    },

    sanitizedTypeFromName: function (value, name) {

        // check input names first because they have higher precision
        // and those names might match others we are interested in
        if (this.stringInList(name, this.inputDoublePropertyNames)) {
            return "input";
        }

        if (_.isNaN(value)) {
            return "volume";
        }

        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        if (!isNumber(value)) {
            return "string";
        }

        if (this.stringInList(name, this.integerPropertyNames)) {
            return "integer";
        }

        if (name.indexOf("Concentration") !== -1) {
            return "concentration";
        }

        if (name.indexOf("Ratio") !== -1) {
            return "ratio";
        }

        return "volume";
    },

    stringInList: function (string, list) {
        return (list.indexOf(string) >= 0);
    },

    integerPropertyNames: [
        "AnnealedBasePairLength",
        "MaxNumberOfCellsPerWellFromBucket",
        "MaxNumberOfCellsPerWell",
        "NumberOfCellsInBinding",
        "NumberOfCellsFromBinding",
        "NumberOfFullWells",
        "NumberOfCellsFromPartialWells",
        "NumberOfPartialWells",
        "TotalComplexDilutionCells"
    ],

    inputDoublePropertyNames: [
        "SampleVolumeToUseInAnnealing",
        "NumberOfCellsToUse",
        "StartingSampleConcentration",
        "CustomNonStandardAnnealingConcentration",
        "CustomNonStandardBindingConcentration",
        "CustomConcentrationOnPlate",
        "BindingComplexNumberOfCellsRequested",
        "LoadingTitrationNumberOfCellsRequested",
        "TitrationConcentration1",
        "TitrationConcentration2",
        "TitrationConcentration3",
        "TitrationConcentration4",
        "AvailableSampleVolume",
        "CustomConcentrationOnPlate",
        "CustomSpikeInRatioPercent",
        "CustomPolymeraseTemplateRatio",
        "CustomVolumeOfBindingReactionInStorageComplex"
    ],

    // calculate
    Calculate: function () {
        var calc, type, newerror,
            errorkey, val, result, value, 
            valuetype, firstletter, minimumPipetting;

        // this does the work. it sets the values of all input properties in the calculator class
        // then it caches all the resulting output values one by one, using the calculations
        // any performance speedups by caching interim results and clearing those could occur here too

        this.ShowCellOption = this.constants.globals.ShowCellOption;
        this.ShowChemistryOption = this.constants.globals.ShowChemistryOption;
        this.ShowStrobeOption = false;
        this.AllowNonStandardReverseCalculations = this.constants.globals.AllowNonStandardReverseCalculations;

        calc = this.samplecalc;
        calc.ComputeOption = this.ComputeOption;
        calc.MagBead = this.MagBead;
        calc.PreparationProtocol = this.PreparationProtocol;
        calc.LongTermStorage = this.LongTermStorage;
        calc.UseSpikeInControl = this.UseSpikeInControl;
        calc.ComplexReuse = this.ComplexReuse;
        calc.LowConcentrationsAllowed = this.LowConcentrationsAllowed;
        calc.BindingComputation = this.BindingComputation;
        calc.SampleVolumeToUseInAnnealing = parseFloat(this.SampleVolumeToUseInAnnealing);
        calc.NumberOfCellsToUse = parseInt(this.NumberOfCellsToUse, 10);
        calc.StartingSampleConcentration = parseFloat(this.StartingSampleConcentration);
        calc.CustomNonStandardAnnealingConcentration = parseFloat(this.CustomNonStandardAnnealingConcentration);
        calc.CustomNonStandardBindingConcentration = parseFloat(this.CustomNonStandardBindingConcentration);
        calc.BindingComplexNumberOfCellsRequested = parseInt(this.BindingComplexNumberOfCellsRequested, 10);
        calc.LoadingTitrationNumberOfCellsRequested = parseInt(this.LoadingTitrationNumberOfCellsRequested, 10);
        calc.TitrationConcentration1 = parseFloat(this.TitrationConcentration1);
        calc.TitrationConcentration2 = parseFloat(this.TitrationConcentration2);
        calc.TitrationConcentration3 = parseFloat(this.TitrationConcentration3);
        calc.TitrationConcentration4 = parseFloat(this.TitrationConcentration4);
        calc.AvailableSampleVolume = parseFloat(this.AvailableSampleVolume);
        calc.CollectionProtocol = this.CollectionProtocol;
        calc.Chemistry = this.Chemistry;
        calc.Cell = this.Cell;
        calc.AnnealedBasePairLength = parseInt(this.AnnealedBasePairLength, 10);
        calc.CustomConcentrationOnPlate = parseFloat(this.CustomConcentrationOnPlate);
        calc.ConcentrationOnPlateOption = this.ConcentrationOnPlateOption;
        calc.NonStandardAnnealingConcentrationOption = this.NonStandardAnnealingConcentrationOption;
        calc.SpikeInRatioOption = this.SpikeInRatioOption;
        calc.CustomSpikeInRatioPercent = parseFloat(this.CustomSpikeInRatioPercent);
        calc.CustomPolymeraseTemplateRatio = parseFloat(this.CustomPolymeraseTemplateRatio);
        calc.PolymeraseTemplateRatioOption = this.PolymeraseTemplateRatioOption;
        calc.NumberOfCellsInBinding = parseInt(this.NumberOfCellsInBinding, 10);
        calc.BindingPolymeraseOption = this.BindingPolymeraseOption;
        calc.StorageComplexOption = this.StorageComplexOption;
        calc.CustomVolumeOfBindingReactionInStorageComplex = parseFloat(this.CustomVolumeOfBindingReactionInStorageComplex);
        calc.AllowNonStandardReverseCalculations = this.AllowNonStandardReverseCalculations;

        // then setup the bucket we're using
        type = this.CollectionProtocol;
        if (this.MagBead === "True") { type = "MagBead"; }
        calc.bucket = this.constants.FindBucket(this.AnnealedBasePairLength, type, this.Chemistry, this.Cell);

        // we're about to recalculate, clear old errors so we'll get a fresh set
        calc.ClearErrors();

        // if we didn't find a bucket (because of a bogus insert size for example)
        // then return an error.

        this.errors = {};
        if (undefined === calc.bucket) {

            if (this.MagBead === "True") {
                if (!this.unitTesting) {
                    this.errors.InvalidInsertSizeMagBeadNew = this.constants.errors.InvalidInsertSizeMagBeadNew;
                } else {
                    this.errors.InvalidInsertSizeMagBead = this.constants.errors.InvalidInsertSizeMagBead;
                }
            } else {
                this.errors.InvalidInsertSizeStandard = this.constants.errors.InvalidInsertSizeStandard;
            }

            calc.bucket = this.constants.errorbucket;

        } else {
            if (calc.bucket.WarningMessage) {
                // if this bucket has a blanket error, then append that

                newerror = {
                    Coefficient: "",
                    ShortMessage: "",
                    LongMessage: calc.bucket.WarningMessage
                };
                this.errors.BucketWarning = newerror;
            }

            //
            // For unitTesting, compared to C#, disallow magbead less than 7500
            //

            if (this.unitTesting && this.MagBead === "True" && this.AnnealedBasePairLength < 7500) {
                this.errors.InvalidInsertSizeMagBead = this.constants.errors.InvalidInsertSizeMagBead;
            }

            //
            // Bugzilla 23145 - changed cutoff from 750 bp (bucket based) to 1000 bp (explicit)
            //

            if (!this.unitTesting && this.MagBead === "True" && this.AnnealedBasePairLength < 1000) {
                this.errors.InvalidInsertSizeMagBeadNew = this.constants.errors.InvalidInsertSizeMagBeadNew;
            }
        }

        //
        // trigger calculations in dependency order   
        // note: using getPrototypeOf doesn't give us what we're looking for here
        // this only works currently with __proto__ and therefore it doesn't with IE at the moment
        // (until IE supports ECMAScript 6)
        // 

        var prepCaller = new PrepOrderCaller();
        prepCaller.callPreps(calc.__proto__, calc);   // comment this out when running JSLint

        //
        // aggregate errors found during calculation
        //

        for (errorkey in calc.RaisedErrors) {
            if (calc.RaisedErrors.hasOwnProperty(errorkey)) {
                val = calc.RaisedErrors[errorkey];
                if (val !== undefined) {
                    this.errors[errorkey] = val;
                }
            }
        }

        //
        // Reflect the object to determine what to copy over
        //
        // Future: perhaps split this into one that props values
        // and another that adjusts scientific notion if we merge
        // this class with the calc class ultimately
        //

        minimumPipetting = this.constants.globals.MinimumPipettableVolume;

        for (result in calc) {
            if (calc.hasOwnProperty(result)) {
                
                // all public outputs are upper case, only import those
                // note: private internal javascript object ids are lower case or _
                firstletter = result[0];
                if (/^[A-Z]+$/.test(firstletter)) {
                    value = calc[result];
                    valuetype = this.sanitizedTypeFromName(value, result);
                    value = this.sanitize(value, valuetype);

                    // check for low pipetting volume on volume types
                    if ("volume" === valuetype && !isNaN(value)) {
                        if ((value !== 0) && (value < minimumPipetting)) {
                            this.errors.DifficultPipetting = this.constants.errors.DifficultPipetting;
                        }
                    }

                    this[result] = value;
                }

                // make sure all private properties are lower case, so they don't get exported
                // or give them another keyword that I can use to filter like private or internal
                // and then check for that here
            }
        }

        //
        // Errors are a json dictionary with a key/collection for example:
        //
        //  {"BucketWarning":{"Coefficient":"","ShortMessage":"","LongMessage":
        //      "The XL1 binding kit has not been optimized for use without magnetic beads"}}
        //  {"DifficultPipetting":{"Coefficient":"","ShortMessage":"","LongMessage":"Warning: Pipetting some volumes will be difficult."}}
        //

        this.Errors = JSON.stringify(this.errors);

        // we could trap for exceptions theoretically and then return success false here
        // or present them at least somehow for email back to the mothership
        this.Success = true;
    }
});


//
// Set of calculations shared by standard preparations and magbead calculations
// for computing volumes/concentrations and how many wells are needed on a sample plate
// To use this model, compose it with the current bucket as well as these settings:
// - ComplexReuse
// - MaxNumberOfCellsPerWellFromBucket
//
var BucketHelpers = Backbone.Model.extend({
	bucket: undefined,
	ComplexReuse: "",
	initialize: function(options) {
		this.bucket = options.bucket;
		this.ComplexReuse = options.ComplexReuse;

		// No need to use PrepOrderCaller for this with only two preps to call
		this.Prep2_MaxNumberOfCellsPerWellFromBucket();
	    this.Prep2_MaxVolumePerWellFromBucket();
	},
	
	Prep2_MaxNumberOfCellsPerWellFromBucket: function() {
		this.MaxNumberOfCellsPerWellFromBucket = parseInt((this.ComplexReuse === "True") ?        // Result: Prep2
            this.bucket.MaxNumberOfCellsPerWellWithReuse :
            this.bucket.MaxNumberOfCellsPerWellNoReuse, 10);
	},
	
    Prep2_MaxVolumePerWellFromBucket: function () {
        this.MaxVolumePerWellFromBucket = parseInt((this.ComplexReuse === "True") ?               // Result: Prep2
            this.bucket.MaxVolumePerWellWithReuse :
            this.bucket.MaxVolumePerWellNoReuse, 10);
    }
});

//
// Set of calculations shared by standard preparations and magbead calculations
// for computing volumes/concentrations and how many wells are needed on a sample plate
// To use this model, compose it with the current bucket as well as these settings:
// - ComplexReuse
// - MaxNumberOfCellsPerWellFromBucket
//
var SamplePlateLayout = Backbone.Model.extend({
	bucket: undefined,
	ComplexReuse: "",
	initialize: function(options) {
		this.bucket = options.bucket;
		this.ComplexReuse = options.ComplexReuse;
	    this.gaussianRounding = options.gaussianRounding;
		
		var helper = new BucketHelpers({bucket: options.bucket, ComplexReuse: options.ComplexReuse});
		this.MaxNumberOfCellsPerWellFromBucket = helper.MaxNumberOfCellsPerWellFromBucket;
	    this.MaxVolumePerWellFromBucket = helper.MaxVolumePerWellFromBucket;

	    // no additional setup needed, all functions are static using initialized values
	},
	ComputeVolumeInPartialWells: function(cellsRequested, numFullWells) {
	    var volumePerChipNoReuse = parseFloat(this.bucket.VolumePerChipNoReuse),
	        deadVolumePerWell = parseFloat(this.bucket.DeadVolumePerWell),
	        volumeOfDilutedSamplePerReuseCycle = this.bucket.VolumeOfDilutedSamplePerReuseCycle,
	        maxNumberOfCellsPerReuseCycle = this.bucket.MaxNumberOfCellsPerReuseCycle,
	        maxNumberOfCellsPerWellFromBucket = this.MaxNumberOfCellsPerWellFromBucket,
	        reuse, numCells, volumeInPartial, numCellsFromPartialWell, numberOfCycles, modulo;

	    if (cellsRequested === 0) {
	        return 0;
	    }

	    reuse = (this.ComplexReuse === "True");
	    if (!reuse) {
	        numCells = parseInt(cellsRequested % maxNumberOfCellsPerWellFromBucket, 10);
	        return (0 === numCells) ? 0 : parseFloat(volumePerChipNoReuse * numCells) + deadVolumePerWell;
	    }

	    volumeInPartial = Number.NaN;

	    numCellsFromPartialWell = cellsRequested - (numFullWells * maxNumberOfCellsPerWellFromBucket); // could be up to 23
	    if (0 === numCellsFromPartialWell) {
	        return 0;
	    }

	    numberOfCycles = parseInt(numCellsFromPartialWell / maxNumberOfCellsPerReuseCycle, 10); // should be 0, 1, 2, 3, 4, 5
	    modulo = numCellsFromPartialWell % maxNumberOfCellsPerReuseCycle;

	    if (modulo === 0) {
	        volumeInPartial = (volumeOfDilutedSamplePerReuseCycle * numberOfCycles) + deadVolumePerWell;
	    } else if (modulo === 1) {
	        volumeInPartial = (volumeOfDilutedSamplePerReuseCycle * numberOfCycles) + volumePerChipNoReuse + deadVolumePerWell;
	    } else if (modulo === 2) {
	        volumeInPartial = (volumeOfDilutedSamplePerReuseCycle * (numberOfCycles + 1)) + deadVolumePerWell;
	    }

        return volumeInPartial;
	},
	
	ComputeCellsFromPartialWell: function(volume) {
		var volumePerChipNoReuse = this.bucket.VolumePerChipNoReuse,
	        deadVolumePerWell = this.bucket.DeadVolumePerWell,
            volumeOfDilutedSamplePerReuseCycle = this.bucket.VolumeOfDilutedSamplePerReuseCycle,
            maxNumberOfCellsPerReuseCycle = this.bucket.MaxNumberOfCellsPerReuseCycle,
		    usableVolume, reuse, numCycles, numCells, remainingAmount;

        if (volume < deadVolumePerWell) {
            return 0;
        }

        usableVolume = this.gaussianRounding(volume, 2) - deadVolumePerWell;
		
		reuse = (this.ComplexReuse === "True");
        if (!reuse)
        {
            return parseInt(usableVolume / volumePerChipNoReuse, 10);
        }

        //
        // Need to determine how many compute cycles we can perform. And if there is just enough
        // for one more chip after we compute the cycles then add that one additional as well
        //

        numCycles = parseInt(usableVolume / volumeOfDilutedSamplePerReuseCycle, 10);
        numCells = parseInt(maxNumberOfCellsPerReuseCycle * numCycles, 10);

        remainingAmount = usableVolume - (numCycles * volumeOfDilutedSamplePerReuseCycle);
        if (remainingAmount >= volumePerChipNoReuse) {
            numCells += 1;
        }

        return numCells;
	},

	NumberOfFullWells: function(cellsRequested) {
        var result = cellsRequested / this.MaxNumberOfCellsPerWellFromBucket;
        if (_.isNaN(result)) { return result; } 
        return parseInt(result, 10);
	},

	VolumeFromFullWells: function(cellsRequested) {
        return this.NumberOfFullWells(cellsRequested) *
		this.MaxVolumePerWellFromBucket;
	},

	NumberOfCellsFromPartialWells: function(cellsRequested) {
		return parseInt(cellsRequested - 
			this.NumberOfCellsFromFullWells(cellsRequested), 10);
	},

	VolumeFromPartialWells: function(cellsRequested) {
		var fullWells = this.NumberOfFullWells(cellsRequested);
        return this.ComputeVolumeInPartialWells(cellsRequested, fullWells);	
	},

	NumberOfCellsFromFullWells: function(cellsRequested) {
        return parseInt(this.NumberOfFullWells(cellsRequested), 10) *
		parseInt(this.MaxNumberOfCellsPerWellFromBucket, 10);
	}
});

//
// TitrationCalc
// Used to compute the complex dilution for a standard titration
// Requires that we know certain things before computing:
// - TitrationConcentration
// - SampleConcentrationInBinding
// - VolumePerChipNoReuse
// - DeadVolumePerWell
//
// and also three helper functions in SampleCalc
// - Helper_SpikeInVolumeInDilution
// - Helper_BufferNeeded
// - Helper_ComputeVolumeOfBindingReaction
//
var TitrationCalc = Backbone.Model.extend({
	bucket: undefined,
	initialize: function(options) {
	    this.Helper_this = options.Helper_this;
		this.Helper_SpikeInVolumeInDilution = options.Helper_SpikeInVolumeInDilution;
		this.Helper_BufferNeeded = options.Helper_BufferNeeded;
		this.Helper_ComputeVolumeOfBindingReaction = options.Helper_ComputeVolumeOfBindingReaction;
		
		this.TitrationConcentration = options.TitrationConcentration;
		this.SampleConcentrationInBinding = options.SampleConcentrationInBinding;
		this.VolumePerChipNoReuse = options.VolumePerChipNoReuse;
		this.DeadVolumePerWell = options.DeadVolumePerWell;

		// No need to use PrepOrderCaller for this with only a few preps to call, just order them here
		this.Prep2_TitrationTotal();
		this.Prep4_BindingComplex();
		this.Prep4_SpikeInVolume();
		this.Prep6_BufferNeeded();
		this.Prep8_Dtt();
		this.Prep8_ComplexDilutionBuffer();
	},

	Prep6_BufferNeeded: function() {
	    this.BufferNeeded = this.Helper_BufferNeeded.call(this.Helper_this,   // Result: TiPrep3
	        this.TitrationTotal,                        // TiPrep1
	        this.TitrationBindingComplex,               // TiPrep2
	        this.TitrationSpikeInVolume);               // TiPrep2
	},

	Prep8_Dtt: function() {
		this.Dtt = this.BufferNeeded * 0.1;				// TiPrep3
	},
	
	Prep8_ComplexDilutionBuffer: function() {
		this.TitrationComplexDilutionBuffer = this.BufferNeeded * 0.9;	// TiPrep4
	},
	
	Prep4_SpikeInVolume: function() {
		this.TitrationSpikeInVolume =                   // Result: TiPrep2
			this.Helper_SpikeInVolumeInDilution.call(this.Helper_this,		// TiPrep0
				this.TitrationConcentration,            // TiPrep0
				this.TitrationTotal);					// TiPrep1
	},
	
	Prep4_BindingComplex: function() {
		this.TitrationBindingComplex =					// Result: TiPrep2
			this.Helper_ComputeVolumeOfBindingReaction.call(this.Helper_this,	// TiPrep0
				this.TitrationConcentration,			// TiPrep0
				this.TitrationTotal,					// TiPrep1
				this.SampleConcentrationInBinding);		// TiPrep0
	},
	
	Prep2_TitrationTotal: function() {
		this.TitrationTotal =                           // Result: TiPrep1
			parseFloat(this.VolumePerChipNoReuse) +     // TiPrep0
			parseFloat(this.DeadVolumePerWell);			// TiPrep0
	}
	

});

//
// MagBeadCalc
// Used to calculate a final magbead preparation
// Requires that you know certain things before it can be computed:
// - PreparationProtocol
// - UseSpikeInControl
// - ComplexReuse
// - LowConcentrationsAllowed (aka "non-standard")
// - SampleConcentrationOnPlate
// - TitalComplexDilutionCells
// - NumberOfFullWells
// - FinalBindingConcentration
// - FinalStorageConcentration
// - SpikeInPercentOfTemplateConcentration
//
var MagBeadCalc = Backbone.Model.extend({
    globals: undefined,
    bucket: undefined,
    SamplePlateLayout: undefined,

    MagBeadStockSpikeInConcentration: 10.000,           // Spike in dilution for mag bead. Assumes 10000 pM stock concentration which we dilute
    MagBeadIntermediateSpikeInConcentration: 0.500,     // in two steps
    MagBeadFinalSpikeInConcentration: 0.010,            // down to 10 pM to use in complex dilution

    initialize: function (options) {
        this.bucket = options.bucket;
        this.globals = options.globals;
        this.gaussianRounding = options.gaussianRounding;

        this.PreparationProtocol = options.PreparationProtocol;
        this.LongTermStorage = options.LongTermStorage;
        this.UseSpikeInControl = options.UseSpikeInControl;
        this.ComplexReuse = options.ComplexReuse;
        this.LowConcentrationsAllowed = options.LowConcentrationsAllowed;
        this.SampleConcentrationOnPlate = options.SampleConcentrationOnPlate;
        this.TotalComplexDilutionCells = options.TotalComplexDilutionCells;
        this.NumberOfFullWells = options.NumberOfFullWells;
        this.FinalBindingConcentration = options.FinalBindingConcentration;
        this.FinalStorageConcentration = options.FinalStorageConcentration;
        this.SpikeInPercentOfTemplateConcentration = options.SpikeInPercentOfTemplateConcentration;

        this.SamplePlateLayout = new SamplePlateLayout({ bucket: this.bucket, ComplexReuse: this.ComplexReuse,
            gaussianRounding: this.gaussianRounding
        });

        this.MagneticBeadSluffFactor = this.globals.MagneticBeadSluffFactor;

        // bug 24078 - support raising errors here as well
        this.Errors = [];

        //
        // Call all "Prep" functions in our prototype in index order
        // to calculate our coefficients in dependency order
        //

        var prepCaller = new PrepOrderCaller();
        prepCaller.callPreps(this.__proto__, this);   // comment this out when running JSLint
    },

    Prep2_MagBeadOriginalBoundSampleConcentration: function () {
        this.MagBeadOriginalBoundSampleConcentration = this.FinalStorageConcentration;  // Result: MagPrep2
    },
    Prep2_MagBeadIntermediateDilutionConcentration: function () {
        this.MagBeadIntermediateDilutionConcentration =                         // Result: MagPrep2
		(this.LowConcentrationsAllowed === "True") ?                             // MagPrep0
            this.FinalBindingConcentration : 0.5;                               // MagPrep0
    },
    Prep2_FinalBeadedSampleConcentration: function () {
        this.FinalBeadedSampleConcentration = this.SampleConcentrationOnPlate;  // Result: MagPrep2

        /* We originally used this:
        ((MagneticBeadVolumeFinalDilutedComplex * 1000 * OnCellDnaQuantityInFemtomoles)
        / MagneticBeadVolumeFinalDilutedOnChip)
        / FinalBeadedComplexDilutionVolumeOfBeadedComplex;
        */
    },
    Prep2_MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn: function () {
        this.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn =                  // Result: MagPrep2
			(0.0 === this.SampleConcentrationOnPlate) ? 0.0 : 1.0;               // MagPrep0
    },
    Prep2_MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer: function () {
        var that = this;
        this.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer =                 // Result: MagPrep2
		(function () {
		    if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }        // MagPrep0
		    var test = (that.MagBeadStockSpikeInConcentration /                 // MagPrep0
                        that.MagBeadIntermediateSpikeInConcentration) * 0.01;   // MagPrep0
		    if (test >= 1.0) {
		        return (that.MagBeadStockSpikeInConcentration /                 // MagPrep0
		            that.MagBeadIntermediateSpikeInConcentration) * 0.99;       // MagPrep0
		    }

		    return (that.MagBeadStockSpikeInConcentration /                     // MagPrep0
                that.MagBeadIntermediateSpikeInConcentration) - 1.0;            // MagPrep0
		} ());
    },
    Prep8_MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer: function () {
        var that = this;
        this.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer = (function () {      // Result: MagPrep8
            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }            // MagPrep0
            if (that.MagBeadComplexDilutionVolumeOfSpikeInDilution * 0.01 >= 1) {   // MagPrep6

                return (that.MagBeadComplexDilutionVolumeOfSpikeInDilution) *        // MagPrep6
                    /*that.MagneticBeadSluffFactor *   removed for 2.1.0.0  */     // MagPrep0
                (1.0 -
                    (that.MagBeadFinalSpikeInConcentration /                        // MagPrep0
                        that.MagBeadIntermediateSpikeInConcentration));             // MagPrep0
            }

            return (that.MagBeadIntermediateSpikeInConcentration /              // MagPrep0
                    that.MagBeadFinalSpikeInConcentration) - 1.0;               // MagPrep0
        } ());
    },
    Prep8_MagBeadSpikeInDilutionVolumeOfFirstDilution: function () {
        var that = this;
        this.MagBeadSpikeInDilutionVolumeOfFirstDilution = (function () {        // Result: MagPrep8
            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }        // MagPrep0
            if (that.MagBeadComplexDilutionVolumeOfSpikeInDilution * 0.01 >= 1){ // MagPrep6
                return (that.MagBeadComplexDilutionVolumeOfSpikeInDilution) *    // MagPrep6
						/*that.MagneticBeadSluffFactor * removed for 2.1.0.0 */ // MagPrep0
                        (that.MagBeadFinalSpikeInConcentration /                // MagPrep0
                         that.MagBeadIntermediateSpikeInConcentration);         // MagPrep0
            }
            return 1.0;
        } ());
    },

    //
    // Complex Dilution and Bead Wash
    //

    Prep8_MagBeadComplexDilutionVolumeOfFirstBindingBuffer: function () {
        var that = this;
        this.MagBeadComplexDilutionVolumeOfFirstBindingBuffer = (function () {    // Result: MagPrep8
            //
            // If they've asked for no cells, then don't show any buffer
            // If they're not using long term storage, then we don't do this dilution either
            //

            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }    // MagPrep0
            if (0 === that.TotalComplexDilutionCells) { return 0.0; }       // MagPrep0

            if (that.PreparationProtocol === "Small" && that.LongTermStorage !== "True") // MagPrep0
            { return 0.0; }

            var ratio = that.MagBeadIntermediateDilutionConcentration /     // MagPrep2
                           that.MagBeadOriginalBoundSampleConcentration,    // MagPrep2
                test = ratio *
				    /* that.MagneticBeadSluffFactor * removed 2.1.0.0  */   // MagPrep0
				    that.MagBeadComplexDilutionVolumeOfSecondComplex;       // MagPrep6

            if (test >= 1) {
                return that.MagBeadComplexDilutionVolumeOfSecondComplex *   // MagPrep6
					   /* that.MagneticBeadSluffFactor * removed 2.1.0.0 */ // MagPrep0
                    (1 - ratio);
            }

            return that.MagBeadOriginalBoundSampleConcentration /           // MagPrep2
                   that.MagBeadIntermediateDilutionConcentration - 1;       // MagPrep2

            /*
            ratio = MagBeadOriginalBoundSampleConcentration /
            MagBeadIntermediateDilutionConcentration;

            if (ratio * 0.01 >= 1.0)
            {
            return ratio * 0.99;
            }
            return ratio - 1;*/
        } ());
    },

    Prep8_MagBeadComplexDilutionVolumeOfFirstComplex: function () {
        var that = this;
        this.MagBeadComplexDilutionVolumeOfFirstComplex = (function () {      // Result: MagPrep8
            //
            // If they've asked for no cells, then don't show any buffer
            // If they're not using long term storage, then we don't do this dilution either
            //

            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }     // MagPrep0
            if (0 === that.TotalComplexDilutionCells) { return 0.0; }        // MagPrep0

            if (that.PreparationProtocol === "Small" && that.LongTermStorage !== "True") { // MagPrep0
                return 1.0;
            }

            var result =
				that.MagBeadComplexDilutionVolumeOfSecondComplex *          // MagPrep6
				/* that.MagneticBeadSluffFactor *  removed for 2.1.0.0  */  // MagPrep0
				(that.MagBeadIntermediateDilutionConcentration /            // MagPrep2
                    that.MagBeadOriginalBoundSampleConcentration);          // MagPrep2

            if (result >= 1.0) {
                return result;
            }
            return 1.0;
        } ());
    },

    Prep8_MagBeadComplexDilutionVolumeOfSecondBindingBuffer: function () {
        this.MagBeadComplexDilutionVolumeOfSecondBindingBuffer =            // Result: MagPrep8
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                   // MagPrep0
		this.MagBeadComplexDilutionVolumeTotal -                            // MagPrep4
        this.MagBeadComplexDilutionVolumeOfSpikeInDilution -                // MagPrep6
		this.MagBeadComplexDilutionVolumeOfSecondComplex -                  // MagPrep6
        this.MagBeadComplexDilutionVolumeOfSaltBuffer;                      // MagPrep7

        // bug 24078 - if salt adjustment would cause BBB to go negative, then omit
        // this calculation and instead make all of the BBB to instead appear here
        // as BWB (to get you a little more salt even if it is not enough). So we need
        // to calculate total - spike-in - complex here to see if we're going negative

        var aliquotSoFar = this.MagBeadComplexDilutionVolumeTotal -           // MagPrep4
            this.MagBeadComplexDilutionVolumeOfSpikeInDilution -              // MagPrep6
            this.MagBeadComplexDilutionVolumeOfSecondComplex;                 // MagPrep6
        if (aliquotSoFar < 0.0)
        {
            // error case, the requested concentration on plate/chip is SO HIGH
            // that we just can't get there from here. Error out

            this.MagBeadComplexDilutionVolumeOfSaltBuffer = Number.NaN;
            this.MagBeadComplexDilutionVolumeOfSecondBindingBuffer = Number.NaN;

            this.Errors.push((this.MagBeadComplexDilutionVolumeOfSpikeInDilution > 0.0) ?
                "ConcentrationOnPlateTooHighWithControl" :      // suggest they try without control
                "ConcentrationOnPlateTooHighWithoutControl");   // otherwise they're dead
        }
        if (aliquotSoFar - this.MagBeadComplexDilutionVolumeOfSaltBuffer - 1.0 < 0.0)
        {
            // we have enough concentration, but not with the salt adjustment
            // so instead of using salt adjustment, use BWB entirely instead
            // and also take this case if BBB would be < 1.0 for difficult pipetting
            this.MagBeadComplexDilutionVolumeOfSaltBuffer = aliquotSoFar;
            this.MagBeadComplexDilutionVolumeOfSecondBindingBuffer = 0.0;
        }
    },

    //
    // Added for 2.1.0.0 to adjust for low concentration samples / size selected libraries
    //
    // BWBVolume = ComplexVolumeInBeading *
    //            (BBBSaltConcentration - BindingSaltConcentration) / (BWBSaltConcentration - BBBSaltConcentration)
    // Where:
    //   BBBSaltConcentration = 100
    //   BWBSaltConcentration = 400
    //   BindingSaltConcentration = 10 or 55 nM in the storage case, because the complex was diluted in the
    //      first dilution step 50:50 with BBB which has 100 nM salt. So the resulting salt concentration
    //      when there is extra dilution is 55 nM instead of 10 nM. NOT with large scale prep though. (bug 24078)
    //
    Prep7_MagBeadComplexDilutionVolumeOfSaltBuffer: function () {
        var BBBSaltConcentration = 100;
        var BWBSaltConcentration = 400;
        var BindingSaltConcentration = (this.PreparationProtocol === "Small" && this.LongTermStorage === "True") ? 55 : 10;
        var amount =
        (0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                   // MagPrep0
        (this.MagBeadComplexDilutionVolumeOfSecondComplex *                 // MagPrep6
        (BBBSaltConcentration - BindingSaltConcentration)) / (BWBSaltConcentration - BBBSaltConcentration);

        // only add BWB if the amount to add is more than 1 uL
        this.MagBeadComplexDilutionVolumeOfSaltBuffer = (amount < 1.0) ? 0.0 : amount;

        // bug 24078 - this resulting value may be CHANGED above by computation of the
        // VolumeOfSecondBindingBuffer if needed. So this is not the only place we mutate it
    },

    Prep6_MagBeadComplexDilutionVolumeOfSpikeInDilution: function () {
        var that = this;
        this.MagBeadComplexDilutionVolumeOfSpikeInDilution = (function () { // Result: MagPrep6
            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }    // MagPrep0
            if (that.UseSpikeInControl === "True")                          // MagPrep0
            {
                return that.SpikeInPercentOfTemplateConcentration *         // MagPrep0
                        (that.FinalBeadedSampleConcentration /              // MagPrep2
                        that.MagBeadFinalSpikeInConcentration) *            // MagPrep0
                        that.MagBeadComplexDilutionVolumeTotal;             // MagPrep4
            }

            return 0.0;
        } ());
    },

    Prep6_MagBeadComplexDilutionVolumeOfSecondComplex: function () {
        this.MagBeadComplexDilutionVolumeOfSecondComplex =                  // Result: MagPrep6
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                   // MagPrep0
		    (this.FinalBeadedSampleConcentration /                          // MagPrep2
		     this.MagBeadIntermediateDilutionConcentration) *               // MagPrep2
             this.MagBeadComplexDilutionVolumeTotal;                        // MagPrep4
    },

    Prep4_MagBeadComplexDilutionVolumeTotal: function () {
        this.MagBeadComplexDilutionVolumeTotal =                            // Result: MagPrep4
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.ComplexBeadIncubationVolumeOfComplex; /* *                        // MagPrep2
		this.MagneticBeadSluffFactor;  removed for 2.1.0.0    */                        // MagPrep0
    },

    Prep6_BeadWashVolumeOfBeads: function () {
        this.BeadWashVolumeOfBeads =                                        // Result: MagPrep6
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.ComplexBeadIncubationVolumeOfWashedBeads *                     // MagPrep4
		this.MagneticBeadSluffFactor;   // leave this in for 2.1.0.0, used for wash beads only now
    },

    Prep8_BeadWashVolumeOfBeadWashBuffer: function () {
        this.BeadWashVolumeOfBeadWashBuffer =                               // Result: MagPrep8
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.BeadWashVolumeOfBeads;                                         // MagPrep6
    },

    Prep8_BeadWashVolumeOfBeadBindingBuffer: function () {
        this.BeadWashVolumeOfBeadBindingBuffer =                            // Result: MagPrep8
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.BeadWashVolumeOfBeads;                                         // MagPrep6
    },

    Prep4_ComplexBeadIncubationVolumeOfWashedBeads: function () {
        var that = this;
        this.ComplexBeadIncubationVolumeOfWashedBeads = (function () {       // Result: MagPrep4
            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }    // MagPrep0
            if (0 === that.TotalComplexDilutionCells) { return 0.0; }       // MagPrep0

            return that.ComplexBeadIncubationVolumeOfComplex *              // MagPrep2
				   that.globals.MagBeadToComplexRatio;                      // MagPrep0

            /* 
            * This is Ravi's alternative clever equation, 
            * any questions need to go to him. This doesn't 
            * scale over 8 chips though:
            *
            * return  VolumeOfBeadsPerCell *
            (TotalComplexDilutionCells + (DeadVolumePerWell /
            FinalBeadedComplexDilutionVolumeOfBeadedComplex));*/
        } ());
    },

    Prep2_ComplexBeadIncubationVolumeOfComplex: function () {
        var that = this;
        this.ComplexBeadIncubationVolumeOfComplex = (function () {            // Result: MagPrep2
            if (0.0 === that.SampleConcentrationOnPlate) { return 0.0; }     // MagPrep0
            if (0 === that.TotalComplexDilutionCells) { return 0.0; }        // MagPrep0

            //
            // Ravi gave me this equation only good for 1-8 cells: 
            // (FinalBeadedComplexDilutionVolumeOfBeadedComplex * TotalComplexDilutionCells) + DeadVolumePerWell;
            // 
            // Really it needs to incorporate DeadVolumePerWell for each full and partial well. SO use SamplePlateLayout
            //

            var full = parseFloat(that.SamplePlateLayout.VolumeFromFullWells(that.TotalComplexDilutionCells)),      // MagPrep0
                partial = parseFloat(that.SamplePlateLayout.VolumeFromPartialWells(that.TotalComplexDilutionCells)); // MagPrep0

            return full + partial;
        } ());
    },


    Prep4_ComplexBeadWashVolumeOfFirstBindingBuffer: function () {
        this.ComplexBeadWashVolumeOfFirstBindingBuffer =                    // Result: MagPrep4
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.ComplexBeadIncubationVolumeOfComplex;                          // MagPrep2
    },

    Prep4_ComplexBeadWashVolumeOfBeadWashBuffer: function () {
        this.ComplexBeadWashVolumeOfBeadWashBuffer =                        // Result: MagPrep4
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.ComplexBeadIncubationVolumeOfComplex;                          // MagPrep2
    },

    Prep4_ComplexBeadWashVolumeOfSecondBindingBuffer: function () {
        this.ComplexBeadWashVolumeOfSecondBindingBuffer =                   // Result: MagPrep4
		(0.0 === this.SampleConcentrationOnPlate) ? 0.0 :                    // MagPrep0
		this.ComplexBeadIncubationVolumeOfComplex;                          // MagPrep2
    }
});

/*

*/


//
// Calculations for samples
//
var SampleCalc = Backbone.Model.extend({
    globals: undefined,
    bucket: undefined,
    errors: undefined,

    initialize: function (options) {
        this.globals = options.globals;
        this.errors = options.errors;

        if (options.hasOwnProperty("unitTesting")) {
            this.unitTesting = options.unitTesting;
        }
    },

    ComputeOption: "Volume",
    MagBead: "Yes",
    PreparationProtocol: "Small",
    UseSpikeInControl: "Yes",
    ComplexReuse: "No",
    LowConcentrationsAllowed: "No",
    BindingComputation: "Volume",           // deprecated
    SampleVolumeToUseInAnnealing: 0,
    NumberOfCellsToUse: 0,
    StartingSampleConcentration: 0,
    CustomNonStandardAnnealingConcentration: 0,
    CustomNonStandardBindingConcentration: 0,
    BindingComplexNumberOfCellsRequested: 0,
    LoadingTitrationNumberOfCellsRequested: 0,
    TitrationConcentration1: 0,
    TitrationConcentration2: 0,
    TitrationConcentration3: 0,
    TitrationConcentration4: 0,
    AvailableSampleVolume: 0,
    CollectionProtocol: "Standard",
    Chemistry: "Version2",
    Cell: "CellVersion3",
    AnnealedBasePairLength: 10000,
    CustomConcentrationOnPlate: 0,
    ConcentrationOnPlateOption: "Default",
    NonStandardAnnealingConcentrationOption: "Default",
    SpikeInRatioOption: "Default",
    CustomSpikeInRatioPercent: "0",
    CustomPolymeraseTemplateRatio: "0",
    PolymeraseTemplateRatioOption: "Default",
    NumberOfCellsInBinding: 0,
    BindingPolymeraseOption: "Volume",
    StorageComplexOption: "Default",
    CustomVolumeOfBindingReactionInStorageComplex: 0,

    // to force all calculations (no short cuts)
    unitTesting: false,

    //
    // Errors
    //

    RaisedErrors: {},
    ClearErrors: function () {
        this.RaisedErrors = {};
    },
    ClearError: function (item) {
        if ((this.RaisedErrors.hasOwnProperty(item)) && (this.RaisedErrors[item] !== undefined)) {
            this.RaisedErrors[item] = undefined;
        }
    },
    RaiseError: function (item) {
        if (!this.errors.hasOwnProperty(item)) {
            alert("An internal error has occurred. Please let Pacific Biosciences support know. (RaiseError)");
        }

        this.RaisedErrors[item] = this.errors[item];
    },

    //
    // Rounding
    //

    gaussianRounding: function (num, decimalPlaces) {

        //
        // to match C#'s symmetric rounding toward even values, use our own rounding in javascript
        // from http://stackoverflow.com/questions/3108986/gaussian-bankers-rounding-in-javascript
        // but we extend the interrim precision from 8 places to 16 places to more closely match
        // the rounding in C# land. Some of our calculations are just at the edge and hit that.
        // modified for JSLint
        //

        var d, m, n, i, f, r;
        d = decimalPlaces || 0;
        m = Math.pow(10, d);
        n = +(d ? num * m : num).toFixed(16); // Avoid rounding errors
        i = Math.floor(n);
        f = n - i;
        r = (f === 0.5) ? ((i % 2 === 0) ? i : i + 1) : Math.round(n);
        return d ? r / m : r;
    },

    //
    // Coefficients
    //

    Prep2_SpikeInStockConcentration: function () {
        this.SpikeInStockConcentration = parseFloat(this.bucket.SpikeInStockConcentration);         // Result: Prep2
    },
    Prep2_MaxNumberOfCellsPerWellFromBucket: function () {
        this.MaxNumberOfCellsPerWellFromBucket = parseInt((this.ComplexReuse === "True") ?        // Result: Prep2
            this.bucket.MaxNumberOfCellsPerWellWithReuse :
            this.bucket.MaxNumberOfCellsPerWellNoReuse, 10);
    },
    Prep2_MaxVolumePerWellFromBucket: function () {
        this.MaxVolumePerWellFromBucket = parseFloat((this.ComplexReuse === "True") ?               // Result: Prep2
            this.bucket.MaxVolumePerWellWithReuse :
            this.bucket.MaxVolumePerWellNoReuse);
    },
    Prep2_SampleConcentrationOnCell: function () { // private
        this.SampleConcentrationOnCell = parseFloat((this.PreparationProtocol === "Small") ?        // Result: Prep2
            this.bucket.SampleConcentrationOnChipSmallScale :
            this.bucket.SampleConcentrationOnChipLargeScale);
    },
    Prep2_SampleConcentrationInAnnealingReaction: function () {
        this.SampleConcentrationInAnnealingReaction = parseFloat((this.PreparationProtocol === "Small") ?     // Result: Prep2
            (this.LongTermStorage === "True") ? this.bucket.SampleConcentrationInAnnealingSmallStorage :
                this.bucket.SampleConcentrationInAnnealingSmallScale :
            this.bucket.SampleConcentrationInAnnealingLargeScale);
    },
    Prep2_DilutedPrimerConcentration: function () {
        this.DilutedPrimerConcentration = parseFloat((this.PreparationProtocol === "Small" && this.LongTermStorage === "False") ?           // Result: Prep2
            this.bucket.DilutedPrimerConcentrationSmallScale :
            this.bucket.DilutedPrimerConcentrationLargeScale);
    },
    Prep2_DefaultPolymeraseTemplateRatio: function () {
        this.DefaultPolymeraseTemplateRatio = parseFloat((this.PreparationProtocol === "Small") ?       // Result: Prep2
            this.bucket.PolymeraseTemplateRatioSmallScale :
            this.bucket.PolymeraseTemplateRatioLargeScale);
    },
    Prep2_MinimumSampleConcentration: function () { // private
        this.MinimumSampleConcentration = parseFloat((this.PreparationProtocol === "Small") ?           // Result: Prep2
            this.bucket.MinimumSampleConcentrationSmallScale :
            this.bucket.MinimumSampleConcentrationLargeScale);
    },
    Prep2_DefaultSpikeInRatioToTemplate: function () {
        this.DefaultSpikeInRatioToTemplate = parseFloat(this.bucket.SpikeInPercentOfTemplateConcentration);    // Result: Prep2
    },
    Prep4_DefaultSpikeInRatioToTemplatePercent: function () {
        this.DefaultSpikeInRatioToTemplatePercent = this.DefaultSpikeInRatioToTemplate * 100;    // Result: Prep4
    },
    Prep2_BucketSize: function () {
        this.BucketSize = this.bucket.Size; // Result: Prep2
    },
    Prep2_VolumePerChipNoReuse: function () {
        this.VolumePerChipNoReuse = parseFloat(this.bucket.VolumePerChipNoReuse);                   // Result: Prep2
    },
    Prep2_PrimerToTemplateRatio: function () { // private
        this.PrimerToTemplateRatio = parseFloat((this.PreparationProtocol === "Small") ?            // Result: Prep2
            this.bucket.DefaultPrimerToTemplateRatioSmallScale :
            this.bucket.DefaultPrimerToTemplateRatioLargeScale);
    },
    Prep2_StartingSequencingPrimerBufferConcentration: function () {
        this.StartingSequencingPrimerBufferConcentration = parseFloat(this.globals.AnnealingPrimerStockConcentration); // Result: Prep2
    },
    Prep2_MinimumVolumeOfDilutedPrimer: function () {
        this.MinimumVolumeOfDilutedPrimer = parseFloat(this.bucket.MinimumVolumeOfDilutedPrimer);       // Result: Prep2
    },

    //
    // Strings specific by bucket
    //

    Prep2_ControlTubeNameInKit: function () {
        var that = this;
        this.ControlTubeNameInKit = (function () {                                           // Result: Prep2
            if (that.MagBead === "True") {
                return "DNA Control Tube";
            }
            if (that.CollectionProtocol === "Standard") {
                return "DNA Control Tube";
            }
            if (that.CollectionProtocol === "Strobe") {
                return "Strobe DNA Control Tube";
            }
            return "Unknown";
        } ());
    },
    Prep2_TubeNameSpikeInControl: function () {
        this.TubeNameSpikeInControl = this.bucket.TubeNameSpikeInControl;                   // Result: Prep2
    },
    Prep2_TubeNamePolymerase: function () {
        this.TubeNamePolymerase = this.bucket.TubeNamePolymerase;                           // Result: Prep2
    },
    Prep2_TubeNameBindingBuffer: function () {
        this.TubeNameBindingBuffer = this.bucket.TubeNameBindingBuffer;                     // Result: Prep2
    },
    Prep2_TubeNameDtt: function () {
        this.TubeNameDtt = this.bucket.TubeNameDtt;                                         // Result: Prep2
    },
    Prep2_TubeNameComplexStorageBuffer: function () {
        this.TubeNameComplexStorageBuffer = this.bucket.TubeNameComplexStorageBuffer;       // Result: Prep2
    },
    Prep2_TubeNameComplexDilutionBuffer: function () {
        this.TubeNameComplexDilutionBuffer = this.bucket.TubeNameComplexDilutionBuffer;     // Result: Prep2
    },
    Prep2_TubeNameSequencingPrimer: function () {
        this.TubeNameSequencingPrimer = this.bucket.TubeNameSequencingPrimer;               // Result: Prep2
    },
    Prep2_TubeNameNucleotides: function () {
        this.TubeNameNucleotides = this.bucket.TubeNameNucleotides;                         // Result: Prep2
    },
    Prep2_SpikeInTubeLabel: function () {
        this.SpikeInTubeLabel =                                                             // Result: Prep2
            (this.UseSpikeInControl === "False") ?
                "N/A" : this.bucket.SpikeInTubeLabel;
    },
    Prep2_PolymeraseTubeLabel: function () {
        this.PolymeraseTubeLabel = this.bucket.PolymeraseTubeLabel;                         // Result: Prep2
    },
    Prep2_SpikeInTubeInsertSize: function () {
        this.SpikeInTubeInsertSize = (_.isNaN(this.BucketSize) ? "0" : this.BucketSize) + "bp"; // Result: Prep2
    },
    Prep2_PolymeraseTubeInsertSize: function () {
        this.PolymeraseTubeInsertSize = (_.isNaN(this.BucketSize) ? "0" : this.BucketSize) + "bp"; // Result: Prep2
    },

    //
    // Helpers (some are output to the UI though)
    //

    Prep2_nonStandard: function () {
        this.nonStandard = (this.LowConcentrationsAllowed === "True");                 // Result: Prep2
    },

    Prep4_MinimumVolumeOfBindingReaction: function () {
        this.MinimumVolumeOfBindingReaction =                                         // Result: Prep4
            (this.nonStandard) ?                                                      // Prep2
            0 : this.globals.MinimumVolumeOfDefaultBindingReaction;
    },

    Prep2_SetupSamplePlateLayout: function () {
        this.SamplePlateLayout = new SamplePlateLayout(                     // Result: Prep2
			{bucket: this.bucket,                                           // Prep0
			ComplexReuse: this.ComplexReuse,                                // Prep0
			gaussianRounding: this.gaussianRounding                         // Prep0


});
    },

    Prep6_MaxVolumePerWell: function () {
        this.MaxVolumePerWell =                                             // Result: Prep6
            (this.NumberOfFullWells === 0) ? 0 :                             // Prep4
                this.MaxVolumePerWellFromBucket;                            // Prep2
    },

    Prep6_MaxNumberOfCellsPerWell: function () {
        this.MaxNumberOfCellsPerWell =                                     // Result: Prep6
             (this.NumberOfFullWells === 0) ? 0 :                            // Prep4
                 this.MaxNumberOfCellsPerWellFromBucket;                    // Prep2
    },

    ComputeNonStandardTotalVolumeOfAnnealingReaction: function (sampleVolumeInAnnealingReaction, primerVolume) { // Result: Prep0
        return (sampleVolumeInAnnealingReaction + primerVolume) / 0.9;
    },

    ComputeNonStandardPrimerVolumeInAnnealingReaction: function (sampleVolumeInAnnealing) {         // Result: Prep4
        var molesOfTemplate, molesOfPrimer;
        molesOfTemplate = (sampleVolumeInAnnealing * this.StartingSampleConcentrationInNanoMolar);  // Prep4
        molesOfPrimer = this.PrimerToTemplateRatio * molesOfTemplate;                               // Prep2
        return molesOfPrimer / this.DilutedPrimerConcentration;                                     // Prep2
    },

    ComputeSampleVolumeInAnnealingReactionFromBindingVolume: function (bindingVolume, targetConcentrationInAnnealing) { // Result: Prep4
        return bindingVolume * (targetConcentrationInAnnealing / this.StartingSampleConcentrationInNanoMolar);          // Prep4
    },

    ComputeVolumeOfAnnealingReactionInBindingFromDesiredCells: function (requestedCells, reuse, sampleConcentrationInBinding) {  // Result: Prep6
        var numFullWells, volumeInPartial, volumeOnPlate, totalVolumeOfBindingReacton;

        numFullWells = parseInt(requestedCells / this.MaxNumberOfCellsPerWellFromBucket, 10);       // Prep2
        volumeInPartial = this.SamplePlateLayout.ComputeVolumeInPartialWells(requestedCells, numFullWells);    // Prep2 for SPL
        volumeOnPlate = (numFullWells * this.MaxVolumePerWellFromBucket) + volumeInPartial;         // Prep2

        // no longer needed: SampleConcentrationInBinding is now computed from FinalAnnealedConcentration
        //var totalVolumeOfBindingReacton = Math.max(this.MinimumVolumeOfBindingReaction, volumeOnPlate * 
        //    (this.ConcentrationOnPlate / 
        //       (LowConcentrationsAllowed === "True") ? 
        //          (this.FinalAnnealedConcentration * 0.6) : 
        //          this.SampleConcentrationInBinding)));

        /* removed for 2.1.0.0 - no more sluff factor for magbead complex dilution (just bead wash)
        if (this.MagBead === "True") {
            volumeOnPlate *= this.globals.MagneticBeadSluffFactor;                                      // Prep0

            // In large scale mag bead we have two sluff factors, one for the additional dilution step from storage complex
            if (this.PreparationProtocol === "Large") {
                volumeOnPlate *= this.globals.MagneticBeadSluffFactor;                                  // Prep0
            }
        }
        */

        totalVolumeOfBindingReacton = Math.max(
          this.MinimumVolumeOfBindingReaction, volumeOnPlate *                                          // Prep4
          (this.ConcentrationOnPlate / sampleConcentrationInBinding));                                  // Prep6

        return totalVolumeOfBindingReacton * 0.6;
    },


    //
    // Calculations
    //

    Prep10_SampleConcentrationInBinding: function () {
        var ratio = this.bucket.RatioOfBindingToAnnealingConcentration;
        this.SampleConcentrationInBinding =                                         // Result: Prep10
            ratio * ((this.nonStandard) ?                                           // Prep2
            this.NonStandardAnnealingConcentration :                                // Prep8
            this.SampleConcentrationInAnnealingReaction);                           // Prep2
    },

    Prep12_VolumeOfAnnealingReactionInBindingFromDesiredCells: function () {
        this.VolumeOfAnnealingReactionInBindingFromDesiredCells =                   // Result: Prep12
            this.ComputeVolumeOfAnnealingReactionInBindingFromDesiredCells(         // Prep6
                this.NumberOfCellsInBinding,                                        // Prep0
                this.ComplexReuse === "True",                                        // Prep0
                this.SampleConcentrationInBinding);                                 // Prep10
    },

    Prep4_DefaultConcentrationOnPlate: function () {
        this.DefaultConcentrationOnPlate =                                          // Result: Prep4
            this.SampleConcentrationOnCell /                                        // Prep2
                this.bucket.SampleDilutionFactorOnInstrument;                       // Prep0
    },

    Prep12_SampleVolumeInAnnealingReaction: function () {
        var that = this;
        this.SampleVolumeInAnnealingReaction = (function () {                                            // Result: Prep12
            var concentrationInAnnealing, concentrationInBinding, totalVolumeOfBindingReaction,
                totalVolumeNeededForAnnealing, result;

            if (that.ComputeOption === "Volume") {
                return that.SampleVolumeToUseInAnnealing;                                               // Prep0
            }

            concentrationInAnnealing = that.SampleConcentrationInAnnealingReaction;                 // Prep2
            concentrationInBinding = that.SampleConcentrationInBinding;                             // Prep10

            if (that.nonStandard) {                                                                     // Prep2
                //
                // use the AvailableSampleVolume entered to compute the maximum concentration at annealing
                // then back compute for 1 chip each from that. So instead of using the standard SampleConcentrationInBinding
                // we use a computed form instead.
                //

                if (that.AllowNonStandardReverseCalculations) {
                    concentrationInAnnealing = that.NonStandardAnnealingConcentration;                  // Prep8
                    concentrationInBinding = that.MaxAvailableAnnealingConcentrationInBinding;          // Prep10
                } else {
                    if (that.ComputeOption === "Titration") {
                        that.RaiseError("NonStandardTitration");
                    }
                    else {
                        that.RaiseError("NonStandardByCells");
                    }
                    return Number.NaN;
                }
            }

            if (that.ComputeOption === "Cells") {
                totalVolumeOfBindingReaction =
                    that.ComputeVolumeOfAnnealingReactionInBindingFromDesiredCells(                     // Prep6
                        parseInt(that.NumberOfCellsToUse, 10),                                          // Prep0
                        that.ComplexReuse === "True", concentrationInBinding);                           // Prep0

                totalVolumeNeededForAnnealing =
                    that.ComputeSampleVolumeInAnnealingReactionFromBindingVolume(totalVolumeOfBindingReaction, concentrationInAnnealing);   // Prep4
                return totalVolumeNeededForAnnealing;
            }

            if (that.ComputeOption === "Titration") {
                //
                // count how many titration inputs have values > 0
                // assume each one of those is one chip
                // compute volume based on that
                //
                // also assumes that non-standard concentrations are not allowed so we can assume a typical annealing step sample concentration
                // (instead of computing annealed/binding concentration based upon the volumes - we're determining the volume needed here!)
                // in the future if we want to allow non-standard titrations we would need to have the customer input the sample volume available
                // as well so we could compute the maximum concentration possible. But that would require an additional input for this case.
                //

                totalVolumeOfBindingReaction = 0.0;
                volumeNeededPerChip = parseFloat(that.VolumePerChipNoReuse) + 	 // prep2
                					  parseFloat(that.DeadVolumePerWell); 		 // prep2

                /* removed for 2.1.0.0
            	if (that.MagBead === "True")                                     // Prep0
            	{
            		// for magbead = 9 uL plus 10 uL of deadvolumeperwell * 1.1 sluff factor = 20.9 uL currently
                	volumeNeededPerChip *= that.globals.MagneticBeadSluffFactor; // Prep0
                }*/

                if (that.TitrationConcentration1 > 0) {
                    totalVolumeOfBindingReaction += volumeNeededPerChip * (that.TitrationConcentration1 / concentrationInBinding);
                }
                if (that.TitrationConcentration2 > 0) {
                    totalVolumeOfBindingReaction += volumeNeededPerChip * (that.TitrationConcentration2 / concentrationInBinding);
                }
                if (that.TitrationConcentration3 > 0) {
                    totalVolumeOfBindingReaction += volumeNeededPerChip * (that.TitrationConcentration3 / concentrationInBinding);
                }
                if (that.TitrationConcentration4 > 0) {
                    totalVolumeOfBindingReaction += volumeNeededPerChip * (that.TitrationConcentration4 / concentrationInBinding);
                }
                totalVolumeOfBindingReaction = Math.max(that.MinimumVolumeOfBindingReaction, 1.1 * totalVolumeOfBindingReaction);   // Prep4
                result = that.ComputeSampleVolumeInAnnealingReactionFromBindingVolume(0.6 * totalVolumeOfBindingReaction,       // Prep4
                    concentrationInAnnealing);
                return result;
            }

            return Number.NaN;
        } ());
    },

    // 
    // Compute the total volume of the annealing reaction
    // Note: this will sometimes depend upon the primer volune in annealing
    // and other times that value will depend upon this output. We resolve that
    // circular dependency by pre-computing a few private intermediaries
    //

    Prep16_Helper_TotalVolumeOfAnnealingReactionNonStandard: function () {
        this.totalVolumeOfAnnealingReactionNonStandard =                         // Result: Prep16
                this.ComputeNonStandardTotalVolumeOfAnnealingReaction(           // Prep0
                    this.SampleVolumeInAnnealingReaction,                        // Prep12
                    this.primerVolumeInAnnealingReactionNonStandard);            // Prep14
    },

    Prep18_TotalVolumeOfAnnealingReaction: function () {
        var that = this;
        this.TotalVolumeOfAnnealingReaction = (function () {                             // Result: Prep9
            if (that.nonStandard) {                                                     // Prep2
                //
                // Allowing custom annealing concentration means that we cannot just assume that this total volume is based
                // on a ratio of the sample volume and primer volume. Instead we should calculate it based on the standard case
                // below in terms of concentration. But instead of using SampleConcentrationInAnnealingReaction we should use
                // the NonStandardConcentration (that is either the default maximum or is customer set)
                //

                // if non-standard with custom annealing concentration, use the standard formula 
                // but with the requested concentration
                // 
                // future: unfinished feature
                //if (this.NonStandardAnnealingConcentrationOption === "Custom")
                //    return that.SampleVolumeInAnnealingReaction *                     // Prep12
                //        that.StartingSampleConcentrationInNanoMolar /                 // Prep4
                //        that.NonStandardAnnealingConcentration;                       // Prep6

                return that.totalVolumeOfAnnealingReactionNonStandard;                  // Prep16
            }

            return that.SampleVolumeInAnnealingReaction *                               // Prep12
                that.StartingSampleConcentrationInNanoMolar /                           // Prep4
                that.SampleConcentrationInAnnealingReaction;                            // Prep2
        } ());
    },

    Prep14_Helper_PrimerVolumeInAnnealingReactionNonStandard: function () {
        this.primerVolumeInAnnealingReactionNonStandard =                               // Result: Prep14
            this.ComputeNonStandardPrimerVolumeInAnnealingReaction(this.SampleVolumeInAnnealingReaction);   // Prep12
    },

    Prep20_PrimerVolumeInAnnealingReaction: function () {
        var that = this;
        this.PrimerVolumeInAnnealingReaction = (function () {                           // Result: Prep20
            if (that.nonStandard) {                                                     // Prep2

                // future: unfinished feature
                //if (that.NonStandardAnnealingConcentrationOption === "Custom")          // Prep0
                //    return that.TotalVolumeOfAnnealingReaction *                        // Prep9
                //        that.PrimerToTemplateRatio *                                    // Prep2
                //        that.NonStandardAnnealingConcentration /                        // Prep6
                //        that.DilutedPrimerConcentration;                                // Prep2

                return that.ComputeNonStandardPrimerVolumeInAnnealingReaction(that.SampleVolumeInAnnealingReaction);   // Prep12
            }

            return that.TotalVolumeOfAnnealingReaction *                                // Prep9
                that.PrimerToTemplateRatio *                                            // Prep2
                that.SampleConcentrationInAnnealingReaction /                           // Prep2
                that.DilutedPrimerConcentration;                                        // Prep2
        } ());
    },

    Prep24_StockPrimerAliquot: function () {                        // aka "Sequencing Primer" in the UI
        this.StockPrimerAliquot =                                   // Result: Prep24
            this.DilutedPrimerConcentration *                       // Prep2
            this.TotalVolumeOfDilutedPrimer /                       // Prep22
            this.globals.AnnealingPrimerStockConcentration;         // Prep0
    },

    Prep26_ElutionBuffer: function () {
        this.ElutionBuffer =                                        // Result: Prep26
            this.TotalVolumeOfDilutedPrimer -                       // Prep22
                this.StockPrimerAliquot;                            // Prep24
    },

    Prep22_TotalVolumeOfDilutedPrimer: function () {
        var that = this;
        this.TotalVolumeOfDilutedPrimer = (function () {            // Result: Prep22
            var volume, compare;
            volume = that.PrimerVolumeInAnnealingReaction;          // Prep20

            //
            // Make sure the StockPrimerAliquot ("Sequencing Primer v2" in UI) is pipettable, make sure we have enough
            // In other words, make sure volume * DilutedPrimerConcentration / AnnealingPrimerStockConcentration > 1.0
            //

            compare = volume * that.DilutedPrimerConcentration /        // Prep2
                that.globals.AnnealingPrimerStockConcentration;         // Prep0

            if (compare < that.globals.MinimumPipettableVolume) {       // Prep0

                // set compare/StockPrimerAliquot to 1.0/MinimumPipettableVolume and solve
                volume = that.globals.MinimumPipettableVolume *         // Prep0
                    that.globals.AnnealingPrimerStockConcentration /    // Prep0
                    that.DilutedPrimerConcentration;                    // Prep2
            }

            return that.gaussianRounding(Math.max(that.MinimumVolumeOfDilutedPrimer, volume), 1);  // Prep2
        } ());
    },

    Prep20_VolumeOfPbInAnnealingReaction: function () {
        this.VolumeOfPbInAnnealingReaction = 0.1 *                  // Result: Prep20
            this.TotalVolumeOfAnnealingReaction;                    // Prep9
    },

    Prep22_VolumeOfWaterInAnnealingReaction: function () {
        this.VolumeOfWaterInAnnealingReaction =                     // Result: Prep22
            this.TotalVolumeOfAnnealingReaction -                   // Prep9
            this.PrimerVolumeInAnnealingReaction -                  // Prep20
            this.VolumeOfPbInAnnealingReaction -                    // Prep20
            this.SampleVolumeInAnnealingReaction;                   // Prep12
    },

    Prep4_StartingSampleConcentrationInNanoMolar: function () {
        var showError, result;

        this.StartingSampleConcentrationInNanoMolar =               // Result: Prep4
            1000000000 *
                (this.StartingSampleConcentration / 1000) /         // Prep0
                (this.AnnealedBasePairLength * 650);                // Prep0

        //
        // If the concentration is less then recommended, give a warning if:
        // - large scale
        // - small scale and "non-standard" is not selected
        // 
        // In other words, for small scale preparations we can override this
        // check by setting "non-standard" to "yes". But that's it.
        // 

        showError = false;
        result = this.StartingSampleConcentrationInNanoMolar;

        if (result < this.MinimumSampleConcentration) {					// Prep2
            if (this.PreparationProtocol === "Large") {                 // Prep0
                showError = true;
            }

            if (this.LowConcentrationsAllowed === "False" &&            // Prep0
				this.PreparationProtocol === "Small") {                 // Prep0
                showError = true;
            }
        }

        if (showError) {
            this.RaiseError("SampleConcentrationLow");
        }
    },

    // separate out the non standard final annealed so we don't have circular dependencies
    // with other functions, if their logic is looking for non-standard they can get this
    // instead
    Prep10_finalAnnealedConcentrationNonStandard: function () {
        this.finalAnnealedConcentrationNonStandard =                            // Result: Prep10
            this.NonStandardAnnealingConcentration;                             // Prep8
    },

    Prep20_FinalAnnealedConcentration: function () {
        var that = this;
        this.FinalAnnealedConcentration = (function () {                         // Result: Prep20
            var result, roundedresult, roundedsciar;

            //
            // If we're back computing the concentration use AvailableSampleVolume instead
            //

            if (that.nonStandard /*&& !ComputeOption.Equals(BucketConstants.ComputeByVolume)*/) {   // Prep2
                return that.finalAnnealedConcentrationNonStandard;              // Prep10
            }

            result = that.SampleVolumeInAnnealingReaction *                 // Prep12
                that.StartingSampleConcentrationInNanoMolar /                   // Prep4
                that.TotalVolumeOfAnnealingReaction;                            // Prep9

            if (!this.nonStandard) {
                roundedresult = that.gaussianRounding(result, 1);
                roundedsciar = that.gaussianRounding(that.SampleConcentrationInAnnealingReaction, 1); // Prep??
                if ((!_.isNaN(result)) && (roundedresult !== roundedsciar)) {
                    that.RaiseError("AnnealingConcentrationSuspect");
                }
            }

            return result;
        } ());
    },

    Prep8_DefaultNonStandardAnnealingConcentration: function () {
        this.DefaultNonStandardAnnealingConcentration =                                         // Result: Prep8
            this.MaxAvailableAnnealingConcentration;                                            // Prep6
    },

    Prep8_NonStandardAnnealingConcentration: function () {    // private
        this.NonStandardAnnealingConcentration =                                                // Result: Prep8
            this.NonStandardAnnealingConcentrationOption === "Custom" ?                          // Prep0
            this.CustomNonStandardAnnealingConcentration :                                      // Prep0
            this.MaxAvailableAnnealingConcentration;                                            // Prep6
    },

    Prep6_MaxAvailableAnnealingConcentration: function () {   // private
        var that = this;
        this.MaxAvailableAnnealingConcentration = (function () {                                // Result: Prep6
            var result, primervolume, totalvolume,
                available = that.AvailableSampleVolume;                                         // Prep0
            if (that.ComputeOption === "Volume") {                                              // Prep0
                available = that.SampleVolumeToUseInAnnealing;                                  // Prep0
            }

            primervolume = that.ComputeNonStandardPrimerVolumeInAnnealingReaction(available);   // Prep4
            totalvolume = that.ComputeNonStandardTotalVolumeOfAnnealingReaction(available, primervolume); // Prep0

            result = available * that.StartingSampleConcentrationInNanoMolar / totalvolume;     // Prep4
            return result;
        } ());
    },

    Prep10_MaxAvailableAnnealingConcentrationInBinding: function () {  // private
        this.MaxAvailableAnnealingConcentrationInBinding =                                      // Result: Prep10
            this.NonStandardAnnealingConcentration *                                            // Prep8
                this.bucket.RatioOfBindingToAnnealingConcentration;                             // Prep0
    },

    Prep2_SpikeInFirstDilutionConcentration: function () {
        this.SpikeInFirstDilutionConcentration =                        // Result: Prep2
            (this.PreparationProtocol === "Small") ?                     // Prep0
                this.globals.SpikeInFirstDilutionConcentrationSmallScale :  // Prep0
                this.globals.SpikeInFirstDilutionConcentrationLargeScale;   // Prep0
    },

    Prep2_StorageComplexConcentration: function () {
        this.StorageComplexConcentration =                               // Result: Prep2
            (this.PreparationProtocol === "Small") ?                     // Prep0
                this.globals.StorageComplexConcentrationSmallScale :     // Prep0
                this.globals.StorageComplexConcentrationLargeScale;      // Prep0
    },

    Prep6_ConcentrationOnPlate: function () {
        this.ConcentrationOnPlate =                                     // Result: Prep6
        (this.ConcentrationOnPlateOption === "Default") ?                // Prep0
            this.DefaultConcentrationOnPlate :                          // Prep4
            this.CustomConcentrationOnPlate;                            // Prep0
    },

    Prep4_SpikeInPercentOfTemplateConcentration: function () {
        this.SpikeInPercentOfTemplateConcentration =                    // Result: Prep4
        (this.SpikeInRatioOption === "Default") ?                        // Prep0
            this.DefaultSpikeInRatioToTemplate :                        // Prep2
            this.CustomSpikeInRatioPercent / 100;                       // Prep0
    },

    Prep12_SpikeInSecondDilutionConcentration: function () {
        this.SpikeInSecondDilutionConcentration =                       // Result: Prep12
		    this.SpikeInPercentOfTemplateConcentration *                // Prep4
		    this.SampleConcentrationInBinding * 10;                     // Prep10
    },

    Prep4_PolymeraseTemplateRatio: function () {
        this.PolymeraseTemplateRatio =                                  // Result: Prep4
		(this.PolymeraseTemplateRatioOption === "Default") ?            // Prep0
		    this.DefaultPolymeraseTemplateRatio :                       // Prep2
		    this.CustomPolymeraseTemplateRatio;                         // Prep0
    },

    Prep28_TotalVolumeOfFirstSpikeInDilution: function () {
        this.TotalVolumeOfFirstSpikeInDilution =                        // Result: Prep28
		    (this.UseSpikeInControl === "False") ? 0 :                  // Prep0
		    Math.max(
			    this.globals.MinimumVolumeOfFirstSpikeInDilution,       // Prep0
			    this.DilutedSpikeInVolumeInSecondDilution * 1.2);       // Prep26
    },

    Prep30_SpikeInStockVolumeInFirstDilution: function () {
        this.SpikeInStockVolumeInFirstDilution =                        // Result: Prep30
			this.SpikeInFirstDilutionConcentration *                    // Prep2
			this.TotalVolumeOfFirstSpikeInDilution /                    // Prep28
			this.SpikeInStockConcentration;                             // Prep2
    },

    Prep12_PolymeraseDilutionConcentration: function () {
        this.PolymeraseDilutionConcentration =                          // Result: Prep12
			this.SampleConcentrationInBinding *                         // Prep10
			this.PolymeraseTemplateRatio * 10;                          // Prep4
    },

    Prep32_BindingBufferInFirstDilution: function () {
        this.BindingBufferInFirstDilution =                             // Result: Prep32
			this.TotalVolumeOfFirstSpikeInDilution -                    // Prep28
			this.SpikeInStockVolumeInFirstDilution;                     // Prep30
    },

    Prep30_BindingBufferInSecondDilution: function () {
        this.BindingBufferInSecondDilution =                            // Result: Prep30
			this.TotalVolumeOfSecondSpikeInDilution -                   // Prep28
			this.DilutedSpikeInVolumeInSecondDilution;                  // Prep26
    },

    Prep28_TotalVolumeOfSecondSpikeInDilution: function () {
        this.TotalVolumeOfSecondSpikeInDilution =                       // Result: Prep28
			this.DilutedSpikeInVolumeInSecondDilution *                 // Prep26
			this.SpikeInFirstDilutionConcentration /                    // Prep2
			this.SpikeInSecondDilutionConcentration;                    // Prep12
    },

    Prep30_BindingBufferInPolymeraseDilution: function () {
        this.BindingBufferInPolymeraseDilution =                        // Result: Prep30
			this.TotalVolumeOfPolymeraseDilution -                      // Prep28
			this.PolymeraseStockVolumeInDilution;                       // Prep26
    },

    Prep26_DilutedSpikeInVolumeInSecondDilution: function () {
        var denom = this.SpikeInSecondDilutionConcentration *           // Prep12
					this.VolumeOfSpikeInDilutionInBinding * 1.2,        // Prep24
            rounded = this.gaussianRounding(denom /
			this.SpikeInFirstDilutionConcentration, 1);                 // Prep2

        this.DilutedSpikeInVolumeInSecondDilution =                     // Result: Prep26
			Math.max(1.0, rounded);
    },

    Prep26_PolymeraseStockVolumeInDilution: function () {
        var value = (this.PolymeraseDilutionConcentration *             // Prep12
	                 this.VolumeOfPolymeraseDilutionInBinding * 1.2) /  // Prep24
	                 this.PolymeraseStockConcentration,                 // Prep2
            rounded = this.gaussianRounding(value, 1);

        this.PolymeraseStockVolumeInDilution =                          // Result: Prep26
		    Math.max(this.globals.MinimumVolumeOfPolymeraseStockInDilution, rounded);   // Prep0
    },

    Prep28_TotalVolumeOfPolymeraseDilution: function () {
        this.TotalVolumeOfPolymeraseDilution =                          // Result: Prep28
			this.PolymeraseStockVolumeInDilution *                      // Prep26
			this.PolymeraseStockConcentration /                         // Prep2
			this.PolymeraseDilutionConcentration;                       // Prep12
    },

    Prep2_PolymeraseStockConcentration: function () {
        this.PolymeraseStockConcentration =                             // Result: Prep2
            this.globals.PolymeraseStockConcentration;                  // Prep0
    },

    //
    // Binding Polymerase to Template section
    //

    Prep20_VolumeAvailableOfAnnealingReactionInBinding: function () {
        var that = this;
        this.VolumeAvailableOfAnnealingReactionInBinding = (function () {               // Result: Prep20
            if (that.BindingPolymeraseOption === "Volume") {                            // Prep0
                return that.TotalVolumeOfAnnealingReaction;                             // Prep9
            }

            var computed = that.VolumeOfAnnealingReactionInBindingFromDesiredCells;     // Prep12

            if (computed > that.gaussianRounding(that.TotalVolumeOfAnnealingReaction, 2)) {	// Prep9
                that.RaiseError("TooManyCellsInBinding");
            }

            if (that.BindingPolymeraseOption === "Cells") {				                // Prep0
                return computed;
            }

            return Number.NaN;
        } ());
    },

    Prep2_DeadVolumePerWell: function () {
        this.DeadVolumePerWell = this.bucket.DeadVolumePerWell;                         // Result: Prep2
    },

    Prep22_TotalVolumeOfBindingReaction: function () {
        var that = this;
        this.TotalVolumeOfBindingReaction = (function () {                              // Result: Prep22
            var result, rounded;
            if (that.VolumeAvailableOfAnnealingReactionInBinding === 0) {               // Prep20
                return 0;
            }

            result = that.VolumeAvailableOfAnnealingReactionInBinding / 0.6;            // Prep20

            rounded = that.gaussianRounding(result, 3);
            if ((that.LowConcentrationsAllowed === "False") &&                          // Prep0
			   (rounded < that.MinimumVolumeOfBindingReaction)) {					    // Prep4

                // we won't have enough annealed volume for binding, raise an error and prevent
                // any downstream calculations so they won't accidentally proceed. bugzilla 23450
                // TODO: include MinimumVolumeOfBindingReaction in error text to clarify what is needed
                that.RaiseError("BindingVolumeLow");
                return Number.NaN;
            }

            return Math.max(that.MinimumVolumeOfBindingReaction, result);               // Prep4
        } ());
    },

    Prep24_VolumeOfSpikeInDilutionInBinding: function () {
        var that = this;
        this.VolumeOfSpikeInDilutionInBinding = (function () {                          // Result: Prep24
            if (that.Chemistry !== "Version1") {                                        // Prop0
                return Number.NaN;
            }

            if (that.UseSpikeInControl === "False") {                                   // Prop0
                return 0;
            }

            return 0.1 * that.TotalVolumeOfBindingReaction;                             // Prep22
        } ());
    },

    Prep24_VolumeOfAnnealingReactionInBinding: function () {
        this.VolumeOfAnnealingReactionInBinding =               // Result: Prep24
		this.TotalVolumeOfBindingReaction * 0.6;                // Prep22
    },

    Prep24_VolumeOfAnalogsInBinding: function () {
        this.VolumeOfAnalogsInBinding =                         // Result: Prep24
		this.TotalVolumeOfBindingReaction * 0.1;                // Prep22
    },

    Prep24_VolumeOfPolymeraseDilutionInBinding: function () {
        this.VolumeOfPolymeraseDilutionInBinding =              // Result: Prep24
		this.TotalVolumeOfBindingReaction * 0.1;                // Prep22
    },

    Prep24_VolumeOfDttInBinding: function () {
        this.VolumeOfDttInBinding =                             // Result: Prep24
		this.TotalVolumeOfBindingReaction * 0.1;                // Prep22
    },

    Prep26_BindingBufferInBinding: function () {
        var that = this,
            result = that.TotalVolumeOfBindingReaction -        // Prep22
			that.VolumeOfDttInBinding -                         // Prep24
			that.VolumeOfPolymeraseDilutionInBinding -          // Prep24
            that.VolumeOfAnalogsInBinding -                     // Prep24
			that.VolumeAvailableOfAnnealingReactionInBinding;   // Prep20

        this.BindingBufferInBinding =                           // Result: Prep26
			(that.Chemistry !== "Version1") ?
			result :
			result - that.VolumeOfSpikeInDilutionInBinding;     // Prep24
    },

    Prep24_FinalBindingConcentration: function () {
        var compare,
            result =
		    this.FinalAnnealedConcentration *                   // Prep20
			this.bucket.RatioOfBindingToAnnealingConcentration; // Prep0

        //
        // Sanity check, the volumes should produce a concentration that is of an expected ratio.
        // One that matches the bucket's RatioOfBindingToAnnealingConcentration. If that test fails
        // then issue a warning in the UI. In 1.2.2, this ratio is 0.6 and the annealing concentration
        // should be 10 nM so the binding 6 nM, for example. It might be ok to use this ratio instead
        // of computing based upon the volumes, alternatively.
        //

        if (this.LowConcentrationsAllowed === "False") {
            compare =
				this.VolumeAvailableOfAnnealingReactionInBinding *  // Prep20
				this.FinalAnnealedConcentration /                   // Prep20
				this.TotalVolumeOfBindingReaction;                  // Prep22

            if ((!_.isNaN(result)) && (this.gaussianRounding(result, 1) !== this.gaussianRounding(compare, 1))) {
                this.RaiseError("BindingConcentrationSuspect");
            }
        }

        this.FinalBindingConcentration = result;                    // Result: Prep24
    },

    Prep26_NumberOfCellsFromBinding: function () {
        var selectedBindingVolume = this.TotalVolumeOfBindingReaction;                                       // Prep22
        this.NumberOfCellsFromBinding = this.ComputeNumberOfCellsFromBindingVolume(selectedBindingVolume);   // Prep26*
    },

    Prep26_MaxNumberOfCellsFromBinding: function () {
        var maxBindingVolume = this.TotalVolumeOfAnnealingReaction / 0.6;                                    // Prep9
        this.MaxNumberOfCellsFromBinding = this.ComputeNumberOfCellsFromBindingVolume(maxBindingVolume);     // Prep26*
    },

    ComputeNumberOfCellsFromBindingVolume: function (volume) {
        var that = this;
        var resultCells = (function () {			    // Result: Prep26
            //
            // Uses the same math as in ComplexDilution basically to determine the volume that would occur in complex dilution
            // if we used the TotalVolumeOfBindingReaction amount. Then uses the reverse math to determine the number of cells
            // that could be used. Don't forget the spike-in volume starting with v2 chemistry.
            //

            var targetConcentration, boundTemplateRequired, finalResultingVolumeForOneChip, concentrationTooLow,
                fullWells, cellsFromFullWells, partialVolume, cellsFromPartialWell, result,
                maxVolume = volume *
						    that.FinalBindingConcentration /        // Prep24
							that.ConcentrationOnPlate;              // Prep6

            // Don't use StorageComplexConcentration, that's what we end up with after the final long term storage dilution, but then we
            // end up with that much more volume to get to that concentration!

            if (_.isNaN(maxVolume)) {
                // we can't make any, so we won't have enough inherently (unless they ask for 0)
                if (that.TotalComplexDilutionCells > 0) {
                    that.RaiseError("NotEnoughCellsForBindingComplex");
                }

                return 0;
            }

            //
            // If mag bead, we adjust by Ravi's MagBeadSluffFactor
            //

            /* removed for 2.1.0.0
            if (that.MagBead === "True")                                     // Prep0
            {
                maxVolume /= that.globals.MagneticBeadSluffFactor;          // Prep0

                // for large scale mag bead, we need twice the sluff factor since we have an extra complex dilution step (from storage)

                if (that.PreparationProtocol === "Large" || if small and storage case)                    // Prep0
                {
                    maxVolume /= that.globals.MagneticBeadSluffFactor;      // Prep0
                }
            }*/

            // #19588 we're already including the spike in volume now TotalVolumeOfBindingReaction
            //if (Chemistry.Equals(BucketConstants.ChemistryV2))
            //    maxVolume += SpikeInVolumeInDilution(ConcentrationOnPlate, maxVolume);

            //
            // Is the resulting concentration so low that we don't think we can make any chips
            // Ensure that the concentration is enough to add spike-in and not end up with 
            // negative dilutions in the binding complex for sequencing step. Test against 1 chip.
            //
            // The equation for calculating how much bound template to use is:
            //
            //   return (ConcentrationOnPlate * TotalComplexDilutionVolume) / 
            //   (PreparationProtocol.Equals(PreparationLargeOption) ? Coefficients.StorageComplexConcentration : FinalBindingConcentration);
            //
            // and TotalComplexDilutionVolume is determined solely by how many samples on wants to produce
            // if this volume + spike in volume is greater then TotalComplexDilutionVolume (for any number of chips)
            // then we have an error.
            //

            targetConcentration = that.ConcentrationOnPlate;                        // Prep6
            if (that.ComputeOption === "Titration") {                               // Prep0
                // for titration, use the maximum titration to test if we will have enough instead of the standard ConcentrationOnPlate
                targetConcentration = Math.max(Math.max(that.TitrationConcentration1, that.TitrationConcentration2),    // Prep0
                                      Math.max(that.TitrationConcentration3, that.TitrationConcentration4));   // Prep0
            }

            finalResultingVolumeForOneChip = that.SamplePlateLayout.ComputeVolumeInPartialWells(1, 0);  // Prep2 for SPL
            boundTemplateRequired =
				finalResultingVolumeForOneChip *
				targetConcentration /
				that.FinalBindingConcentration;                                         // Prep24

            if (that.Chemistry !== "Version1") {                                        // Prep0
                boundTemplateRequired += that.Helper_SpikeInVolumeInDilution(targetConcentration, finalResultingVolumeForOneChip);  // Prep6
            }

            concentrationTooLow = false;
            if (boundTemplateRequired > finalResultingVolumeForOneChip) {
                if (that.ComputeOption === "Volume") {
                    that.RaiseError("BindingConcentrationTooLowForOneChip");
                } else {
                    that.RaiseError("BindingConcentrationTooLowForReverseCalculation");
                }

                concentrationTooLow = true;
            }

            //
            // Compute how many cells given the maximum volume
            // Round the volume up to something pipette-able to handle edge conditions
            //

            fullWells = parseInt(maxVolume / that.MaxVolumePerWellFromBucket, 10);      // Prep2
            cellsFromFullWells = fullWells * that.MaxNumberOfCellsPerWellFromBucket;    // Prep2
            partialVolume = maxVolume - (fullWells * that.MaxVolumePerWellFromBucket);  // Prep2
            cellsFromPartialWell = that.SamplePlateLayout.ComputeCellsFromPartialWell(partialVolume); // Prep2
            result = cellsFromFullWells + cellsFromPartialWell;

            //
            // Can we make enough? Compare against TotalComplexDilutionCells and raise an error
            // if we don't.
            //

            result = (concentrationTooLow) ? 0 : result;

            if ((that.ComputeOption !== "Titration") &&
		        (that.TotalComplexDilutionCells > result))                                  // Prep6
            {
                that.RaiseError("NotEnoughCellsForBindingComplex");
            }

            return result;
        } ());

        return resultCells;
    },

    //
    // Complex Dilution Section
    //
    // Inputs: BindingComplexNumberOfCellsRequested
    //
    // Reuse versus no-reuse mostly differs by the bucket coefficients
    //

    Prep14_DttVolumeInSpikeInDilution: function () {
        this.DttVolumeInSpikeInDilution =                   // Result: Prep14
			(this.SpikeInDilutionVolume -                   // Prep10
				this.SpikeInControlContribution) * 0.1;     // Prep12
    },

    Prep14_ComplexDilutionBufferVolumeInSpikeInDilution: function () {
        this.ComplexDilutionBufferVolumeInSpikeInDilution = // Result: Prep14
			(this.SpikeInDilutionVolume -                   // Prep10
				this.SpikeInControlContribution) * 0.9;     // Prep12
    },

    Prep12_SpikeInControlContribution: function () {
        this.SpikeInControlContribution =                   // Result: Prep12
			(this.UseSpikeInControl === "False") ?           // Prep0
			0.0 :
			this.SpikeInDilutionVolume *                    // Prep10
			this.bucket.SpikeInConcentrationInDilution /    // Prep0
			this.bucket.SpikeInStockConcentration;          // Prep0    todo: use non bucket variant?
    },

    Prep8_SpikeInControlVolumeInDilution: function () {
        this.SpikeInControlVolumeInDilution =               // Result: Prep8
			(this.MagBead === "True") ?                      // Prep0
			Number.NaN :
			this.Helper_SpikeInVolumeInDilution(            // Prep6
				this.ConcentrationOnPlate,                  // Prep6
				this.TotalComplexDilutionVolume);           // Prep6
    },

    Prep10_SpikeInDilutionVolume: function () {
        var that = this;
        this.SpikeInDilutionVolume = (function () {                     // Result: Prep10
            if (that.UseSpikeInControl === "False") { return 0.0; }     // Prep0
            if (that.MagBead === "True") { return Number.NaN; }         // Prep0

            var basic = 1.1 * that.SpikeInControlVolumeInDilution,      // Prep8
                minimum = that.bucket.MinimumSpikeInDilutionVolume;     // Prep0
            return (basic > minimum) ? basic : minimum;
        } ());
    },

    Prep2_SpikeInConcentrationInSpikeInDilution: function () {
        this.SpikeInConcentrationInSpikeInDilution =                    // Result: Prep2
			this.bucket.SpikeInConcentrationInDilution;                 // Prep0
    },

    Helper_SpikeInConcentrationOnPlate: function (concentrationOnPlate) {           // Result: Prep4
        return concentrationOnPlate *
			this.SpikeInPercentOfTemplateConcentration;                             // Prep4
    },

    Helper_SpikeInVolumeInDilution: function (concentrationOnPlate, totalVolume) {  // Result: Prep6
        if (this.UseSpikeInControl === "False")                                     // Prep0
        { return 0.0; }

        return this.Helper_SpikeInConcentrationOnPlate(concentrationOnPlate) *      // Prep4
			totalVolume /
			this.SpikeInConcentrationInSpikeInDilution;                             // Prep2
    },

    Prep10_VolumeOfSpikeInDilutionInComplexDilution: function () {
        this.VolumeOfSpikeInDilutionInComplexDilution =                 // Result: Prep10
			((this.Chemistry === "Version1") ||                         // Prep0
			 (this.UseSpikeInControl === "False")) ?                    // Prep0
			    0.0 :
			    this.SpikeInControlVolumeInDilution;                    // Prep8
    },

    Prep2_BindingComplexBufferName: function () {
        this.BindingComplexBufferName =                                 // Result: Prep2
			(this.PreparationProtocol === "Large") ?                    // Prep0
			"Long-Term Storage Complex" : "Binding Complex";
    },

    Prep0_ComplexDilutionBufferName: function () {
        this.ComplexDilutionBufferName = "Complex Dilution Buffer";     // Result: Prep0 (todo convert to global string)
    },

    Prep4_VolumeFromFullWells: function () {
        this.VolumeFromFullWells =                                      // Result: Prep4
			this.SamplePlateLayout.VolumeFromFullWells(                 // Prep2 for SPL instance
				this.BindingComplexNumberOfCellsRequested);             // Prep0
    },

    Prep4_NumberOfCellsFromFullWells: function () {
        this.NumberOfCellsFromFullWells =                               // Result: Prep4
			this.SamplePlateLayout.NumberOfCellsFromFullWells(          // Prep2 for SPL instance
				this.BindingComplexNumberOfCellsRequested);             // Prep0
    },

    Prep4_VolumeFromPartialWells: function () {
        this.VolumeFromPartialWells =                                   // Result: Prep4
			this.SamplePlateLayout.VolumeFromPartialWells(              // Prep2 for SPL instance
				this.BindingComplexNumberOfCellsRequested);             // Prep0
    },

    Prep4_NumberOfFullWells: function () {
        this.NumberOfFullWells = parseInt(                              // Result: Prep4
			this.SamplePlateLayout.NumberOfFullWells(                   // Prep2 for SPL instance
				this.BindingComplexNumberOfCellsRequested), 10);        // Prep0
    },

    Prep4_NumberOfCellsFromPartialWells: function () {
        this.NumberOfCellsFromPartialWells = parseInt(                  // Result: Prep4
			this.SamplePlateLayout.NumberOfCellsFromPartialWells(       // Prep2 for SPL instance
				this.BindingComplexNumberOfCellsRequested), 10);        // Prep0
    },

    Prep6_NumberOfPartialWells: function () {
        this.NumberOfPartialWells =                             // Result: Prep6
			this.NumberOfCellsFromPartialWells > 0 ? 1 : 0;     // Prep4
    },

    Prep6_TotalComplexDilutionCells: function () {
        var result = parseFloat(this.NumberOfCellsFromPartialWells) +   // Prep4
					 parseFloat(this.NumberOfCellsFromFullWells);       // Prep4
        this.TotalComplexDilutionCells = result;                        // Result: Prep6
    },

    Helper_ComputeVolumeOfBindingReaction: function (concentrationOnPlate, totalVolume, sampleConcentrationInBinding) {  // Result: Prep0
        return concentrationOnPlate * totalVolume / sampleConcentrationInBinding;
    },

    Helper_BufferNeeded: function (totalVolume, bindingVolume, spikeInVolume) { // Result: Prep0
        var result = totalVolume - bindingVolume;
        result = ((this.Chemistry !== "Version1")
                && (this.UseSpikeInControl === "True")) ? result - spikeInVolume : result;
        return result;
    },

    Prep6_TotalComplexDilutionVolume: function () {
        this.TotalComplexDilutionVolume =                       // Results:Prep6
			parseFloat(this.VolumeFromFullWells) +              // Prep4
			parseFloat(this.VolumeFromPartialWells);            // Prep4
    },

    Prep28_VolumeOfComplexDilutionBufferInComplexDilution: function () {
        this.VolumeOfComplexDilutionBufferInComplexDilution =   // Results: Prep28
			this.Helper_BufferNeeded(                           // Prep0
				this.TotalComplexDilutionVolume,                // Prep6
				this.VolumeOfBindingReactionInComplexDilution,  // Prep26
				this.SpikeInControlVolumeInDilution) * 0.9;     // Prep8
    },

    Prep28_VolumeOfDttInComplexDilution: function () {
        this.VolumeOfDttInComplexDilution =                     // Results: Prep28
			this.Helper_BufferNeeded(                           // Prep0
				this.TotalComplexDilutionVolume,                // Prep6
				this.VolumeOfBindingReactionInComplexDilution,  // Prep26
				this.SpikeInControlVolumeInDilution) * 0.1;     // Prep8
    },

    Prep26_VolumeOfBindingReactionInComplexDilution: function () {
        this.VolumeOfBindingReactionInComplexDilution =         // Result: Prep26
			(this.MagBead === "True") ? Number.NaN :            // Prep0
			(this.ConcentrationOnPlate *                        // Prep6
				this.TotalComplexDilutionVolume) /              // Prep6
	            (this.PreparationProtocol === "Large" ?         // Prep0
					this.StorageComplexConcentration :          // Prep2
					this.FinalBindingConcentration);            // Prep24
    },

    Prep32_PerformMagBeadCalculations: function () {                            // Result: Prep32

        // skip these calculations if we're not a magbead sample (or testing)
        if (!this.unitTesting && this.MagBead === "False") {
            return;
        }

        var options = {
            bucket: this.bucket,
            globals: this.globals,
            gaussianRounding: this.gaussianRounding,

            PreparationProtocol: this.PreparationProtocol,                      // Prep0
            LongTermStorage: this.LongTermStorage,
            UseSpikeInControl: this.UseSpikeInControl,                          // Prep0
            ComplexReuse: this.ComplexReuse,                                    // Prep0
            LowConcentrationsAllowed: this.LowConcentrationsAllowed,            // Prep0
            TotalComplexDilutionCells: this.TotalComplexDilutionCells,          // Prep6
            SampleConcentrationOnPlate: this.ConcentrationOnPlate,              // Prep6
            NumberOfFullWells: this.NumberOfFullWells,                          // Prep4
            FinalBindingConcentration: this.FinalBindingConcentration,          // Prep24
            FinalStorageConcentration: this.FinalStorageConcentration,          // Prep30
            SpikeInPercentOfTemplateConcentration: this.SpikeInPercentOfTemplateConcentration   // Prep4
        };

        if (this.unitTesting || this.ComputeOption === "Titration") {
            // All titrations request just one cell
            options.TotalComplexDilutionCells = 1.0;

            //
            // keep all titration calculations within subclasses
            // note: the initializer for the submodel does all the calculations in one shot
            //
            options.SampleConcentrationOnPlate = this.TitrationConcentration1;  // Prep0
            this.MagBeadTitration1 = new MagBeadCalc(options);

            options.SampleConcentrationOnPlate = this.TitrationConcentration2;  // Prep0
            this.MagBeadTitration2 = new MagBeadCalc(options);

            options.SampleConcentrationOnPlate = this.TitrationConcentration3;  // Prep0
            this.MagBeadTitration3 = new MagBeadCalc(options);

            options.SampleConcentrationOnPlate = this.TitrationConcentration4;  // Prep0
            this.MagBeadTitration4 = new MagBeadCalc(options);

            if (!this.unitTesting) {
                return;
            }
        }

        //
        // Non-titration case, just compute using binding complex for sequencing.
        // Note: the model's Initialize performs all the calculations,
        // since it knows everything that it needs at that point.
        //

        options.SampleConcentrationOnPlate = this.ConcentrationOnPlate;         // Prep6
        options.TotalComplexDilutionCells = this.TotalComplexDilutionCells;     // Prep6
        this.MagBeadCalculations = new MagBeadCalc(options);
    },

    Prep2_ShortDescription: function () {
        var that = this;
        this.ShortDescription = (function () {
            var details = "";
            details += (that.ComputeOption === "Titration") ? "Titration, " : "";
            details += (that.MagBead === "True") ? "Mag bead, " : "";
            details += ((that.Chemistry.length == 8) ?
                         "C" + that.Chemistry.substring(7) :
                         that.Chemistry.substring(7)) + ", ";
            details += (that.PreparationProtocol === "Small") ? "Small" : "Large";
            details += (that.LongTermStorage === "True" || that.PreparationProtocol !== "Small") ? ", Storage" : "";
            details += (that.LowConcentrationsAllowed === "True") ? ", Non-standard" : "";
            details += (that.UseSpikeInControl === "True") ? ", Control" : "";
            details += (that.ComplexReuse === "True") ? ", Reuse" : "";
            return details;
        } ());
    },

    //
    // Loading Titration
    //
    // Inputs:  TitrationConcentration1..4
    //
    // Output should work like ComplexBinding:
    //      VolumeOfDttInComplexDilution                        -> TitrationDtt1..4
    //      VolumeOfComplexDilutionBufferInComplexDilution      -> TitrationCDB1..4
    //      VolumeOfBindingReactionInComplexDilution            -> TitrationBC1..4
    //      TotalComplexDilutionVolume                          -> TitrationTotal1..4
    //
    // We ignore ComplexReuse settings for these, and since each is just 1 cell we compute a single partial
    // well volume based on that.
    //

    Prep12_SetupTitrations: function () {                                   // Result: Prep12

        // only compute these if we're calculating titrations (or testing against the C# version)
        if (!this.unitTesting && this.ComputeOption !== "Titration") {
            return;
        }

        var options = {
            Helper_this: this,
            Helper_SpikeInVolumeInDilution: this.Helper_SpikeInVolumeInDilution,                // Prep6
            Helper_BufferNeeded: this.Helper_BufferNeeded,                                      // Prep0
            Helper_ComputeVolumeOfBindingReaction: this.Helper_ComputeVolumeOfBindingReaction,  // Prep0
            SampleConcentrationInBinding: this.SampleConcentrationInBinding,                    // Prep10
            VolumePerChipNoReuse: this.VolumePerChipNoReuse,                                    // Prep2
            DeadVolumePerWell: this.DeadVolumePerWell                                           // Prep2
        };

        options.TitrationConcentration = this.TitrationConcentration1;      // Prep0
        this.Titration1 = new TitrationCalc(options);

        options.TitrationConcentration = this.TitrationConcentration2;      // Prep0
        this.Titration2 = new TitrationCalc(options);

        options.TitrationConcentration = this.TitrationConcentration3;      // Prep0
        this.Titration3 = new TitrationCalc(options);

        options.TitrationConcentration = this.TitrationConcentration4;      // Prep0
        this.Titration4 = new TitrationCalc(options);
    },

    //
    // Long Term Storage
    //

    Prep24_DefaultVolumeOfBindingReactionInStorageComplex: function () {
        this.DefaultVolumeOfBindingReactionInStorageComplex =               // Result: Prep24
			this.TotalVolumeOfBindingReaction;                              // Prep22
    },

    Prep26_VolumeOfBindingReactionInStorageComplex: function () {
        var that = this;
        this.VolumeOfBindingReactionInStorageComplex = (function () {       // Result: Prep26
            if (that.PreparationProtocol === "Small" && that.LongTermStorage !== "True") {                     // Prep0
                return 0;
            }

            if (that.StorageComplexOption === "Default") {                  // Prep0
                return that.DefaultVolumeOfBindingReactionInStorageComplex; // Prep24
            }

            if (that.StorageComplexOption === "Custom") {                   // Prep0
                return that.CustomVolumeOfBindingReactionInStorageComplex;  // Prep0
            }

            return Number.NaN;
        } ());
    },

    Prep30_VolumeOfDttInStorageComplex: function () {
        this.VolumeOfDttInStorageComplex =                          // Result: Prep30
			(this.TotalVolumeOfStorageComplex -                     // Prep28
			 this.VolumeOfBindingReactionInStorageComplex) * 0.1;   // Prep26
    },

    Prep30_VolumeOfComplexDilutionBufferInStorageComplex: function () {
        this.VolumeOfComplexDilutionBufferInStorageComplex =        // Result: Prep30
			(this.TotalVolumeOfStorageComplex -                     // Prep28
			 this.VolumeOfBindingReactionInStorageComplex) * 0.9;   // Prep26
    },

    Prep28_TotalVolumeOfStorageComplex: function () {
        this.TotalVolumeOfStorageComplex =                          // Result: Prep28
			this.VolumeOfBindingReactionInStorageComplex *          // Prep26
			this.SampleConcentrationInBinding /                     // Prep10
			this.StorageComplexConcentration;                       // Prep2
    },

    Prep30_FinalStorageConcentration: function () {
        this.FinalStorageConcentration =                            // Result: Prep30
			(this.VolumeOfBindingReactionInStorageComplex *         // Prep26
			this.SampleConcentrationInBinding) /                    // Prep10
			this.TotalVolumeOfStorageComplex;                       // Prep28
    },

    //
    // Aggregate errors
    //

    Prep38_PrepareErrors: function () {

        // no more strobe or version1 chemistry errors since you can't create those anymore in 2.0

        //
        // don't use non-standard with large scale preps (doesn't make sense really, you have high concentration)
        //

        if (this.PreparationProtocol === "Large" && this.nonStandard) {
            this.RaiseError((this.unitTesting) ? "NonStandardLargeScale" : "NonStandardLargeScaleNew");
        }

        // issue 24062 - error when using small/storage and non-storage, often not enough concentration
        if (this.PreparationProtocol === "Small" && this.LongTermStorage === "True" && this.nonStandard) {
            this.RaiseError("NonStandardSmallStorageNotSupported");
        }

        // issue 24100 - control with 20kb bucket is unsupported in 2.1.0.0
        if (this.UseSpikeInControl === "True" && this.AnnealedBasePairLength > 15000) {
            this.RaiseError("UntestedControlWithLongInsertSize");
        }

        //
        // make sure no titrations are negative
        // future: also check magbead volumes
        //

        if (this.ComputeOption === "Titration") {
            if ((this.TitrationComplexDilutionBuffer1 < 0) ||
                (this.TitrationComplexDilutionBuffer2 < 0) ||
                (this.TitrationComplexDilutionBuffer3 < 0) ||
                (this.TitrationComplexDilutionBuffer4 < 0)) {
                this.RaiseError((this.nonStandard) ? "TitrationConcentrationTooHighNonStandard" :
                "TitrationConcentrationTooHigh");
            }
        }

        //
        // If we're back computing a non-standard concentration, make sure that the available volume
        // is enough for the computed annealing volume. Else signal an error
        //

        if (this.nonStandard && this.ComputeOption !== "Volume") {
            if (this.AvailableSampleVolume === 0 || (this.AvailableSampleVolume < this.SampleVolumeInAnnealingReaction)) {
                this.RaiseError("NotEnoughAvailableVolume");
            }
        }
    },

    //
    // Migrate up subcalculations to top level outputs
    //

    Prep40_MigrateSubcalculationResults: function () {

        if (this.Titration1) {
            this.TitrationDtt1 = this.Titration1.Dtt;
            this.TitrationComplexDilutionBuffer1 = this.Titration1.TitrationComplexDilutionBuffer;
            this.TitrationSpikeInVolume1 = this.Titration1.TitrationSpikeInVolume;
            this.TitrationBindingComplex1 = this.Titration1.TitrationBindingComplex;
            this.TitrationTotal1 = this.Titration1.TitrationTotal;

            // also fill in TitrationTotal which shows up on RS output
            this.TitrationTotal = this.TitrationTotal1;
        }

        if (this.Titration2) {
            this.TitrationDtt2 = this.Titration2.Dtt;
            this.TitrationComplexDilutionBuffer2 = this.Titration2.TitrationComplexDilutionBuffer;
            this.TitrationSpikeInVolume2 = this.Titration2.TitrationSpikeInVolume;
            this.TitrationBindingComplex2 = this.Titration2.TitrationBindingComplex;
            this.TitrationTotal2 = this.Titration2.TitrationTotal;
        }

        if (this.Titration3) {
            this.TitrationDtt3 = this.Titration3.Dtt;
            this.TitrationComplexDilutionBuffer3 = this.Titration3.TitrationComplexDilutionBuffer;
            this.TitrationSpikeInVolume3 = this.Titration3.TitrationSpikeInVolume;
            this.TitrationBindingComplex3 = this.Titration3.TitrationBindingComplex;
            this.TitrationTotal3 = this.Titration3.TitrationTotal;
        }

        if (this.Titration4) {
            this.TitrationDtt4 = this.Titration4.Dtt;
            this.TitrationComplexDilutionBuffer4 = this.Titration4.TitrationComplexDilutionBuffer;
            this.TitrationSpikeInVolume4 = this.Titration4.TitrationSpikeInVolume;
            this.TitrationBindingComplex4 = this.Titration4.TitrationBindingComplex;
            this.TitrationTotal4 = this.Titration4.TitrationTotal;
        }

        var that = this;
        var RaiseAnyErrors = function(errorArray)
        {
            if (errorArray.length == 0) return;
            for(var i=0; i < errorArray.length; i++) {
                that.RaiseError(errorArray[i]);
            }
        }

        var calc = this.MagBeadCalculations;
        if (calc) {
            this.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn = calc.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn;
            this.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer;
            this.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer;
            this.MagBeadSpikeInDilutionVolumeOfFirstDilution = calc.MagBeadSpikeInDilutionVolumeOfFirstDilution;

            this.MagBeadComplexDilutionVolumeOfFirstBindingBuffer = calc.MagBeadComplexDilutionVolumeOfFirstBindingBuffer;
            this.MagBeadComplexDilutionVolumeOfFirstComplex = calc.MagBeadComplexDilutionVolumeOfFirstComplex;
            this.MagBeadComplexDilutionVolumeOfSaltBuffer = calc.MagBeadComplexDilutionVolumeOfSaltBuffer;
            this.MagBeadComplexDilutionVolumeOfSecondBindingBuffer = calc.MagBeadComplexDilutionVolumeOfSecondBindingBuffer;
            this.MagBeadComplexDilutionVolumeOfSpikeInDilution = calc.MagBeadComplexDilutionVolumeOfSpikeInDilution;
            this.MagBeadComplexDilutionVolumeOfSecondComplex = calc.MagBeadComplexDilutionVolumeOfSecondComplex;
            this.MagBeadComplexDilutionVolumeTotal = calc.MagBeadComplexDilutionVolumeTotal;

            this.BeadWashVolumeOfBeads = calc.BeadWashVolumeOfBeads;
            this.BeadWashVolumeOfBeadWashBuffer = calc.BeadWashVolumeOfBeadWashBuffer;
            this.BeadWashVolumeOfBeadBindingBuffer = calc.BeadWashVolumeOfBeadBindingBuffer;

            this.ComplexBeadIncubationVolumeOfWashedBeads = calc.ComplexBeadIncubationVolumeOfWashedBeads;
            this.ComplexBeadIncubationVolumeOfComplex = calc.ComplexBeadIncubationVolumeOfComplex;
            this.ComplexBeadWashVolumeOfFirstBindingBuffer = calc.ComplexBeadWashVolumeOfFirstBindingBuffer;
            this.ComplexBeadWashVolumeOfBeadWashBuffer = calc.ComplexBeadWashVolumeOfBeadWashBuffer;
            this.ComplexBeadWashVolumeOfSecondBindingBuffer = calc.ComplexBeadWashVolumeOfSecondBindingBuffer;
            RaiseAnyErrors(calc.Errors);
        }

        calc = this.MagBeadTitration1;
        if (calc) {
            this.Titration1MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn = calc.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn;
            this.Titration1MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer;
            this.Titration1MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer;
            this.Titration1MagBeadSpikeInDilutionVolumeOfFirstDilution = calc.MagBeadSpikeInDilutionVolumeOfFirstDilution;

            this.Titration1MagBeadComplexDilutionVolumeOfFirstBindingBuffer = calc.MagBeadComplexDilutionVolumeOfFirstBindingBuffer;
            this.Titration1MagBeadComplexDilutionVolumeOfFirstComplex = calc.MagBeadComplexDilutionVolumeOfFirstComplex;
            this.Titration1MagBeadComplexDilutionVolumeOfSaltBuffer = calc.MagBeadComplexDilutionVolumeOfSaltBuffer;
            this.Titration1MagBeadComplexDilutionVolumeOfSecondBindingBuffer = calc.MagBeadComplexDilutionVolumeOfSecondBindingBuffer;
            this.Titration1MagBeadComplexDilutionVolumeOfSpikeInDilution = calc.MagBeadComplexDilutionVolumeOfSpikeInDilution;
            this.Titration1MagBeadComplexDilutionVolumeOfSecondComplex = calc.MagBeadComplexDilutionVolumeOfSecondComplex;
            this.Titration1MagBeadComplexDilutionVolumeTotal = calc.MagBeadComplexDilutionVolumeTotal;

            this.Titration1BeadWashVolumeOfBeads = calc.BeadWashVolumeOfBeads;
            this.Titration1BeadWashVolumeOfBeadWashBuffer = calc.BeadWashVolumeOfBeadWashBuffer;
            this.Titration1BeadWashVolumeOfBeadBindingBuffer = calc.BeadWashVolumeOfBeadBindingBuffer;

            this.Titration1ComplexBeadIncubationVolumeOfWashedBeads = calc.ComplexBeadIncubationVolumeOfWashedBeads;
            this.Titration1ComplexBeadIncubationVolumeOfComplex = calc.ComplexBeadIncubationVolumeOfComplex;
            this.Titration1ComplexBeadWashVolumeOfFirstBindingBuffer = calc.ComplexBeadWashVolumeOfFirstBindingBuffer;
            this.Titration1ComplexBeadWashVolumeOfBeadWashBuffer = calc.ComplexBeadWashVolumeOfBeadWashBuffer;
            this.Titration1ComplexBeadWashVolumeOfSecondBindingBuffer = calc.ComplexBeadWashVolumeOfSecondBindingBuffer;
            RaiseAnyErrors(calc.Errors);
        }

        calc = this.MagBeadTitration2;
        if (calc) {
            this.Titration2MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn = calc.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn;
            this.Titration2MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer;
            this.Titration2MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer;
            this.Titration2MagBeadSpikeInDilutionVolumeOfFirstDilution = calc.MagBeadSpikeInDilutionVolumeOfFirstDilution;

            this.Titration2MagBeadComplexDilutionVolumeOfFirstBindingBuffer = calc.MagBeadComplexDilutionVolumeOfFirstBindingBuffer;
            this.Titration2MagBeadComplexDilutionVolumeOfFirstComplex = calc.MagBeadComplexDilutionVolumeOfFirstComplex;
            this.Titration2MagBeadComplexDilutionVolumeOfSaltBuffer = calc.MagBeadComplexDilutionVolumeOfSaltBuffer;
            this.Titration2MagBeadComplexDilutionVolumeOfSecondBindingBuffer = calc.MagBeadComplexDilutionVolumeOfSecondBindingBuffer;
            this.Titration2MagBeadComplexDilutionVolumeOfSpikeInDilution = calc.MagBeadComplexDilutionVolumeOfSpikeInDilution;
            this.Titration2MagBeadComplexDilutionVolumeOfSecondComplex = calc.MagBeadComplexDilutionVolumeOfSecondComplex;
            this.Titration2MagBeadComplexDilutionVolumeTotal = calc.MagBeadComplexDilutionVolumeTotal;

            this.Titration2BeadWashVolumeOfBeads = calc.BeadWashVolumeOfBeads;
            this.Titration2BeadWashVolumeOfBeadWashBuffer = calc.BeadWashVolumeOfBeadWashBuffer;
            this.Titration2BeadWashVolumeOfBeadBindingBuffer = calc.BeadWashVolumeOfBeadBindingBuffer;

            this.Titration2ComplexBeadIncubationVolumeOfWashedBeads = calc.ComplexBeadIncubationVolumeOfWashedBeads;
            this.Titration2ComplexBeadIncubationVolumeOfComplex = calc.ComplexBeadIncubationVolumeOfComplex;
            this.Titration2ComplexBeadWashVolumeOfFirstBindingBuffer = calc.ComplexBeadWashVolumeOfFirstBindingBuffer;
            this.Titration2ComplexBeadWashVolumeOfBeadWashBuffer = calc.ComplexBeadWashVolumeOfBeadWashBuffer;
            this.Titration2ComplexBeadWashVolumeOfSecondBindingBuffer = calc.ComplexBeadWashVolumeOfSecondBindingBuffer;
            RaiseAnyErrors(calc.Errors);
        }

        calc = this.MagBeadTitration3;
        if (calc) {
            this.Titration3MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn = calc.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn;
            this.Titration3MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer;
            this.Titration3MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer;
            this.Titration3MagBeadSpikeInDilutionVolumeOfFirstDilution = calc.MagBeadSpikeInDilutionVolumeOfFirstDilution;

            this.Titration3MagBeadComplexDilutionVolumeOfFirstBindingBuffer = calc.MagBeadComplexDilutionVolumeOfFirstBindingBuffer;
            this.Titration3MagBeadComplexDilutionVolumeOfFirstComplex = calc.MagBeadComplexDilutionVolumeOfFirstComplex;
            this.Titration3MagBeadComplexDilutionVolumeOfSaltBuffer = calc.MagBeadComplexDilutionVolumeOfSaltBuffer;
            this.Titration3MagBeadComplexDilutionVolumeOfSecondBindingBuffer = calc.MagBeadComplexDilutionVolumeOfSecondBindingBuffer;
            this.Titration3MagBeadComplexDilutionVolumeOfSpikeInDilution = calc.MagBeadComplexDilutionVolumeOfSpikeInDilution;
            this.Titration3MagBeadComplexDilutionVolumeOfSecondComplex = calc.MagBeadComplexDilutionVolumeOfSecondComplex;
            this.Titration3MagBeadComplexDilutionVolumeTotal = calc.MagBeadComplexDilutionVolumeTotal;

            this.Titration3BeadWashVolumeOfBeads = calc.BeadWashVolumeOfBeads;
            this.Titration3BeadWashVolumeOfBeadWashBuffer = calc.BeadWashVolumeOfBeadWashBuffer;
            this.Titration3BeadWashVolumeOfBeadBindingBuffer = calc.BeadWashVolumeOfBeadBindingBuffer;

            this.Titration3ComplexBeadIncubationVolumeOfWashedBeads = calc.ComplexBeadIncubationVolumeOfWashedBeads;
            this.Titration3ComplexBeadIncubationVolumeOfComplex = calc.ComplexBeadIncubationVolumeOfComplex;
            this.Titration3ComplexBeadWashVolumeOfFirstBindingBuffer = calc.ComplexBeadWashVolumeOfFirstBindingBuffer;
            this.Titration3ComplexBeadWashVolumeOfBeadWashBuffer = calc.ComplexBeadWashVolumeOfBeadWashBuffer;
            this.Titration3ComplexBeadWashVolumeOfSecondBindingBuffer = calc.ComplexBeadWashVolumeOfSecondBindingBuffer;
            RaiseAnyErrors(calc.Errors);
        }

        calc = this.MagBeadTitration4;
        if (calc) {
            this.Titration4MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn = calc.MagBeadSpikeInDilutionVolumeOfFirstStockSpikeIn;
            this.Titration4MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfFirstBindingBuffer;
            this.Titration4MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer = calc.MagBeadSpikeInDilutionVolumeOfSecondBindingBuffer;
            this.Titration4MagBeadSpikeInDilutionVolumeOfFirstDilution = calc.MagBeadSpikeInDilutionVolumeOfFirstDilution;

            this.Titration4MagBeadComplexDilutionVolumeOfFirstBindingBuffer = calc.MagBeadComplexDilutionVolumeOfFirstBindingBuffer;
            this.Titration4MagBeadComplexDilutionVolumeOfFirstComplex = calc.MagBeadComplexDilutionVolumeOfFirstComplex;
            this.Titration4MagBeadComplexDilutionVolumeOfSaltBuffer = calc.MagBeadComplexDilutionVolumeOfSaltBuffer;
            this.Titration4MagBeadComplexDilutionVolumeOfSecondBindingBuffer = calc.MagBeadComplexDilutionVolumeOfSecondBindingBuffer;
            this.Titration4MagBeadComplexDilutionVolumeOfSpikeInDilution = calc.MagBeadComplexDilutionVolumeOfSpikeInDilution;
            this.Titration4MagBeadComplexDilutionVolumeOfSecondComplex = calc.MagBeadComplexDilutionVolumeOfSecondComplex;
            this.Titration4MagBeadComplexDilutionVolumeTotal = calc.MagBeadComplexDilutionVolumeTotal;

            this.Titration4BeadWashVolumeOfBeads = calc.BeadWashVolumeOfBeads;
            this.Titration4BeadWashVolumeOfBeadWashBuffer = calc.BeadWashVolumeOfBeadWashBuffer;
            this.Titration4BeadWashVolumeOfBeadBindingBuffer = calc.BeadWashVolumeOfBeadBindingBuffer;

            this.Titration4ComplexBeadIncubationVolumeOfWashedBeads = calc.ComplexBeadIncubationVolumeOfWashedBeads;
            this.Titration4ComplexBeadIncubationVolumeOfComplex = calc.ComplexBeadIncubationVolumeOfComplex;
            this.Titration4ComplexBeadWashVolumeOfFirstBindingBuffer = calc.ComplexBeadWashVolumeOfFirstBindingBuffer;
            this.Titration4ComplexBeadWashVolumeOfBeadWashBuffer = calc.ComplexBeadWashVolumeOfBeadWashBuffer;
            this.Titration4ComplexBeadWashVolumeOfSecondBindingBuffer = calc.ComplexBeadWashVolumeOfSecondBindingBuffer;
            RaiseAnyErrors(calc.Errors);
        }
    }

});