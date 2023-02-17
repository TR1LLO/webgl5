
"use strict";

//________________________________________________________________________
//---------------TEXTURES-------------------------------------------------
var im1, im2, im3, im4;
const _tx = new Uint8Array([0, 0, 255, 255]);

function loadtexture(src)
{
	const tx = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tx);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
		gl.RGBA, gl.UNSIGNED_BYTE, _tx);

	const im = new Image();
	im.crossOrigin="anonymous";
	im.onload = function potat(){
		gl.bindTexture(gl.TEXTURE_2D, tx);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	};
	im.src=src;
	return tx;
}
function textureinit()
{
	im1=loadtexture("spark.png");
	im2=loadtexture("fog2.png");
	im3=loadtexture("fog4.png");
	im4=loadtexture("dot.png");
}

//________________________________________________________________________
//---------------PROGRAMS-------------------------------------------------

function initProgram(vssrc, fssrc, name)
{
	const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vssrc);
    gl.compileShader(vs);
	
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fssrc);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
	
    return {
		name: name, prog: prog,
		vposloc: gl.getAttribLocation(prog, '_pos'),
		vcolloc: gl.getAttribLocation(prog, '_col'),
		vtxyloc: gl.getAttribLocation(prog, '_txy'),
		
		projloc: gl.getUniformLocation(prog, 'proj'),
		m4ptloc: gl.getUniformLocation(prog, 'm4pt'),
		colrloc: gl.getUniformLocation(prog, 'colr'),
		
		_tx1loc: gl.getUniformLocation(prog, '_tx1'),
    };
}

//-----------program--1----------------
{
	var info_1;
	
	var vssrc_1 = 
	`#version 300 es

	in vec4 _pos;

	uniform mat4 proj;

	void main() {
		vec4 p = proj * _pos;
		
		gl_Position = p;

		gl_PointSize = 32.0f;
	}
	`;

	var fssrc_1 = 
	`#version 300 es
	precision mediump float;

	uniform vec4 colr;
	uniform sampler2D _tx1;

	out vec4 _col;

	void main() {
		_col=texture(_tx1, gl_PointCoord);
		_col.r*=colr.r;
		_col.g*=colr.g;
		_col.b*=colr.b;
	}
	`;
}
//-----------program--2----------------
{
	var info_2;
	
	var vssrc_2 = 
	`#version 300 es

	in vec4 _pos;
	in vec4 _col;
	out vec4 col;

	uniform mat4 proj;

	void main() {
		vec4 p = proj * _pos;
		gl_Position = p;
		col=_col;
	}
	`;

	var fssrc_2 = 
	`#version 300 es
	precision mediump float;

	uniform vec4 colr;

	in vec4 col;
	out vec4 _col;

	void main() {
		_col=col;
		_col.r*=colr.r;
		_col.g*=colr.g;
		_col.b*=colr.b;
	}
	`;
}
//-----------program--3----------------
{
	var info_3;
	
	var vssrc_3 = 
	`#version 300 es

	in vec4 _pos;
	in vec2 _txy;
	out vec2 txy;

	uniform mat4 proj;
	uniform mat4 m4pt;

	void main() {
		vec4 p = proj * m4pt * _pos;
		gl_Position = p;
		txy=_txy;
	}
	`;

	var fssrc_3 = 
	`#version 300 es
	precision mediump float;

	uniform vec4 colr;
	uniform sampler2D _tx1;

	in vec2 txy;
	out vec4 _col;

	void main() {
		_col=texture(_tx1, txy);
		_col.r*=colr.r;
		_col.g*=colr.g;
		_col.b*=colr.b;
	}
	`;
}
//-----------program--4----------------
{
	var info_4;
	
	var vssrc_4 = 
	`#version 300 es

	in vec4 _pos;
	in vec4 _col;
	out vec4 col;


	uniform mat4 proj;

	void main() {
		vec4 p = proj * _pos;
		
		gl_Position = p;
		gl_PointSize = 256.0f*_col.a;
		col=_col;
	}
	`;

	var fssrc_4 = 
	`#version 300 es
	precision mediump float;

	uniform sampler2D _tx1;

	in vec4 col;
	out vec4 _col;

	void main() {
		float a=texture(_tx1, gl_PointCoord).a;
		_col.r=col.r*a;
		_col.g=col.g*a;
		_col.b=col.b*a;
		_col.a=col.a;
	}
	`;
}

//_____________________________________________________________________
//---------------MAIN--------------------------------------------------

var canv, gl, h1;
window.onload = function main() 
{
	h1 = document.querySelector("#oof");
	canv = document.querySelector("#canvas1");
	gl = canv.getContext("webgl2", {alpha: false});

	h1.textContent = "оно взорвалось";

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    
	info_1=initProgram(vssrc_1, fssrc_1, "test");
	info_2=initProgram(vssrc_2, fssrc_2, "test");
	info_3=initProgram(vssrc_3, fssrc_3, "test");
	info_4=initProgram(vssrc_4, fssrc_4, "test");


	textureinit();
	spaceinit();    

	update();
}

