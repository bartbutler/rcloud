window.onload = function () {
    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
    }

    function getQueryArgs() {
	var r, res = {}, s = location.search;
	while ((r = (new RegExp('[?|&]([^=&]+?)=([^&;#]+)(.*)').exec(s))) != null) {
	    res[decodeURIComponent(r[1])] = decodeURIComponent(r[2]);
	    s = r[3];
	}
	return res;
    }

    rclient = RClient.create({
        debug: false,
        host: (location.protocol == "https:") ? ("wss://"+location.hostname+":8083/") : ("ws://"+location.hostname+":8081/"),
        on_connect: function(ocaps) {
            rcloud = RCloud.create(ocaps.rcloud);
            if (rcloud.authenticated) {
                rcloud.session_init(rcloud.username(), rcloud.github_token(), function(hello) {
                    rclient.post_response(hello);
                });
            } else {
                rcloud.anonymous_session_init(function(hello) {
                    rclient.post_response(hello);
                });
            }
            rcloud.init_client_side_data();

	    var notebook = getURLParameter("notebook"),
	    version = getURLParameter("version");
	
	    rcloud.call_notebook(notebook, version, function(x) {
		if (!_.isUndefined(x.error)) {
		    // FIXME: what to do on error?
		    return;
                }
		// FIXME: I'm not sure what's the best way to make this available
		// in a convenient manner so that notebooks can leverage it ...
		window.notebook_result = x;
		if (!_.isUndefined(x.body)) $("body").append(x.body);
		if (_.isFunction(x.run)) x.run(getQueryArgs(), function() {});
	    });
	    return true;
        }, on_error: function(msg, status_code) {
            // debugger;
            if (msg == 'Login failed. Shutting down!') {
                window.location =
                    (window.location.protocol +
                     '//' + window.location.host +
                     '/login.R?redirect=' +
                     encodeURIComponent(window.location.pathname + window.location.search));
                return true;
            } else
                return false;
        }
    });
}
