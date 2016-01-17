$.xhrPool = []; // array of uncompleted requests
$.xhrPool.abortAll = function() { // our abort function
    $(this).each(function(idx, jqXHR) { jqXHR.abort(); });
    $.xhrPool.length = 0
};

$.ajaxSetup({
    beforeSend: function(jqXHR) {

    },
    complete: function(jqXHR) {
        var index = $.xhrPool.indexOf(jqXHR);
        if (index > -1) { $.xhrPool.splice(index, 1); }
    }
});

/*window.addEventListener('message', recieveHeatmapMessage, false);

function recieveHeatmapMessage(e)
{
    // this is a very dirty fix
    var obj = JSON.parse(e.data);
    if(obj.type=='locationview'){
        Backbone.history.navigate("files/"+obj.fileid+'/locationview/'+obj.place,{ trigger: true });
    }else if(obj.type=='userview'){
        Backbone.history.navigate("files/"+obj.fileid+'/userview/'+obj.user,{ trigger: true });
    }
}*/

jQuery.extend(window.Foundation.libs.abide.settings.patterns, {
    /*
        'username': /(?=^.)([A-Za-z\u0610-\u06FF]{1})([A-Za-z0-9@_\-\.\u0610-\u06FF]{0,49})$/,
        'xceed_password': /([A-Za-z0-9!@#$%_\^\&amp;\*\-\.\?]{5,49})$/,
        'mobile': /^[0-9]{6,20}$/,
        'email': /^[0-9a-zA-Z]+([0-9a-zA-Z]*[-._+])*[0-9a-zA-Z]+@[0-9a-zA-Z]+([-.][0-9a-zA-Z]+)*([0-9a-zA-Z]*[.])[a-zA-Z]{2,6}$/,
        'file_name': /^[\w\d\u0610-\u06FF-\@\#\s\.]{3,74}$/,
        'keyword_name': /^[\w\d\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF-\@\#\s\.\:\/]{3,}$/g,

    */
    'login_password':/^[A-Za-z0-9!@#$%_\^\&amp;\*\-\.\?]{3,49}$/
});

$(function () {
    Application.module("MainModule").start();
    Backbone.history.start();
});


function getParameterByName(name, string) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(string);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

sendAuthentication = function (xhr) {
    $.xhrPool.push(xhr);
    if (_.isUndefined($.cookie('token_sovestigate'))) {
        Backbone.history.navigate("login",{ trigger: true });
    }else{
        //var user = "admin@xceed";// your actual username
        //var pass = "123456";// your actual password
        //var token = user.concat(":", pass);
        var token = $.cookie('token_sovestigate');
        xhr.setRequestHeader('Authorization', ("Basic ".concat(btoa(token))));
    }
}

function checkFileCookie(id){
    var filecookie = $.cookie('file_kw_'+id);
    var isthere = false;
    if(typeof(filecookie) != 'undefined'){
        isthere = true;
    }
    return isthere;
}

function fixTwitterImageUrls(url){
    var s;
    var re;
    if(typeof(url) != 'undefined'){
        s = url;
        re = s.replace(/^http:\/\/a0/g, "http://pbs");
    }else{
        re = 'images/tt_temp_image.jpg';
    }
    return re;
}

// convert number with comas
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function NewsPaperGraph(elem, data, App) {
    var barData = data;

    var vis = d3.select(elem).append("svg").attr("width", 460).attr("height", 200),
        WIDTH = 440,
        HEIGHT = 160,
        MARGINS = { top: 0, right: 0, bottom: 10, left: 30 },
        xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(
            barData.map(function (d) { return d.sourceName; })
        ),
        yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
            d3.max(barData, function (d) { return parseInt(d.count); })
        ]),
        xAxis = d3.svg.axis()
            .scale(xRange)
            .tickSize(5)
            .tickSubdivide(true),
        yAxis = d3.svg.axis()
            .scale(yRange)
            .tickSize(5)
            .orient("left")
            .tickSubdivide(true);

    vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
        .call(xAxis);
        //.selectAll(".tick text")
        //.call(wrap, xRange.rangeBand());

    vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
        .call(yAxis);

    vis.selectAll('rect')
        .data(barData)
        .enter()
        .append('rect')
        .attr('x', function (d) {
            return xRange(d.sourceName);
        })
        .attr('y', function (d) {
            return yRange(parseInt(d.count));
        })
        .attr('width', xRange.rangeBand())
        .attr('height', function (d) {
            return ((HEIGHT - MARGINS.bottom) - yRange(parseInt(d.count)));
        })
        .attr('fill', '#3e9a9a')
        .attr('class', 'rect')
        .on("click", function(d){
            load_post(d, App);
        });;
}

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function MentionedGraph(elem, data) {
   var barData = data;

    var vis = d3.select(elem).append("svg").attr("width", 210).attr("height", 160),
        WIDTH = 190,
        HEIGHT = 150,
        MARGINS = { top: 0, right: 0, bottom: 10, left: 35 },
        xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(
            barData.map(function (d) { return d.number_of_mentions; })
        ),
        yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
            d3.max(barData, function (d) { return parseInt(d.number_of_mentions); })
        ]),
        xAxis = d3.svg.axis()
            .scale(xRange)
            .tickSize(5)
            .tickSubdivide(true),
        yAxis = d3.svg.axis()
            .scale(yRange)
            .tickSize(5)
            .orient("left")
            .tickSubdivide(true);

    vis.append('svg:g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
        .call(xAxis);

    vis.append('svg:g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
        .call(yAxis);

    vis.selectAll('rect')
        .data(barData)
        .enter()
        .append('rect')
        .attr('x', function (d) {
            return xRange(d.number_of_mentions);
        })
        .attr('y', function (d) {
            return yRange(parseInt(d.number_of_mentions));
        })
        .attr('width', xRange.rangeBand())
        .attr('height', function (d) {
            return ((HEIGHT - MARGINS.bottom) - yRange(parseInt(d.number_of_mentions)));
        })
        .attr('fill', '#0087bf');
}

function PieChart(elem, model){

    var width = 210, height = 190, radius = 70, total = model.get('totalTweets');

    var pie0 = {"label":"Positive", "value":model.get('totalTweetPositiveSentiment')};
    var pie1 = {"label":"Negative", "value":model.get('totalTweetNegativeSentiment')};
    var pie2 = {"label":"Neutral", "value":model.get('totalTweetNeutralSentiment')};

    var data = [ ];

    if(model.get('totalTweetPositiveSentiment')>0){ data.push(pie0); }
    if(model.get('totalTweetNeutralSentiment')>0){ data.push(pie2); }
    if(model.get('totalTweetNegativeSentiment')>0){ data.push(pie1); }


    var svg = d3.select(elem).append("svg").attr("width", width).attr("height", height)
        .attr("class", "pie_chart")
        .append("g");

    svg.append("circle").attr("r", 74).attr("class", 'circle_border');
    svg.append("circle").attr("r", 52).attr("class", 'circle_border');

    svg.append("g").attr("class", "slices");
    svg.append("g").attr("class", "labels");
    svg.append("g").attr("class", "lines");



    var pie = d3.layout.pie().sort(null).value(function(d) { return d.value; });
    var arc = d3.svg.arc().outerRadius(radius).innerRadius(radius-15);
    var outerArc = d3.svg.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
    svg.attr("transform", "translate(" + 105 + "," + 100 + ")");

    var key = function(d){ return d.data.label; };
    var color = d3.scale.ordinal().range(["#3e9a9a", "#e67471", "#aaa79f"]);

   function change(data) {

        var slice = svg.select(".slices").selectAll("path.slice").data(pie(data), key);

        slice.enter()
            .insert("path")
            .style("fill", function(d) {
                if(d.data.label == 'Positive'){ return "#3e9a9a"; };
                if(d.data.label == 'Negative'){ return "#e67471"; };
                if(d.data.label == 'Neutral'){ return "#aaa79f"; };
            })
            .attr("class", "slice");


        slice.transition().duration(1000)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return arc(interpolate(t));
                };
            })

        slice.exit().remove();
        // ------- TEXT LABELS -------
        var text = svg.select(".labels").selectAll("text").data(pie(data), key);
        function midAngle(d){ return d.startAngle + (d.endAngle - d.startAngle)/2; }

        text.enter().append("text").attr("dy", function(d){
            var val = ".35em";
            return val;
        })
        .style("fill", function(d) {
                if(d.data.label == 'Positive'){ return "#3e9a9a"; };
                if(d.data.label == 'Negative'){ return "#e67471"; };
                if(d.data.label == 'Neutral'){ return "#aaa79f"; };
        })
        .text(function(d) { return Math.round((d.data.value/total)*100)+'%'; });
        text.transition().duration(1000)
            .attrTween("transform", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                    return  "translate("+ pos +")";
                };
            })
            .styleTween("text-anchor", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    return midAngle(d2) < Math.PI ? "start":"end";
                };
            });
        text.exit().remove();
        // ------- SLICE TO TEXT POLYLINES -------
        var polyline = svg.select(".lines").selectAll("polyline")
            .data(pie(data), key);
        polyline.enter().append("polyline");
        polyline.transition().duration(1000)
            .attrTween("points", function(d){
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    var d2 = interpolate(t);
                    var pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                    return [arc.centroid(d2), outerArc.centroid(d2), pos];
                };
            });
        polyline.exit().remove();
    }

    change(data);

}

