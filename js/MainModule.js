Application.module('MainModule', function (MainModule, App, Backbone, Marionette, $) {

    this.startWithParent   = false;
	MainModule.file_id = null;
	MainModule.file = null;


	MainModule.TWEET_GRAPH_TIMER = 100000;
	MainModule.HASHTAGS_TIMER = 500000;
	MainModule.HEATMAP_TIMER = 200000;
	MainModule.TWEET_SUMMARY_TIMER = 600000;
	MainModule.FACEBOOK_SUMMARY_TIMER = 400000;
	MainModule.YOUTUBE_SUMMARY_TIMER = 700000;
	MainModule.OLDMEDIA_SUMMARY_TIMER = 900000;
	MainModule.SENTIMENT_TIMER = 800000;
	MainModule.MENTIONED_TIMER = 1000000;
	MainModule.FOLLOWED_TIMER = 500000;
	MainModule.GENDER_TIMER = 700000;
	MainModule.VIDEOS_TIMER = 200000;
	MainModule.OLDMEDIA_SOURCES_TIMER = 300000;


    MainModule.frontController = Marionette.Controller.extend({
        init:function(){

		},
		dashboard:function(fileid){
			$.xhrPool.abortAll();
			var self = this;
			if (_.isUndefined($.cookie('token_sovestigate'))) {
				Backbone.history.navigate("login",{ trigger: true });
				return
			}

				MainModule.file_id = parseInt(fileid);
				$('#app_container').addClass('container');
				$('#app_container').removeClass('login-background');

			if (_.isUndefined(MainModule.files)) {
					MainModule.files = new MainModule.files_collection();
					MainModule.files.fetch({
						beforeSend: sendAuthentication,
						success: function (result) {
							if(_.isUndefined(MainModule.file_id) || _.isNaN(MainModule.file_id) || _.isNull(MainModule.file_id)){
								var t_model = new Backbone.Collection(result.models);
								MainModule.file = result.models[0];
								MainModule.file_id = MainModule.file.id;
								Backbone.history.navigate('file/' + MainModule.file.id, {trigger: false});
							}else{
								var t_col = new Backbone.Collection(result.models);
								MainModule.file = t_col.where({id:MainModule.file_id})[0];
								Backbone.history.navigate('file/' + MainModule.file_id, {trigger: false});
							}
							self.show_statitics(MainModule.files);
						},
						error: function (x) {
							console.log('got files error'+x);
						}
					});
			}else{
				MainModule.file = MainModule.files.where({id:MainModule.file_id})[0];
				this.show_statitics(MainModule.files);
			}
		},
		login:function(){
			$.xhrPool.abortAll();
			$('#app_container').removeClass('container');
			$('#app_container').addClass('login-background');
			App.app_container.show(new MainModule.login_view());
		},
		show_statitics:function(collection){
			App.app_container.show(new App.loading_view());
			var main_layout_view = new MainModule.file_layout_view({collection:collection});
				App.app_container.show(main_layout_view);
		}
    });



	MainModule.login_view = Backbone.Marionette.ItemView.extend({
		template: "#login-view-template",
		className:"login-page",
		events:{ 'click #local_button':'localize' },
		ui:{
			username:'#login_username',
			password:'#login_password',
			wrong_info:'#wrong_info',
			login_loading:'#login_loading'
		},
		onRender:function(){
			var self = this;
			$(this.el).find('#login_from').foundation({bindings:'events'});
			$(this.el).find('#login_from').on('valid', function (e) { self.do_login(e); });
		},
		localize:function(e){
			e.preventDefault();
			/*if(arabiclocal() === 'ar'){
				$.cookie('local', 'en' ,{expires:2020});
				IsArabic();
			}else if(arabiclocal() === 'en'){
				$.cookie('local', 'ar' ,{expires:2020});
				IsArabic();
			}*/
		},
		do_login:function(e)
		{

			e.preventDefault();

			var self = this;
			var elem = $(this.el);
			this.ui.wrong_info.removeClass('error');
			if (self.ui.username.val().length > 0) {

				var user = self.ui.username.val();
				var pass = self.ui.password.val();
				var token = user.concat(":", pass);


				MainModule.user_model = new MainModule.authorization_model();
				MainModule.user_model.fetch({
					//beforeSend: sendAuthentication,
					headers: {'Authorization' :"Basic ".concat(btoa(token))},
					success:function(result){
						//console.log(result);
						$('.login-page').hide();
						var cookie_expiry_date = new Date();
							cookie_expiry_date.setTime(cookie_expiry_date.getTime() + (30 * 24 * 60 * 60 * 1000)); // (day hour  min  sec  msec)

						$.cookie('customer_id',user,{expires:cookie_expiry_date});
						$.cookie('token_sovestigate',token,{expires:cookie_expiry_date});

						controller.init();
						Backbone.history.navigate('',{trigger:true});
					},
					error:function() {
						self.ui.wrong_info.show();
						self.ui.wrong_info.addClass('error');
						elem.find('#login_loading').hide();
					}
				});
			}
		}
	});


	MainModule.file_layout_view = Backbone.Marionette.LayoutView.extend({
		template: "#file-layout-view-template",
		regions: {
			user_info: "#user_info",
			file_list: "#file_list",
			top_hashtags_container:"#top_hashtags_container",
			top_tweets_container:"#top_tweets_container",
			statistics_twitter:"#statistics_twitter",
			statistics_facebook:"#statistics_facebook",
			statistics_youtube:"#statistics_youtube",
			statistics_oldmedia:"#statistics_oldmedia",
			top_sentiments_container:"#top_sentiments_container",
			top_mentioned_container:"#top_mentioned_container",
			top_followers_container:"#top_followers_container",
			gender_container:"#gender_container",
			heatmap_container:"#heatmap_container",
			top_videos_container:"#top_videos_container",
			newspaper_container:"#newspaper_container"
		},
		events:{ 'click #user_info':'show_login_menu', 'click #logout_link':'logout'  },
		initialize:function(options){ this.files = options.collection },
		onRender:function(){
			var self = this;
			self.load_all_views();
			var this_obj = $(this.el);
			this_obj.find('.stats-container').slick({ rtl: true, arrows:false, dots:true, infinite:false });
			var w = 768*4;
			this_obj.find('.slick-track').width(w);

			this_obj.find('#customer_id').html($.cookie('customer_id'));
			this_obj.find('#ar_date').html(getHijriDate());
			setInterval(function(){ this_obj.find('#en_date').html(initDate()); }, 1000);
		},
		load_all_views:function(){
			var self = this;

			self.file_list.show(new App.loading_view());
			self.top_hashtags_container.show(new App.loading_view());
			self.top_tweets_container.show(new App.loading_view());
			self.statistics_twitter.show(new App.loading_view());
			self.statistics_facebook.show(new App.loading_view());
			self.statistics_youtube.show(new App.loading_view());
			self.statistics_oldmedia.show(new App.loading_view());
			self.top_sentiments_container.show(new App.loading_view());
			self.top_mentioned_container.show(new App.loading_view());
			self.top_followers_container.show(new App.loading_view());
			self.gender_container.show(new App.loading_view());
			self.heatmap_container.show(new App.loading_view());
			self.top_videos_container.show(new App.loading_view());
			self.newspaper_container.show(new App.loading_view());


			self.file_list.show(new MainModule.file_list_view({collection:self.files}));

			self.top_tweets_container.show(new MainModule.tweets_graph_view());
			self.heatmap_container.show(new MainModule.heatmap_itemview());

			var hashtags_collection = new MainModule.hashtags_collection(MainModule.file_id);
			hashtags_collection.fetch({
				beforeSend: sendAuthentication,
				success:function(result){
					if(hashtags_collection.length>0){
						self.top_hashtags_container.show(new MainModule.hashtags_collection_view({collection:hashtags_collection}));
					}else{
						self.top_hashtags_container.show(new App.no_data_view());
					}
				},
				error:function() {
					self.top_hashtags_container.show(new App.error_view());
				}
			});

			var twitter_summery_model = new MainModule.twitter_stats_summary_model(MainModule.file_id);
			twitter_summery_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){ self.statistics_twitter.show(new MainModule.twitter_summary_view({model:twitter_summery_model})); },
				error:function() { self.statistics_twitter.show(new App.error_view()); }
			});

			// remaining
			var facebook_summery_model = new MainModule.facebook_stats_summary_model(MainModule.file_id);
			facebook_summery_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){ self.statistics_facebook.show(new MainModule.facebook_summary_view({model:facebook_summery_model}));  },
				error:function() { self.statistics_facebook.show(new App.error_view()); }
			});
			// remaining
			var youtube_summery_model = new MainModule.youtube_stats_summary_model(MainModule.file_id);
			youtube_summery_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){  self.statistics_youtube.show(new MainModule.youtube_summary_view({model:youtube_summery_model}));  },
				error:function() { self.statistics_youtube.show(new App.error_view()); }
			});
			// remaining
			var old_media_summery_model = new MainModule.old_media_stats_summary_model(MainModule.file_id);
			old_media_summery_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){ self.statistics_oldmedia.show(new MainModule.oldmedia_summary_view({model:old_media_summery_model})); },
				error:function() {  self.statistics_oldmedia.show(new App.error_view());  }
			});

			var sentiment_model = new MainModule.sentiments_model(MainModule.file_id);
			sentiment_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){
					self.top_sentiments_container.show(new MainModule.sentiment_item_view({model:sentiment_model}));
				},
				error:function() { self.top_sentiments_container.show(new App.error_view()); }
			});

			var mentioned_model = new MainModule.top_mentioned_model(MainModule.file_id);
			mentioned_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){
					if(mentioned_model.get("elements").length>0){
						self.top_mentioned_container.show(new MainModule.mentioned_item_view({model:mentioned_model}));
					}else{
						self.top_mentioned_container.show(new App.no_data_view());
					}
				},
				error:function() { self.top_mentioned_container.show(new App.error_view()); }
			});

			var followed_collection = new MainModule.top_followed_collection(MainModule.file_id);
			followed_collection.fetch({
				beforeSend: sendAuthentication,
				success:function(result){
					if(followed_collection.length>0){
						self.top_followers_container.show(new  MainModule.followed_collection_view({collection:followed_collection}));
					}else{
						self.top_followers_container.show(new App.no_data_view());
					}
				},
				error:function() { self.top_followers_container.show(new App.error_view()); }
			});

			// remaining
			var gender_model = new MainModule.gender_model(MainModule.file_id);
			gender_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){
					if(gender_model.length>0){
						self.gender_container.show(new MainModule.gender_view({model:gender_model}));
					}else{
						self.gender_container.show(new App.no_data_view());
					}
				},
				error:function() { self.gender_container.show(new App.error_view()); }
			});

			// remaining
			var youtube_video_collection = new MainModule.top_videos_collection(MainModule.file_id, 'Views');
				youtube_video_collection.fetch({
					beforeSend: sendAuthentication,
					success:function(result){
						if(youtube_video_collection.length>0){
							self.top_videos_container.show(new MainModule.top_view_videos_container({collection:youtube_video_collection}));
						}else{
							self.top_videos_container.show(new App.no_data_view());
						}

					},
					error:function() { self.top_videos_container.show(new App.error_view()); }
				});

			// remaining
			var old_media_top_sources_model = new MainModule.old_media_top_sources_model(MainModule.file_id);
			old_media_top_sources_model.fetch({
				beforeSend: sendAuthentication,
				success:function(result){
					if(old_media_top_sources_model.get("elements").length>0){
						self.newspaper_container.show(new MainModule.top_newspaper_view({model:old_media_top_sources_model}))
					}else{
						self.newspaper_container.show(new App.no_data_view());
					}
				},
				error:function() { self.newspaper_container.show(new App.error_view()); }
			});


			self.reload_item_view(self.top_tweets_container, MainModule.tweets_graph_view, MainModule.TWEET_GRAPH_TIMER);
			self.reload_item_view(self.heatmap_container, MainModule.heatmap_itemview, MainModule.HEATMAP_TIMER);
			self.reload_collection_view(self.top_hashtags_container, MainModule.hashtags_collection_view, hashtags_collection, MainModule.HASHTAGS_TIMER);
			self.reload_model_view(self.statistics_twitter, MainModule.twitter_summary_view, twitter_summery_model, MainModule.TWEET_SUMMARY_TIMER);
			self.reload_model_view(self.statistics_facebook, MainModule.facebook_summary_view, facebook_summery_model, MainModule.FACEBOOK_SUMMARY_TIMER);
			self.reload_model_view(self.statistics_youtube, MainModule.youtube_summary_view, youtube_summery_model, MainModule.YOUTUBE_SUMMARY_TIMER);
			self.reload_model_view(self.statistics_oldmedia, MainModule.oldmedia_summary_view, old_media_summery_model, MainModule.OLDMEDIA_SUMMARY_TIMER);
			self.reload_model_view(self.top_sentiments_container, MainModule.sentiment_item_view, sentiment_model, MainModule.SENTIMENT_TIMER);
			self.reload_model_view(self.top_mentioned_container, MainModule.mentioned_item_view, mentioned_model, MainModule.MENTIONED_TIMER);
			self.reload_collection_view(self.top_followers_container, MainModule.followed_collection_view, followed_collection, MainModule.FOLLOWED_TIMER);
			self.reload_model_view(self.gender_container, MainModule.gender_view, gender_model, MainModule.GENDER_TIMER);
			self.reload_collection_view(self.top_videos_container, MainModule.top_view_videos_container, youtube_video_collection, MainModule.VIDEOS_TIMER);
			self.reload_model_view(self.newspaper_container, MainModule.top_newspaper_view, old_media_top_sources_model, MainModule.OLDMEDIA_SOURCES_TIMER);


		},
		reload_item_view:function(region, view, time){
			setInterval(function(){
				region.show(new App.loading_view());
				region.show(new view());
			}, time)
		},
		reload_collection_view:function(region, view, collection, time){
			setInterval(function(){
				region.show(new App.loading_view());
				collection.fetch({
					beforeSend: sendAuthentication,
					success:function(result){
						if(collection.length>0){
							region.show(new view({collection:collection}));
						}else{
							region.show(new App.no_data_view());
						}
					},
					error:function() { region.show(new App.error_view()); }
				});
			}, time)
		},
		reload_model_view:function(region, view, model, time){
			setInterval(function(){
				region.show(new App.loading_view());
				model.fetch({
					beforeSend: sendAuthentication,
					success:function(result){
						region.show(new view({model:model}));
					},
					error:function() { region.show(new App.error_view()); }
				});
			}, time)
		},
		show_login_menu:function(){
			var isHasClass = $('#user_info').hasClass('open');
			if(isHasClass){ $('#user_info').removeClass('open'); }else{ $('#user_info').addClass('open'); }
		},
		logout:function(){
			$.cookie("token_sovestigate",null,{expires:-1});
			//Backbone.BasicAuth.clear();
			Backbone.history.navigate("login");
			window.location.reload();
		}
	});


	MainModule.tweets_graph_view = Backbone.Marionette.ItemView.extend({
		template: "#tweets-collection-template",
		ui:{ keyword_container: "#keyword_container" },
		events:{ 'click .keyword':'show_dropdown', 'click .kw_dropdown span':'select_keyword'  },
		onRender:function(){
			var self = this;
			self.s_date = moment().subtract('days', 6).startOf('day');
			self.e_date = moment(new Date()).endOf('day');
			self.trend_array = [];

			var keyword_region = new Backbone.Marionette.Region({ el: this.ui.keyword_container });
			var keywords_collection = new Backbone.Collection(MainModule.file.get("keywords"));
				keyword_region.show(new MainModule.keywords_collection_view({collection:keywords_collection}));

			var three_kws = [];

			for(var x in MainModule.file.get("keywords")){
				if(x >= 3){ break  }
				three_kws.push(MainModule.file.get("keywords")[x].id);
				//console.log(x, MainModule.file.get("keywords")[x].id);
			}
			//var three_kws = [MainModule.file.get("keywords")[0].id,MainModule.file.get("keywords")[1].id,MainModule.file.get("keywords")[2].id];
			this.initialize_graph(three_kws);

		},
		initialize_graph: function(three_kws){
			var self = this;
			self.trend_array.length = 0;
			$(this.el).find('#tweets_graph').html('');
			for(var x=0; x<three_kws.length; x++) {
				var top_tweet_trend_model = new MainModule.top_tweet_trend_model({fileid:MainModule.file_id, start_date: self.s_date, end_date:self.e_date, time_frame:'week', keyword:three_kws[x] });
				top_tweet_trend_model.fetch({
					beforeSend: sendAuthentication,
					success:function(data){
						self.trend_array.push(data);
						if(self.trend_array.length == three_kws.length){
							self.make_trend_graph();
						}

					}
				});
			}
		},
		make_trend_graph:function(){
			var elem = $(this.el).find('#tweets_graph')[0];
			//if(this.trend_array.length === 3){
				TrendGraph(elem, 'week', this.trend_array, App);
			//}
		},
		show_dropdown:function(e){
			var str = "kw_"+$(e.currentTarget).index();
			this.index = $(e.currentTarget).index();
			$('.kw_dropdown').removeClass('kw_0 kw_1 kw_2');
			$('.kw_dropdown').addClass(str).show();
		},
		select_keyword:function(e){
			var index = this.index;
			var keyword = "<span class=\"kw_bullet kw_color"+index+"\"></span>"+$(e.currentTarget).html();
			var kw_id = $(e.currentTarget).attr('id');
				kw_id = kw_id.split('_');
				kw_id = kw_id[2];

			$('.keyword').eq(index).html(keyword);
			$('.keyword').eq(index).attr('id', 'kw_'+kw_id);
			$('.kw_dropdown').removeClass('kw_0 kw_1 kw_2');
			$('.kw_dropdown').hide();

			var three_kws = [];
			$('.keyword').each(function(index){
				var k = $(this).attr('id');
					k = k.split('_');
					k = k[1];
				if(k != "xx"){
					three_kws.push(k);
				}
			})

			this.initialize_graph(three_kws);
		}
	});

	MainModule.keywords_collection_view = Backbone.Marionette.ItemView.extend({
		template: "#keywords-collection-template",
		onRender:function(){ }
	});

	MainModule.file_item_view = Backbone.Marionette.ItemView.extend({
		template: "#file-item-template",
		tagName:"li",
		onRender:function(){
			var id = this.model.get('id');
			$(this.el).attr('id', id);
		}
	});
	MainModule.file_list_view = Backbone.Marionette.CompositeView.extend({
		template: "#file-list-template",
		childView: MainModule.file_item_view,
		childViewContainer: "#files_container",
		events:{ 'click li':'select_it', 'click .selected-file':'show_files' },
		initialize:function(){
			this.selected_file_name = MainModule.file.get('name');
		},
		select_it:function(e){
			var file_id = $(e.currentTarget).attr('id');
			var file_name = $(e.currentTarget).html();
			$(".selected-file").html(file_name);
			$(".files-list").removeClass('open');
			Backbone.history.navigate('file/'+file_id,{trigger:true});
		},
		show_files: function () {
			var isOpen = $(".files-list").hasClass('open');
			if(!isOpen){
				$(".files-list").addClass('open');
			}else{
				$(".files-list").removeClass('open');
			}

		},
		templateHelpers: function() {
			return { selected_file_name: this.selected_file_name };
		}
	});


	MainModule.heatmap_itemview = Backbone.Marionette.ItemView.extend({
		template: '#heatmap-template',
		ui:{ heatmap_frame:'#heatmap_frame', map:'#map' },
		onRender:function(){
			var self = $(this.el);

			var iframe_obj = {};
				iframe_obj.serviceurl = App.defaults.services_url;
				iframe_obj.fileid = MainModule.file.id;
				iframe_obj.count = 10;
			var hmdata = JSON.stringify(iframe_obj);

			this.ui.map.load(function() {
				this.contentWindow.postMessage(hmdata, '*');
			});
		}
	});



	MainModule.top_newspaper_view = Backbone.Marionette.ItemView.extend({
		template: '#top-newspaper-template',
		onRender:function(){
			var elem = $(this.el).find('#newspaper_graph')[0];
			NewsPaperGraph(elem, this.model.get('elements'), App);
		}
	});

	MainModule.twitter_summary_view = Backbone.Marionette.ItemView.extend({
		template: '#twitter-summary-item-template',
		onRender:function(){ }
	});
	MainModule.facebook_summary_view = Backbone.Marionette.ItemView.extend({
		template: '#facebook-summary-item-template',
		onRender:function(){ }
	});
	MainModule.youtube_summary_view = Backbone.Marionette.ItemView.extend({
		template: '#youtube-summary-item-template',
		onRender:function(){ }
	});
	MainModule.oldmedia_summary_view = Backbone.Marionette.ItemView.extend({
		template: '#oldmedia-summary-item-template',
		onRender:function(){ }
	});


	MainModule.sentiment_item_view = Backbone.Marionette.ItemView.extend({
		template: '#sentiment-item-template',
		initialize:function(){
				var s = this.model.get('tweetSentiment');
				this.face = 'flat';
				if (s > 0) { this.face = 'happy'; }
				if (s < 0) { this.face = 'sad'; }
				if (s == 0) {this.face = 'flat'; }
		},
		onRender:function(){
			var data = this.model;
			var elem = $(this.el).find('#sentiment_graph')[0];
			PieChart(elem, this.model);
		},
		templateHelpers: function(){  return { face:this.face }; }
	});

	MainModule.gender_view = Backbone.Marionette.ItemView.extend({
		template: '#gender-item-template',
		onRender:function(){ }
	});

	MainModule.mentioned_item_view = Backbone.Marionette.ItemView.extend({
		template: '#mentioned-item-template',
		onRender:function(){
			var elem = $(this.el).find('#bar_graph')[0];
			MentionedGraph(elem, this.model.get('elements'));
		}
	});

	MainModule.followed_item_view = Backbone.Marionette.ItemView.extend({
		template: '#followed-item-template',
		tagName:'div',
		className:'followed-item'
	});

	MainModule.followed_collection_view = Backbone.Marionette.CompositeView.extend({
		template: '#followed-collection-template',
		childView:MainModule.followed_item_view,
		childViewContainer:'#followed_container'
	});


	MainModule.file_hashtags_view = Backbone.Marionette.ItemView.extend({
		template: '#hashtags-item-template',
		tagName:'div'
	});

	MainModule.hashtags_collection_view = Backbone.Marionette.CompositeView.extend({
		template: '#hashtags-collection-template',
		childView:MainModule.file_hashtags_view,
		childViewContainer:'#hashtags_container'
	});

	MainModule.top_view_video_item = Backbone.Marionette.ItemView.extend({
		template: '#top-view-video-item-template',
		tagName:'div',
		className:'video_item',
		initialize:function(){
			var l = this.model.get('likes');
			var d = this.model.get('dislikes');
			this.face = 'flat';
			if (l > d) { this.face = 'happy'; }
			else if (d < l) { this.face = 'sad'; }
			else {this.face = 'flat'; }
		},
		onRender:function(){
			var data = this.model;
			var elem = $(this.el).find('#pie_chart_container')[0];
			PieChartSmall(elem, this.model.get('likes'), this.model.get('dislikes'));
		},
		templateHelpers: function(){  return { face:this.face }; }
	});

	MainModule.top_view_videos_container = Backbone.Marionette.CompositeView.extend({
		template: '#top-view-videos-container-template',
		childView:MainModule.top_view_video_item,
		childViewContainer:"#videos_container",
		onRender:function(){
			var w = 218*this.collection.length;
			$(this.el).find('#videos_container').slick({ rtl: true, arrows:false, dots:true, infinite:false });
			$(this.el).find('.slick-track').width(w);
		},
		templateHelpers: function(){  return { count:this.collection.length }; }
	});



	MainModule.hashtags_model = Backbone.Model.extend();
	MainModule.hashtags_collection = Backbone.Collection.extend({
		model:MainModule.hashtags_model,
		initialize: function(file_id) {
			this.count   = 5;
			this.file_id = file_id;
		},
		url: function() {
			var ret = {
				file_id:this.file_id,
				count:this.count
			};
			return App.defaults.services_url+'/twitter/stats/hashtags' + '?' + App.add_keywords(ret);
		},
		parse:function(resp) {
			var elms = resp.elements;
			_.each(elms, function(obj,indx){
				elms[indx].topoccurrence = resp.elements[0].occurrence;
			});
			return elms;
		}
	});

	//top sentiments
	MainModule.sentiments_model = Backbone.Model.extend({
		initialize: function(file_id) { this.file_id = file_id; },
		url: function(){
			var ret = { file_id:this.file_id };
			return App.defaults.services_url+'/twitter/sentimentStats' + '?' + App.add_keywords(ret);
		},
		parse: function(res){
			var json = {};

			if(res.status == "success"){
				json = res.data;

				json.totalTweetNegativeSentiment = json[0].tweet_negative_sentiment;
				json.totalTweetPositiveSentiment = json[0].tweet_positive_sentiment;
				json.totalTweetNeutralSentiment = json[0].tweet_neutral_sentiment;

				 /*json.totalTweetNegativeSentiment = 3;
				 json.totalTweetPositiveSentiment = 5;
				 json.totalTweetNeutralSentiment = 20;*/

				json.tweetSentiment = json.totalTweetPositiveSentiment - json.totalTweetNegativeSentiment;
				json.totalTweets = json.totalTweetPositiveSentiment + json.totalTweetNegativeSentiment + json.totalTweetNeutralSentiment;

			}
			json.status = res.status;
			json.code = res.code;

			return json;
		}
	});

	MainModule.twitter_stats_summary_model = Backbone.Model.extend({
		initialize: function(file_id) { this.file_id = file_id; },
		url: function(){
			var ret = { file_id:this.file_id };
			return App.defaults.services_url + '/twitter/stats/summary' + '?' + App.add_keywords(ret);
		}
	});
	MainModule.facebook_stats_summary_model = Backbone.Model.extend({
		initialize: function(file_id) { this.file_id = file_id; },
		url: function(){
			var ret = { file_id:this.file_id };
			return App.defaults.services_url + '/facebook/stats/summary' + '?' + App.add_keywords(ret);
		}
	});

	MainModule.youtube_stats_summary_model = Backbone.Model.extend({
		initialize: function(file_id) { this.file_id = file_id; },
		url: function(){
			var ret = { file_id:this.file_id };
			return App.defaults.services_url + '/youtube/stats/summary' + '?' + App.add_keywords(ret);
		}
	});

	MainModule.old_media_stats_summary_model = Backbone.Model.extend({
		initialize: function(file_id) { this.file_id = file_id; },
		url: function(){
			var ret = { file_id:this.file_id };
			return App.defaults.services_url + '/old_media/stats/summary' + '?' + App.add_keywords(ret);
		}
	});

	MainModule.top_mentioned_model = Backbone.Model.extend({
		initialize: function(file_id) {
			typeof(this.per_page) != 'undefined' || (this.per_page = 3);
			typeof(this.start_index) != 'undefined' || (this.start_index = 0);
			this.file_id = file_id;
		},
		url: function() {
			var ret = {
				file_id:this.file_id,
				count:this.per_page,
				start_index:this.start_index
			};
			return App.defaults.services_url+'/twitter/stats/mentioned' + '?' + App.add_keywords(ret);
		},
		parse:function(res){
			var data = {};
				data.elements = res;
			/*data.elements = [
				{"number_of_mentions":436,"number_of_tweets":200, "user":
					{"statuses_count":0,"followers_count":0,"friends_count":0,"screen_name":"MansourAlmazrou","profile_image_url":"http://pbs.twimg.com/profile_images/1380233403 /mansour_almazroui_normal.jpg","listed_count":0}
				},
				{"number_of_mentions":125,"number_of_tweets":30, "user":
					{"statuses_count":0,"followers_count":4723198,"friends_count":0,"screen_name":"Talhabeeb","profile_image_url":"https://pbs.twimg.com/profile_images/523782484056498176/bfDl30Wk_normal.jpeg","listed_count":0}
				},
				{"number_of_mentions":100,"number_of_tweets":100, "user":
					{"statuses_count":0,"followers_count":219372,"friends_count":0,"screen_name":"btalah","profile_image_url":"https://pbs.twimg.com/profile_images/3282112094/c3a1db67e3c6afe29356066a7e9cf0f4_normal.jpeg","listed_count":0}
				}
			];*/

			return data;
		}
	});

	MainModule.top_followed_model = Backbone.Model.extend();
	MainModule.top_followed_collection = Backbone.Collection.extend({
		model:MainModule.top_followed_model,
		initialize: function(file_id) {
			typeof(this.per_page) != 'undefined' || (this.per_page = 4);
			typeof(this.start_index) != 'undefined' || (this.start_index = 0);
			this.file_id = file_id;
		},
		url: function()
		{
			var ret = {
				file_id:this.file_id,
				count:this.per_page,
				start_index:this.start_index
			};

			return App.defaults.services_url+'/twitter/stats/followed' + '?' + App.add_keywords(ret);
		},
		parse:function(response){
			var res = response;

			_.each(res, function(obj,indx){ res[indx].topfollower = response[0].user.followers_count; });

			return res;
		}
	});


	MainModule.top_videos_model = Backbone.Model.extend();
	MainModule.top_videos_collection = Backbone.Collection.extend({
		model:MainModule.top_videos_model,
		initialize: function(file_id,type) {
			this.file_id = file_id;
			this.youtube_sort_by = type;
			if (_.isUndefined(this.per_page)) this.per_page = 4;
			if (_.isUndefined(this.sort_direction)) this.sort_direction = 'Desc';
		},
		url: function()
		{
			var ret = {
				file_id:this.file_id,
				count:this.per_page,
				youtube_sort_by:this.youtube_sort_by,
				sort_direction:this.sort_direction
			};

			return App.defaults.services_url+'/youtube/videos' + '?' + App.add_keywords(ret);
		},
		parse:function(resp){
			var elms = resp.elements;
			return elms;
		}
	});

	MainModule.old_media_top_sources_model = Backbone.Model.extend({
		initialize: function(file_id) {
			typeof(this.per_page) != 'undefined' || (this.per_page = 5);
			typeof(this.start_index) != 'undefined' || (this.start_index = 0);
			this.file_id = file_id;
		},
		url: function()
		{
			var ret = {
				file_id:this.file_id,
				count:this.per_page,
				start_index:this.start_index
			};
			return App.defaults.services_url+'/old_media/stats/sources' + '?' + App.add_keywords(ret);
		},
		parse:function(res){
			var data = {};
				data.elements = res;
				data.total = 0;
				for(var x in res){
					data.total += res[x].count;
				}
			return data;
		}
	});

	//hard coded
	MainModule.gender_model = Backbone.Model.extend({
		initialize: function(file_id) { this.file_id = file_id; },
		url: function() { return App.defaults.services_url+'/twitter/stats/gender?file_id='+this.file_id; }//,
		//url: function() { return App.defaults.services_url+'/twitter/getTweetCountsForSentimentAndGender?file_id='+this.file_id; },
		/*parse:function(res){
			var data = {"count":2700, "number_of_male":1700, "number_of_female":300, "number_of_unknown":700 }
			return data;
		}*/
	});






	MainModule.top_tweet_trend_model = Backbone.Model.extend({
		initialize: function(options) {
			typeof(this.per_page) != 'undefined' || (this.per_page = 10);
			typeof(this.start_index) != 'undefined' || (this.start_index = 0);

			this.file_id = options.fileid;
			this.start_date = options.start_date.unix();
			this.end_date = options.end_date.unix();
			this.time_frame = options.time_frame;
			this.keyword = options.keyword;
		},
		url: function() {
			var ret = {
				start_index: this.start_index,
				file_id: this.file_id,
				start_time: this.start_date,
				end_time: this.end_date,
				time_frame: this.time_frame,
				keyword_ids: this.keyword
			};

			return App.defaults.services_url+'/reports/volume/trend' + '?' + decodeURIComponent($.param(ret));
		},
		parse:function(resp) {
			/*//var elem =  {};
			var elem =  [{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1449262800,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1449349199,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":100
					//"Total":202
				},
				{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1449176400,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1449262799,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":90
					//"Total":124
				},
				{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1449090000,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1449176399,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":95
					//"Total":385
				},
				{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1449003600,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1449089999,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":80
					//"Total":398
				},
				{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1448917200,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1449003599,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":70
					//"Total":181
				},
				{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1448830800,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1448917199,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":50
					//"Total":180
				},
				{
					"OldMedia":Math.floor(Math.random() * 100) + 1,
					"segment_start_time":1448744400,
					"Facebook":Math.floor(Math.random() * 100) + 1,
					"Youtube":Math.floor(Math.random() * 100) + 1,
					"segment_end_time":1448830799,
					"Twitter":Math.floor(Math.random() * 100) + 1,
					"Total":91
					//"Total":162
				}];*/
			var elem =  {};
			elem.elements = resp.reverse();
			//elem.elements = resp.reverse();

			return elem; }
	});


	MainModule.authorization_model = Backbone.Model.extend({ url: function() { return App.defaults.services_url+'/users/me'; } });
	MainModule.file_model = Backbone.Model.extend({
		url:App.defaults.services_url+'/files',
		parse:function(res){
			var keywords_ids = [];
			if(!checkFileCookie(res.id)){
				for(var x in res.keywords){ keywords_ids.push(res.keywords[x].id); }
				$.cookie('file_kw_'+res.id, keywords_ids.toString(),{expires: 2020});
			}
			return res;
		}
	});

	MainModule.files_collection = Backbone.Collection.extend({
		model:MainModule.file_model,
		url:App.defaults.services_url+'/files',
		parse:function(resp) {
			var elms = _.sortBy(resp, function(obj){ return obj.status; });
			return elms;
		}
	});


    MainModule.Router = Backbone.Marionette.AppRouter.extend({
		appRoutes:{ 
			"":"dashboard",
			"login":"login",
			"file/:id":"dashboard"
		}
	});

	
	var controller
	MainModule.addInitializer(function () {
        		controller = new MainModule.frontController();
				controller.router = new MainModule.Router({ controller: controller });
				controller.init();
    });



});
