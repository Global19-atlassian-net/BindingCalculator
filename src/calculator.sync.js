//
// Sample Preparation Calculator
// Storage
//
// (c) 2013 Pacific Biosciences
//

//
// SampleSync
// - used to fetch the list of samples and the sample details
// - used to save a sample and rename a sample as well
// - posts events when sample details are fetched, progress as all are loaded
//    - 'list' with list of sample names
//    - 'sample' with the details of a sample
//    - 'failed' with an error message when an ajax query fails
//    - 'deleted' with the name of the sample
//

/*jslint maxlen: 150 */
/*global $, jQuery, Backbone, Sample, alert*/

// tell jQuery not to cache get's, this helps when we delete something and then all of
// any cached gets are invalid. We manage our own cache...
$.ajaxSetup({ cache:false });

var SampleLocal = Backbone.Model.extend({
    names: [],
    samples: {},
    selected: "",
    options: undefined,
    keyPrefix: "com.pacbio.calculator.",

    initialize: function (options) {

        // save for new Sample use in New
        this.options = options;
        this.loadCache();
    },

    loadCache: function () {
        var item, deets, sample, name;

        this.names = [];
        this.samples = {};

        // look in localstorage to see what's there
        for (item in localStorage) {
            if (localStorage.hasOwnProperty(item) && (item.substring(0, this.keyPrefix.length) === this.keyPrefix)) {
                deets = this.loadFromLocalStorageUsingKey(item);
                sample = new Sample(this.options);
                sample.ReadFromJson(deets);

                name = sample.SampleName;
                if (name === undefined) {
                    this.removeFromLocalStorageUsingKey(item);
                    continue;
                }

                this.names.push(name);
                this.samples[name] = sample;
            }
        }

        //
        // If there were no samples, then make at least one new one
        // will trigger 'new' event, fyi, in case you wire up the view first
        //
        if (0 === this.names.length) {
            this.newSample();
        }
    },

    //
    // Utilities for dealing with localStorage
    // Note: I'm not currently checking browser support here
    // use supportsLocalStorage() here before using this class...
    //

    supportsLocalStorage: function () {
        try {
            return window.hasOwnProperty("localStorage") && window.localStorage !== null;
        } catch (e) {
            return false;
        }
    },
    saveToLocalStorageUsingDeets: function (deets) {
        var guid = deets.SampleGuid,
            json = deets.ToJson();
        localStorage.setItem(this.storageKey(guid), json);
    },
    removeFromLocalStorageUsingKey: function (key) {
        localStorage.removeItem(key);
    },
    removeFromLocalStorageUsingSample: function (deets) {
        var guid = deets.SampleGuid;
        this.removeFromLocalStorageUsingKey(this.storageKey(guid));
    },
    loadFromLocalStorageUsingKey: function (key) {
        try {
            var deetsJson = localStorage.getItem(key);
            return JSON.parse(deetsJson);
        } catch (e) {
            return {};
        }
    },

    invalidate: function () {
        // deprecated
        this.loadCache();
    },

    selectSample: function (name, failover) {
        var i;
        // assumes: that we have preloaded our cache from local storage

        // first see if that sample is already selected and do nothing
        //if (this.selected == name)
        //    return;       change: always trigger these events... only call this when we intend to update the ui

        // make sure that the name is known if we have loaded the
        // list of names. if we don't see the name fall back on the first
        for (i = 0; i < this.names.length; i += 1) {
            if (this.names[i] === name) {
                this.selectSampleInternal(name);
                return;
            }
        }

        // otherwise if failover then select the first sample. 
        // handy for deletes so we can just select a random sample
        if (failover) {
            if (this.names.length > 0) {
                this.selectSampleInternal(this.names[0]);
            }
        }
    },

    selectSampleInternal: function (name) {
        this.selected = name;
        // then trigger events on that sample
        this.getSample(name);
    },

    getNames: function () {
        // return list of all saved names
        // assumes that we've loaded from localstorage in initialize

        this.trigger('list', this.names);
    },

    getSample: function (name) {
        // assumes that we've loaded from localstorage in initialize
        if (this.samples.hasOwnProperty(name)) {
            this.trigger('sample', this.samples[name]);
            if (this.selected === name) {
                this.trigger('selected', this.samples[name]);
            }
            return;
        }
        // else the name was not found
        this.trigger('failed', "Failed to find sample named " + name);
    },

    foreachSample: function (action) {
        // loop over our list
        var item;
        for (item in this.samples) {
            if (this.samples.hasOwnProperty(item)) {
                action(this.samples[item]);
            }
        }
    },

    deleteSamples: function (namesArray) {
        var index, name;
        for (index in namesArray) {
            if (namesArray.hasOwnProperty(index)) {
                name = namesArray[index];
                this.deleteSample(name);
            }
        }
    },

    deleteSample: function (name) {

        var i;

        // first remove from localstorage by GUID
        this.removeFromLocalStorageUsingSample(this.samples[name]);

        // then remove it from our lists
        delete this.samples[name];
        for (i = 0; i < this.names.length; i += 1) {
            if (this.names[i] === name) {
                this.names.splice(i, 1);
                break;
            }
        }

        // then let everyone know we deleted it
        this.trigger('delete', name);

        //
        // If there were no samples, then make at least one new one.
        // this will trigger 'new' event, fyi
        //
        if (0 === this.names.length) {
            this.newSample();
        }
    },

    newSample: function () {
        // find a unique name, look through our list of names until we find a unique Untitled
        var name, i, sample,
            index = 0;

        function inList(list, item) {
            for (i = 0; i < list.length; i += 1) {
                if (list[i] === item) {
                    return true;
                }
            }
            return false;
        }

        do {
            index += 1;
            name = "Untitled " + index;
        } while (inList(this.names, name));

        // then create it

        sample = new Sample(this.options);
        sample.SampleName = name;
        this.addNewSample(sample);
    },

    addNewSample: function(sample) {
        var name = sample.SampleName;

        sample.Calculate();

        // save to local storage
        this.saveToLocalStorageUsingDeets(sample);

        // add to our lists
        this.names.push(name);
        this.samples[name] = sample;

        // then let everyone know that we have a new sample to display now
        this.trigger('new', sample);
    },

    isSampleNameTaken: function (name) {
        var test, duplicate = false;
        for (i = 0; i < this.names.length; i += 1) {
            test = this.names[i];
            if (this.samples[test].SampleName === name) {
                duplicate = true;
            }
        }
        return duplicate;
    },

    isSampleGuidTaken: function (guid) {
        var test, duplicate = false;
        for (i = 0; i < this.names.length; i += 1) {
            test = this.names[i];
            if (this.samples[test].SampleGuid === guid) {
                duplicate = true;
            }
        }
        return duplicate;
    },

    importSample: function (data) {
        //
        // Design decision: if we import a sample with the same GUID of a sample
        // that already exists in our sample list, does that replace the sample
        // information (an update semantic) or do we generate a new guid and
        // append a new version of that sample with a new GUID? The former is the
        // intent of the GUID for syncing between computers. But if someone reuses
        // a sample instead of creating new ones, the behavior will be unexpected.
        // We could ask a question, ala "another sample appears to have the same
        // identity of this. would you like to update that sample?" But the user
        // never sees the GUID only the sample name, so would more likely expect
        // to see this behavior based upon the sample name not a GUID. Further,
        // we don't allow two samples locally to have the same name. So then
        // performing an update if the name matches instead would more fit the
        // users mental model of naming samples. Still a confirmation would be
        // wise ala "A sample with the same name already exists, would you like
        // to update that sample with the imported information?"
        //
        // So based on that train of though, we will check for matching names
        // and also check if a new GUID needs to be generated, since this is not
        // syncing so much as archiving/restoring.
        //

        var name, sample, index, testName, changedName;

        sample = new Sample(this.options);
        sample.ReadFromJson(data);

        if (this.isSampleGuidTaken(data.SampleGuid)) {
            //
            // make a new guid, for imports we always want
            // to succeed and we're not trying to sync fully
            //

            sample.SampleGuid = sample.guid();
        }

        changedName = this.isSampleNameTaken(data.SampleName);
        if (changedName) {
            //
            // Find a new name. Try appending "(import n)" if the name until we find one that we didn't already have
            //
            index = 1;
            do {
                testName = data.SampleName + " (import " + index + ")";
                index += 1;
            } while (this.isSampleNameTaken(testName));
            sample.SampleName = testName;
        }

        //alert("Asked to import a sample named \"" + data.SampleName + "\" with GUID " + data.SampleGuid
        //    + " and named it \"" + sample.SampleName + "\" with guid " + sample.SampleGuid);

        this.addNewSample(sample);

        if (changedName) {
            alert("Imported sample as '" + sample.SampleName
                + "' because another sample with the name '"
                + data.SampleName + "' already exists.");
        } else {
            alert("Imported sample named '" + sample.SampleName + "'");
        }
    },

    lastNewName: "",

    renameSample: function (newname, oldname, guid) {
        var i, found, deets, oldguid, inputlist;


        //
        // We cannot support an empty sample name, if they try this then 
        // zap it back to the last saved. This can cause a little bit of
        // an oddness if they're replacing a name and are slow about it,
        // by first deleting everything and pausing. But we have to make
        // sure the sample doesn't end up with an empty name or else it
        // will be undeletable. 
        //
        if (newname === "") {
            this.trigger('renamefailed', "The name cannot be empty");
            return;
        }
        
        //
        // make sure newname is not already in use, else trigger failed
        // sometimes we get a race where two events come in to change the
        // sample name and they both are identical. The first changes the
        // name and the second event appears as a collision since we already
        // renamed it! Since the events can come in that way and we cannot
        // guarantee we won't see replicated requests, let's track the last
        // successful rename and ignore subsequent duplicates using lastNewName
        //
        if (newname === this.lastNewName) {
            this.trigger('renamefailed', "DuplicateRequest");
            return;
        }

        //
        // Then check to make sure the new name isn't already in use
        // and also make sure we have a record of oldname, else error
        //

        found = false;
        for (i = 0; i < this.names.length; i += 1) {
            if (this.names[i] === oldname) {
                found = true;
            }
            if (this.names[i] === newname) {
                this.trigger('renamefailed', "Attempted to rename but that name was already in use.");
                return;
            }
        }

        if (!found) {
            this.trigger('renamefailed', "Attempted to rename but could not find the sample.");
            return;
        }

        deets = this.samples[oldname];

        // make sure the guids match
        oldguid = deets.SampleGuid;
        if (oldguid !== guid) {
            this.trigger('renamefailed', "An internal error occurred, mismatched identifiers.");
            return;
        }

        // update our cache
        delete this.samples[oldname];
        deets.SampleName = newname;
        this.samples[newname] = deets;

        // update name in localstorage via GUID
        this.saveToLocalStorageUsingDeets(deets);

        for (i = 0; i < this.names.length; i += 1) {
            if (this.names[i] === oldname) {
                this.names[i] = newname;
                break;
            }
        }

        // then let everyone know that we renamed it

        inputlist = {};
        inputlist.SampleName = newname;
        inputlist.OriginalSampleName = oldname;
        inputlist.SampleGuid = guid;
        this.lastNewName = newname;
        this.trigger('renamed', inputlist);
    },

    saveSample: function (newdata) {
        var name, sample, item;
        name = newdata.SampleName;

        // find that sample model, and update values based on all the properties we received
        // then recalculate so when we trigger we'll update everything in the UI
        sample = this.samples[name];
        for (item in newdata) {
            if (newdata.hasOwnProperty(item)) {
                sample[item] = newdata[item];
            }
        }
        sample.Calculate();

        // save to local storage
        this.saveToLocalStorageUsingDeets(sample);

        // then let everyone know we succeeded saving it
        this.trigger('updated', sample);
    },

    storageKey: function (guid) {
        return this.keyPrefix + guid;
    }
});