function PieChartSmall(elem, likes, dislikes){

    var width = 98, height = 80, radius = 38;

    var data = [{"label":"likes", "value":likes},{"label":"dislikes", "value":dislikes} ];

    var svg = d3.select(elem).append("svg").attr("width", width).attr("height", height)
        .attr("class", "pie_chart")
        .append("g");

    svg.append("circle").attr("r", 38).attr("class", 'circle_border');
    svg.append("circle").attr("r", 30).attr("class", 'circle_border');

    svg.append("g").attr("class", "slices");
    svg.append("g").attr("class", "labels");
    svg.append("g").attr("class", "lines");

    var pie = d3.layout.pie().sort(null).value(function(d) { return d.value; });
    var arc = d3.svg.arc().outerRadius(radius).innerRadius(radius-7);
    var outerArc = d3.svg.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
    svg.attr("transform", "translate(" + 50 + "," + 39 + ")");

    var key = function(d){ return d.data.label; };
    var color = d3.scale.ordinal().range(["#3e9a9a", "#e67471", "#aaa79f"]);

    function change(data) {

        var slice = svg.select(".slices").selectAll("path.slice").data(pie(data), key);

        slice.enter()
            .insert("path")
            .style("fill", function(d) {
                if(d.data.label == 'likes'){ return "#3e9a9a"; };
                if(d.data.label == 'dislikes'){ return "#e67471"; };
            })
            .attr("class", "slice");

        slice.transition().duration(1000)
            .attrTween("d", function(d) {
                this._current = this._current || d;
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);
                return function(t) {
                    return arc(interpolate(t));
                };
            })

        slice.exit().remove();
    }

    change(data);

}