//_________________________________________________________________________
//---------------CONTROLS--------------------------------------------------

function switcheff(i)
{
	effs.forEach((e)=>{e.active=false;});
	effs[i].active=true;
}
window.onkeydown=(e)=>
{
	if(e.code=="Space") effs.forEach((e)=>{if(e.active) e.reset();});

	if(e.code=="Digit1") switcheff(0);
	if(e.code=="Digit2") switcheff(1);
	if(e.code=="Digit3") switcheff(2);
	if(e.code=="Digit4") switcheff(3);
	if(e.code=="Digit5") switcheff(4);
}

//_____________________________________________________________________
//---------------SPACE-------------------------------------------------
const effs=[];
function dist(v, p0)
{
	const x=v[0]-p0[0];
	const y=v[1]-p0[1];
	const z=v[2]-p0[2];
	return Math.sqrt(x*x+y*y+z*z);
}

class eff
{
	constructor(info, tx)
	{
		this.info=info;
		this.active=true;
		this.tx=tx;
		this.colr=[1, 1, 1, 1];
		this.cent=[0, 0, 0, 1];
		this.complete=false;

		this.pos=[];
		this.posbuf=gl.createBuffer();
		this.trcbuf=gl.createBuffer();
	}
	render()
	{
		const info=this.info;
		//----------------attribs---------------
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.vertexAttribPointer(info.vposloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vposloc);


		gl.useProgram(info.prog);
		//----------------uniforms--------------
		gl.uniformMatrix4fv(info.projloc, false, proj);
		gl.uniform4fv(info.colrloc, this.colr);
		
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tx);
		gl.uniform1i(info._tx1loc, 0);


