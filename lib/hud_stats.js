HudStats = function (div_id) {
	
	this.setup = function() {
	}


	this.container = div_id[0];

	this.setup();
	this.genders = {male:0, female:0}

	this.update = function(data) { 
		console.log(data)
		$('#node_total')[0].innerText = data.nodeCount
		$('#comment_total')[0].innerText = data.numComments
		$('#like_total')[0].innerText = data.numLikes
		$('#tag_total')[0].innerText = data.numTags

		$('#most_active')[0].innerText = data.mostActiveNode.id
		$('#most_popular')[0].innerText = data.mostPopularNode.id


	}
	this.plotGender = function() {

		var male = this.genders.male;
		var female = this.genders.female;
		var max_length = 10;

		var max = Math.max(male, female)
		var coeff = max_length / max;

		var male_str = female_str = "";

		for(var i = 0; i < male * coeff; i ++ )
			male_str += '\u2588';

		for(var i = 0; i < female * coeff; i ++ )
			female_str += '\u2588';

		male_str += " " + male
		female_str += " " + female
		$('#male_total')[0].innerText = male_str;
		$('#female_total')[0].innerText = female_str;
	}


}