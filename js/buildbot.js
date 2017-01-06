/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function* get_bb_times(){
	var BAR_HEIGHT = 30;
	var BAR_SPACING = "20%";
	var CHART_PADDING = 50;

	var CHART_MULTIPLE=1.0;
	if (BAR_SPACING.right(1) == "%") {
		CHART_MULTIPLE = 1 + convert.String2Integer(BAR_SPACING.leftBut(1)) / 100;
	} else if (BAR_SPACING.right(2) == "px") {
		CHART_MULTIPLE = 1 + convert.String2Integer(BAR_SPACING.leftBut(2)) / BAR_HEIGHT;
	}//endif


	var beginPastWeek = Date.today().add("-week");

	var mainFilter = {
		"and": [
			{
				"eq": {
					"action.buildbot_status": "success"
				}
			},
			{"in": {"build.branch": ["try"]}}
		]
	};

	//SUMMARY OF BUILD TIMES SINCE beginPastWeek
	var build_averages = null;
	var test_averages = null;

	var build_thread = Thread.run("build times", function*(){
		var a = Log.action("Get Buildbot build times", true);

		var query = {
			"from": "jobs",
			"select": [
				{"aggregate": "count"},
				{
					"name": "wait_time",
//TODO: use the repo.push.date??  What to do with retriggers?
					"value": {"sub": ["action.start_time", "action.request_time"]},
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "duration",
					"value": "action.duration",
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "end_time",
					"value": {"sub": ["action.end_time", "action.request_time"]},
					"aggregate": "percentile", "percentile": 0.50
				}
			],
			"edges": [
				{
					"name": "Platform",
					"allowNulls": false,
					"domain": Mozilla.Builds.BB_Platform.getActiveDataDomain()
				},
				{
					"name": "Type",
					"allowNulls": false,
					"domain": Mozilla.Builds.Type.getActiveDataDomain()
				}
			],
			"where": {
				"and": [
					{"eq": {"action.type": "build"}},
					mainFilter,
					{"gt": {"action.start_time": beginPastWeek.unix()}}
				]
			},
			"limit": 1000
		};

		try {
			build_averages = yield (search(query));
		} catch (e) {
			Log.error("problem with call to ActiveData", e)
		} finally {
			Log.actionDone(a);
		}//try
	});


	var tests_thread = Thread.run("test times", function*(){
		var a = Log.action("Get Builbot test times", true);

		var query = {
			"from": "jobs",
			"select": [
				{"aggregate": "count"},
				{
					"name": "wait_time",
					"value": {"sub": ["action.start_time", "action.request_time"]},
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "duration",
					"value": "action.duration",
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "end_time",
					"value": {"sub": ["action.end_time", "action.request_time"]},
					"aggregate": "percentile", "percentile": 0.50
				}
			],
			"edges": [
				{
					"name": "Platform",
					"allowNulls": false,
					"domain": Mozilla.Builds.BB_Platform.getActiveDataDomain()
				},
				{
					"name": "Type",
					"allowNulls": false,
					"domain": Mozilla.Builds.Type.getActiveDataDomain()
				},
				{
					"name": "suite",
					"value": "run.suite"
				}
			],
			"where": {
				"and": [
					{"eq": {"action.type": "test"}},
					mainFilter,
					{"gt": {"action.start_time": beginPastWeek.unix()}}
				]
			},
			"limit": 1000
		};

		try {
			test_averages = yield (search(query));
		} catch (e) {
			Log.error("problem with call to ActiveData", e)
		} finally {
			Log.actionDone(a);
		}//try
	});

	yield Thread.join(build_thread);
	yield Thread.join(tests_thread);

	var timings = post_processing(build_averages,test_averages);

    var all_actions = timings.all_actions;
	var build_actions = timings.build_actions;

	$("#bb_chart").height(build_actions.length * BAR_HEIGHT * CHART_MULTIPLE+ CHART_PADDING);

	var chart = gantt({
		"target": "bb_chart",
		"data": all_actions,
		"style": {"height": build_actions.length * BAR_HEIGHT* CHART_MULTIPLE+ CHART_PADDING},
		"axis": {
			"x": {
				"label": "Time",
				"format": "hh:mm:ss"
			},
			"y": {
				"type": "set",
				"label": "Step",
				"domain": {"partitions": build_actions}
			}
		},
		"series": [
			{
				"name": "Build Wait Time",
				"label": "wait",
				"type": "gantt",
				"style": {
					"color": "#7f7f7f",
					"opacity": 0.3,
				},
				"select": [
					{"name": "x", "range": {"min": "build_request_time", "max": "build_start_time"}},
					{"name": "y", "value": "index"}
				],
				"tip": {
					"format": 'Build Wait Time<br>Duration = {{build_wait_time|format("H:mm:ss")}}<br>Count = {{build_count}}'
				},
				"click": function(data){
					showBuildDetails(data, true);
				}
			},
			{
				"name": "Build Duration",
				"label": "{{build_name}}",
				"type": "gantt",
				"select": [
					{"name": "x", "range": {"min": "build_start_time", "max": "build_end_time"}},
					{"name": "y", "value": "index"}
				],
				"tip": {
					"format": '{{build_name}}<br>Duration = {{build_duration|format("H:mm:ss")}}<br>Count = {{build_count}}'
				},
				"click": function(data){
					showBuildDetails(data, false);
				}
			},
			{
				"name": "Test Duration",
				"label": "{{test_name}}",
				"type": "gantt",
				"select": [
					{"name": "x", "range": {"min": "test_start_time", "max": "test_end_time"}},
					{"name": "y", "value": "index"}
				],
				"tip": {
					"format": '{{test_name}}<br>Duration = {{test_duration|format("H:mm:ss")}}<br>Count = {{test_count}}'
				},
				"click": function(data){
					showTestDetails(data, false);
				}
			},
			{
				"name": "Test Wait Time",
				"label": "wait",
				"type": "gantt",
				"style": {
					"color": "#7f7f7f",
					"opacity": 0.3
				},
				"select": [
					{"name": "x", "range": {"min": "test_request_time", "max": {"add": ["test_request_time", "test_wait_time"]}}},
					{"name": "y", "value": "index"}
				],
				"tip": {
					"format": 'Test Wait Time<br>Duration = {{test_wait_time|format("H:mm:ss")}}<br>Count = {{test_count}}'
				},
				"click": function(data){
					showTestDetails(data, true);
				}
			},
		],
		"tip": {
			"format": '{{name}}<br>Duration = {{duration|format("minute")}}',
			"style": {
				"padding": "5px 10px 5px 10px",
				"position": "absolute",
				"visibility": "hidden",
				"background-color": "black",
				"color": "white",
				"font-weight": "bold",
				"align-text": "center"
			}
		},
		"click": showTests
	});

	function showTests(data){
		// CHEAT BY MANIPULATING THE DOMAIN TO SHOW MORE, OR LESS
		var old_domain = chart.axis.y.domain._scale.domain();

		var domain = build_actions;
		domain = qb.sort(Array.UNION([domain, data.tests.select("index")]), ".");
		if (domain.subtract(old_domain).length == 0) domain = build_actions;
		chart.axis.y.domain._scale.domain(domain);
		chart.style.height = domain.length * BAR_HEIGHT* CHART_MULTIPLE+ CHART_PADDING;
		dynamicLayout();
	}

	function showTestDetails(data, showWaitTime){
		//EXPANDED?
		if (data.tests) {
			//CLICKED ON BUILD LINE, ARE WE EXPANDING? OR ARE WE DRILLING?
			var old_domain = chart.axis.y.domain._scale.domain();
			var new_domain = qb.sort(Array.UNION([build_actions, data.tests.select("index")]), ".");
			if (new_domain.subtract(old_domain).length != 0) {
				showTests(data);
				return;
			}//endif
		}//endif

		var param = {
			"sampleMin": beginPastWeek.format("yyyy-MM-dd"),
			"sampleMax": Date.today().format("yyyy-MM-dd"),
			"showWaitTime": showWaitTime,
			"test": data.test_name,
			"product": "Firefox",
			"type": data.build.platform.type,
			"platform": data.build.platform.name,
			"branch": "Try"
		};
		var params = convert.Map2URLParam(param);
		var url = "Buildbot-Tests-Detail.html#" + params;
		window.open(url);
	}

	function showBuildDetails(data, showWaitTime){
		//EXPANDED?
		if (data.tests) {
			//CLICKED ON BUILD LINE, ARE WE EXPANDING? OR ARE WE DRILLING?
			var old_domain = chart.axis.y.domain._scale.domain();
			var new_domain = qb.sort(Array.UNION([build_actions, data.tests.select("index")]), ".");
			if (new_domain.subtract(old_domain).length != 0) {
				showTests(data);
				return;
			}//endif
		}//endif

		var param = {
			"sampleMin": beginPastWeek.format("yyyy-MM-dd"),
			"sampleMax": Date.today().format("yyyy-MM-dd"),
			"showWaitTime": showWaitTime,
			"product": "Firefox",
			"type": data.platform.type,
			"platform": data.platform.name,
			"branch": "Try"
		};
		var params = convert.Map2URLParam(param);
		var url = "Buildbot-Builds-Detail.html#" + params;
		window.open(url);
	}


}