		gl.drawArrays(gl.POINTS, 0, this.pos.length*4);
	}
	update()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.pos.flat(2)), gl.STATIC_DRAW);
	}
	reset()
	{
	}
}
class sparkles extends eff
{
	constructor()
	{
		super(info_1, im1);

		this.vel=[];
		this.col=[];
		for(var i=0; i<128; i++)
		{
			this.pos.push([0, 0, 0, 1]);
			this.col.push([0, 0, 0, 1]);
			this.col.push([0, 0, 0, 0]);
			this.vel.push(0, 0, 0);
		}

		this.colbuf=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.col.flat(2)), gl.STATIC_DRAW);
	}
	update()
	{
		const t=[];
		for(var i=0; i<this.pos.length; i++)
		{
			const p=this.pos[i];
			const v=this.vel[i];
			p[0]+=v[0];
			p[1]+=v[1];
			p[2]+=v[2];
			t.push(p, this.cent);
			if(dist(p, this.cent)>proj[15]) this.sparkreset(i);
		}
		super.update();

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.col.flat(2)), gl.STATIC_DRAW);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trcbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t.flat(2)), gl.STATIC_DRAW);
	}
	trace()
	{
		const info=info_2;
		//----------------attribs---------------
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trcbuf);
		gl.vertexAttribPointer(info.vposloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vposloc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.vertexAttribPointer(info.vcolloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vcolloc);


		gl.useProgram(info.prog);
		//----------------uniforms--------------
		gl.uniformMatrix4fv(info.projloc, false, proj);
		gl.uniform4fv(info.colrloc, this.colr);


		gl.drawArrays(gl.LINES, 0, this.pos.length*2);
	}
	render()
	{
		this.trace();
		super.render();
	}

	sparkreset(i)
	{
		const spd=0.1;
		this.pos[i]=[this.cent[0], this.cent[1], this.cent[2], 1];
		const x=(-1+Math.random()*2)*spd;
		const y=(-1+Math.random()*2)*spd;
		const z=(-1+Math.random()*2)*spd;
		this.vel[i]=[x, y, z];

		const r=(1+Math.random())*0.5;
		const g=(1+Math.random())*0.5;
		const b=(1+Math.random())*0.5;
		this.col[i*2]=[r, g, b, 1];
	}
	reset()
	{
		super.reset();
		for(var i=0; i<this.pos.length; i++)
			this.sparkreset(i);
	}
}
class firework extends sparkles
{
	constructor()
	{
		super();
	}
	update()
	{
		const t=[];
		this.complete=true;
		for(var i=0; i<this.pos.length; i++)
		{
			const p=this.pos[i];
			const v=this.vel[i];
			p[0]+=v[0];
			p[1]+=v[1];
			p[2]+=v[2];
			t.push(p, this.cent);
			if(dist(p, this.cent)<proj[15])
				this.complete=false;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.pos.flat(2)), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.col.flat(2)), gl.STATIC_DRAW);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.trcbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t.flat(2)), gl.STATIC_DRAW);
	}
}
class fog extends eff
{
	constructor()
	{
		super(info_3, im3);

		this.m4pts=[];
		this.rotzs=[];
		for(var i=0; i<6; i++)
		{
			const m=mat4.create();
			m[15]=0.5;
			this.m4pts.push(m);
			const r=mat4.create();
			this.rotzs.push(r);
		}
		
		const p00=[-1, -1, 0, 1];
		const p01=[-1, +1, 0, 1];
		const p10=[+1, -1, 0, 1];
		const p11=[+1, +1, 0, 1];
		this.pos=[
			p00, p01, p10,
			p01, p10, p11,
		].flat(2);

		const t00=[0, 0];
		const t01=[0, 1];
		const t10=[1, 0];
		const t11=[1, 1];
		this.txy=[
			t00, t01, t10,
			t01, t10, t11,
		].flat(2);

		this.txybuf=gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.txybuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.txy), gl.STATIC_DRAW);
	}
	
	cloudrender(m4pt)
	{
		const info=this.info;
		//----------------attribs---------------
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.vertexAttribPointer(info.vposloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vposloc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.txybuf);
		gl.vertexAttribPointer(info.vtxyloc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vtxyloc);


		gl.useProgram(info.prog);
		//----------------uniforms--------------
		gl.uniformMatrix4fv(info.projloc, false, proj);
		gl.uniformMatrix4fv(info.m4ptloc, false, m4pt);
		gl.uniform4fv(info.colrloc, this.colr);

		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tx);
		gl.uniform1i(info._tx1loc, 0);

		gl.drawArrays(gl.TRIANGLES, 0, this.pos.length*4);
	}
	render()
	{
		this.m4pts.forEach((e)=>{this.cloudrender(e)});
	}
	update()
	{
		super.update();
		for(var i=0; i<this.m4pts.length; i++)
		{
			const m=this.m4pts[i];
			mat4.multiply(m, m, this.rotzs[i]);
		}
	}
	reset()
	{
		super.reset();
		for(var i=0; i<this.m4pts.length; i++)
		{
			const s=1;
			const x=(-1+Math.random()*2)*s;
			const y=(-1+Math.random()*2)*s/2;
			const z=(-1+Math.random()*2)*s;
			const m=this.m4pts[i];
			m[12]=x; m[13]=y; m[14]=z;

			const r=this.rotzs[i];
			mat4.identity(r);
			mat4.rotateZ(r, r, Math.random()*0.005);
		}
	}
}
class oof extends eff
{
	constructor()
	{
		super(info_4, im4);

		this.col=[];
		this.rot=[];
		for(var i=0; i<64; i++)
		{
			this.pos.push([0, 0, 0, 1]);
			this.col.push([0, 0, 0, 1]);
			this.rot.push([0, 0, 0]);
		}

		this.colbuf=gl.createBuffer();
	}
	update()
	{
		for(var i=0; i<this.rot.length; i++)
		{
			const rot=this.rot[i];
			const cx=Math.cos(rot[0]), sx=Math.sin(rot[0]);
			const cy=Math.cos(rot[1]), sy=Math.sin(rot[1]);
			const cz=Math.cos(rot[2]), sz=Math.sin(rot[2]);
		
			var x1, y1, z1;
			var x0=this.pos[i][0];
			var y0=this.pos[i][1];
			var z0=this.pos[i][2];

			x1=x0*cz-y0*sz;
			y1=x0*sz+y0*cz;
			z1=z0;
	
			x0=x1*cy-z1*sy;
			y0=y1;
			z0=x1*sy+z1*cy;
	
			x0=x1;
			y0=y1*cx-z1*sx;
			z0=y1*sx+z1*cx;

			this.pos[i][0]=x0;
			this.pos[i][1]=y0;
			this.pos[i][2]=z0;
		}
		super.update();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.col.flat(2)), gl.STATIC_DRAW);
	}
	render()
	{
		const info=this.info;
		//----------------attribs---------------
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.vertexAttribPointer(info.vposloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vposloc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.vertexAttribPointer(info.vcolloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vcolloc);


		gl.useProgram(info.prog);
		//----------------uniforms--------------
		gl.uniformMatrix4fv(info.projloc, false, proj);
		gl.uniform4fv(info.colrloc, this.colr);
		
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tx);
		gl.uniform1i(info._tx1loc, 0);


		gl.drawArrays(gl.POINTS, 0, this.pos.length);
	}

	sparkreset(i)
	{
		const rad=2;
		const x=(-1+Math.random()*2)*rad/proj[0];
		const y=(-1+Math.random()*2)*rad/proj[5];
		const z=(-1+Math.random()*2)*rad;
		this.pos[i]=[x, y, z, 1];

		const r=(1+Math.random())*0.5;
		const g=(1+Math.random())*0.5;
		const b=(1+Math.random())*0.5;
		this.col[i]=[r, g, b, 1];

		const spd=0.1;
		const rx=(-1+Math.random()*2)*spd;
		const ry=(-1+Math.random()*2)*spd;
		const rz=(-1+Math.random()*2)*spd;
		this.rot[i]=[rx, ry, rz];
	}
	reset()
	{
		super.reset();
		for(var i=0; i<this.pos.length; i++)
			this.sparkreset(i);
	}
}
class oof2 extends eff
{
	constructor()
	{
		super(info_4, im4);

		this.col=[];
		this.alp=[];
		this.dalp=[];
		for(var i=0; i<64; i++)
		{
			this.pos.push([0, 0, 0, 1]);
			this.col.push([0, 0, 0, 1]);
			this.alp.push([1, 0]);
			this.dalp.push([1, 0]);
		}

		this.colbuf=gl.createBuffer();
	}
	update()
	{
		for(var i=0; i<this.alp.length; i++)
		{
			const x=this.alp[i][0];
			const y=this.alp[i][1];
			const c=this.dalp[i][0];
			const s=this.dalp[i][1];
			
			this.alp[i][0]=x*c-y*s;
			this.alp[i][1]=x*s+y*c;

			const a=(1+this.alp[i][0])*0.5;
			this.col[i][3]=a;
		}
		super.update();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.col.flat(2)), gl.STATIC_DRAW);
	}
	render()
	{
		const info=this.info;
		//----------------attribs---------------
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.vertexAttribPointer(info.vposloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vposloc);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.colbuf);
		gl.vertexAttribPointer(info.vcolloc, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vcolloc);


		gl.useProgram(info.prog);
		//----------------uniforms--------------
		gl.uniformMatrix4fv(info.projloc, false, proj);
		gl.uniform4fv(info.colrloc, this.colr);
		
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tx);
		gl.uniform1i(info._tx1loc, 0);


		gl.drawArrays(gl.POINTS, 0, this.pos.length);
	}

	sparkreset(i)
	{
		const rad=2;
		const x=(-1+Math.random()*2)*rad/proj[0];
		const y=(-1+Math.random()*2)*rad/proj[5];
		const z=(-1+Math.random()*2)*rad;
		this.pos[i]=[x, y, z, 1];

		const r=(1+Math.random())*0.5;
		const g=(1+Math.random())*0.5;
		const b=(1+Math.random())*0.5;
		this.col[i]=[r, g, b, 1];

		const freq=0.1;
		const ph=(-1+Math.random()*2)*freq;
		const c=Math.cos(ph);
		const s=Math.sin(ph);
		this.dalp[i]=[c, s];
		this.alp[i]=[1, 0];
	}
	reset()
	{
		super.reset();
		for(var i=0; i<this.pos.length; i++)
			this.sparkreset(i);
	}
}

