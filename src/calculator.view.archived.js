
/*
* DEPRECATED in stand-alone, use View above instead
* SampleQueue builds off the queue above and some basic ajax calls
* to populate it and then process it
*
* Assumes: 
*  - jquery is loaded
*  - you will hook functions to provide ongoing progress
* 
*/

/*
Queue.js
Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:
http://creativecommons.org/publicdomain/zero/1.0/legalcode
*/

function Queue() {
    var queue = [];
    var offset = 0;

    this.getLength = function () {
        return (queue.length - offset);
    };

    this.isEmpty = function () {
        return (queue.length == 0);
    };

    this.enqueue = function (item) {
        queue.push(item);

    };

    this.dequeue = function () {
        if (queue.length == 0) return undefined;
        var item = queue[offset];
        if (++offset * 2 >= queue.length) {
            queue = queue.slice(offset);
            offset = 0;
        }
        return item;
    };

    this.peek = function () {
        return (queue.length > 0 ? queue[offset] : undefined);
    };
}

function SampleList() {
    this.queue = new Queue();
    this.queued = 0;
    this.total = 0;
    this.processed = 0;
    this.samples = {};

    //
    // Hooks for the view
    //

    this.SeenSampleName = function (id, name) {
        // hook this to get notification when we see each sample name
    };

    this.HaveSampleDetail = function (id, sample) {
        // hook this to get notification when we see have each of the sample's details
    };

    this.HaveAllSamples = function () {
        // hook this to get notification when we see have all of the sample's details
    };

    this.FailureNotice = function (what) {
        // hook this to get notified if any ajax requests failed
    };

    //
    // GetSamplesList
    //
    // Call this to fetch the list of user samples
    //

    this.GetSamplesList = function () {

        var samplelist = this;

        // request the list of names
        jQuery.get("/Sample/List", {}, function (data) {

            samplelist.ProcessNames(samplelist, data);
            samplelist.ProcessQueuedSamples(samplelist);

        }, "json").fail(function () {

            samplelist.FailureNotice("list of sample names");

        });
    };

    //
    // ProcessName
    //

    this.ProcessNames = function (samplelist, data) {

        if (null == data)
            return;

        samplelist.total = data.length;
        for (var prop in data) {

            //
            // queue the name for further processing
            //

            var samplename = data[prop];

            samplelist.queued += 1;
            var sample = {};
            sample.id = samplelist.queued;
            sample.name = samplename;
            samplelist.queue.enqueue(sample);

            //
            // Notify the view for each
            // 

            samplelist.SeenSampleName(sample.id, sample.name);
        }
    };

    this.GetNamedSample = function (name, action) {

        var samplelist = this;
        var inputlist = {};
        inputlist["SampleName"] = name;
        jQuery.get("/Sample/Read", inputlist, function (data) {

            action(data);

        }, "json").fail(function () {

            samplelist.FailureNotice("sample details for " + next.name);

        });
    };

    //
    // ProcessSample
    //
    // Requires: all names are queued up for us to fetch one at a time
    // Note: because we queue up ajax requests and recurse in the callback,
    // we should avoid any stack overflow. Sort of like using setTimeout().
    //

    this.ProcessQueuedSamples = function (samplelist) {

        var next = samplelist.queue.dequeue();
        if (undefined != next) {
            samplelist.GetNamedSample(next.name, function (data) {
                samplelist.ProcessSample(samplelist, data);
                samplelist.ProcessQueuedSamples(samplelist);
            });
        } else {
            //
            // That was it, we finished the last sample
            //

            samplelist.HaveAllSamples();
        }
    };

    //
    // ProcessSample
    //
    // Called with an individual array of sample info
    //

    this.ProcessSample = function (samplelist, data) {
        var name = data["SampleName"];
        samplelist.processed += 1;
        samplelist.samples[name] = data;
        samplelist.HaveSampleDetail(samplelist.processed, data);
    };
}