//
// Model for working with samples saved and calculated on the instrument
//

var SampleSync = Backbone.Model.extend({
    names: [],
    samples: {},
    selected: "",

    invalidate: function () {
        // if we invalidate our cache of samples then we're working behind the model's back
        // and we shouldn't do that. fix the problem. but in the meantime, call this to
        // nuke our cache and cause us to reload it.
        this.names = [];
        this.samples = {};
    },

    failureNotice: function (message) {
        alert(message);
    },

    //
    // the model keeps a sense of which sample is "selected" and then
    // updates that for you during a delete, etc. will trigger a selected
    // event with those sample's details too if you want to update a view
    // based on this selection changing.
    // 
    // failover: is a bool telling us to pick a random sample to display
    // if the one we wanted is not there for some reason
    //

    selectSample: function (name, failover) {
        var i;

        // first see if that sample is already selected and do nothing
        //if (this.selected == name)
        //    return;           always trigger, only called when we intend to update the ui

        // if we haven't loaded the list of samples then load the named
        // sample directly, assuming that the caller knew what they were
        // asking for
        if (0 === this.names.length) {
            this.selectSampleInternal(name);
            return;
        }

        // third make sure that the name is known if we have loaded the
        // list of names. if we don't see the name fall back on the first
        for (i = 0; i < this.names.length; i += 1) {
            if (this.names[i] === name) {
                this.selectSampleInternal(name);
                return;
            }
        }

        // otherwise if failover then select the first sample. 
        // handy for deletes so we can just select a random sample
        if (failover) {
            if (this.names.length > 0) {
                this.selectSampleInternal(this.names[0]);
            }
        }
    },

    selectSampleInternal: function (name) {
        this.selected = name;
        this.getSample(name);
    },

    //
    // get the list of sample names, triggers 'list' when successful
    //

    getNames: function () {
        if (this.names.length > 0) {
            this.trigger('list', this.names);
            return;
        }

        var that = this;
        jQuery.get("/Sample/List", {}, function (data) {
            that.names = data;
            that.trigger('list', data);
        }, "json").fail(function () {
            that.trigger('failed', "Failed to fetch the list of sample names");
        });
    },

    // get a sample, triggers 'sample' when successful
    getSample: function (name) {
        if (this.samples.hasOwnProperty(name)) {
            //
            // this sample we already had cached. trigger that we have it.
            // also trigger that it was selected if so, to tie behavior to that
            //
            this.trigger('sample', this.samples[name]);
            if (this.selected === name) {
                this.trigger('selected', this.samples[name]);
            }
            return;
        }

        var inputlist = {},
            that = this;
        inputlist.SampleName = name;
        jQuery.get("/Sample/Read", inputlist, function (data) {

            //
            // sample is now loaded, trigger that as well as selected
            // if we just loaded the selected sample and it's ready
            //

            that.samples[name] = data;
            that.trigger('sample', data);
            if (that.selected === name) {
                that.trigger('selected', data);
            }
        }, "json").fail(function () {
            that.trigger('failed', "Failed to fetch sample details for " + name);
        });
    },

    foreachSample: function (action) {
        var item, inputlist, that, samplename, makeFailFunction, makeSuccessFunction;
        that = this;

        // broken out for JSLint
        makeFailFunction = function (name) {
            return function () {
                that.trigger('failed', "Failed to fetch sample details for " + name);
            };
        };

        // broken out for JSLint
        makeSuccessFunction = function () {
            return function(data) {
                that.samples[samplename] = data;
                action(data);
            };
        };

        // gets all sample details and calls action on each sample in turn
        // just loops over cached samples if it has them already
        
        if (this.names.length > 0) {
            for (item in this.names) {
                if (this.names.hasOwnProperty(item)) {
                    samplename = this.names[item];
                    if (this.samples[samplename]) {
                        action(this.samples[item]);
                    } else {
                        inputlist = {};
                        inputlist.SampleName = samplename;
                        jQuery.get("/Sample/Read", inputlist, makeSuccessFunction(), "json").fail(makeFailFunction());
                    }
                }
            }
        } else {
            // we don't have squat, so kick off reading the names and then recurse
            // if we don't find any samples (result length 0) then we just give up
            jQuery.get("/Sample/List", {}, function (data) {
                if (0 === data.length) {
                    return;
                }
                that.names = data;
                that.foreachSample(action);
            }, "json").fail(function () {
                that.trigger('failed', "Failed to fetch the list of sample names");
            });
        }
    },

    deleteSample: function (name) {

        var i, that, inputlist;
        that = this;
        inputlist = { SampleName: name };

        jQuery.post("/Sample/Delete", inputlist, function () {

            // now delete the item from our details list and names list
            delete that.samples[name];
            for (i = 0; i < that.names.length; i += 1) {
                if (that.names[i] === name) {
                    that.names.splice(i, 1);
                    break;
                }
            }

            that.trigger('delete', name);

        }).fail(function () {
            that.trigger('failed', "Failed to delete the sample named " + name);
        });
    },

    newSample: function () {

        // ask for a new sample from the instrument and then
        // pass the data in a trigger

        var that = this;
        jQuery.post("/Sample/Create", null, function (data) {

            // add the new sample details and name to our lists
            var name = data.SampleName;
            that.names.push(name);
            that.samples[name] = data;

            // then let the view know that a new sample was created
            that.trigger('new', data);

        }, "json").fail(function () {
            that.trigger('failed', "Failed to create a new sample");
        });
    },

    //
    // The instrument API looks for 
    // - SampleName
    // - OriginalSampleName
    // - SampleGuid
    //
    renameSample: function (newname, oldname, guid) {
        var that = this,
            inputlist = {};

        inputlist.SampleName = newname;
        inputlist.OriginalSampleName = oldname;
        inputlist.SampleGuid = guid;

        jQuery.post("/Sample/Rename", inputlist, function (data) {

            //
            // we get passed back an object with
            // Success = true/false
            // Message = newName if successful, else error message
            //

            if (data.Success) {
                if (data.Message !== inputlist.SampleName) {
                    that.trigger('failed', "Sample rename to '" + inputlist.SampleName +
                        "' did not match result: '" + data.Message + "'");
                }
                else {
                    that.trigger('renamed', inputlist);
                }
            } else {
                that.trigger('failed', data.Message);
            }
        }).fail(function () {
            that.trigger('failed', "Failed to rename a new sample");
        });
    },

    //
    // Saving a sample requires a list of all input key/value properties
    // Call this with only the sample inputs so we only save that much
    //
    saveSample: function (newdata) {
        var that = this;

        jQuery.post("/Sample/Update", newdata, function (data) {

            that.trigger('updated', data);

        }, "json").fail(function () {
            that.trigger('failed', "Failed to update a sample");
        });
    }
});
