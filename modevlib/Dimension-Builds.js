/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("Dimension.js");

if (!Mozilla) var Mozilla={"name":"Mozilla", "edges":[]};

Dimension.addEdges(false,  Mozilla, [
	{"name":"Builds", "index":"jobs", "edges":[
		{
			"name":"Type",
			"field": "build.type",
			"partitions":[
				{"name":"pgo", "ordering":1, "style":{"color":"#f9cb9c"}, "value":"pgo", "esfilter":{"term":{"build.type":"pgo"}}},
				{"name":"debug", "ordering":2, "style":{"color":"#f6b26b"}, "value":"debug", "esfilter":{"term":{"build.type":"debug"}}},
				{"name":"leak test", "ordering":3, "style":{"color":"#f6b26b"}, "value":"leak test", "esfilter":{"term":{"build.type":"leak test"}}},
				{"name":"static analysis", "ordering":4, "style":{"color":"#f6b26b"}, "value":"static analysis", "esfilter":{"term":{"build.type":"static analysis"}}},
				{"name":"asan", "ordering":5, "style":{"color":"#f6b26b"}, "value":"asan", "esfilter":{"term":{"build.type":"asan"}}},
				{"name":"Standard", "value": null, "ordering":0}
			]
		},
		{
			"name":"Platform",
			"field":"build.platform",
			"partitions":[
				{"name":"Linux32", "style":{"color":"#de4815"}, "value":"linux32", "esfilter":{"term":{"browser.platform":"linux32"}}},
				{"name":"Linux64", "style":{"color":"#de4815"}, "value":"linux64", "esfilter":{"term":{"browser.platform":"linux64"}}},
				{"name":"OSX64", "style":{"color":"#a4c739"}, "value":"macosx64", "esfilter":{"term":{"browser.platform":"macosx64"}}},
				{"name":"Windows32", "style":{"color":"#136bab"}, "value":"win32", "esfilter":{"term":{"browser.platform":"win32"}}},
				{"name":"Windows64", "style":{"color":"#136bab"}, "value":"win64", "esfilter":{"term":{"browser.platform":"win64"}}}
			]
		}
	]}
]);


