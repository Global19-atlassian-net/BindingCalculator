//
// Sample Preparation Calculator - Single sample view
//
// (c) 2013 Pacific Biosciences
//

/*jslint maxlen: 150 */
/*global $, _, Backbone*/

//
// Timed updates and renames
// Simple queue so we can pause briefly while people input things
// and update when they're done inputting things
//

var SaveTimer = function () {

    var saveCountdown = 0,
        renameCountdown = 0,
        timerInterval = 17,
        updateDelay = 170,
        renamefunction,
        updatefunction,
        modelparam;

    this.setCallbacks = function (rename, update, param) {
        renamefunction = rename;
        updatefunction = update;
        modelparam = param;
    };

    this.scheduleRename = function () {
        renameCountdown = updateDelay;
    };

    this.scheduleUpdate = function () {
        saveCountdown = updateDelay;
    };

    this.processUpdates = function () {
        //
        // decrement timers
        //

        if (renameCountdown > 0) {
            renameCountdown -= timerInterval;
            if (0 === renameCountdown) {
                renameCountdown = -1;
            }
        }

        if (saveCountdown > 0) {
            saveCountdown -= timerInterval;
            if (0 === saveCountdown) {
                saveCountdown = -1;
            }
        }

        //
        // if any have fired, then perform an update. renames go first
        //

        if (renameCountdown < 0) {
            renameCountdown = 0;
            renamefunction(modelparam);
        }

        if (saveCountdown < 0) {
            saveCountdown = 0;
            updatefunction(modelparam);
        }
    };

    this.cancelTimers = function () {
        renameCountdown = 0;
        saveCountdown = 0;
    };

    this.updateAllNow = function (notifier) {
        var waitingTimers, callNotifier, callNotifierIfDoneWaiting, anyupdate;

        //
        // Attempts to be SYNCHRONOUS! Does this using callbacks
        // and a couple semaphores. I use this to save state back
        // before a customer navigates away from the page if changes
        // were pending.
        //
        // If any timer was running, short circuit and process now.
        // And if we were asked to call anyone do that then.
        //

        waitingTimers = 0;
        if (renameCountdown !== 0) {
            waitingTimers += 1;
        }
        if (saveCountdown !== 0) {
            waitingTimers += 1;
        }

        //
        // You can use callNotifierIfDoneWaiting as often as you like,
        // only the lucky caller to hit it when the right number of
        // calls have completed will do anything.
        //

        callNotifier = function () {
            if (0 === waitingTimers) {
                if (notifier && "function" === typeof (notifier)) {
                    notifier();
                }
            }
        };
        callNotifierIfDoneWaiting = function () {
            waitingTimers -= 1;
            callNotifier();
        };

        anyupdate = false;

        if (renameCountdown !== 0) {
            anyupdate = true;
            this.renamefunction(modelparam, function () {
                callNotifierIfDoneWaiting();
            });
        }
        if (saveCountdown !== 0) {
            anyupdate = true;
            this.updatefunction(modelparam, function () {
                callNotifierIfDoneWaiting();
            });
        }

        //
        // if we didn't queue any async calls, then 
        // call the notifier immediately
        //

        if (false === anyupdate) {
            if (notifier && "function" === typeof (notifier)) {
                notifier();
            }
        }

        //
        // Lastly, implement a timeout. So if either of the
        // async calls fail or hang, then call the notifier
        // within five seconds anyway.
        //
        setTimeout(function () {
            callNotifierIfDoneWaiting();
            callNotifierIfDoneWaiting();
        }, 5000);
    };

    this.startTimer = function () {
        window.setInterval(this.processUpdates, timerInterval);
    };
};

