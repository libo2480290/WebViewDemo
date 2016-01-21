(function(global) {
    global.__BDP_CALL_NATIVE__ = function(action, params, callback) {

        if (action) {
            var data = {
                action: action,
                params: params,
                callback: callback
            };
            var url = "bdp://hybrid?data=" + global.encodeURIComponent(JSON.stringify(data)),
                iframe = document.createElement('iframe');
            
            // console.log(JSON.stringify(data));
            iframe.src = url;
            iframe.style.display = "none";

            setTimeout(function() {
                iframe.parentNode.removeChild(iframe);
                iframe = null;
                
            }, 1000);

            document.body.appendChild(iframe);
        }
    }

    global.__BDP_CALL_JS__ = function(action, params) {
        if (global[action] && typeof global[action] == 'function') {
            global[action](JSON.parse(params));
        }
    }

})(window);