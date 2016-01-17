var Application = new Backbone.Marionette.Application();
	Application.start();

Application.app_modules = [];

Application.defaults = {
    //services_url: 'http://app-stage.misbaronline.com:8010', // staging
    services_url: 'http://app.misbaronline.com:8010', // production
    //services_url: 'http://app-dev.misbaronline.com:8010', // development
	name: 'Sovestigate : Dashboard'
};

Application.addRegions({
    app_container: '#app_container'
});

Application.addInitializer(function(){
    Application.xhrPool = []; //array of uncompleted requests
});

Application.loading_view = Backbone.Marionette.ItemView.extend({
    template: "#loading-template"
});

Application.no_data_view = Backbone.Marionette.ItemView.extend({
    template: "#no-data-template"
});

Application.error_view = Backbone.Marionette.ItemView.extend({
    template: "#error-template"
});

Application.cors = function(options)
{
    options || (options = {});
    options.dataType = "jsonp";

    if (!options.crossDomain) {
        options.crossDomain = true;
    }

    if (options.xhrFields) {
        options.xhrFields = {withCredentials:true};
    }

    return options;
}

Application.add_keywords = function(obj){
    if (!_.isUndefined($.cookie('file_kw_'+obj.file_id))) {
        kw_array = ($.cookie('file_kw_'+obj.file_id)).split(',');

        if($.cookie('file_kw_'+obj.file_id) != '') {
            kw_string = kw_array.join('&keyword_ids=');
            obj.keyword_ids = (kw_string);
        }
    }
    return decodeURIComponent($.param(obj))
}

Application.vent.on('App:Modules:add', function (module_name) {
    Application.app_modules.push(module_name);
});

Application.vent.on('App:Modules:empty', function () {
    _.each(this.app_modules, function(index,item){
        Application.module(item).close();
    });
});