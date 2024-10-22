
/**
 * @author nick shelton
 */

ForceLayout = function ( scene ) {

	var _this = this;

	this.scene = scene;
	this.loader = new THREE.ImageLoader();
	this.loader.setCrossOrigin(true);
	this.loaded_nodes = 0;
	this.num_nodes = 0;

	this.frame = 0;
	this.dampening = 0.01;
	this.attraction_coeff = 0.001;

	this.repulsion_coeff = 20;
	this.refine_layout = true;
	this.blend_mode = THREE.NormalBlending;

	this.graph = {
		nodes: 	{},
		edges: 	[],
		node_list : []
	}


	// this.palette = [0xFDA273, 0x001AFF, 0x00BFB4, 0x30ba1a];
	this.palette = [ 0x00ffff, 0xffff00, 0xFF00ff, 0xFFFFFF];


	this.genText = function(text, height) {
		var textparam = {
			size : height,
			height: height/10
		}

		var material = new THREE.MeshBasicMaterial({
			opacity: .8,
			transparent: true,
			color: 0x222222
		});

		var geometry = new THREE.TextGeometry(text, textparam);
	    // geometry.computeFaceNormals()
	    // geometry.computeVertexNormals()

		// var material = new THREE.MeshLambertMaterial( {
			// side: THREE.DoubleSide,
			// shading: THREE.SmoothShading,
		 	// color: 0x00ffff
			// wireframe: true
			 // } );

		return new THREE.Mesh(geometry, material);
	}

	this.dec2hex = function(i) {
		return "#" + (i+0x1000000).toString(16).substr(-6).toUpperCase();
	}

	this.makeTextSprite = function( message, id, parameters ) {
		// var fontface = "Courier New";
		var fontface = "Anonymous Pro";

		var fontsize = 50;
		var canvas = document.createElement('canvas');
		// canvas.height *=2
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;

		var metrics = context.measureText(message);
		// context.canvas.width *=2
		// context.canvas.height = fontsize

		// context.fillStyle = "rgba(255., 0., 0., 1.)";

		// context.fillRect(0,0,canvas.width,canvas.height);

		// text color
		// context.fillStyle = this.dec2hex(this.palette[parameters.index]);
		context.fillStyle = " rgba(0, 0, 0, 1.0)";
		context.fillStyle = " rgba(255, 255, 255, 1.0)";
		context.fillText( message, 0, canvas.height/3 * 2);
		context.fillText( id, 0, canvas.height/3);

		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas)
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial(
			{ map: texture, blending: THREE.AdditiveeBlending,
				depthTest : false, transparent : true,
		} );


		var sprite = new THREE.Sprite( spriteMaterial );

		sprite.scale.set(2, 1, 1);
		sprite.position.set(0, -1, 0);
		return sprite;

	}


	this.allLoaded = function() {
		return this.num_nodes == this.loaded_nodes;
	}

	this.pushNodeAsync = function(id, image, label) {
		var that = this;
		this.loader.load(image, function(image) {
			var obj = new THREE.Object3D();

			var material = new THREE.SpriteMaterial( {
			 map: image, color: 0xffffff, fog: true } );
	        var sprite = new THREE.Sprite( material );
			var obj = new THREE.Object3D();
	        obj.add(sprite)
	        obj.position.set(Math.random(), Math.random(), Math.random())

	        that.graph.nodes[id] = obj;
	        that.scene.add( obj );
		    that.loaded_nodes ++;
		});

		this.num_nodes ++;
	};

	this.pushNode = function(id, image, param) {

		var obj = new THREE.Object3D();
		var that = this;

		// THREE.ImageUtils.crossOrigin = true;


		// console.log(a)

		// var cropped = false;

		var thumbImg = document.createElement('img');
		thumbImg.crossOrigin = true;
		var canvas = document.createElement('canvas');
		canvas.width = 128
		canvas.height = 128
		var texture_image = new THREE.Texture(canvas);

		var ctx = canvas.getContext('2d');
		thumbImg.src = image;

		thumbImg.onload = function() {
		    // ctx.save();
		    ctx.beginPath();
		    ctx.arc(
		    	64, 64,
		    	64, 0, Math.PI * 2, true);
		    ctx.closePath();
		    ctx.clip();

		    ctx.drawImage(thumbImg, 0, 0, 128, 128);

		    ctx.strokeStyle = "rgb(250,250,250)"
		    ctx.lineWidth = 10;
		    ctx.arc(
		    	64, 64,
		    	64, 0, Math.PI * 2, true);
		    ctx.stroke();
		    texture_image.needsUpdate = true;
		};



		var material = new THREE.SpriteMaterial( {
			map: texture_image,
			// transparent: true
		} );

        var sprite   = new THREE.Sprite( material );

        obj.add(sprite)
        that.loaded_nodes ++;

        name_sprite = this.makeTextSprite( param.name, id, {index: 0 , fontsize: 30})
        obj.add(name_sprite)

        // var geo = new THREE.SphereGeometry( 0.2, 5, 5 );
        // var sphere = new THREE.Mesh(geo,mat);
        // obj.add(sphere)

        obj.position.set(Math.random(), Math.random(), Math.random());
        // obj.scale.set(2,2,2);

        obj.userData = {degree: 0, label: param.name}
        sprite.userData = {degree: 0, label: param.name, id: id}
        this.graph.nodes[id] = obj;
        this.scene.add(obj);

        this.graph.node_list.push(sprite)

	    this.num_nodes ++;
	    this.loaded_nodes ++;
	};

	this.focus = function (id) {
		var edges = this.graph.edges
		var nodes = this.graph.nodes
		for(i in nodes) {
			nodes[i].scale.set(1,1,1)
		}
		nodes[id].scale.set(3, 3, 3)
		for( var i = 0 ; i < edges.length; i ++) {
			edges[i][2].visible = false;
			if(edges[i][0] == id || edges[i][1] == id)
				edges[i][2].visible = true;
		}
	}

	this.unFocus = function () {
		var nodes = this.graph.nodes
		for(i in nodes) {
			nodes[i].scale.set(1,1,1)
		}
		var edges = this.graph.edges
		for( var i = 0 ; i < edges.length; i ++) {
			edges[i][2].visible = true;
		}
	}

	this.pushEdge = function(a, b, param) {
		if(param.type == "like"){
			var c_index = 0
		}
		else if(param.type == "comment"){
			var c_index = 1
		}
		else if(param.type == "tag"){
			var c_index = 2
		}
		else if(param.type == "message_tag"){
			var c_index = 2
		}
		else if(param.type == "friend"){
			var c_index = 3
		}

		var material = new THREE.LineBasicMaterial( {
			color: this.palette[c_index],
			linewidth: 1,
			blending: THREE.AdditiveBlending,
			// blending: THREE.NormalBlending,
			transparent:true,
			opacity:0.8,
			depthTest:false,
			depthWrite:false,

		} );

		var geometry = new THREE.Geometry();

		for( var i = 0 ; i < 6; i ++)
        	geometry.vertices.push(new THREE.Vector3())

        var l = new THREE.Line(geometry, material);
		function gaussian() {
			return ((Math.random() + Math.random() + Math.random()
				+ Math.random() + Math.random() + Math.random()) - 3) / 3;
		}
        param.bump_pos = Math.random();
        param.bump_length = Math.random()/10;
        param.bump_mag = new THREE.Vector3(Math.random(), Math.random(), Math.random()) ;
        param.bump_mag.multiplyScalar(gaussian())
        param.speed = Math.random()/20;

		this.graph.edges.push([a,b,l,param]);

		// console.log(a)
		// this.graph.nodes[a].userData.degree ++ ;
		// this.graph.nodes[b].userData.degree ++ ;

		this.scene.add(l);
	};


	this.update = function () {
		this.frame ++;
		if ( this.refine_layout ) {
			this.computeNodeRepulsion(this.graph.nodes);
			this.computeEdgeAttraction(this.graph);
			this.updateEdgePositions(this.graph);
		}
	};


	//////////////////////////////////////////////////
	// Helpers for update function - 3 parts

	// N^2 Complexity - TODO use acceleration structure

	this.computeNodeRepulsion = function(nodes) {
		///tmp vectors
		var dir = new THREE.Vector3();
		var force = new THREE.Vector3();

		for(i in nodes) {
			force.set(0, 0, 0);
			// all nodes repel
			for(j in nodes) {
				if ( i != j) {
					dir.subVectors(nodes[i].position, nodes[j].position)

					var weight = this.repulsion_coeff / Math.pow(dir.length(), 2);

					if (isFinite(weight) && dir.length()  < 10) {
						dir.multiplyScalar(weight)
						force.add(dir);
					}
				}
			}
			force.multiplyScalar(this.dampening);
			nodes[i].position.add(force);
		}
	};

	this.computeEdgeAttraction = function(g) {
		var dir = new THREE.Vector3();
		// edges attract
    	for (var j = 0; j < g.edges.length; j++) {
			var a = g.nodes[g.edges[j][0]];
			var b = g.nodes[g.edges[j][1]];

			dir.subVectors(a.position,	b.position);

			var weight =  this.attraction_coeff / Math.pow(dir.length(), 2.0);

			// pull them together!
			if (isFinite(weight) && dir.length() > 2) {
				dir.multiplyScalar(weight);
				a.position.sub(dir);
				b.position.add(dir);
			}
		}
	};


	this.updateEdgePositions = function(g) {

		for (var i = 0; i < g.edges.length; i ++) {
			var param = g.edges[i][3];

			var a = g.nodes[g.edges[i][0]];
			var b = g.nodes[g.edges[i][1]];
			var l = g.edges[i][2];


			var noise = new THREE.Vector3();
			// dir.subVectors(a.position, b.position);

			l.geometry.vertices[0] = a.position;

			l.geometry.vertices[1].lerpVectors(a.position, b.position, param.bump_pos + param.bump_length) ;
			l.geometry.vertices[2].lerpVectors(a.position, b.position, param.bump_pos + param.bump_length).add(param.bump_mag) ;
			l.geometry.vertices[3].lerpVectors(a.position, b.position, param.bump_pos - param.bump_length).add(param.bump_mag) ;
			l.geometry.vertices[4].lerpVectors(a.position, b.position, param.bump_pos - param.bump_length) ;

			param.bump_pos += param.speed/100;
			param.bump_pos %= 1


			l.geometry.vertices[5] = b.position;

			l.geometry.verticesNeedUpdate = true;
		}
	};

	this.updateSizes = function() {
		for(i in this.graph.nodes) {
			var n = this.graph.nodes[i];
			var d = n.userData.degree / 1000 + 1;
			console.log(n.userData.degree)
			n.scale.set(d,d,d)

		}

	};
};