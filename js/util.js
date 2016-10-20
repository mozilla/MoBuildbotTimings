/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



importScript("../modevlib/aLibrary.js");
importScript("../modevlib/Settings.js");

importScript("../modevlib/MozillaPrograms.js");
importScript("../modevlib/qb/ESQuery.js");
importScript("../modevlib/charts/cccChart.js");
importScript("../modevlib/charts/aColor.js");
importScript("../css/menu.css");
importScript("../modevlib/math/Stats.js");
importScript("../modevlib/qb/qb.js");
importScript("../modevlib/charts/tools.js");


var search = function*(query){

	var source = window.Settings.indexes[query.from];
	if (!source){
		Log.error("{{from}} not found in the lookup table", {"from":query.from})
	}//endif
	query.from=source.table;

	var output = yield (Rest.post({

		url: source.host+"/query",
		//url: "http://52.26.136.54/query",
		//url: "http://localhost:5000/query",
		json: query
	}));

	Array.newInstance(output.edges).forall(function(e){
		e.domain.end=function(p){  // EXPECTING EDGES TO HAVE AN end() FUNCTION
			return p.value;
		};
	});

	yield (output);
};

Settings.host_types["ActiveData"]=search;



function sidebarSlider(){
	var WIDTH = "340px";

	$("body").css("display", "block");

	$('.sidebar_name').click(function(){
		var self = $(this);
		if (self.hasClass("selected")) {
			self.removeClass("selected");
			$("#sidebar").css({"width": "0px"});
			dynamicLayout();
			setTimeout(dynamicLayout, 500);
		} else {
			self.addClass("selected");
			$("#sidebar").css({"width": WIDTH});
			dynamicLayout();
			setTimeout(dynamicLayout, 500);
		}//endif
	});
}


function showTimeline(action, timings){
	var width = 850;
	var colors = aChart.STYLES.select("color");
	var BORDER = 2;
	var HEIGHT = 30;
	var LINE_PADDING = 10;

	var xScale = d3.scaleLinear().domain([action.start_time, action.end_time]).range([20, width - 50]);

	function start(d){
		return xScale(coalesce(Map.get(d, "harness.start_time"), Map.get(d, "builder.start_time")));
	}

	function end(d){
		return xScale(coalesce(Map.get(d, "harness.end_time"), Map.get(d, "builder.end_time")));
	}

	function duration(d){
		return end(d) - start(d);
	}

	function level(d){
		return (Map.get(d, "harness.start_time") ? 1 : 0)
	}

	function yLine(d){
		return LINE_PADDING + (HEIGHT + LINE_PADDING) * level(d);
	}


	var svg = d3.select("#timeline")
		.html(
			new Template('<h3 style="padding-top:10px;display: inline-block;">Timeline</h3> ({{duration|round(3)}} minutes)<br>')
				.expand({"duration": action.duration / 60})
		)
		.append("svg")
		.width(width)
		.height(200)
		;


	var e = svg.selectAll("rect").data(timings).enter();

	e.append("rect") //SHOW BAR
		.x(start)
		.y(yLine)
		.width(duration)
		.height(HEIGHT)
		.fill(function(d, i){
			return colors[i % colors.length];
		})
	;

	e.append("rect")  //SHOW TIME MARKERS
		.x(function(d){
			return start(d) - 0.5;
		})
		.y(function(d){
			return yLine(d) - 5;
		})
		.width(1)
		.height(HEIGHT + 10)
		.fill("black")
	;
	e.append("svg")  //SHOW NAME OF EACH STEP (CLIP TO svg)
		.x(function(d){
			return start(d) + BORDER
		})
		.y(function(d){
			return yLine(d) + BORDER
		})
		.width(function(d){
			return Math.max(0, duration(d) - BORDER - BORDER)
		})
		.height(HEIGHT - BORDER - BORDER)
		.append("text")
		.text(function(d){
			return coalesce(Map.get(d, "harness.step"), d.builder.step);
		})
		.y(HEIGHT - (BORDER * 3))
		.fill('black')
	;

	e.append("g")  //SHOW START TIMES FOR EACH STEP
		.translate(5, -15)
		.rotate(45)
		.translate(
			function(d){
				return start(d) + BORDER
			},
			function(d){
				return yLine(d) + HEIGHT + BORDER
			}
		)
		.append("text")
		.text(function(d){
			if (duration(d) < 20 || level(d) == 0) return "";
			var s = coalesce(Map.get(d, "harness.start_time"), Map.get(d, "builder.start_time"));
			return Duration.newInstance(1000 * (s - action.start_time)).format("HH:mm:ss");
		})
		.y(HEIGHT - (BORDER * 3))
		.fill('black')
	;

	(function(d){
		svg.append("g")  //SHOW end_time
			.translate(5, -15)
			.rotate(45)
			.translate(end(d) + BORDER, LINE_PADDING + HEIGHT + LINE_PADDING + HEIGHT + BORDER)
			.append("text")
			.text(Duration.newInstance(1000 * (action.end_time - action.start_time)).format("HH:mm:ss"))
			.y(HEIGHT - (BORDER * 3))
			.fill('black')
		;


	})(timings.last());


	e.append("rect")//INVISIBLE HOVER CATCHERS (IDENTICAL TO BAR SEGMENTS)
		.x(start)
		.y(yLine)
		.width(duration)		.on("mouseover", function(d){
					return timelineTip
						.style({
							"top": (d3.event.pageY + 10) + "px",
							"left": (d3.event.pageX + 10) + "px",
							"visibility": "visible"
						})
						.html(new Template('{{step}}<br>Duration = {{duration|format("H:mm:ss")}}').expand({
							"step": coalesce(Map.get(d, "harness.step"), Map.get(d, "builder.step")),
							"duration": Duration.newInstance(1000 * coalesce(Map.get(d, "harness.duration"), Map.get(d, "builder.duration")))
						}))
						;
				})
				.on("mousemove", function(d){
					return timelineTip.style({
						"top": (d3.event.pageY + 10) + "px",
						"left": (d3.event.pageX + 10) + "px"
					});
				})
				.on("mouseout", function(d){
					return timelineTip.style("visibility", "hidden");
				})

		.height(HEIGHT)
		.fill("transparent")
	;

}//showTimeline



