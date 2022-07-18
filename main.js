const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();


var channels = new Map();

var PREFIX = "$";
var REGEX_START = 		/\$start/i
var REGEX_END = 		/\$end/i
var REGEX_NEXT = 		/\$next/i
var REGEX_SORT = 		/\$sort/i
var REGEX_SPEED = 		/\$speed\((([a-zA-Z0-9]*?),\s?)?([-]?\d*?)\)/gi
var REGEX_INITIATVE = 	/\$init\((([a-zA-Z0-9]*?),\s?)?(\d*?)\)/gi
var REGEX_SET = 		/\$set\((([a-zA-Z0-9]*?),\s?)?(\d*?)\)/gi
var REGEX_REMOVE = 		/\$remove\(([a-zA-Z0-9]+)\)/gi


function compareNumbers(a, b) {
  return a - b;
}

client.on("ready", () => {
    console.log("Time for battle!");
});

client.on("message", (message) => {
	
	// prevent botception
	if(message.author.bot) return;
    
	var num = Math.random();

	if(message.content.includes("get_days")) {
		var date1 = new Date("10/09/2017");
		var date2 = new Date();
		var timeDiff = date2.getTime() - date1.getTime();
		var diffDays = Math.floor(timeDiff / (1000 * 3600 * 24)); 
		message.channel.send("It has been " + diffDays + " days since the start of the game. You should have " + diffDays*3 + " training experience");
	}
	
	if(!message.content.includes(PREFIX)) return;
	var channel = channels.get(message.channel);

	var author = message.guild.members.get(message.author.id).nickname;
	if (author == null) {
		author = message.author.username;
	}
	var next = false;
    	
	if (message.content.match(REGEX_START)) {
		ic = 0;
		message.channel.send("Ready and reporting for duty!");
		message.channel.send(
			"Use $init(x) or $init(name, x) to add to the initative" +
			"\nUse $sort once everone has been added to initiatve to sort the order" +
			"\nUse $remove(name) to remove someone from iniative" +
			"\nUse $end to stop and use $start to restart");
		users = new Map();
		channel = new Map();
		channel.set("users", users);
		channel.set("ic", 0);
		channels.set(message.channel, channel);
	}

	if (channel == undefined) {
		console.log(message.channel + " is not being listened to");
		return;
	}
	var users = channel.get("users");
	var ic = channel.get("ic");
	
	if (message.content.match(REGEX_INITIATVE)) {
		
		// get the value of the initiative
		var init = REGEX_INITIATVE.exec(message.content);
		if (init[2] != undefined) {
			author = init[2];
		}
		init = ic + Number(init[3]);

		// delete any existing user
		users.delete(author);

		// set up the new user
		var uMap = new Map();
		uMap.set("init", init);
		users.set(author, uMap);
	
		// Huzzar
		message.channel.send(author + " added to initiative at IC " + init);
	}
	
	if (message.content.match(REGEX_SORT)) {
		var init = 0;
		users.forEach(function(value, author, map) {
			var aInit = value.get("init");
			if (aInit > init) {
				init = aInit;
			}
		});
		users.forEach(function(value, author, map) {
			var newInit = init - value.get("init");
			value.set("init", newInit);
		});
    	message.channel.send(
			"\nUse $speed(x) or $speed(name, x) to advance your IC (x can be -ve)" +
			"\nUse $set(x) or $(name, x) to set your IC" +
			"\nUse $next to get a summary of the turn");
		next = true;
	}
	
	if (message.content.match(REGEX_SPEED)){
		// get the value of the speed
		var speed = REGEX_SPEED.exec(message.content);
		if (speed[2] != undefined) {
			author = speed[2];
		}
		
		// grab the user and ignore users that don't exist
		var uMap = users.get(author);
		if (uMap == undefined) return;
		var init = uMap.get("init");
		speed = init + Number(speed[3]);

		if (typeof(uMap.get("init")) != 'number') return;	

		// update the users speed
		uMap.set("init", speed);
		if (ic > speed) {
			ic = speed;
			message.channel.send("IC set back to " + ic + ". Recalculating IC");
		}

		
		// Huzzar
		next = true;
	}
	
	if (message.content.match(REGEX_SET)){
		// get the value of the set
		var set = REGEX_SET.exec(message.content);
		if (set[2] != undefined) {
			author = set[2];
		}
		
		// grab the user and ignore users that don't exist
		var uMap = users.get(author);
		if (uMap == undefined) return;
		var init = uMap.get("init");
		set = Number(set[3]);

		if (typeof(uMap.get("init")) != 'number') return;	

		// update the users set
		uMap.set("init", set);
		if (ic > set) {
			ic = set;
			message.channel.send("IC set back to " + ic + ". Recalculating IC");
		}
		// Huzzar
		next = true;
	}
	
	if (message.content.match(REGEX_NEXT) || next) {
		var nextMap = new Map();
		var nextArray = [];
		users.forEach(function(value, author, map) {
			var init = value.get("init");

			if (typeof(value.get("init")) == 'number') {
				// set up for the first init
				if (nextArray.indexOf(init) === -1)	{
					nextArray.push(init);
					nextMap.set(init, []);
				}
				// add to the array
				nextMap.get(init).push(author);
			}
		});

		var first = true;
		var more = false;
		var msg = "";
		nextArray.sort(compareNumbers);
		nextArray.forEach(function(element) {
			var thisIc = nextMap.get(element);
			if (first === true) {
				var count = ic;
				while (count <= element) {
					if (count > 0 && count%20 == 0) {
						msg += "IC " + count + " has happened\n";
					}
					count++;
				}
				first = false;
				if (thisIc.length == 1) {
					msg += "**IC(" + element + "): " + thisIc + "'s turn!**\n";
				} else if (thisIc.length > 1) {
					msg += "**IC(" + element + "):" + thisIc + " go simultaneously**\n";
				}
				ic = element;
				msg += "After: "
			} else {
				more = true;
				msg += " *(" + element + ")" + thisIc + "*";
			}
		});
		message.channel.send(msg);
		next = false;
	}
	
	if(message.content.match(REGEX_REMOVE)) {
		var dead = REGEX_REMOVE.exec(message.content);
		dead = dead[1];
		if (users.has(dead)) {
			users.delete(dead);
			message.channel.send(dead + " removed from initiative");
		} else {
			message.channel.send(dead + " not found")
		}
	}
	
	channel.set("ic", ic);
	
	if (message.content.match(REGEX_END)) {
		channels.delete(message.channel);
		message.channel.send("Initiative Cleared");
	}
	
});


client.login(config.token);