function post_processing(build_averages,test_averages){
	var HIDE_POPULATIONS_LESS_THAN=30;


//SHOW THE (MAX) END-TO-END TIMES BY PLATFORM
	var build_counts = new Matrix({"data": build_averages.data.count});
	var build_wait_times = new Matrix({"data": build_averages.data.wait_time});
	var build_durations = new Matrix({"data": build_averages.data.duration});
	var build_end_times = new Matrix({"data": build_averages.data.end_time});
	var test_counts = new Matrix({"data": test_averages.data.count});
	var test_wait_times = new Matrix({"data": test_averages.data.wait_time});
	var test_durations = new Matrix({"data": test_averages.data.duration});
	var test_end_times = new Matrix({"data": test_averages.data.end_time});

	var actions = [];
	build_durations.forall(function(build_duration, c){
		var build_count = build_counts.get(c);
		var build_wait_time = build_wait_times.get(c);
		var build_end_time = build_end_times.get(c);
		var total = build_wait_time + build_duration;
		var platform = build_averages.edges[0].domain.partitions[c[0]];
		var type = build_averages.edges[1].domain.partitions[c[1]];
		var buildName = platform.name + (type.name ? " (" + type.name + ")" : "");

		var build_details = {
			"platform": {"name": platform.name, "type": type.name},
			"build_name": buildName,
			"build_count": build_count,
			"build_request_time": 0,
			"build_start_time": build_end_time - build_duration,
			"build_wait_time": build_wait_time,
			"build_end_time": build_end_time,
			"build_duration": build_duration,
			"tests": []
		};

		build_details.tests = test_averages
			.edges[2]
			.domain
			.partitions
			.mapExists(function(part, i){
				var tc = [c[0], c[1], i];

				var count = test_counts.get(tc);
				if (count<HIDE_POPULATIONS_LESS_THAN) return;

				var test_duration = test_durations.get(tc);
				if (test_duration == null) return;
				var test_wait_time = test_wait_times.get(tc);
				var test_end_time = test_end_times.get(tc);
				var total = test_wait_time + test_duration;

				return {
					"test_name": get_test_name(part),
					"test_count": test_counts.get(tc),
					"test_request_time": build_end_time,
					"test_wait_time": test_wait_time,
					"test_start_time": build_end_time + test_end_time - test_duration,
					"test_end_time": build_end_time + test_end_time,
					"test_duration": test_duration,
					"build": {"platform": build_details.platform}
				};
			})
			.orderBy({"test_end_time": "desc"})
		;
		build_details.tests.forall(function(t, i){
			t.index = i;
		});

		var longTest = coalesce(build_details.tests[0], {});
		build_details.test_end_time = coalesce(longTest.test_end_time, build_details.build_end_time);
		actions.append(build_details);
	});
	actions = actions.filter({"gt": {"test_end_time": 0}}).orderBy({"test_end_time": "desc"});

	Log.note(convert.value2json(actions));

//        var actions = getAllActions();

	var all_actions = [];
	var build_actions = [];  //Index for all builds
	var test_actions = {};   //index all tests for all builds
	actions.forall(function(b){
		var bi = all_actions.length;
		all_actions.append(b);
		b.index = bi;
		build_actions.append(bi);
		test_actions[bi] = [];
		b.tests.forall(function(t, ti){
			if (ti == 0) {
				Map.setDefault(b, t);  // MERGE WITH THE BUILD RECORD
			} else {
				var ai = all_actions.length;
        all_actions.append(t);
        test_actions[bi].append(ai);
        t.index = ai;
      }
    });
  });
  return {"all_actions":all_actions, "build_actions":build_actions};
}

function get_test_name(part){
	if (part.name) return part.name;  //BUILDBOT NAMES

	//TC NAMES
	if (!Array.isArray(part.value)) return part.value;
	if (part.value.length==1) return part.value[0];
	if (part.value[1]==null) return part.value[0];
	if (part.value[1].startsWith(part.value[0])) return part.value[1];
	return part.value.join("-");
}