function TrendGraph(container, period, kw_array, App){

    var data = kw_array[0].get('elements');
    var data_y_axis = [];
    for(var y=0; y<kw_array.length; y++){
        for(var t=0; t<kw_array[y].get('elements').length; t++){
            data_y_axis.push(kw_array[y].get('elements')[t].Total);
        }
    }

    var total_data = data.length;

    var elem = container;

    var margin = {top: 30, right: 20, bottom: 60, left: 80}, width = 500 - margin.left - margin.right, height = 230 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%d-%b-%y").parse;

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    var date_format = "DD MMM YY";

    if(period == 'year'){ date_format = "DD MMM YY"; }
    else if(period == 'quarter'){ date_format = "DD MMM YY" }
    else if(period == 'month'){ date_format = "DD MMM" }
    else if(period == 'week'){ date_format = "DD MMM" }



    var tick_label = function(d, i){
        var dateString = moment.unix(data[i].segment_start_time).format(date_format)+' - ' +moment.unix(data[i].segment_end_time).format(date_format);
        if(period == 'week'){ dateString = moment.unix(data[i].segment_start_time).format(date_format); }
        return dateString;
    };


    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(total_data).tickFormat(tick_label);
    var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

    var svg = d3.select(elem).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")" );


    x.domain(d3.extent(data, function(d) { var dateString = moment.unix(d.segment_end_time).format("DD-MMM-YY"); return parseDate(dateString); }));
    //y.domain([0, d3.max(data, function(d) { var s = d[type]; if(s<1){ s = d.Total } return s; })]);
    y.domain([0, d3.max(data_y_axis, function(d) { var s=d; return s; })]);

    function xpos(d) {  var dateString = moment.unix(d.segment_end_time).format("DD-MMM-YY"); return x(parseDate(dateString)); }
    function ypos(d) { return y(d["Twitter"]); }

    var line = d3.svg.line().x(xpos)
        line.y(ypos);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    for(var n=0; n<kw_array.length; n++){
        var line_data = kw_array[n].get('elements');
        svg.append("path").attr("d", line(line_data)).attr("class", 'line kw_color'+n);

        svg.selectAll("dot")
            .data(line_data)
            .enter().append("circle")
            .attr("r", 3)
            .attr("cx", xpos)
            .attr("cy", ypos)
            .attr("class", 'dots')
            .on("click", function(d){
                load_tweets(d, App);
            });

        svg.selectAll("value")
            .data(line_data)
            .enter().append("text")
            .attr("dy", "-1em")
            .style("text-anchor", "middle")
            .text(function(d) { return d["Twitter"]; })
            .attr("x", xpos)
            .attr("y", ypos)
            .attr("class", 'value');
    }
}

