//
// Sample Preparation Calculator
// Model for the printable page
//
// (c) 2013 Pacific Biosciences
//

/*jslint maxlen: 150 */
/*global Backbone*/

//
// PrintModel
//
// This is basically a collection class that makes sure samples are loaded and
// then provides some calculations for master mixes in the print view
//
var PrintModel = Backbone.Model.extend({

    // sync model we use to fetch samples
    samplesync: undefined,

    // globals for calculations
    constants: undefined,

    // list of sample names that we want to prepare
    desirednames: [],

    // list of sample detail hashes that we've loaded from the model or were cashed
    fetched: [],

    // wires up the sync sample and hooks its events
    initialize: function (options) {
        this.constants = options.constants;
        this.samplesync = options.samples;

        this.sampleDetailedClosure = (function (that) {
            return function (data) {
                that.sampleDetailed(that, data);
            };
        } (this));
    },

    sampleDetailedClosure: undefined,

    // triggers when samplesync gets a sample detail hash for us
    sampleDetailed: function (that, data) {

        that.fetched.push(data);

        if (that.desirednames.length === that.fetched.length) {
            that.samplesync.off('sample', that.sampleDetailedClosure);
            that.calculateMasterMixes();
            that.trigger('loaded');
        } else {
            that.trigger('loading', { finished: that.fetched.length, of: that.desirednames.length });
        }
    },

    // call this to request samples and master mix calculations
    // when finished and ready we will trigger 'loaded'
    loadSamples: function (list) {
        // takes an array of sample names
        // makes sure the underlying SampleSync has all those loaded
        // once all are loaded, then calculates master mixes and triggers done
        var i;
        this.fetched = [];
        this.samplesync.on('sample', this.sampleDetailedClosure);

        this.desirednames = list;
        for (i = 0; i < list.length; i += 1) {
            this.samplesync.getSample(list[i]);
        }

        // we unhook the 'sample' event once everything is loaded so we're 
        // not listening indefinitely, only while processing things...
    },

    //
    // Calculations on groups of samples
    //

    // utility for preparing a master mix hash based on the requested samples
    calculateMasterMixes: function () {

        //
        // Calculate primer and elution volume needed
        //
        // Starting with v2 chemistry, all samples whether standard or non-standard, have the same primer dilution
        // concentration and ratio. So we can create an aggregate primer dilution that will save folks from making
        // too much or skimping and screwing it up.
        //
        // Emilia suggests adding 20% to the volume as well (notice 1.2 multiplier) for pipetting errors
        // and if the sequencing primer is less then a reasonable pipetting amount, scale it up!
        //
        var first, coefficients, sum, index, totalVolume, compare;

        first = this.fetched[0];
        coefficients = this.constants.globals;

        sum = 0;
        for (index in this.fetched) {
            if (this.fetched.hasOwnProperty(index)) {
                sum += this.fetched[index].PrimerVolumeInAnnealingReaction;
            }
        }
        sum = sum * 1.2;

        totalVolume = Math.ceil(Math.max(first.MinimumVolumeOfDilutedPrimer, sum));

        compare = first.DilutedPrimerConcentration *
                      totalVolume /
                      coefficients.AnnealingPrimerStockConcentration;

        // if too small, set compare/StockPrimerAliquot to 1.0/MinimumPipettableVolume and solve
        if (compare < coefficients.MinimumPipettableVolume) {
            totalVolume = coefficients.MinimumPipettableVolume *
                          coefficients.AnnealingPrimerStockConcentration /
                          first.DilutedPrimerConcentration;
        }

        this.PrimerAndElutionVolume = totalVolume;
        this.PrimerVolume = first.DilutedPrimerConcentration *
                            totalVolume / coefficients.AnnealingPrimerStockConcentration;
        this.ElutionVolume = totalVolume - this.PrimerVolume;

        // more... when we support more detailed master mix calculations for the selected
        // samples, consider doing that here by breaking some common calculations out of
        // calculator.sample.js into a mixin class for reuse here
    }

});
