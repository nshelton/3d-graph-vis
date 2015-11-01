
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

	this.repulsion_coeff = 10;
	this.refine_layout = false;
	this.blend_mode = THREE.NormalBlending;

	this.graph = {
		nodes: 	{},
		edges: 	[]
	}


	this.palette = [0x025D8C, 0xFFE500, 0xFF404B];
	// this.palette = [ 0x00ffff, 0xffff00, 0xFF00ff];


	this.genText = function(text, height) {
		var textparam = {
			size : height,
			height: height/10
		}

		var material = new THREE.MeshBasicMaterial({
			opacity: 1.0,
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

	this.makeTextSprite = function( message, parameters ) {
		// var fontface = "Courier New";
		var fontface = "Anonymous Pro";

		var fontsize = 50;
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Bold " + fontsize + "px " + fontface;

		var metrics = context.measureText(message);
		context.canvas.width = metrics.width/2;
		context.canvas.height = fontsize

		context.fillStyle = "rgba(255., 0., 0., 1.)"; 

		context.fillRect(0,0,canvas.width,canvas.height);

		// text color
		// context.fillStyle = this.dec2hex(this.palette[parameters.index]);
		context.fillStyle = " rgba(255, 255, 255, 1.0)"; 
		context.fillText( message, canvas.width/2, canvas.height/2 );

		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial( 
			{ map: texture, blending: THREE.SubtractiveBlending, 
				depthTest : false, transparent : true, 
		} );


		var sprite = new THREE.Sprite( spriteMaterial );
		
		sprite.scale.set(4, 1, 1);
		// sprite.position.set(0, 0, 0);
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

		var a = THREE.ImageUtils.crossOrigin = true;
		var a = THREE.ImageUtils.loadTexture(image);
		var material = new THREE.SpriteMaterial( { map: a } );
        var sprite   = new THREE.Sprite( material );

        obj.add(sprite)
        that.loaded_nodes ++;

        name_sprite = this.makeTextSprite( param.name, {index: 0 , fontsize: 30})

        obj.add(name_sprite)

        // var geo = new THREE.SphereGeometry( 0.2, 5, 5 );
        // var sphere = new THREE.Mesh(geo,mat);
        // obj.add(sphere)

        obj.position.set(Math.random(), Math.random(), Math.random());

        obj.userData = {degree: 0, label: param.name}
        this.graph.nodes[id] = obj;
        this.scene.add(obj);

	    this.num_nodes ++;
	    this.loaded_nodes ++;
	};


	this.pushEdge = function(a, b, param) {
		var material = new THREE.LineBasicMaterial( {
			color: this.palette[param.width%3 || 0], 
			linewidth: param.width * 20 || 5,
			blending: this.blend_mode,
			transparent:true,
			opacity:0.6,
			depthTest:false,
			depthWrite:false,
			side: THREE.DoubleSide,
			
		} );

		var geometry = new THREE.Geometry();

        geometry.vertices.push(new THREE.Vector3())
        geometry.vertices.push(new THREE.Vector3())

        geometry.vertices[0] = this.graph.nodes[a].position;
        geometry.vertices[1] = this.graph.nodes[b].position;

        var l = new THREE.Line(geometry, material);

		this.graph.edges.push([a,b,l,param]);

		this.graph.nodes[a].userData.degree ++ ;
		this.graph.nodes[b].userData.degree ++ ;

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

					if (isFinite(weight) && dir.length()  <10) {
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

			var weight =  this.attraction_coeff; // / Math.pow(dir.length(), 2.0);

			// pull them together!
			if (isFinite(weight)) {
				dir.multiplyScalar(weight);
				a.position.sub(dir);
				b.position.add(dir);
			}
		}
	};

	this.updateEdgePositions = function(g) {
		// now update the edges
		for (var i = 0; i < g.edges.length; i ++) {
			var a = g.nodes[g.edges[i][0]];
			var b = g.nodes[g.edges[i][1]];
			var l = g.edges[i][2];

			var noise = new THREE.Vector3(
				i, i, i)


			l.geometry.vertices[0].copy(a.position)
			// l.geometry.vertices[0].add(noise)

			l.geometry.vertices[1].copy(b.position)
			// l.geometry.vertices[1].add(noise)
			
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