function load_post(data, App){
    $("#newspaper_post_container").html('<div class="empty_msg">loading...</div>');
    var ret = {
        file_id:App.MainModule.file_id,
        count:10,
        start_index:0,
        sort_direction: "Desc",
        source_type : 'NEWSPAPER'
    };
    var appurl = App.defaults.services_url+"/old_media/posts" + "?" + App.add_keywords(ret);
    $.ajax({
        url: appurl,
        beforeSend: sendAuthentication,
        withCredentials: true,
        dataType : "json",
    }).done(function(d) {
        var total_post = d.elements;
        var post_list = $('<ul />');

        for(var x in total_post){
            var t_obj = total_post[x];
            var li = $('<li/>');
            var h6 = $('<h6/>').html(t_obj.postTitle);
            var img = $('<img/>').attr('src', t_obj.sourceLogo);
            var p = $('<p />').html(t_obj.postContent);
            li.append(img,h6, p);
            post_list.append(li);
        }

        $("#newspaper_post_container").html(post_list);
        $("#newspaper_post_container").find('ul').slick({ rtl: true });
    });
    //alert(data);
}

function load_tweets(data, App){
    // d3.select("#redLine").style("opacity", newOpacity);
    $("#tweets_container").html('<div class="empty_msg">loading...</div>');
    var ret = {
        file_id:App.MainModule.file_id,
        count:10,
        start_index:0,
        sort_direction: "Asc",
        twitter_sort_by : 'Time',
        start_time: data.segment_start_time,
        end_time: data.segment_end_time
    };
    var appurl = App.defaults.services_url+"/twitter/tweets" + "?" + App.add_keywords(ret);
    $.ajax({
        url: appurl,
        beforeSend: sendAuthentication,
        withCredentials: true,
        dataType : "json",
    }).done(function(d) {
        //var res = d;
       var res = {
           "total_count":786440,
           "elements":[
               {"misbar_tweet_location":"none","file_id":"428","tweet":{"text":"#مصر \u003cem\u003e\u003cem\u003eداعش\u003c/em\u003e\u003c/em\u003e يفتتح “ولاية” جديدة باسم “الجزيرة” http://t.co/B4l5Of1gl7 #egypt","retweeted_status":{},"entities":{"urls":[{"expanded_url":"http://t.co/B4l5Of1gl7","display_url":"http://t.co/B4l5Of1gl7","url":"http://t.co/B4l5Of1gl7"}],"hashtags":["مصر","egypt"],"user_mentions":[]},"created_at":"Wed Feb 18 14:14:37 GMT+00:00 2015","id_str":"tag:search.twitter.com,2005:568050960217427968","user":{"statuses_count":0,"name":"GHADA EL HENAWY","followers_count":76,"friends_count":0,"screen_name":"GHADAELHENAWY","profile_image_url":"https://pbs.twimg.com/profile_images/526735272025657345/AYTybZH-_normal.jpeg","listed_count":0,"gender":"GENDER_UNKNOWN"}},"occurrence":0,"file_name":"داعش","tweet_sentiment":-2},
               {"misbar_tweet_location":"none","file_id":"428","tweet":{"text":"بعد مقتل الدرباك وولد الفونشه، \u003cem\u003e\u003cem\u003eداعش\u003c/em\u003e\u003c/em\u003e في درنه بحرق الدرابيك والطبول \"مزامير الشيطان\" .","retweeted_status":{},"entities":{"urls":[],"hashtags":[],"user_mentions":[]},"created_at":"Wed Feb 18 14:14:35 GMT+00:00 2015","id_str":"tag:search.twitter.com,2005:568050952357470209","user":{"statuses_count":0,"name":"علي العسبلي","followers_count":4146,"friends_count":0,"screen_name":"alialaspli","profile_image_url":"https://pbs.twimg.com/profile_images/559663128909463552/uQoU4014_normal.jpeg","listed_count":0,"gender":"Male"}},"occurrence":0,"file_name":"داعش","tweet_sentiment":-2},
               {"misbar_tweet_location":"none","file_id":"428","tweet":{"text":"#egypt \u003cem\u003e\u003cem\u003eداعش\u003c/em\u003e\u003c/em\u003e يفتتح “ولاية” جديدة باسم “الجزيرة” http://t.co/oLwMecflAe #مصر","retweeted_status":{},"entities":{"urls":[{"expanded_url":"http://t.co/oLwMecflAe","display_url":"http://t.co/oLwMecflAe","url":"http://t.co/oLwMecflAe"}],"hashtags":["egypt","مصر"],"user_mentions":[]},"created_at":"Wed Feb 18 14:14:35 GMT+00:00 2015","id_str":"tag:search.twitter.com,2005:568050952650887168","user":{"statuses_count":0,"name":"GHADA EL HENAWY","followers_count":76,"friends_count":0,"screen_name":"GHADAELHENAWY","profile_image_url":"https://pbs.twimg.com/profile_images/526735272025657345/AYTybZH-_normal.jpeg","listed_count":0,"gender":"GENDER_UNKNOWN"}},"occurrence":0,"file_name":"داعش","tweet_sentiment":-2},
               {"misbar_tweet_location":"none","file_id":"428","tweet":{"text":"RT @Dana20156: صحيفة EL CORREO الإسبانية تنشر خبراً عن إعتناق 3000 إسباني للإسلام\nالله اكبر \nنسخة لمن يقول : #\u003cem\u003e\u003cem\u003eداعش\u003c/em\u003e\u003c/em\u003e تشوه صورة الإسلام http:/…","retweeted_status":{},"entities":{"urls":[{"expanded_url":"http://t.co/41XfYDtPJr","display_url":"http://t.co/41XfYDtPJr","url":"http://t.co/41XfYDtPJr"}],"hashtags":["داعش"],"user_mentions":[{"name":"","screen_name":"Dana20156","id_str":""}]},"created_at":"Wed Feb 18 14:14:35 GMT+00:00 2015","id_str":"tag:search.twitter.com,2005:568050950960590850","user":{"statuses_count":0,"name":"أبو مصعب العتيبي","followers_count":327,"friends_count":0,"screen_name":"utaibiam","profile_image_url":"https://pbs.twimg.com/profile_images/518034641991630849/p8veu9lM_normal.jpeg","listed_count":0,"gender":"GENDER_UNKNOWN"}},"occurrence":18,"file_name":"داعش","tweet_sentiment":-2},
               {"misbar_tweet_location":"none","file_id":"428","tweet":{"text":"RT @marvashka: هل تعلم ان القوه المفرطه لضرب \u003cem\u003e\u003cem\u003eداعش\u003c/em\u003e\u003c/em\u003e يتناسب طرديا مع شعوري بالفخر بالجيش المصري وبانتمائي للبلد دي؟؟؟ #بياني_الى_الجزيره 😂😂😂","retweeted_status":{},"entities":{"urls":[],"hashtags":["بياني_الى_الجزيره"],"user_mentions":[{"name":"","screen_name":"marvashka","id_str":""}]},"created_at":"Wed Feb 18 14:14:33 GMT+00:00 2015","id_str":"tag:search.twitter.com,2005:568050943528464385","user":{"statuses_count":0,"name":"Heba Fawzy El-Masry","followers_count":1021,"friends_count":0,"screen_name":"HebaFawzy83","profile_image_url":"https://pbs.twimg.com/profile_images/539479279084765184/olFiJ3Cd_normal.jpeg","listed_count":0,"gender":"Female"}},"occurrence":1,"file_name":"داعش","tweet_sentiment":-2}
           ]};
        var total_tweets = res.elements;
        var tweets_list = $('<ul />');

        for(var x in total_tweets){
            var t_obj = total_tweets[x].tweet;
            var li = $('<li/>');
            var img = $('<img/>').attr('src', fixTwitterImageUrls(t_obj.user.profile_image_url));
            var p = $('<p />').html("<span>"+t_obj.user.screen_name+"</span>"+t_obj.text);
                li.append(img, p);
                tweets_list.append(li);
        }

        $("#tweets_container").html(tweets_list);
        $("#tweets_container").find('ul').slick({ rtl: true });

    });
    //alert(data);
}

