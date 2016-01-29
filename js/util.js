/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



importScript("../modevlib/aLibrary.js");
importScript("../modevlib/Settings.js");

importScript("../modevlib/MozillaPrograms.js");
importScript("../modevlib/qb/ESQuery.js");
importScript("../modevlib/charts/cccChart.js");
importScript("../modevlib/charts/aColor.js");
importScript([
	"../css/menu.css"
]);
importScript("../modevlib/math/Stats.js");
importScript("../modevlib/qb/Qb.js");


var search = function*(query){

	var source = window.Settings.indexes[query.from];
	if (!source){
		Log.error("{{from}} not found in the lookup table", {"from":query.from})
	}//endif
	query.from=source.table;

	var output = yield (Rest.post({
		url: source.host+"/query",
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
		} else {
			self.addClass("selected");
			$("#sidebar").css({"width": WIDTH});
			dynamicLayout();
		}//endif
	});
}

