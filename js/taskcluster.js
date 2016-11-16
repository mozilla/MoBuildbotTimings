/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("buildbot.js");


function* get_tc_times(){
	var BAR_HEIGHT = 30;
	var BAR_SPACING = "20%";
	var END_TIME_FIELD = "task.action.end_time";


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
				"or": [
					{"missing": "build.product"},
					{"eq": {"build.product": "firefox"}}
				]
			},
			{
				"or": [
					{"missing": "build.type"},
					{"in": {"build.type": ["pgo", "debug"]}}
				]
			},
			{"in": {"build.branch": ["try"]}}
		]
	};

	//SUMMARY OF BUILD TIMES SINCE beginPastWeek
	var build_averages = null;
	var test_averages = null;

	var build_thread = Thread.run("build times", function*(){
		var a = Log.action("Get TaskCluster build times", true);

		var query = {
			"from": "task",
			"select": [
				{"aggregate": "count"},
				{
					"name": "wait_time",
					"value": {"sub": ["task.run.start_time", "task.run.scheduled"]},
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "duration",
					"value": {"sub": [END_TIME_FIELD, "task.run.start_time"]},
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "end_time",
					"value": {"sub": [END_TIME_FIELD, "task.run.scheduled"]},
					"aggregate": "percentile", "percentile": 0.50
				}
			],
			"edges": [
				{
					"name": "Platform",
					"allowNulls": false,
					"domain": Mozilla.Builds.Platform.getActiveDataDomain()
				},
				{
					"name": "Type",
					"allowNulls": false,
					"domain": Mozilla.Builds.Type.getActiveDataDomain()
				}
			],
			"where": {
				"and": [
					{"missing": "run.suite.name"},
					mainFilter,
					{"gt": {"task.run.start_time": beginPastWeek.unix()}}
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
		var a = Log.action("Get TaskCluster test times", true);

		var query = {
			"from": "task",
			"select": [
				{"aggregate": "count"},

				{
					"name": "wait_time",
					"value": {"sub": ["task.run.start_time", "task.run.scheduled"]},
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "duration",
					"value": {"sub": [END_TIME_FIELD, "task.run.start_time"]},
					"aggregate": "percentile", "percentile": 0.50
				},
				{
					"name": "end_time",
					"value": {"sub": [END_TIME_FIELD, "task.run.scheduled"]},
					"aggregate": "percentile", "percentile": 0.50
				}
			],
			"edges": [
				{
					"name": "Platform",
					"allowNulls": false,
					"domain": Mozilla.Builds.Platform.getActiveDataDomain()
				},
				{
					"name": "Type",
					"allowNulls": false,
					"domain": Mozilla.Builds.Type.getActiveDataDomain()
				},
				{
					"name": "suite",
					"allowNulls": false,
					"domain": Mozilla.Builds.TC_Test.getActiveDataDomain()
				}
			],
			"where": {
				"and": [
					{"exists": "run.suite.name"},
					mainFilter,
					{"gt": {"task.run.scheduled": beginPastWeek.unix()}}
				]
			},
			"limit": 10000
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

	$("#tc_chart").height(build_actions.length * BAR_HEIGHT* CHART_MULTIPLE);

	var chart = gantt({
		"target": "tc_chart",
		"data": all_actions,
		"style": {"height": build_actions.length * BAR_HEIGHT* CHART_MULTIPLE},
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
					"style": {"bar-spacing": BAR_SPACING}
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
		chart.style.height = domain.length * BAR_HEIGHT* CHART_MULTIPLE;
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
		var url = "Taskcluster-Tests-Detail.html#" + params;
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
		var url = "Taskcluster-Builds-Detail.html#" + params;
		window.open(url);
	}

}