function TweetsChart(elem) {
    var data = [
        { "sale": "202", "year": "2000" },
        { "sale": "215", "year": "2002" },
        { "sale": "179", "year": "2004" },
        { "sale": "199", "year": "2006" },
        { "sale": "134", "year": "2008" },
        { "sale": "176", "year": "2010" }
    ];
    var data2 = [
        { "sale": "152", "year": "2000" },
        { "sale": "189", "year": "2002" },
        { "sale": "179", "year": "2004" },
        { "sale": "199", "year": "2006" },
        { "sale": "134", "year": "2008" },
        { "sale": "176", "year": "2010" }
    ];
    var vis = d3.select(elem).append("svg").attr("width", 470).attr("height", 220),
        WIDTH = 460,
        HEIGHT = 220,
        MARGINS = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 50
        },
        xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([2000, 2010]),
        yScale = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([134, 215]),
        xAxis = d3.svg.axis()
            .scale(xScale),
        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");

    vis.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (HEIGHT - MARGINS.bottom) + ")")
        .call(xAxis);
    vis.append("svg:g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (MARGINS.left) + ",0)")
        .call(yAxis);
    var lineGen = d3.svg.line()
        .x(function(d) {
            return xScale(d.year);
        })
        .y(function(d) {
            return yScale(d.sale);
        })
        .interpolate("basis");
    vis.append('svg:path')
        .attr('d', lineGen(data))
        .attr('stroke', 'green')
        .attr('stroke-width', 2)
        .attr('fill', 'none');
    vis.append('svg:path')
        .attr('d', lineGen(data2))
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .attr('fill', 'none');
}