class megafirework extends eff
{
	constructor()
	{
		super(null, null);
		this.f=[];
		for(var i=0; i<6; i++)
			this.f.push(new firework());
	}
	update()
	{
		for(var i=0; i<this.f.length; i++)
		{
			const f0=this.f[i];
			f0.update();
			if(f0.complete)
				this.resetfirework(f0);
		}
	}
	render()
	{
		this.f.forEach((e)=>{e.render()});
	}
	resetfirework(f)
	{
		f.cent[0]=this.cent[0]+(-1+Math.random()*2)/proj[0];
		f.cent[1]=this.cent[1]+(-1+Math.random()*2)/proj[5];
		f.cent[2]=0;
		f.reset();
	}
	reset()
	{
		this.f.forEach((f)=>{this.resetfirework(f)});
	}
}

function update()
{
	effs.forEach((e)=>{if(e.active) e.update()});
	drawScene();
	requestAnimationFrame(update);
}

var proj = mat4.create();
function basisinit()
{
	const scale=600;
	proj[0]=scale/canv.width;
	proj[5]=scale/canv.height;
	proj[15]=2;
}

function spaceinit()
{
	basisinit();

	const e1=new sparkles();
	effs.push(e1); e1.reset();

	const e2=new megafirework();
	effs.push(e2); e2.reset();

	const e3=new fog();
	effs.push(e3); e3.reset();

	const e4=new oof();
	effs.push(e4); e4.reset();

	const e5=new oof2();
	effs.push(e5); e5.reset();
	switcheff(1);
}


//_______________________________________________________________________
//---------------RENDER--------------------------------------------------

function drawScene() 
{
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	effs.forEach((e)=>{if(e.active) e.render()});
}