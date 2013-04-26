/** ------------------------------------------------ *
* StickyTicky 1.0.1
* Last Updated: 4/18/13
*
* version 1.0.1 - uses / explicitly for each cookie
* -------------------------------------------------- *
* Author: David Evans
* URL: http://owlmonkey.com/
* Copyright: 2012 David Evans
* License: MIT License
* -------------------------------------------------- *
*
* Call this function on an input checkbox field. It will use
* a cookie to remember the last value for that field for
* the web site visitor and prefill in subsequent visits.
*
* This uses a unique cookie for each checkbox, if you have
* a ton of them in a site it would be better to track this
* state yourself or switch to localstorage. I think the
* spec is to support up to 20 cookies per site?
*
** -------------------------------------------------- */

(function ($) {
    $.fn.stickyticky = function (theOptions) {
        theOptions = $.extend({
            cookieExpires: (31 * 12 * 20),  // in days, save state for 20 years by default
            cookiePrefix: "stickyticky_"
        }, theOptions);

        function cookieName(checkbox) {
            return theOptions.cookiePrefix + checkbox.attr("name");
        }

        function updateCookie(checkbox) {
            var cookiename = cookieName(checkbox);

            // save the checkbox state as "0" or "1"
            var state = (checkbox) ? checkbox.prop('checked') : true;
            var state_string = (state) ? "1" : "0";

            var expirationDate = new Date();
            expirationDate.setTime(expirationDate.getTime() + (theOptions.cookieExpires * 86400000));
            var expires = '; expires=' + expirationDate.toGMTString() + "; path=/";

            document.cookie = escape(cookiename) + '=' + escape(state_string) + expires;
        }

        return this.each(function () {
            var checkbox = $(this);

            //
            // name each cookie based on the input name
            // warning: if you use this for multiple forms on a site, 
            // make input names unique or override the cookiePrefix
            //

            var cookiename = cookieName(checkbox);

            //
            // read and setup defaults if a cookie already exists
            //
            // warning: if there are multiple cookies with this name (with different paths)
            // then this will just return the first that matches. that's why above we set
            // the path to / explicitly so we won't end up with more than that. For the
            // 2.0.0.2 calculator I'm also changing the prefix to reset what is used while
            // also now setting the cookie path to / explicitly. So the settings will differ
            // from an RS deployed calculator with 2.0.0 but then they'll sync up for 2.0.1
            //

            var cookie = document.cookie.match(new RegExp('(^|;)\\s*' + escape(cookiename) + '=([^;\\s]*)'));
            if (cookie) {

                //
                // cookie[2] is the value, "0" or "1" where leading 1 is 
                // to check and leading 0 is to uncheck
                //

                var state = cookie[2].charAt(0);
                checkbox.prop('checked', ('1' == state) ? 'checked' : null);
            }

            //
            // setup change event handler
            //

            $(this).change(function () {
                updateCookie(checkbox);
            });
        });
    };
})(jQuery);