// Date Convert to Hijri
function gmod(n,m){ return ((n%m)+m)%m; }
function HijriCalendar(adjust){
    var today = new Date();
    if(adjust) {
        adjustmili = 1000*60*60*24*adjust;
        todaymili = today.getTime()+adjustmili;
        today = new Date(todaymili);
    }
    day = today.getDate();
    month = today.getMonth();
    year = today.getFullYear();
    m = month+1;
    y = year;
    if(m<3) {
        y -= 1;
        m += 12;
    }

    a = Math.floor(y/100.);
    b = 2-a+Math.floor(a/4.);
    if(y<1583) b = 0;
    if(y==1582) {
        if(m>10)  b = -10;
        if(m==10) {
            b = 0;
            if(day>4) b = -10;
        }
    }

    jd = Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+day+b-1524;

    b = 0;
    if(jd>2299160){
        a = Math.floor((jd-1867216.25)/36524.25);
        b = 1+a-Math.floor(a/4.);
    }
    bb = jd+b+1524;
    cc = Math.floor((bb-122.1)/365.25);
    dd = Math.floor(365.25*cc);
    ee = Math.floor((bb-dd)/30.6001);
    day =(bb-dd)-Math.floor(30.6001*ee);
    month = ee-1;
    if(ee>13) {
        cc += 1;
        month = ee-13;
    }
    year = cc-4716;

    if(adjust) {
        wd = gmod(jd+1-adjust,7)+1;
    } else {
        wd = gmod(jd+1,7)+1;
    }

    iyear = 10631./30.;
    epochastro = 1948084;
    epochcivil = 1948085;

    shift1 = 8.01/60.;

    z = jd-epochastro;
    cyc = Math.floor(z/10631.);
    z = z-10631*cyc;
    j = Math.floor((z-shift1)/iyear);
    iy = 30*cyc+j;
    z = z-Math.floor(j*iyear+shift1);
    im = Math.floor((z+28.5001)/29.5);
    if(im==13) im = 12;
    id = z-Math.floor(29.5001*im-29);

    var myRes = new Array(8);

    myRes[0] = day; //calculated day (CE)
    myRes[1] = month-1; //calculated month (CE)
    myRes[2] = year; //calculated year (CE)
    myRes[3] = jd-1; //julian day number
    myRes[4] = wd-1; //weekday number
    myRes[5] = id; //islamic date
    myRes[6] = im-1; //islamic month
    myRes[7] = iy; //islamic year

    return myRes;
}

function getHijriDate(adjustment) {
    var wdNames = new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");

    var iMonthNames = new Array("Muharram","Safar","Rabi-ul-Awwal","Rabi-ul-Akhir","Jumadal-Ula","Jumadal-Akhira","Rajab","Shaban","Ramadan","Shawwal","Dhul-Qaada","Dhul-Hijja");
    var iDate = HijriCalendar(adjustment);
    //var outputIslamicDate = wdNames[iDate[4]] + ", " + iDate[5] + " " + iMonthNames[iDate[6]] + " " + iDate[7] + " AH";
    var outputIslamicDate = '<strong class="lb-'+wdNames[iDate[4]]+'"></strong>, <strong class="lb-'+iMonthNames[iDate[6]]+'"></strong> '+iDate[5]+ ' ' + iDate[7] + ' <strong class="lb-AH"></strong>';

    return outputIslamicDate;
}

function initDate(){
    var str = '<strong class="lb-'+moment().format('ddd')+'"></strong>, <strong class="lb-'+moment().format('MMMM')+'"></strong> '+moment().format('DD YYYY, h:mm:ss a');
    return str;
}