var timelineTip = d3.select("body").append("div")
	.attr("id", "tip")
	.style({
		"padding": "5px 10px 5px 10px",
		"position": "absolute",
		"visibility": "hidden",
		"background-color": "black",
		"color": "white",
		"font-weight": "bold",
		"align-text": "center"
	})
	.html("")
	;


/**
 * GIVEN A SERIES OF ACCESSORS, AND ASSUMING THEY WILL RESULT IN ARRAYS OF VALUES
 * (BECAUSE THE PATHS MAY BE NESTED), RETURN THE coalesce LIST-WISE
 * Python: zip(coalesce(*zip(*temp)))
 * @param obj - STRUCTURE TO NAVIGATE
 * @param accessors - PATHS, DO NOT GO MORE THAN ONE NESTING DEEP
 * @returns {Array}
 */
function coalesceAll(obj, accessors){
	var temp = accessors.map(function(acc, i){
		return Array.newInstance(Map.get(obj, acc));
	});

	return ZIP(ZIP(temp).map(COALESCE))[0];
}//function


var RESULTSET_BY_REVISION = new Template("https://treeherder.mozilla.org/api/project/{{branch}}/resultset/?format=json&count=1000&full=true&short_revision__in={{revision}}&format=json");
var JOBS_BY_RESULTSET = new Template("https://treeherder.mozilla.org/api/project/{{branch}}/jobs/?count=2000&offset={{offset}}&result_set_id__in={{result_set_id}}&format=json");
var SELECTED_JOB = new Template("https://treeherder.mozilla.org/#/jobs?repo={{branch}}&revision={{revision}}&selectedJob={{jobId}}&exclusion_profile=false&duplicate_jobs=visible&filter-tier=1&filter-tier=2&filter-tier=3");
function openTreeherder(branch, revision, starttime, buildername){
	Thread.run(function*(){
		var a = Log.action("Find TH job", true);
		// GET ALL JOBS
		try{
			var acc = [];
			var url = RESULTSET_BY_REVISION.expand({"branch": branch, "revision":revision.substring(0, 12), "offset":acc.length});
			var resultSets = yield Rest.get({"url":url});
			url = JOBS_BY_RESULTSET.expand({"branch": branch, "result_set_id":resultSets.results[0].id, "offset":acc.length});
			var data = yield Rest.get({"url":url});
			acc.extend(data.results);
			while (data.results.length==2000){
				url = JOBS_BY_RESULTSET.expand({"branch": branch, "result_set_id":resultSets.results[0].id, "offset":acc.length});
				data = yield Rest.get({"url":url});
				acc.extend(data);
			}//while

			acc.forall(function(d){
				if (d.ref_data_name==buildername && Date.newInstance(d.start_timestamp).unix()==starttime){
					window.open(SELECTED_JOB.expand({"branch":branch, "revision":revision, "jobId": d.id}));
				}//endif
			});
		}catch(e){
			Log.action("rev "+revision.substring(0, 12)+" could not be found")
		}finally{
			Log.actionDone(a);
		}//try
	});
}//function