var SamplesView = Backbone.View.extend({
    //
    // Show single sample view and sample list template
    // - subview for the sample list showing which is current
    //   - who keeps track of the 'current' single sample? I guess this view does
    //   - just asks the model for the list of samples, no need to load them all
    // - then the UI for the single sample which uses a template to fill in outputs
    // - subview for the single sample
    //   - when someone enters input, send a message to the model with the new values
    //   - when the model signals new values, update that portion of the DOM
    //

    samplename: '',
    sampledata: {},
    constants: undefined,
    ourSaveTimer: undefined,

    // was /Images/PacBio_Spinner.gif but inlined for single-file version of calculator
    progressIcon: "<img class='progressIcon' style='width:16px; padding-top:4px;' alt='In progress...' width='16px' " +
        "height='16px' src='data:image/gif;base64,R0lGODlhHAAcAOZ/AEhnllNkmSpppBuEuCxXdWWOxTRnmjNFWzRIjUNWdTt3q" +
        "Btnl0dznCmGtSdXmUmHp2iBlhpUl0p6phd7uhxopimXw1pyl2J5qS1SojVThmN3imiFoyxIkzRJYidmlSM6aDxhhAiDxix0pixFhhu" +
        "YySxDaWeBtCh7tUtieiRMeChliydYiRpJmGN7lSs9WQSj2wWY1D1VeQtyuzlcl0RYihkufQp6wAs3lhtEizVIejRKmyY8eThRZydym" +
        "TZ0lVqEpUpclzeVvRQ5hBxZigxZqzeNtAxlskeTtRhcpEdqpHGGm1h1oVNniwsojCM7jjh/tXKJpxKOwB1HfR5xrS2BqW+LtBEpjEp" +
        "bcUtggzuFrFRnpQeNzQtNozxsikZtgwtDnRt8pCeQvTtqnx16rBoykl10sx1yok1tkFR9mhJ1r0xhjFqGwFmSrDZjrlpvkBSBsUZik" +
        "AofhypdfxyNv2WQpgswkRRupXGPoD91jyxOak1pgUF+rXmRxWmNukdztgAAACH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVh" +
        "NUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iY" +
        "WRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDQuMi4yLWMwNjMgNTMuMzUyNjI0LCAyMDA4LzA3LzMwLTE4OjA" +
        "1OjQxICAgICAgICAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtb" +
        "nMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8" +
        "xLjAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6eG1wTU09Imh0dHA6L" +
        "y9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXB" +
        "lL1Jlc291cmNlRXZlbnQjIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczple" +
        "GlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9" +
        "waG90b3Nob3AvMS4wLyIKICAgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M0IE1hY2ludG9zaCIKICAgeG1wOkNyZ" +
        "WF0ZURhdGU9IjIwMTAtMDItMDVUMTY6MDA6MjYtMDg6MDAiCiAgIHhtcDpNZXRhZGF0YURhdGU9IjIwMTAtMDItMTFUMTQ6MjE6MTE" +
        "tMDg6MDAiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDEwLTAyLTExVDE0OjIxOjExLTA4OjAwIgogICBkYzpmb3JtYXQ9ImFwcGxpY2F0a" +
        "W9uL3ZuZC5hZG9iZS5waG90b3Nob3AiCiAgIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDU4MDExNzQwNzIwNjgxMTkxMDlFRDd" +
        "ENkUwRjI5M0EiCiAgIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTBENUE4QTExMzIwNjgxMThEQkJEN0RFMENCQ0REMUEiCiAgI" +
        "HhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpBMEQ1QThBMTEzMjA2ODExOERCQkQ3REUwQ0JDREQxQSIKICAgdGlmZjp" +
        "PcmllbnRhdGlvbj0iMSIKICAgdGlmZjpYUmVzb2x1dGlvbj0iNzIwMDAwLzEwMDAwIgogICB0aWZmOllSZXNvbHV0aW9uPSI3MjAwM" +
        "DAvMTAwMDAiCiAgIHRpZmY6UmVzb2x1dGlvblVuaXQ9IjIiCiAgIHRpZmY6TmF0aXZlRGlnZXN0PSIyNTYsMjU3LDI1OCwyNTksMjY" +
        "yLDI3NCwyNzcsMjg0LDUzMCw1MzEsMjgyLDI4MywyOTYsMzAxLDMxOCwzMTksNTI5LDUzMiwzMDYsMjcwLDI3MSwyNzIsMzA1LDMxN" +
        "SwzMzQzMjs0MUFEMjE2NEU4QkQ2RUI4MTlFNDRCNTgxNTFEREYzOCIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjI4IgogICBleGl" +
        "mOlBpeGVsWURpbWVuc2lvbj0iMjgiCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgZXhpZjpOYXRpdmVEaWdlc3Q9IjM2ODY0LDQwO" +
        "TYwLDQwOTYxLDM3MTIxLDM3MTIyLDQwOTYyLDQwOTYzLDM3NTEwLDQwOTY0LDM2ODY3LDM2ODY4LDMzNDM0LDMzNDM3LDM0ODUwLDM" +
        "0ODUyLDM0ODU1LDM0ODU2LDM3Mzc3LDM3Mzc4LDM3Mzc5LDM3MzgwLDM3MzgxLDM3MzgyLDM3MzgzLDM3Mzg0LDM3Mzg1LDM3Mzg2L" +
        "DM3Mzk2LDQxNDgzLDQxNDg0LDQxNDg2LDQxNDg3LDQxNDg4LDQxNDkyLDQxNDkzLDQxNDk1LDQxNzI4LDQxNzI5LDQxNzMwLDQxOTg" +
        "1LDQxOTg2LDQxOTg3LDQxOTg4LDQxOTg5LDQxOTkwLDQxOTkxLDQxOTkyLDQxOTkzLDQxOTk0LDQxOTk1LDQxOTk2LDQyMDE2LDAsM" +
        "iw0LDUsNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNSwxNiwxNywxOCwyMCwyMiwyMywyNCwyNSwyNiwyNywyOCwzMDs2NDU0RERFMkZ" +
        "FQjU2MjlGRDk4M0JDMzY0NzRBMjA2QSIKICAgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIKICAgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9I" +
        "nNSR0IgSUVDNjE5NjYtMi4xIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ" +
        "0OmFjdGlvbj0iY3JlYXRlZCIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpBMEQ1QThBMTEzMjA2ODExOERCQkQ3REUwQ" +
        "0JDREQxQSIKICAgICAgc3RFdnQ6d2hlbj0iMjAxMC0wMi0wNVQxNjowMDoyNi0wODowMCIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2V" +
        "udD0iQWRvYmUgUGhvdG9zaG9wIENTNCBNYWNpbnRvc2giLz4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiC" +
        "iAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6QTFENUE4QTExMzIwNjgxMThEQkJEN0RFMENCQ0REMUEiCiAgICAgIHN0RXZ" +
        "0OndoZW49IjIwMTAtMDItMDVUMTY6MDI6MDktMDg6MDAiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvc" +
        "CBDUzQgTWFjaW50b3NoIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIi8+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InN" +
        "hdmVkIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA1ODAxMTc0MDcyMDY4MTE5MTA5RUQ3RDZFMEYyOTNBIgogICAgI" +
        "CBzdEV2dDp3aGVuPSIyMDEwLTAyLTExVDE0OjIxOjExLTA4OjAwIgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG9" +
        "0b3Nob3AgQ1M0IE1hY2ludG9zaCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc" +
        "3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgC" +
        "iAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgI" +
        "CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA" +
        "gICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6" +
        "uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56" +
        "dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSU" +
        "VBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgU" +
        "EAwIBAAAh+QQJHgB/ACwAAAAAHAAcAAAH74B/goOEglY6OlaFi4yFTRhrBRh1jZWFN0QnJ0hflotOAUA1glwyIVsyRJ6EQg4SEiyDN" +
        "i8vIYQHHQeVLEhTU0ixgjAwtx25lRFpUVF2njzPlspRaavV1pY1o9eVI0sXI9uDCQmCOA4KCg444TEoWDF/ERRjYxQR4SBdXSCCZnN" +
        "zY8IJwoOH0IABAhMqXFgoQwAE4WgsQrBkA4BtalpYkDjIgYg9AhxcO4OGwcVBAhqEoSLgGoMHDxgUalChQbgH1YAAWRRATbgZFywSA" +
        "rBhA5xtYvbsUWBg0MuY2xQUCZKFkIQjRySECxJkEVaG1wIBACH5BAkeAH8ALAAAAAAcABwAAAfrgH+Cg4SCcQgINYWLjIscFyYcjZO" +
        "LQhECIhFChHGUfztAQIp/LEhpb3YRgmRlfDqTNRlLSziDdlFRaYJ1LGsFbTeNOBEUCxG1gm9vg19EMhNGXI3EyguUMlswIUaTdsqeN" +
        "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' />",

    wireUpConversionCalculator: function () {
        //
        // wire up conversion calculator
        //

        $('aside input').bind('keyup mouseup change', function () {
            var conc1, bp1, nm2, bp2, nm1, conc2;

            // compute result values based on inputs and some value for now
            conc1 = $('#cc-conc1').val();
            bp1 = $('#cc-bp1').val();
            nm2 = $('#cc-nm2').val();
            bp2 = $('#cc-bp2').val();

            // convert

            nm1 = (100000 * parseFloat(conc1)) / (parseFloat(bp1) * 65);
            conc2 = (parseFloat(nm2) * parseFloat(bp2) * 65) / 100000;

            // significant digits

            nm1 = nm1.toFixed(2);
            conc2 = conc2.toFixed(2);

            // errors

            if (isNaN(nm1)) {
                nm1 = "?";
            }
            if (isNaN(conc2)) {
                conc2 = "?";
            }

            $('#cc-nm1').html(nm1);
            $('#cc-conc2').html(conc2);
        });
    },

    triggerRadios: function () {
        //
        // this function triggers change events on all inputs/radios
        // so we can bind change handlers to adjust visibility in the UI
        // then trigger them all to adjust the UI by hiding/showing things
        // an alternative would be to adjust what is shown using templates
        //

        $('input').each(function () {
            if ($(this).is(':radio')) {
                if ($(this).attr('checked')) {
                    $(this).trigger('change');
                }
                return;
            }
        });
    },

    toggleRadioInputs: function (radioselector, firstinput, secondinput) {
        if ($(radioselector).is(':checked')) {
            $(secondinput).attr('disabled', true);
            $(firstinput).removeAttr('disabled');
        } else {
            $(secondinput).removeAttr('disabled');
            $(firstinput).attr('disabled', true);
        }
    },

    wireUpRadios: function () {
        //
        // wire up input enable/disable radios
        //
        var that = this;
        $('input[name="ComputeOption"]').bind('change', function () {
            that.toggleRadioInputs('#radio-compute-volume', '#calc-voltouse', '#calc-smrtcells');

            if ($('#radio-compute-volume').is(':checked')) {
                $('#calc-voltouse').removeAttr('disabled');
                $('#calc-smrtcells').attr('disabled', true);
                $('#calc-titration1').attr('disabled', true);
                $('#calc-titration2').attr('disabled', true);
                $('#calc-titration3').attr('disabled', true);
                $('#calc-titration4').attr('disabled', true);
                $('#calc-availablevolume').attr('disabled', true);
                $('#titration-section').hide();
                $('#binding-complex-section').show();
            } else if ($('#radio-compute-cells').is(':checked')) {
                $('#calc-smrtcells').removeAttr('disabled');
                $('#calc-voltouse').attr('disabled', true);
                $('#calc-titration1').attr('disabled', true);
                $('#calc-titration2').attr('disabled', true);
                $('#calc-titration3').attr('disabled', true);
                $('#calc-titration4').attr('disabled', true);
                $('#calc-availablevolume').attr('disabled', true);
                $('#titration-section').hide();
                $('#binding-complex-section').show();

                // check if non-standard is also selected and allow available volume
                if ($("#NonStandard-Radio-Yes").is(':checked')) {
                    $('#calc-availablevolume').removeAttr('disabled');
                } else {
                    $('#calc-availablevolume').attr('disabled', true);
                }
            } else {
                $('#calc-smrtcells').attr('disabled', true);
                $('#calc-voltouse').attr('disabled', true);
                $('#calc-titration1').removeAttr('disabled');
                $('#calc-titration2').removeAttr('disabled');
                $('#calc-titration3').removeAttr('disabled');
                $('#calc-titration4').removeAttr('disabled');
                $('#binding-complex-section').hide();
                $('#titration-section').show();

                // check if non-standard is also selected and allow available volume
                if ($("#NonStandard-Radio-Yes").is(':checked')) {
                    $('#calc-availablevolume').removeAttr('disabled');
                } else {
                    $('#calc-availablevolume').attr('disabled', true);
                }
            }
        });

        $('input[name="LowConcentrationsAllowed"]').bind('change', function () {
            if ($("#NonStandard-Radio-Yes").is(':checked')) {
                if ($('#radio-compute-titration').is(':checked') || $('#radio-compute-cells').is(':checked')) {
                    $('#calc-availablevolume').removeAttr('disabled');
                } else {
                    $('#calc-availablevolume').attr('disabled', true);
                }
            } else {
                $('#calc-availablevolume').attr('disabled', true);
            }
        });

        $('input[name="BindingComputation"]').bind('change', function () {
            that.toggleRadioInputs('#BindingComputation-Radio-Volume', '#bound-voltouse', '#bound-numcells');
        });

        $('input[name="ConcentrationOnPlateOption"]').bind('change', function () {
            that.toggleRadioInputs('#ConcentrationOnPlate-Radio-Default', null, '#CustomConcentrationOnPlate');
        });

        $('input[name="NonStandardAnnealingConcentrationOption"]').bind('change', function () {
            that.toggleRadioInputs('#NonStandardAnnealingConcentration-Radio-Default', null, '#CustomNonStandardAnnealingConcentration');
        });

        $('input[name="SpikeInRatioOption"]').bind('change', function () {
            that.toggleRadioInputs('#SpikeInRatio-Radio-Default', null, '#CustomSpikeInRatioPercent');
        });

        $('input[name="PolymeraseTemplateRatioOption"]').bind('change', function () {
            that.toggleRadioInputs('#PolymeraseTemplateRatioOption-Radio-Default', null, '#CustomPolymeraseTemplateRatio');
        });

        $('input[name="BindingPolymeraseOption"]').bind('change', function () {
            that.toggleRadioInputs('#BindingPolymeraseOption-Radio-All', null, '#NumberOfCellsInBinding');
        });

        $('input[name="StorageComplexOption"]').bind('change', function () {
            that.toggleRadioInputs('#StorageComplexOption-Radio-Default', null, '#StorageComplexOptionInput');
        });

        //
        // If we turn Spike-In Control use on or off the hide/show related sections
        //

        $('input[name="UseSpikeInControl"]').add($('input[name="Chemistry"]')).bind('change', function () {
            if ($('#UseSpikeInControl-Radio-True').is(':checked')) {
                // Use Spike-In is true
                if ($('#Chemistry-Radio-V1').is(':checked')) {
                    $('.hiddenV1SpikeInOutputs').hide();
                    $('.showV1SpikeInOutputs').show();
                    $('.hiddenV2SpikeInOutputs').hide();
                    $('.showV2SpikeInOutputs').hide();
                } else {
                    $('.hiddenV1SpikeInOutputs').hide();
                    $('.showV1SpikeInOutputs').hide();
                    $('.hiddenV2SpikeInOutputs').hide();
                    $('.showV2SpikeInOutputs').show();
                }
            } else {
                // Use Spike-In is false
                if ($('#Chemistry-Radio-V1').is(':checked')) {
                    $('.hiddenV1SpikeInOutputs').show();
                    $('.showV1SpikeInOutputs').hide();
                    $('.hiddenV2SpikeInOutputs').hide();
                    $('.showV2SpikeInOutputs').hide();
                } else {
                    $('.hiddenV1SpikeInOutputs').hide();
                    $('.showV1SpikeInOutputs').hide();
                    $('.hiddenV2SpikeInOutputs').show();
                    $('.showV2SpikeInOutputs').hide();
                }
            }
        });

        $('input[name="Chemistry"]').bind('change', function () {
            if ($('#Chemistry-Radio-V1').is(':checked')) {
                $('.v2ChemistryShown').hide();
            } else {
                $('.v2ChemistryShown').show();
            }
        });

        // adjusts visibility of sections related to long term storage
        // whenever changing large prep or explicit with small prep
        var longTermStorageVisibility = function() {
            if ($('#LongTermStorage-Radio-True').is(':checked') ||
                !$('#PreparationProtocol-Radio-Small').is(':checked')) {
                $('#storage-section').show();
                $('.showLongTermStorage').show();
            } else {
                $('#storage-section').hide();
                $('.showLongTermStorage').hide();
            }
        }

        $('input[name="PreparationProtocol"]').bind('change', function () {

            longTermStorageVisibility();

            // if user has selected Large preparation, then set storage to true
            // and disable the option. otherwise enable the option

            if ($('#PreparationProtocol-Radio-Small').is(':checked')) {
                // enable long term storage option
                $('#LongTermStorage-Radio-True').removeAttr('disabled');
                $('#LongTermStorage-Radio-False').removeAttr('disabled');
            } else {
                $('#LongTermStorage-Radio-False').attr('disabled', true);
                $('#LongTermStorage-Radio-True').attr('disabled', true).attr('checked', true);
            }
        });

        $('input[name="LongTermStorage"]').bind('change', function () {
            longTermStorageVisibility();
        });

        $('input[name="MagBead"]').bind('change', function () {
            if ($('#MagBead-Radio-Yes').is(':checked') || $('#MagBead-Radio-One').is(':checked') ) {
                $('.magBeadSection').show();
                $('.nonMagBeadSection').hide();
                // also mark complex reuse as false: not allowed with magbead in 1.3.2
                $('#ComplexReuse-Radio-Yes').attr('disabled', true);
                $('#ComplexReuse-Radio-No').attr('disabled', true).attr('checked', true);
            } else {
                $('.magBeadSection').hide();
                $('.nonMagBeadSection').show();
                // allow complex reuse again
                $('#ComplexReuse-Radio-Yes').removeAttr('disabled');
                $('#ComplexReuse-Radio-No').removeAttr('disabled');
            }
        });
    },

    wireUpTooltips: function () {
        var item, tip, tooltipcorner, positionstyle;

        //
        // Setup tooltips
        //

        $.fn.qtip.styles.leftside = {
            // Last part is the name of the style
            width: 200,
            background: 'rgb(191,224,236)',
            color: 'black',
            textAlign: 'center',
            border: {
                width: 7,
                radius: 5,
                color: 'rgb(191,224,236)'
            },
            tip: 'bottomLeft',
            name: 'dark' // Inherit the rest of the attributes from the preset dark style
        };
        $.fn.qtip.styles.rightside = {
            // Last part is the name of the style
            width: 200,
            background: 'rgb(191,224,236)',
            color: 'black',
            textAlign: 'center',
            border: {
                width: 7,
                radius: 5,
                color: 'rgb(191,224,236)'
            },
            tip: 'bottomRight',
            name: 'dark' // Inherit the rest of the attributes from the preset dark style
        };
        $.fn.qtip.styles.centered = {
            // Last part is the name of the style
            width: 200,
            background: 'rgb(191,224,236)',
            color: 'black',
            textAlign: 'center',
            border: {
                width: 7,
                radius: 5,
                color: 'rgb(191,224,236)'
            },
            tip: 'bottomMiddle',
            name: 'dark' // Inherit the rest of the attributes from the preset dark style
        };

        //
        // Setup tooltips
        //

        for (item in this.constants.tooltips) {
            if (this.constants.tooltips.hasOwnProperty(item)) {
                tip = this.constants.tooltips[item];
                tooltipcorner = 'bottomRight';
                positionstyle = 'rightside';

                if (tip.position === 'left') {
                    tooltipcorner = 'bottomLeft';
                    positionstyle = 'leftside';
                }

                $("." + tip.htmlclass).qtip({
                    content: tip.content,
                    position: { corner: { target: 'topMiddle', tooltip: tooltipcorner} },
                    style: positionstyle,
                    show: { delay: 1000 }
                });
            }
        }
    },

    wireUpInputs: function () {
        //
        // notice any input field changes and post updates
        // Exclude changes to the #calc-samplename as that will be handled by the rename.
        //

        var that = this;
        $('#calc-samplename').bind('keyup', function () {
            that.renameSample();
        });

        $('section input[type=text]').not("#calc-samplename").bind('keyup', function () {
            that.updateSample(this);
        });

        $('section input[type=radio]').bind('click', function () {
            that.updateSample(this);
        });

        $('#delete-button').bind('click', function () {
            that.deleteSample();
        });

        $('.new-button').bind('click', function () {
            that.newSample();
        });

        $('.print-button').bind('click', function () {
            that.printSample();
        });
    },

    WireUpAndTriggerEvents: function () {

        // wire up visibility of sections based on sample values
        // then trigger those changes so they apply immediately
        this.wireUpRadios();
        this.triggerRadios();

        // wire up tooltip help and then input monitoring for changes
        // so subsequent change events will cause sample updates
        this.wireUpTooltips();
        this.wireUpInputs();

        // make sure the conversion calculator works, people love it
        this.wireUpConversionCalculator();
    },

    ///////////////////////////////////////////////////////////////////////
    //
    // Updating Samples in the Display
    //

    statusClear: function (text) {
        $('.progressIcon').remove();
        $('#statusMessage').removeClass('status_error').empty().text(text);
    },

    statusError: function (text) {
        $('.progressIcon').remove();
        $('#statusMessage').addClass('status_error').empty().text(text);
    },

    processErrorMessages: function (detailsJson) {
        var myObject, numErrors,
            errorkey, details, inputid,
            shortmessage, longmessage,
            randomnumber, shorthtml;

        //
        // First remove any old errors that we had
        //

        $('.error_message').remove();
        $('.global_error').hide().empty();
        $('.aside_error').hide();
        $('.error_highlight').removeClass('error_highlight');
        $('.error_color').removeClass('error_color');

        //
        // value is a dictionary, where the key is the name of a coefficient and the value is a set of details about the error
        // so we should display a short error message next to the property in question and a long one at the top of the page
        //

        myObject = JSON.parse(detailsJson);
        numErrors = 0;

        for (errorkey in myObject) {
            if (myObject.hasOwnProperty(errorkey)) {
                details = myObject[errorkey];

                inputid = details.Coefficient;
                shortmessage = details.ShortMessage;
                longmessage = details.LongMessage;

                if ("" !== inputid) {
                    $('.highlight_' + inputid).addClass('error_highlight');
                    $('input[name=' + inputid + ']').addClass('error_highlight');
                    $('.output_' + inputid).addClass('error_color');
                }

                randomnumber = Math.floor(Math.random() * 11);
                shorthtml = "<div class='error_message push2 grid1 long_error_" + randomnumber + "'>" +
                    shortmessage + "</div><div class='error_message clear'></div>";

                if ("" !== inputid) {
                    $('.output_' + inputid).parent('div').next('.clear').first().after(shorthtml);
                    $('input[name=' + inputid + '] ~ div').filter('.clear').first().after(shorthtml);
                    $('input[name=' + inputid + ']').filter('input[type=radio]').parent().parent().last().next('.clear').first().after(shorthtml);
                }

                //
                // add the long description as a tooltip on the short description
                //

                $(".long_error_" + randomnumber).qtip({
                    content: longmessage,
                    position: { corner: { target: 'topMiddle', tooltip: 'bottomMiddle'} }, style: 'centered', show: { delay: 500 }
                });

                if (numErrors > 0) {
                    $('.global_error').append("<br />");
                }
                numErrors += 1;

                $('.global_error').append("<p>&#8226; " + longmessage + "</p>").show();
                $('.aside_error').show();
            }
        }
    },

    generalErrorMessage: function () {
        this.processErrorMessages(
            '{"General":{ "ShortMessage":"", "LongMessage":"Sorry, an error has occurred. ' +
                'Please reload this page to continue." }}');
    },

    updateValue: function (key, value) {
        var updating;

        //
        // Skip a Success response, that's not an actual value
        // And if we find an Errors object, parse that
        //

        if (key === "Success") {
            return;
        }

        if (key === "Errors") {
            this.processErrorMessages(value);
            return;
        }

        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        //
        // Update input elements that are named the same as the sample JSON output values
        // plus any class element named .output-foo that matches, to handle places where
        // a value is shown in a span in multiple locations.
        //
        // Note: we don't update radios because updating the radio value will change it
        // out from underneath the UI without updating the UI. You could instead search
        // for the right radio to 'check' and the rest to uncheck. TODO
        //

        $('input[name="' + key + '"]').each(function () {

            //
            // Update radio buttons. Each radio input has a name that matches our output.
            // But one of the radio's values should match our output. Simple approach is
            // to loop over all matching radio inputs and set the state based upon the
            // value matching our output. Note: After we update the radio we may need
            // to show/hide parts of the UI. So we explicitly trigger the radio's
            // change handlers after updating them.
            //

            if ($(this).is(':radio')) {
                $(this).prop('checked', (this.value === value)).trigger('change');
                return;
            }

            //
            // If the current value is effectively the same as the new value
            // (ie. one is just a canonical rendering) then leave it as is.
            // This allows 0 and 0.0 to remain as is for example.
            //
            // Note if you name a sample with just a number, this code will execute
            // but it should be harmless on the numbered sample name.
            //

            if (isNumber(this.value)) {
                if (parseFloat(this.value) === parseFloat(value)) {
                    return;
                }
            }

            //
            // Don't update an element with focus out from under the customer,
            // in case they were in the middle of editing something
            //

            if (this !== document.activeElement) {
                this.value = value;
            }
        });

        updating = $('.output_' + key);
        updating.text(value);

        // add units, note: initial page loading has these duplicated in that section and uses setCanonicalUnits just below.
        updating.filter('.uL').text(value + " uL").end();
        updating.filter('.nM').text(value + " nM").end();
        updating.filter('.percent').text(value + " %").end();

        // if the value went negative, highlight it as an error
        updating.removeClass('negative_value').filter(function () {
            return value < 0;
        }).addClass('negative_value').append(" (error)");
    },

    updateSections: function (data) {
        //
        // Turn sections on or off based on what sample we have here
        // (and global settings)
        //

        var cell = data.Cell;
        if (cell === "CellVersion2") {
            $(".global_ShowCellOption").show();
        } else if (this.constants.globals.ShowCellOption) {
            $(".global_ShowCellOption").show();
        } else {
            $(".global_ShowCellOption").hide();
        }
    },

    updateAllValues: function (data, update) {
        var result, prop, newname;
        try {
            result = data.Success;
            if (result === false) {
                this.generalErrorMessage();
                return;
            }

            //
            // toggle sections based on values
            //

            this.updateSections(data);

            //
            // update elements on the page based on what was returned
            //

            for (prop in data) {
                if (data.hasOwnProperty(prop)) {
                    this.updateValue(prop, data[prop]);
                }
            }

            newname = $('#calc-samplename').val();
            $('#original-samplename').val(newname);
            //console.log("original samplename changed to " + newname);

            // make sure the sidebar is positioned properly if it grew/shrunk
            this.sidebarPositioning();

            if (update) {
                this.statusClear("Saved");
            }
            else {
                this.statusClear();
            }
        } catch (e) {
            this.generalErrorMessage();
            this.statusClear();
        }
    },

    ///////////////////////////////////////////////////////////////////////
    //
    // Updating
    // future: move to model
    //

    buildInputList: function () {
        var inputlist, el, name, radioVal;

        inputlist = {};
        $("section input").not("input[type=radio]").not("input[type=button]").each(function () {
            el = $(this);
            inputlist[el.attr('name')] = el.val();
        });

        //
        // Treat radios special and have jQuery figure out which is selected for us
        // Note: make sure you don't have jQuery 'set' the named input to some value
        // or it will change the value without updating the UI!
        //

        $("section input[type=radio]").each(function () {
            el = $(this);
            name = el.attr("name");
            radioVal = $("input:radio[name='" + name + "']:checked").val();

            inputlist[name] = radioVal;
            return;
        });
        return inputlist;
    },

    updateFieldsSync: function (that) {
        //
        // send up all text inputs and then all checked inputs
        //

        var inputlist = that.buildInputList();
        that.samples.saveSample(inputlist);
    },

    renameSampleSync: function (that) {
        var inputlist = that.buildInputList();

        that.samples.renameSample(inputlist.SampleName,
            inputlist.OriginalSampleName,
            inputlist.SampleGuid);
    },


    ///////////////////////////////////////////////////////////////////////
    //
    // Actions from the View
    //

    renameSample: function () {
        $('#statusMessage').empty().append("Renaming...");
        $('#statusIcon').empty().append(this.progressIcon);

        this.ourSaveTimer.scheduleRename();
    },

    updateSample: function (element) {

        if (!$(element).nextUntil('.clear').is('.progressIcon')) {
            $(element).nextUntil('.clear').last().after(this.progressIcon);
        }

        $('#statusMessage').empty().html("Saving...");
        $('#statusIcon').empty().append(this.progressIcon);

        this.ourSaveTimer.scheduleUpdate();
    },

    deleteSample: function () {

        this.ourSaveTimer.cancelTimers();

        var inputlist = this.buildInputList();
        this.samples.deleteSample(inputlist.SampleName);
    },

    newSample: function () {

        var that = this;
        this.ourSaveTimer.updateAllNow(function () {
            that.samples.newSample();
        });
    },

    printSample: function() {
        var querystring = "#print/";
        var inputlist = this.buildInputList();
        querystring += encodeURIComponent(inputlist.SampleName);
        window.location = querystring;
    },

    // location of the 'top' of the summary after the page is laid out
    // used to determine when to fix it while scrolling or let it float
    originalSummaryTop: 0,

    // call this to adjust sidebar positioning after scrolling, window
    // resizing, or whenever the sample changes
    sidebarPositioning: function() {
        var windowTop = $(window).scrollTop(); // returns number

        if ((this.originalSummaryTop < windowTop) && ($(window).width() > 767) ) {
            $('#sample-summary').css({ position: 'fixed', top: 6 });
            var height = $('#sample-summary').innerHeight()
            $('#converstion-calculator').css({ position: 'fixed', top: 16 + height });
        }
        else {
            $('#sample-summary').css('position','static');
            $('#converstion-calculator').css('position','static');
        }
    },

    initialize: function (options) {
        var that = this;

        this.samples = options.samples;
        this.constants = options.constants;
        this.ourSaveTimer = new SaveTimer();
        this.ourSaveTimer.setCallbacks(this.renameSampleSync, this.updateFieldsSync, this);
        this.ourSaveTimer.startTimer();

        //
        // if we delete the current sample, just select the first sample
        // future: keep a stack of visited samples and pop the stack
        //

        this.samples.on('delete', function () {
            // make sure the single sample view is visible first
            var infopanel = $('#sampleinfo');
            if (0 === infopanel.length) {
                return;
            }

            that.samples.selectSample("", true);

            // note: if this was the last sample the model will automatically trigger a new sample next
        });

        //
        // if we created a new sample, just populate the UI with the new values
        //

        this.samples.on('new', function (data) {
            // make sure the single sample view is visible first
            var infopanel = $('#sampleinfo');
            if (0 === infopanel.length) {
                return;
            }

            that.samples.selectSample(data.SampleName, true);
        });

        //
        // when a sample is selected, 
        // we'll update the sample list and then update all values in the UI
        //

        this.samples.on('selected', function (data) {
            // make sure the single sample view is visible first
            var infopanel = $('#sampleinfo');
            if (0 === infopanel.length) {
                return;
            }

            that.sampledata = data;

            // trigger display of the sample list again, now that our page is setup
            // this shouldn't cause an ajax call, should all be cached. so it should
            // update the list synchronously before we show anything else
            that.samples.getNames();

            // then load everything via ajax
            that.updateAllValues(data, false);

            // if we had dimmed the display, undim it
            $('#sampleinfo').fadeTo(100, 1.0);
        });

        //
        // when we save new inputs, the result is what we then
        // update the page with...
        //
        this.samples.on('updated', function (data) {
            // make sure the single sample view is visible first
            var infopanel = $('#sampleinfo');
            if (0 === infopanel.length) {
                return;
            }

            that.updateAllValues(data, true);
        });

        this.samples.on('renamed', function (data) {
            // update the output_SampleName in the Summary specifically
            // new name is in data.SampleName
            $('.output_SampleName').text(data.SampleName);
        });

        //
        // Renaming
        // Update the name in the list of samples (except if an empty string)
        // and our last viewed cookie and then clear the status
        //

        this.samples.on('renamed', function (inputs) {
            var newName, infopanel;

            // make sure the single sample view is visible first
            infopanel = $('#sampleinfo');
            if (0 === infopanel.length) {
                return;
            }

            newName = inputs.SampleName;
            if (newName === "") {
                newName = "(unnamed)"; /* otherwise it deletes the element */
            }

            //
            // Update both our hidden name and also the selected sample list for us
            // If we had an earlier error that made it red, clear that back to black
            // future: add/remove class instead of editing the css here
            //

            $('#calc-samplename').css("color", "black");
            $('#original-samplename').val(newName);
            console.log("original samplename changed to " + newName);

            that.statusClear("Renamed");
        });

        this.samples.on('renamefailed', function (error) {
            // make sure the single sample view is visible first
            var infopanel = $('#sampleinfo');
            if (0 === infopanel.length) {
                return;
            }

            // if we had a collision for example, display the error and 
            // make the control highlighted in red

            if (error === "DuplicateRequest") {
                // we get a race sometimes and duplicate requests - just ignore those
                that.statusClear("Renamed");
                return;
            }

            that.statusError(error);

            // future: add/remove class instead of editing the css here
            $('#calc-samplename').css("color", "red");
        });
    },
    render: function () {
        var template, radios;

        // toggle css and put up temporary page while loading details
        this.$el.hide().html('Loading sample...').prop("id", "singleview").show();

        //
        // Separate display of the template from the population of data. First render the template.
        // Then once rendered trigger the model to select the sample
        //

        radios = {};
        radios.ComputeOptionVolume = "checked='checked'";
        radios.ComputeOptionCells = "";
        radios.ComputeOptionTitration = "";
        radios.MagBeadYes = "checked='checked'";
        radios.MagBeadNo = "";
        radios.MagBeadOne = "";
        radios.ChemistryV2 = "";
        radios.ChemistryXL = "";
        radios.ChemistryP4 = "checked='checked'";
        radios.ChemistryP5 = "";
        radios.CellVersion2 = "";
        radios.CellVersion3 = "checked='checked'";
        radios.PreparationSmall = "checked='checked'";
        radios.PreparationLarge = "";
        radios.StorageYes = "";
        radios.StorageNo = "checked='checked'";
        radios.ControlYes = "checked='checked'";
        radios.ControlNo = "";
        radios.ReuseYes = "";
        radios.ReuseNo = "checked='checked'";
        radios.NonStandardYes = "";
        radios.NonStandardNo = "checked='checked'";
        radios.ConcentrationOnPlateDefault = "checked='checked'";
        radios.ConcentrationOnPlateCustom = "";
        radios.ControlComplexRatioDefault = "checked='checked'";
        radios.ControlComplexRatioCustom = "";
        radios.PolymeraseRatioDefault = "checked='checked'";
        radios.PolymeraseRatioCustom = "";
        radios.BindingPolymeraseAll = "checked='checked'";
        radios.BindingPolymeraseSome = "";
        radios.StorageComplexDefault = "checked='checked'";
        radios.StorageComplexCustom = "";

        _.templateSettings = {
            evaluate: /\{\{(.+?)\}\}/g,
            interpolate: /\{\{=(.+?)\}\}/g,
            escape: /\{\{-(.+?)\}\}/g
        };

        template = _.template($('#single-sample-template').html(), {
            radios: radios,
            strings: this.constants.strings
        });

        // hide the body and then replace it, wire up events, then show it

        this.$el.hide().html(template);
        $('body').css('background', "rgb(201,201,206)");

        this.constants.ShowHideOptionalSections();
        this.WireUpAndTriggerEvents();
        this.$el.show();

/*        var stickyCalculator = $('#converstion-calculator').offset().top;

        // TODO: if screen width changes and window reflows, recalculate positions/delta

        var sidebarPositioning = function() {
            var windowTop = $(window).scrollTop(); // returns number

            if ((stickyTopSummary < windowTop) && ($(window).width() > 767) ) {
                $('#sample-summary').css({ position: 'fixed', top: 6 });
                var height = $('#sample-summary').innerHeight()
                $('#converstion-calculator').css({ position: 'fixed', top: 16 + height });
            }
            else {
                $('#sample-summary').css('position','static');
                $('#converstion-calculator').css('position','static');
            }
        }
*/
        var that = this;
        this.originalSummaryTop = $('#sample-summary').offset().top;
        $(window).scroll(function() { that.sidebarPositioning() });
        $(window).resize(function() { that.sidebarPositioning() }); // or trigger scroll on resize events

        //
        // Now that the page is displayed, set the 'selected' sample in the model which
        // triggers the load of the sample list and the selected sample together
        //

        this.samples.selectSample(this.samplename, true);
    }
});